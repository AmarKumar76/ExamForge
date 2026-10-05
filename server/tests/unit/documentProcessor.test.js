const documentProcessorService = require('../../src/services/ai/documentProcessor.service');
const JSZip = require('jszip');

describe('DocumentProcessor Service Unit Tests', () => {
  describe('normalizeText', () => {
    it('should strip control characters and normalize extra spaces', () => {
      const rawText = 'Hello \r\n World!\x00   This is  a test sentence.\n\n\nNext section.';
      const normalized = documentProcessorService.normalizeText(rawText);
      expect(normalized).toBe('Hello \n World! This is a test sentence.\n\nNext section.');
    });

    it('should handle empty input safely', () => {
      expect(documentProcessorService.normalizeText(null)).toBe('');
      expect(documentProcessorService.normalizeText('')).toBe('');
    });
  });

  describe('chunkText', () => {
    it('should chunk text into specified word windows with overlap', () => {
      const words = Array.from({ length: 500 }, (_, i) => `word${i + 1}`).join(' ');
      const chunks = documentProcessorService.chunkText(words, { chunkSize: 100, overlapSize: 20 });

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].chunkIndex).toBe(0);
      expect(chunks[0].tokenCount).toBe(100);
      expect(chunks[0].text.startsWith('word1')).toBe(true);
      expect(chunks[1].text.includes('word81')).toBe(true);
    });

    it('should return empty array for empty text', () => {
      const chunks = documentProcessorService.chunkText('');
      expect(chunks).toEqual([]);
    });
  });

  describe('extractPptxText', () => {
    it('should parse valid PPTX zip structure slide by slide', async () => {
      const zip = new JSZip();
      zip.file('ppt/slides/slide1.xml', '<p><a:t>Operating Systems Introduction</a:t></p>');
      zip.file('ppt/slides/slide2.xml', '<p><a:t>Process Scheduling Concepts</a:t></p>');
      const buffer = await zip.generateAsync({ type: 'nodebuffer' });

      const text = await documentProcessorService.extractPptxText(buffer);
      expect(text).toContain('[Slide 1] Operating Systems Introduction');
      expect(text).toContain('[Slide 2] Process Scheduling Concepts');
    });

    it('should throw clear error on malformed or non-zip PPTX file', async () => {
      const invalidBuffer = Buffer.from('not a zip file');
      await expect(documentProcessorService.extractPptxText(invalidBuffer)).rejects.toThrow('PPTX Parsing Error');
    });
  });
});
