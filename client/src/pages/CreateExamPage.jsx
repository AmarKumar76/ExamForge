import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { courseService } from '../services/courseService';
import { aiService } from '../services/aiService';
import { examService } from '../services/examService';
import { folderService } from '../services/folderService';
import {
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  Sparkles,
  Folder,
  Calendar,
  Clock,
  Award,
} from 'lucide-react';

export const CreateExamPage = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [folders, setFolders] = useState([]);
  const [uncategorizedFolder, setUncategorizedFolder] = useState(null);
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);

  const [approvedQuestions, setApprovedQuestions] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
        if (courseList.length > 0) {
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

  // Load folders when selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) return;
    const loadFolders = async () => {
      try {
        const res = await folderService.getFolders(selectedCourseId);
        if (res.data?.folders) {
          setFolders(res.data.folders);
          setUncategorizedFolder(res.data.uncategorized || null);
          if (res.data.folders.length > 0) {
            setSelectedFolderIds([res.data.folders[0].id || res.data.folders[0]._id]);
          } else {
            setSelectedFolderIds(['uncategorized']);
          }
        }
      } catch (err) {
        console.warn('Failed to load folders:', err.message);
      }
    };
    loadFolders();
  }, [selectedCourseId]);

  // Load APPROVED questions for selected folder(s)
  useEffect(() => {
    if (!selectedCourseId) return;

    const loadQuestions = async () => {
      try {
        setIsLoadingQuestions(true);
        let qList = [];
        if (selectedFolderIds.length === 0) {
          const res = await aiService.getQuestions(selectedCourseId, 'APPROVED', '');
          qList = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
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

        // Auto suggestion for questionsPerStudent and difficulty distribution if unconfigured
        const easyAvail = qList.filter((q) => q.difficulty === 'EASY').length;
        const medAvail = qList.filter((q) => q.difficulty === 'MEDIUM').length;
        const hardAvail = qList.filter((q) => q.difficulty === 'HARD').length;
        const totalAvail = qList.length;

        if (totalAvail > 0) {
          const suggestedTotal = Math.min(totalAvail, 20);
          const suggestedEasy = Math.min(easyAvail, Math.floor(suggestedTotal * 0.4));
          const suggestedMed = Math.min(medAvail, Math.floor(suggestedTotal * 0.4));
          const suggestedHard = Math.min(hardAvail, suggestedTotal - suggestedEasy - suggestedMed);

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

  // Derived pool metrics
  const poolEasyCount = approvedQuestions.filter((q) => q.difficulty === 'EASY').length;
  const poolMediumCount = approvedQuestions.filter((q) => q.difficulty === 'MEDIUM').length;
  const poolHardCount = approvedQuestions.filter((q) => q.difficulty === 'HARD').length;

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    if (!examForm.title || !selectedCourseId) return;

    if (approvedQuestions.length === 0) {
      setError('Selected folder contains no approved questions. Please select a folder with approved questions.');
      return;
    }

    const perStudent = parseInt(examForm.questionsPerStudent, 10) || 0;
    if (perStudent <= 0) {
      setError('Questions Per Student must be greater than 0.');
      return;
    }

    if (perStudent > approvedQuestions.length) {
      setError(`Questions Per Student (${perStudent}) cannot exceed available approved questions (${approvedQuestions.length}) in the selected folder.`);
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
      setError(`Only ${poolEasyCount} Easy question(s) are available in this folder. You requested ${reqEasy}.`);
      return;
    }
    if (reqMed > poolMediumCount) {
      setError(`Only ${poolMediumCount} Medium question(s) are available in this folder. You requested ${reqMed}.`);
      return;
    }
    if (reqHard > poolHardCount) {
      setError(`Only ${poolHardCount} Hard question(s) are available in this folder. You requested ${reqHard}.`);
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
        startTime: examForm.startTime || null,
        endTime: examForm.endTime || null,
      };

      const res = await examService.create(payload);
      if (res.success) {
        const createdExam = res.data.exam;

        if (examForm.publishImmediately) {
          await examService.publish(createdExam.id || createdExam._id);
          setSuccess(`Exam "${examForm.title}" created and published successfully!`);
        } else {
          setSuccess(`Draft exam "${examForm.title}" saved successfully!`);
        }

        setTimeout(() => {
          navigate('/instructor/dashboard');
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to create exam.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Create Exam">
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[var(--primary)]" />
            Official Exam Builder
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Select a Question Folder to randomly assign questions to students per exam attempt.
          </p>
        </div>

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
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold"
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
                  placeholder="e.g. Enterprise Java Unit Test"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[var(--text-primary)] block mb-1">Description / Scope</label>
              <textarea
                rows={2}
                placeholder="e.g. Unit 2 assessment covering Servlets and JSP."
                value={examForm.description}
                onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  min={10}
                  max={300}
                  value={examForm.duration}
                  onChange={(e) => setExamForm({ ...examForm, duration: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Total Marks</label>
                <input
                  type="number"
                  required
                  value={examForm.totalMarks}
                  onChange={(e) => setExamForm({ ...examForm, totalMarks: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Passing Marks</label>
                <input
                  type="number"
                  required
                  value={examForm.passingMarks}
                  onChange={(e) => setExamForm({ ...examForm, passingMarks: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Question Folder Selection */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4 text-xs shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Folder className="w-4 h-4 text-[var(--primary)]" />
                  Question Source Folder
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Select unit folder(s) to draw approved questions from for random assignment.
                </p>
              </div>
              <Badge variant="primary" size="md">
                Available Approved: {approvedQuestions.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Unassigned Option */}
              {uncategorizedFolder?.counts?.approved > 0 && (
                <label
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedFolderIds.includes('uncategorized')
                      ? 'bg-[var(--primary-light)] border-[var(--primary-border)] shadow-xs'
                      : 'bg-[var(--background)] border-[var(--border-subtle)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFolderIds.includes('uncategorized')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFolderIds([...selectedFolderIds, 'uncategorized']);
                        } else {
                          setSelectedFolderIds(selectedFolderIds.filter((id) => id !== 'uncategorized'));
                        }
                      }}
                      className="accent-[var(--primary)] w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-xs text-[var(--text-primary)]">Unassigned Questions</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">
                        {uncategorizedFolder.counts.approved} Approved Questions
                      </div>
                    </div>
                  </div>
                  <Badge variant="neutral">{uncategorizedFolder.counts.approved}</Badge>
                </label>
              )}

              {/* Unit Folders */}
              {folders.map((f) => {
                const fId = f.id || f._id;
                const isChecked = selectedFolderIds.includes(fId);
                const approvedCount = f.counts?.approved || 0;

                return (
                  <label
                    key={fId}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-[var(--primary-light)] border-[var(--primary-border)] shadow-xs'
                        : 'bg-[var(--background)] border-[var(--border-subtle)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFolderIds([...selectedFolderIds, fId]);
                          } else {
                            setSelectedFolderIds(selectedFolderIds.filter((id) => id !== fId));
                          }
                        }}
                        className="accent-[var(--primary)] w-4 h-4"
                      />
                      <div>
                        <div className="font-bold text-xs text-[var(--text-primary)]">{f.title}</div>
                        <div className="text-[10px] text-[var(--text-secondary)]">
                          {approvedCount} Approved Questions
                        </div>
                      </div>
                    </div>
                    <Badge variant={isChecked ? 'primary' : 'neutral'}>{approvedCount}</Badge>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 3: Student Randomization Config */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4 text-xs shadow-xs">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <Award className="w-4 h-4 text-[var(--primary)]" />
              Student Randomization & Difficulty Config
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">
                  Questions Per Student
                </label>
                <input
                  type="number"
                  min={1}
                  max={approvedQuestions.length || 1}
                  value={examForm.questionsPerStudent}
                  onChange={(e) => setExamForm({ ...examForm, questionsPerStudent: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-bold focus:ring-2 focus:ring-[var(--primary)]"
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                  Folder Pool Size: <strong>{approvedQuestions.length} Approved Questions</strong>
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
                  max={poolEasyCount}
                  value={examForm.difficultyDistribution.easy}
                  onChange={(e) =>
                    setExamForm({
                      ...examForm,
                      difficultyDistribution: { ...examForm.difficultyDistribution, easy: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-bold"
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
                  max={poolMediumCount}
                  value={examForm.difficultyDistribution.medium}
                  onChange={(e) =>
                    setExamForm({
                      ...examForm,
                      difficultyDistribution: { ...examForm.difficultyDistribution, medium: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-bold"
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
                  max={poolHardCount}
                  value={examForm.difficultyDistribution.hard}
                  onChange={(e) =>
                    setExamForm({
                      ...examForm,
                      difficultyDistribution: { ...examForm.difficultyDistribution, hard: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs font-bold"
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
                  value={examForm.startTime}
                  onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-[var(--text-secondary)] block mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={examForm.endTime}
                  onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold"
                />
              </div>
            </div>

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
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => navigate('/instructor/dashboard')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || approvedQuestions.length === 0}
            >
              {isSubmitting ? 'Creating Exam...' : examForm.publishImmediately ? 'Create & Publish Exam' : 'Create Draft Exam'}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
};
