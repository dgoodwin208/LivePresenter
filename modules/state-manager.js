/**
 * STATE MANAGER MODULE
 *
 * Purpose: Single source of truth for presentation state
 * Contract: Manages current page number and provides event system
 * Dependencies: None
 */

export class StateManager {
  /**
   * Initialize state manager with total page count
   * @param {number} totalPages - Total number of pages in PDF
   */
  constructor(totalPages) {
    if (!totalPages || totalPages < 1) {
      throw new Error('totalPages must be a positive number');
    }

    this._totalPages = totalPages;
    this._currentPage = 1;
    this._listeners = new Map();

    console.log(`[StateManager] Initialized with ${totalPages} pages`);
  }

  /**
   * Get current page number (1-indexed)
   * @returns {number} Current page number
   */
  getCurrentPage() {
    return this._currentPage;
  }

  /**
   * Get total number of pages
   * @returns {number} Total pages
   */
  getTotalPages() {
    return this._totalPages;
  }

  /**
   * Set current page number
   * @param {number} pageNum - Page number to set (1-indexed)
   * @returns {boolean} True if valid and changed, false otherwise
   */
  setCurrentPage(pageNum) {
    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > this._totalPages) {
      console.warn(`[StateManager] Invalid page number: ${pageNum}`);
      return false;
    }

    if (pageNum === this._currentPage) {
      return false;
    }

    const previousPage = this._currentPage;
    this._currentPage = pageNum;

    console.log(`[StateManager] Page changed: ${previousPage} → ${pageNum}`);

    this._emit('pageChanged', {
      currentPage: this._currentPage,
      previousPage: previousPage,
      totalPages: this._totalPages
    });

    return true;
  }

  /**
   * Check if can navigate to next page
   * @returns {boolean} True if next page exists
   */
  canGoNext() {
    return this._currentPage < this._totalPages;
  }

  /**
   * Check if can navigate to previous page
   * @returns {boolean} True if previous page exists
   */
  canGoPrevious() {
    return this._currentPage > 1;
  }

  /**
   * Add event listener
   * @param {string} eventType - Event type (e.g., 'pageChanged')
   * @param {Function} callback - Callback function
   */
  addEventListener(eventType, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, new Set());
    }

    this._listeners.get(eventType).add(callback);
    console.log(`[StateManager] Added listener for '${eventType}'`);
  }

  /**
   * Remove event listener
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback function to remove
   */
  removeEventListener(eventType, callback) {
    const listeners = this._listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
      console.log(`[StateManager] Removed listener for '${eventType}'`);
    }
  }

  /**
   * Emit event to all listeners
   * @private
   * @param {string} eventType - Event type
   * @param {*} data - Event data
   */
  _emit(eventType, data) {
    const listeners = this._listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[StateManager] Error in event listener:`, error);
        }
      });
    }
  }
}
