const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiConfig = require('../../config/ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * Cleans JSON output wrapped in markdown code blocks
   */
  cleanJsonOutput(rawResponse) {
    if (!rawResponse || typeof rawResponse !== 'string') return '';
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '');
    }
    return cleaned.trim();
  }

  /**
   * Generates grounded assessment questions using real Gemini API
   * @param {string} contextText Combined text from retrieved RAG chunks
   * @param {object} config { numberOfQuestions, difficulty, questionTypes, topic }
   */
  async generateQuestions(contextText, config = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const error = new Error('GEMINI_API_KEY is not configured in server environment variables. Cannot generate AI questions.');
      error.statusCode = 500;
      error.code = 'MISSING_GEMINI_API_KEY';
      throw error;
    }

    if (!this.genAI || this.apiKey !== apiKey) {
      this.apiKey = apiKey;
      this.genAI = new GoogleGenerativeAI(apiKey);
    }

    const targetModel = process.env.GEMINI_GENERATION_MODEL || aiConfig.geminiGenerationModel || 'gemini-3.5-flash';

    console.log('[AI_MODEL_CONFIG]', {
      provider: 'gemini',
      generationModel: targetModel,
      sdkVersion: '@google/generative-ai/0.24.1',
    });

    const {
      numberOfQuestions = 3,
      difficulty = 'MEDIUM',
      questionTypes = ['MCQ'],
      topic = 'General',
    } = config;

    const typesStr = questionTypes.join(', ');

    const prompt = `You are ExamForge AI, an expert educational assessment author.
Generate exactly ${numberOfQuestions} high-quality assessment questions grounded STRICTLY in the course material context provided below.

RULES:
1. Every question MUST be directly derived from and grounded ONLY in the provided SOURCE CONTEXT. Do not invent external facts.
2. Target Difficulty: ${difficulty}.
3. Allowed Question Types: [${typesStr}] (Supported: MCQ, TRUE_FALSE, SHORT_ANSWER).
4. Topic Focus: ${topic}.
5. For MCQ questions, provide exactly 4 clear options. Make sure one option matches "correctAnswer" exactly.
6. For TRUE_FALSE questions, provide options ["True", "False"] and set "correctAnswer" to "True" or "False".
7. For SHORT_ANSWER questions, set options to [] and provide a clear sample model answer in "correctAnswer".
8. Output MUST be valid JSON conforming EXACTLY to this schema with NO extra commentary or markdown:

{
  "questions": [
    {
      "type": "MCQ",
      "questionText": "Question statement here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Explanation grounded in context.",
      "difficulty": "${difficulty}",
      "topic": "${topic}"
    }
  ]
}

SOURCE CONTEXT:
${contextText.substring(0, 8000)}
`;

    const candidateModels = [
      targetModel,
      ...aiConfig.fallbackGenerationModels.filter((m) => m !== targetModel),
    ];

    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonText = this.cleanJsonOutput(responseText);
        const parsed = JSON.parse(jsonText);

        if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return parsed.questions;
        }
        const err = new Error('Gemini API response did not contain a valid non-empty questions array.');
        err.statusCode = 502;
        err.code = 'MALFORMED_AI_OUTPUT';
        throw err;
      } catch (err) {
        lastError = err;
        console.warn(`Gemini generation model "${modelName}" failed:`, err.message);
        if (err.statusCode === 502 && err.code === 'MALFORMED_AI_OUTPUT') {
          throw err;
        }
      }
    }

    const apiError = new Error(`AI question generation is temporarily unavailable. Please verify Gemini API configuration/model availability. (${lastError?.message || 'Model error'})`);
    apiError.statusCode = 502;
    apiError.code = 'GEMINI_API_ERROR';
    throw apiError;
  }
}

module.exports = new GeminiService();
