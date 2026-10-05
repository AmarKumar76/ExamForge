const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

class DocumentProcessorService {
  /**
   * Normalizes raw extracted text
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
            rawText = fileBuffer.toString('utf-8');
          }
        } catch (pdfErr) {
          rawText = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\t]/g, ' ');
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
      console.warn(`Extraction error for ${fileType} file:`, err.message);
      const error = new Error(`Failed to extract text from ${fileType} file: ${err.message}`);
      error.statusCode = 422;
      error.code = 'UNREADABLE_DOCUMENT';
      throw error;
    }

    const normalized = this.normalizeText(rawText);

    if (!normalized || normalized.length < 10) {
      const error = new Error('Unable to extract readable text content from the document.');
      error.statusCode = 422;
      error.code = 'UNREADABLE_DOCUMENT';
      throw error;
    }

    return {
      text: normalized,
      length: normalized.length,
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
   * Splits normalized text into deterministic chunks with overlap
   * @param {string} text Normalized document text
   * @param {object} options { chunkSize: 250, overlapSize: 40 }
   */
  chunkText(text, options = {}) {
    const chunkSize = options.chunkSize || 200; // Words per chunk
    const overlapSize = options.overlapSize || 30; // Overlapping words

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    const chunks = [];
    let chunkIndex = 0;
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const chunkWords = words.slice(start, end);
      const chunkText = chunkWords.join(' ');

      chunks.push({
        chunkIndex,
        text: chunkText,
        tokenCount: chunkWords.length,
      });

      chunkIndex++;
      if (end >= words.length) break;
      start += chunkSize - overlapSize;
    }

    return chunks;
  }
}

module.exports = new DocumentProcessorService();
