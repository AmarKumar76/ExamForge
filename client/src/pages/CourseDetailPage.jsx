import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { courseService } from '../services/courseService';
import { courseMaterialService } from '../services/courseMaterialService';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Users,
  Building2,
  Calendar,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Trash2,
  FileText,
  Download,
  Eye,
  Archive,
  Globe,
  Lock,
  X,
  Clock,
  Upload,
} from 'lucide-react';

export const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'materials' | 'students'
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTopic, setUploadTopic] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Delete Confirmation State
  const [deletingMaterialId, setDeletingMaterialId] = useState(null);

  const isStaff = ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'INSTRUCTOR'].includes(user?.role);

  const fetchCourseDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await courseService.getById(id);
      if (response.success && response.data?.course) {
        setCourse(response.data.course);
      }
    } catch (err) {
      setError(err.message || 'Failed to load course details.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      setIsMaterialsLoading(true);
      const response = await courseMaterialService.getByCourse(id);
      if (response.success && Array.isArray(response.data?.materials)) {
        setMaterials(response.data.materials);
      }
    } catch (err) {
      console.warn('Failed to fetch materials:', err.message);
    } finally {
      setIsMaterialsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
      fetchMaterials();
    }
  }, [id]);

  const isStudentEnrolled = course?.studentIds?.some(
    (stud) => stud._id === user?.id || stud._id === user?._id || stud.id === user?.id
  );

  const handleSelfEnroll = async () => {
    try {
      setIsEnrolling(true);
      setActionMessage(null);
      const res = await courseService.selfEnroll(id);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Enrolled in course successfully!' });
        await fetchCourseDetails();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Enrollment failed.' });
    } finally {
      setIsEnrolling(false);
    }
  };

  // Upload Material Handler
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setActionMessage({ type: 'error', text: 'Please select a file to upload.' });
      return;
    }

    try {
      setIsUploading(true);
      setActionMessage(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadTitle || selectedFile.name);
      formData.append('description', uploadDescription);
      formData.append('topic', uploadTopic);

      const res = await courseMaterialService.upload(id, formData);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Course material uploaded successfully!' });
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadTitle('');
        setUploadDescription('');
        setUploadTopic('');
        await fetchMaterials();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Upload failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle Publish Handler
  const handleTogglePublish = async (materialId, currentVisibility) => {
    try {
      setActionMessage(null);
      const nextState = currentVisibility !== 'PUBLISHED';
      const res = await courseMaterialService.publish(materialId, nextState);
      if (res.success) {
        setActionMessage({
          type: 'success',
          text: `Material ${nextState ? 'published' : 'unpublished'} successfully!`,
        });
        await fetchMaterials();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update visibility.' });
    }
  };

  // Archive Handler
  const handleArchive = async (materialId) => {
    try {
      setActionMessage(null);
      const res = await courseMaterialService.archive(materialId);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Material archived successfully!' });
        await fetchMaterials();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to archive material.' });
    }
  };

  // Delete Handler
  const handleDelete = async (materialId) => {
    try {
      setActionMessage(null);
      const res = await courseMaterialService.delete(materialId);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Material deleted successfully!' });
        setDeletingMaterialId(null);
        await fetchMaterials();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to delete material.' });
    }
  };

  // Download Handler
  const handleDownload = async (materialId, fileName) => {
    try {
      await courseMaterialService.download(materialId, fileName);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Download failed.' });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <AppShell title="Course Details">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Loading course details...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !course) {
    return (
      <AppShell title="Course Details">
        <div className="p-8 text-center space-y-4 max-w-md mx-auto bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">Course Load Error</h2>
          <p className="text-xs text-[var(--text-secondary)]">{error || 'Course not found.'}</p>
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={`${course.code} - ${course.name}`}>
      <div className="space-y-6 pb-12">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Back to Courses
          </Button>
          <Badge variant={course.status === 'ACTIVE' ? 'success' : 'neutral'}>
            {course.status} Course
          </Badge>
        </div>

        {actionMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Course Banner */}
        <div className="bg-[var(--surface)] p-6 md:p-8 rounded-2xl border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--primary)] px-2.5 py-1 rounded-md bg-[var(--primary-light)]">
                  {course.code}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">{course.department} Department</span>
              </div>
              <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mt-2">{course.name}</h1>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl">
                {course.description || 'No detailed syllabus description provided.'}
              </p>
            </div>

            {/* Student Self Enroll Button */}
            {user?.role === 'STUDENT' && (
              <div>
                {isStudentEnrolled ? (
                  <Badge variant="success" className="px-4 py-2 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Enrolled in Course
                  </Badge>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    icon={Sparkles}
                    onClick={handleSelfEnroll}
                    loading={isEnrolling}
                  >
                    Enroll in Course
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Tab Switcher Bar */}
          <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex p-1 bg-[var(--surface-muted)] rounded-xl border border-[var(--border-subtle)]">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'materials'
                    ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Materials ({materials.length})
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'students'
                    ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Roster ({course.studentIds?.length || 0})
              </button>
            </div>

            {isStaff && activeTab === 'materials' && (
              <Button
                variant="primary"
                size="sm"
                icon={Upload}
                onClick={() => setShowUploadModal(true)}
              >
                Upload Material
              </Button>
            )}
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card title="Course Information & Syllabus Scope">
                <div className="space-y-4 text-xs">
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {course.description || 'This course covers foundational principles, practical problem solving, and assessment benchmarks defined by the academic department.'}
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[11px] text-[var(--text-secondary)] block">Institution</span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {course.institutionId?.name || 'Platform University'}
                      </span>
                    </div>
                    <div className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[11px] text-[var(--text-secondary)] block">Academic Department</span>
                      <span className="font-bold text-[var(--text-primary)]">{course.department}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title={`Course Learning Materials (${materials.length})`}>
                {materials.length > 0 ? (
                  <div className="space-y-3">
                    {materials.slice(0, 3).map((mat) => (
                      <div key={mat.id || mat._id} className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-extrabold text-[10px] shrink-0 uppercase">
                            {mat.fileType}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[var(--text-primary)]">{mat.title}</h4>
                            <p className="text-[11px] text-[var(--text-secondary)]">{formatFileSize(mat.fileSize)} • {new Date(mat.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" icon={Download} onClick={() => handleDownload(mat.id || mat._id, mat.originalFileName)}>
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-muted)] text-center py-4">No published materials uploaded yet.</p>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              <Card title="Assigned Instructors">
                <div className="space-y-3 text-xs">
                  {course.instructorIds?.map((inst) => (
                    <div key={inst._id || inst.id} className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)]">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0">
                        {inst.name ? inst.name[0].toUpperCase() : 'I'}
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--text-primary)]">{inst.name}</h4>
                        <p className="text-[11px] text-[var(--text-secondary)]">{inst.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Course Learning Materials {user?.role === 'STUDENT' && '(Published Only)'}
              </h2>
              {isStaff && (
                <Button variant="primary" size="sm" icon={Upload} onClick={() => setShowUploadModal(true)}>
                  Upload Material
                </Button>
              )}
            </div>

            {isMaterialsLoading && (
              <div className="flex flex-col items-center justify-center min-h-[250px] space-y-3 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6">
                <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-[var(--text-secondary)]">Loading course materials...</p>
              </div>
            )}

            {!isMaterialsLoading && materials.length === 0 && (
              <div className="p-12 text-center space-y-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] max-w-lg mx-auto">
                <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">No Materials Found</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {isStaff
                    ? 'No materials uploaded yet. Click Upload Material to add learning documents (PDF, DOCX, PPTX).'
                    : 'No published materials available for this course yet.'}
                </p>
                {isStaff && (
                  <Button variant="primary" size="sm" icon={Upload} onClick={() => setShowUploadModal(true)}>
                    Upload Material
                  </Button>
                )}
              </div>
            )}

            {!isMaterialsLoading && materials.length > 0 && (
              <div className="space-y-4">
                {materials.map((mat) => (
                  <div
                    key={mat.id || mat._id}
                    className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[var(--primary-border)] transition-all"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-black text-xs uppercase shrink-0 border border-[var(--primary-border)]">
                        {mat.fileType}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">{mat.title}</h3>
                          {mat.metadata?.topic && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                              {mat.metadata.topic}
                            </span>
                          )}
                          {isStaff && (
                            <>
                              <Badge variant={mat.visibility === 'PUBLISHED' ? 'success' : 'neutral'}>
                                {mat.visibility}
                              </Badge>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                {mat.status}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
                          {mat.description || mat.originalFileName}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] pt-0.5">
                          <span>File: {mat.originalFileName}</span>
                          <span>•</span>
                          <span>Size: {formatFileSize(mat.fileSize)}</span>
                          <span>•</span>
                          <span>Uploaded: {new Date(mat.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-[var(--border-subtle)] self-end md:self-auto">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Download}
                        onClick={() => handleDownload(mat.id || mat._id, mat.originalFileName)}
                      >
                        Download
                      </Button>

                      {isStaff && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Sparkles}
                            onClick={() => navigate(`/instructor/ai-question-studio?courseId=${id}`)}
                          >
                            AI Studio
                          </Button>

                          <Button
                            variant={mat.visibility === 'PUBLISHED' ? 'ghost' : 'secondary'}
                            size="sm"
                            icon={mat.visibility === 'PUBLISHED' ? Lock : Globe}
                            onClick={() => handleTogglePublish(mat.id || mat._id, mat.visibility)}
                          >
                            {mat.visibility === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                          </Button>

                          {mat.status !== 'ARCHIVED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Archive}
                              onClick={() => handleArchive(mat.id || mat._id)}
                            >
                              Archive
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setDeletingMaterialId(mat.id || mat._id)}
                            className="text-red-600 dark:text-red-400 hover:bg-red-500/10"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STUDENTS ROSTER TAB */}
        {activeTab === 'students' && (
          <Card title={`Enrolled Candidates (${course.studentIds?.length || 0})`}>
            {course.studentIds && course.studentIds.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {course.studentIds.map((stud) => (
                  <div
                    key={stud._id || stud.id}
                    className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--surface-muted)] text-[var(--text-primary)] flex items-center justify-center font-bold shrink-0 border border-[var(--border)]">
                        {stud.name ? stud.name[0].toUpperCase() : 'S'}
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--text-primary)]">{stud.name}</h4>
                        <p className="text-[11px] text-[var(--text-secondary)]">{stud.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      Active Student
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                No students enrolled in this course roster yet.
              </div>
            )}
          </Card>
        )}

        {/* MODAL: UPLOAD MATERIAL */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Upload Course Material</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Select File (PDF, DOCX, PPTX max 25MB)</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.docx,.doc,.pptx,.ppt"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setSelectedFile(file);
                        if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    }}
                    className="w-full text-xs text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--primary-light)] file:text-[var(--primary)] hover:file:bg-[var(--primary)] hover:file:text-white transition-all cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-[11px] text-[var(--primary)] font-semibold mt-1">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Material Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chapter 1 - Introduction to Algorithms"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Topic / Module Tag (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sorting Algorithms"
                    value={uploadTopic}
                    onChange={(e) => setUploadTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[var(--text-primary)] block mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of learning content..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowUploadModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={isUploading} icon={Upload}>
                    Upload File
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DELETE CONFIRMATION */}
        {deletingMaterialId && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 animate-fadeIn text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Delete Course Material</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Are you sure you want to permanently delete this learning document? This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setDeletingMaterialId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDelete(deletingMaterialId)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Material
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
