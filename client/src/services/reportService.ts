import api from './api';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  department?: string;
  submittedBy?: string;
  owner?: string;
  currency?: string;
}

export interface ReportResponse {
  success: boolean;
  message: string;
  data: {
    filename: string;
    downloadUrl: string;
    fileSize: number;
    recordCount?: number;
    budgetCount?: number;
    expenseCount?: number;
  };
}

export interface ReportType {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  requiredRole: string;
}

class ReportService {
  // Generate expense report
  async generateExpenseReport(filters: ReportFilters): Promise<ReportResponse> {
    const response = await api.post('/reports/expenses', filters);
    return response.data;
  }

  // Generate budget report
  async generateBudgetReport(filters: ReportFilters): Promise<ReportResponse> {
    const response = await api.post('/reports/budgets', filters);
    return response.data;
  }

  // Generate financial report
  async generateFinancialReport(filters: ReportFilters): Promise<ReportResponse> {
    const response = await api.post('/reports/financial', filters);
    return response.data;
  }

  // Download report file
  async downloadReport(filename: string): Promise<Blob> {
    const response = await api.get(`/reports/download/${filename}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Get available report types
  async getReportTypes(): Promise<{ success: boolean; data: ReportType[] }> {
    const response = await api.get('/reports/types');
    return response.data;
  }

  // Helper method to download and save report
  async downloadAndSaveReport(filename: string, originalFilename?: string): Promise<void> {
    try {
      const blob = await this.downloadReport(filename);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalFilename || filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  // Generate and download expense report in one step
  async generateAndDownloadExpenseReport(filters: ReportFilters): Promise<void> {
    const report = await this.generateExpenseReport(filters);
    const filename = `expense-report-${new Date().toISOString().split('T')[0]}.pdf`;
    await this.downloadAndSaveReport(report.data.filename, filename);
  }

  // Generate and download budget report in one step
  async generateAndDownloadBudgetReport(filters: ReportFilters): Promise<void> {
    const report = await this.generateBudgetReport(filters);
    const filename = `budget-report-${new Date().toISOString().split('T')[0]}.pdf`;
    await this.downloadAndSaveReport(report.data.filename, filename);
  }

  // Generate and download financial report in one step
  async generateAndDownloadFinancialReport(filters: ReportFilters): Promise<void> {
    const report = await this.generateFinancialReport(filters);
    const filename = `financial-report-${new Date().toISOString().split('T')[0]}.pdf`;
    await this.downloadAndSaveReport(report.data.filename, filename);
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validate report filters
  validateFilters(filters: ReportFilters): string[] {
    const errors: string[] = [];

    // Check date range
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      if (startDate > endDate) {
        errors.push('Start date must be before end date');
      }
      
      if (startDate > new Date()) {
        errors.push('Start date cannot be in the future');
      }
    }

    return errors;
  }

  // Get common filter presets
  getFilterPresets() {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const currentYear = new Date(now.getFullYear(), 0, 1);
    const lastYear = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

    return {
      thisMonth: {
        name: 'This Month',
        startDate: currentMonth.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      },
      lastMonth: {
        name: 'Last Month',
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: lastMonthEnd.toISOString().split('T')[0]
      },
      thisYear: {
        name: 'This Year',
        startDate: currentYear.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      },
      lastYear: {
        name: 'Last Year',
        startDate: lastYear.toISOString().split('T')[0],
        endDate: lastYearEnd.toISOString().split('T')[0]
      },
      last30Days: {
        name: 'Last 30 Days',
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      },
      last90Days: {
        name: 'Last 90 Days',
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      }
    };
  }
}

export default new ReportService();