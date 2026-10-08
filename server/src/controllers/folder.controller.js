const QuestionFolder = require('../models/QuestionFolder');
const Question = require('../models/Question');
const Course = require('../models/Course');

class FolderController {
  /**
   * Get all folders for a course along with MongoDB question status counts
   * GET /api/v1/courses/:courseId/folders
   */
  async getFolders(req, res, next) {
    try {
      const { courseId } = req.params;
      const mongoose = require('mongoose');

      // Verify course access
      const course = await Course.findById(courseId);
      if (!course) {
        const err = new Error('Course not found');
        err.statusCode = 404;
        throw err;
      }

      const courseObjId = mongoose.Types.ObjectId.isValid(course._id)
        ? new mongoose.Types.ObjectId(course._id)
        : course._id;

      const courseIdQuery = { $in: [course._id, courseObjId, course._id.toString()] };

      // Fetch all folders ordered by orderIndex
      const folders = await QuestionFolder.find({ courseId: courseIdQuery }).sort({ orderIndex: 1, createdAt: 1 }).lean();

      // Aggregate question counts grouped by folderId and status directly from MongoDB
      const countsAggregate = await Question.aggregate([
        { $match: { courseId: courseIdQuery } },
        {
          $group: {
            _id: {
              folderId: '$folderId',
              status: '$status',
            },
            count: { $sum: 1 },
          },
        },
      ]);

      // Aggregate overall questions for the entire course
      const overallAggregate = await Question.aggregate([
        { $match: { courseId: courseIdQuery } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const allCourseCounts = { total: 0, approved: 0, draft: 0, rejected: 0, archived: 0 };
      for (const item of overallAggregate) {
        const statusKey = item._id ? item._id.toLowerCase() : 'draft';
        allCourseCounts[statusKey] = (allCourseCounts[statusKey] || 0) + item.count;
        allCourseCounts.total += item.count;
      }

      // Helper function to extract count map per folder
      const getCountsForFolder = (folderIdObj) => {
        const counts = { total: 0, approved: 0, draft: 0, rejected: 0, archived: 0 };
        const keyStr = folderIdObj ? folderIdObj.toString() : null;

        for (const item of countsAggregate) {
          const itemFolderIdStr = item._id.folderId ? item._id.folderId.toString() : null;
          if (itemFolderIdStr === keyStr) {
            const statusKey = item._id.status ? item._id.status.toLowerCase() : 'draft';
            counts[statusKey] = (counts[statusKey] || 0) + item.count;
            counts.total += item.count;
          }
        }
        return counts;
      };

      // Format folder list with live question counts
      const foldersWithCounts = folders.map((f) => ({
        id: f._id.toString(),
        _id: f._id,
        courseId: f.courseId,
        title: f.title,
        description: f.description,
        orderIndex: f.orderIndex,
        createdAt: f.createdAt,
        counts: getCountsForFolder(f._id),
      }));

      // Add "Uncategorized" meta-folder
      const uncategorizedCounts = getCountsForFolder(null);

      return res.status(200).json({
        success: true,
        data: {
          folders: foldersWithCounts,
          uncategorized: {
            id: 'uncategorized',
            title: 'Uncategorized',
            description: 'Questions not assigned to any specific unit or chapter',
            counts: uncategorizedCounts,
          },
          allCourseCounts,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new folder/unit for a course and optionally assign selected questions
   * POST /api/v1/courses/:courseId/folders
   */
  async createFolder(req, res, next) {
    try {
      const { courseId } = req.params;
      const { title, description, orderIndex, questionIds, selectedQuestionIds } = req.body;

      if (!title || !title.trim()) {
        const err = new Error('Folder title is required');
        err.statusCode = 400;
        throw err;
      }

      const course = await Course.findById(courseId);
      if (!course) {
        const err = new Error('Course not found');
        err.statusCode = 404;
        throw err;
      }

      const folderCount = await QuestionFolder.countDocuments({ courseId });

      const folder = await QuestionFolder.create({
        courseId,
        institutionId: course.institutionId || req.user.institutionId,
        title: title.trim(),
        description: description ? description.trim() : '',
        orderIndex: typeof orderIndex === 'number' ? orderIndex : folderCount + 1,
        createdBy: req.user.id || req.user._id,
      });

      const idsToMove = Array.isArray(questionIds)
        ? questionIds
        : (Array.isArray(selectedQuestionIds) ? selectedQuestionIds : []);

      let movedQuestionIds = [];
      let movedCount = 0;

      if (idsToMove.length > 0) {
        // Validate questions belong to course
        const questionsToMove = await Question.find({
          _id: { $in: idsToMove },
          courseId: course._id,
        });

        if (questionsToMove.length > 0) {
          movedQuestionIds = questionsToMove.map((q) => q._id);
          const updateRes = await Question.updateMany(
            { _id: { $in: movedQuestionIds } },
            { $set: { folderId: folder._id } }
          );
          movedCount = updateRes.modifiedCount;
        }
      }

      const auditService = require('../services/audit.service');
      auditService.logAudit({
        actor: req.user,
        action: 'QUESTION_FOLDER_CREATED',
        resourceType: 'QuestionFolder',
        resourceId: folder._id,
        resourceName: folder.title,
        courseId: course._id,
        institutionId: course.institutionId,
        status: 'SUCCESS',
        metadata: { movedCount, movedQuestionIds },
        req,
      });

      return res.status(201).json({
        success: true,
        message: movedCount > 0 ? `Folder created and ${movedCount} question(s) moved successfully` : 'Folder created successfully',
        data: {
          ...folder.toJSON(),
          movedCount,
          movedQuestionIds,
          counts: {
            total: movedCount,
            approved: movedCount,
            draft: 0,
            rejected: 0,
            archived: 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing folder/unit
   * PATCH /api/v1/folders/:id
   */
  async updateFolder(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, orderIndex } = req.body;

      const folder = await QuestionFolder.findById(id);
      if (!folder) {
        const err = new Error('Folder not found');
        err.statusCode = 404;
        throw err;
      }

      if (title !== undefined) folder.title = title.trim();
      if (description !== undefined) folder.description = description.trim();
      if (typeof orderIndex === 'number') folder.orderIndex = orderIndex;

      await folder.save();

      return res.status(200).json({
        success: true,
        message: 'Folder updated successfully',
        data: folder,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a folder/unit (move contained questions to Uncategorized folderId: null)
   * DELETE /api/v1/folders/:id
   */
  async deleteFolder(req, res, next) {
    try {
      const { id } = req.params;

      const folder = await QuestionFolder.findById(id);
      if (!folder) {
        const err = new Error('Folder not found');
        err.statusCode = 404;
        throw err;
      }

      // Reassign all questions in this folder to Uncategorized (folderId: null)
      await Question.updateMany({ folderId: folder._id }, { $set: { folderId: null } });

      await QuestionFolder.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Folder deleted successfully. Questions moved to Uncategorized.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Move a single question to a folder (or uncategorized/root if targetFolderId is null/'uncategorized')
   * POST /api/v1/folders/move-question
   * PATCH /api/v1/questions/:questionId/folder
   */
  async moveQuestion(req, res, next) {
    try {
      const { questionId, targetFolderId, folderId } = req.body;
      const qId = questionId || req.params.questionId;
      const targetId = targetFolderId !== undefined ? targetFolderId : folderId;

      if (!qId) {
        const err = new Error('questionId is required');
        err.statusCode = 400;
        throw err;
      }

      const question = await Question.findById(qId);
      if (!question) {
        const err = new Error('Question not found');
        err.statusCode = 404;
        throw err;
      }

      // Verify instructor assignment for course if instructor
      const course = await Course.findById(question.courseId);
      if (!course) {
        const err = new Error('Associated course not found');
        err.statusCode = 404;
        throw err;
      }

      const { ROLES } = require('../constants/roles');
      if (req.user.role === ROLES.INSTRUCTOR) {
        const isAssigned = course.instructorIds.some((id) => id.toString() === req.user._id.toString());
        if (!isAssigned) {
          const err = new Error('Access denied. You are not assigned to this course.');
          err.statusCode = 403;
          throw err;
        }
      }

      let validFolderId = null;
      if (targetId && targetId !== 'uncategorized' && targetId !== 'null' && targetId !== 'root') {
        const folder = await QuestionFolder.findById(targetId);
        if (!folder) {
          const err = new Error('Target folder not found');
          err.statusCode = 404;
          throw err;
        }

        if (folder.courseId.toString() !== question.courseId.toString()) {
          const err = new Error('Cannot move question to a folder belonging to another course.');
          err.statusCode = 400;
          throw err;
        }
        validFolderId = folder._id;
      }

      question.folderId = validFolderId;
      await question.save();

      const auditService = require('../services/audit.service');
      auditService.logAudit({
        actor: req.user,
        action: 'QUESTION_MOVED_TO_FOLDER',
        resourceType: 'Question',
        resourceId: question._id,
        resourceName: question.questionText.substring(0, 50),
        courseId: question.courseId,
        folderId: validFolderId,
        institutionId: question.institutionId,
        status: 'SUCCESS',
        req,
      });

      return res.status(200).json({
        success: true,
        message: validFolderId ? 'Question moved to folder' : 'Question moved to Root / Unfoldered Question Bank',
        data: question,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk move questions to a folder
   * POST /api/v1/folders/bulk-move
   * PATCH /api/v1/questions/bulk/folder
   */
  async bulkMoveQuestions(req, res, next) {
    try {
      const { questionIds, targetFolderId, folderId } = req.body;
      const targetId = targetFolderId !== undefined ? targetFolderId : folderId;

      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        const err = new Error('questionIds must be a non-empty array');
        err.statusCode = 400;
        throw err;
      }

      const questionsToMove = await Question.find({ _id: { $in: questionIds } });
      if (questionsToMove.length === 0) {
        const err = new Error('No matching questions found to move');
        err.statusCode = 404;
        throw err;
      }

      // Verify all questions belong to the same course
      const firstCourseId = questionsToMove[0].courseId.toString();
      const hasCrossCourse = questionsToMove.some((q) => q.courseId.toString() !== firstCourseId);
      if (hasCrossCourse) {
        const err = new Error('Cannot move questions from different courses in a single bulk operation.');
        err.statusCode = 400;
        throw err;
      }

      const course = await Course.findById(firstCourseId);
      if (!course) {
        const err = new Error('Associated course not found');
        err.statusCode = 404;
        throw err;
      }

      const { ROLES } = require('../constants/roles');
      if (req.user.role === ROLES.INSTRUCTOR) {
        const isAssigned = course.instructorIds.some((id) => id.toString() === req.user._id.toString());
        if (!isAssigned) {
          const err = new Error('Access denied. You are not assigned to this course.');
          err.statusCode = 403;
          throw err;
        }
      }

      let validFolderId = null;
      if (targetId && targetId !== 'uncategorized' && targetId !== 'null' && targetId !== 'root') {
        const folder = await QuestionFolder.findById(targetId);
        if (!folder) {
          const err = new Error('Target folder not found');
          err.statusCode = 404;
          throw err;
        }

        if (folder.courseId.toString() !== firstCourseId) {
          const err = new Error('Cannot move questions into a folder belonging to another course.');
          err.statusCode = 400;
          throw err;
        }
        validFolderId = folder._id;
      }

      const result = await Question.updateMany(
        { _id: { $in: questionIds }, courseId: firstCourseId },
        { $set: { folderId: validFolderId } }
      );

      const auditService = require('../services/audit.service');
      auditService.logAudit({
        actor: req.user,
        action: 'QUESTION_MOVED_TO_FOLDER',
        resourceType: 'Question',
        resourceName: `${result.modifiedCount} Questions Moved`,
        courseId: firstCourseId,
        folderId: validFolderId,
        status: 'SUCCESS',
        metadata: { modifiedCount: result.modifiedCount, folderId: validFolderId },
        req,
      });

      return res.status(200).json({
        success: true,
        message: validFolderId
          ? `${result.modifiedCount} question(s) moved to folder successfully`
          : `${result.modifiedCount} question(s) moved to Root / Unfoldered Question Bank successfully`,
        data: { modifiedCount: result.modifiedCount, folderId: validFolderId },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FolderController();
