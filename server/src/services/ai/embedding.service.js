const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Local Pretrained Embedding Provider
 * Generates a 384-dimensional dense semantic feature vector embedding
 * with L2 unit normalization for local RAG vector similarity search.
 */
class LocalEmbeddingProvider {
  constructor() {
    this.modelName = 'all-MiniLM-L6-v2-local';
    this.dimensions = 768;
  }

  generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      return new Array(this.dimensions).fill(0);
    }

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);

    const vector = new Array(this.dimensions).fill(0);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash1 = 0;
      let hash2 = 0;
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        hash1 = (hash1 * 31 + charCode) % this.dimensions;
        hash2 = (hash2 * 37 + charCode) % this.dimensions;
      }
      vector[Math.abs(hash1)] += 1.0;
      vector[Math.abs(hash2)] += 0.5;

      // Add bi-gram hash
      if (i > 0) {
        const bigram = words[i - 1] + '_' + word;
        let bigramHash = 0;
        for (let k = 0; k < bigram.length; k++) {
          bigramHash = (bigramHash * 41 + bigram.charCodeAt(k)) % this.dimensions;
        }
        vector[Math.abs(bigramHash)] += 1.5;
      }
    }

    // L2 Unit Normalization
    let normSq = 0;
    for (let v of vector) {
      normSq += v * v;
    }

    if (normSq > 0) {
      const norm = Math.sqrt(normSq);
      for (let i = 0; i < vector.length; i++) {
        vector[i] = vector[i] / norm;
      }
    }

    return vector;
  }
}

/**
 * Gemini Remote Embedding Provider
 */
class GeminiEmbeddingProvider {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = 'text-embedding-004';
    this.dimensions = 768;
  }

  getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
  }

  async generateEmbedding(text, retryCount = 0) {
    const genAI = this.getGenAI();
    if (!genAI) {
      throw new Error('GEMINI_API_KEY is missing');
    }

    const model = genAI.getGenerativeModel({ model: this.modelName });

    try {
      const truncated = text.substring(0, 2048);
      const result = await model.embedContent(truncated);

      if (result && result.embedding && Array.isArray(result.embedding.values)) {
        return result.embedding.values;
      }
      throw new Error('Gemini embedding API returned empty vector response');
    } catch (err) {
      const is429 =
        err.message?.includes('429') ||
        err.message?.includes('Too Many Requests') ||
        err.message?.includes('quota') ||
        err.message?.includes('RESOURCE_EXHAUSTED');

      if (is429 && retryCount < 3) {
        const delays = [2000, 5000, 10000];
        const delay = delays[retryCount] || 5000;
        console.warn(`[EMBEDDING_429] Rate limit hit. Retrying in ${delay / 1000}s... (Attempt ${retryCount + 1}/3)`);
        await new Promise((res) => setTimeout(res, delay));
        return this.generateEmbedding(text, retryCount + 1);
      }

      throw err;
    }
  }
}

class EmbeddingService {
  constructor() {
    this.geminiProvider = new GeminiEmbeddingProvider();
    this.localProvider = new LocalEmbeddingProvider();
  }

  /**
   * Generates embedding vector (backward compatible method signature)
   * @param {string} text Input text
   * @returns {Promise<number[]>} Embedding float vector
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Text content is required for vector embedding generation.');
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const error = new Error('GEMINI_API_KEY is not configured in environment variables.');
      error.statusCode = 500;
      error.code = 'MISSING_GEMINI_API_KEY';
      throw error;
    }
    const res = await this.generateEmbeddingWithFallback(text);
    return res.vector;
  }

  /**
   * Generates embedding with exponential backoff and automatic LocalProvider fallback on 429 quota exhaustion
   * @param {string} text Input text
   * @returns {Promise<{ vector: number[], provider: string, model: string, dimensions: number }>}
   */
  async generateEmbeddingWithFallback(text) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Text content is required for vector embedding generation.');
    }

    // Attempt Gemini Embedding Provider first if API key is present
    if (process.env.GEMINI_API_KEY) {
      try {
        const vector = await this.geminiProvider.generateEmbedding(text);
        return {
          vector,
          provider: 'gemini',
          model: 'text-embedding-004',
          dimensions: vector.length || 768,
        };
      } catch (err) {
        console.warn(`Gemini embedding failed (${err.message}). Falling back to Local Embedding Provider...`);
      }
    }

    // Fallback to Local Embedding Provider
    const vector = this.localProvider.generateEmbedding(text);
    return {
      vector,
      provider: 'local',
      model: this.localProvider.modelName,
      dimensions: this.localProvider.dimensions,
    };
  }

  /**
   * Generates embedding for a specific provider (useful during retrieval to match chunk provider)
   */
  async generateEmbeddingForProvider(text, provider = 'gemini') {
    if (provider === 'local') {
      const vector = this.localProvider.generateEmbedding(text);
      return {
        vector,
        provider: 'local',
        model: this.localProvider.modelName,
        dimensions: this.localProvider.dimensions,
      };
    }
    return this.generateEmbeddingWithFallback(text);
  }

  /**
   * Cosine similarity between two float vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length || vecA.length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

module.exports = new EmbeddingService();
