const Course = require('../../models/Course');
const CourseMaterial = require('../../models/CourseMaterial');
const MaterialChunk = require('../../models/MaterialChunk');
const Question = require('../../models/Question');
const storageService = require('../../storage/storage.service');
const documentProcessorService = require('./documentProcessor.service');
const retrieverService = require('./retriever.service');
const geminiService = require('./gemini.service');
const auditService = require('../audit.service');
const { ROLES } = require('../../constants/roles');

class QuestionGeneratorService {
  /**
   * Helper to verify staff permission for course AI operations
   */
  async checkCourseStaffAccess(courseId, user) {
    const course = await Course.findById(courseId);
    if (!course) {
      const error = new Error('Course not found.');
      error.statusCode = 404;
      error.code = 'COURSE_NOT_FOUND';
      throw error;
    }

    if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.INSTITUTION_ADMIN) {
      const error = new Error('Admins are not authorized to use AI Question Studio or generate/approve draft questions.');
      error.statusCode = 403;
      error.code = 'FORBIDDEN_ADMIN_AI_ACCESS';
      throw error;
    }

    if (user.role === ROLES.INSTRUCTOR) {
      const isAssigned = course.instructorIds.some((id) => id.toString() === user._id.toString());
      if (!isAssigned) {
        const error = new Error('You are not assigned to this course.');
        error.statusCode = 403;
        error.code = 'FORBIDDEN_COURSE_ACCESS';
        throw error;
      }
      return course;
    }

    const error = new Error('Students are not authorized to access AI Question Studio or draft questions.');
    error.statusCode = 403;
    error.code = 'FORBIDDEN_STUDENT_AI_ACCESS';
    throw error;
  }

  /**
   * Process course material for AI RAG ingestion (extract text & chunk)
   */
  async processMaterialForAI(courseId, materialId, user) {
    const course = await this.checkCourseStaffAccess(courseId, user);

    const material = await CourseMaterial.findOne({ _id: materialId, courseId: course._id });
    if (!material) {
      const error = new Error('Course material not found.');
      error.statusCode = 404;
      error.code = 'MATERIAL_NOT_FOUND';
      throw error;
    }

    // Processing Lock & Idempotency check (2 minute lock)
    if (
      material.processingStatus === 'PROCESSING' &&
      material.processingStartedAt &&
      Date.now() - new Date(material.processingStartedAt).getTime() < 120000
    ) {
      const error = new Error('Material is already being processed.');
      error.statusCode = 409;
      error.code = 'MATERIAL_PROCESSING_LOCK';
      throw error;
    }

    // Lock status
    material.processingStatus = 'PROCESSING';
    material.processingStartedAt = new Date();
    material.processingError = null;
    await material.save();

    console.log(`[PROCESS_START] materialId=${material._id} courseId=${course._id}`);

    await auditService.logAudit({
      actor: user,
      action: 'MATERIAL_PROCESSING_STARTED',
      resourceType: 'CourseMaterial',
      resourceId: material._id,
      resourceName: material.title,
      courseId: course._id,
      institutionId: course.institutionId,
      status: 'SUCCESS',
      metadata: { originalFileName: material.originalFileName, fileType: material.fileType },
    });

    try {
      const filePath = storageService.getFilePath(material.fileKey);
      const extracted = await documentProcessorService.extractText(filePath, material.fileType);
      console.log(`[TEXT_EXTRACTED] characters=${extracted.length}`);

      const chunks = documentProcessorService.chunkText(extracted.text);
      console.log(`[CHUNKS_CREATED] count=${chunks.length}`);
      console.log(`[EMBEDDING_START] chunkCount=${chunks.length} preferredModel=text-embedding-004`);

      // Clean old chunks if re-processed for idempotency
      await MaterialChunk.deleteMany({ materialId: material._id });

      const embeddingService = require('./embedding.service');
      const chunkDocs = [];
      let lastProvider = 'gemini';

      for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        console.log(`[EMBEDDING_REQUEST] chunkIndex=${c.chunkIndex}/${chunks.length}`);

        // Rate limiting delay (300ms) to avoid exceeding Gemini API RPM limit
        if (i > 0) {
          await new Promise((res) => setTimeout(res, 300));
        }

        const embedRes = await embeddingService.generateEmbeddingWithFallback(c.text);
        lastProvider = embedRes.provider;

        chunkDocs.push({
          materialId: material._id,
          courseId: course._id,
          institutionId: course.institutionId,
          chunkIndex: c.chunkIndex,
          text: c.text,
          tokenCount: c.tokenCount,
          sourceFileName: material.originalFileName,
          topic: material.metadata?.topic || '',
          embedding: embedRes.vector,
          embeddingDimensions: embedRes.dimensions,
          embeddingProvider: embedRes.provider,
          embeddingModel: embedRes.model,
        });

        console.log(
          `[EMBEDDING_SUCCESS] chunkIndex=${c.chunkIndex} provider=${embedRes.provider} model=${embedRes.model} dims=${embedRes.dimensions}`
        );
      }

      if (chunkDocs.length > 0) {
        await MaterialChunk.insertMany(chunkDocs);
      }
      console.log(`[CHUNKS_STORED] count=${chunkDocs.length}`);

      material.processingStatus = 'PROCESSED';
      material.status = 'READY';
      material.processingCompletedAt = new Date();
      material.chunkCount = chunkDocs.length;
      material.extractedTextLength = extracted.length;
      await material.save();

      console.log(`[PROCESS_COMPLETE] materialId=${material._id} providerUsed=${lastProvider}`);

      await auditService.logAudit({
        actor: user,
        action: 'MATERIAL_PROCESSING_COMPLETED',
        resourceType: 'CourseMaterial',
        resourceId: material._id,
        resourceName: material.title,
        courseId: course._id,
        institutionId: course.institutionId,
        status: 'SUCCESS',
        metadata: { chunkCount: chunkDocs.length, extractedTextLength: extracted.length, providerUsed: lastProvider },
      });

      return material;
    } catch (err) {
      material.processingStatus = 'FAILED';
      material.processingError = err.message;
      await material.save();

      await auditService.logAudit({
        actor: user,
        action: 'MATERIAL_PROCESSING_FAILED',
        resourceType: 'CourseMaterial',
        resourceId: material._id,
        resourceName: material.title,
        courseId: course._id,
        institutionId: course.institutionId,
        status: 'FAILED',
        metadata: { error: err.message },
      });

      await auditService.logSystem({
        level: 'ERROR',
        service: 'STORAGE',
        module: 'DocumentProcessor',
        event: err.message.toLowerCase().includes('pdf') ? 'PDF_EXTRACTION_ERROR' : 'MATERIAL_PROCESSING_ERROR',
        message: err.message,
        status: 'ERROR',
        stackTrace: err.stack,
        institutionId: course.institutionId,
        metadata: { materialId: material._id, fileName: material.originalFileName },
      });

      throw err;
    }
  }

  /**
   * Trigger AI RAG Question Generation
   */
  /**
   * Trigger AI RAG Question Generation with Controlled Batched Structured Generation
   */
  async generateDraftQuestions({
    courseId,
    folderId = null,
    chapterName = '',
    materialIds = [],
    topic = '',
    difficulty = 'MEDIUM',
    difficultyDistribution = null,
    questionTypes = ['MCQ'],
    numberOfQuestions = 3,
    user,
  }) {
    const startTime = Date.now();
    const course = await this.checkCourseStaffAccess(courseId, user);
    const textCleaningService = require('../textCleaning.service');
    const QuestionFolder = require('../../models/QuestionFolder');

    // Verify materialIds belong to this course
    if (materialIds.length > 0) {
      const materials = await CourseMaterial.find({ _id: { $in: materialIds }, courseId: course._id });
      if (materials.length !== materialIds.length) {
        const error = new Error('One or more selected materials do not belong to your assigned course.');
        error.statusCode = 400;
        error.code = 'INVALID_MATERIAL_SELECTION';
        throw error;
      }
    }

    // Automatic Chapter Folder Lookup or Creation
    let targetFolder = null;
    let targetFolderId = null;

    const rawChapter = (chapterName || topic || '').trim();

    if (rawChapter) {
      const escapedTitle = rawChapter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      targetFolder = await QuestionFolder.findOne({
        courseId: course._id,
        title: { $regex: new RegExp(`^${escapedTitle}$`, 'i') },
      });

      if (!targetFolder) {
        const folderCount = await QuestionFolder.countDocuments({ courseId: course._id });
        targetFolder = await QuestionFolder.create({
          courseId: course._id,
          institutionId: course.institutionId,
          title: rawChapter,
          description: `Chapter unit folder for ${rawChapter}`,
          orderIndex: folderCount + 1,
          createdBy: user._id,
        });
        console.log(`[AUTO_CHAPTER_FOLDER_CREATED] courseId=${course._id} folderId=${targetFolder._id} title="${rawChapter}"`);
      } else {
        console.log(`[AUTO_CHAPTER_FOLDER_REUSED] courseId=${course._id} folderId=${targetFolder._id} title="${targetFolder.title}"`);
      }
      targetFolderId = targetFolder._id;
    } else if (folderId && folderId !== 'uncategorized') {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(folderId)) {
        targetFolder = await QuestionFolder.findOne({ _id: folderId, courseId: course._id });
        if (targetFolder) {
          targetFolderId = targetFolder._id;
        }
      }
    }

    const totalQs = parseInt(numberOfQuestions, 10) || 3;
    const numQs = Math.min(Math.max(totalQs, 1), 50);

    // Build ordered list of target difficulties per item
    let difficultyList = [];
    if (difficultyDistribution) {
      const easy = parseInt(difficultyDistribution.easy || difficultyDistribution.EASY || 0, 10);
      const medium = parseInt(difficultyDistribution.medium || difficultyDistribution.MEDIUM || 0, 10);
      const hard = parseInt(difficultyDistribution.hard || difficultyDistribution.HARD || 0, 10);
      const sum = easy + medium + hard;

      if (sum !== numQs) {
        const error = new Error(
          `Difficulty distribution sum (${sum} = ${easy} Easy + ${medium} Medium + ${hard} Hard) must equal total requested questions (${numQs}).`
        );
        error.statusCode = 400;
        error.code = 'INVALID_DIFFICULTY_DISTRIBUTION';
        throw error;
      }

      for (let i = 0; i < easy; i++) difficultyList.push('EASY');
      for (let i = 0; i < medium; i++) difficultyList.push('MEDIUM');
      for (let i = 0; i < hard; i++) difficultyList.push('HARD');
    } else {
      const targetDifficulty = ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? difficulty : 'MEDIUM';
      for (let i = 0; i < numQs; i++) difficultyList.push(targetDifficulty);
    }

    console.log(
      `[GENERATION_START] courseId=${course._id} folderId=${targetFolderId} materialCount=${materialIds.length} requestedQuestions=${numQs}`
    );

    await auditService.logAudit({
      actor: user,
      action: 'AI_GENERATION_STARTED',
      resourceType: 'AIStudio',
      resourceName: topic || chapterName || 'Question Generation',
      courseId: course._id,
      folderId: targetFolderId,
      institutionId: course.institutionId,
      status: 'SUCCESS',
      metadata: { requestedQuestions: numQs, difficulty, topic },
    });

    try {
      // RAG Chunk Retrieval (topK = 8)
      const topK = 8;
      const chunks = await retrieverService.retrieveRelevantChunks({
        courseId: course._id,
        materialIds,
        topic,
        limit: topK,
      });

      if (chunks.length === 0) {
        const error = new Error('No processed course material content found for RAG retrieval. Please process course materials first.');
        error.statusCode = 400;
        error.code = 'NO_PROCESSED_MATERIAL';
        throw error;
      }

      console.log(`[RAG_RETRIEVAL_COMPLETE] retrievedChunks=${chunks.length}`);

      // Clean retrieved chunk texts for prompt context
      const contextText = chunks
        .map((c, i) => {
          const cleanedChunkText = textCleaningService.cleanExtractedText(c.text);
          return `--- CHUNK ${i + 1} [Source: ${c.sourceFileName}] ---\n${cleanedChunkText}`;
        })
        .join('\n\n');

      const sourceMatIds = [...new Set(chunks.map((c) => c.materialId.toString()))];
      const sourceChunkIds = chunks.map((c) => c.chunkId);
      const sourceFileNames = [...new Set(chunks.map((c) => c.sourceFileName))];

      // Sanitize source reference snippets before saving
      const sourceRefs = chunks.slice(0, 3).map((c) => ({
        materialId: c.materialId,
        fileName: c.sourceFileName,
        snippet: textCleaningService.sanitizeSourceSnippet(c.text, 200),
      }));

      // Controlled Batch Generation
      const BATCH_SIZE = 10;
      const totalBatches = Math.ceil(numQs / BATCH_SIZE);
      const questionDocs = [];

      for (let b = 0; b < totalBatches; b++) {
        const startIndex = b * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, numQs);
        const batchDiffs = difficultyList.slice(startIndex, endIndex);
        const batchCount = batchDiffs.length;
        const primaryBatchDiff = batchDiffs[0] || 'MEDIUM';

        console.log(`[GEMINI_BATCH_START] batch=${b + 1}/${totalBatches} batchSize=${batchCount}`);

        const aiQuestions = await geminiService.generateQuestions(contextText, {
          numberOfQuestions: batchCount,
          difficulty: primaryBatchDiff,
          questionTypes,
          topic: topic || 'General',
        });

        console.log(`[GEMINI_BATCH_COMPLETE] batch=${b + 1} generated=${aiQuestions.length}`);

        for (let index = 0; index < aiQuestions.length; index++) {
          const q = aiQuestions[index];
          const qType = ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER'].includes(q.type) ? q.type : (questionTypes[0] || 'MCQ');
          const qText = q.questionText || q.text || 'Generated Question Statement';
          const qAns = q.correctAnswer || (q.options ? q.options[0] : 'Sample Answer');

          // Check if question tests filename or metadata rather than academic content
          const metadataCheck = textCleaningService.isFilenameOrMetadataQuestion(qText, sourceFileNames);
          if (metadataCheck.rejected) {
            console.warn(`[REJECTED_METADATA_QUESTION] reason=${metadataCheck.reason} text="${qText}"`);
            continue; // Skip metadata-based questions
          }

          let qOptions = Array.isArray(q.options) ? q.options : [];
          if (qType === 'TRUE_FALSE' && qOptions.length === 0) {
            qOptions = ['True', 'False'];
          }

          const assignedDifficulty = batchDiffs[index] || primaryBatchDiff;

          const question = await Question.create({
            courseId: course._id,
            folderId: targetFolderId,
            institutionId: course.institutionId,
            type: qType,
            questionText: qText,
            options: qOptions,
            correctAnswer: qAns,
            explanation: q.explanation || '',
            difficulty: assignedDifficulty,
            topic: q.topic || topic || 'General',
            sourceMaterialIds: sourceMatIds,
            sourceChunkIds: sourceChunkIds,
            sourceReferences: sourceRefs,
            createdBy: user._id,
            generationSource: 'AI_RAG',
            status: 'DRAFT',
          });

          questionDocs.push(question);
        }
      }

      const durationMs = Date.now() - startTime;
      console.log(`[GENERATION_COMPLETE] requested=${numQs} generated=${questionDocs.length} durationMs=${durationMs}`);

      await auditService.logAudit({
        actor: user,
        action: 'AI_GENERATION_COMPLETED',
        resourceType: 'AIStudio',
        resourceName: topic || chapterName || 'Question Generation',
        courseId: course._id,
        folderId: targetFolderId,
        institutionId: course.institutionId,
        status: 'SUCCESS',
        metadata: { requestedQuestions: numQs, generatedQuestions: questionDocs.length, durationMs },
      });

      return questionDocs;
    } catch (err) {
      await auditService.logAudit({
        actor: user,
        action: 'AI_GENERATION_FAILED',
        resourceType: 'AIStudio',
        resourceName: topic || chapterName || 'Question Generation',
        courseId: course._id,
        folderId: targetFolderId,
        institutionId: course.institutionId,
        status: 'FAILED',
        metadata: { error: err.message },
      });

      await auditService.logSystem({
        level: 'ERROR',
        service: 'GEMINI',
        module: 'QuestionGenerator',
        event: err.message.toLowerCase().includes('rag') || err.message.toLowerCase().includes('retrieval') ? 'RAG_PROCESSING_ERROR' : 'GEMINI_API_ERROR',
        message: err.message,
        status: 'ERROR',
        stackTrace: err.stack,
        institutionId: course.institutionId,
        metadata: { topic, courseId: course._id },
      });

      throw err;
    }
  }

  /**
   * List questions for course with folder and status filtering
   */
  async getQuestions(courseId, user, statusFilter, folderIdFilter) {
    const course = await this.checkCourseStaffAccess(courseId, user);

    const query = { courseId: course._id };
    if (statusFilter && ['DRAFT', 'APPROVED', 'REJECTED', 'ARCHIVED'].includes(statusFilter)) {
      query.status = statusFilter;
    }

    if (folderIdFilter) {
      const rawList = Array.isArray(folderIdFilter)
        ? folderIdFilter
        : String(folderIdFilter).split(',').map((s) => s.trim());

      const hasUncategorized = rawList.includes('uncategorized') || rawList.includes('null');
      const realFolderIds = rawList.filter((f) => f && f !== 'uncategorized' && f !== 'null');

      if (hasUncategorized && realFolderIds.length > 0) {
        query.$or = [{ folderId: { $in: realFolderIds } }, { folderId: null }];
      } else if (hasUncategorized) {
        query.folderId = null;
      } else if (realFolderIds.length > 0) {
        query.folderId = { $in: realFolderIds };
      }
    }

    const questions = await Question.find(query)
      .populate('folderId', 'title description orderIndex')
      .populate('sourceMaterialIds', 'title originalFileName')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .sort({ createdAt: -1 });

    return questions;
  }

  /**
   * Edit question details
   */
  async updateQuestion(questionId, user, updateData) {
    const question = await Question.findById(questionId);
    if (!question) {
      const error = new Error('Question not found.');
      error.statusCode = 404;
      error.code = 'QUESTION_NOT_FOUND';
      throw error;
    }

    await this.checkCourseStaffAccess(question.courseId, user);

    if (updateData.questionText) question.questionText = updateData.questionText.trim();
    if (Array.isArray(updateData.options)) question.options = updateData.options;
    if (updateData.correctAnswer) question.correctAnswer = updateData.correctAnswer.trim();
    if (updateData.explanation !== undefined) question.explanation = updateData.explanation.trim();
    if (updateData.difficulty) question.difficulty = updateData.difficulty;
    if (updateData.topic) question.topic = updateData.topic.trim();

    await question.save();

    await auditService.logAudit({
      actor: user,
      action: 'QUESTION_UPDATED',
      resourceType: 'Question',
      resourceId: question._id,
      resourceName: question.questionText.substring(0, 50),
      courseId: question.courseId,
      folderId: question.folderId,
      institutionId: question.institutionId,
      status: 'SUCCESS',
    });

    return question;
  }

  /**
   * Approve question (moves to Question Bank)
   */
  async approveQuestion(questionId, user) {
    const question = await Question.findById(questionId);
    if (!question) {
      const error = new Error('Question not found.');
      error.statusCode = 404;
      error.code = 'QUESTION_NOT_FOUND';
      throw error;
    }

    await this.checkCourseStaffAccess(question.courseId, user);

    question.status = 'APPROVED';
    question.approvedBy = user._id;
    question.approvedAt = new Date();
    await question.save();

    await auditService.logAudit({
      actor: user,
      action: 'QUESTION_APPROVED',
      resourceType: 'Question',
      resourceId: question._id,
      resourceName: question.questionText.substring(0, 50),
      courseId: question.courseId,
      folderId: question.folderId,
      institutionId: question.institutionId,
      status: 'SUCCESS',
    });

    return question;
  }

  /**
   * Bulk Approve Questions
   */
  async bulkApproveQuestions(questionIds = [], user) {
    if (!Array.isArray(questionIds) || questionIds.length === 0) return [];
    const questions = await Question.find({ _id: { $in: questionIds } });
    for (const q of questions) {
      await this.checkCourseStaffAccess(q.courseId, user);
      q.status = 'APPROVED';
      q.approvedBy = user._id;
      q.approvedAt = new Date();
      await q.save();

      await auditService.logAudit({
        actor: user,
        action: 'QUESTION_APPROVED',
        resourceType: 'Question',
        resourceId: q._id,
        resourceName: q.questionText.substring(0, 50),
        courseId: q.courseId,
        folderId: q.folderId,
        institutionId: q.institutionId,
        status: 'SUCCESS',
      });
    }
    return questions;
  }

  /**
   * Reject question
   */
  async rejectQuestion(questionId, user) {
    const question = await Question.findById(questionId);
    if (!question) {
      const error = new Error('Question not found.');
      error.statusCode = 404;
      error.code = 'QUESTION_NOT_FOUND';
      throw error;
    }

    await this.checkCourseStaffAccess(question.courseId, user);

    question.status = 'REJECTED';
    await question.save();

    await auditService.logAudit({
      actor: user,
      action: 'QUESTION_REJECTED',
      resourceType: 'Question',
      resourceId: question._id,
      resourceName: question.questionText.substring(0, 50),
      courseId: question.courseId,
      folderId: question.folderId,
      institutionId: question.institutionId,
      status: 'SUCCESS',
    });

    return question;
  }

  /**
   * Bulk Reject Questions
   */
  async bulkRejectQuestions(questionIds = [], user) {
    if (!Array.isArray(questionIds) || questionIds.length === 0) return [];
    const questions = await Question.find({ _id: { $in: questionIds } });
    for (const q of questions) {
      await this.checkCourseStaffAccess(q.courseId, user);
      q.status = 'REJECTED';
      await q.save();

      await auditService.logAudit({
        actor: user,
        action: 'QUESTION_REJECTED',
        resourceType: 'Question',
        resourceId: q._id,
        resourceName: q.questionText.substring(0, 50),
        courseId: q.courseId,
        folderId: q.folderId,
        institutionId: q.institutionId,
        status: 'SUCCESS',
      });
    }
    return questions;
  }

  /**
   * Restore question to DRAFT status
   */
  async restoreQuestion(questionId, user) {
    const question = await Question.findById(questionId);
    if (!question) {
      const error = new Error('Question not found.');
      error.statusCode = 404;
      error.code = 'QUESTION_NOT_FOUND';
      throw error;
    }

    await this.checkCourseStaffAccess(question.courseId, user);

    question.status = 'DRAFT';
    await question.save();
    return question;
  }

  /**
   * Delete question (or archive if referenced in exams/attempts)
   */
  async deleteQuestion(questionId, user) {
    const question = await Question.findById(questionId);
    if (!question) {
      const error = new Error('Question not found.');
      error.statusCode = 404;
      error.code = 'QUESTION_NOT_FOUND';
      throw error;
    }

    await this.checkCourseStaffAccess(question.courseId, user);

    const Exam = require('../../models/Exam');
    const ExamAttempt = require('../../models/ExamAttempt');

    const isUsedInExam = await Exam.exists({ questionIds: questionId });
    const isUsedInAttempt = await ExamAttempt.exists({ questionIds: questionId });

    if (isUsedInExam || isUsedInAttempt) {
      question.status = 'ARCHIVED';
      await question.save();
      return { success: true, id: questionId, status: 'ARCHIVED', message: 'Question is referenced in exams/attempts and has been archived.' };
    }

    await Question.findByIdAndDelete(questionId);

    await auditService.logAudit({
      actor: user,
      action: 'QUESTION_DELETED',
      resourceType: 'Question',
      resourceId: questionId,
      resourceName: question.questionText.substring(0, 50),
      courseId: question.courseId,
      folderId: question.folderId,
      institutionId: question.institutionId,
      status: 'SUCCESS',
    });

    return { success: true, id: questionId, status: 'DELETED' };
  }
}

module.exports = new QuestionGeneratorService();
