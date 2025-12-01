/**
 * PDF RENDERER MODULE
 *
 * Purpose: Load PDF and render specific pages using PDF.js
 * Contract: Handles all PDF.js interactions and canvas rendering
 * Dependencies: PDF.js (loaded from CDN)
 */

export class PDFRenderer {
  /**
   * Initialize PDF renderer with canvas container
   * @param {HTMLElement} containerElement - Element to contain the canvas
   */
  constructor(containerElement) {
    if (!containerElement) {
      throw new Error('Container element is required');
    }

    this.container = containerElement;
    this.pdfDocument = null;
    this.canvas = null;
    this.context = null;
    this.linkLayer = null;
    this.navigationCallback = null;

    console.log('[PDFRenderer] Initialized');
  }

  /**
   * Set navigation callback for internal PDF links
   * @param {Function} callback - Function to call when link is clicked (receives page number)
   */
  setNavigationCallback(callback) {
    this.navigationCallback = callback;
    console.log('[PDFRenderer] Navigation callback set');
  }

  /**
   * Load PDF from path
   * @param {string} pdfPath - Path to PDF file
   * @returns {Promise<{totalPages: number}>} PDF metadata
   */
  async loadPDF(pdfPath) {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library not loaded');
    }

    console.log(`[PDFRenderer] Loading PDF: ${pdfPath}`);

    try {
      const loadingTask = window.pdfjsLib.getDocument(pdfPath);
      this.pdfDocument = await loadingTask.promise;

      console.log(`[PDFRenderer] PDF loaded: ${this.pdfDocument.numPages} pages`);

      this._setupCanvas();

      return {
        totalPages: this.pdfDocument.numPages
      };
    } catch (error) {
      console.error('[PDFRenderer] Failed to load PDF:', error);
      throw new Error(`Failed to load PDF: ${error.message}`);
    }
  }

  /**
   * Render specific page to canvas
   * @param {number} pageNumber - Page number to render (1-indexed)
   * @returns {Promise<void>}
   */
  async renderPage(pageNumber) {
    if (!this.pdfDocument) {
      throw new Error('PDF not loaded');
    }

    if (pageNumber < 1 || pageNumber > this.pdfDocument.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    console.log(`[PDFRenderer] Rendering page ${pageNumber}`);

    try {
      const page = await this.pdfDocument.getPage(pageNumber);

      // Get device pixel ratio for high-DPI displays (Retina, etc.)
      const pixelRatio = window.devicePixelRatio || 1;

      // Calculate base scale and multiply by pixel ratio for sharp rendering
      const baseScale = this._calculateScale(page);
      const viewport = page.getViewport({ scale: baseScale * pixelRatio });

      // Set canvas intrinsic size (actual pixel dimensions)
      // This ensures high-res rendering on Retina displays
      this.canvas.width = viewport.width;
      this.canvas.height = viewport.height;

      // Set canvas display width, let height auto-scale to maintain aspect ratio
      this.canvas.style.width = `${viewport.width / pixelRatio}px`;
      // Don't set height - CSS 'height: auto' will maintain aspect ratio

      const renderContext = {
        canvasContext: this.context,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // Render clickable links
      await this._renderLinks(page, viewport, pixelRatio);

      console.log(`[PDFRenderer] Page ${pageNumber} rendered at ${pixelRatio}x resolution`);
    } catch (error) {
      console.error(`[PDFRenderer] Failed to render page ${pageNumber}:`, error);
      throw new Error(`Failed to render page: ${error.message}`);
    }
  }

  /**
   * Render clickable link overlays for a page
   * @private
   */
  async _renderLinks(page, viewport, pixelRatio) {
    // Clear existing links
    if (this.linkLayer) {
      this.linkLayer.innerHTML = '';
    }

    try {
      const annotations = await page.getAnnotations();
      const links = annotations.filter(ann => ann.subtype === 'Link');

      if (links.length === 0) {
        console.log('[PDFRenderer] No links found on this page');
        return;
      }

      console.log(`[PDFRenderer] Found ${links.length} links on page`);

      links.forEach(link => {
        // Only handle internal links (destinations within PDF)
        if (link.dest) {
          this._createLinkElement(link, viewport, pixelRatio);
        }
      });
    } catch (error) {
      console.error('[PDFRenderer] Error rendering links:', error);
    }
  }

  /**
   * Create clickable element for a link annotation
   * @private
   */
  _createLinkElement(link, viewport, pixelRatio) {
    if (!this.linkLayer) {
      return;
    }

    // Get link rectangle coordinates
    const rect = link.rect;
    const [x1, y1, x2, y2] = rect;

    // Transform coordinates to viewport space
    const topLeft = viewport.convertToViewportPoint(x1, y2);
    const bottomRight = viewport.convertToViewportPoint(x2, y1);

    // Account for device pixel ratio
    const left = topLeft[0] / pixelRatio;
    const top = topLeft[1] / pixelRatio;
    const width = (bottomRight[0] - topLeft[0]) / pixelRatio;
    const height = (bottomRight[1] - topLeft[1]) / pixelRatio;

    // Create clickable div
    const linkElement = document.createElement('a');
    linkElement.className = 'pdf-link';
    linkElement.style.position = 'absolute';
    linkElement.style.left = `${left}px`;
    linkElement.style.top = `${top}px`;
    linkElement.style.width = `${width}px`;
    linkElement.style.height = `${height}px`;
    linkElement.style.cursor = 'pointer';

    // Handle click
    linkElement.addEventListener('click', async (e) => {
      e.preventDefault();
      await this._handleLinkClick(link);
    });

    this.linkLayer.appendChild(linkElement);
  }

  /**
   * Handle click on a PDF link
   * @private
   */
  async _handleLinkClick(link) {
    if (!this.navigationCallback) {
      console.warn('[PDFRenderer] No navigation callback set');
      return;
    }

    try {
      // Get destination page from link
      let dest = link.dest;
      if (typeof dest === 'string') {
        dest = await this.pdfDocument.getDestination(dest);
      }

      if (!dest) {
        console.warn('[PDFRenderer] Could not resolve link destination');
        return;
      }

      // Get page reference from destination
      const pageRef = dest[0];
      const pageIndex = await this.pdfDocument.getPageIndex(pageRef);
      const targetPage = pageIndex + 1; // Convert to 1-indexed

      console.log(`[PDFRenderer] Link clicked: navigating to page ${targetPage}`);
      this.navigationCallback(targetPage);
    } catch (error) {
      console.error('[PDFRenderer] Error handling link click:', error);
    }
  }

  /**
   * Extract text content from specific page
   * @param {number} pageNumber - Page number (1-indexed)
   * @returns {Promise<string>} Page text content
   */
  async getPageText(pageNumber) {
    if (!this.pdfDocument) {
      throw new Error('PDF not loaded');
    }

    if (pageNumber < 1 || pageNumber > this.pdfDocument.numPages) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    try {
      const page = await this.pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();

      const text = textContent.items
        .map(item => item.str)
        .join(' ')
        .trim();

      console.log(`[PDFRenderer] Extracted ${text.length} characters from page ${pageNumber}`);

      return text;
    } catch (error) {
      console.error(`[PDFRenderer] Failed to extract text from page ${pageNumber}:`, error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    console.log('[PDFRenderer] Cleaning up');

    if (this.pdfDocument) {
      this.pdfDocument.destroy();
      this.pdfDocument = null;
    }

    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.context = null;
    }
  }

  /**
   * Setup canvas element and link overlay
   * @private
   */
  _setupCanvas() {
    // Clear container
    this.container.innerHTML = '';

    // Create wrapper to position canvas and links together
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'pdf-canvas';
    this.context = this.canvas.getContext('2d');

    // Create link layer overlay
    this.linkLayer = document.createElement('div');
    this.linkLayer.id = 'pdf-link-layer';
    this.linkLayer.style.position = 'absolute';
    this.linkLayer.style.top = '0';
    this.linkLayer.style.left = '0';
    this.linkLayer.style.width = '100%';
    this.linkLayer.style.height = '100%';
    this.linkLayer.style.pointerEvents = 'none';

    // Append to wrapper
    wrapper.appendChild(this.canvas);
    wrapper.appendChild(this.linkLayer);

    // Append wrapper to container
    this.container.appendChild(wrapper);

    console.log('[PDFRenderer] Canvas and link layer created and mounted');
  }

  /**
   * Calculate optimal scale for page rendering
   * @private
   * @param {*} page - PDF.js page object
   * @returns {number} Scale factor
   */
  _calculateScale(page) {
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;

    const viewport = page.getViewport({ scale: 1 });

    const widthScale = containerWidth / viewport.width;
    const heightScale = containerHeight / viewport.height;

    const scale = Math.min(widthScale, heightScale) * 0.95;

    console.log(`[PDFRenderer] Calculated scale: ${scale.toFixed(2)}`);

    return scale;
  }
}
