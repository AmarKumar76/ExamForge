import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AIStudyTutor } from '../components/ui/AIStudyTutor';
import {
  Sparkles,
  BookOpen,
  Target,
  RefreshCw,
  AlertCircle,
  Search,
  FileText,
  PlayCircle,
  HelpCircle,
  BarChart2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { aiPreparationService } from '../services/aiPreparationService';
import { examService } from '../services/examService';

export const AIPreparationViewPage = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Active navigation tab inside AI Preparation
  const [activeTab, setActiveTab] = useState('Analysis'); // 'Analysis', 'Learn', 'Practice', 'Search'

  // Material Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Material Modal view
  const [viewingChunk, setViewingChunk] = useState(null);

  // Practice Assessment Generator Modal
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [practiceTopic, setPracticeTopic] = useState('');
  const [practiceQuestionCount, setPracticeQuestionCount] = useState(5);
  const [practiceDifficulty, setPracticeDifficulty] = useState('MEDIUM');
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);

  // Expandable question breakdowns
  const [expandedTopics, setExpandedTopics] = useState({});

  const fetchAIPrepData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await aiPreparationService.getAIPreparation();
      if (res.success && res.data) {
        setData(res.data);
        if (res.data.weakTopicsAnalysis?.length > 0) {
          setPracticeTopic(res.data.weakTopicsAnalysis[0].topic);
        }
      }
    } catch (err) {
      console.error('Failed to load AI Preparation data:', err);
      setError(err?.response?.data?.message || 'Failed to load AI Preparation data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIPrepData();
  }, []);

  const handleSearchMaterials = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const courseId = data?.latestPerformance?.courseId || data?.enrolledCourses?.[0]?._id;
    if (!courseId) return;

    try {
      setIsSearching(true);
      const res = await aiPreparationService.searchMaterials(courseId, searchQuery.trim());
      if (res.success && res.data) {
        setSearchResults(res.data.results || []);
      }
    } catch (err) {
      console.error('Material search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGeneratePracticeAssessment = async (e) => {
    e.preventDefault();
    const courseId = data?.latestPerformance?.courseId || data?.enrolledCourses?.[0]?._id;
    if (!practiceTopic || !courseId) return alert('Please select a valid topic.');

    try {
      setIsGeneratingPractice(true);
      const res = await examService.generatePractice(practiceTopic, courseId);
      if (res.success) {
        setShowPracticeModal(false);
        navigate('/student/practice');
      }
    } catch (err) {
      console.error('Practice generation error:', err);
      alert('Failed to generate AI practice assessment.');
    } finally {
      setIsGeneratingPractice(false);
    }
  };

  const toggleTopicExpand = (topicName) => {
    setExpandedTopics((prev) => ({ ...prev, [topicName]: !prev[topicName] }));
  };

  if (isLoading) {
    return (
      <AppShell title="AI Preparation">
        <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto mb-4" />
          Analyzing your published exam results and retrieving RAG course materials...
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="AI Preparation">
        <div className="p-12 text-center text-xs text-red-500 bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-xl mx-auto my-8">
          <AlertCircle className="w-8 h-8 mx-auto mb-4" />
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Error Loading AI Preparation</h3>
          <p className="mb-4">{error}</p>
          <Button variant="primary" onClick={fetchAIPrepData}>
            Retry
          </Button>
        </div>
      </AppShell>
    );
  }

  // 1. RESULT GATING: Check if student has published results
  if (!data?.hasPublishedResults) {
    return (
      <AppShell title="AI Preparation">
        <div className="space-y-6 max-w-5xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--primary)]" />
              AI Preparation & Performance Improvement
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Personalized learning, weak topic RAG material study, and AI tutor support.
            </p>
          </div>

          <div className="p-12 text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm">
            <Award className="w-14 h-14 text-[var(--primary)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
              Assessment Result Required
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6 max-w-md mx-auto leading-relaxed">
              Complete an assessment and wait for your instructor to release the result to unlock AI Preparation.
            </p>
            <Button variant="primary" icon={ArrowRight} onClick={() => navigate('/student/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const { latestPerformance, weakTopicsAnalysis = [], practiceHistory = [], enrolledCourses = [] } = data;

  return (
    <AppShell title="AI Preparation">
      <div className="space-y-8 max-w-6xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--primary)]" />
              AI Preparation & Performance Improvement
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Performance analysis derived from your published exam result: <strong className="text-[var(--text-primary)]">{latestPerformance?.examTitle}</strong> ({latestPerformance?.courseCode})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchAIPrepData}>
              Refresh Analysis
            </Button>
            <Button variant="primary" size="sm" icon={Zap} onClick={() => setShowPracticeModal(true)}>
              AI Practice Assessment
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border)] gap-6 text-xs font-semibold text-[var(--text-secondary)]">
          {[
            { id: 'Analysis', label: '1. Exam Performance Analysis', icon: BarChart2 },
            { id: 'Learn', label: `2. Learn Weak Topics (${weakTopicsAnalysis.length})`, icon: BookOpen },
            { id: 'Practice', label: `3. Practice History (${practiceHistory.length})`, icon: Target },
            { id: 'Search', label: '4. Course Material Search', icon: Search },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'border-b-2 border-[var(--primary)] text-[var(--primary)] font-bold'
                    : 'hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: EXAM PERFORMANCE ANALYSIS */}
        {/* ========================================================================= */}
        {activeTab === 'Analysis' && (
          <div className="space-y-6">
            {/* Overview Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Published Score</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[var(--primary)]">{latestPerformance?.percentage}%</span>
                  <span className="text-xs text-[var(--text-secondary)]">({latestPerformance?.totalScore} Marks)</span>
                </div>
              </Card>

              <Card>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">Weak Topics Identified</span>
                <span className="text-2xl font-extrabold text-red-500 block mt-1">
                  {latestPerformance?.weakTopicsSummary?.length || 0}
                </span>
              </Card>

              <Card>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Strong Topics</span>
                <span className="text-2xl font-extrabold text-emerald-500 block mt-1">
                  {latestPerformance?.strongTopics?.length || 0}
                </span>
              </Card>

              <Card>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Accuracy</span>
                <div className="text-xs space-y-1 mt-1 font-semibold text-[var(--text-primary)]">
                  <div>Easy: <span className="text-emerald-500">{latestPerformance?.difficultyAnalysis?.easyAccuracy ?? 'N/A'}%</span></div>
                  <div>Medium: <span className="text-amber-500">{latestPerformance?.difficultyAnalysis?.mediumAccuracy ?? 'N/A'}%</span></div>
                  <div>Hard: <span className="text-red-500">{latestPerformance?.difficultyAnalysis?.hardAccuracy ?? 'N/A'}%</span></div>
                </div>
              </Card>
            </div>

            {/* Strong vs Weak Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Weak Areas (Needs Improvement)">
                {latestPerformance?.weakTopicsSummary?.length > 0 ? (
                  <div className="space-y-3">
                    {latestPerformance.weakTopicsSummary.map((wt, i) => (
                      <div key={i} className="p-3 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)] flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[var(--text-primary)]">{wt.topic}</h4>
                          <span className="text-[11px] text-red-500 font-semibold">Score: {wt.percentage}%</span>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs" icon={BookOpen} onClick={() => setActiveTab('Learn')}>
                          Learn Materials
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-secondary)] italic">No weak topics identified in this assessment!</p>
                )}
              </Card>

              <Card title="Strong Areas (Solid Knowledge)">
                {latestPerformance?.strongTopics?.length > 0 ? (
                  <div className="space-y-3">
                    {latestPerformance.strongTopics.map((st, i) => (
                      <div key={i} className="p-3 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)] flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-[var(--text-primary)]">{st.topic}</h4>
                          <span className="text-[11px] text-emerald-500 font-semibold">Score: {st.percentage}%</span>
                        </div>
                        <Badge variant="success">Mastered</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-secondary)] italic">No strong topics with score ≥ 75% identified.</p>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LEARN WEAK TOPICS (RAG Course Materials) */}
        {/* ========================================================================= */}
        {activeTab === 'Learn' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                  RAG Course Materials for Weak Topics
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Semantically retrieved relevant chunks from your uploaded course notes and documents.
                </p>
              </div>
            </div>

            {weakTopicsAnalysis.length === 0 ? (
              <Card>
                <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">No Weak Topics to Learn</h3>
                  <p className="max-w-md mx-auto">
                    You scored above 75% across all topics in your latest exam!
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {weakTopicsAnalysis.map((wt, idx) => (
                  <div key={idx} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[var(--text-primary)]">{wt.topic}</h3>
                          <Badge variant="error">Score: {wt.percentage}%</Badge>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          Answered {wt.correctCount} of {wt.questionCount} questions correctly in latest exam.
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        icon={PlayCircle}
                        onClick={() => {
                          setPracticeTopic(wt.topic);
                          setShowPracticeModal(true);
                        }}
                      >
                        Practice {wt.topic}
                      </Button>
                    </div>

                    {/* Question breakdown toggle */}
                    {wt.questions?.length > 0 && (
                      <div>
                        <button
                          onClick={() => toggleTopicExpand(wt.topic)}
                          className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {expandedTopics[wt.topic] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {expandedTopics[wt.topic] ? 'Hide Exam Question Analysis' : `View Exam Questions (${wt.questions.length})`}
                        </button>

                        {expandedTopics[wt.topic] && (
                          <div className="mt-3 space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
                            {wt.questions.map((q, qIdx) => (
                              <div key={qIdx} className="p-3 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)] text-xs space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-semibold text-[var(--text-primary)]">Q{qIdx + 1}: {q.questionText}</span>
                                  <Badge variant={q.isCorrect ? 'success' : 'error'}>
                                    {q.isCorrect ? 'Correct' : 'Incorrect'}
                                  </Badge>
                                </div>
                                <div className="text-[11px] text-[var(--text-secondary)]">
                                  <span>Your Answer: <strong className={q.isCorrect ? 'text-emerald-500' : 'text-red-500'}>{q.studentAnswer}</strong></span>
                                  {!q.isCorrect && <span className="ml-3">Correct Answer: <strong className="text-emerald-500">{q.correctAnswer}</strong></span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Relevant RAG Materials */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[var(--primary)]" />
                        Relevant Course Study Materials ({wt.studyMaterials?.length || 0})
                      </h4>

                      {wt.studyMaterials?.length === 0 ? (
                        <p className="text-xs text-[var(--text-secondary)] italic p-3 bg-[var(--surface-muted)] rounded-xl">
                          No uploaded course document chunks match this topic yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {wt.studyMaterials.map((mat, mIdx) => (
                            <div key={mIdx} className="p-3.5 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)] hover:border-[var(--primary-border)] transition-all space-y-2 flex flex-col justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--primary)]">
                                  <span className="line-clamp-1">{mat.sourceFileName}</span>
                                  {mat.pageNumber && <span>Pg {mat.pageNumber}</span>}
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] line-clamp-4 leading-relaxed font-serif">
                                  "{mat.excerpt}"
                                </p>
                              </div>

                              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                                <button
                                  onClick={() => setViewingChunk(mat)}
                                  className="text-[11px] font-bold text-[var(--primary)] hover:underline"
                                >
                                  Open Material
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PRACTICE HISTORY */}
        {/* ========================================================================= */}
        {activeTab === 'Practice' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Target className="w-5 h-5 text-[var(--primary)]" />
                  Practice Assessments History
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Track your topic practice attempts over time.
                </p>
              </div>

              <Button variant="primary" size="sm" icon={Zap} onClick={() => setShowPracticeModal(true)}>
                Create Practice Assessment
              </Button>
            </div>

            {practiceHistory.length === 0 ? (
              <Card>
                <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
                  <Target className="w-10 h-10 text-[var(--text-secondary)] opacity-40 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">No Practice History Yet</h3>
                  <p className="max-w-md mx-auto mb-4">
                    Generate an AI practice assessment to reinforce weak concepts.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => setShowPracticeModal(true)}>
                    Generate Practice Assessment
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {practiceHistory.map((prac) => (
                  <div key={prac.id} className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">{prac.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mt-1">
                        <span>Topic: <strong className="text-[var(--text-primary)]">{prac.topic}</strong></span>
                        <span>{prac.questionCount} Questions</span>
                        <span>{new Date(prac.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-extrabold text-[var(--primary)]">{prac.percentage}%</span>
                      <span className="text-[10px] text-[var(--text-secondary)] block font-semibold">Score</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: COURSE MATERIAL SEARCH */}
        {/* ========================================================================= */}
        {activeTab === 'Search' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Search className="w-5 h-5 text-[var(--primary)]" />
                Course Material Semantic Search
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Search RAG vector database across your enrolled course documents.
              </p>
            </div>

            <form onSubmit={handleSearchMaterials} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, definitions, formulas (e.g. DFS, Tree Traversal)..."
                className="flex-1 px-4 py-2.5 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
              <Button variant="primary" type="submit" loading={isSearching} icon={Search}>
                Search
              </Button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Search Results ({searchResults.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((res, i) => (
                    <div key={i} className="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[var(--primary)]">
                        <span>{res.sourceFileName}</span>
                        {res.pageNumber && <span>Page {res.pageNumber}</span>}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-4 leading-relaxed font-serif">
                        "{res.excerpt}"
                      </p>
                      <div className="pt-2 flex justify-end">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setViewingChunk(res)}>
                          Open Excerpt
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* COMPACT AI STUDY TUTOR (Anchored Bottom-Right) */}
        {/* ========================================================================= */}
        <AIStudyTutor
          courseId={latestPerformance?.courseId}
          topic={weakTopicsAnalysis.length > 0 ? weakTopicsAnalysis[0].topic : 'General'}
          initialContextText={
            weakTopicsAnalysis.length > 0
              ? weakTopicsAnalysis[0].studyMaterials?.map((m) => m.excerpt).join('\n')
              : ''
          }
        />

        {/* Material Viewer Modal */}
        {viewingChunk && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{viewingChunk.sourceFileName}</h3>
                  {viewingChunk.pageNumber && <span className="text-xs text-[var(--text-secondary)]">Page {viewingChunk.pageNumber}</span>}
                </div>
                <button onClick={() => setViewingChunk(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  ✕
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto p-4 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)] text-xs leading-relaxed font-serif text-[var(--text-primary)] whitespace-pre-wrap">
                {viewingChunk.excerpt}
              </div>

              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={() => setViewingChunk(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI Practice Assessment Modal */}
        {showPracticeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[var(--primary)]" />
                  Generate AI Practice Assessment
                </h3>
                <button onClick={() => setShowPracticeModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  ✕
                </button>
              </div>

              <form onSubmit={handleGeneratePracticeAssessment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Concept Focus Topic</label>
                  <select
                    value={practiceTopic}
                    onChange={(e) => setPracticeTopic(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                  >
                    {weakTopicsAnalysis.map((wt, i) => (
                      <option key={i} value={wt.topic}>{wt.topic} (Weak - {wt.percentage}%)</option>
                    ))}
                    {data?.enrolledCourses?.map((c) => (
                      <option key={c._id} value={c.name}>{c.name} Core Concepts</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Number of Questions</label>
                  <select
                    value={practiceQuestionCount}
                    onChange={(e) => setPracticeQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                  >
                    <option value={5}>5 Questions (Quick Check)</option>
                    <option value={10}>10 Questions (Standard)</option>
                    <option value={15}>15 Questions (Thorough)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Difficulty</label>
                  <select
                    value={practiceDifficulty}
                    onChange={(e) => setPracticeDifficulty(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button variant="outline" className="w-1/2" onClick={() => setShowPracticeModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" className="w-1/2" type="submit" loading={isGeneratingPractice} icon={Sparkles}>
                    Generate with Gemini
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default AIPreparationViewPage;
