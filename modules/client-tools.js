/**
 * CLIENT TOOLS MODULE
 *
 * Purpose: Register client tools for ElevenLabs widget
 * Contract: Expose tools in the format ElevenLabs widget expects
 * Dependencies: navigation.js
 */

/**
 * Initialize client tools stubs immediately (before widget loads)
 * These will be enhanced once navigation is ready
 */
export function initClientToolsStubs() {
  console.log('[ClientTools] Initializing client tools stubs (for early widget discovery)');

  window.clientTools = {
    nextPage: async () => ({ success: false, message: 'Navigation not ready yet' }),
    previousPage: async () => ({ success: false, message: 'Navigation not ready yet' }),
    goToPage: async () => ({ success: false, message: 'Navigation not ready yet' }),
    getCurrentPage: async () => ({ success: false, message: 'Navigation not ready yet' }),
    getTotalPages: async () => ({ success: false, message: 'Navigation not ready yet' }),
    getPageText: async () => ({ success: false, message: 'Navigation not ready yet' })
  };

  console.log('[ClientTools] ✅ Stubs registered:', Object.keys(window.clientTools));
}

/**
 * Enhance client tools with actual navigation controller
 * @param {NavigationController} navigationController - Navigation controller instance
 */
export function registerClientTools(navigationController) {
  console.log('[ClientTools] Enhancing client tools with navigation controller');

  // Replace stubs with real implementations
  window.clientTools = {
    // Navigate to next page
    nextPage: async () => {
      console.log('[ClientTools] nextPage called by ElevenLabs');
      const success = navigationController.nextPage();
      const current = navigationController.getCurrentPage();
      const total = navigationController.getTotalPages();

      if (success) {
        return {
          success: true,
          message: `Moved to page ${current} of ${total}`,
          currentPage: current,
          totalPages: total
        };
      } else {
        return {
          success: false,
          message: `Already on last page (${total})`,
          currentPage: current,
          totalPages: total
        };
      }
    },

    // Navigate to previous page
    previousPage: async () => {
      console.log('[ClientTools] previousPage called by ElevenLabs');
      const success = navigationController.previousPage();
      const current = navigationController.getCurrentPage();
      const total = navigationController.getTotalPages();

      if (success) {
        return {
          success: true,
          message: `Moved to page ${current} of ${total}`,
          currentPage: current,
          totalPages: total
        };
      } else {
        return {
          success: false,
          message: `Already on first page`,
          currentPage: current,
          totalPages: total
        };
      }
    },

    // Jump to specific page
    goToPage: async (params) => {
      console.log('[ClientTools] goToPage called by ElevenLabs with params:', params);

      // Handle both object parameter {pageNumber: X} and direct number
      const pageNum = typeof params === 'object' ? params.pageNumber : params;
      const pageNumber = parseInt(pageNum);
      const total = navigationController.getTotalPages();

      if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > total) {
        return {
          success: false,
          message: `Invalid page number. Must be between 1 and ${total}`,
          currentPage: navigationController.getCurrentPage(),
          totalPages: total
        };
      }

      const success = navigationController.goToPage(pageNumber);

      if (success) {
        return {
          success: true,
          message: `Jumped to page ${pageNumber} of ${total}`,
          currentPage: pageNumber,
          totalPages: total
        };
      } else {
        return {
          success: false,
          message: `Failed to navigate to page ${pageNumber}`,
          currentPage: navigationController.getCurrentPage(),
          totalPages: total
        };
      }
    },

    // Get current page number
    getCurrentPage: async () => {
      console.log('[ClientTools] getCurrentPage called by ElevenLabs');
      const current = navigationController.getCurrentPage();
      const total = navigationController.getTotalPages();

      return {
        success: true,
        currentPage: current,
        totalPages: total,
        message: `Currently on page ${current} of ${total}`
      };
    },

    // Get total number of pages
    getTotalPages: async () => {
      console.log('[ClientTools] getTotalPages called by ElevenLabs');
      const total = navigationController.getTotalPages();

      return {
        success: true,
        totalPages: total,
        message: `Presentation has ${total} pages`
      };
    },

    // Get text content of current page
    getPageText: async () => {
      console.log('[ClientTools] getPageText called by ElevenLabs');
      const current = navigationController.getCurrentPage();

      try {
        const text = await navigationController.getPageText();

        return {
          success: true,
          pageNumber: current,
          text: text,
          message: `Retrieved text from page ${current}`,
          characterCount: text.length
        };
      } catch (error) {
        console.error('[ClientTools] Failed to get page text:', error);
        return {
          success: false,
          message: `Failed to retrieve text from page ${current}`,
          error: error.message
        };
      }
    }
  };

  console.log('[ClientTools] ✅ Tools registered:', Object.keys(window.clientTools));
  console.log('[ClientTools] ElevenLabs widget can now discover and use these tools');
}

/**
 * Cleanup client tools
 */
export function cleanupClientTools() {
  if (window.clientTools) {
    delete window.clientTools;
    console.log('[ClientTools] Client tools cleaned up');
  }
}
