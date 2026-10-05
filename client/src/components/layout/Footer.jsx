import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)] pt-16 pb-12 text-[var(--text-secondary)] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[var(--border-subtle)]">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-bold text-sm">
                EF
              </div>
              <span className="font-extrabold text-lg tracking-tight text-[var(--text-primary)]">
                Exam<span className="text-[var(--primary)]">Forge</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-sm text-[var(--text-secondary)]">
              The next-generation AI-powered assessment, proctoring, and adaptive learning platform for modern universities, schools, and enterprise testing.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--primary)] bg-[var(--primary-light)] px-3 py-1.5 rounded-full w-fit border border-[var(--primary-border)]">
              <Shield className="w-3.5 h-3.5" />
              <span>FERPA & GDPR Compliant Security</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-[var(--primary)] transition-colors">AI Question Studio</a></li>
              <li><a href="#features" className="hover:text-[var(--primary)] transition-colors">Question Bank RAG</a></li>
              <li><a href="#features" className="hover:text-[var(--primary)] transition-colors">Live Proctoring</a></li>
              <li><a href="#ai-prep" className="hover:text-[var(--primary)] transition-colors">Adaptive AI Prep</a></li>
              <li><a href="#analytics" className="hover:text-[var(--primary)] transition-colors">Analytics Engine</a></li>
            </ul>
          </div>

          {/* Solutions Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">Solutions</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/student/dashboard" className="hover:text-[var(--primary)] transition-colors">For Students</Link></li>
              <li><Link to="/instructor/dashboard" className="hover:text-[var(--primary)] transition-colors">For Instructors</Link></li>
              <li><Link to="/admin/dashboard" className="hover:text-[var(--primary)] transition-colors">For Institutions</Link></li>
              <li><a href="#pricing" className="hover:text-[var(--primary)] transition-colors">Pricing Plans</a></li>
            </ul>
          </div>

          {/* Resources & Legal */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">Company & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Security Overview</a></li>
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Contact Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <p>© {new Date().getFullYear()} ExamForge Platform Inc. All rights reserved.</p>
          <div className="flex items-center gap-1 text-[var(--text-secondary)]">
            <span>Crafted for high-integrity modern education</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
