import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { examService } from '../services/examService';
import { SecureExamPreCheck } from '../components/exam/SecureExamPreCheck';
import { FaceProctor } from '../components/exam/FaceProctor';
import {
  Clock,
  Send,
  RefreshCw,
  AlertCircle,
  Flag,
  CheckCircle,
  Maximize,
  ShieldAlert,
  Wifi,
  UserCheck,
} from 'lucide-react';

export const LiveExamPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [attempt, setAttempt] = useState(location.state?.attempt || null);
  const [exam, setExam] = useState(location.state?.exam || null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  
  const [secureModeEntered, setSecureModeEntered] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');

  const [userAnswers, setUserAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState(null);
  
  const [isConnectionLost, setIsConnectionLost] = useState(false);

  // Resume or start session
  useEffect(() => {
    const examIdFromUrl = searchParams.get('examId') || (exam?._id || exam?.id);

    if ((!exam || !attempt) && examIdFromUrl) {
      const resumeSession = async () => {
        try {
          setIsLoadingSession(true);
          setError(null);
          const res = await examService.startAttempt(examIdFromUrl);
          if (res.success && res.data?.attempt) {
            setAttempt(res.data.attempt);
            setExam(res.data.exam);
          }
        } catch (err) {
          setError(err.message || 'Failed to resume exam session.');
        } finally {
          setIsLoadingSession(false);
        }
      };
      resumeSession();
    }
  }, [searchParams]);
  
  // Timer sync
  useEffect(() => {
    if (!exam || !attempt) return;
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const startedAt = attempt.startedAt ? new Date(attempt.startedAt) : new Date();
      let endTime = new Date(startedAt.getTime() + (exam.duration * 60000));
      
      if (exam.endTime && new Date(exam.endTime) < endTime) {
        endTime = new Date(exam.endTime);
      }
      
      return Math.max(0, Math.floor((endTime - now) / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = calculateTimeLeft();
        if (next <= 0 && prev > 0) {
          handleAutoSubmit();
        }
        return next;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [exam, attempt]);

  // Load initial answers
  useEffect(() => {
    if (attempt && attempt.answers && Array.isArray(attempt.answers)) {
      const initialAnswers = {};
      attempt.answers.forEach(ans => {
        initialAnswers[ans.questionId] = {
          selectedOption: ans.selectedOption || '',
          textAnswer: ans.textAnswer || ''
        };
      });
      setUserAnswers(prev => Object.keys(prev).length === 0 ? initialAnswers : prev);
    }
  }, [attempt]);

  // Network listeners
  useEffect(() => {
    const handleOnline = () => setIsConnectionLost(false);
    const handleOffline = () => setIsConnectionLost(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  }, []);

  // Secure Mode / Integrity Signals
  useEffect(() => {
    if (!secureModeEntered || !attempt) return;
    
    const sendSignal = async (type, metadata = {}) => {
      try {
        await examService.sendIntegritySignal(attempt.id || attempt._id, type, metadata);
      } catch (e) {
        console.error('Failed to send signal:', e);
      }
    };
    
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        sendSignal('FULLSCREEN_EXIT');
        alert("Warning: Fullscreen mode was exited. Please return to fullscreen. Your actions are being recorded.");
      }
    };
    
    const onVisibilityChange = () => {
      if (document.hidden) {
        sendSignal('TAB_SWITCH');
      }
    };
    
    const onBlur = () => {
      sendSignal('WINDOW_BLUR');
    };
    
    const onCopy = (e) => { e.preventDefault(); sendSignal('COPY_ATTEMPT'); };
    const onPaste = (e) => { e.preventDefault(); sendSignal('PASTE_ATTEMPT'); };
    const onCut = (e) => { e.preventDefault(); sendSignal('CUT_ATTEMPT'); };
    const onContextMenu = (e) => { e.preventDefault(); };
    
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('cut', onCut);
    document.addEventListener('contextmenu', onContextMenu);
    
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('contextmenu', onContextMenu);
    }
  }, [secureModeEntered, attempt]);

  const enterSecureMode = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setSecureModeEntered(true);
        setFullscreenError('');
      } else {
        setFullscreenError('Fullscreen API is not supported by your browser.');
      }
    } catch (err) {
      setFullscreenError('Fullscreen request was denied. Please allow fullscreen to start the exam.');
    }
  };

  const [saveTimeout, setSaveTimeout] = useState(null);

  const saveAnswersToBackend = async (answersObj) => {
    if (!attempt || isConnectionLost) return;
    try {
      const formattedAnswers = Object.entries(answersObj).map(([qId, val]) => ({
        questionId: qId,
        selectedOption: val.selectedOption || '',
        textAnswer: val.textAnswer || '',
      }));
      await examService.saveProgress(attempt.id || attempt._id, formattedAnswers);
    } catch (err) {
      console.error('Failed to auto-save answers:', err);
    }
  };

  const debouncedSave = (newAnswers) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    setSaveTimeout(setTimeout(() => {
      saveAnswersToBackend(newAnswers);
    }, 1500));
  };

  const handleOptionSelect = (qId, option) => {
    setUserAnswers((prev) => {
      const updated = { ...prev, [qId]: { ...prev[qId], selectedOption: option } };
      debouncedSave(updated);
      return updated;
    });
  };

  const handleTextAnswerChange = (qId, text) => {
    setUserAnswers((prev) => {
      const updated = { ...prev, [qId]: { ...prev[qId], textAnswer: text } };
      debouncedSave(updated);
      return updated;
    });
  };
  
  const toggleMarkForReview = (qId) => {
    setMarkedForReview(prev => ({...prev, [qId]: !prev[qId]}));
  };

  const handleAutoSubmit = () => {
    alert("Exam time has ended. Your attempt was submitted automatically.");
    executeSubmit();
  };

  const executeSubmit = async () => {
    if (!attempt || !exam) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const formattedAnswers = Object.entries(userAnswers).map(([qId, val]) => ({
        questionId: qId,
        selectedOption: val.selectedOption || '',
        textAnswer: val.textAnswer || '',
      }));

      const res = await examService.submitAttempt(attempt.id || attempt._id, formattedAnswers);
      if (res.success && res.data?.attempt) {
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(e => console.error(e));
        }
        navigate('/student/exam/submitted', { state: { attempt: res.data.attempt, exam } });
      }
    } catch (err) {
      setError(err.message || 'Failed to submit exam attempt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="p-12 text-center max-w-md space-y-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">Initializing Exam Session</h3>
          <p className="text-xs text-[var(--text-secondary)]">Loading your persisted questions from database...</p>
        </div>
      </div>
    );
  }

  if (error && (!exam || !attempt)) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="p-12 text-center max-w-md space-y-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">Exam Session Error</h3>
          <p className="text-xs text-[var(--text-secondary)]">{error}</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/student/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  const [proctorStatus, setProctorStatus] = useState({ camera: true, faceDetected: true });
  const [questionTimings, setQuestionTimings] = useState({});
  const [qOpenedAt, setQOpenedAt] = useState(Date.now());

  const handleProctorSignal = async (signalType, metadata = {}) => {
    if (!attempt) return;
    try {
      await examService.sendIntegritySignal(attempt.id || attempt._id, signalType, metadata);
    } catch (e) {
      console.error('Failed to send proctor signal:', e);
    }
  };

  if (!secureModeEntered && exam && attempt) {
    return (
      <SecureExamPreCheck
        exam={exam}
        securitySettings={exam.securitySettings}
        onStartExam={() => setSecureModeEntered(true)}
      />
    );
  }

  const questions = exam?.questionIds || [];
  const currentQ = questions[currentQuestionIndex];
  const qId = currentQ?._id || currentQ?.id;
  const currentAns = userAnswers[qId] || {};

  const unansweredCount = questions.filter(q => {
      const ans = userAnswers[q._id || q.id];
      return !ans || (!ans.selectedOption && !ans.textAnswer);
  }).length;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col h-screen overflow-hidden">
      {/* Top Banner */}
      <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] px-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">{exam?.title}</h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {exam?.courseId?.code} — {exam?.courseId?.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isConnectionLost && (
             <span className="px-3 py-1 bg-red-500/10 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2">
               <AlertCircle className="w-4 h-4"/> Connection Lost. Saving locally.
             </span>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-xl font-mono text-sm font-bold">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>Time Left: {formatTime(timeLeft)}</span>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowSubmitConfirm(true)}>
            Finish Exam
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Exam Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          
          {currentQ && (
            <div className="max-w-3xl mx-auto space-y-8 pb-10">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      {currentQuestionIndex + 1}
                    </span>
                    <Badge variant="primary">{currentQ.type}</Badge>
                    <Badge variant="neutral">{currentQ.difficulty}</Badge>
                 </div>
                 <Button 
                   variant={markedForReview[qId] ? "primary" : "outline"} 
                   size="sm" 
                   icon={Flag}
                   onClick={() => toggleMarkForReview(qId)}
                 >
                   {markedForReview[qId] ? 'Marked' : 'Mark for Review'}
                 </Button>
               </div>
               
               <div className="text-base font-bold text-[var(--text-primary)] leading-relaxed p-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm">
                  {currentQ.questionText}
               </div>
               
               <div className="space-y-4">
                 {(currentQ.type === 'MCQ' || currentQ.type === 'TRUE_FALSE') && (
                    <div className="space-y-3">
                      {(currentQ.options?.length > 0 ? currentQ.options : ['True', 'False']).map((opt, oIdx) => {
                        const isSelected = currentAns.selectedOption === opt;
                        return (
                          <label
                            key={oIdx}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 text-sm font-semibold ${
                              isSelected
                                ? 'bg-[var(--primary-light)]/20 border-[var(--primary)] text-[var(--primary)] shadow-sm'
                                : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary-border)] text-[var(--text-primary)]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q_${qId}`}
                              value={opt}
                              checked={isSelected}
                              onChange={() => handleOptionSelect(qId, opt)}
                              className="w-5 h-5 text-[var(--primary)] focus:ring-[var(--primary)]"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {currentQ.type === 'SHORT_ANSWER' && (
                    <div>
                      <textarea
                        rows={6}
                        placeholder="Write your answer here..."
                        value={currentAns.textAnswer || ''}
                        onChange={(e) => handleTextAnswerChange(qId, e.target.value)}
                        className="w-full p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      />
                    </div>
                  )}
               </div>
               
               <div className="flex justify-between pt-8">
                  <Button 
                    variant="outline" 
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="primary" 
                    disabled={currentQuestionIndex === questions.length - 1}
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  >
                    Next Question
                  </Button>
               </div>
            </div>
          )}
        </div>
        
        {/* Sidebar Palette & Security */}
        <div className="w-80 bg-[var(--surface)] border-l border-[var(--border)] p-5 shrink-0 flex flex-col h-full overflow-y-auto space-y-6">
           {exam?.securitySettings?.cameraMonitoring !== false && (
             <div className="space-y-2">
               <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Live Proctor Monitor</h4>
               <FaceProctor
                 enabled={true}
                 onSignal={handleProctorSignal}
                 onStatusChange={setProctorStatus}
                 showPreview={true}
               />
             </div>
           )}

           <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-2 text-[11px]">
             <div className="flex items-center justify-between font-bold text-[var(--text-primary)]">
               <span>● Secure Mode Active</span>
               <span className="text-emerald-500">Active</span>
             </div>
             <div className="flex items-center justify-between text-[var(--text-secondary)]">
               <span>● Camera Status</span>
               <span className={proctorStatus.camera ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>
                 {proctorStatus.camera ? "Active" : "Disabled"}
               </span>
             </div>
             <div className="flex items-center justify-between text-[var(--text-secondary)]">
               <span>● Face Presence</span>
               <span className={proctorStatus.faceDetected ? "text-emerald-500 font-bold" : "text-amber-500 font-bold animate-pulse"}>
                 {proctorStatus.faceDetected ? "Detected" : "Absence Alert"}
               </span>
             </div>
             <div className="flex items-center justify-between text-[var(--text-secondary)]">
               <span>● Network Connection</span>
               <span className={!isConnectionLost ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>
                 {!isConnectionLost ? "Connected" : "Offline"}
               </span>
             </div>
           </div>

           <h3 className="font-bold text-[var(--text-primary)] mb-3 text-sm">Question Palette</h3>
           <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                 const id = q._id || q.id;
                 const ans = userAnswers[id];
                 const isAnswered = ans && (ans.selectedOption || (ans.textAnswer && ans.textAnswer.length > 0));
                 const isMarked = markedForReview[id];
                 const isActive = currentQuestionIndex === idx;
                 
                 let bgClass = "bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)]";
                 if (isAnswered) bgClass = "bg-[var(--success)] text-white border-[var(--success)]";
                 if (isMarked) bgClass = "bg-amber-500 text-white border-amber-500";
                 if (isActive) bgClass += " ring-2 ring-offset-2 ring-[var(--primary)] ring-offset-[var(--surface)]";
                 
                 return (
                   <button 
                     key={id}
                     onClick={() => setCurrentQuestionIndex(idx)}
                     className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border ${bgClass}`}
                   >
                     {idx + 1}
                   </button>
                 )
              })}
           </div>
           
           <div className="mt-8 space-y-3 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded bg-[var(--success)]"></div> Answered
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded bg-[var(--background)] border border-[var(--border)]"></div> Unanswered
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-4 h-4 rounded bg-amber-500"></div> Marked for Review
              </div>
           </div>
           
           <div className="mt-auto pt-6">
              <Button variant="primary" className="w-full" onClick={() => setShowSubmitConfirm(true)}>
                Submit Exam
              </Button>
           </div>
        </div>
      </div>
      
      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
           <div className="bg-[var(--surface)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6">
             <h3 className="text-xl font-bold text-[var(--text-primary)]">Confirm Submission</h3>
             <p className="text-sm text-[var(--text-secondary)]">
               You are about to submit your exam. Once submitted, you cannot change your answers.
             </p>
             {unansweredCount > 0 && (
               <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg text-sm font-semibold flex items-center gap-2">
                 <AlertCircle className="w-5 h-5" />
                 You have {unansweredCount} unanswered questions.
               </div>
             )}
             <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowSubmitConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1" icon={Send} loading={isSubmitting} onClick={executeSubmit}>
                  Yes, Submit Exam
                </Button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};
