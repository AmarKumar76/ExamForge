const embeddingService = require('../../src/services/ai/embedding.service');

describe('EmbeddingService Unit Tests', () => {
  describe('cosineSimilarity', () => {
    it('should compute exact 1.0 similarity for identical vectors', () => {
      const vec = [0.1, 0.2, 0.3, 0.4];
      const similarity = embeddingService.cosineSimilarity(vec, vec);
      expect(similarity).toBeCloseTo(1.0);
    });

    it('should compute 0.0 similarity for orthogonal vectors', () => {
      const vecA = [1, 0, 0];
      const vecB = [0, 1, 0];
      const similarity = embeddingService.cosineSimilarity(vecA, vecB);
      expect(similarity).toBe(0);
    });

    it('should return 0 for empty or invalid vectors', () => {
      expect(embeddingService.cosineSimilarity([], [])).toBe(0);
      expect(embeddingService.cosineSimilarity(null, [1, 2])).toBe(0);
    });
  });

  describe('generateEmbedding', () => {
    it('should throw error when empty text is passed', async () => {
      await expect(embeddingService.generateEmbedding('')).rejects.toThrow('Text content is required');
    });

    it('should handle API key configuration error if key missing', async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      await expect(embeddingService.generateEmbedding('Sample text')).rejects.toThrow('GEMINI_API_KEY is not configured');
      process.env.GEMINI_API_KEY = originalKey;
    });
  });
});
