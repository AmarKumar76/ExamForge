import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

export const CTASection = ({ 
  title = "Build better assessments. Help students learn better.",
  subtitle = "Join thousands of instructors and institutions creating secure, AI-powered exams and personalized adaptive practice loops.",
  primaryCtaText = "Get Started Free",
  secondaryCtaText = "Explore Platform",
  onPrimaryClick,
  onSecondaryClick
}) => {
  const navigate = useNavigate();

  const handlePrimary = onPrimaryClick || (() => navigate('/login'));
  const handleSecondary = onSecondaryClick || (() => navigate('/login'));

  return (
    <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="relative rounded-3xl bg-[var(--primary)] text-white p-8 md:p-14 overflow-hidden shadow-2xl">
        {/* Background Subtle Patterns */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready for Production Assessment</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
            {title}
          </h2>

          <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-2xl">
            {subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button 
              variant="secondary" 
              size="lg" 
              icon={ArrowRight} 
              onClick={handlePrimary}
              className="bg-white text-[var(--primary)] hover:bg-white/90 font-bold border-none shadow-lg"
            >
              {primaryCtaText}
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              onClick={handleSecondary}
              className="text-white hover:bg-white/10 border border-white/20"
            >
              {secondaryCtaText}
            </Button>
          </div>

          <div className="pt-6 flex flex-wrap items-center gap-6 text-xs text-white/70">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" /> Free 14-day trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" /> FERPA compliant
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
