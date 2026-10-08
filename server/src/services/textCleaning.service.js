/**
 * ExamForge Text Cleaning Service
 *
 * Cleans extracted document text to remove PDF binary artifacts, object streams,
 * encoding garbage, and other extraction noise BEFORE chunking/embedding/Gemini.
 *
 * Preserves legitimate educational content including:
 * - Mathematical notation and formulas
 * - Algorithm pseudocode
 * - Numbered lists and definitions
 * - Normal punctuation and academic prose
 */

class TextCleaningService {
  /**
   * PDF internal object/stream keywords that indicate binary garbage lines
   */
  static PDF_SYNTAX_KEYWORDS = [
    'endobj',
    'startxref',
    'endstream',
    '%%EOF',
    'BitsPerComponent',
    'BaseFont',
    'FontDescriptor',
    'FontBBox',
    'FontMatrix',
    'FontFile',
    'StemV',
    'CapHeight',
    'Ascent',
    'Descent',
    'ItalicAngle',
    'CharSet',
    'Encoding',
    '/Catalog',
    '/Pages',
    '/MediaBox',
    '/CropBox',
    '/Resources',
    '/ProcSet',
    '/ColorSpace',
    '/ExtGState',
    '/XObject',
    '/Subtype',
    '/Filter',
    '/DCTDecode',
    '/FlateDecode',
    '/LZWDecode',
    '/ASCII85Decode',
    '/Predictor',
    '/ImageMask',
    '/DeviceGray',
    '/DeviceRGB',
    '/DeviceCMYK',
    'obj <<',
    '<< /Type',
    '/Length ',
    'stream\r',
    'stream\n',
    'xref\n',
    'trailer\n',
    '/Creator',
    '/Producer',
    '/ModDate',
    '/CreationDate',
    '/StructTreeRoot',
    '/MarkInfo',
    '/ViewerPreferences',
    'obj\n',
    'obj\r',
  ];

  /**
   * Patterns that clearly indicate PDF binary/encoding artifacts
   */
  static PDF_ARTIFACT_PATTERNS = [
    /^\s*\d+\s+\d+\s+obj\s*$/m,
    /\b([0-9A-Fa-f]{2}){8,}\b/g,
    /\bstream\b|\bendstream\b|\bendobj\b|\bxref\b|\btrailer\b|\bstartxref\b/gi,
    /(?:\b\d{2,4}\s+){5,}\d{2,4}\b/g,
    /[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]{1,}/g,
    /<<\s*\/\w+/g,
    /\/\w+\s+\d+\s+\d+\s+R/g,
    /\(|\(|\(/g,
  ];

  /**
   * Main cleaning pipeline applied to extracted raw text
   * @param {string} rawText Raw extracted text from PDF/DOCX/PPTX
   * @returns {string} Cleaned, human-readable text
   */
  cleanExtractedText(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';

    let text = rawText;

    // Step 1: Remove null bytes and non-printable control chars & replacement glyphs
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD]/g, ' ');

    // Step 2: Scrub common PDF binary artifact patterns like "( ("
    text = text.replace(/(?:\(+|\(+)/g, ' ');

    // Step 3: Remove PDF object reference patterns ("73 0 obj", "73 0 R", etc.)
    text = text.replace(/\b\d+\s+\d+\s+(obj|R)\b/gi, '');

    // Step 4: Remove PDF stream markers
    text = text.replace(/\b(stream|endstream|endobj|xref|trailer|startxref)\b\s*/gi, '');

    // Step 5: Remove PDF dictionary/operator blocks (lines starting with << or containing /Type)
    text = text.replace(/<<[^>]{0,200}>>/g, '');
    text = text.replace(/^.*\/(?:Type|Subtype|Filter|Length|Width|Height|BitsPerComponent|ColorSpace|Encoding|BaseFont|FontDescriptor|FontBBox|FontMatrix|Widths|FirstChar|LastChar|CIDToGIDMap|Registry|Ordering|Supplement|DW|W|DescendantFonts|ToUnicode|Differences|CharSet|StemV|CapHeight|Ascent|Descent|ItalicAngle|FontFile\d?)\b.*$/gm, '');

    // Step 6: Remove lines that are pure PDF syntax keywords
    const keywordPattern = TextCleaningService.PDF_SYNTAX_KEYWORDS.map((k) =>
      k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('|');
    text = text.replace(new RegExp(`^.*(${keywordPattern}).*$`, 'gmi'), '');

    // Step 7: Remove long numeric sequences (PDF coordinate/encoding tables)
    text = text.replace(/^(\s*-?\d+\.?\d*\s+){4,}-?\d+\.?\d*\s*$/gm, '');

    // Step 8: Remove hex blob sequences
    text = text.replace(/\b[0-9A-Fa-f]{16,}\b/g, '');

    // Step 9: Remove lines with very low signal (mostly symbols or single chars)
    text = text.replace(/^[^a-zA-Z0-9\u0900-\u097F]{3,}$/gm, '');

    // Step 10: Collapse excessive blank lines & spaces
    text = text.replace(/\r\n/g, '\n');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]{2,}/g, ' ');

    // Step 11: Trim each line
    text = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

    return text.trim();
  }

  /**
   * Checks whether a text chunk contains meaningful educational content
   * Returns true if chunk is worth storing/embedding/sending to Gemini
   * @param {string} text Chunk text to evaluate
   * @returns {{ meaningful: boolean, reason: string, score: number }}
   */
  isMeaningfulText(text) {
    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return { meaningful: false, reason: 'TOO_SHORT', score: 0 };
    }

    const trimmed = text.trim();
    const totalChars = trimmed.length;

    // Check for replacement characters or binary glyph runs
    if (/[\uFFFD\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(trimmed) || trimmed.includes('(')) {
      return { meaningful: false, reason: 'CONTAINS_BINARY_GARBAGE', score: 0 };
    }

    // Count printable letters
    const letterCount = (trimmed.match(/[a-zA-Z\u00C0-\u024F\u0900-\u097F]/g) || []).length;
    const digitCount = (trimmed.match(/\d/g) || []).length;
    const punctCount = (trimmed.match(/[.,;:!?'"()\-]/g) || []).length;
    const pdfSymbolCount = (trimmed.match(/[<>{}[\]\\\/|@#$%^&*~`]/g) || []).length;

    const letterRatio = letterCount / totalChars;
    const pdfSymbolRatio = pdfSymbolCount / totalChars;
    const digitRatio = digitCount / totalChars;

    const hasPdfKeywords = TextCleaningService.PDF_SYNTAX_KEYWORDS.some((kw) =>
      trimmed.toLowerCase().includes(kw.toLowerCase())
    );

    const words = trimmed.match(/[a-zA-Z]{2,}/g) || [];
    const wordCount = words.length;

    if (letterRatio < 0.35) {
      return { meaningful: false, reason: 'LOW_LETTER_RATIO', score: letterRatio };
    }

    if (pdfSymbolRatio > 0.12) {
      return { meaningful: false, reason: 'HIGH_PDF_SYMBOL_RATIO', score: pdfSymbolRatio };
    }

    if (digitRatio > 0.5 && letterRatio < 0.35) {
      return { meaningful: false, reason: 'MOSTLY_NUMBERS', score: digitRatio };
    }

    if (hasPdfKeywords) {
      return { meaningful: false, reason: 'PDF_SYNTAX_DETECTED', score: 0 };
    }

    if (wordCount < 5) {
      return { meaningful: false, reason: 'TOO_FEW_WORDS', score: wordCount };
    }

    const score = Math.min(1, letterRatio * 0.6 + (wordCount / 100) * 0.3 + (punctCount / totalChars) * 0.1);
    return { meaningful: true, reason: 'OK', score };
  }

  /**
   * Sanitizes a source snippet for safe display in UI/API responses
   * Returns empty or fallback message if source data is corrupted or low quality
   * @param {string} snippet Raw source excerpt
   * @param {number} maxLength Maximum characters to show
   * @returns {string} Clean, human-readable excerpt
   */
  sanitizeSourceSnippet(snippet, maxLength = 200) {
    if (!snippet || typeof snippet !== 'string') return '';

    const cleaned = this.cleanExtractedText(snippet);
    const { meaningful } = this.isMeaningfulText(cleaned);

    if (!meaningful || cleaned.length < 15) {
      return 'Source excerpt unavailable';
    }

    return cleaned.length > maxLength ? cleaned.substring(0, maxLength).trim() + '...' : cleaned.trim();
  }

  /**
   * Filters a batch of chunks, keeping only meaningful ones
   * @param {Array<{chunkIndex: number, text: string, tokenCount: number}>} chunks
   * @returns {{ goodChunks: Array, rejectedCount: number, rejectedReasons: string[] }}
   */
  filterMeaningfulChunks(chunks) {
    const goodChunks = [];
    const rejectedReasons = [];
    let rejectedCount = 0;

    for (const chunk of chunks) {
      const cleanedText = this.cleanExtractedText(chunk.text);
      const { meaningful, reason } = this.isMeaningfulText(cleanedText);

      if (meaningful) {
        goodChunks.push({ ...chunk, text: cleanedText });
      } else {
        rejectedCount++;
        rejectedReasons.push(`chunk[${chunk.chunkIndex}]: ${reason}`);
      }
    }

    return { goodChunks, rejectedCount, rejectedReasons };
  }

  /**
   * Validates whether a question appears to be based on filename, file structure, or PDF metadata
   * Returns true if the question should be REJECTED
   * @param {string} questionText
   * @param {string[]} sourceFileNames
   * @returns {{ rejected: boolean, reason: string }}
   */
  isFilenameOrMetadataQuestion(questionText, sourceFileNames = []) {
    if (!questionText || typeof questionText !== 'string') return { rejected: false, reason: 'EMPTY' };

    const qLower = questionText.toLowerCase();

    const metadataPatterns = [
      /\b(?:filename|file name|file-name|file extension|file format)\b/i,
      /\b(?:source chunk id|material id|chunk id)\b/i,
      /\b(?:\.pdf|\.docx|\.pptx|pdf format|docx format|pptx format)\b/i,
      /unit \d+.*mentioned.*filename/i,
      /unit number.*referenced in the source/i,
      /what unit number is referenced/i,
      /mentioned in.*file name/i,
      /referred to in.*document name/i,
      /stream length|stream decoding|pdf object|obj \d+|endobj|bitspercomponent/i,
      /document format|prefix label|source context title|source header|source chunk's filename/i,
      /what symbol is used to separate.*word/i,
      /alongside the introduction in the source chunk/i,
    ];

    for (const pat of metadataPatterns) {
      if (pat.test(qLower)) {
        return { rejected: true, reason: 'METADATA_QUESTION_PATTERN' };
      }
    }

    if (sourceFileNames.length > 0) {
      const filenameWords = sourceFileNames
        .join(' ')
        .toLowerCase()
        .replace(/[_\-\.]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 4 && !['slide', 'unit', 'introduction', 'google', 'drive', 'course'].includes(w));

      const qWords = qLower.split(/\s+/).filter((w) => w.length > 4);
      if (qWords.length > 0) {
        const filenameWordHits = qWords.filter((w) => filenameWords.includes(w)).length;
        if (filenameWordHits / qWords.length > 0.5) {
          return { rejected: true, reason: 'FILENAME_BASED_QUESTION' };
        }
      }
    }

    return { rejected: false, reason: 'OK' };
  }
}

module.exports = new TextCleaningService();

