import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { ShieldAlert, CheckCircle2, AlertCircle, Camera, Maximize, Wifi, Monitor } from 'lucide-react';
import { FaceProctor } from './FaceProctor';

export const SecureExamPreCheck = ({
  exam,
  onStartExam = () => {},
  securitySettings = {},
}) => {
  const isCameraRequired = securitySettings?.cameraMonitoring !== false;

  const [checks, setChecks] = useState({
    browser: true,
    connection: navigator.onLine,
    fullscreen: !!document.documentElement.requestFullscreen,
    camera: !isCameraRequired,
    faceDetected: !isCameraRequired,
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');

  useEffect(() => {
    const handleOnline = () => setChecks((prev) => ({ ...prev, connection: true }));
    const handleOffline = () => setChecks((prev) => ({ ...prev, connection: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleProctorStatusChange = (status) => {
    setChecks((prev) => ({
      ...prev,
      camera: status.camera,
      faceDetected: status.faceDetected,
    }));
  };

  const allReady = checks.browser && checks.connection && checks.fullscreen && checks.camera && checks.faceDetected;

  const handleProceed = async () => {
    try {
      setIsVerifying(true);
      setFullscreenError('');
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      onStartExam();
    } catch (err) {
      setFullscreenError('Fullscreen permission was denied. Please allow fullscreen mode to begin the exam.');
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 max-w-xl w-full space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-[var(--primary-light)]/20 text-[var(--primary)] flex items-center justify-center mx-auto mb-2 border border-[var(--primary-light)]/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Secure Exam Verification</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            {exam?.title} — {exam?.courseId?.code}
          </p>
        </div>

        <div className="p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">System & Environment Readiness</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="font-semibold text-[var(--text-primary)]">Browser Compatible</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="font-semibold text-[var(--text-primary)]">Internet Connection</span>
              </div>
              {checks.connection ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
              )}
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="font-semibold text-[var(--text-primary)]">Fullscreen Mode</span>
              </div>
              {checks.fullscreen ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>

            {isCameraRequired && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="font-semibold text-[var(--text-primary)]">Camera & Face</span>
                </div>
                {checks.camera && checks.faceDetected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
                )}
              </div>
            )}
          </div>
        </div>

        {isCameraRequired && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Live Proctor Preview</label>
            <FaceProctor enabled={true} onStatusChange={handleProctorStatusChange} />
          </div>
        )}

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Exam Security Notice
          </p>
          <p className="text-[11px] leading-relaxed">
            Integrity monitoring is active during this examination. Tab switching, exiting fullscreen, copy/pasting, or unauthorized camera absence will be recorded for instructor review.
          </p>
        </div>

        {fullscreenError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fullscreenError}</span>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full font-bold"
          disabled={!allReady || isVerifying}
          loading={isVerifying}
          icon={Maximize}
          onClick={handleProceed}
        >
          {allReady ? 'Start Exam in Fullscreen' : 'Complete Verification Above to Begin'}
        </Button>
      </div>
    </div>
  );
};
