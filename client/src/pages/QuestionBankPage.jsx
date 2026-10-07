import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { courseService } from '../services/courseService';
import { aiService } from '../services/aiService';
import { folderService } from '../services/folderService';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban,
  Sparkles,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Folder,
  FolderPlus,
  Move,
  ChevronLeft,
  RefreshCw,
} from 'lucide-react';

export const QuestionBankPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [folders, setFolders] = useState([]);
  const [uncategorizedFolder, setUncategorizedFolder] = useState(null);
  const [allCourseCounts, setAllCourseCounts] = useState(null);

  // 'ALL' = Folders Overview Mode, 'uncategorized' = Unassigned Questions Mode, or folder _id
  const [selectedFolderId, setSelectedFolderId] = useState('ALL');

  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Folder Modal State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [folderForm, setFolderForm] = useState({ title: '', description: '' });

  // Move Modal State
  const [moveModalQuestionId, setMoveModalQuestionId] = useState(null); // single question or 'BULK'
  const [targetMoveFolderId, setTargetMoveFolderId] = useState('uncategorized');

  // Edit Question Modal State
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
        setError(err.message || 'Failed to load assigned courses');
      } finally {
        setIsLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  // Load folders & questions when selectedCourseId changes
  useEffect(() => {
    if (selectedCourseId) {
      loadFoldersAndQuestions(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Reload questions when selectedFolderId changes
  useEffect(() => {
    if (selectedCourseId) {
      loadQuestions(selectedCourseId, selectedFolderId);
    }
  }, [selectedFolderId]);

  const loadFoldersAndQuestions = async (courseId) => {
    await Promise.all([loadFolders(courseId), loadQuestions(courseId, selectedFolderId)]);
  };

  const loadFolders = async (courseId) => {
    try {
      setIsLoadingFolders(true);
      const res = await folderService.getFolders(courseId);
      if (res.data) {
        setFolders(res.data.folders || []);
        setUncategorizedFolder(res.data.uncategorized || null);
        setAllCourseCounts(res.data.allCourseCounts || null);
      }
    } catch (err) {
      console.error('Failed to load folders:', err);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const loadQuestions = async (courseId, folderId) => {
    try {
      setIsLoadingQuestions(true);
      setError(null);
      const folderParam = folderId === 'ALL' ? '' : folderId;
      const res = await aiService.getQuestions(courseId, '', folderParam);
      const qList = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
      setQuestions(qList);
      setSelectedQuestionIds([]);
    } catch (err) {
      setError(err.message || 'Failed to load questions from Question Bank');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Folder CRUD handlers
  const handleOpenCreateFolder = () => {
    setEditingFolder(null);
    setFolderForm({ title: '', description: '' });
    setIsFolderModalOpen(true);
  };

  const handleOpenEditFolder = (folder) => {
    setEditingFolder(folder);
    setFolderForm({ title: folder.title || '', description: folder.description || '' });
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = async () => {
    if (!folderForm.title.trim()) {
      setError('Folder title is required');
      return;
    }
    try {
      setError(null);
      if (editingFolder) {
        await folderService.updateFolder(editingFolder.id || editingFolder._id, folderForm);
        setSuccess(`Folder "${folderForm.title}" updated successfully!`);
      } else {
        const res = await folderService.createFolder(selectedCourseId, {
          ...folderForm,
          questionIds: selectedQuestionIds,
        });
        const newFolderId = res.data?._id || res.data?.id;
        if (selectedQuestionIds.length > 0) {
          setSuccess(`Folder "${folderForm.title}" created and ${selectedQuestionIds.length} question(s) moved into it!`);
        } else {
          setSuccess(`Folder "${folderForm.title}" created successfully!`);
        }
        if (newFolderId) {
          setSelectedFolderId(newFolderId);
        }
      }
      setSelectedQuestionIds([]);
      setIsFolderModalOpen(false);
      await loadFoldersAndQuestions(selectedCourseId);
    } catch (err) {
      setError(err.message || 'Failed to save folder.');
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Are you sure you want to delete folder "${folder.title}"? Questions in this folder will be moved to Unassigned.`)) {
      return;
    }
    try {
      setError(null);
      await folderService.deleteFolder(folder.id || folder._id);
      setSuccess(`Folder "${folder.title}" deleted. Questions moved to Unassigned Questions.`);
      if (selectedFolderId === (folder.id || folder._id)) {
        setSelectedFolderId('ALL');
      }
      await loadFoldersAndQuestions(selectedCourseId);
    } catch (err) {
      setError(err.message || 'Failed to delete folder.');
    }
  };

  // Move Question Handlers
  const handleOpenMoveModal = (qId) => {
    setMoveModalQuestionId(qId);
    setTargetMoveFolderId('uncategorized');
    setIsFolderModalOpen(false);
  };

  const handleConfirmMove = async () => {
    try {
      setError(null);
      if (moveModalQuestionId === 'BULK') {
        if (selectedQuestionIds.length === 0) return;
        await folderService.bulkMoveQuestions(selectedQuestionIds, targetMoveFolderId);
        setSuccess(`${selectedQuestionIds.length} question(s) saved to folder successfully!`);
      } else {
        await folderService.moveQuestion(moveModalQuestionId, targetMoveFolderId);
        setSuccess(targetMoveFolderId === 'uncategorized' ? 'Question moved to Unassigned' : 'Question saved to folder successfully!');
      }
      setMoveModalQuestionId(null);
      setSelectedQuestionIds([]);
      await loadFoldersAndQuestions(selectedCourseId);
    } catch (err) {
      setError(err.message || 'Failed to move question.');
    }
  };

  // Question Action Handlers
  const handleApprove = async (qId) => {
    try {
      setError(null);
      const res = await aiService.approveQuestion(qId);
      const updatedDoc = res.data || res;
      setQuestions((prev) => prev.map((q) => ((q._id || q.id) === qId ? updatedDoc : q)));
      setSuccess('Question approved for official exams!');
      loadFolders(selectedCourseId);
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
      loadFolders(selectedCourseId);
    } catch (err) {
      setError(err.message || 'Failed to reject question.');
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

  const toggleSelectQuestion = (id) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredQuestions = questions.filter((q) => {
    if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
    if (difficultyFilter !== 'ALL' && q.difficulty !== difficultyFilter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchText = q.questionText?.toLowerCase().includes(query);
      const matchTopic = q.topic?.toLowerCase().includes(query);
      if (!matchText && !matchTopic) return false;
    }
    return true;
  });

  const selectedFolderObj = folders.find((f) => (f.id || f._id) === selectedFolderId);
  const selectedCourse = courses.find((c) => (c._id || c.id) === selectedCourseId);

  return (
    <AppShell title="Question Bank">
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-[var(--primary)]" />
              Academic Question Bank
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Manage approved unit folders and create official exams for your assigned courses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-full sm:w-64">
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedFolderId('ALL');
                }}
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
              onClick={() =>
                navigate(
                  `/instructor/ai-studio?courseId=${selectedCourseId}${
                    selectedFolderId && selectedFolderId !== 'ALL' ? `&folderId=${selectedFolderId}` : ''
                  }`
                )
              }
            >
              AI Question Studio
            </Button>
          </div>
        </div>

        {/* Banners */}
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

        {/* MAIN VIEW MODE 1: ALL FOLDERS OVERVIEW */}
        {selectedFolderId === 'ALL' ? (
          <div className="space-y-6">
            {/* Section 1: Question Folders Header */}
            <div className="flex items-center justify-between bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Folder className="w-5 h-5 text-[var(--primary)]" />
                  Question Folders for {selectedCourse?.code || 'Course'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Organized unit/chapter folders containing approved questions for exam creation.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={FolderPlus}
                onClick={handleOpenCreateFolder}
              >
                Create Unit Folder
              </Button>
            </div>

            {/* Folder Cards Grid */}
            {isLoadingFolders ? (
              <div className="p-12 text-center bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--primary)] mb-2" />
                <p className="text-xs text-[var(--text-secondary)]">Loading unit folders...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Created Unit Folders */}
                {folders.map((f) => {
                  const fId = f.id || f._id;
                  const c = f.counts || { total: 0, approved: 0, draft: 0 };
                  return (
                    <Card
                      key={fId}
                      className="p-5 rounded-2xl border border-[var(--border)] hover:border-[var(--primary)] transition-all cursor-pointer group space-y-3 shadow-xs"
                      onClick={() => setSelectedFolderId(fId)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                            <Folder className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                              {f.title}
                            </h3>
                            <span className="text-[11px] text-[var(--text-secondary)]">
                              {f.description || 'Unit Chapter Folder'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditFolder(f);
                            }}
                            className="p-1 text-[var(--text-secondary)] hover:text-[var(--primary)] rounded-md"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(f);
                            }}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {c.approved} Approved
                        </span>
                        <span className="text-[var(--text-muted)]">{c.total} Total Items</span>
                      </div>
                    </Card>
                  );
                })}

                {/* Unassigned / Unfoldered Card if questions exist */}
                {uncategorizedFolder?.counts?.total > 0 && (
                  <Card
                    className="p-5 rounded-2xl border border-dashed border-amber-500/40 hover:border-amber-500 transition-all cursor-pointer group space-y-3 bg-amber-500/5"
                    onClick={() => setSelectedFolderId('uncategorized')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">
                          Unassigned Questions
                        </h3>
                        <span className="text-[11px] text-[var(--text-secondary)]">
                          Questions not assigned to a unit folder
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-600">
                        {uncategorizedFolder?.counts?.approved || 0} Approved
                      </span>
                      <span className="text-[var(--text-muted)]">
                        {uncategorizedFolder?.counts?.total || 0} Questions
                      </span>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        ) : (
          /* MAIN VIEW MODE 2: INSIDE A SPECIFIC FOLDER VIEW */
          <div className="space-y-4">
            {/* Header / Back Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedFolderId('ALL')}
                  className="p-2 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--primary)] hover:text-white transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Folders
                </button>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Folder className="w-5 h-5 text-blue-500" />
                    {selectedFolderId === 'uncategorized'
                      ? 'Unassigned Questions'
                      : selectedFolderObj?.title || 'Unit Folder'}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {selectedFolderId === 'uncategorized'
                      ? 'Questions not assigned to any specific unit'
                      : selectedFolderObj?.description || 'Approved unit questions'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="success" size="md">
                  {selectedFolderId === 'uncategorized'
                    ? `${uncategorizedFolder?.counts?.approved || 0} Approved`
                    : `${selectedFolderObj?.counts?.approved || 0} Approved Questions`}
                </Badge>

                {selectedQuestionIds.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Move}
                    onClick={() => handleOpenMoveModal('BULK')}
                  >
                    Save {selectedQuestionIds.length} to Folder
                  </Button>
                )}
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-2">
                {['ALL', 'APPROVED', 'DRAFT', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>

            {/* Question Cards List */}
            {isLoadingQuestions ? (
              <div className="p-12 text-center bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--primary)] mb-2" />
                <p className="text-xs text-[var(--text-secondary)]">Loading questions...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-12 text-center bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
                <BookOpen className="w-8 h-8 mx-auto text-[var(--text-muted)] mb-3 opacity-50" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">No questions in this folder</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Use AI Question Studio to generate new items for this unit.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q) => {
                  const qId = q._id || q.id;
                  const isSelected = selectedQuestionIds.includes(qId);
                  return (
                    <Card key={qId} className={`p-5 rounded-2xl border transition-all ${isSelected ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]/20' : ''}`}>
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectQuestion(qId)}
                          className="mt-1 rounded text-[var(--primary)] cursor-pointer"
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={q.difficulty === 'EASY' ? 'success' : q.difficulty === 'HARD' ? 'danger' : 'warning'} size="sm">
                                {q.difficulty}
                              </Badge>
                              <Badge variant="outline" size="sm">{q.type}</Badge>
                              <span className="text-xs font-semibold text-[var(--text-muted)]">{q.topic || 'General'}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant={q.status === 'APPROVED' ? 'success' : q.status === 'REJECTED' ? 'danger' : 'default'} size="sm">
                                {q.status}
                              </Badge>

                              {q.status === 'DRAFT' && (
                                <button onClick={() => handleApprove(qId)} className="px-2.5 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all cursor-pointer">
                                  Approve
                                </button>
                              )}

                              <button onClick={() => handleOpenMoveModal(qId)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--primary)] rounded-lg cursor-pointer" title="Move to folder">
                                <Move className="w-4 h-4" />
                              </button>
                              <button onClick={() => openEditModal(q)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--primary)] rounded-lg cursor-pointer" title="Edit Question">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="text-sm font-semibold text-[var(--text-primary)]">{q.questionText}</div>

                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {q.options.map((opt, idx) => (
                                <div key={idx} className={`p-2 rounded-xl text-xs border ${opt === q.correctAnswer ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 font-bold' : 'bg-[var(--background)] border-[var(--border-subtle)] text-[var(--text-secondary)]'}`}>
                                  <span className="font-bold mr-1.5">{String.fromCharCode(65 + idx)}.</span>{opt}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Folder Modal */}
        {isFolderModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {editingFolder ? 'Edit Unit Folder' : 'Create Unit Folder'}
                </h3>
                <button onClick={() => setIsFolderModalOpen(false)} className="cursor-pointer">
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">Unit Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 2 - Enterprise Java"
                    value={folderForm.title}
                    onChange={(e) => setFolderForm({ ...folderForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">Description (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Unit scope details..."
                    value={folderForm.description}
                    onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsFolderModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveFolder}>
                  {editingFolder ? 'Update Unit' : 'Save Folder'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Save to Folder Modal */}
        {moveModalQuestionId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Move className="w-5 h-5 text-[var(--primary)]" />
                  Save Questions to Folder
                </h3>
                <button onClick={() => setMoveModalQuestionId(null)} className="cursor-pointer">
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                Select target unit folder for {moveModalQuestionId === 'BULK' ? `${selectedQuestionIds.length} question(s)` : 'this question'}:
              </p>

              <select
                value={targetMoveFolderId}
                onChange={(e) => setTargetMoveFolderId(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] font-semibold"
              >
                <option value="uncategorized">Unassigned Questions</option>
                {folders.map((f) => (
                  <option key={f.id || f._id} value={f.id || f._id}>
                    {f.title}
                  </option>
                ))}
              </select>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setMoveModalQuestionId(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleConfirmMove}>
                  Confirm Save
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Question Modal */}
        {editingQuestion && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Edit Question</h3>
                <button onClick={() => setEditingQuestion(null)} className="cursor-pointer">
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">Question Statement</label>
                  <textarea
                    rows={3}
                    value={editForm.questionText}
                    onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)]"
                  />
                </div>

                {editingQuestion.type === 'MCQ' && (
                  <div>
                    <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">Options</label>
                    <div className="space-y-2">
                      {editForm.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-bold w-4">{String.fromCharCode(65 + idx)}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...editForm.options];
                              newOpts[idx] = e.target.value;
                              setEditForm({ ...editForm, options: newOpts });
                            }}
                            className="flex-1 px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditingQuestion(null)}>
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
