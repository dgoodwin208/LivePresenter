/**
 * API CONTROLLER MODULE
 *
 * Purpose: Expose window.pdfController API for ElevenLabs agent
 * Contract: Mount public API on window object for external access
 * Dependencies: navigation.js
 */

export class APIController {
  /**
   * Initialize API controller
   * @param {NavigationController} navigationController - Navigation controller instance
   */
  constructor(navigationController) {
    if (!navigationController) {
      throw new Error('NavigationController is required');
    }

    this.navigationController = navigationController;
    this.exposed = false;

    console.log('[APIController] Initialized');
  }

  /**
   * Expose API on window.pdfController
   */
  expose() {
    if (this.exposed) {
      console.warn('[APIController] API already exposed');
      return;
    }

    window.pdfController = {
      /**
       * Get current page number
       * @returns {number} Current page (1-indexed)
       */
      getCurrentPage: () => {
        console.log('[API] getCurrentPage called');
        return this.navigationController.getCurrentPage();
      },

      /**
       * Get total number of pages
       * @returns {number} Total pages
       */
      getTotalPages: () => {
        console.log('[API] getTotalPages called');
        return this.navigationController.getTotalPages();
      },

      /**
       * Navigate to next page
       * @returns {boolean} True if successful
       */
      nextPage: () => {
        console.log('[API] nextPage called');
        return this.navigationController.nextPage();
      },

      /**
       * Navigate to previous page
       * @returns {boolean} True if successful
       */
      previousPage: () => {
        console.log('[API] previousPage called');
        return this.navigationController.previousPage();
      },

      /**
       * Jump to specific page
       * @param {number} pageNum - Page number (1-indexed)
       * @returns {boolean} True if successful
       */
      goToPage: (pageNum) => {
        console.log(`[API] goToPage called with page: ${pageNum}`);
        return this.navigationController.goToPage(pageNum);
      },

      /**
       * Get text content of current page
       * @returns {Promise<string>} Page text
       */
      getPageText: async () => {
        console.log('[API] getPageText called');
        return await this.navigationController.getPageText();
      }
    };

    this.exposed = true;

    console.log('[APIController] API exposed on window.pdfController');
    console.log('[APIController] Available methods:', Object.keys(window.pdfController));
  }

  /**
   * Remove API from window
   */
  cleanup() {
    if (window.pdfController) {
      delete window.pdfController;
      this.exposed = false;
      console.log('[APIController] API cleaned up');
    }
  }
}
