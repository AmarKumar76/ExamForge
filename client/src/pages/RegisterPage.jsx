import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Sparkles, ArrowRight, UserCheck, GraduationCap, School, Lock, Mail, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); // 'student' | 'instructor'
  const [formData, setFormData] = useState({ name: '', email: '', password: '', institution: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (role === 'student') {
      navigate('/student/dashboard');
    } else {
      navigate('/instructor/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col justify-between py-8 px-4 sm:px-6">
      {/* Top Brand Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between mb-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-bold text-base shadow-sm">
            EF
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[var(--text-primary)]">
            Exam<span className="text-[var(--primary)]">Forge</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle size="sm" />
          <Link to="/" className="text-xs font-semibold text-[var(--primary)] hover:underline">
            Back to Home
          </Link>
        </div>
      </div>

      {/* Main Registration Box */}
      <div className="max-w-md w-full mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Create your ExamForge Account
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Join the smart assessment platform. Select your role to get started.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-[var(--surface-muted)] p-1.5 rounded-xl border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              role === 'student'
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('instructor')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              role === 'instructor'
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Instructor</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Rivera"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Institutional Email
            </label>
            <input
              type="email"
              required
              placeholder="name@university.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
              <School className="w-3.5 h-3.5" /> University / Organization Name
            </label>
            <input
              type="text"
              placeholder="e.g. Stanford University"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <Button variant="primary" size="lg" className="w-full justify-center mt-2" icon={ArrowRight}>
            Register as {role === 'student' ? 'Student' : 'Instructor'}
          </Button>
        </form>

        <div className="pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[var(--primary)] hover:underline">
            Sign In
          </Link>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-[var(--text-secondary)] mt-6">
        © {new Date().getFullYear()} ExamForge. All rights reserved.
      </div>
    </div>
  );
};
