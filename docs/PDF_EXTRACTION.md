# PDF Extraction for RAG

The `extract_pdf.py` script extracts text and tables from PDF presentations in a format optimized for RAG (Retrieval-Augmented Generation) systems and AI voice assistants.

## Purpose

This tool is designed to work with the Presentation Viewer's ElevenLabs voice assistant feature. It converts PDF presentations into two essential files:

1. **RAG Content File** (`.txt`) - Text content for the AI assistant
2. **Slide Titles File** (`slide-titles.js`) - Navigation metadata for the sidebar

### Features

- Preserves slide numbers for accurate navigation
- Maintains layout structure for better context
- Extracts tables in a readable format
- Handles image-only slides gracefully
- **Auto-generates slide navigation sidebar** by extracting titles from each slide
- Smart title extraction using multiple heuristics

## Installation

Install the required dependency:

```bash
pip install pdfplumber
```

## Usage

### Basic Usage

```bash
python extract_pdf.py presentation.pdf
```

This creates:
- `presentation_rag_content.txt` - Text content for the AI assistant
- `modules/slide-titles.js` - Navigation sidebar metadata (auto-generated!)

### Specify Output File

```bash
python extract_pdf.py presentation.pdf output.txt
```

### Specify Custom Title

```bash
python extract_pdf.py presentation.pdf output.txt "My Presentation Title"
```

### Skip Slide Navigation Generation

If you want to manually define your slide titles:

```bash
python extract_pdf.py presentation.pdf --no-js-titles
```

## Output Files

### 1. RAG Content File (`.txt`)

The script generates a text file with:

- A header with the presentation title
- Each slide clearly marked with `SLIDE N (Page N of TOTAL)`
- Original text layout preserved
- Tables formatted with pipe separators
- Markers for image-only slides

### 2. Slide Titles File (`slide-titles.js`)

Auto-generated JavaScript module containing:

```javascript
export const SLIDE_TITLES = [
  { page: 1, title: 'Introduction To The Topic' },
  { page: 2, title: 'Key Concepts' },
  { page: 3, title: 'Data Analysis Results' },
  // ... and so on
];
```

This file is automatically placed in `modules/slide-titles.js` and powers the presentation viewer's sidebar navigation.

## How Slide Titles Are Extracted

The script uses smart heuristics to identify slide titles:

1. **All-caps lines** - Common for slide headers (e.g., "INTRODUCTION")
2. **First substantial line** - Skips page numbers and footers
3. **Fallback** - Uses first non-empty line if no obvious title is found

You can always manually edit `modules/slide-titles.js` after generation to refine the titles.

## Integration with Presentation Viewer

1. Extract your PDF presentation:
   ```bash
   python extract_pdf.py your_presentation.pdf
   ```

2. The script automatically generates:
   - RAG content file for your ElevenLabs agent
   - Slide navigation file for the sidebar

3. **That's it!** Your presentation viewer now has:
   - A functioning sidebar with all slide titles
   - An AI assistant that can reference specific slides

## Example Terminal Output

When you run the script, you'll see clear feedback about what's being generated:

```
================================================================================
📄 PDF EXTRACTION STARTED
================================================================================
Input PDF: presentation.pdf
Total pages: 25
Processing...
  [1/25] Introduction To The Topic
  [2/25] Project Overview And Goals
  [3/25] Technical Architecture
  [4/25] Performance Metrics
  ...
  [25/25] Thank You And Questions

================================================================================
✅ EXTRACTION COMPLETE
================================================================================

📝 RAG Content File:
   presentation_rag_content.txt
   → 25 slides extracted
   → Ready for ElevenLabs agent ingestion

🗂️  Slide Navigation File:
   /path/to/presentation_viewer/modules/slide-titles.js
   → 25 slide titles generated
   → Ready for presentation viewer sidebar
   → You can manually edit titles if needed

================================================================================
```

## Tips

- The script preserves layout, so bullet points and indentation are maintained
- Tables are extracted separately for better readability
- Page numbers help the voice assistant direct users to specific slides
- Works best with text-based PDFs (not scanned images)
- **Slide titles are automatically extracted** - check `modules/slide-titles.js` and edit if needed
- The sidebar navigation will work immediately after extraction
