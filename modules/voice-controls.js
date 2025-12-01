/**
 * VOICE CONTROLS MODULE
 *
 * Purpose: UI controls for ElevenLabs voice conversation
 * Contract: Render voice chat button and manage conversation state
 * Dependencies: None (receives conversation instance)
 */

export class VoiceControls {
  constructor(container) {
    this.container = container;
    this.conversation = null;
    this.conversationClass = null;
    this.conversationConfig = null;
    this.isActive = false;
    this.isSpeaking = false;
    this.elements = {};
  }

  /**
   * Set the conversation config (used to start sessions)
   * @param {Class} conversationClass - ElevenLabs Conversation class
   * @param {Object} config - Configuration for starting sessions
   */
  setConversationConfig(conversationClass, config) {
    this.conversationClass = conversationClass;
    this.conversationConfig = config;
    this.updateButtonState();
    console.log('[VoiceControls] Conversation config set, ready to start');
  }

  /**
   * Render the voice control button (inline rectangular design)
   */
  render() {
    this.container.innerHTML = `
      <button id="voice-button" class="voice-button-inline">
        <div class="sp-avatar-container">
          <div class="sp-avatar"></div>
        </div>
        <div class="voice-status-inline">Ready</div>
      </button>
    `;

    this.elements.button = this.container.querySelector('#voice-button');
    this.elements.status = this.container.querySelector('.voice-status-inline');
    this.elements.avatar = this.container.querySelector('.sp-avatar');

    this._attachEventListeners();
    console.log('[VoiceControls] Voice button rendered (inline design)');
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners() {
    this.elements.button.addEventListener('click', () => {
      this.toggleVoice();
    });

    // Show "Click to Hang Up" when hovering over active conversation
    this.elements.button.addEventListener('mouseenter', () => {
      if (this.isActive) {
        this.elements.status.textContent = 'Click to Hang Up';
      }
    });

    this.elements.button.addEventListener('mouseleave', () => {
      if (this.isActive) {
        // Restore appropriate status
        if (this.isSpeaking) {
          this.elements.status.textContent = 'Speaking...';
        } else {
          this.elements.status.textContent = 'Listening...';
        }
      }
    });
  }

  /**
   * Toggle voice conversation on/off
   */
  async toggleVoice() {
    if (!this.conversationClass || !this.conversationConfig) {
      console.warn('[VoiceControls] Conversation not configured');
      this.elements.status.textContent = 'Not Ready';
      return;
    }

    if (this.isActive && this.conversation) {
      // End the conversation
      try {
        console.log('[VoiceControls] Ending conversation...');
        await this.conversation.endSession();
        this.conversation = null;
        this.isActive = false;
        this.isSpeaking = false;
        this.elements.button.classList.remove('active', 'speaking');
        this.elements.status.textContent = 'Click to Talk';
        console.log('[VoiceControls] ✅ Conversation ended');
      } catch (error) {
        console.error('[VoiceControls] ❌ Error ending conversation:', error);
        this.elements.status.textContent = 'Error';
      }
    } else {
      // Start a new conversation
      try {
        console.log('[VoiceControls] Starting conversation...');
        this.elements.status.textContent = 'Connecting...';

        // Create new conversation session
        this.conversation = await this.conversationClass.startSession(this.conversationConfig);

        // Note: isActive and button state will be updated by onConnect callback
        console.log('[VoiceControls] ✅ Conversation started');
      } catch (error) {
        console.error('[VoiceControls] ❌ Error starting conversation:', error);
        this.elements.status.textContent = 'Error - Click to Retry';
        this.conversation = null;
        this.isActive = false;
      }
    }
  }

  /**
   * Update button state based on conversation status
   */
  updateButtonState() {
    if (this.conversation && this.isActive) {
      // Active conversation
      this.elements.button.classList.add('ready', 'active');
      if (this.isSpeaking) {
        this.elements.status.textContent = 'Speaking...';
      } else {
        this.elements.status.textContent = 'Listening...';
      }
    } else if (this.conversationConfig) {
      // Ready to start, but not active
      this.elements.button.classList.add('ready');
      this.elements.button.classList.remove('active', 'speaking');
      this.elements.status.textContent = 'Click to Talk';
    } else {
      // Not configured yet
      this.elements.button.classList.remove('ready', 'active', 'speaking');
      this.elements.status.textContent = 'Setting Up...';
    }
  }

  /**
   * Set speaking state (called from conversation events)
   */
  setSpeaking(speaking) {
    this.isSpeaking = speaking;
    if (speaking) {
      this.elements.button.classList.add('speaking');
      this.elements.status.textContent = 'Speaking...';
    } else if (this.isActive) {
      this.elements.button.classList.remove('speaking');
      this.elements.status.textContent = 'Listening...';
    }
  }
}
