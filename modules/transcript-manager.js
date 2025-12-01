/**
 * TRANSCRIPT MANAGER MODULE
 *
 * Purpose: Coordinate message flow between voice/chat and ElevenLabs
 * Contract: Route messages between chat UI and ElevenLabs conversation
 * Dependencies: ChatInterface, ElevenLabs Conversation object
 *
 * Public API:
 *   - sendTextMessage(text)
 *   - handleVoiceMessage(message)
 *   - getConversationHistory()
 *
 * Input:
 *   - text: string (user text input)
 *   - message: ElevenLabs message object
 *
 * Output:
 *   - Messages sent to ElevenLabs conversation
 *   - Messages displayed in ChatInterface
 *
 * Side Effects:
 *   - Calls ElevenLabs API via conversation object
 *   - Updates chat UI
 *   - Maintains message history in memory
 *
 * Error Handling:
 *   - Try/catch around ElevenLabs API calls
 *   - Display error messages in chat as system messages
 *   - Graceful fallback if API not available
 */

export class TranscriptManager {
  /**
   * Initialize transcript manager
   * @param {Object} options - Configuration options
   * @param {ChatInterface} options.chatInterface - Chat UI component
   * @param {Object} options.conversation - ElevenLabs conversation object
   */
  constructor({ chatInterface, conversation }) {
    if (!chatInterface) {
      throw new Error('ChatInterface is required');
    }

    this._chatInterface = chatInterface;
    this._conversation = conversation;
    this._history = [];

    console.log('[TranscriptManager] Initialized');
  }

  /**
   * Send text message from user to ElevenLabs
   * @param {string} text - User's text message
   */
  async sendTextMessage(text) {
    if (!text || typeof text !== 'string') {
      console.warn('[TranscriptManager] Invalid text message');
      return;
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    const timestamp = new Date();

    this._addToHistory('user', trimmedText, timestamp);
    this._chatInterface.addMessage('user', trimmedText, timestamp);

    console.log('[TranscriptManager] Sending text message to ElevenLabs:', trimmedText);

    if (!this._conversation) {
      const errorMsg = 'Voice conversation not connected';
      this._chatInterface.addMessage('system', errorMsg, new Date());
      console.error('[TranscriptManager]', errorMsg);
      return;
    }

    // Debug: Log what methods are available
    console.log('[TranscriptManager] Conversation object type:', typeof this._conversation);
    console.log('[TranscriptManager] Conversation properties:', Object.keys(this._conversation));
    console.log('[TranscriptManager] Conversation methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this._conversation)));

    try {
      // Try various possible method names
      if (typeof this._conversation.sendTextMessage === 'function') {
        await this._conversation.sendTextMessage(trimmedText);
        console.log('[TranscriptManager] ✅ Text message sent via sendTextMessage()');
      } else if (typeof this._conversation.sendMessage === 'function') {
        await this._conversation.sendMessage(trimmedText);
        console.log('[TranscriptManager] ✅ Text message sent via sendMessage()');
      } else if (typeof this._conversation.send === 'function') {
        await this._conversation.send(trimmedText);
        console.log('[TranscriptManager] ✅ Text message sent via send()');
      } else if (typeof this._conversation.sendUserMessage === 'function') {
        await this._conversation.sendUserMessage(trimmedText);
        console.log('[TranscriptManager] ✅ Text message sent via sendUserMessage()');
      } else if (typeof this._conversation.sendText === 'function') {
        await this._conversation.sendText(trimmedText);
        console.log('[TranscriptManager] ✅ Text message sent via sendText()');
      } else {
        console.warn('[TranscriptManager] Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this._conversation)));
        this._chatInterface.addMessage(
          'system',
          'Text input is for display only - voice conversation required for agent interaction',
          new Date()
        );
      }
    } catch (error) {
      console.error('[TranscriptManager] Error sending text message:', error);
      this._chatInterface.addMessage(
        'system',
        `Error sending message: ${error.message}`,
        new Date()
      );
    }
  }

  /**
   * Handle incoming voice message from ElevenLabs
   * @param {Object} message - ElevenLabs message object
   */
  handleVoiceMessage(message) {
    if (!message) {
      console.warn('[TranscriptManager] Received null message');
      return;
    }

    console.log('[TranscriptManager] ===== Handling voice message =====');
    console.log('[TranscriptManager] Full message:', JSON.stringify(message, null, 2));

    const role = this._determineRole(message);
    console.log('[TranscriptManager] Determined role:', role);

    const content = this._extractContent(message);
    console.log('[TranscriptManager] Extracted content:', content);

    const timestamp = this._extractTimestamp(message);
    console.log('[TranscriptManager] Timestamp:', timestamp);

    if (!content) {
      console.warn('[TranscriptManager] No content extracted from message - skipping');
      console.log('[TranscriptManager] Message had these fields:', Object.keys(message));
      return;
    }

    this._addToHistory(role, content, timestamp);
    this._chatInterface.addMessage(role, content, timestamp);

    console.log(`[TranscriptManager] ✅ Added ${role} message to chat: "${content.substring(0, 50)}..."`);
  }

  /**
   * Get conversation history
   * @returns {Array} Array of message objects
   */
  getConversationHistory() {
    return [...this._history];
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this._history = [];
    this._chatInterface.clear();
    console.log('[TranscriptManager] History cleared');
  }

  /**
   * Add message to history
   * @private
   * @param {string} role - Message role
   * @param {string} content - Message content
   * @param {Date} timestamp - Message timestamp
   */
  _addToHistory(role, content, timestamp) {
    this._history.push({
      role,
      content,
      timestamp,
    });
  }

  /**
   * Determine message role from ElevenLabs message
   * @private
   * @param {Object} message - ElevenLabs message
   * @returns {string} Role ('user' or 'agent')
   */
  _determineRole(message) {
    if (message.source === 'user' || message.type === 'user_transcript') {
      return 'user';
    }

    if (message.source === 'ai' || message.type === 'agent_response') {
      return 'agent';
    }

    if (message.role === 'user') {
      return 'user';
    }

    if (message.role === 'assistant' || message.role === 'agent') {
      return 'agent';
    }

    return 'agent';
  }

  /**
   * Extract content from ElevenLabs message
   * @private
   * @param {Object} message - ElevenLabs message
   * @returns {string|null} Message content
   */
  _extractContent(message) {
    if (message.message && typeof message.message === 'string') {
      return message.message;
    }

    if (message.text && typeof message.text === 'string') {
      return message.text;
    }

    if (message.content && typeof message.content === 'string') {
      return message.content;
    }

    if (message.transcript && typeof message.transcript === 'string') {
      return message.transcript;
    }

    if (typeof message === 'string') {
      return message;
    }

    return null;
  }

  /**
   * Extract timestamp from ElevenLabs message
   * @private
   * @param {Object} message - ElevenLabs message
   * @returns {Date} Message timestamp
   */
  _extractTimestamp(message) {
    if (message.timestamp) {
      return new Date(message.timestamp);
    }

    if (message.time) {
      return new Date(message.time);
    }

    return new Date();
  }

  /**
   * Update conversation reference
   * @param {Object} conversation - New ElevenLabs conversation object
   */
  setConversation(conversation) {
    this._conversation = conversation;
    console.log('[TranscriptManager] Conversation reference updated');
  }

  /**
   * Signal user typing activity to prevent idle timeout
   * @param {boolean} isTyping - Whether user is currently typing
   */
  signalUserActivity(isTyping) {
    if (!this._conversation) {
      return;
    }

    console.log('[TranscriptManager] User typing:', isTyping);

    try {
      // Try various methods that might signal user activity
      if (typeof this._conversation.sendUserActivity === 'function') {
        this._conversation.sendUserActivity({ typing: isTyping });
        console.log('[TranscriptManager] ✅ Sent user activity signal via sendUserActivity()');
      } else if (typeof this._conversation.sendTypingIndicator === 'function') {
        this._conversation.sendTypingIndicator(isTyping);
        console.log('[TranscriptManager] ✅ Sent typing indicator via sendTypingIndicator()');
      } else if (typeof this._conversation.keepAlive === 'function' && isTyping) {
        this._conversation.keepAlive();
        console.log('[TranscriptManager] ✅ Sent keep-alive signal');
      } else if (typeof this._conversation.interrupt === 'function' && isTyping) {
        // Some SDKs use "interrupt" to stop agent from speaking while user types
        this._conversation.interrupt();
        console.log('[TranscriptManager] ✅ Interrupted agent speech');
      } else {
        // No specific method available - this is normal for many voice-only SDKs
        console.log('[TranscriptManager] No user activity method available (voice-only mode)');
      }
    } catch (error) {
      console.error('[TranscriptManager] Error signaling user activity:', error);
    }
  }
}
