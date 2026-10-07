import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { examService } from '../services/examService';
import { FileText, Download, RefreshCw, Filter, AlertCircle, Table } from 'lucide-react';

export const InstructorReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [reportType, setReportType] = useState('STUDENT_PERFORMANCE');

  useEffect(() => {
    fetchReport();
  }, [selectedCourse, selectedExam, reportType]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await examService.getInstructorReports({
        courseId: selectedCourse,
        examId: selectedExam,
        reportType,
      });

      if (res.success && res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load report data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.rows || reportData.rows.length === 0) return;

    const headers = reportData.columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');
    const csvRows = reportData.rows.map((row) =>
      reportData.columns
        .map((col) => {
          const val = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `ExamForge_${reportData.reportType}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportTypeLabels = {
    STUDENT_PERFORMANCE: 'Student Performance Report',
    EXAM_PERFORMANCE: 'Exam Performance Report',
    QUESTION_ANALYSIS: 'Question Analysis Report',
    COURSE_PERFORMANCE: 'Course Performance Report',
  };

  return (
    <AppShell title="Reports">
      <div className="space-y-6 pb-12">
        {/* Page Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports & Exports</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Generate and download academic performance and item analysis reports
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleExportCSV}
              disabled={!reportData?.rows || reportData.rows.length === 0}
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-xs font-bold text-[var(--text-primary)]">Report Parameters:</span>
          </div>

          {/* Report Type Selector */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
            >
              <option value="STUDENT_PERFORMANCE">Student Performance Report</option>
              <option value="EXAM_PERFORMANCE">Exam Performance Report</option>
              <option value="QUESTION_ANALYSIS">Question Analysis Report</option>
              <option value="COURSE_PERFORMANCE">Course Performance Report</option>
            </select>
          </div>

          {/* Course Selector */}
          <div className="w-full sm:w-56">
            <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedExam('');
              }}
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="">All Courses</option>
              {reportData?.courses?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Selector */}
          <div className="w-full sm:w-56">
            <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">
              Exam
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="">All Exams</option>
              {reportData?.exams?.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Report Preview */}
        <Card title={reportTypeLabels[reportType] || 'Report Preview'}>
          {isLoading ? (
            <div className="p-12 text-center text-xs space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--primary)]" />
              <p className="text-[var(--text-secondary)]">Generating report from real database records...</p>
            </div>
          ) : !reportData?.rows || reportData.rows.length === 0 ? (
            /* Empty state requirement */
            <div className="p-12 text-center text-xs text-[var(--text-secondary)] space-y-2">
              <Table className="w-10 h-10 text-[var(--text-secondary)]/30 mx-auto mb-2" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                No report data available for the selected course/exam.
              </h3>
              <p className="max-w-md mx-auto">
                No published attempts or evaluation records were found matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] border-b border-[var(--border)] pb-2">
                <span>
                  Showing <strong className="text-[var(--text-primary)]">{reportData.rows.length}</strong> record(s)
                </span>
                <span>Generated at: {new Date().toLocaleString()}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] bg-[var(--surface-muted)]/50">
                      {reportData.columns.map((col) => (
                        <th key={col.key} className="py-2.5 px-3 font-semibold">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {reportData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                        {reportData.columns.map((col) => (
                          <td key={col.key} className="py-2.5 px-3">
                            {row[col.key] !== undefined && row[col.key] !== null ? (
                              String(row[col.key]).endsWith('%') ? (
                                <span className="font-bold text-[var(--primary)]">{row[col.key]}</span>
                              ) : (
                                String(row[col.key])
                              )
                            ) : (
                              '—'
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
};
