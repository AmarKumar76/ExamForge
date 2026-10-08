import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { courseService } from '../services/courseService';
import { aiService } from '../services/aiService';
import { examService } from '../services/examService';
import { folderService } from '../services/folderService';
import {
  dateToDateTimeLocalString,
  dateTimeLocalToISOString,
  formatExamDateTime,
} from '../utils/dateUtils';
import {
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  Sparkles,
  Folder,
  Calendar,
  Award,
  CheckSquare,
  Square,
  Lock,
  Edit3,
  Eye,
  Ban,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';

export const CreateExamPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editExamIdParam = searchParams.get('edit');

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [folders, setFolders] = useState([]);
  const [uncategorizedFolder, setUncategorizedFolder] = useState(null);
  const [selectedFolderIds, setSelectedFolderIds] = useState([]); // Array of multi-selected folder IDs or 'uncategorized'

  const [approvedQuestions, setApprovedQuestions] = useState([]);
  const [existingExams, setExistingExams] = useState([]);

  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Edit Mode & Cancellation Modal State
  const [editingExam, setEditingExam] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [examToCancel, setExamToCancel] = useState(null);

  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    duration: 60,
    totalMarks: 40,
    passingMarks: 16,
    questionsPerStudent: 20,
    difficultyDistribution: {
      easy: 8,
      medium: 8,
      hard: 4,
    },
    startTime: '',
    endTime: '',
    publishImmediately: false,
  });

  // Load instructor assigned courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoadingCourses(true);
        const res = await courseService.getAll();
        const courseList = Array.isArray(res.data?.courses)
          ? res.data.courses
          : Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.courses)
          ? res.courses
          : [];
        setCourses(courseList);
        if (courseList.length > 0 && !selectedCourseId) {
          setSelectedCourseId(courseList[0]._id || courseList[0].id);
        }
      } catch (err) {
        setError(err.message || 'Failed to load assigned subjects.');
      } finally {
        setIsLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  // Fetch existing instructor exams
  const fetchExistingExams = async () => {
    try {
      setIsLoadingExams(true);
      const res = await examService.getInstructorExams(
        selectedCourseId ? { courseId: selectedCourseId } : {}
      );
      const examList = Array.isArray(res.data?.exams)
        ? res.data.exams
        : Array.isArray(res.data)
        ? res.data
        : [];
      setExistingExams(examList);
    } catch (err) {
      console.warn('Failed to load existing exams:', err.message);
    } finally {
      setIsLoadingExams(false);
    }
  };

  useEffect(() => {
    fetchExistingExams();
  }, [selectedCourseId]);

  // Handle editExamIdParam from URL
  useEffect(() => {
    if (editExamIdParam) {
      handleSelectExamForEdit(editExamIdParam);
    }
  }, [editExamIdParam]);

  // Load folders when selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) return;
    const loadFolders = async () => {
      try {
        setIsLoadingFolders(true);
        const res = await folderService.getFolders(selectedCourseId);
        const payload = res.data || res;
        const folderList = Array.isArray(payload?.folders)
          ? payload.folders
          : Array.isArray(payload)
          ? payload
          : Array.isArray(res?.folders)
          ? res.folders
          : [];

        setFolders(folderList);
        setUncategorizedFolder(payload?.uncategorized || res?.uncategorized || null);

        // Select all folders by default for this course if not in editing mode
        if (!editingExam) {
          const allFolderIds = folderList.map((f) => f.id || f._id);
          if (payload?.uncategorized?.counts?.approved > 0) {
            allFolderIds.push('uncategorized');
          }
          setSelectedFolderIds(allFolderIds);
        }
      } catch (err) {
        console.warn('Failed to load folders:', err.message);
        setFolders([]);
      } finally {
        setIsLoadingFolders(false);
      }
    };
    loadFolders();
  }, [selectedCourseId]);

  // Load COMBINED APPROVED questions for all multi-selected folders
  useEffect(() => {
    if (!selectedCourseId) {
      setApprovedQuestions([]);
      return;
    }

    const loadQuestions = async () => {
      try {
        setIsLoadingQuestions(true);
        let qList = [];

        if (selectedFolderIds.length === 0) {
          qList = [];
        } else {
          const fetchPromises = selectedFolderIds.map((fId) =>
            aiService.getQuestions(selectedCourseId, 'APPROVED', fId)
          );
          const results = await Promise.all(fetchPromises);
          const mergedMap = new Map();
          results.forEach((res) => {
            const list = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
            list.forEach((q) => mergedMap.set(q._id || q.id, q));
          });
          qList = Array.from(mergedMap.values());
        }

        setApprovedQuestions(qList);

        // Auto suggestion for new exam creation (if not editing)
        if (!editingExam && qList.length > 0) {
          const easyAvail = qList.filter((q) => q.difficulty === 'EASY').length;
          const medAvail = qList.filter((q) => q.difficulty === 'MEDIUM').length;
          const hardAvail = qList.filter((q) => q.difficulty === 'HARD').length;
          const totalAvail = qList.length;

          const suggestedTotal = Math.min(totalAvail, 20);
          const suggestedEasy = Math.min(easyAvail, Math.floor(suggestedTotal * 0.4));
          const suggestedMed = Math.min(medAvail, Math.floor(suggestedTotal * 0.4));
          const suggestedHard = Math.min(hardAvail, Math.max(0, suggestedTotal - suggestedEasy - suggestedMed));

          setExamForm((prev) => ({
            ...prev,
            questionsPerStudent: suggestedTotal,
            difficultyDistribution: {
              easy: suggestedEasy,
              medium: suggestedMed,
              hard: Math.max(0, suggestedHard),
            },
          }));
        }
      } catch (err) {
        setApprovedQuestions([]);
      } finally {
        setIsLoadingQuestions(false);
      }
    };
    loadQuestions();
  }, [selectedCourseId, selectedFolderIds]);

  // Derived combined pool metrics
  const poolEasyCount = approvedQuestions.filter((q) => q.difficulty === 'EASY').length;
  const poolMediumCount = approvedQuestions.filter((q) => q.difficulty === 'MEDIUM').length;
  const poolHardCount = approvedQuestions.filter((q) => q.difficulty === 'HARD').length;

  const toggleFolderSelection = (fId) => {
    if (editingExam?.isLocked) return;
    setSelectedFolderIds((prev) =>
      prev.includes(fId) ? prev.filter((id) => id !== fId) : [...prev, fId]
    );
  };

  const toggleSelectAllFolders = () => {
    if (editingExam?.isLocked) return;
    const allIds = folders.map((f) => f.id || f._id);
    if (uncategorizedFolder?.counts?.approved > 0) {
      allIds.push('uncategorized');
    }

    if (selectedFolderIds.length === allIds.length) {
      setSelectedFolderIds([]);
    } else {
      setSelectedFolderIds(allIds);
    }
  };

  // Populate form for Editing / Viewing an existing exam
  const handleSelectExamForEdit = async (examOrId) => {
    const examId = typeof examOrId === 'string' ? examOrId : examOrId._id || examOrId.id;
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await examService.getById(examId);
      const examData = res.data?.exam || res.exam || res.data;

      if (!examData) return;

      setEditingExam(examData);
      setSelectedCourseId(examData.courseId?._id || examData.courseId || selectedCourseId);
      setSelectedFolderIds(examData.questionSourceFolders || examData.folderIds || []);

      setExamForm({
        title: examData.title || '',
        description: examData.description || '',
        duration: examData.duration || 60,
        totalMarks: examData.totalMarks || 100,
        passingMarks: examData.passingMarks || 40,
        questionsPerStudent: examData.questionsPerStudent || 20,
        difficultyDistribution: examData.difficultyDistribution || { easy: 8, medium: 8, hard: 4 },
        startTime: dateToDateTimeLocalString(examData.startTime),
        endTime: dateToDateTimeLocalString(examData.endTime),
        publishImmediately: examData.status === 'SCHEDULED' || examData.status === 'PUBLISHED',
      });
    } catch (err) {
      setError(err.message || 'Failed to load exam details for editing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetToNew = () => {
    setEditingExam(null);
    setSearchParams({});
    setError(null);
    setSuccess(null);
    setExamForm({
      title: '',
      description: '',
      duration: 60,
      totalMarks: 40,
      passingMarks: 16,
      questionsPerStudent: 20,
      difficultyDistribution: { easy: 8, medium: 8, hard: 4 },
      startTime: '',
      endTime: '',
      publishImmediately: false,
    });
  };

  // Submit Handler for Create or Edit
  const handleSubmitExam = async (e) => {
    e.preventDefault();

    if (editingExam?.isLocked) {
      setError('Exam configuration is locked and cannot be edited.');
      return;
    }

    if (!examForm.title || !selectedCourseId) return;

    if (selectedFolderIds.length === 0) {
      setError('Please select at least one Question Source Folder checkbox.');
      return;
    }

    if (approvedQuestions.length === 0) {
      setError('The selected folder(s) contain no approved questions. Please select folders with approved questions.');
      return;
    }

    const perStudent = parseInt(examForm.questionsPerStudent, 10) || 0;
    if (perStudent <= 0) {
      setError('Questions Per Student must be greater than 0.');
      return;
    }

    if (perStudent > approvedQuestions.length) {
      setError(`Questions Per Student (${perStudent}) cannot exceed available approved questions (${approvedQuestions.length}) in the combined pool of selected folders.`);
      return;
    }

    const reqEasy = parseInt(examForm.difficultyDistribution.easy || 0, 10);
    const reqMed = parseInt(examForm.difficultyDistribution.medium || 0, 10);
    const reqHard = parseInt(examForm.difficultyDistribution.hard || 0, 10);
    const sumDist = reqEasy + reqMed + reqHard;

    if (sumDist !== perStudent) {
      setError(`Difficulty distribution (${reqEasy} Easy + ${reqMed} Medium + ${reqHard} Hard = ${sumDist}) must equal Questions Per Student (${perStudent}).`);
      return;
    }

    if (reqEasy > poolEasyCount) {
      setError(`Only ${poolEasyCount} approved Easy question(s) are available in the selected folders. You requested ${reqEasy}.`);
      return;
    }
    if (reqMed > poolMediumCount) {
      setError(`Only ${poolMediumCount} approved Medium question(s) are available in the selected folders. You requested ${reqMed}.`);
      return;
    }
    if (reqHard > poolHardCount) {
      setError(`Only ${poolHardCount} approved Hard question(s) are available in the selected folders. You requested ${reqHard}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const selectedQIds = approvedQuestions.map((q) => q._id || q.id);

      const payload = {
        courseId: selectedCourseId,
        title: examForm.title.trim(),
        description: examForm.description.trim(),
        duration: parseInt(examForm.duration, 10) || 60,
        totalMarks: parseInt(examForm.totalMarks, 10) || 100,
        passingMarks: parseInt(examForm.passingMarks, 10) || 40,
        folderIds: selectedFolderIds,
        questionSourceFolders: selectedFolderIds,
        questionIds: selectedQIds,
        questionsPerStudent: perStudent,
        difficultyDistribution: {
          easy: reqEasy,
          medium: reqMed,
          hard: reqHard,
        },
        startTime: dateTimeLocalToISOString(examForm.startTime),
        endTime: dateTimeLocalToISOString(examForm.endTime),
      };

      if (editingExam) {
        // UPDATE EXISTING EXAM
        const res = await examService.update(editingExam._id || editingExam.id, payload);
        if (res.success || res.data) {
          setSuccess(`Exam "${examForm.title}" updated successfully!`);
          await fetchExistingExams();
          setTimeout(() => setSuccess(null), 3000);
        }
      } else {
        // CREATE NEW EXAM
        const res = await examService.create(payload);
        if (res.success) {
          const createdExam = res.data.exam;

          if (examForm.publishImmediately) {
            await examService.publish(createdExam.id || createdExam._id);
            setSuccess(`Exam "${examForm.title}" created and published successfully!`);
          } else {
            setSuccess(`Draft exam "${examForm.title}" saved successfully!`);
          }

          await fetchExistingExams();
          setTimeout(() => {
            navigate('/instructor/dashboard');
          }, 1500);
        }
      }
    } catch (err) {
      const isConflict = err.response?.status === 409 || err.code === 'EXAM_LOCKED' || err.message?.includes('locked') || err.message?.includes('started an attempt');
      if (isConflict) {
        setError('Exam configuration cannot be changed because a student has already started an attempt.');
        if (editingExam) {
          handleSelectExamForEdit(editingExam._id || editingExam.id);
        }
      } else {
        setError(err.message || 'Failed to save exam.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Cancel Modal
  const handleOpenCancelModal = (exam) => {
    setExamToCancel(exam);
    setShowCancelModal(true);
  };

  // Execute Cancel Exam
  const handleConfirmCancelExam = async () => {
    if (!examToCancel) return;
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await examService.update(examToCancel._id || examToCancel.id, { status: 'CANCELLED' });
      if (res.success || res.data) {
        setSuccess(`Exam "${examToCancel.title}" has been cancelled.`);
        setShowCancelModal(false);
        setExamToCancel(null);
        if (editingExam && (editingExam._id === examToCancel._id || editingExam.id === examToCancel.id)) {
          handleResetToNew();
        }
        await fetchExistingExams();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel exam.');
      setShowCancelModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExamFormDisabled = Boolean(editingExam?.isLocked);

  return (
    <AppShell title={editingExam ? (editingExam.isLocked ? 'View Exam' : 'Edit Scheduled Exam') : 'Create Exam'}>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--primary)]" />
              {editingExam ? (editingExam.isLocked ? 'View Exam Details (Locked)' : 'Edit Scheduled Exam') : 'Official Exam Builder'}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Multi-select Question Bank folders to draw a combined approved question pool for student randomization.
            </p>
          </div>

          {editingExam && (
            <Button variant="outline" size="sm" icon={PlusCircle} onClick={handleResetToNew}>
              Create New Exam
            </Button>
          )}
        </div>

        {/* Existing Exams Quick Bar */}
        {existingExams.length > 0 && (
          <div className="bg-[var(--surface-muted)] p-4 rounded-2xl border border-[var(--border)] space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-[var(--text-primary)]">
              <span>Existing Exams for Subject ({existingExams.length})</span>
              <span className="text-[10px] text-[var(--text-secondary)] font-normal">Click an exam to Edit or View configuration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {existingExams.map((ex) => {
                const isSelected = editingExam && (editingExam._id === ex._id || editingExam.id === ex.id);
                const isLocked = ex.isLocked || ex.attemptsStarted > 0 || (ex.startTime && new Date() >= new Date(ex.startTime));
                const statusStr = ex.status || 'DRAFT';

                return (
                  <div
                    key={ex._id || ex.id}
                    className={`p-3 rounded-xl border text-xs transition-all flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--surface)] shadow-sm'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary-border)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-[var(--text-primary)] truncate max-w-[140px]">{ex.title}</span>
                        <Badge
                          variant={
                            statusStr === 'CANCELLED'
                              ? 'error'
                              : statusStr === 'SCHEDULED'
                              ? 'warning'
                              : statusStr === 'PUBLISHED'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {statusStr}
                        </Badge>
                      </div>

                      <div className="text-[10px] text-[var(--text-muted)] space-y-0.5">
                        <p>{ex.questionsPerStudent || 0} questions • {ex.duration || 60} mins</p>
                        {ex.startTime && (
                          <p>Start: {formatExamDateTime(ex.startTime)}</p>
                        )}
                        {ex.attemptsStarted > 0 && (
                          <p className="text-amber-600 dark:text-amber-400 font-semibold">Attempts Started: {ex.attemptsStarted}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-subtle)]">
                      {isLocked ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={() => handleSelectExamForEdit(ex)}
                          >
                            View
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Edit3}
                            onClick={() => handleSelectExamForEdit(ex)}
                          >
                            Edit
                          </Button>
                          {ex.canCancel && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              icon={Ban}
                              onClick={() => handleOpenCancelModal(ex)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lock Banner if Editing a Locked Exam */}
        {editingExam?.isLocked && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>🔒 Configuration Locked</span>
            </div>
            <p>
              {editingExam.lockReason || 'Exam configuration is locked because a student has already started an attempt.'}
            </p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              The instructor can no longer edit question source folders, timing, or difficulty distribution for this exam.
            </p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitExam} className="space-y-6">
          {/* Section 1: Course & Basic Details */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4 text-xs shadow-xs">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <BookOpen className="w-4 h-4 text-[var(--primary)]" />
              Course & Exam Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Course / Subject</label>
                {isLoadingCourses ? (
                  <div className="text-[11px] text-[var(--text-secondary)]">Loading subjects...</div>
                ) : (
                  <select
                    disabled={isExamFormDisabled}
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {courses.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  disabled={isExamFormDisabled}
                  placeholder="e.g. Enterprise Java Unit Test"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[var(--text-primary)] block mb-1">Description / Scope</label>
              <textarea
                rows={2}
                disabled={isExamFormDisabled}
                placeholder="e.g. Comprehensive assessment covering Units 1, 2 and 3."
                value={examForm.description}
                onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  disabled={isExamFormDisabled}
                  min={10}
                  max={300}
                  value={examForm.duration}
                  onChange={(e) => setExamForm({ ...examForm, duration: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Total Marks</label>
                <input
                  type="number"
                  required
                  disabled={isExamFormDisabled}
                  min={10}
                  max={1000}
                  value={examForm.totalMarks}
                  onChange={(e) => setExamForm({ ...examForm, totalMarks: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Passing Marks</label>
                <input
                  type="number"
                  required
                  disabled={isExamFormDisabled}
                  min={1}
                  max={examForm.totalMarks}
                  value={examForm.passingMarks}
                  onChange={(e) => setExamForm({ ...examForm, passingMarks: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Question Source Folders Selection (Multi-Select Checkboxes) */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4 text-xs shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Folder className="w-4 h-4 text-[var(--primary)]" />
                  Question Source Folders (Multi-Select Checkboxes)
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Check all unit/chapter folders to include in this exam's random question pool.
                </p>
              </div>

              {!isExamFormDisabled && folders.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAllFolders}
                  icon={
                    selectedFolderIds.length ===
                    folders.length + (uncategorizedFolder?.counts?.approved > 0 ? 1 : 0)
                      ? CheckSquare
                      : Square
                  }
                >
                  {selectedFolderIds.length ===
                  folders.length + (uncategorizedFolder?.counts?.approved > 0 ? 1 : 0)
                    ? 'Deselect All'
                    : 'Select All Folders'}
                </Button>
              )}
            </div>

            {isLoadingFolders ? (
              <div className="p-4 text-center text-xs text-[var(--text-secondary)]">
                Loading Question Bank folders...
              </div>
            ) : folders.length === 0 && !uncategorizedFolder?.counts?.approved ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl">
                No unit folders created yet for this course. Please create folders and approve questions in Question Bank.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {folders.map((f) => {
                  const fId = f.id || f._id;
                  const isChecked = selectedFolderIds.includes(fId);
                  const approvedCount = f.counts?.approved || 0;

                  return (
                    <div
                      key={fId}
                      onClick={() => toggleFolderSelection(fId)}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isExamFormDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                      } flex items-start gap-3 ${
                        isChecked
                          ? 'border-[var(--primary)] bg-[var(--primary-light)]/20 shadow-xs'
                          : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary-border)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isExamFormDisabled}
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 accent-[var(--primary)] w-4 h-4 rounded cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                            {f.name || f.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                          {approvedCount} approved questions
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Uncategorized / Root Questions Folder Option */}
                {uncategorizedFolder && uncategorizedFolder.counts?.approved > 0 && (
                  <div
                    onClick={() => toggleFolderSelection('uncategorized')}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isExamFormDisabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                    } flex items-start gap-3 ${
                      selectedFolderIds.includes('uncategorized')
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]/20 shadow-xs'
                        : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary-border)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={isExamFormDisabled}
                      checked={selectedFolderIds.includes('uncategorized')}
                      onChange={() => {}}
                      className="mt-0.5 accent-[var(--primary)] w-4 h-4 rounded cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-xs text-[var(--text-primary)] truncate block">
                        Uncategorized / Root Questions
                      </span>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        {uncategorizedFolder.counts?.approved || 0} approved questions
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Combined Approved Pool Summary */}
            <div className="p-4 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Selected Folders: {selectedFolderIds.length}
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Available Approved Questions in Pool:
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={approvedQuestions.length > 0 ? 'success font-bold' : 'neutral'}>
                  {approvedQuestions.length} Approved Questions
                </Badge>
                {isLoadingQuestions && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />}
              </div>
            </div>
          </div>

          {/* Section 3: Question Pool & Difficulty Distribution */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4 text-xs shadow-xs">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <Award className="w-4 h-4 text-[var(--primary)]" />
              Per-Student Random Pool Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">
                  Questions Per Student
                </label>
                <input
                  type="number"
                  min={1}
                  disabled={isExamFormDisabled}
                  max={approvedQuestions.length || 1}
                  value={examForm.questionsPerStudent}
                  onChange={(e) => setExamForm({ ...examForm, questionsPerStudent: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-bold focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                  Combined Pool Size: <strong>{approvedQuestions.length} Approved Questions</strong>
                </span>
              </div>

              <div className="p-3.5 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">
                    Difficulty Sum Check
                  </span>
                  <span
                    className={`text-sm font-black ${
                      Number(examForm.difficultyDistribution.easy) +
                        Number(examForm.difficultyDistribution.medium) +
                        Number(examForm.difficultyDistribution.hard) ===
                      Number(examForm.questionsPerStudent)
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {Number(examForm.difficultyDistribution.easy) +
                      Number(examForm.difficultyDistribution.medium) +
                      Number(examForm.difficultyDistribution.hard)}{' '}
                    / {examForm.questionsPerStudent} Items
                  </span>
                </div>
                <Badge
                  variant={
                    Number(examForm.difficultyDistribution.easy) +
                      Number(examForm.difficultyDistribution.medium) +
                      Number(examForm.difficultyDistribution.hard) ===
                    Number(examForm.questionsPerStudent)
                      ? 'success'
                      : 'warning'
                  }
                >
                  {Number(examForm.difficultyDistribution.easy) +
                    Number(examForm.difficultyDistribution.medium) +
                    Number(examForm.difficultyDistribution.hard) ===
                  Number(examForm.questionsPerStudent)
                    ? 'Valid'
                    : 'Mismatch'}
                </Badge>
              </div>
            </div>

            {/* Difficulty Breakdown Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-400">
                  <span>Easy Questions</span>
                  <span className="text-[10px]">Avail: {poolEasyCount}</span>
                </div>
                <input
                  type="number"
                  min={0}
                  disabled={isExamFormDisabled}
                  max={poolEasyCount}
                  value={examForm.difficultyDistribution.easy}
                  onChange={(e) =>
                    setExamForm({
                      ...examForm,
                      difficultyDistribution: { ...examForm.difficultyDistribution, easy: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-700 dark:text-amber-400">
                  <span>Medium Questions</span>
                  <span className="text-[10px]">Avail: {poolMediumCount}</span>
                </div>
                <input
                  type="number"
                  min={0}
                  disabled={isExamFormDisabled}
                  max={poolMediumCount}
                  value={examForm.difficultyDistribution.medium}
                  onChange={(e) =>
                    setExamForm({
                      ...examForm,
                      difficultyDistribution: { ...examForm.difficultyDistribution, medium: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-bold text-red-700 dark:text-red-400">
                  <span>Hard Questions</span>
                  <span className="text-[10px]">Avail: {poolHardCount}</span>
                </div>
                <input
                  type="number"
                  min={0}
                  disabled={isExamFormDisabled}
                  max={poolHardCount}
                  value={examForm.difficultyDistribution.hard}
                  onChange={(e) =>
                    setExamForm({
                      ...examForm,
                      difficultyDistribution: { ...examForm.difficultyDistribution, hard: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Schedule Window */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4 text-xs shadow-xs">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <Calendar className="w-4 h-4 text-[var(--primary)]" />
              Schedule & Availability Window
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[var(--text-secondary)] block mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  disabled={isExamFormDisabled}
                  value={examForm.startTime}
                  onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-[var(--text-secondary)] block mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  disabled={isExamFormDisabled}
                  value={examForm.endTime}
                  onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {!editingExam && (
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publishImmediately"
                  checked={examForm.publishImmediately}
                  onChange={(e) => setExamForm({ ...examForm, publishImmediately: e.target.checked })}
                  className="accent-[var(--primary)] rounded cursor-pointer"
                />
                <label htmlFor="publishImmediately" className="font-bold text-xs text-[var(--text-primary)] cursor-pointer">
                  Publish exam immediately after saving
                </label>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/instructor/dashboard')}>
              Back to Dashboard
            </Button>

            {editingExam ? (
              !editingExam.isLocked ? (
                <>
                  {editingExam.canCancel && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-500 hover:bg-red-500/10"
                      icon={Ban}
                      onClick={() => handleOpenCancelModal(editingExam)}
                    >
                      Cancel Exam
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || approvedQuestions.length === 0}
                  >
                    {isSubmitting ? 'Saving Changes...' : 'Save Exam Changes'}
                  </Button>
                </>
              ) : (
                <Button type="button" variant="secondary" onClick={handleResetToNew}>
                  Build New Exam
                </Button>
              )
            ) : (
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || approvedQuestions.length === 0}
              >
                {isSubmitting ? 'Creating Exam...' : examForm.publishImmediately ? 'Create & Publish Exam' : 'Create Draft Exam'}
              </Button>
            )}
          </div>
        </form>

        {/* Cancellation Confirmation Modal */}
        {showCancelModal && examToCancel && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] max-w-md w-full space-y-4 shadow-xl">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">Cancel this exam?</h3>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                This exam has not started and no student attempt has begun. Cancelling will set its status to <strong>CANCELLED</strong> and prevent students from taking it.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCancelModal(false);
                    setExamToCancel(null);
                  }}
                >
                  Keep Exam
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 text-white border-none"
                  disabled={isSubmitting}
                  onClick={handleConfirmCancelExam}
                >
                  {isSubmitting ? 'Cancelling...' : 'Cancel Exam'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default CreateExamPage;
