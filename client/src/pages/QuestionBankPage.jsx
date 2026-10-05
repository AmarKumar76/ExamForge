import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { courseService } from '../services/courseService';
import { aiService } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  Edit2,
  Trash2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const QuestionBankPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [questions, setQuestions] = useState([]);

  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm, setEditForm] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'MEDIUM',
    topic: '',
  });

  // Load instructor assigned courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoadingCourses(true);
        const res = await courseService.getAll();
        if (res.success && Array.isArray(res.data?.courses)) {
          setCourses(res.data.courses);
          if (res.data.courses.length > 0) {
            setSelectedCourseId(res.data.courses[0]._id || res.data.courses[0].id);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load assigned courses');
      } finally {
        setIsLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  // Load questions when selectedCourseId changes
  useEffect(() => {
    if (selectedCourseId) {
      loadQuestions(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadQuestions = async (courseId) => {
    try {
      setIsLoadingQuestions(true);
      setError(null);
      const res = await aiService.getQuestions(courseId);
      const qList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setQuestions(qList);
    } catch (err) {
      setError(err.message || 'Failed to load questions from Question Bank');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Actions
  const handleApprove = async (qId) => {
    try {
      setError(null);
      const res = await aiService.approveQuestion(qId);
      const updatedDoc = res.data || res;
      setQuestions((prev) => prev.map((q) => ((q._id || q.id) === qId ? updatedDoc : q)));
      setSuccess('Question approved for official exams!');
    } catch (err) {
      setError(err.message || 'Failed to approve question.');
    }
  };

  const handleReject = async (qId) => {
    try {
      setError(null);
      const res = await aiService.rejectQuestion(qId);
      const updatedDoc = res.data || res;
      setQuestions((prev) => prev.map((q) => ((q._id || q.id) === qId ? updatedDoc : q)));
      setSuccess('Question marked as REJECTED.');
    } catch (err) {
      setError(err.message || 'Failed to reject question.');
    }
  };

  const handleRestore = async (qId) => {
    try {
      setError(null);
      const res = await aiService.restoreQuestion(qId);
      const updatedDoc = res.data || res;
      setQuestions((prev) => prev.map((q) => ((q._id || q.id) === qId ? updatedDoc : q)));
      setSuccess('Question restored to DRAFT status successfully!');
    } catch (err) {
      setError(err.message || 'Failed to restore question.');
    }
  };

  const handleDelete = async (qId) => {
    try {
      setError(null);
      const res = await aiService.deleteQuestion(qId);
      if (res.status === 'ARCHIVED') {
        setQuestions((prev) => prev.map((q) => ((q._id || q.id) === qId ? { ...q, status: 'ARCHIVED' } : q)));
        setSuccess('Question is referenced in exams/attempts and has been archived.');
      } else {
        setQuestions((prev) => prev.filter((q) => (q._id || q.id) !== qId));
        setSuccess('Question deleted from Question Bank.');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete question.');
    }
  };

  const openEditModal = (q) => {
    setEditingQuestion(q);
    setEditForm({
      questionText: q.questionText || '',
      options: q.options && q.options.length > 0 ? [...q.options] : ['', '', '', ''],
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'MEDIUM',
      topic: q.topic || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    try {
      setError(null);
      const targetId = editingQuestion._id || editingQuestion.id;
      const res = await aiService.updateQuestion(targetId, editForm);
      const updatedDoc = res.data || res;
      setQuestions((prev) => prev.map((q) => ((q._id || q.id) === targetId ? updatedDoc : q)));
      setEditingQuestion(null);
      setSuccess('Question updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update question.');
    }
  };

  // Filter logic
  const filteredQuestions = questions.filter((q) => {
    if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
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

  const draftCount = questions.filter((q) => q.status === 'DRAFT').length;
  const approvedCount = questions.filter((q) => q.status === 'APPROVED').length;
  const rejectedCount = questions.filter((q) => q.status === 'REJECTED').length;

  return (
    <AppShell title="Question Bank">
      <div className="space-y-6 pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-[var(--primary)]" />
              Academic Question Bank
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Review, filter, edit, and manage approved item pools for official exams.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-full sm:w-64">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                disabled={isLoadingCourses}
                className="w-full px-3 py-2 text-xs font-semibold bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]"
              >
                {courses.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.code}: {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => navigate(`/instructor/ai-studio?courseId=${selectedCourseId}`)}
            >
              AI Question Studio
            </Button>
          </div>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter Controls & Tabs */}
        <div className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: `All (${questions.length})` },
                { id: 'APPROVED', label: `Approved (${approvedCount})` },
                { id: 'DRAFT', label: `Draft (${draftCount})` },
                { id: 'REJECTED', label: `Rejected (${rejectedCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                      : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--background)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search question statement, topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          {/* Sub-Filters */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[var(--border-subtle)] text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)] font-bold">Difficulty:</span>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-2.5 py-1 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              >
                <option value="ALL">All Difficulties</option>
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)] font-bold">Format:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              >
                <option value="ALL">All Types</option>
                <option value="MCQ">MCQ</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="SHORT_ANSWER">Short Answer</option>
              </select>
            </div>

            <span className="ml-auto text-[11px] text-[var(--text-secondary)] font-bold">
              Showing <strong>{filteredQuestions.length}</strong> questions
            </span>
          </div>
        </div>

        {/* Questions List */}
        {isLoadingQuestions ? (
          <div className="p-12 text-center text-xs text-[var(--text-secondary)] bg-[var(--surface)] rounded-2xl border border-[var(--border)] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary)]" />
            Loading Question Bank items...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-[var(--surface)] rounded-2xl border border-[var(--border)] max-w-lg mx-auto">
            <FolderKanban className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">No questions available yet</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {questions.length === 0
                ? 'Generate AI draft questions or import course materials to populate this subject question bank.'
                : 'No questions match your active filter criteria.'}
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => navigate(`/instructor/ai-studio?courseId=${selectedCourseId}`)}
            >
              Go to AI Question Studio
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q, index) => (
              <Card key={q._id || q.id} className="relative">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                  {/* Main Question Content */}
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-[var(--primary)] uppercase">
                        Q{index + 1} • {q.type}
                      </span>
                      <Badge
                        variant={
                          q.status === 'APPROVED'
                            ? 'success'
                            : q.status === 'REJECTED'
                            ? 'error'
                            : 'warning'
                        }
                      >
                        {q.status}
                      </Badge>
                      {q.generationSource === 'AI_RAG' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI RAG Grounded
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-[var(--text-primary)] leading-relaxed">
                      {q.questionText}
                    </p>

                    {/* Options for MCQ / True False */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, i) => {
                          const isCorrect = opt === q.correctAnswer;
                          return (
                            <div
                              key={i}
                              className={`p-2.5 rounded-xl text-xs border ${
                                isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold'
                                  : 'bg-[var(--background)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                              }`}
                            >
                              {isCorrect ? '✓ ' : `${String.fromCharCode(65 + i)}. `}
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1">
                        <span className="font-bold text-[var(--text-primary)] block">Explanation:</span>
                        <p>{q.explanation}</p>
                      </div>
                    )}

                    {/* Source Grounding */}
                    {q.sourceReferences && q.sourceReferences.length > 0 && (
                      <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[11px] text-[var(--text-secondary)] space-y-1">
                        <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" /> Source Grounding:
                        </span>
                        {q.sourceReferences.map((ref, idx) => (
                          <p key={idx} className="truncate">
                            • Document: <strong className="text-[var(--text-primary)]">{ref.fileName}</strong> — "{ref.snippet}"
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Actions Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border-subtle)]">
                      {q.status !== 'APPROVED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Check}
                          onClick={() => handleApprove(q._id || q.id)}
                        >
                          Approve Question
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Edit2}
                        onClick={() => openEditModal(q)}
                      >
                        Edit
                      </Button>
                      {(q.status === 'REJECTED' || q.status === 'ARCHIVED') && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={RefreshCw}
                          onClick={() => handleRestore(q._id || q.id)}
                        >
                          Restore to Draft
                        </Button>
                      )}
                      {q.status !== 'REJECTED' && q.status !== 'ARCHIVED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={X}
                          onClick={() => handleReject(q._id || q.id)}
                          className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                        >
                          Reject
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(q._id || q.id)}
                        className="text-red-600 dark:text-red-400 hover:bg-red-500/10"
                      >
                        Delete / Archive
                      </Button>
                    </div>
                  </div>

                  {/* Metadata Sidebar */}
                  <div className="w-full lg:w-56 p-4 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)] space-y-2 text-xs shrink-0">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">
                        Difficulty
                      </span>
                      <span className="font-bold text-[var(--text-primary)]">{q.difficulty}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">
                        Topic
                      </span>
                      <span className="font-bold text-[var(--text-primary)] truncate block">
                        {q.topic || 'General'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold">
                        Status
                      </span>
                      <span
                        className={`font-extrabold ${
                          q.status === 'APPROVED'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : q.status === 'REJECTED'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {q.status}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* MODAL: EDIT QUESTION */}
        {editingQuestion && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Edit Question</h3>
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">
                    Question Statement
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.questionText}
                    onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                    className="w-full p-2.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                {editingQuestion.type === 'MCQ' && (
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">Options</label>
                    <div className="space-y-2">
                      {editForm.options.map((opt, i) => (
                        <input
                          key={i}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...editForm.options];
                            newOptions[i] = e.target.value;
                            setEditForm({ ...editForm, options: newOptions });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          className="w-full px-3 py-1.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">Correct Answer</label>
                  <input
                    type="text"
                    value={editForm.correctAnswer}
                    onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">Explanation</label>
                  <textarea
                    rows={2}
                    value={editForm.explanation}
                    onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                    className="w-full p-2.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">Difficulty</label>
                    <select
                      value={editForm.difficulty}
                      onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                      className="w-full px-3 py-1.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-secondary)] mb-1">Topic</label>
                    <input
                      type="text"
                      value={editForm.topic}
                      onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                      className="w-full px-3 py-1.5 bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <Button variant="secondary" size="sm" onClick={() => setEditingQuestion(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
