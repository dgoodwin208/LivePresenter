/**
 * UI CONTROLS MODULE
 *
 * Purpose: Render and handle UI navigation controls
 * Contract: Create and manage navigation UI elements
 * Dependencies: navigation.js, state-manager.js
 */

export class UIControls {
  /**
   * Initialize UI controls
   * @param {HTMLElement} containerElement - Element to contain UI controls
   * @param {NavigationController} navigationController - Navigation controller
   * @param {StateManager} stateManager - State manager
   */
  constructor(containerElement, navigationController, stateManager) {
    if (!containerElement || !navigationController || !stateManager) {
      throw new Error('Container, NavigationController, and StateManager are required');
    }

    this.container = containerElement;
    this.navigationController = navigationController;
    this.stateManager = stateManager;

    this.elements = {
      prevButton: null,
      nextButton: null,
      pageCounter: null
    };

    console.log('[UIControls] Initialized (keyboard navigation disabled for ElevenLabs compatibility)');
  }

  /**
   * Render UI controls
   */
  render() {
    console.log('[UIControls] Rendering UI');

    const controlsHTML = `
      <div class="nav-wrapper">
        <div id="page-counter" class="page-counter-text">
          Page 1 of ${this.stateManager.getTotalPages()}
        </div>

        <div class="nav-controls">
          <button id="prev-button" class="nav-button" aria-label="Previous page">
            <span class="arrow">←</span>
            Previous
          </button>

          <div id="voice-controls-inline">
            <!-- Voice button will be inserted here by VoiceControls -->
          </div>

          <button id="next-button" class="nav-button" aria-label="Next page">
            Next
            <span class="arrow">→</span>
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = controlsHTML;

    this.elements.prevButton = document.getElementById('prev-button');
    this.elements.nextButton = document.getElementById('next-button');
    this.elements.pageCounter = document.getElementById('page-counter');

    this._attachEventListeners();
    this.updateUI();

    console.log('[UIControls] UI rendered and events attached');
  }

  /**
   * Update UI state (button states, page counter)
   */
  updateUI() {
    const currentPage = this.stateManager.getCurrentPage();
    const totalPages = this.stateManager.getTotalPages();

    this.elements.pageCounter.textContent = `Page ${currentPage} of ${totalPages}`;

    this.elements.prevButton.disabled = !this.stateManager.canGoPrevious();
    this.elements.nextButton.disabled = !this.stateManager.canGoNext();

    console.log(`[UIControls] UI updated for page ${currentPage}/${totalPages}`);
  }

  /**
   * Remove UI elements and clean up listeners
   */
  destroy() {
    console.log('[UIControls] Destroying UI');

    this._removeEventListeners();

    this.container.innerHTML = '';

    this.elements.prevButton = null;
    this.elements.nextButton = null;
    this.elements.pageCounter = null;
  }

  /**
   * Attach event listeners
   * @private
   */
  _attachEventListeners() {
    this.elements.prevButton.addEventListener('click', () => {
      console.log('[UIControls] Previous button clicked');
      this.navigationController.previousPage();
    });

    this.elements.nextButton.addEventListener('click', () => {
      console.log('[UIControls] Next button clicked');
      this.navigationController.nextPage();
    });

    // Keyboard navigation removed to prevent conflicts with ElevenLabs widget input

    this.stateManager.addEventListener('pageChanged', () => {
      this.updateUI();
    });
  }

  /**
   * Remove event listeners
   * @private
   */
  _removeEventListeners() {
    // No keyboard listeners to remove (disabled for ElevenLabs compatibility)
  }
}
