const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || 'uploads/receipts';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// File filter function
const fileFilter = (req, file, cb) => {
  // Get allowed file types from env or use defaults
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename using crypto for better compatibility
    const crypto = require('crypto');
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${cleanBaseName}-${uniqueSuffix}${extension}`);
  }
});

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 5 // Maximum 5 files per request
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'receipt') => {
  return upload.single(fieldName);
};

// Middleware for multiple file uploads
const uploadMultiple = (fieldName = 'receipts', maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Helper function to get file URL
const getFileUrl = (filename) => {
  if (!filename) return null;
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/uploads/receipts/${filename}`;
};

// Helper function to delete file
const deleteFile = (filename) => {
  try {
    if (filename) {
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File deleted: ${filename}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Helper function to validate file
const validateFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return errors;
  }
  
  // Check file size
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File size too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
  }
  
  // Check file type
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(',');
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  return errors;
};

// File type detection helper
const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const documentExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  
  if (imageExtensions.includes(ext)) return 'image';
  if (documentExtensions.includes(ext)) return 'document';
  return 'other';
};

// Get file info
const getFileInfo = (filename) => {
  try {
    if (!filename) return null;
    
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) return null;
    
    const stats = fs.statSync(filePath);
    const extension = path.extname(filename);
    
    return {
      filename,
      originalName: filename,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      type: getFileType(filename),
      extension: extension,
      uploadDate: stats.birthtime,
      url: getFileUrl(filename)
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};

// Format file size helper
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  getFileUrl,
  deleteFile,
  validateFile,
  getFileType,
  getFileInfo,
  formatFileSize
};