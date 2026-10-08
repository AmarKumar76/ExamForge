import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { reportService } from '../services/reportService';
import { FileText, Download, RefreshCw, Filter, AlertCircle, Table, FileSpreadsheet, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

export const InstructorReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Filter States
  const [reportType, setReportType] = useState('EXAM_RESULT');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedCourse, selectedExam]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await reportService.getReports({
        reportType,
        courseId: selectedCourse,
        examId: selectedExam,
        studentId: selectedStudent,
        fromDate,
        toDate,
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

  const handleExport = async (format) => {
    try {
      setIsExporting(true);
      await reportService.exportReport(
        {
          reportType,
          courseId: selectedCourse,
          examId: selectedExam,
          studentId: selectedStudent,
          fromDate,
          toDate,
        },
        format
      );
    } catch (err) {
      setError(err.message || 'Unable to generate the report export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const reportTypeLabels = {
    EXAM_RESULT: 'Exam Result Report',
    STUDENT_PERFORMANCE: 'Student Performance Report',
    QUESTION_ANALYSIS: 'Question Analysis Report',
    COURSE_PERFORMANCE: 'Course Performance Report',
    ACADEMIC_INTEGRITY: 'Academic Integrity Report',
  };

  const hasData = reportData?.rows && reportData.rows.length > 0;

  return (
    <AppShell title="Reports">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Generate and export examination, performance and academic integrity reports.
            </p>
          </div>

          {/* Export Options (Shown only when report data is available) */}
          {hasData && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={FileText}
                onClick={() => handleExport('csv')}
                disabled={isExporting}
              >
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={FileSpreadsheet}
                onClick={() => handleExport('xlsx')}
                disabled={isExporting}
              >
                Excel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
              >
                PDF
              </Button>
            </div>
          )}
        </div>

        {/* Filters Bar */}
        <div className="bg-[var(--surface)] p-5 rounded-xl border border-[var(--border)] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-xs font-bold text-[var(--text-primary)]">Report Parameters</span>
            </div>
            <Button variant="secondary" size="xs" icon={RefreshCw} onClick={fetchReport} disabled={isLoading}>
              Generate Report
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Report Type */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value);
                  setReportData(null);
                }}
                className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="EXAM_RESULT">Exam Result Report</option>
                <option value="STUDENT_PERFORMANCE">Student Performance Report</option>
                <option value="QUESTION_ANALYSIS">Question Analysis Report</option>
                <option value="COURSE_PERFORMANCE">Course Performance Report</option>
                <option value="ACADEMIC_INTEGRITY">Academic Integrity Report</option>
              </select>
            </div>

            {/* Course Selector */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">
                Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedExam('');
                  setSelectedStudent('');
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
            <div>
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

            {/* Student (Optional) */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">
                Student (Optional)
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="">All Students</option>
                {reportData?.students?.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.rollNumber || s.email})
                  </option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[var(--border)] rounded-lg text-xs bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Report Summary Metric Cards */}
        {hasData && reportData.summary && Object.keys(reportData.summary).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(reportData.summary).map(([key, val]) => (
              <div
                key={key}
                className="bg-[var(--surface)] p-3.5 rounded-xl border border-[var(--border)] shadow-xs"
              >
                <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-base font-extrabold text-[var(--text-primary)] mt-1">
                  {String(val)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Report Table Preview */}
        <Card title={reportTypeLabels[reportType] || 'Report Preview'}>
          {isLoading ? (
            <div className="p-12 text-center text-xs space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--primary)]" />
              <p className="text-[var(--text-secondary)] font-medium">Generating report from real database records...</p>
            </div>
          ) : !hasData ? (
            <div className="p-12 text-center text-xs text-[var(--text-secondary)] space-y-2">
              <Table className="w-10 h-10 text-[var(--text-secondary)]/30 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                No result data available for this selection.
              </h3>
              <p className="max-w-md mx-auto">
                No attempt, examination or integrity records were found matching the selected parameters. Try selecting a different course or exam filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] border-b border-[var(--border)] pb-2">
                <span>
                  Showing <strong className="text-[var(--text-primary)]">{reportData.rows.length}</strong> record(s)
                </span>
                <span>Generated at: {new Date(reportData.generatedAt || Date.now()).toLocaleString()}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-secondary)] bg-[var(--surface-muted)]/50">
                      {reportData.columns.map((col) => (
                        <th key={col.key} className="py-2.5 px-3 font-bold whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {reportData.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[var(--surface-muted)]/50 transition-colors">
                        {reportData.columns.map((col) => {
                          const val = row[col.key];

                          // Custom badge formatting for status & risk levels
                          if (col.key === 'status') {
                            return (
                              <td key={col.key} className="py-2.5 px-3 whitespace-nowrap">
                                <Badge variant={val === 'PASS' ? 'success' : 'danger'}>
                                  {val}
                                </Badge>
                              </td>
                            );
                          }

                          if (col.key === 'riskLevel') {
                            const isHigh = val === 'High Risk';
                            const isMed = val === 'Medium Risk';
                            return (
                              <td key={col.key} className="py-2.5 px-3 whitespace-nowrap">
                                <Badge variant={isHigh ? 'danger' : isMed ? 'warning' : 'success'}>
                                  {val}
                                </Badge>
                              </td>
                            );
                          }

                          return (
                            <td key={col.key} className="py-2.5 px-3 whitespace-nowrap">
                              {val !== undefined && val !== null ? (
                                String(val).endsWith('%') ? (
                                  <span className="font-bold text-[var(--primary)]">{val}</span>
                                ) : (
                                  String(val)
                                )
                              ) : (
                                '—'
                              )}
                            </td>
                          );
                        })}
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
