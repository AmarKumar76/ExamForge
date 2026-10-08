import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';
import { User, Lock, Bell, Moon, Sun, CheckCircle, AlertCircle, Save, RefreshCw, Eye, EyeOff } from 'lucide-react';

export const InstructorSettingsPage = () => {
  const { user, login } = useAuth(); // login can re-sync user state if updated
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('PROFILE');

  // Security Show/Hide Password States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    institutionName: user?.institutionId?.name || 'N/A',
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSecuritySaving, setIsSecuritySaving] = useState(false);
  const [securityMessage, setSecurityMessage] = useState(null);

  // Preferences Form State
  const [preferences, setPreferences] = useState({
    examSubmissions: user?.notificationPreferences?.examSubmissions ?? true,
    resultUpdates: user?.notificationPreferences?.resultUpdates ?? true,
    aiQuestionGen: user?.notificationPreferences?.aiQuestionGen ?? true,
    studentActivity: user?.notificationPreferences?.studentActivity ?? false,
  });
  const [isPrefSaving, setIsPrefSaving] = useState(false);
  const [prefMessage, setPrefMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        institutionName: user.institutionId?.name || user.institutionName || 'ExamForge Platform',
      });
      if (user.notificationPreferences) {
        setPreferences({
          examSubmissions: user.notificationPreferences.examSubmissions ?? true,
          resultUpdates: user.notificationPreferences.resultUpdates ?? true,
          aiQuestionGen: user.notificationPreferences.aiQuestionGen ?? true,
          studentActivity: user.notificationPreferences.studentActivity ?? false,
        });
      }
    }
  }, [user]);

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await userService.updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        department: profileForm.department,
      });

      if (res.success) {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Update local state if token updated
        if (res.data?.user && res.data?.token) {
          localStorage.setItem('auth_token', res.data.token);
        }
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsProfileSaving(false);
    }
  };

  // Handle Password Change
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setSecurityMessage(null);

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    if (securityForm.newPassword.length < 6) {
      setSecurityMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsSecuritySaving(true);
    try {
      const res = await userService.changePassword({
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });

      if (res.success) {
        setSecurityMessage({ type: 'success', text: 'Password changed successfully!' });
        setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setSecurityMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setIsSecuritySaving(false);
    }
  };

  // Handle Notification Preferences Update
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setIsPrefSaving(true);
    setPrefMessage(null);
    try {
      const res = await userService.updatePreferences(preferences);
      if (res.success) {
        setPrefMessage({ type: 'success', text: 'Notification preferences saved!' });
      }
    } catch (err) {
      setPrefMessage({ type: 'error', text: err.message || 'Failed to save preferences.' });
    } finally {
      setIsPrefSaving(false);
    }
  };

  return (
    <AppShell title="Settings">
      <div className="space-y-6 max-w-4xl pb-12">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Instructor Settings</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage your instructor profile, security credentials, and application preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border)] gap-6">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'PROFILE'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <User className="w-4 h-4" />
            Profile Details
          </button>
          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'SECURITY'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Lock className="w-4 h-4" />
            Security & Password
          </button>
          <button
            onClick={() => setActiveTab('PREFERENCES')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'PREFERENCES'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Bell className="w-4 h-4" />
            Preferences
          </button>
        </div>

        {/* TAB 1: PROFILE */}
        {activeTab === 'PROFILE' && (
          <Card title="Instructor Profile">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    profileMessage.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 border border-red-500/20'
                  }`}
                >
                  {profileMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {profileMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Email Address <span className="text-[10px] font-normal text-[var(--text-secondary)]">(Read-only)</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profileForm.email}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-xs bg-[var(--surface-muted)] text-[var(--text-secondary)] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science & Engineering"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Institution
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profileForm.institutionName}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-xs bg-[var(--surface-muted)] text-[var(--text-secondary)] cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm" icon={Save} disabled={isProfileSaving}>
                  {isProfileSaving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 2: SECURITY */}
        {activeTab === 'SECURITY' && (
          <Card title="Security & Password">
            <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
              {securityMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    securityMessage.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 border border-red-500/20'
                  }`}
                >
                  {securityMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {securityMessage.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                    className="w-full pl-3 pr-9 py-2 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    className="w-full pl-3 pr-9 py-2 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    className="w-full pl-3 pr-9 py-2 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="sm" icon={Save} disabled={isSecuritySaving}>
                  {isSecuritySaving ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* TAB 3: PREFERENCES */}
        {activeTab === 'PREFERENCES' && (
          <div className="space-y-6">
            {/* Theme Preference */}
            <Card title="Appearance Theme">
              <div className="flex items-center justify-between p-2">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Interface Theme</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                    Toggle between dark mode and light mode visual styles
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  icon={theme === 'dark' ? Sun : Moon}
                >
                  Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                </Button>
              </div>
            </Card>

            {/* Notification Preferences */}
            <Card title="Notification Preferences">
              <form onSubmit={handleSavePreferences} className="space-y-4">
                {prefMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      prefMessage.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-600 border border-red-500/20'
                    }`}
                  >
                    {prefMessage.type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {prefMessage.text}
                  </div>
                )}

                <div className="space-y-3 divide-y divide-[var(--border-subtle)]">
                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">Exam Submissions</h4>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Receive alert when a student submits an assigned exam
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.examSubmissions}
                      onChange={(e) =>
                        setPreferences({ ...preferences, examSubmissions: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">Result Updates</h4>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Notifications when exam scores or AI evaluations are published
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.resultUpdates}
                      onChange={(e) =>
                        setPreferences({ ...preferences, resultUpdates: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">AI Question Generation</h4>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Alerts when AI Question Studio completes bulk question parsing
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.aiQuestionGen}
                      onChange={(e) =>
                        setPreferences({ ...preferences, aiQuestionGen: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">Student Activity</h4>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Digest alerts regarding course enrollment changes and active exam sessions
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.studentActivity}
                      onChange={(e) =>
                        setPreferences({ ...preferences, studentActivity: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" variant="primary" size="sm" icon={Save} disabled={isPrefSaving}>
                    {isPrefSaving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
};
