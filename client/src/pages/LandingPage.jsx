import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ShieldCheck, ArrowRight, PlayCircle, GraduationCap, 
  BarChart3, FileText, CheckCircle2, Users, Building, Layers, 
  BrainCircuit, Lock, Award, Target, TrendingUp, RefreshCw, Cpu, 
  BookOpen, Eye, HelpCircle
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { FeatureCard } from '../components/ui/FeatureCard';
import { StepCard } from '../components/ui/StepCard';
import { CTASection } from '../components/ui/CTASection';
import { Card } from '../components/ui/Card';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] font-sans selection:bg-[var(--primary)] selection:text-white">
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Hero Section */}
      <section className="relative py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-[var(--accent)]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold border border-[var(--primary-border)] shadow-xs">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered • Secure Proctoring • Adaptive Learning</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.12]">
              Smarter Assessments <br />
              <span className="text-[var(--primary)]">for Better Learning</span>
            </h1>

            <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Create, conduct, and evaluate high-stakes exams with RAG-driven AI assistance. Ensure academic integrity with live proctoring, and turn post-exam results into personalized adaptive study paths.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button 
                variant="primary" 
                size="lg" 
                icon={ArrowRight} 
                onClick={() => navigate('/login')}
                className="shadow-md hover:shadow-lg"
              >
                Get Started Free
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                icon={PlayCircle} 
                onClick={() => navigate('/login')}
              >
                Explore Live Demo
              </Button>
            </div>

            {/* Quick feature checklist */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                <span>Zero AI Hallucinations (RAG)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                <span>Live AI Proctoring</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                <span>Adaptive Practice Loop</span>
              </div>
            </div>
          </div>

          {/* Hero Interactive Dashboard Visual */}
          <div className="lg:col-span-5 relative">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl space-y-5 relative">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[var(--accent)]" />
                  <span className="text-xs font-bold tracking-tight text-[var(--text-primary)]">
                    ExamForge Master Dashboard
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary-light)] px-2.5 py-1 rounded-full border border-[var(--primary-border)]">
                  Live Engine
                </span>
              </div>

              {/* Status Chips */}
              <div className="space-y-3">
                <div className="p-3.5 bg-[var(--primary-light)] rounded-xl flex items-center justify-between border border-[var(--primary-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--primary)]">RAG Question Studio</h4>
                      <p className="text-[11px] text-[var(--primary)]/80">Bloom's Taxonomy Level: Analyzing</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[var(--primary)] bg-white px-2.5 py-1 rounded-md shadow-xs">
                    50 Questions
                  </span>
                </div>

                <div className="p-3.5 bg-[var(--surface-muted)] rounded-xl flex items-center justify-between border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] text-white flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">AI Proctoring Monitor</h4>
                      <p className="text-[11px] text-[var(--text-secondary)]">Face + Tab + Audio Active</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[var(--success)] bg-[var(--surface)] px-2.5 py-1 rounded-md border border-[var(--border-subtle)]">
                    99.8% Secure
                  </span>
                </div>

                <div className="p-3.5 bg-[var(--surface-muted)] rounded-xl flex items-center justify-between border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">Adaptive Learning Loop</h4>
                      <p className="text-[11px] text-[var(--text-secondary)]">Targeting: Dynamic Memory</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[var(--accent)] bg-[var(--surface)] px-2.5 py-1 rounded-md border border-[var(--border-subtle)]">
                    +18% Boost
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Stats Section */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div className="p-2">
            <h3 className="text-3xl font-extrabold text-[var(--primary)] font-mono">50K+</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-semibold">Active Students</p>
          </div>
          <div className="p-2">
            <h3 className="text-3xl font-extrabold text-[var(--primary)] font-mono">1,200+</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-semibold">Verified Instructors</p>
          </div>
          <div className="p-2">
            <h3 className="text-3xl font-extrabold text-[var(--primary)] font-mono">25K+</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-semibold">Exams Conducted</p>
          </div>
          <div className="p-2">
            <h3 className="text-3xl font-extrabold text-[var(--primary)] font-mono">98%</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-semibold">Institute Satisfaction</p>
          </div>
          <div className="p-2 col-span-2 md:col-span-1">
            <h3 className="text-3xl font-extrabold text-[var(--primary)] font-mono">99.9%</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-semibold">Integrity Verified</p>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeader 
          badge="Complete Core Platform"
          title="Everything You Need for Modern Assessments"
          subtitle="From AI question generation to live proctoring and adaptive learning loops, ExamForge equips educators and students with end-to-end intelligence."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={Sparkles}
            title="AI Question Generation"
            description="Generate high-quality MCQs, short answers, and essay prompts based on course documents using grounded RAG and Bloom's Taxonomy."
            badge="AI Powered"
          />
          <FeatureCard 
            icon={BookOpen}
            title="Question Bank & Blueprints"
            description="Organize questions by topic, difficulty level, and learning objectives with customizable exam blueprint templates."
          />
          <FeatureCard 
            icon={ShieldCheck}
            title="Secure Online Exams"
            description="Conduct exams with locked browser environments, anti-cheat detection, webcam proctoring, and automated session recording."
            badge="Anti-Cheat"
          />
          <FeatureCard 
            icon={BrainCircuit}
            title="AI Grading & Evaluation"
            description="Automate grading with detailed rubric scoring, instant AI feedback, and subjective response analysis."
          />
          <FeatureCard 
            icon={BarChart3}
            title="Analytics & Insights"
            description="Access granular student performance metrics, class score distribution, item difficulty index, and topic mastery levels."
          />
          <FeatureCard 
            icon={RefreshCw}
            title="Adaptive AI Preparation"
            description="Turn exam failures into progress. Generate target practice sets focused specifically on a student's weak concepts."
            badge="Adaptive"
          />
        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how-it-works" className="py-20 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader 
            badge="Streamlined Workflow"
            title="How ExamForge Works"
            subtitle="A seamless 4-step assessment lifecycle designed to save instructors hours while maximizing student learning outcomes."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StepCard 
              stepNumber="01"
              icon={FileText}
              title="Upload Course Material"
              description="Instructors upload lecture notes, textbook PDFs, or syllabi into the RAG knowledge vault."
            />
            <StepCard 
              stepNumber="02"
              icon={Sparkles}
              title="Generate Questions with AI"
              description="Set Bloom's difficulty levels, question formats, and generate verified questions instantly."
            />
            <StepCard 
              stepNumber="03"
              icon={Lock}
              title="Conduct Secure Exams"
              description="Students take high-stakes exams in a secure environment monitored by AI proctoring."
            />
            <StepCard 
              stepNumber="04"
              icon={TrendingUp}
              title="Analyze & Improve"
              description="Review performance analytics, identify weak areas, and generate adaptive practice assessments."
              isLast={true}
            />
          </div>
        </div>
      </section>

      {/* 6. AI Question Generation Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold border border-[var(--primary-border)]">
              <Cpu className="w-3.5 h-3.5" />
              <span>RAG-Grounded Intelligence</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] leading-tight">
              Create Flawless Question Banks in Minutes
            </h2>
            <p className="text-base text-[var(--text-secondary)] leading-relaxed">
              Stop spending hours manually writing questions. ExamForge uses Retrieval-Augmented Generation (RAG) to reference your actual syllabus documents, eliminating AI hallucinations and ensuring exact alignment with course goals.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Bloom's Taxonomy Control</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Filter questions from Remember & Understand up to Evaluate & Create.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Multi-Format Question Types</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Generate MCQs, True/False, Fill-in-the-blanks, and Short Answer Prompts.</p>
                </div>
              </div>
            </div>

            <Button variant="primary" size="md" icon={ArrowRight} onClick={() => navigate('/instructor/ai-studio')}>
              Try AI Question Studio
            </Button>
          </div>

          <div className="lg:col-span-6">
            <Card className="p-6 space-y-4 border-[var(--primary-border)] shadow-xl bg-[var(--surface)]">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <span className="text-xs font-bold text-[var(--primary)]">Generated Question Sample #042</span>
                <span className="text-[10px] font-bold bg-[var(--primary-light)] text-[var(--primary)] px-2 py-0.5 rounded">RAG Verified</span>
              </div>
              <p className="text-xs font-bold text-[var(--text-primary)] leading-normal">
                Q: Explain the primary difference between dynamic memory allocation in C using malloc() versus C++ using the new operator.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[var(--primary-light)] border border-[var(--primary-border)] font-medium text-[var(--primary)]">
                  ✓ Option A: new calls the constructor and returns a typed pointer, while malloc() allocates raw memory.
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--surface-muted)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  Option B: malloc() automatically recalculates memory sizes during runtime.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 7. Secure Exams & Proctoring Section */}
      <section className="py-20 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader 
            badge="Institutional Integrity"
            title="Secure Exams & AI Proctoring"
            subtitle="Protect academic credentials with enterprise-grade proctoring that prevents cheating while maintaining a smooth student experience."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Webcam & Motion Monitoring</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Detects multiple persons, absence from camera view, or looking away for extended durations.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Tab-Switch & Kiosk Lock</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Prevents students from opening secondary tabs, copy-pasting answers, or using external browser tools.
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Automated Integrity Index</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Flags anomalies with exact video timestamps so instructors can review flagged incidents instantly.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 8. AI Adaptive Preparation Section (KEY DIFFERENTIATOR) */}
      <section id="ai-prep" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeader 
          badge="Personalized Learning Loop"
          title="Don't Just See Your Score. Improve It."
          subtitle="ExamForge turns official exam results into actionable preparation plans. Students get AI-analyzed weak topic insights and tailored practice sets."
        />

        {/* Dashboard Visual Loop */}
        <Card className="p-8 border-[var(--primary-border)] shadow-xl bg-[var(--surface)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Steps Workflow Diagram */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Official Exam Submission</h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">Student finishes Exam & Result is published</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--primary-light)] border border-[var(--primary-border)] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--primary)]">AI Weak Topic Analysis</h4>
                  <p className="text-[11px] text-[var(--primary)]/80">Identifies: Dynamic Memory, Pointer Arithmetic</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Personalized Practice Set</h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">AI generates 15 targeted practice questions</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-subtle)] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--success)] text-white flex items-center justify-center text-xs font-bold">4</div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Improvement Tracking</h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">Score increases from 64% → 88% mastery</p>
                </div>
              </div>
            </div>

            {/* Visual Analytics Box */}
            <div className="lg:col-span-7 bg-[var(--background)] p-6 rounded-2xl border border-[var(--border)] space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">AI Preparation Diagnostic</h3>
                </div>
                <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary-light)] px-2.5 py-1 rounded-full">
                  Adaptive Active
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Dynamic Memory Allocation</span>
                    <span className="text-[var(--accent)] font-bold">45% (Needs Practice)</span>
                  </div>
                  <div className="w-full bg-[var(--surface-muted)] h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--accent)] h-full w-[45%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Pointer Arithmetic</span>
                    <span className="text-[var(--primary)] font-bold">82% (Proficient)</span>
                  </div>
                  <div className="w-full bg-[var(--surface-muted)] h-2 rounded-full overflow-hidden">
                    <div className="bg-[var(--primary)] h-full w-[82%]" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-secondary)] font-medium">Recommended: 15 min practice quiz</span>
                <Button size="sm" variant="primary" icon={ArrowRight} onClick={() => navigate('/student/ai-prep')}>
                  Start Practice Quiz
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* 9. Analytics Section */}
      <section id="analytics" className="py-20 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader 
            badge="Actionable Intelligence"
            title="Real-Time Analytics & Exam Insights"
            subtitle="Instructors and administrators get deep statistical insights into course performance, question discrimination index, and class distributions."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
                Score Distribution
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[var(--text-secondary)] font-medium">
                  <span>90-100% (A Grade)</span>
                  <span className="font-bold text-[var(--text-primary)]">38%</span>
                </div>
                <div className="w-full bg-[var(--surface-muted)] h-2 rounded-full"><div className="bg-[var(--primary)] h-full w-[38%]" /></div>

                <div className="flex justify-between text-xs text-[var(--text-secondary)] font-medium">
                  <span>75-89% (B Grade)</span>
                  <span className="font-bold text-[var(--text-primary)]">42%</span>
                </div>
                <div className="w-full bg-[var(--surface-muted)] h-2 rounded-full"><div className="bg-[var(--primary)] h-full w-[42%]" /></div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--accent)]" />
                Hardest Concepts
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[var(--surface-muted)] flex justify-between">
                  <span className="font-medium text-[var(--text-primary)]">Recursion Stack Depth</span>
                  <span className="text-[var(--accent)] font-bold">34% Pass</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--surface-muted)] flex justify-between">
                  <span className="font-medium text-[var(--text-primary)]">Graph Traversal (BFS/DFS)</span>
                  <span className="text-[var(--accent)] font-bold">48% Pass</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                AI Instructor Recommendations
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                "32% of students missed Q14 on Dynamic Memory. Recommend scheduling a 15-minute review session before Exam 2."
              </p>
              <Button variant="outline" size="sm" className="w-full justify-center">View Analytics Dashboard</Button>
            </Card>
          </div>
        </div>
      </section>

      {/* 10. Pricing Section */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeader 
          badge="Transparent Pricing"
          title="Simple Plans for Every Assessment Need"
          subtitle="Choose the tier that fits your course, department, or entire university."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 flex flex-col justify-between border-[var(--border)]">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Free Starter</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[var(--text-primary)] font-mono">$0</span>
                <span className="text-xs text-[var(--text-secondary)]">/ month</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Perfect for individual students and basic practice set generation.</p>
              <ul className="space-y-2 text-xs pt-4 border-t border-[var(--border-subtle)]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> 50 AI Practice Questions / mo</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Basic Study Diagnostics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Community Support</li>
              </ul>
            </div>
            <Button variant="outline" size="md" className="w-full justify-center mt-6" onClick={() => navigate('/register')}>Get Started</Button>
          </Card>

          <Card className="p-8 flex flex-col justify-between border-2 border-[var(--primary)] relative shadow-xl bg-[var(--surface)]">
            <div className="absolute -top-3.5 right-6 bg-[var(--primary)] text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Pro Instructor</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[var(--text-primary)] font-mono">$29</span>
                <span className="text-xs text-[var(--text-secondary)]">/ instructor / mo</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Full suite for instructors conducting midterms and final exams.</p>
              <ul className="space-y-2 text-xs pt-4 border-t border-[var(--border-subtle)]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Unlimited AI Question Studio</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Live AI Proctoring & Kiosk</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Advanced Class Analytics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> LMS Integration (Canvas / Moodle)</li>
              </ul>
            </div>
            <Button variant="primary" size="md" className="w-full justify-center mt-6" onClick={() => navigate('/register')}>Start 14-Day Free Trial</Button>
          </Card>

          <Card className="p-8 flex flex-col justify-between border-[var(--border)]">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Institution</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[var(--text-primary)] font-mono">Custom</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">For entire colleges, universities, and certification providers.</p>
              <ul className="space-y-2 text-xs pt-4 border-t border-[var(--border-subtle)]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Dedicated RAG Vault Instance</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> Custom SLA & Security Compliance</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--primary)]" /> SSO (SAMl / Okta / Azure)</li>
              </ul>
            </div>
            <Button variant="secondary" size="md" className="w-full justify-center mt-6" onClick={() => navigate('/login')}>Contact Sales</Button>
          </Card>
        </div>
      </section>

      {/* 11. Final CTA Section */}
      <CTASection 
        title="Build better assessments. Help students learn better."
        subtitle="Join thousands of educators and students using ExamForge for smarter, secure exams and adaptive AI study paths."
        primaryCtaText="Get Started Free"
        secondaryCtaText="Sign In to Platform"
        onPrimaryClick={() => navigate('/register')}
        onSecondaryClick={() => navigate('/login')}
      />

      {/* 12. Footer */}
      <Footer />
    </div>
  );
};
