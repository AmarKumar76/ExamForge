const MaterialChunk = require('../../models/MaterialChunk');
const embeddingService = require('./embedding.service');

class RetrieverService {
  /**
   * Retrieves semantically relevant material chunks using vector embedding similarity search
   * @param {object} params { courseId, materialIds, topic, limit }
   * @returns {Promise<Array>} Top-K relevant chunk objects with source metadata
   */
  async retrieveRelevantChunks({ courseId, materialIds = [], topic = '', limit = 8 }) {
    const query = { courseId };

    if (Array.isArray(materialIds) && materialIds.length > 0) {
      const mongoose = require('mongoose');
      const validObjectIds = materialIds
        .filter(Boolean)
        .map((id) => (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id));
      query.materialId = { $in: validObjectIds };
    }

    const chunks = await MaterialChunk.find(query).limit(200);

    if (chunks.length === 0) {
      return [];
    }

    // Determine provider used for stored chunks
    const chunkProvider = chunks[0]?.embeddingProvider || 'gemini';

    // 1. Generate query embedding for input topic/query using matching provider
    let queryVector = null;
    try {
      const queryText = topic && topic.trim() ? topic : 'Core course concepts and principles';
      const embedResult = await embeddingService.generateEmbeddingForProvider(queryText, chunkProvider);
      queryVector = embedResult.vector;
    } catch (err) {
      console.warn('Query embedding generation unavailable, falling back to text scoring for retrieval:', err.message);
    }

    // 2. Score chunks using Cosine Vector Similarity (or keyword scoring fallback if query vector unavailable)
    const topicKeywords = (topic || '')
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2);

    const scoredChunks = chunks.map((chunk) => {
      let similarityScore = 0;

      if (queryVector && Array.isArray(chunk.embedding) && chunk.embedding.length > 0) {
        // Real dense vector cosine similarity calculation
        similarityScore = embeddingService.cosineSimilarity(queryVector, chunk.embedding);
      } else {
        // Fallback text keyword frequency scoring
        let score = 1;
        const lowerText = chunk.text.toLowerCase();
        topicKeywords.forEach((word) => {
          if (lowerText.includes(word)) score += 5;
        });
        similarityScore = score / 10;
      }

      return {
        chunk,
        score: similarityScore,
      };
    });

    // 3. Sort by vector similarity score descending
    scoredChunks.sort((a, b) => b.score - a.score);

    const topChunks = scoredChunks.slice(0, limit).map((item) => ({
      chunkId: item.chunk._id,
      materialId: item.chunk.materialId,
      text: item.chunk.text,
      pageNumber: item.chunk.pageNumber,
      sourceFileName: item.chunk.sourceFileName,
      similarityScore: item.score,
    }));

    return topChunks;
  }
}

module.exports = new RetrieverService();
