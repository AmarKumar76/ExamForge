import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { examService } from '../services/examService';
import {
  Users,
  CheckCircle2,
  Award,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Filter,
  AlertCircle,
  HelpCircle,
  Layers,
  FileText
} from 'lucide-react';

export const InstructorExamAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [dateRange, setDateRange] = useState('ALL');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedCourse, selectedExam, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let startDate = '';
      const now = new Date();
      if (dateRange === '7d') {
        const d = new Date(now.setDate(now.getDate() - 7));
        startDate = d.toISOString();
      } else if (dateRange === '30d') {
        const d = new Date(now.setDate(now.getDate() - 30));
        startDate = d.toISOString();
      } else if (dateRange === '90d') {
        const d = new Date(now.setDate(now.getDate() - 90));
        startDate = d.toISOString();
      }

      const res = await examService.getInstructorAnalyticsDetails({
        courseId: selectedCourse,
        examId: selectedExam,
        startDate,
      });

      if (res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  const summary = analytics?.summary || {
    totalStudents: 0,
    submittedCount: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    passRate: 0,
  };

  const hasData = summary.submittedCount > 0;

  // Filter available exams dynamically based on selected course
  const availableExams = React.useMemo(() => {
    if (!analytics?.exams) return [];
    if (!selectedCourse) return analytics.exams;
    return analytics.exams.filter((e) => e.courseId === selectedCourse);
  }, [analytics?.exams, selectedCourse]);

  // Handle Course dropdown change with automatic exam reset
  const handleCourseChange = (newCourseId) => {
    setSelectedCourse(newCourseId);
    if (newCourseId) {
      const validExams = analytics?.exams?.filter((e) => e.courseId === newCourseId) || [];
      const isValidExam = validExams.some((e) => e._id === selectedExam);
      if (!isValidExam) {
        setSelectedExam('');
      }
    } else {
      const isValidExam = analytics?.exams?.some((e) => e._id === selectedExam);
      if (!isValidExam) {
        setSelectedExam('');
      }
    }
  };

  if (isLoading && !analytics) {
    return (
      <AppShell title="Analytics">
        <div className="p-12 text-center max-w-md mx-auto space-y-4">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-secondary)]">Calculating analytics from database...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Analytics">
      <div className="space-y-6 pb-12">
        {/* Header and Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Exam Analytics</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Performance metrics and student insights from actual exam attempts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Course Filter */}
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
            >
              <option value="">All Courses</option>
              {analytics?.courses?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>

            {/* Exam Filter */}
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
            >
              <option value="">All Exams</option>
              {selectedCourse && availableExams.length === 0 ? (
                <option value="" disabled>
                  No exams available for this course
                </option>
              ) : (
                availableExams.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.title}
                  </option>
                ))
              )}
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
            >
              <option value="ALL">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* 6 Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard title="Total Students" value={summary.totalStudents} icon={Users} />
          <StatCard title="Submitted" value={summary.submittedCount} icon={CheckCircle2} />
          <StatCard title="Average Score" value={`${summary.averageScore}%`} icon={Award} />
          <StatCard title="Highest Score" value={`${summary.highestScore}%`} icon={TrendingUp} />
          <StatCard title="Lowest Score" value={`${summary.lowestScore}%`} icon={BarChart3} />
          <StatCard title="Pass Rate" value={`${summary.passRate}%`} icon={CheckCircle2} />
        </div>

        {!hasData ? (
          /* Empty State */
          <Card title="Analytics Overview">
            <div className="p-12 text-center text-xs text-[var(--text-secondary)] space-y-2">
              <BarChart3 className="w-10 h-10 text-[var(--text-secondary)]/30 mx-auto mb-2" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                No published exam data available yet.
              </h3>
              <p className="max-w-md mx-auto">
                Once students submit exams and their results are evaluated or published, comprehensive performance metrics, score distributions, and question statistics will appear here.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Row 1: Score Distribution & Difficulty Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Score Distribution */}
              <div className="lg:col-span-7">
                <Card title="Score Distribution (0–100%)">
                  <div className="space-y-4 pt-2">
                    <div className="h-44 flex items-end justify-between gap-3 pt-6 px-4">
                      {analytics?.scoreDistribution?.map((bar, i) => {
                        const maxCount = Math.max(...(analytics.scoreDistribution.map(b => b.count) || [1]), 1);
                        const heightPct = Math.max((bar.count / maxCount) * 100, 4);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                            {/* Hover tooltip */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[var(--surface-dark,black)] text-white text-[10px] px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap z-10">
                              {bar.count} student(s) ({bar.percentage}%)
                            </div>
                            <span className="text-[10px] font-bold text-[var(--text-primary)]">{bar.count}</span>
                            <div
                              className="w-full bg-[var(--primary)] rounded-t-md transition-all duration-500"
                              style={{ height: `${heightPct}%` }}
                            />
                            <span className="text-[10px] font-medium text-[var(--text-secondary)]">{bar.range}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Difficulty Analysis */}
              <div className="lg:col-span-5">
                <Card title="Difficulty Analysis">
                  <div className="space-y-4 py-2">
                    {analytics?.difficultyAnalysis?.map((d) => (
                      <div key={d.difficulty} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-[var(--text-primary)]">{d.difficulty} Difficulty</span>
                          <span className="text-[var(--primary)]">{d.correctPct}% Correct ({d.totalQuestions} Qs)</span>
                        </div>
                        <div className="w-full h-2.5 bg-[var(--surface-muted)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              d.difficulty === 'Easy'
                                ? 'bg-emerald-500'
                                : d.difficulty === 'Medium'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${d.correctPct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Row 2: Question Analysis */}
            <Card title="Question Performance Analysis">
              {!analytics?.questionAnalysis || analytics.questionAnalysis.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                  No question-level response data available.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                        <th className="py-2.5 px-3">Question</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Difficulty</th>
                        <th className="py-2.5 px-3 text-center">Correct %</th>
                        <th className="py-2.5 px-3 text-right">Avg Response Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {analytics.questionAnalysis.map((q, idx) => (
                        <tr key={q.id || idx} className="hover:bg-[var(--surface-muted)]/50">
                          <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)] max-w-xs truncate">
                            {q.questionText}
                          </td>
                          <td className="py-2.5 px-3 text-[var(--text-secondary)]">{q.type}</td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={
                                q.difficulty === 'EASY'
                                  ? 'success'
                                  : q.difficulty === 'HARD'
                                  ? 'danger'
                                  : 'warning'
                              }
                            >
                              {q.difficulty}
                            </Badge>
                          </td>
                          <td
                            className={`py-2.5 px-3 text-center font-bold ${
                              q.correctPct < 50 ? 'text-red-500' : 'text-emerald-600'
                            }`}
                          >
                            {q.correctPct}%
                          </td>
                          <td className="py-2.5 px-3 text-right text-[var(--text-secondary)]">{q.avgTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Row 3: Topic / Unit Performance & Exam Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Topic / Unit Performance */}
              <Card title="Topic / Unit Performance">
                {!analytics?.topicPerformance || analytics.topicPerformance.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                    No topic-level data recorded for questions yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.topicPerformance.map((tp, idx) => (
                      <div
                        key={idx}
                        className="p-3 border border-[var(--border)] rounded-xl bg-[var(--background)] flex justify-between items-center text-xs"
                      >
                        <div>
                          <h4 className="font-bold text-[var(--text-primary)]">{tp.topic}</h4>
                          <span className="text-[10px] text-[var(--text-secondary)]">
                            {tp.questionsCount} question(s) evaluated
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-[var(--primary)]">{tp.correctPct}% Correct</span>
                          <span className="text-[10px] text-[var(--text-secondary)]">
                            Avg Score: {tp.avgScore}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Exam Performance Breakdown */}
              <Card title="Exam Performance Breakdown">
                {!analytics?.examPerformance || analytics.examPerformance.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                    No exam metrics recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                          <th className="py-2 px-2">Exam</th>
                          <th className="py-2 px-2 text-center">Attempts</th>
                          <th className="py-2 px-2 text-center">Avg</th>
                          <th className="py-2 px-2 text-right">Pass Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {analytics.examPerformance.map((ep) => (
                          <tr key={ep.examId} className="hover:bg-[var(--surface-muted)]/50">
                            <td className="py-2 px-2 font-semibold text-[var(--text-primary)]">
                              {ep.title}
                              <span className="block text-[10px] font-normal text-[var(--text-secondary)]">
                                {ep.courseCode}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center">{ep.attemptsCount}</td>
                            <td className="py-2 px-2 text-center font-bold text-[var(--primary)]">
                              {ep.averageScore}%
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-emerald-600">
                              {ep.passRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
