import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';

export const Navbar = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
            EF
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[var(--text-primary)]">
            Exam<span className="text-[var(--primary)]">Forge</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]">
          <button 
            onClick={() => scrollToSection('features')}
            className="hover:text-[var(--primary)] transition-colors cursor-pointer"
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-[var(--primary)] transition-colors cursor-pointer"
          >
            How it works
          </button>
          <button 
            onClick={() => scrollToSection('ai-prep')}
            className="hover:text-[var(--primary)] transition-colors cursor-pointer"
          >
            AI Preparation
          </button>
          <button 
            onClick={() => scrollToSection('analytics')}
            className="hover:text-[var(--primary)] transition-colors cursor-pointer"
          >
            Analytics
          </button>
          <button 
            onClick={() => scrollToSection('pricing')}
            className="hover:text-[var(--primary)] transition-colors cursor-pointer"
          >
            Pricing
          </button>
        </nav>

        {/* Action Controls & Theme Toggle */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle size="md" />
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" icon={ArrowRight} onClick={() => navigate('/register')}>
            Get Started Free
          </Button>
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle size="sm" />
          <button
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4 space-y-3">
          <button
            onClick={() => scrollToSection('features')}
            className="block w-full text-left py-2 font-medium text-[var(--text-primary)] hover:text-[var(--primary)]"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="block w-full text-left py-2 font-medium text-[var(--text-primary)] hover:text-[var(--primary)]"
          >
            How it works
          </button>
          <button
            onClick={() => scrollToSection('ai-prep')}
            className="block w-full text-left py-2 font-medium text-[var(--text-primary)] hover:text-[var(--primary)]"
          >
            AI Preparation
          </button>
          <button
            onClick={() => scrollToSection('analytics')}
            className="block w-full text-left py-2 font-medium text-[var(--text-primary)] hover:text-[var(--primary)]"
          >
            Analytics
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="block w-full text-left py-2 font-medium text-[var(--text-primary)] hover:text-[var(--primary)]"
          >
            Pricing
          </button>
          <div className="pt-4 border-t border-[var(--border)] flex flex-col gap-2">
            <Button variant="ghost" size="md" className="w-full justify-center" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button variant="primary" size="md" className="w-full justify-center" onClick={() => navigate('/register')}>
              Get Started Free
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
