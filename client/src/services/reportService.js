import { api } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const reportService = {
  /**
   * Fetch report data with filters (courseId, examId, studentId, reportType, fromDate, toDate)
   */
  async getReports(filters = {}) {
    const params = new URLSearchParams();
    if (filters.reportType || filters.type) params.append('reportType', filters.reportType || filters.type);
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.examId) params.append('examId', filters.examId);
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await api.get(`/reports${queryString}`);
  },

  /**
   * Get direct download URL for exporting reports (CSV, XLSX, PDF)
   */
  getExportUrl(filters = {}, format = 'csv') {
    const params = new URLSearchParams();
    if (filters.reportType || filters.type) params.append('reportType', filters.reportType || filters.type);
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.examId) params.append('examId', filters.examId);
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    params.append('format', format);

    return `${API_BASE_URL}/reports/export?${params.toString()}`;
  },

  /**
   * Trigger backend download for exported report file
   */
  async exportReport(filters = {}, format = 'csv') {
    const token = localStorage.getItem('examforge_token') || localStorage.getItem('token');
    const params = new URLSearchParams();
    if (filters.reportType || filters.type) params.append('reportType', filters.reportType || filters.type);
    if (filters.courseId) params.append('courseId', filters.courseId);
    if (filters.examId) params.append('examId', filters.examId);
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    params.append('format', format);

    const url = `${API_BASE_URL}/reports/export?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export report.');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const ext = format === 'pdf' ? 'pdf' : format === 'xlsx' || format === 'excel' ? 'xls' : 'csv';
    a.download = `ExamForge_Report_${filters.reportType || 'EXPORT'}_${new Date().toISOString().split('T')[0]}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};
