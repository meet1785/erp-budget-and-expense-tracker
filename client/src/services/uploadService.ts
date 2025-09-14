import api from './api';

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    url: string;
    uploadDate: string;
    fileInfo?: any;
  };
}

export interface MultipleUploadResponse {
  success: boolean;
  message: string;
  data: {
    files: UploadResponse['data'][];
    count: number;
  };
}

export interface UploadConfig {
  maxFileSize: number;
  maxFileSizeFormatted: string;
  allowedFileTypes: string[];
  maxFilesPerUpload: number;
  uploadPath: string;
}

class UploadService {
  // Upload single receipt
  async uploadReceipt(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await api.post('/uploads/receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Upload multiple receipts
  async uploadMultipleReceipts(files: File[]): Promise<MultipleUploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('receipts', file);
    });

    const response = await api.post('/uploads/receipts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Add receipt to existing expense
  async addReceiptToExpense(expenseId: string, file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await api.post(`/uploads/expense/${expenseId}/receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Remove receipt from expense
  async removeReceiptFromExpense(expenseId: string, receiptId: string) {
    const response = await api.delete(`/uploads/expense/${expenseId}/receipt/${receiptId}`);
    return response.data;
  }

  // Get file information
  async getFileInfo(filename: string) {
    const response = await api.get(`/uploads/info/${filename}`);
    return response.data;
  }

  // Delete uploaded file
  async deleteFile(filename: string) {
    const response = await api.delete(`/uploads/file/${filename}`);
    return response.data;
  }

  // Get upload statistics
  async getUploadStats() {
    const response = await api.get('/uploads/stats');
    return response.data;
  }

  // Get upload configuration
  async getUploadConfig(): Promise<{ success: boolean; data: UploadConfig }> {
    const response = await api.get('/uploads/config');
    return response.data;
  }

  // Validate file before upload
  validateFile(file: File, config: UploadConfig): string[] {
    const errors: string[] = [];

    // Check file size
    if (file.size > config.maxFileSize) {
      errors.push(`File size too large. Maximum size: ${config.maxFileSizeFormatted}`);
    }

    // Check file type
    if (!config.allowedFileTypes.includes(file.type)) {
      errors.push(`File type not allowed. Allowed types: ${config.allowedFileTypes.join(', ')}`);
    }

    return errors;
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new UploadService();