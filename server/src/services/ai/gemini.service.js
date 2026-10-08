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
   * Cleans JSON output wrapped in markdown code blocks or containing surrounding text
   */
  cleanJsonOutput(rawResponse) {
    if (!rawResponse || typeof rawResponse !== 'string') return '';
    let cleaned = rawResponse.trim();
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) {
      cleaned = match[1].trim();
    }
    return cleaned;
  }

  /**
   * Formats error message for user-facing responses without exposing raw URLs or credentials
   */
  formatUserFacingError(err, targetModel) {
    let rawMsg = err?.message || 'Model error';

    if (err?.code === 'GEMINI_RATE_LIMIT' || rawMsg.includes('429') || rawMsg.toLowerCase().includes('quota')) {
      const apiError = new Error(
        `Gemini API Daily Free Tier Quota Exceeded (20 requests/day limit reached for model ${targetModel}). Please update GEMINI_API_KEY in server/.env with a valid API key or try again after quota reset.`
      );
      apiError.statusCode = 429;
      apiError.code = 'GEMINI_RATE_LIMIT';
      return apiError;
    }

    if (err?.code === 'GEMINI_AUTH_ERROR' || rawMsg.includes('401') || rawMsg.includes('403')) {
      const apiError = new Error(
        'Invalid or unauthenticated GEMINI_API_KEY. Please verify key configuration in server/.env.'
      );
      apiError.statusCode = 401;
      apiError.code = 'GEMINI_AUTH_ERROR';
      return apiError;
    }

    // Strip raw URLs and SDK prefixes for general errors
    rawMsg = rawMsg.replace(/https?:\/\/[^\s]+/g, '').replace(/\[GoogleGenerativeAI Error\]:?/gi, '').trim();

    const apiError = new Error(`AI Question Generation (${targetModel}): ${rawMsg}`);
    apiError.statusCode = err?.statusCode || 502;
    apiError.code = err?.code || 'GEMINI_API_ERROR';
    return apiError;
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

    const targetModel = process.env.GEMINI_GENERATION_MODEL || aiConfig.geminiGenerationModel || 'gemini-3.5-flash-lite';

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
1. Every question MUST test academic subject matter, domain concepts, definitions, formulas, or problem-solving.
2. ABSOLUTELY DO NOT generate questions about source file names, slide titles in filenames, document file formats (.pdf, .pptx, .docx), PDF object IDs, chunk numbers, or source metadata.
   - BAD: "What unit number is mentioned in the filename?"
   - GOOD: "What is the primary time complexity of Merge Sort?"
3. Target Difficulty: ${difficulty}.
4. Allowed Question Types: [${typesStr}] (Supported: MCQ, TRUE_FALSE, SHORT_ANSWER).
5. Topic Focus: ${topic}.
6. For MCQ questions, provide exactly 4 clear options. Make sure one option matches "correctAnswer" exactly.
7. For TRUE_FALSE questions, provide options ["True", "False"] and set "correctAnswer" to "True" or "False".
8. For SHORT_ANSWER questions, set options to [] and provide a clear sample model answer in "correctAnswer".
9. Output MUST be valid JSON conforming EXACTLY to this schema with NO extra commentary or markdown:

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

    const candidateModels = Array.from(
      new Set([
        targetModel,
        ...(aiConfig.fallbackGenerationModels || []),
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
      ])
    );

    let lastError = null;

    for (const modelName of candidateModels) {
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const jsonText = this.cleanJsonOutput(responseText);
          const parsed = JSON.parse(jsonText);

          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            const validQuestions = parsed.questions
              .filter((q) => q && (q.questionText || q.text))
              .map((q) => {
                const qType = ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'].includes(q.type) ? q.type : (questionTypes[0] || 'MCQ');
                let options = Array.isArray(q.options) ? q.options.map((opt) => String(opt).trim()) : [];
                if (qType === 'TRUE_FALSE' && options.length === 0) {
                  options = ['True', 'False'];
                }
                let correctAnswer = String(q.correctAnswer || (options[0] || '')).trim();
                if (qType === 'MCQ' && options.length > 0 && !options.includes(correctAnswer)) {
                  options[0] = correctAnswer;
                }
                return {
                  type: qType,
                  questionText: String(q.questionText || q.text).trim(),
                  options,
                  correctAnswer,
                  explanation: String(q.explanation || 'Based on provided material.').trim(),
                  difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(q.difficulty?.toUpperCase()) ? q.difficulty.toUpperCase() : difficulty,
                  topic: String(q.topic || topic || 'General').trim(),
                };
              });

            if (validQuestions.length > 0) {
              return validQuestions;
            }
          }
          const err = new Error('Gemini API response did not contain a valid non-empty questions array.');
          err.statusCode = 502;
          err.code = 'MALFORMED_AI_OUTPUT';
          throw err;
        } catch (err) {
          lastError = err;
          const errMsg = err.message || '';
          const isTransient = errMsg.includes('503') || errMsg.toLowerCase().includes('high demand');

          if (isTransient && attempt < maxRetries) {
            const backoffMs = attempt * 2000;
            console.warn(`Gemini model "${modelName}" hit transient 503 (attempt ${attempt}/${maxRetries}). Retrying in ${backoffMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }

          console.warn(`Gemini generation model "${modelName}" failed:`, err.message);

          let statusCode = 502;
          let errorCode = 'GEMINI_API_ERROR';

          if (errMsg.includes('401') || errMsg.includes('403') || errMsg.toLowerCase().includes('api key') || errMsg.toLowerCase().includes('unauthorized')) {
            statusCode = 401;
            errorCode = 'GEMINI_AUTH_ERROR';
          } else if (errMsg.includes('404') || errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('no longer available')) {
            statusCode = 404;
            errorCode = 'GEMINI_MODEL_NOT_FOUND';
          } else if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit')) {
            statusCode = 429;
            errorCode = 'GEMINI_RATE_LIMIT';
          } else if (errMsg.includes('500') || errMsg.includes('503') || errMsg.toLowerCase().includes('service unavailable')) {
            statusCode = 502;
            errorCode = 'GEMINI_SERVICE_ERROR';
          }

          err.statusCode = statusCode;
          err.code = errorCode;

          if (err.code === 'MALFORMED_AI_OUTPUT' || err.code === 'GEMINI_AUTH_ERROR') {
            throw this.formatUserFacingError(err, modelName);
          }
          break; // Try next model in candidateModels if rate limit or model unavailable
        }
      }
    }

    throw this.formatUserFacingError(lastError, targetModel);
  }
}

module.exports = new GeminiService();
