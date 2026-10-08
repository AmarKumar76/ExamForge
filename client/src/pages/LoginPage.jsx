import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, ShieldCheck, Lock, Mail, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const successMsg = location.state?.successMessage;

  const [selectedRole, setSelectedRole] = useState('instructor');
  const [email, setEmail] = useState('amar@gmail.com');
  const [password, setPassword] = useState('Instructor@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'student') {
      setEmail('student@examforge.org');
      setPassword('Student@123');
    } else if (role === 'instructor') {
      setEmail('amar@gmail.com');
      setPassword('Instructor@123');
    } else {
      setEmail('admin@examforge.org');
      setPassword('Admin@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });

      if (user.role === 'INSTRUCTOR') {
        navigate('/instructor/dashboard');
      } else if (user.role === 'SUPER_ADMIN' || user.role === 'INSTITUTION_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 md:p-8 relative text-[var(--text-primary)]">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Login Form Panel */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between">
          <div>
            {/* Header Brand + ThemeToggle & Back to Home */}
            <div className="flex items-center justify-between mb-6">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                  EF
                </div>
                <span className="font-bold text-lg text-[var(--text-primary)]">Exam<span className="text-[var(--primary)]">Forge</span></span>
              </Link>
              <div className="flex items-center gap-3">
                <ThemeToggle size="sm" />
                <Link to="/" className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer">
                  Back to Home
                </Link>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Welcome Back</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Sign in to your ExamForge account</p>

            {/* Success Alert Box (e.g. post-registration message) */}
            {successMsg && (
              <div className="my-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Alert Box */}
            {error && (
              <div className="my-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Role Tabs Selector */}
            <div className="flex items-center gap-2 p-1 bg-[var(--surface-muted)] rounded-[var(--radius-md)] my-5 border border-[var(--border-subtle)]">
              {['student', 'instructor', 'admin'].map((role) => (
                <button
                  key={role}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRoleSelect(role)}
                  className={`flex-1 py-1.5 text-xs font-semibold capitalize rounded-[var(--radius-sm)] transition-all ${
                    selectedRole === role
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    disabled={isSubmitting}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Password</label>
                  <Link to="/forgot-password" className="text-xs text-[var(--primary)] font-bold hover:underline focus:outline-none">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    disabled={isSubmitting}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] focus:outline-none focus:text-[var(--primary)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full mt-2 justify-center"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="relative my-6 text-center">
              <span className="text-[11px] text-[var(--text-muted)] bg-[var(--surface)] px-2 relative z-10 font-medium">or continue with</span>
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-subtle)]"></div></div>
            </div>

            {/* Social Logins */}
            <div className="flex items-center justify-center gap-3">
              <button className="w-10 h-10 rounded-[var(--radius-md)] border border-[var(--border)] flex items-center justify-center text-xs font-bold hover:bg-[var(--surface-muted)] text-[var(--text-primary)]">G</button>
              <button className="w-10 h-10 rounded-[var(--radius-md)] border border-[var(--border)] flex items-center justify-center text-xs font-bold hover:bg-[var(--surface-muted)] text-[var(--text-primary)]">M</button>
              <button className="w-10 h-10 rounded-[var(--radius-md)] border border-[var(--border)] flex items-center justify-center text-xs font-bold hover:bg-[var(--surface-muted)] text-[var(--text-primary)]">GH</button>
            </div>
          </div>

          <p className="text-xs text-center text-[var(--text-secondary)] mt-6">
            Accounts are created and provisioned by institution administrators.
          </p>
        </div>

        {/* Right Illustration Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="w-24 h-24 rounded-full bg-white/10 absolute -top-8 -right-8" />
          <div className="w-40 h-40 rounded-full bg-white/5 absolute -bottom-10 -left-10" />

          <div className="relative z-10 my-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/10 mx-auto flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Learn. Assess. Improve.</h3>
            <p className="text-xs text-white/80 leading-relaxed max-w-xs mx-auto">
              Join thousands of students and educators using ExamForge for smarter assessments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
