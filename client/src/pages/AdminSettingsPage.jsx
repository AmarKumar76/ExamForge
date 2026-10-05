import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { institutionService } from '../services/institutionService';
import {
  Settings,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Save,
  X,
  Lock,
} from 'lucide-react';

export const AdminSettingsPage = () => {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstId, setSelectedInstId] = useState(user?.institutionId || '');
  const [settingsForm, setSettingsForm] = useState({
    maxStudents: 5000,
    allowSelfEnrollment: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadSettingsData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const instRes = await institutionService.getAll().catch(() => ({ success: false, data: { institutions: [] } }));
      if (instRes.success && Array.isArray(instRes.data?.institutions)) {
        setInstitutions(instRes.data.institutions);
        const target = instRes.data.institutions.find((i) => (i.id || i._id) === selectedInstId) || instRes.data.institutions[0];
        if (target) {
          setSelectedInstId(target.id || target._id);
          setSettingsForm({
            maxStudents: target.settings?.maxStudents || 5000,
            allowSelfEnrollment: target.settings?.allowSelfEnrollment ?? true,
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load platform settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const handleInstChange = (instId) => {
    setSelectedInstId(instId);
    const target = institutions.find((i) => (i.id || i._id) === instId);
    if (target) {
      setSettingsForm({
        maxStudents: target.settings?.maxStudents || 5000,
        allowSelfEnrollment: target.settings?.allowSelfEnrollment ?? true,
      });
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!selectedInstId) return;

    try {
      setIsSaving(true);
      setError(null);
      const res = await institutionService.update(selectedInstId, {
        settings: settingsForm,
      });
      if (res.success) {
        setSuccess('Institution capacity and platform enrollment settings saved successfully!');
        await loadSettingsData();
      }
    } catch (err) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell title="Platform Settings">
      <div className="space-y-6 max-w-4xl pb-12">
        {/* Header */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Enterprise Platform Settings</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Configure institutional student quotas, self-enrollment policies, and security defaults.
          </p>
        </div>

        {success && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
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

        {/* Settings Form */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-6">
          {institutions.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-primary)] block">Target Institution Configuration</label>
              <select
                value={selectedInstId}
                onChange={(e) => handleInstChange(e.target.value)}
                className="w-full max-w-md px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {institutions.map((inst) => (
                  <option key={inst.id || inst._id} value={inst.id || inst._id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs pt-4 border-t border-[var(--border-subtle)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Maximum Student Quota</label>
                <input
                  type="number"
                  required
                  min={100}
                  max={50000}
                  value={settingsForm.maxStudents}
                  onChange={(e) => setSettingsForm({ ...settingsForm, maxStudents: parseInt(e.target.value, 10) || 5000 })}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                <span className="text-[11px] text-[var(--text-secondary)] mt-1 block">Maximum allowed student registrations for this institution.</span>
              </div>

              <div>
                <label className="font-bold text-[var(--text-primary)] block mb-1">Self-Enrollment Policy</label>
                <label className="p-3 bg-[var(--background)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-[var(--text-primary)] font-medium">Allow student self-enrollment into active courses</span>
                  <input
                    type="checkbox"
                    checked={settingsForm.allowSelfEnrollment}
                    onChange={(e) => setSettingsForm({ ...settingsForm, allowSelfEnrollment: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
              <Button type="submit" variant="primary" size="sm" icon={Save} loading={isSaving}>
                Save Configuration
              </Button>
            </div>
          </form>
        </div>

        {/* Security Policy Information */}
        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] space-y-3 text-xs">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--primary)]" />
            Security & Compliance Information
          </h3>
          <p className="text-[var(--text-secondary)]">
            ExamForge strictly isolates institutional data using server-side role validation. All admin actions are recorded in the immutable audit log.
          </p>
        </div>
      </div>
    </AppShell>
  );
};
