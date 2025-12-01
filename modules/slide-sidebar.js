/**
 * SLIDE SIDEBAR MODULE
 *
 * Purpose: Hamburger menu with slide navigation
 * Contract: Render sidebar with slide titles and handle navigation
 * Dependencies: slide-titles.js, navigation.js, state-manager.js
 */

import { SLIDE_TITLES } from './slide-titles.js';

export class SlideSidebar {
  /**
   * Initialize slide sidebar
   * @param {NavigationController} navigationController - Navigation controller
   * @param {StateManager} stateManager - State manager
   */
  constructor(navigationController, stateManager) {
    if (!navigationController || !stateManager) {
      throw new Error('NavigationController and StateManager are required');
    }

    this.navigationController = navigationController;
    this.stateManager = stateManager;
    this.isOpen = false;
    this.hideTimeout = null;

    this.elements = {
      hamburger: null,
      sidebar: null,
      overlay: null
    };

    console.log('[SlideSidebar] Initialized');
  }

  /**
   * Render sidebar and hamburger button
   */
  render() {
    console.log('[SlideSidebar] Rendering sidebar');

    // Create hamburger button
    const hamburger = document.createElement('button');
    hamburger.id = 'hamburger-button';
    hamburger.className = 'hamburger-button';
    hamburger.setAttribute('aria-label', 'Open slide menu');
    hamburger.innerHTML = `
      <div class="hamburger-icon">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;

    // Create sidebar
    const sidebar = document.createElement('div');
    sidebar.id = 'slide-sidebar';
    sidebar.className = 'slide-sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <h3>Slides</h3>
      </div>
      <div class="sidebar-content">
        <ul class="slide-list">
          ${this._generateSlideList()}
        </ul>
      </div>
    `;

    // Create overlay (optional, for closing on outside click)
    const overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';

    // Append to body
    document.body.appendChild(hamburger);
    document.body.appendChild(sidebar);
    document.body.appendChild(overlay);

    this.elements.hamburger = hamburger;
    this.elements.sidebar = sidebar;
    this.elements.overlay = overlay;

    this._attachEventListeners();
    this._updateActiveSlide();

    console.log('[SlideSidebar] Sidebar rendered');
  }

  /**
   * Generate HTML for slide list
   * @private
   */
  _generateSlideList() {
    return SLIDE_TITLES.map(slide => `
      <li class="slide-item" data-page="${slide.page}">
        <button class="slide-link">
          <span class="slide-number">${slide.page}</span>
          <span class="slide-title">${slide.title}</span>
        </button>
      </li>
    `).join('');
  }

  /**
   * Toggle sidebar open/close
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open sidebar
   */
  open() {
    console.log('[SlideSidebar] Opening sidebar');
    this.isOpen = true;
    this.elements.sidebar.classList.add('open');
    this.elements.overlay.classList.add('visible');
    this.elements.hamburger.setAttribute('aria-expanded', 'true');

    // Clear any pending hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Close sidebar
   */
  close() {
    console.log('[SlideSidebar] Closing sidebar');
    this.isOpen = false;
    this.elements.sidebar.classList.remove('open');
    this.elements.overlay.classList.remove('visible');
    this.elements.hamburger.setAttribute('aria-expanded', 'false');
  }

  /**
   * Update active slide highlight
   */
  _updateActiveSlide() {
    const currentPage = this.stateManager.getCurrentPage();

    // Remove previous active
    const previousActive = this.elements.sidebar.querySelector('.slide-item.active');
    if (previousActive) {
      previousActive.classList.remove('active');
    }

    // Add active to current
    const currentItem = this.elements.sidebar.querySelector(`[data-page="${currentPage}"]`);
    if (currentItem) {
      currentItem.classList.add('active');

      // Scroll active item into view if sidebar is open
      if (this.isOpen) {
        currentItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  /**
   * Attach event listeners
   * @private
   */
  _attachEventListeners() {
    // Hamburger click
    this.elements.hamburger.addEventListener('click', () => {
      this.toggle();
    });

    // Overlay click to close
    this.elements.overlay.addEventListener('click', () => {
      this.close();
    });

    // Slide item clicks
    const slideItems = this.elements.sidebar.querySelectorAll('.slide-link');
    slideItems.forEach(button => {
      button.addEventListener('click', (e) => {
        const pageNum = parseInt(button.closest('.slide-item').dataset.page);
        console.log(`[SlideSidebar] Navigating to slide ${pageNum}`);
        this.navigationController.goToPage(pageNum);
        this.close();
      });
    });

    // Mouse leave - auto-hide after delay
    this.elements.sidebar.addEventListener('mouseleave', () => {
      if (this.isOpen) {
        console.log('[SlideSidebar] Mouse left sidebar, scheduling hide');
        this.hideTimeout = setTimeout(() => {
          this.close();
        }, 500); // 500ms delay
      }
    });

    // Mouse enter - cancel auto-hide
    this.elements.sidebar.addEventListener('mouseenter', () => {
      if (this.hideTimeout) {
        console.log('[SlideSidebar] Mouse entered sidebar, canceling hide');
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    });

    // Listen for page changes to update active slide
    this.stateManager.addEventListener('pageChanged', () => {
      this._updateActiveSlide();
    });
  }

  /**
   * Clean up
   */
  destroy() {
    console.log('[SlideSidebar] Destroying sidebar');

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    if (this.elements.hamburger) {
      this.elements.hamburger.remove();
    }
    if (this.elements.sidebar) {
      this.elements.sidebar.remove();
    }
    if (this.elements.overlay) {
      this.elements.overlay.remove();
    }
  }
}
