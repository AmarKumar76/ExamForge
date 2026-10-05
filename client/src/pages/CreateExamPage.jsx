import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { courseService } from '../services/courseService';
import { aiService } from '../services/aiService';
import { examService } from '../services/examService';
import {
  FileText,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Search,
  Filter,
} from 'lucide-react';

export const CreateExamPage = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [approvedQuestions, setApprovedQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Filters for question selection list
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    questionsPerStudent: 0,
    difficultyDistribution: {
      easy: 0,
      medium: 0,
      hard: 0,
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

  // Load APPROVED questions when course changes
  useEffect(() => {
    if (!selectedCourseId) return;

    const loadQuestions = async () => {
      try {
        setIsLoadingQuestions(true);
        setSelectedQuestionIds([]);
        const res = await aiService.getQuestions(selectedCourseId, 'APPROVED');
        const qList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        setApprovedQuestions(qList);
        setSelectedQuestionIds(qList.map((q) => q._id || q.id));
        setExamForm((prev) => ({
          ...prev,
          questionsPerStudent: qList.length,
          difficultyDistribution: {
            easy: qList.filter((q) => q.difficulty === 'EASY').length,
            medium: qList.filter((q) => q.difficulty === 'MEDIUM').length,
            hard: qList.filter((q) => q.difficulty === 'HARD').length,
          },
        }));
      } catch (err) {
        setApprovedQuestions([]);
      } finally {
        setIsLoadingQuestions(false);
      }
    };
    loadQuestions();
  }, [selectedCourseId]);

  // Derived question pool metrics
  const poolEasyCount = approvedQuestions.filter((q) => q.difficulty === 'EASY').length;
  const poolMediumCount = approvedQuestions.filter((q) => q.difficulty === 'MEDIUM').length;
  const poolHardCount = approvedQuestions.filter((q) => q.difficulty === 'HARD').length;

  // Selected pool metrics
  const selectedQuestions = approvedQuestions.filter((q) => selectedQuestionIds.includes(q._id || q.id));
  const selectedEasyCount = selectedQuestions.filter((q) => q.difficulty === 'EASY').length;
  const selectedMediumCount = selectedQuestions.filter((q) => q.difficulty === 'MEDIUM').length;
  const selectedHardCount = selectedQuestions.filter((q) => q.difficulty === 'HARD').length;

  const handleToggleQuestion = (qId) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  const filteredApprovedQuestions = approvedQuestions.filter((q) => {
    if (difficultyFilter !== 'ALL' && q.difficulty !== difficultyFilter) return false;
    if (typeFilter !== 'ALL' && q.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchText = q.questionText?.toLowerCase().includes(query);
      const matchTopic = q.topic?.toLowerCase().includes(query);
      if (!matchText && !matchTopic) return false;
    }
    return true;
  });

  const handleSelectAllFilteredQuestions = () => {
    const filteredIds = filteredApprovedQuestions.map((q) => q._id || q.id);
    const allFilteredSelected = filteredIds.every((id) => selectedQuestionIds.includes(id));

    if (allFilteredSelected) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => !filteredIds.includes(id)));
    } else {
      const newSelected = [...new Set([...selectedQuestionIds, ...filteredIds])];
      setSelectedQuestionIds(newSelected);
    }
  };

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    if (!examForm.title || !selectedCourseId) return;

    if (selectedQuestionIds.length === 0) {
      setError('At least one approved question must be selected for an official exam.');
      return;
    }

    const perStudent = parseInt(examForm.questionsPerStudent, 10) || selectedQuestionIds.length;
    if (perStudent > selectedQuestionIds.length) {
      setError(`Questions per student (${perStudent}) cannot exceed total selected question pool (${selectedQuestionIds.length}).`);
      return;
    }

    const reqEasy = parseInt(examForm.difficultyDistribution.easy || 0, 10);
    const reqMed = parseInt(examForm.difficultyDistribution.medium || 0, 10);
    const reqHard = parseInt(examForm.difficultyDistribution.hard || 0, 10);
    const sumDist = reqEasy + reqMed + reqHard;

    if (sumDist > 0 && sumDist !== perStudent) {
      setError(`Difficulty distribution sum (${sumDist} = ${reqEasy} Easy + ${reqMed} Medium + ${reqHard} Hard) must equal questions per student (${perStudent}).`);
      return;
    }

    if (reqEasy > selectedEasyCount) {
      setError(`Not enough approved Easy questions. Required: ${reqEasy}, Available in selected pool: ${selectedEasyCount}.`);
      return;
    }
    if (reqMed > selectedMediumCount) {
      setError(`Not enough approved Medium questions. Required: ${reqMed}, Available in selected pool: ${selectedMediumCount}.`);
      return;
    }
    if (reqHard > selectedHardCount) {
      setError(`Not enough approved Hard questions. Required: ${reqHard}, Available in selected pool: ${selectedHardCount}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        courseId: selectedCourseId,
        title: examForm.title.trim(),
        description: examForm.description.trim(),
        duration: parseInt(examForm.duration, 10) || 60,
        totalMarks: parseInt(examForm.totalMarks, 10) || 100,
        passingMarks: parseInt(examForm.passingMarks, 10) || 40,
        questionIds: selectedQuestionIds,
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
          setSuccess(`Exam "${examForm.title}" created and published successfully! Enrolled students can now access it.`);
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
    <AppShell title="Exam Builder">
      <div className="space-y-6 max-w-4xl pb-12">
        {/* Header */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Official Exam Builder & Publisher</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Configure assessment parameters and assemble official exams exclusively using approved question bank items.
          </p>
        </div>

        {success && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center justify-between">
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
          {/* Section 1: Subject & Details */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4 text-xs">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <BookOpen className="w-4 h-4 text-[var(--primary)]" />
              Subject & Basic Configurations
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Target Subject / Course</label>
                {isLoadingCourses ? (
                  <div className="text-[11px] text-[var(--text-secondary)]">Loading subjects...</div>
                ) : courses.length === 0 ? (
                  <div className="text-[11px] text-red-500 font-bold">You are not assigned to any subjects.</div>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-semibold"
                  >
                    {courses.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.code} — {c.name || c.title} ({c.department})
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
                  placeholder="e.g. Midterm Examination 2026"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[var(--text-primary)] block mb-1">Instructions / Description</label>
              <textarea
                rows={2}
                placeholder="e.g. Answer all questions within the allocated time limit. No external aids allowed."
                value={examForm.description}
                onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  min={10}
                  max={300}
                  value={examForm.duration}
                  onChange={(e) => setExamForm({ ...examForm, duration: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Total Marks</label>
                <input
                  type="number"
                  required
                  value={examForm.totalMarks}
                  onChange={(e) => setExamForm({ ...examForm, totalMarks: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Passing Marks</label>
                <input
                  type="number"
                  required
                  value={examForm.passingMarks}
                  onChange={(e) => setExamForm({ ...examForm, passingMarks: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            {/* Schedule Controls */}
            <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
              <h3 className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider">Exam Schedule Window</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[var(--text-secondary)] block mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={examForm.startTime}
                    onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--text-secondary)] block mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={examForm.endTime}
                    onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Approved Question Pool & Student Distribution */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-6 text-xs">
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                  Approved Question Pool & Randomization Config
                </h2>
                <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                  Configure server-side random question allocation per student from the official approved pool.
                </span>
              </div>

              {/* Pool Overview Badges */}
              <div className="flex items-center gap-2">
                <Badge variant="primary">Total Approved Pool: {approvedQuestions.length}</Badge>
                <Badge variant="success">Easy: {poolEasyCount}</Badge>
                <Badge variant="warning">Medium: {poolMediumCount}</Badge>
                <Badge variant="danger">Hard: {poolHardCount}</Badge>
              </div>
            </div>

            {/* Questions per Student & Difficulty Breakdown per Student */}
            <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">
                    Questions Per Student
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedQuestionIds.length || 1}
                    value={examForm.questionsPerStudent}
                    onChange={(e) => setExamForm({ ...examForm, questionsPerStudent: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-bold focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                    Available in selected pool: <strong>{selectedQuestionIds.length}</strong>
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)]">
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
                      / {examForm.questionsPerStudent}
                    </span>
                  </div>

                  <span className="text-[11px] text-[var(--text-secondary)]">
                    {Number(examForm.difficultyDistribution.easy) +
                      Number(examForm.difficultyDistribution.medium) +
                      Number(examForm.difficultyDistribution.hard) ===
                    Number(examForm.questionsPerStudent)
                      ? '✓ Distribution matches'
                      : '⚠️ Sum must equal Questions/Student'}
                  </span>
                </div>
              </div>

              {/* Per-Student Difficulty Breakdown Controls */}
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-2 uppercase tracking-wider text-[10px]">
                  Per-Student Difficulty Allocation
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                      Easy Questions ({selectedEasyCount} Avail)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={selectedEasyCount}
                      value={examForm.difficultyDistribution.easy}
                      onChange={(e) =>
                        setExamForm({
                          ...examForm,
                          difficultyDistribution: {
                            ...examForm.difficultyDistribution,
                            easy: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                      Medium Questions ({selectedMediumCount} Avail)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={selectedMediumCount}
                      value={examForm.difficultyDistribution.medium}
                      onChange={(e) =>
                        setExamForm({
                          ...examForm,
                          difficultyDistribution: {
                            ...examForm.difficultyDistribution,
                            medium: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-red-600 dark:text-red-400 mb-1">
                      Hard Questions ({selectedHardCount} Avail)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={selectedHardCount}
                      value={examForm.difficultyDistribution.hard}
                      onChange={(e) =>
                        setExamForm({
                          ...examForm,
                          difficultyDistribution: {
                            ...examForm.difficultyDistribution,
                            hard: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Question Selection & Filtering */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[var(--text-primary)]">
                    Select Questions for Pool ({selectedQuestionIds.length} Selected)
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={handleSelectAllFilteredQuestions}>
                    {filteredApprovedQuestions.every((q) => selectedQuestionIds.includes(q._id || q.id))
                      ? 'Deselect Filtered'
                      : 'Select Filtered'}
                  </Button>
                </div>
              </div>

              {/* Search & Sub-filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--background)] p-3 rounded-xl border border-[var(--border-subtle)]">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search approved questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[var(--text-muted)]">Difficulty:</span>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs"
                    >
                      <option value="ALL">All</option>
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[var(--text-muted)]">Type:</span>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs"
                    >
                      <option value="ALL">All</option>
                      <option value="MCQ">MCQ</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              {isLoadingQuestions ? (
                <div className="p-8 text-center text-xs text-[var(--text-secondary)]">Loading approved question bank...</div>
              ) : approvedQuestions.length === 0 ? (
                <div className="p-8 text-center space-y-4 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                  <Sparkles className="w-8 h-8 text-[var(--primary)] mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-[var(--text-primary)] text-sm">No Approved Questions Available</h3>
                    <p className="text-[11px] text-[var(--text-secondary)] max-w-sm mx-auto">
                      You cannot publish an exam without questions. Please approve draft questions in Question Bank first.
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 pt-2">
                    <Button type="button" variant="primary" size="sm" icon={Sparkles} onClick={() => navigate('/instructor/ai-studio')}>
                      Go to AI Question Studio
                    </Button>
                    <Button type="button" variant="secondary" size="sm" icon={BookOpen} onClick={() => navigate('/instructor/question-bank')}>
                      Go to Question Bank
                    </Button>
                  </div>
                </div>
              ) : filteredApprovedQuestions.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                  No approved questions match your search filter criteria.
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {filteredApprovedQuestions.map((q) => {
                    const qId = q._id || q.id;
                    const isChecked = selectedQuestionIds.includes(qId);
                    return (
                      <label
                        key={qId}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isChecked
                            ? 'bg-[var(--primary-light)]/20 border-[var(--primary)]'
                            : 'bg-[var(--background)] border-[var(--border-subtle)] hover:border-[var(--primary-border)]'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="primary">{q.type}</Badge>
                            <Badge variant="neutral">{q.difficulty}</Badge>
                            <span className="text-[10px] text-[var(--text-secondary)] font-semibold">Topic: {q.topic || 'General'}</span>
                          </div>
                          <p className="font-bold text-[var(--text-primary)] text-xs">{q.questionText}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleQuestion(qId)}
                          className="w-4 h-4 mt-1 rounded text-[var(--primary)] focus:ring-[var(--primary)] shrink-0"
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Publishing Option & Actions */}
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={examForm.publishImmediately}
                onChange={(e) => setExamForm({ ...examForm, publishImmediately: e.target.checked })}
                disabled={selectedQuestionIds.length === 0}
                className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">Publish Exam Immediately</span>
                <span className="text-[11px] text-[var(--text-secondary)]">Makes the exam active/scheduled for enrolled students</span>
              </div>
            </label>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate('/instructor/dashboard')}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={PlusCircle}
                loading={isSubmitting}
                disabled={courses.length === 0 || selectedQuestionIds.length === 0}
              >
                {examForm.publishImmediately ? 'Create & Publish Exam' : 'Save Draft Exam'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
};
