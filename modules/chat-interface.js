/**
 * CHAT INTERFACE MODULE
 *
 * Purpose: Display conversation transcript and handle text input
 * Contract: Slide-out panel with message display and text input form
 * Dependencies: StateManager (for event coordination)
 *
 * Public API:
 *   - show() / hide() / toggle()
 *   - addMessage(role, content, timestamp)
 *   - clear()
 *   - setTypingIndicator(isTyping)
 *
 * Input:
 *   - role: 'user' | 'agent' | 'system'
 *   - content: string (HTML escaped)
 *   - timestamp: Date object or ISO string
 *
 * Output:
 *   - DOM updates to chat panel
 *   - Form submit events via callback
 *
 * Side Effects:
 *   - Creates and manages DOM elements
 *   - Auto-scrolls message container
 *
 * Error Handling:
 *   - Validates role values
 *   - Escapes HTML to prevent XSS
 *   - Graceful handling of missing timestamps
 */

export class ChatInterface {
  /**
   * Initialize chat interface
   * @param {Object} options - Configuration options
   * @param {Function} options.onSubmit - Callback when user submits message (text) => void
   * @param {Function} options.onTyping - Callback when user is typing (isTyping) => void
   * @param {StateManager} options.stateManager - State manager for event coordination
   */
  constructor({ onSubmit, onTyping, stateManager }) {
    if (typeof onSubmit !== 'function') {
      throw new Error('onSubmit callback is required');
    }

    this._onSubmit = onSubmit;
    this._onTyping = onTyping || null;
    this._stateManager = stateManager;
    this._isVisible = false;
    this._messages = [];
    this._typingTimeout = null;

    this._createElement();
    this._attachEventListeners();

    console.log('[ChatInterface] Initialized');
  }

  /**
   * Show chat panel
   */
  show() {
    if (this._isVisible) return;

    this._panel.classList.add('visible');
    this._isVisible = true;
    this._focusInput();

    if (this._stateManager) {
      this._stateManager._emit('chatToggled', { visible: true });
    }

    console.log('[ChatInterface] Shown');
  }

  /**
   * Hide chat panel
   */
  hide() {
    if (!this._isVisible) return;

    this._panel.classList.remove('visible');
    this._isVisible = false;

    if (this._stateManager) {
      this._stateManager._emit('chatToggled', { visible: false });
    }

    console.log('[ChatInterface] Hidden');
  }

  /**
   * Toggle chat panel visibility
   */
  toggle() {
    if (this._isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Add message to transcript
   * @param {string} role - Message role ('user', 'agent', 'system')
   * @param {string} content - Message content
   * @param {Date|string} timestamp - Message timestamp
   */
  addMessage(role, content, timestamp = new Date()) {
    const validRoles = ['user', 'agent', 'system'];
    if (!validRoles.includes(role)) {
      console.warn(`[ChatInterface] Invalid role: ${role}, defaulting to 'system'`);
      role = 'system';
    }

    const message = {
      role,
      content: this._escapeHtml(content),
      timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp),
    };

    this._messages.push(message);
    this._renderMessage(message);
    this._scrollToBottom();

    console.log(`[ChatInterface] Added ${role} message`);
  }

  /**
   * Clear all messages
   */
  clear() {
    this._messages = [];
    this._messagesContainer.innerHTML = '';
    console.log('[ChatInterface] Cleared all messages');
  }

  /**
   * Set typing indicator
   * @param {boolean} isTyping - Whether agent is typing
   */
  setTypingIndicator(isTyping) {
    const existingIndicator = this._messagesContainer.querySelector('.typing-indicator');

    if (isTyping && !existingIndicator) {
      const indicator = document.createElement('div');
      indicator.className = 'message agent typing-indicator';
      indicator.innerHTML = `
        <div class="message-content">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      `;
      this._messagesContainer.appendChild(indicator);
      this._scrollToBottom();
    } else if (!isTyping && existingIndicator) {
      existingIndicator.remove();
    }
  }

  /**
   * Create chat panel DOM structure
   * @private
   */
  _createElement() {
    this._panel = document.createElement('div');
    this._panel.className = 'chat-panel';
    this._panel.innerHTML = `
      <div class="chat-header">
        <h3>Conversation</h3>
        <button class="chat-close" aria-label="Close chat">×</button>
      </div>
      <div class="chat-messages"></div>
      <form class="chat-form">
        <input
          type="text"
          class="chat-input"
          placeholder="Type a message..."
          autocomplete="off"
        />
        <button type="submit" class="chat-send">Send</button>
      </form>
    `;

    document.body.appendChild(this._panel);

    this._messagesContainer = this._panel.querySelector('.chat-messages');
    this._form = this._panel.querySelector('.chat-form');
    this._input = this._panel.querySelector('.chat-input');
    this._closeButton = this._panel.querySelector('.chat-close');
  }

  /**
   * Attach event listeners
   * @private
   */
  _attachEventListeners() {
    this._closeButton.addEventListener('click', () => this.hide());

    this._form.addEventListener('submit', (e) => {
      e.preventDefault();

      const text = this._input.value.trim();
      if (!text) return;

      this._input.value = '';

      // User stopped typing (sent message)
      if (this._onTyping) {
        this._onTyping(false);
      }

      this._onSubmit(text);
    });

    // Detect when user is typing
    this._input.addEventListener('input', () => {
      if (!this._onTyping) return;

      // User is typing
      this._onTyping(true);

      // Clear existing timeout
      if (this._typingTimeout) {
        clearTimeout(this._typingTimeout);
      }

      // Set timeout to signal "stopped typing" after 2 seconds of inactivity
      this._typingTimeout = setTimeout(() => {
        this._onTyping(false);
      }, 2000);
    });

    // Also detect when user focuses/blurs the input
    this._input.addEventListener('focus', () => {
      if (this._onTyping) {
        this._onTyping(true);
      }
    });

    this._input.addEventListener('blur', () => {
      if (this._onTyping) {
        this._onTyping(false);
      }
      // Clear timeout when input loses focus
      if (this._typingTimeout) {
        clearTimeout(this._typingTimeout);
        this._typingTimeout = null;
      }
    });
  }

  /**
   * Render a message to the DOM
   * @private
   * @param {Object} message - Message object
   */
  _renderMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.role}`;

    const timeString = this._formatTime(message.timestamp);

    messageEl.innerHTML = `
      <div class="message-content">${message.content}</div>
      <div class="message-time">${timeString}</div>
    `;

    this._messagesContainer.appendChild(messageEl);
  }

  /**
   * Format timestamp as HH:MM AM/PM
   * @private
   * @param {Date} date - Date to format
   * @returns {string} Formatted time
   */
  _formatTime(date) {
    if (!(date instanceof Date) || isNaN(date)) {
      return '';
    }

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours || 12;

    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;

    return `${hours}:${minutesStr} ${ampm}`;
  }

  /**
   * Escape HTML to prevent XSS
   * @private
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Scroll messages to bottom
   * @private
   */
  _scrollToBottom() {
    this._messagesContainer.scrollTop = this._messagesContainer.scrollHeight;
  }

  /**
   * Focus the input field
   * @private
   */
  _focusInput() {
    this._input.focus();
  }

  /**
   * Check if chat is visible
   * @returns {boolean} True if visible
   */
  isVisible() {
    return this._isVisible;
  }

  /**
   * Get all messages
   * @returns {Array} Array of message objects
   */
  getMessages() {
    return [...this._messages];
  }
}
