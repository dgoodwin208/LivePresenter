/**
 * CONFIGURATION FILE - EXAMPLE
 *
 * Copy this file to config.js and edit with your settings
 */

export const CONFIG = {
  // ElevenLabs Agent ID
  // Get your agent ID from: https://elevenlabs.io/app/conversational-ai
  ELEVENLABS_AGENT_ID: 'agent_your_id_here',

  // PDF file path (relative to index.html)
  PDF_PATH: './presentation.pdf',

  // Optional: Customize loading messages
  LOADING_MESSAGES: {
    INITIALIZING: 'Initializing...',
    LOADING_PDF: 'Loading PDF file...',
    SETTING_UP: 'Setting up navigation...',
    CREATING_CONTROLS: 'Creating controls...',
    REGISTERING_TOOLS: 'Registering client tools...',
    RENDERING: 'Rendering first page...',
    READY: 'Ready!'
  }
};
