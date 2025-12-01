/**
 * MAIN ASSEMBLY FILE
 *
 * Purpose: Wire all modules together to create functioning presentation
 * This file connects all modules and initializes the presentation system
 */

import { Conversation } from 'https://esm.sh/@elevenlabs/client@0.11.0';
import { StateManager } from './modules/state-manager.js';
import { PDFRenderer } from './modules/pdf-renderer.js';
import { NavigationController } from './modules/navigation.js';
import { UIControls } from './modules/ui-controls.js';
import { APIController } from './modules/api-controller.js';
import { VoiceControls } from './modules/voice-controls.js';
import { SlideSidebar } from './modules/slide-sidebar.js';
import { ChatInterface } from './modules/chat-interface.js';
import { TranscriptManager } from './modules/transcript-manager.js';
import { registerClientTools } from './modules/client-tools.js';
import { CONFIG } from './config.js';

/**
 * Initialize the PDF presentation system
 * @param {string} pdfPath - Path to PDF file
 * @param {string} canvasContainerId - ID of canvas container element
 * @param {string} controlsContainerId - ID of controls container element
 * @param {string} voiceControlsContainerId - ID of voice controls container element (inline)
 * @returns {Promise<Object>} Initialized system components
 */
export async function initPresentation(
  pdfPath = './presentation.pdf',
  canvasContainerId = 'pdf-container',
  controlsContainerId = 'controls-container',
  voiceControlsContainerId = 'voice-controls-inline'
) {
  console.log('[Main] Initializing PDF presentation system');
  console.log(`[Main] PDF path: ${pdfPath}`);

  try {
    const canvasContainer = document.getElementById(canvasContainerId);
    const controlsContainer = document.getElementById(controlsContainerId);

    if (!canvasContainer) {
      throw new Error(`Canvas container not found: ${canvasContainerId}`);
    }
    if (!controlsContainer) {
      throw new Error(`Controls container not found: ${controlsContainerId}`);
    }

    console.log('[Main] Step 1/7: Creating PDF renderer');
    const pdfRenderer = new PDFRenderer(canvasContainer);

    console.log('[Main] Step 2/8: Loading PDF');
    updateLoading(40, 'Loading PDF file...');
    const { totalPages } = await pdfRenderer.loadPDF(pdfPath);

    console.log('[Main] Step 3/8: Initializing state manager');
    updateLoading(50, 'Setting up navigation...');
    const stateManager = new StateManager(totalPages);

    console.log('[Main] Step 4/8: Creating navigation controller');
    const navigationController = new NavigationController(stateManager, pdfRenderer);

    console.log('[Main] Step 4.5/10: Setting up PDF link navigation');
    pdfRenderer.setNavigationCallback((pageNumber) => {
      console.log(`[Main] PDF link clicked: navigating to page ${pageNumber}`);
      navigationController.goToPage(pageNumber);
    });

    console.log('[Main] Step 5/10: Setting up UI controls');
    updateLoading(60, 'Creating controls...');
    const uiControls = new UIControls(controlsContainer, navigationController, stateManager);
    uiControls.render();

    console.log('[Main] Step 6/10: Setting up voice controls');
    // Get voice controls container AFTER UI controls have rendered it
    const voiceControlsContainer = document.getElementById(voiceControlsContainerId);
    if (!voiceControlsContainer) {
      throw new Error(`Voice controls container not found: ${voiceControlsContainerId}`);
    }
    const voiceControls = new VoiceControls(voiceControlsContainer);
    voiceControls.render();

    console.log('[Main] Step 7/10: Exposing API controller (for manual testing)');
    updateLoading(70, 'Registering client tools...');
    const apiController = new APIController(navigationController);
    apiController.expose();

    console.log('[Main] Step 8/10: Registering client tools for ElevenLabs widget');
    registerClientTools(navigationController);

    console.log('[Main] Step 9/10: Rendering first page');
    updateLoading(80, 'Rendering first page...');
    await pdfRenderer.renderPage(1);

    console.log('[Main] Step 10/13: Setting up chat interface');
    updateLoading(82, 'Setting up chat interface...');

    // Create chat interface
    const chatInterface = new ChatInterface({
      onSubmit: (text) => {
        console.log('[Main] Chat message submitted:', text);
        if (transcriptManager && transcriptManager._conversation) {
          transcriptManager.sendTextMessage(text);
        } else {
          chatInterface.addMessage('system', 'Voice session not active. Please start a voice conversation first.', new Date());
        }
      },
      onTyping: (isTyping) => {
        console.log('[Main] User typing:', isTyping);
        if (transcriptManager) {
          transcriptManager.signalUserActivity(isTyping);
        }
      },
      stateManager: stateManager
    });

    // Create transcript manager NOW (conversation will be set later)
    const transcriptManager = new TranscriptManager({
      chatInterface: chatInterface,
      conversation: null  // Will be set when voice session starts
    });
    console.log('[Main] TranscriptManager created (conversation will be set on session start)');

    // Create chat toggle button
    const chatToggleBtn = document.createElement('button');
    chatToggleBtn.className = 'chat-toggle-btn';
    chatToggleBtn.innerHTML = '💬';
    chatToggleBtn.setAttribute('aria-label', 'Toggle chat');
    chatToggleBtn.setAttribute('title', 'Show/hide conversation transcript');
    chatToggleBtn.addEventListener('click', () => {
      chatInterface.toggle();
      chatToggleBtn.classList.toggle('active', chatInterface.isVisible());
    });
    document.body.appendChild(chatToggleBtn);

    console.log('[Main] Step 11/13: Preparing voice assistant (ready when you click)');
    updateLoading(85, 'Voice assistant ready...');

    // Prepare conversation config for voice controls
    // Session will start when user clicks the voice button
    const conversationConfig = {
      agentId: CONFIG.ELEVENLABS_AGENT_ID,
      clientTools: window.clientTools,
      onConnect: () => {
        console.log('[ElevenLabs] Session connected');
        voiceControls.isActive = true;
        voiceControls.updateButtonState();

        // Wait a moment for voiceControls.conversation to be assigned
        setTimeout(() => {
          console.log('[Main] Setting conversation on TranscriptManager...');
          console.log('[Main] voiceControls.conversation exists?', !!voiceControls.conversation);

          if (voiceControls.conversation) {
            transcriptManager.setConversation(voiceControls.conversation);
            console.log('[Main] ✅ TranscriptManager now has conversation reference');

            // Add a welcome message
            chatInterface.addMessage('system', 'Voice session connected - transcript will appear here', new Date());
          } else {
            console.error('[Main] ⚠️ voiceControls.conversation still null after delay');
          }
        }, 100); // Small delay to let conversation assignment complete
      },
      onDisconnect: () => {
        console.log('[ElevenLabs] Session disconnected');
        voiceControls.isActive = false;
        voiceControls.updateButtonState();
      },
      onError: (error) => {
        console.error('[ElevenLabs] Session error:', error);
      },
      onMessage: (message) => {
        console.log('[ElevenLabs] Message received:', message);
        console.log('[ElevenLabs] Message type:', typeof message);
        console.log('[ElevenLabs] Message keys:', message ? Object.keys(message) : 'null');
        console.log('[ElevenLabs] TranscriptManager exists?', !!transcriptManager);

        // Send message to transcript manager
        if (transcriptManager) {
          console.log('[Main] Routing message to TranscriptManager');
          transcriptManager.handleVoiceMessage(message);
        } else {
          console.warn('[Main] TranscriptManager not initialized yet - message not routed to chat');
        }
      },
      onModeChange: (mode) => {
        console.log('[ElevenLabs] Mode changed:', mode.mode);
        // mode.mode can be 'listening' or 'speaking'
        voiceControls.setSpeaking(mode.mode === 'speaking');
      }
    };

    // Pass conversation factory to voice controls
    voiceControls.setConversationConfig(Conversation, conversationConfig);

    console.log('[ElevenLabs] ✅ Voice assistant ready');
    console.log('[ElevenLabs] Tools available:', Object.keys(window.clientTools));
    console.log('[ElevenLabs] Click the microphone button to start talking');

    console.log('[Main] Step 12/13: Creating slide sidebar navigation');
    const slideSidebar = new SlideSidebar(navigationController, stateManager);
    slideSidebar.render();

    console.log('[Main] Step 13/13: Finalizing chat interface');
    console.log('[Main] ✅ Chat toggle button added (bottom-right corner)');
    console.log('[Main] ✅ Chat interface ready - click 💬 to open transcript');

    console.log('[Main] ✅ Presentation system initialized successfully');
    console.log('[Main] ✅ Client tools registered for ElevenLabs widget');
    console.log('[Main] Available client tools:', Object.keys(window.clientTools || {}));
    console.log('[Main] Manual testing API also available at window.pdfController');

    // Expose chat for debugging
    window.chatDebug = {
      interface: chatInterface,
      manager: transcriptManager,
      addTestMessage: (role, text) => {
        chatInterface.addMessage(role || 'user', text || 'Test message', new Date());
        console.log('[Debug] Added test message to chat');
      },
      showChat: () => chatInterface.show(),
      hideChat: () => chatInterface.hide(),
      hasConversation: () => !!transcriptManager._conversation,
      getHistory: () => transcriptManager.getConversationHistory()
    };
    console.log('[Main] Chat debug helpers available at window.chatDebug');
    console.log('[Main] Try: window.chatDebug.addTestMessage("user", "Hello!")');
    console.log('[Main] Try: window.chatDebug.addTestMessage("agent", "Hi there!")');
    console.log('[Main] Try: window.chatDebug.showChat()');

    return {
      stateManager,
      pdfRenderer,
      navigationController,
      uiControls,
      voiceControls,
      slideSidebar,
      chatInterface,
      apiController
    };
  } catch (error) {
    console.error('[Main] ❌ Failed to initialize presentation:', error);
    throw error;
  }
}

// Loading screen helper
function updateLoading(percent, text) {
  const bar = document.getElementById('loading-bar');
  const loadingText = document.getElementById('loading-text');

  if (bar) bar.style.width = `${percent}%`;
  if (loadingText) loadingText.textContent = text;
}

function hideLoading() {
  const loadingScreen = document.getElementById('loading-screen');
  const app = document.getElementById('app');

  console.log('[Loading] Hiding loading screen, showing presentation');

  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }

  if (app) {
    // Make visible and fade in
    app.style.visibility = 'visible';
    app.style.opacity = '0';
    app.style.transition = 'opacity 0.5s ease';

    // Trigger fade in after visibility change
    setTimeout(() => {
      app.style.opacity = '1';
    }, 50);
  }
}

if (typeof window !== 'undefined') {
  window.initPresentation = initPresentation;

  window.addEventListener('DOMContentLoaded', async () => {
    console.log('[Main] DOM loaded, starting controlled initialization');

    try {
      updateLoading(10, 'Loading libraries...');

      // Wait for PDF.js
      let startTime = Date.now();
      while (!window.pdfjsLib && Date.now() - startTime < 10000) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!window.pdfjsLib) {
        throw new Error('PDF.js failed to load');
      }

      console.log('[Main] ✅ PDF.js loaded');
      console.log('[Main] ✅ ElevenLabs SDK loaded via ES6 module');

      updateLoading(30, 'Initializing presentation system...');

      // Initialize presentation
      await initPresentation();

      updateLoading(90, 'Finalizing...');

      // Give widget a moment to fully initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      updateLoading(100, 'Ready!');

      // Hide loading screen and show presentation
      await new Promise(resolve => setTimeout(resolve, 300));
      hideLoading();

      console.log('[Main] ✅ Presentation ready - all systems operational');

    } catch (error) {
      console.error('[Main] Initialization failed:', error);

      updateLoading(0, 'Error loading presentation');

      setTimeout(() => {
        document.getElementById('loading-screen').innerHTML = `
          <div style="color: white; padding: 2rem; text-align: center;">
            <h1>❌ Failed to Load</h1>
            <p style="color: #ff6b6b; margin-top: 1rem;">${error.message}</p>
            <button onclick="location.reload()" style="
              margin-top: 2rem;
              padding: 0.75rem 1.5rem;
              background: rgba(255,255,255,0.2);
              border: 1px solid rgba(255,255,255,0.3);
              border-radius: 8px;
              color: white;
              cursor: pointer;
            ">Retry</button>
          </div>
        `;
      }, 500);
    }
  });
}
