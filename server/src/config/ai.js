/**
 * ExamForge AI Service Configuration
 * Central source of truth for Gemini model selection, API key loading, and embedding defaults.
 */
const aiConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiGenerationModel: process.env.GEMINI_GENERATION_MODEL || 'gemini-3.5-flash',
  fallbackGenerationModels: [
    process.env.GEMINI_GENERATION_MODEL || 'gemini-3.5-flash',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-2.5-flash',
  ],
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
};

module.exports = aiConfig;
