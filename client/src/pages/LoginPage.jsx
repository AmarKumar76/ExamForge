import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { GraduationCap, ArrowRight, ShieldCheck, Lock, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';

import { ThemeToggle } from '../components/ui/ThemeToggle';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setActiveRole } = useTheme();
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState(
    selectedRole === 'student'
      ? 'amar@example.com'
      : selectedRole === 'instructor'
      ? 'priya@college.edu'
      : 'admin@examforge.org'
  );
  const [password, setPassword] = useState('••••••••');

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'student') setEmail('amar@example.com');
    else if (role === 'instructor') setEmail('priya@college.edu');
    else setEmail('admin@examforge.org');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setActiveRole(selectedRole);
    if (selectedRole === 'student') navigate('/student/dashboard');
    else if (selectedRole === 'instructor') navigate('/instructor/dashboard');
    else navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 md:p-8 relative">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Login Form Panel */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between">
          <div>
            {/* Header Brand + ThemeToggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm">
                  EF
                </div>
                <span className="font-bold text-lg text-[var(--text-primary)]">Exam<span className="text-[var(--primary)]">Forge</span></span>
              </div>
              <ThemeToggle size="sm" />
            </div>

            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Welcome Back</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Login to your account</p>

            {/* Role Tabs Selector */}
            <div className="flex items-center gap-2 p-1 bg-[var(--surface-muted)] rounded-[var(--radius-md)] my-6 border border-[var(--border-subtle)]">
              {['student', 'instructor', 'admin'].map((role) => (
                <button
                  key={role}
                  type="button"
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
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email or Roll Number</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Password</label>
                  <a href="#" className="text-xs text-[var(--primary)] font-semibold hover:underline">Forgot Password?</a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    required
                  />
                </div>
              </div>

              <Button variant="primary" size="md" className="w-full mt-2" type="submit">
                Sign In
              </Button>
            </form>

            <div className="relative my-6 text-center">
              <span className="text-[11px] text-[var(--text-muted)] bg-[var(--surface)] px-2 relative z-10 font-medium">or continue with</span>
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-subtle)]"></div></div>
            </div>

            {/* Social Logins */}
            <div className="flex items-center justify-center gap-3">
              <button className="w-10 h-10 rounded-[var(--radius-md)] border border-[var(--border)] flex items-center justify-center text-xs font-bold hover:bg-[var(--surface-muted)]">G</button>
              <button className="w-10 h-10 rounded-[var(--radius-md)] border border-[var(--border)] flex items-center justify-center text-xs font-bold hover:bg-[var(--surface-muted)]">M</button>
              <button className="w-10 h-10 rounded-[var(--radius-md)] border border-[var(--border)] flex items-center justify-center text-xs font-bold hover:bg-[var(--surface-muted)]">GH</button>
            </div>
          </div>

          <p className="text-xs text-center text-[var(--text-secondary)] mt-6">
            Don't have an account? <Link to="/register" className="text-[var(--primary)] font-bold hover:underline">Sign up</Link>
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
            <h3 className="text-xl font-bold">Learn. Assess. Improve.</h3>
            <p className="text-xs text-white/80 leading-relaxed max-w-xs mx-auto">
              Join thousands of students and educators using ExamForge for smarter assessments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
