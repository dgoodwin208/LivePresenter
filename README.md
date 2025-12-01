# AI-Powered Presentation Viewer

An interactive PDF presentation viewer with integrated ElevenLabs voice AI agent. Navigate slides using voice commands, view conversation transcripts, and control presentations through both UI and voice.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## ✨ Features

- 📊 **PDF Rendering** - Smooth, high-quality PDF slide rendering using PDF.js
- 🎤 **Voice Control** - Navigate presentations using natural voice commands via ElevenLabs
- 💬 **Live Transcript** - Real-time conversation transcript with chat interface
- 🧭 **Multiple Navigation** - Click buttons, use keyboard shortcuts, or speak commands
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🎨 **Modern UI** - Clean, dark-themed interface with glassmorphism effects
- 🗂️ **Slide Sidebar** - Hamburger menu with slide navigation and titles
- 🔧 **Modular Architecture** - Well-organized, maintainable codebase

## 🚀 Quick Start

### Prerequisites

- A web server (cannot run from `file://` protocol)
- An [ElevenLabs account](https://elevenlabs.io/) with a Conversational AI agent
- Your presentation in PDF format
- Python 3 (for PDF extraction utility)

### Installation

1. **Clone or download this repository**
   ```bash
   git clone <your-repo-url>
   cd presentation_viewer
   ```

2. **Place your PDF file**
   ```bash
   cp your-presentation.pdf presentation.pdf
   ```

3. **Configure ElevenLabs**
   ```bash
   cp config.example.js config.js
   ```

   Edit `config.js` and add your ElevenLabs agent ID:
   ```javascript
   export const CONFIG = {
     ELEVENLABS_AGENT_ID: 'agent_your_id_here',
     PDF_PATH: './presentation.pdf'
   };
   ```

4. **Extract PDF content** (auto-generates slide navigation)
   ```bash
   pip install pdfplumber
   python extract_pdf.py presentation.pdf
   ```

   This creates:
   - RAG content file for your ElevenLabs agent
   - `modules/slide-titles.js` with auto-extracted slide titles

   See [docs/PDF_EXTRACTION.md](docs/PDF_EXTRACTION.md) for details.

5. **Start a web server**
   ```bash
   # Python
   python3 -m http.server 8000

   # Node.js
   npx http-server -p 8000

   # PHP
   php -S localhost:8000
   ```

6. **Open in browser**

   Navigate to `http://localhost:8000` and you're ready!

## 🎯 ElevenLabs Agent Setup

Your ElevenLabs agent should be configured with these **client tools** to enable voice navigation:

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `nextPage` | Navigate to next slide | none |
| `previousPage` | Navigate to previous slide | none |
| `goToPage` | Jump to specific slide | `pageNumber` (number) |
| `getCurrentPage` | Get current slide number | none |
| `getTotalPages` | Get total number of slides | none |
| `getPageText` | Extract text from current slide | none |

### Sample Agent System Prompt

```
You are a helpful presentation assistant. You can help users navigate through
a PDF presentation using voice commands.

You have access to these tools:
- nextPage: Move to the next slide
- previousPage: Move to the previous slide
- goToPage: Jump to a specific slide number
- getCurrentPage: Check what slide we're on
- getTotalPages: Find out how many slides there are
- getPageText: Read the text content from the current slide

When users ask you to navigate (e.g., "next slide", "go to slide 5",
"what's on this page"), use the appropriate tool and let them know what
slide they're on.

Be conversational and helpful. If they ask about the content, use getPageText
to read it to them.
```

The viewer automatically registers these tools when it initializes. See the [ElevenLabs documentation](https://elevenlabs.io/docs/conversational-ai/client-tools) for more information.

## 📖 Usage

### Voice Commands

Click the microphone button to start a conversation, then use natural language:

- "Go to the next slide"
- "Show me slide 5"
- "What page are we on?"
- "Go back to the previous slide"
- "Read the text on this slide"

### UI Controls

- **Previous/Next Buttons** - Navigate slides
- **Hamburger Menu (☰)** - View slide list and jump to any slide
- **Chat Button (💬)** - Toggle conversation transcript
- **Microphone Button** - Start/end voice conversation

### Keyboard Shortcuts

- `←` / `→` - Previous/Next slide
- `Home` / `End` - First/Last slide
- `Esc` - Close sidebar/chat

### Developer API

For testing and debugging, use the `window.pdfController` API:

```javascript
// Navigate programmatically
window.pdfController.nextPage()
window.pdfController.previousPage()
window.pdfController.goToPage(5)

// Get state
window.pdfController.getCurrentPage()  // Returns { current: 1, total: 20 }
window.pdfController.getTotalPages()   // Returns 20

// Extract text
await window.pdfController.getPageText() // Returns text content
```

## ⚙️ Configuration

### `config.js`

```javascript
export const CONFIG = {
  // Required: Your ElevenLabs agent ID
  ELEVENLABS_AGENT_ID: 'agent_xxxxx',

  // PDF file path
  PDF_PATH: './presentation.pdf',

  // Optional: Customize loading messages
  LOADING_MESSAGES: {
    init: 'Initializing...',
    loading: 'Loading PDF...',
    rendering: 'Rendering slides...'
  }
};
```

### `modules/slide-titles.js`

Auto-generated by `extract_pdf.py`, but you can manually edit:

```javascript
export const SLIDE_TITLES = [
  { page: 1, title: 'Introduction' },
  { page: 2, title: 'Key Concepts' },
  { page: 3, title: 'Data Analysis' },
  // ...
];
```

### Styling

Edit `css/presentation.css` to customize:
- Colors and themes
- Fonts and typography
- Avatar image (line 183)
- Responsive breakpoints

## 🏗️ Architecture

### Modular Design

Each module has a single responsibility and clear interface:

```
presentation_viewer/
├── index.html              # Main HTML entry point
├── main.js                 # System orchestrator
├── config.js               # User configuration
├── extract_pdf.py          # PDF extraction utility
├── css/
│   └── presentation.css    # All styles
├── docs/
│   └── PDF_EXTRACTION.md   # PDF extraction guide
└── modules/
    ├── state-manager.js    # State tracking and events
    ├── pdf-renderer.js     # PDF.js integration
    ├── navigation.js       # Navigation logic
    ├── ui-controls.js      # UI buttons and controls
    ├── voice-controls.js   # Voice button UI
    ├── client-tools.js     # ElevenLabs tool registration
    ├── chat-interface.js   # Chat UI panel
    ├── transcript-manager.js # Message routing
    ├── slide-sidebar.js    # Sidebar navigation
    ├── api-controller.js   # Testing API
    └── slide-titles.js     # Slide metadata
```

### Data Flow

```
Voice Input → ElevenLabs Agent → Client Tools → Navigation → PDF Renderer
                    ↓
              Transcript Manager → Chat Interface
```

### Adding Features

1. Create a new module in `modules/your-feature.js`
2. Export a class with clear public methods
3. Import in `main.js` and wire it up
4. Update this README

**Module Template:**

```javascript
/**
 * YOUR MODULE
 *
 * Purpose: Brief description
 * Contract: What it does
 * Dependencies: What it needs
 */

export class YourModule {
  constructor(dependencies) {
    // Initialize
  }

  // Public methods
  publicMethod() {
    // Implementation
  }

  // Private methods (prefix with _)
  _privateMethod() {
    // Implementation
  }
}
```

## 🐛 Troubleshooting

### PDF doesn't load
- ✅ Ensure you're serving via HTTP/HTTPS (not `file://`)
- ✅ Check PDF path in `config.js`
- ✅ Look for errors in browser console (F12)

### Voice control not working
- ✅ Verify your ElevenLabs agent ID in `config.js`
- ✅ Check that client tools are registered in your ElevenLabs agent
- ✅ Ensure microphone permissions are granted
- ✅ Check browser console for connection errors

### Chat not showing messages
- ✅ Ensure voice session is active (click microphone button)
- ✅ Check that `onMessage` callback is receiving data
- ✅ Use `window.chatDebug` helpers for testing:
  ```javascript
  window.chatDebug.addTestMessage('user', 'Hello!')
  window.chatDebug.showChat()
  ```

### Slide sidebar is empty
- ✅ Run `python extract_pdf.py presentation.pdf` to auto-generate titles
- ✅ Or manually edit `modules/slide-titles.js`

## 🌐 Browser Compatibility

| Browser | Status |
|---------|--------|
| Chrome/Edge | ✅ Fully supported |
| Firefox | ✅ Fully supported |
| Safari | ✅ Fully supported |
| Mobile browsers | ✅ Responsive design |

## 🤝 Contributing

Contributions welcome! This is designed to be a clean, reusable base for AI-powered presentations.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

Feel free to use this in your own projects!

## 🙏 Credits

- Built with [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla
- Voice AI powered by [ElevenLabs](https://elevenlabs.io/)
- PDF extraction using [pdfplumber](https://github.com/jsvine/pdfplumber)

## 💬 Support

For issues or questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review browser console for errors (F12)
3. Verify ElevenLabs agent configuration
4. Open an issue on GitHub

---

**Enjoy your AI-powered presentations!** 🎤📊✨
