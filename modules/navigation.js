/**
 * NAVIGATION CONTROLLER MODULE
 *
 * Purpose: Handle page navigation logic
 * Contract: Coordinates state management and PDF rendering
 * Dependencies: state-manager.js, pdf-renderer.js
 */

export class NavigationController {
  /**
   * Initialize navigation controller
   * @param {StateManager} stateManager - State manager instance
   * @param {PDFRenderer} pdfRenderer - PDF renderer instance
   */
  constructor(stateManager, pdfRenderer) {
    if (!stateManager || !pdfRenderer) {
      throw new Error('StateManager and PDFRenderer are required');
    }

    this.stateManager = stateManager;
    this.pdfRenderer = pdfRenderer;

    this._setupStateListener();

    console.log('[NavigationController] Initialized');
  }

  /**
   * Navigate to next page
   * @returns {boolean} True if navigation successful
   */
  nextPage() {
    if (!this.stateManager.canGoNext()) {
      console.log('[NavigationController] Cannot go to next page');
      return false;
    }

    const nextPageNum = this.stateManager.getCurrentPage() + 1;
    return this.goToPage(nextPageNum);
  }

  /**
   * Navigate to previous page
   * @returns {boolean} True if navigation successful
   */
  previousPage() {
    if (!this.stateManager.canGoPrevious()) {
      console.log('[NavigationController] Cannot go to previous page');
      return false;
    }

    const prevPageNum = this.stateManager.getCurrentPage() - 1;
    return this.goToPage(prevPageNum);
  }

  /**
   * Jump to specific page
   * @param {number} pageNum - Page number (1-indexed)
   * @returns {boolean} True if navigation successful
   */
  goToPage(pageNum) {
    console.log(`[NavigationController] Navigating to page ${pageNum}`);

    const changed = this.stateManager.setCurrentPage(pageNum);

    if (!changed) {
      return false;
    }

    return true;
  }

  /**
   * Get current page number
   * @returns {number} Current page (1-indexed)
   */
  getCurrentPage() {
    return this.stateManager.getCurrentPage();
  }

  /**
   * Get total number of pages
   * @returns {number} Total pages
   */
  getTotalPages() {
    return this.stateManager.getTotalPages();
  }

  /**
   * Get text content of current page
   * @returns {Promise<string>} Page text
   */
  async getPageText() {
    const currentPage = this.stateManager.getCurrentPage();
    return await this.pdfRenderer.getPageText(currentPage);
  }

  /**
   * Setup listener for state changes to trigger rendering
   * @private
   */
  _setupStateListener() {
    this.stateManager.addEventListener('pageChanged', async (data) => {
      console.log('[NavigationController] State changed, rendering page:', data.currentPage);

      try {
        await this.pdfRenderer.renderPage(data.currentPage);
      } catch (error) {
        console.error('[NavigationController] Failed to render page:', error);
      }
    });
  }
}
