const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const textCleaningService = require('../textCleaning.service');

class DocumentProcessorService {
  /**
   * Normalizes raw extracted text (whitespace, control chars)
   */
  normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove non-printable control characters
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Collapse excessive blank lines
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  /**
   * Extract raw text from document file
   * @param {string} filePath Absolute path to local file
   * @param {string} fileType 'PDF' | 'DOCX' | 'PPTX'
   */
  async extractText(filePath, fileType) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Document file not found at path: ${filePath}`);
    }

    let rawText = '';
    const fileBuffer = await fs.promises.readFile(filePath);

    try {
      if (fileType === 'PDF') {
        try {
          const pdfParse = require('pdf-parse');
          const parseFn = typeof pdfParse === 'function' ? pdfParse : (pdfParse && pdfParse.default ? pdfParse.default : null);
          if (typeof parseFn === 'function') {
            const pdfData = await parseFn(fileBuffer);
            rawText = pdfData.text || '';
          } else {
            // Do NOT fall back to raw buffer toString for PDF — it produces binary garbage
            throw new Error('pdf-parse module unavailable — cannot safely extract PDF text');
          }
        } catch (pdfErr) {
          // If pdf-parse itself fails (not just unavailable), try limited safe extraction
          // Only use UTF-8 decode as last resort, with aggressive cleaning
          const rawBuffer = fileBuffer.toString('latin1');
          // Extract only text-looking segments from the raw PDF data
          const textMatches = rawBuffer.match(/BT\s+([\s\S]*?)\s+ET/g) || [];
          if (textMatches.length > 0) {
            // Pull out Tj/TJ string operators from PDF content streams
            const extracted = textMatches
              .join(' ')
              .replace(/\(([^)]*)\)\s*Tj/g, '$1 ')
              .replace(/\[([^\]]*)\]\s*TJ/g, (m, inner) => {
                return inner.replace(/\(([^)]*)\)/g, '$1').replace(/-?\d+/g, ' ') + ' ';
              })
              .replace(/[^a-zA-Z0-9\s.,;:!?'"()\-\u00C0-\u024F]/g, ' ');
            rawText = extracted;
          } else {
            // Complete failure — throw rather than store garbage
            const error = new Error(`PDF text extraction failed: ${pdfErr.message}. Please re-export as DOCX or PPTX.`);
            error.statusCode = 422;
            error.code = 'PDF_EXTRACTION_FAILED';
            throw error;
          }
        }
      } else if (fileType === 'DOCX') {
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        rawText = docxResult.value || '';
      } else if (fileType === 'PPTX') {
        rawText = await this.extractPptxText(fileBuffer);
      } else {
        rawText = fileBuffer.toString('utf-8');
      }
    } catch (err) {
      if (err.code === 'PDF_EXTRACTION_FAILED') throw err;
      console.warn(`Extraction error for ${fileType} file:`, err.message);
      const error = new Error(`Failed to extract text from ${fileType} file: ${err.message}`);
      error.statusCode = 422;
      error.code = 'UNREADABLE_DOCUMENT';
      throw error;
    }

    // Apply text normalization
    const normalized = this.normalizeText(rawText);

    // Apply deep PDF artifact cleaning
    const cleaned = textCleaningService.cleanExtractedText(normalized);

    if (!cleaned || cleaned.length < 50) {
      const error = new Error(
        'Unable to extract sufficient readable text from this document. ' +
        'The file may be image-based, password-protected, or contain only non-text content.'
      );
      error.statusCode = 422;
      error.code = 'UNREADABLE_DOCUMENT';
      throw error;
    }

    console.log(`[TEXT_CLEAN] originalLength=${normalized.length} cleanedLength=${cleaned.length} ratio=${(cleaned.length/Math.max(1,normalized.length)).toFixed(2)}`);

    return {
      text: cleaned,
      length: cleaned.length,
    };
  }

  /**
   * Extracts text slide-by-slide from a PPTX file buffer using JSZip XML parsing
   * @param {Buffer} fileBuffer
   */
  async extractPptxText(fileBuffer) {
    try {
      const JSZip = require('jszip');
      const zip = await JSZip.loadAsync(fileBuffer);

      const slideFiles = Object.keys(zip.files).filter((fileName) =>
        /^ppt\/slides\/slide\d+\.xml$/i.test(fileName)
      );

      if (slideFiles.length === 0) {
        throw new Error('No valid slide XML files found in PPTX presentation archive.');
      }

      slideFiles.sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0], 10);
        const numB = parseInt(b.match(/\d+/)[0], 10);
        return numA - numB;
      });

      const slideTexts = [];
      for (let i = 0; i < slideFiles.length; i++) {
        const slidePath = slideFiles[i];
        const xmlText = await zip.files[slidePath].async('string');

        const textMatches = xmlText.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
        const slideText = textMatches
          .map((tag) => tag.replace(/<[^>]+>/g, '').trim())
          .filter(Boolean)
          .join(' ');

        if (slideText) {
          slideTexts.push(`[Slide ${i + 1}] ${slideText}`);
        }
      }

      const fullPptxText = slideTexts.join('\n\n');
      if (!fullPptxText || fullPptxText.trim().length === 0) {
        throw new Error('PPTX presentation contains no extractable text content on slides.');
      }

      return fullPptxText;
    } catch (err) {
      throw new Error(`PPTX Parsing Error: ${err.message}`);
    }
  }

  /**
   * Splits cleaned text into deterministic chunks with overlap.
   * Filters out chunks that fail the meaningfulness quality check.
   * @param {string} text Cleaned document text
   * @param {object} options { chunkSize: 200, overlapSize: 30 }
   * @returns {Array<{chunkIndex: number, text: string, tokenCount: number}>}
   */
  chunkText(text, options = {}) {
    const chunkSize = options.chunkSize || 200; // Words per chunk
    const overlapSize = options.overlapSize || 30; // Overlapping words

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    const rawChunks = [];
    let chunkIndex = 0;
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const chunkWords = words.slice(start, end);
      const chunkText = chunkWords.join(' ');

      rawChunks.push({
        chunkIndex,
        text: chunkText,
        tokenCount: chunkWords.length,
      });

      chunkIndex++;
      if (end >= words.length) break;
      start += chunkSize - overlapSize;
    }

    // Filter chunks that are mostly PDF garbage
    const { goodChunks, rejectedCount, rejectedReasons } = textCleaningService.filterMeaningfulChunks(rawChunks);

    if (rejectedCount > 0) {
      console.warn(`[CHUNK_QUALITY_FILTER] Rejected ${rejectedCount}/${rawChunks.length} low-quality chunks.`);
      if (rejectedReasons.length <= 5) {
        console.warn('[CHUNK_QUALITY_FILTER] Reasons:', rejectedReasons);
      }
    }

    // Re-index accepted chunks sequentially
    return goodChunks.map((c, i) => ({ ...c, chunkIndex: i }));
  }
}

module.exports = new DocumentProcessorService();
