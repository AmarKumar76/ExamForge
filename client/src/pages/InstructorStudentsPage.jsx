import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { examService } from '../services/examService';
import { RefreshCw, Users, AlertCircle, Search, Filter, BookOpen, Award, CheckCircle, TrendingUp, HelpCircle } from 'lucide-react';

export const InstructorStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPerfLoading, setIsPerfLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (typeof examService?.getInstructorStudents === 'function') {
        const res = await examService.getInstructorStudents();
        if (res?.success && res?.data) {
          setStudents(res.data);
        }
      } else {
        setError('Instructor student service function is unavailable. Please refresh your browser page.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load students.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter students by search query and course filter
  useEffect(() => {
    let result = [...students];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.rollNumber?.toLowerCase().includes(q)
      );
    }

    if (selectedCourse !== 'ALL') {
      result = result.filter((s) =>
        s.enrolledCourses?.some((c) => c._id === selectedCourse || c.code === selectedCourse)
      );
    }

    setFilteredStudents(result);
  }, [students, searchQuery, selectedCourse]);

  // Extract unique assigned courses for filter dropdown
  const uniqueCourses = React.useMemo(() => {
    const courseMap = new Map();
    students.forEach((s) => {
      s.enrolledCourses?.forEach((c) => {
        if (c._id && !courseMap.has(c._id)) {
          courseMap.set(c._id, c);
        }
      });
    });
    return Array.from(courseMap.values());
  }, [students]);

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    try {
      setIsPerfLoading(true);
      const res = await examService.getInstructorStudentPerformance(student._id);
      if (res.success && res.data) {
        setPerformance(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPerfLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Students">
        <div className="p-12 text-center max-w-md mx-auto space-y-4">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-secondary)]">Loading enrolled students...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Students">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Students</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Students enrolled in your assigned courses
            </p>
          </div>
          {selectedStudent && (
            <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>
              &larr; Back to Student List
            </Button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {!selectedStudent ? (
          <Card title="Enrolled Students">
            <div className="space-y-4">
              {/* Controls: Search & Course filter */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="Search by student name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="ALL">All Courses</option>
                    {uniqueCourses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Table or Empty State */}
              {filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-xs text-[var(--text-secondary)] bg-[var(--surface-muted)]/50 rounded-xl border border-dashed border-[var(--border)]">
                  <Users className="w-8 h-8 text-[var(--text-secondary)]/40 mx-auto mb-2" />
                  <p className="font-semibold text-sm text-[var(--text-primary)] mb-1">
                    No students are enrolled in your assigned courses yet.
                  </p>
                  <p>When students enroll in your courses, they will automatically appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Course(s)</th>
                        <th className="py-2.5 px-3 text-center">Exams Attempted</th>
                        <th className="py-2.5 px-3 text-center">Average Score</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {filteredStudents.map((s) => (
                        <tr key={s._id} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                          <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                            {s.name}
                            {s.rollNumber && (
                              <span className="block text-[10px] font-normal text-[var(--text-secondary)]">
                                Roll: {s.rollNumber}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[var(--text-secondary)]">{s.email}</td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {s.enrolledCourses?.map((c) => (
                                <Badge key={c._id || c.code} variant="neutral">
                                  {c.code}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-semibold">{s.attemptsCount || 0}</td>
                          <td className="py-3 px-3 text-center font-bold text-[var(--primary)]">
                            {s.averagePublishedScore ?? 0}%
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={s.status === 'ACTIVE' ? 'success' : 'neutral'}>
                              {s.status || 'Active'}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectStudent(s)}
                            >
                              View Profile
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        ) : (
          /* Student Detail Performance View */
          <div className="space-y-6">
            {/* Student Profile Overview Card */}
            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedStudent.name}</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {selectedStudent.email} {selectedStudent.rollNumber ? `• Roll No: ${selectedStudent.rollNumber}` : ''}
                  </p>
                  {selectedStudent.institutionName && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                      Institution: {selectedStudent.institutionName}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] mr-1">Enrolled Courses:</span>
                    {selectedStudent.enrolledCourses?.map((c) => (
                      <Badge key={c._id || c.code} variant="neutral">
                        {c.code} - {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 text-center">
                  <div className="bg-[var(--background)] px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] min-w-[90px]">
                    <span className="block text-xl font-black text-[var(--primary)]">
                      {performance?.summary?.averageScore ?? selectedStudent.averagePublishedScore ?? 0}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Avg Score</span>
                  </div>
                  <div className="bg-[var(--background)] px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] min-w-[90px]">
                    <span className="block text-xl font-black text-[var(--primary)]">
                      {performance?.summary?.passRate ?? selectedStudent.passRate ?? 0}%
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Pass Rate</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                <div>
                  <span className="block text-lg font-bold text-[var(--text-primary)]">
                    {performance?.summary?.attemptsCount ?? 0}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">Exams Attempted</span>
                </div>
              </div>
              <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="block text-lg font-bold text-[var(--text-primary)]">
                    {performance?.summary?.completedCount ?? 0}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">Exams Completed</span>
                </div>
              </div>
              <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] flex items-center gap-3">
                <Award className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="block text-lg font-bold text-[var(--text-primary)]">
                    {performance?.summary?.averageScore ?? 0}%
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">Average Score</span>
                </div>
              </div>
              <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <div>
                  <span className="block text-lg font-bold text-[var(--text-primary)]">
                    {performance?.summary?.passRate ?? 0}%
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">Pass Rate</span>
                </div>
              </div>
            </div>

            {/* Performance Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Exam History */}
              <div className="lg:col-span-2">
                <Card title="Exam History">
                  {isPerfLoading ? (
                    <div className="p-8 text-center text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[var(--primary)]" />
                    </div>
                  ) : !performance?.attempts || performance.attempts.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
                      No exam attempts found for this student.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                            <th className="py-2 px-3">Exam</th>
                            <th className="py-2 px-3">Course</th>
                            <th className="py-2 px-3">Attempt Date</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3 text-right">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {performance.attempts.map((att) => (
                            <tr key={att._id} className="hover:bg-[var(--surface-muted)]/50">
                              <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">
                                {att.examId?.title || 'Exam'}
                              </td>
                              <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                                {att.courseId?.code || att.courseId?.name || 'N/A'}
                              </td>
                              <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                                {new Date(att.submittedAt || att.startedAt).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 px-3">
                                <Badge variant={att.status === 'PUBLISHED' ? 'success' : 'warning'}>
                                  {att.status === 'PUBLISHED' ? 'Published' : att.status}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold">
                                {att.status === 'PUBLISHED' ? (
                                  <span className={att.passed ? 'text-[var(--primary)]' : 'text-red-500'}>
                                    {att.percentage}% ({att.score} pts)
                                  </span>
                                ) : (
                                  <span className="text-[var(--text-secondary)] italic">Hidden</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>

              {/* Performance Topics (Strong / Weak) */}
              <div className="space-y-6">
                <Card title="Performance Topics">
                  {isPerfLoading ? (
                    <div className="p-8 text-center text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[var(--primary)]" />
                    </div>
                  ) : (!performance?.topics?.strongTopics?.length && !performance?.topics?.weakTopics?.length) ? (
                    <div className="p-8 text-center text-xs text-[var(--text-secondary)] space-y-1">
                      <HelpCircle className="w-6 h-6 mx-auto text-[var(--text-secondary)]/40 mb-2" />
                      <p className="font-semibold text-sm text-[var(--text-primary)]">Not enough data</p>
                      <p>Insufficient published exam attempts to generate topic performance analysis.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {performance.topics.strongTopics?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wide">
                            Strong Topics (&ge;70%)
                          </h4>
                          <div className="space-y-1.5">
                            {performance.topics.strongTopics.map((t, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/10 text-xs border border-emerald-500/20"
                              >
                                <span className="font-medium text-[var(--text-primary)]">{t.topic}</span>
                                <span className="font-bold text-emerald-600">{t.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {performance.topics.weakTopics?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-red-500 mb-2 uppercase tracking-wide">
                            Needs Improvement (&lt;70%)
                          </h4>
                          <div className="space-y-1.5">
                            {performance.topics.weakTopics.map((t, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center p-2 rounded-lg bg-red-500/10 text-xs border border-red-500/20"
                              >
                                <span className="font-medium text-[var(--text-primary)]">{t.topic}</span>
                                <span className="font-bold text-red-500">{t.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
