import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { courseService } from '../services/courseService';
import { courseMaterialService } from '../services/courseMaterialService';
import { aiService } from '../services/aiService';
import { folderService } from '../services/folderService';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Edit2,
  Trash2,
  RefreshCw,
  BookOpen,
  Filter,
  Layers,
  HelpCircle,
  Folder,
} from 'lucide-react';

export const AIQuestionStudio = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get('courseId') || '');
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(searchParams.get('folderId') || '');
  const [materials, setMaterials] = useState([]);
  const [questions, setQuestions] = useState([]);

  // Active step: 1 = Material Processing, 2 = Generation Config, 3 = Review Studio
  const [step, setStep] = useState(1);

  // Loading & Action states
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [processingMaterialId, setProcessingMaterialId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  // File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedCourseId) {
      setActionError('Please select a course first before uploading materials.');
      return;
    }

    try {
      setIsUploading(true);
      setActionError(null);
      setActionSuccess(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('visibility', 'PUBLIC');

      await courseMaterialService.upload(selectedCourseId, formData);
      setActionSuccess(`Uploaded "${file.name}" successfully! You can now process it for RAG.`);
      await loadCourseMaterials(selectedCourseId);
    } catch (err) {
      setActionError(err.message || 'Failed to upload course material.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Process Selected Materials
  const handleProcessSelectedMaterials = async () => {
    if (selectedMaterialIds.length === 0) return;
    try {
      setActionError(null);
      setActionSuccess(null);
      let count = 0;
      for (const matId of selectedMaterialIds) {
        const mat = materials.find((m) => (m._id || m.id) === matId);
        if (mat && mat.processingStatus !== 'PROCESSED') {
          setProcessingMaterialId(matId);
          await aiService.processMaterial(selectedCourseId, matId);
          count++;
        }
      }
      setActionSuccess(`Successfully processed ${count} selected material(s) for RAG!`);
      await loadCourseMaterials(selectedCourseId);
    } catch (err) {
      setActionError(err.message || 'Failed to process selected materials.');
    } finally {
      setProcessingMaterialId(null);
    }
  };

  // Generation Config State
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);
  const [chapterName, setChapterName] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionTypes, setQuestionTypes] = useState(['MCQ']);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(10);
  const [difficultyDist, setDifficultyDist] = useState({
    easy: 4,
    medium: 4,
    hard: 2,
  });

  // Material removal state
  const [materialToRemove, setMaterialToRemove] = useState(null);

  const handleConfirmRemoveMaterial = async () => {
    if (!materialToRemove) return;
    try {
      setActionError(null);
      const mId = materialToRemove._id || materialToRemove.id;
      await courseMaterialService.archive(mId);
      setActionSuccess(`Material "${materialToRemove.title || materialToRemove.originalFileName}" removed from active workspace.`);
      setMaterialToRemove(null);
      await loadCourseMaterials(selectedCourseId);
    } catch (err) {
      setActionError(err.message || 'Failed to remove material.');
    }
  };

  // Review Studio Bulk Actions & Filters & Editing
  const [selectedQIdsForBulk, setSelectedQIdsForBulk] = useState([]);
  const [statusFilter, setStatusFilter] = useState('DRAFT');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm, setEditForm] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'MEDIUM',
    topic: '',
  });

  // Synchronize URL search parameter `courseId` with selectedCourseId state
  useEffect(() => {
    const urlParamId = searchParams.get('courseId');
    if (urlParamId && urlParamId !== selectedCourseId) {
      setSelectedCourseId(urlParamId);
    }
  }, [searchParams]);

  // Load instructor/staff courses
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

        const urlParamId = searchParams.get('courseId');
        if (urlParamId) {
          setSelectedCourseId(urlParamId);
        } else if (courseList.length > 0) {
          setSelectedCourseId(courseList[0]._id || courseList[0].id);
        }
      } catch (err) {
        setActionError(err.message || 'Failed to load courses');
      } finally {
        setIsLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  // Load course materials, folders, and draft questions when selectedCourseId changes
  useEffect(() => {
    if (selectedCourseId) {
      loadCourseMaterials(selectedCourseId);
      loadFolders(selectedCourseId);
      loadCourseQuestions(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadFolders = async (courseId) => {
    try {
      const res = await folderService.getFolders(courseId);
      if (res.data?.folders) {
        setFolders(res.data.folders);
      }
    } catch (err) {
      console.warn('Failed to load folders:', err.message);
    }
  };

  const loadCourseMaterials = async (courseId) => {
    try {
      setIsLoadingMaterials(true);
      const res = await courseMaterialService.getByCourse(courseId);
      const matList = Array.isArray(res.data?.materials)
        ? res.data.materials
        : Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.materials)
        ? res.materials
        : [];
      setMaterials(matList);

      const processedIds = matList
        .filter((m) => m.processingStatus === 'PROCESSED')
        .map((m) => m._id || m.id);
      setSelectedMaterialIds(processedIds);
    } catch (err) {
      console.warn('Failed to load materials:', err.message);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  const loadCourseQuestions = async (courseId) => {
    try {
      setIsLoadingQuestions(true);
      const res = await aiService.getQuestions(courseId);
      const qList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.questions)
        ? res.questions
        : Array.isArray(res)
        ? res
        : [];
      setQuestions(qList);
    } catch (err) {
      console.warn('Failed to load questions:', err.message);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Handle Material Processing
  const handleProcessMaterial = async (materialId) => {
    try {
      setProcessingMaterialId(materialId);
      setActionError(null);
      const res = await aiService.processMaterial(selectedCourseId, materialId);
      setActionSuccess(`Material processed successfully! Created ${res.chunkCount || 0} chunks.`);
      await loadCourseMaterials(selectedCourseId);
    } catch (err) {
      setActionError(err.message || 'Failed to process document.');
    } finally {
      setProcessingMaterialId(null);
    }
  };

  // Handle Question Generation
  const handleGenerateQuestions = async () => {
    try {
      setActionError(null);
      setActionSuccess(null);

      const reqTotal = Number(totalQuestionsCount) || 0;
      const easyCount = Number(difficultyDist.easy) || 0;
      const medCount = Number(difficultyDist.medium) || 0;
      const hardCount = Number(difficultyDist.hard) || 0;

      const sum = easyCount + medCount + hardCount;
      if (sum !== reqTotal) {
        setActionError(
          `Validation Error: Difficulty distribution sum (${sum} = ${easyCount} Easy + ${medCount} Medium + ${hardCount} Hard) must equal total requested questions (${reqTotal}).`
        );
        return;
      }

      setIsGenerating(true);

      const payload = {
        folderId: selectedFolderId || null,
        chapterName: chapterName || topic,
        materialIds: selectedMaterialIds,
        topic: topic || chapterName,
        difficulty,
        difficultyDistribution: difficultyDist,
        questionTypes,
        numberOfQuestions: reqTotal,
      };

      const res = await aiService.generateQuestions(selectedCourseId, payload);
      setActionSuccess(`Generated ${res.length} DRAFT questions successfully!`);
      await loadFolders(selectedCourseId);
      await loadCourseQuestions(selectedCourseId);
      setStep(3); // Move to review studio
    } catch (err) {
      setActionError(err.message || 'Failed to generate draft questions.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Bulk Approve Selected Questions
  const handleBulkApprove = async () => {
    if (selectedQIdsForBulk.length === 0) return;
    try {
      setActionError(null);
      await aiService.bulkApproveQuestions(selectedQIdsForBulk);
      setActionSuccess(`Approved ${selectedQIdsForBulk.length} questions to Question Bank!`);
      setSelectedQIdsForBulk([]);
      await loadCourseQuestions(selectedCourseId);
    } catch (err) {
      setActionError(err.message || 'Failed to bulk approve questions.');
    }
  };

  // Bulk Reject Selected Questions
  const handleBulkReject = async () => {
    if (selectedQIdsForBulk.length === 0) return;
    try {
      setActionError(null);
      await aiService.bulkRejectQuestions(selectedQIdsForBulk);
      setActionSuccess(`Marked ${selectedQIdsForBulk.length} questions as REJECTED.`);
      setSelectedQIdsForBulk([]);
      await loadCourseQuestions(selectedCourseId);
    } catch (err) {
      setActionError(err.message || 'Failed to bulk reject questions.');
    }
  };

  // Approve Question
  const handleApproveQuestion = async (qId) => {
    try {
      setActionError(null);
      const res = await aiService.approveQuestion(qId);
      const updatedDoc = res.data || res;
      setQuestions((prev) => prev.map((q) => ((q._id || q.id) === qId ? updatedDoc : q)));
      setActionSuccess('Question approved for Question Bank!');
    } catch (err) {
      setActionError(err.message || 'Failed to approve question.');
    }
  };

  // Reject Question
  const handleRejectQuestion = async (qId) => {
    try {
      setActionError(null);
      const res = await aiService.rejectQuestion(qId);
      const updatedDoc = res.data || res;
      setQuestions((prev) => prev.map((q) => ((q._id || q.id) === qId ? updatedDoc : q)));
      setActionSuccess('Question marked as REJECTED.');
    } catch (err) {
      setActionError(err.message || 'Failed to reject question.');
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (qId) => {
    try {
      setActionError(null);
      await aiService.deleteQuestion(qId);
      setQuestions((prev) => prev.filter((q) => (q._id || q.id) !== qId));
      setActionSuccess('Question deleted.');
    } catch (err) {
      setActionError(err.message || 'Failed to delete question.');
    }
  };

  // Open Edit Modal
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

  // Save Edit Question
  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    try {
      setActionError(null);
      const targetId = editingQuestion._id || editingQuestion.id;
      const res = await aiService.updateQuestion(targetId, editForm);
      const updatedDoc = res.data || res;
      setQuestions((prev) => prev.map((q) => ((q._id || q.id) === targetId ? updatedDoc : q)));
      setEditingQuestion(null);
      setActionSuccess('Question updated successfully!');
    } catch (err) {
      setActionError(err.message || 'Failed to update question.');
    }
  };

  // Filter questions for display
  const filteredQuestions = questions.filter((q) => {
    if (statusFilter === 'ALL') return true;
    return q.status === statusFilter;
  });

  const steps = [
    { number: 1, label: '1. Course & Material Processing', active: step === 1, completed: step > 1 },
    { number: 2, label: '2. RAG Generation Config', active: step === 2, completed: step > 2 },
    { number: 3, label: '3. Review Studio & Approval', active: step === 3, completed: false },
  ];

  return (
    <AppShell title="AI Question Studio">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--primary)] animate-pulse" />
              AI Question Generation Studio
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Extract context from uploaded course materials and draft grounded questions using RAG & Gemini
            </p>
          </div>

          {/* Course Selector */}
          <div className="w-full sm:w-72">
            <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">
              Active Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={isLoadingCourses}
              className="w-full px-3 py-2 text-xs font-semibold bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]"
            >
              {courses.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feedback Banners */}
        {actionError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Workflow Stepper */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between overflow-x-auto shadow-xs">
          {steps.map((s, index) => (
            <React.Fragment key={s.number}>
              <button
                onClick={() => setStep(s.number)}
                className={`flex items-center gap-2 shrink-0 cursor-pointer text-left transition-all ${
                  s.active ? 'scale-105' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                    s.active
                      ? 'bg-[var(--primary)] text-white shadow-md'
                      : s.completed
                      ? 'bg-emerald-500/20 text-emerald-600 font-bold'
                      : 'bg-[var(--surface-muted)] text-[var(--text-muted)]'
                  }`}
                >
                  {s.completed ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <span
                  className={`text-xs font-bold ${
                    s.active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className="w-12 h-0.5 bg-[var(--border)] shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1: MATERIAL PROCESSING */}
        {step === 1 && (
          <div className="space-y-4">
            <Card className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Course Learning Materials</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Upload new study notes or select existing materials to process into RAG text vectors.
                  </p>
                  <p className="text-[11px] font-semibold text-[var(--text-muted)] mt-1">
                    Supported formats: <strong className="text-[var(--primary)]">PDF, DOCX, PPTX</strong>
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.pptx,.txt"
                    className="hidden"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isUploading || !selectedCourseId}
                    icon={isUploading ? RefreshCw : Sparkles}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? 'Uploading...' : '+ Upload Material'}
                  </Button>
                </div>
              </div>

              {isLoadingMaterials ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary)]" />
                  Loading course materials from database...
                </div>
              ) : materials.length === 0 ? (
                <div className="p-8 text-center space-y-4 bg-[var(--background)] rounded-2xl border-2 border-dashed border-[var(--border)]">
                  <FileText className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">No materials uploaded yet</h4>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                      Upload PDF lecture slides, syllabus DOCX, or PPTX notes directly to start RAG question generation.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isUploading || !selectedCourseId}
                    icon={isUploading ? RefreshCw : Sparkles}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? 'Uploading...' : '+ Upload Material'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">
                      Uploaded Course Files ({materials.length})
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Sparkles}
                      disabled={selectedMaterialIds.length === 0 || !!processingMaterialId}
                      onClick={handleProcessSelectedMaterials}
                    >
                      Process Selected ({selectedMaterialIds.length})
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {materials.map((mat) => {
                      const matId = mat._id || mat.id;
                      const isProcessed = mat.processingStatus === 'PROCESSED';
                      const isProcessing = processingMaterialId === matId;
                      const isChecked = selectedMaterialIds.includes(matId);

                      return (
                        <div
                          key={matId}
                          className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isChecked
                              ? 'bg-[var(--surface)] border-[var(--primary-border)] shadow-xs'
                              : 'bg-[var(--background)] border-[var(--border-subtle)]'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMaterialIds([...selectedMaterialIds, matId]);
                                } else {
                                  setSelectedMaterialIds(selectedMaterialIds.filter((id) => id !== matId));
                                }
                              }}
                              className="mt-1 accent-[var(--primary)]"
                            />
                            <div className="w-10 h-10 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-[var(--primary-border)]">
                              {mat.fileType || 'DOC'}
                            </div>
                            <div className="space-y-1 min-w-0">
                              <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                                {mat.title || mat.originalFileName}
                              </h4>
                              <p className="text-[11px] text-[var(--text-secondary)]">
                                File: {mat.originalFileName} • {(mat.fileSize ? (mat.fileSize / 1024 / 1024).toFixed(1) + ' MB' : 'Ready')}
                              </p>
                              {isProcessed && (
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Processed into {mat.chunkCount || 0} vector chunks for RAG search
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <Badge
                              variant={
                                isProcessed
                                  ? 'success'
                                  : mat.processingStatus === 'FAILED'
                                  ? 'error'
                                  : 'neutral'
                              }
                            >
                              {isProcessing ? 'PROCESSING...' : mat.processingStatus || 'NOT_PROCESSED'}
                            </Badge>

                            <Button
                              variant={isProcessed ? 'secondary' : 'primary'}
                              size="sm"
                              disabled={isProcessing}
                              icon={isProcessing ? RefreshCw : Sparkles}
                              onClick={() => handleProcessMaterial(matId)}
                            >
                              {isProcessing ? 'Processing...' : isProcessed ? 'Re-process' : 'Process Material'}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              disabled={isProcessing}
                              onClick={() => setMaterialToRemove(mat)}
                              className="text-red-600 dark:text-red-400 hover:bg-red-500/10"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  icon={ArrowRight}
                  onClick={() => setStep(2)}
                  disabled={!materials.some((m) => m.processingStatus === 'PROCESSED')}
                >
                  Next: Generation Config
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 2: GENERATION CONFIGURATION */}
        {step === 2 && (
          <div className="space-y-4">
            <Card title="RAG Question Generation Configuration">
              <div className="space-y-6 max-w-2xl">
                {/* Materials Checkboxes */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-2">
                    Select Context Materials for RAG
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {materials
                      .filter((m) => m.processingStatus === 'PROCESSED')
                      .map((mat) => {
                        const mId = mat._id || mat.id;
                        const isChecked = selectedMaterialIds.includes(mId);
                        return (
                          <label
                            key={mId}
                            className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-[var(--primary-light)] border-[var(--primary-border)] text-[var(--primary)] font-semibold'
                                : 'bg-[var(--background)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedMaterialIds([...selectedMaterialIds, mId]);
                                  } else {
                                    setSelectedMaterialIds(selectedMaterialIds.filter((id) => id !== mId));
                                  }
                                }}
                                className="accent-[var(--primary)]"
                              />
                              <span>{mat.title} ({mat.originalFileName})</span>
                            </div>
                            <Badge variant="success">{mat.chunkCount || 0} Chunks</Badge>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Chapter / Unit & Topic & Total Count */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                      Chapter / Unit Name <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Introduction and Analysis of Algorithms"
                        value={chapterName}
                        onChange={(e) => setChapterName(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] font-bold focus:ring-2 focus:ring-[var(--primary)]"
                      />
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        Chapter folder will be automatically created or reused upon generation.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Or Select Existing Chapter Folder
                    </label>
                    <select
                      value={selectedFolderId}
                      onChange={(e) => {
                        setSelectedFolderId(e.target.value);
                        const f = folders.find((item) => (item.id || item._id) === e.target.value);
                        if (f) setChapterName(f.title);
                      }}
                      className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] font-semibold focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      <option value="">-- Create / Use Entered Chapter Name --</option>
                      {folders.map((f) => (
                        <option key={f.id || f._id} value={f.id || f._id}>
                          📁 {f.title} ({f.counts?.total || 0} Qs)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Target Topic / Focus Area (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Asymptotic Notation, Time Complexity"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Total Questions to Generate
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={totalQuestionsCount}
                      onChange={(e) => setTotalQuestionsCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)] font-bold text-[var(--primary)]"
                    />
                  </div>
                </div>

                {/* Difficulty Breakdown Configuration */}
                <div className="p-4 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider block">
                      Difficulty Breakdown
                    </label>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        Number(difficultyDist.easy) + Number(difficultyDist.medium) + Number(difficultyDist.hard) === Number(totalQuestionsCount)
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      Sum: {Number(difficultyDist.easy) + Number(difficultyDist.medium) + Number(difficultyDist.hard)} / {totalQuestionsCount}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                        Easy Questions
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={difficultyDist.easy}
                        onChange={(e) => setDifficultyDist({ ...difficultyDist, easy: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                        Medium Questions
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={difficultyDist.medium}
                        onChange={(e) => setDifficultyDist({ ...difficultyDist, medium: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-red-600 dark:text-red-400 mb-1">
                        Hard Questions
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={difficultyDist.hard}
                        onChange={(e) => setDifficultyDist({ ...difficultyDist, hard: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Question Types */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Question Format / Type
                  </label>
                  <select
                    value={questionTypes[0] || 'MCQ'}
                    onChange={(e) => setQuestionTypes([e.target.value])}
                    className="w-full px-3.5 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                  </select>
                </div>

                {/* Action buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-[var(--border-subtle)]">
                  <Button variant="secondary" size="md" icon={ArrowLeft} onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    icon={isGenerating ? RefreshCw : Sparkles}
                    disabled={isGenerating || selectedMaterialIds.length === 0}
                    onClick={handleGenerateQuestions}
                  >
                    {isGenerating ? 'Generating via Gemini...' : 'Generate Draft Questions'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* STEP 3: REVIEW STUDIO & APPROVAL */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Status Filter Tabs & Bulk Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] shadow-xs">
              <div className="flex items-center gap-2">
                {['DRAFT', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setSelectedQIdsForBulk([]);
                    }}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      statusFilter === status
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                        : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--background)]'
                    }`}
                  >
                    {status} ({questions.filter((q) => status === 'ALL' || q.status === status).length})
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (selectedQIdsForBulk.length === filteredQuestions.length) {
                      setSelectedQIdsForBulk([]);
                    } else {
                      setSelectedQIdsForBulk(filteredQuestions.map((q) => q._id || q.id));
                    }
                  }}
                >
                  {selectedQIdsForBulk.length === filteredQuestions.length && filteredQuestions.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>

                {selectedQIdsForBulk.length > 0 && (
                  <>
                    <Button variant="primary" size="sm" icon={Check} onClick={handleBulkApprove}>
                      Approve Selected ({selectedQIdsForBulk.length})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={X}
                      onClick={handleBulkReject}
                      className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                    >
                      Reject Selected ({selectedQIdsForBulk.length})
                    </Button>
                  </>
                )}
                <Button variant="secondary" size="sm" icon={Sparkles} onClick={() => setStep(2)}>
                  Generate More Questions
                </Button>
              </div>
            </div>

            {/* Questions List */}
            {isLoadingQuestions ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary)]" />
                Loading questions...
              </div>
            ) : filteredQuestions.length === 0 ? (
              <Card>
                <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                  No {statusFilter.toLowerCase()} questions found for this course.
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q, index) => {
                  const qId = q._id || q.id;
                  const isChecked = selectedQIdsForBulk.includes(qId);
                  return (
                    <Card key={qId} className="relative">
                      <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                        {/* Main Question Content */}
                        <div className="space-y-3 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedQIdsForBulk([...selectedQIdsForBulk, qId]);
                                } else {
                                  setSelectedQIdsForBulk(selectedQIdsForBulk.filter((id) => id !== qId));
                                }
                              }}
                              className="accent-[var(--primary)]"
                            />
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
                            {q.difficulty && (
                              <Badge variant="neutral">Difficulty: {q.difficulty}</Badge>
                            )}
                            {q.generationSource === 'AI_RAG' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> AI Generated
                              </span>
                            )}
                          </div>

                        <p className="text-sm font-bold text-[var(--text-primary)] leading-relaxed">
                          {q.questionText}
                        </p>

                        {/* Options */}
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

                        {/* RAG Source References */}
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

                        {/* Action Toolbar */}
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--border-subtle)]">
                          {q.status !== 'APPROVED' && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Check}
                              onClick={() => handleApproveQuestion(q._id || q.id)}
                            >
                              Approve to Bank
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
                          {q.status !== 'REJECTED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={X}
                              onClick={() => handleRejectQuestion(q._id || q.id)}
                              className="text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                            >
                              Reject
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleDeleteQuestion(q._id || q.id)}
                            className="text-red-600 dark:text-red-400 hover:bg-red-500/10"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Metadata Card */}
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
                            Source Mode
                          </span>
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            RAG Grounded
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* MODAL: EDIT QUESTION */}
        {editingQuestion && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Edit Draft Question</h3>
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

        {/* MODAL: REMOVE MATERIAL CONFIRMATION */}
        {materialToRemove && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center gap-3 text-amber-500">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Remove Course Material?</h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Remove <strong>"{materialToRemove.title || materialToRemove.originalFileName}"</strong> from the course AI workspace?
                <br />
                <br />
                <span className="text-[11px] text-[var(--text-muted)]">
                  Generated and approved questions referencing this material will remain preserved in your Question Bank.
                </span>
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <Button variant="secondary" size="sm" onClick={() => setMaterialToRemove(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                  onClick={handleConfirmRemoveMaterial}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
