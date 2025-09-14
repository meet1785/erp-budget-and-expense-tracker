const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadSingle, uploadMultiple, getFileInfo, deleteFile } = require('../utils/fileUpload');
const Expense = require('../models/Expense');
const path = require('path');
const fs = require('fs');

// @desc    Upload single receipt file
// @route   POST /api/uploads/receipt
// @access  Private
router.post('/receipt', protect, (req, res) => {
  uploadSingle('receipt')(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'File upload failed',
          error: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      const fileInfo = getFileInfo(req.file.filename);

      res.json({
        success: true,
        message: 'Receipt uploaded successfully',
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: `/uploads/receipts/${req.file.filename}`,
          uploadDate: new Date(),
          fileInfo
        }
      });
    } catch (error) {
      console.error('Error in receipt upload:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process uploaded file',
        error: error.message
      });
    }
  });
});

// @desc    Upload multiple receipt files
// @route   POST /api/uploads/receipts
// @access  Private
router.post('/receipts', protect, (req, res) => {
  uploadMultiple('receipts', 5)(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'File upload failed',
          error: err.message
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/receipts/${file.filename}`,
        uploadDate: new Date(),
        fileInfo: getFileInfo(file.filename)
      }));

      res.json({
        success: true,
        message: `${uploadedFiles.length} receipt(s) uploaded successfully`,
        data: {
          files: uploadedFiles,
          count: uploadedFiles.length
        }
      });
    } catch (error) {
      console.error('Error in multiple receipts upload:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process uploaded files',
        error: error.message
      });
    }
  });
});

// @desc    Add receipt to existing expense
// @route   POST /api/uploads/expense/:expenseId/receipt
// @access  Private
router.post('/expense/:expenseId/receipt', protect, (req, res) => {
  uploadSingle('receipt')(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'File upload failed',
          error: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      const expense = await Expense.findById(req.params.expenseId);
      if (!expense) {
        // Clean up uploaded file if expense not found
        deleteFile(req.file.filename);
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      // Check if user owns the expense or is admin/manager
      if (expense.submittedBy.toString() !== req.user._id.toString() && 
          !['admin', 'manager'].includes(req.user.role)) {
        deleteFile(req.file.filename);
        return res.status(403).json({
          success: false,
          message: 'Not authorized to upload receipt for this expense'
        });
      }

      // Add receipt to expense
      const receiptData = {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileUrl: `/uploads/receipts/${req.file.filename}`,
        fileSize: req.file.size,
        fileType: req.file.mimetype.startsWith('image/') ? 'image' : 'document',
        uploadDate: new Date()
      };

      expense.addReceipt(receiptData);
      expense.addAuditLog('updated', req.user._id, { action: 'receipt_added', fileName: req.file.filename });
      
      await expense.save();

      res.json({
        success: true,
        message: 'Receipt added to expense successfully',
        data: {
          expenseId: expense._id,
          receipt: receiptData,
          totalReceipts: expense.receipts.length
        }
      });
    } catch (error) {
      console.error('Error adding receipt to expense:', error);
      // Clean up uploaded file on error
      if (req.file) {
        deleteFile(req.file.filename);
      }
      res.status(500).json({
        success: false,
        message: 'Failed to add receipt to expense',
        error: error.message
      });
    }
  });
});

// @desc    Remove receipt from expense
// @route   DELETE /api/uploads/expense/:expenseId/receipt/:receiptId
// @access  Private
router.delete('/expense/:expenseId/receipt/:receiptId', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user owns the expense or is admin/manager
    if (expense.submittedBy.toString() !== req.user._id.toString() && 
        !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove receipt from this expense'
      });
    }

    const receipt = expense.receipts.id(req.params.receiptId);
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    // Delete the physical file
    const filename = path.basename(receipt.fileUrl);
    deleteFile(filename);

    // Remove receipt from expense
    expense.removeReceipt(req.params.receiptId);
    expense.addAuditLog('updated', req.user._id, { action: 'receipt_removed', fileName: filename });
    
    await expense.save();

    res.json({
      success: true,
      message: 'Receipt removed from expense successfully',
      data: {
        expenseId: expense._id,
        removedReceiptId: req.params.receiptId,
        remainingReceipts: expense.receipts.length
      }
    });
  } catch (error) {
    console.error('Error removing receipt from expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove receipt from expense',
      error: error.message
    });
  }
});

// @desc    Get file information
// @route   GET /api/uploads/info/:filename
// @access  Private
router.get('/info/:filename', protect, (req, res) => {
  try {
    const filename = req.params.filename;
    const fileInfo = getFileInfo(filename);

    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      message: 'File information retrieved successfully',
      data: fileInfo
    });
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get file information',
      error: error.message
    });
  }
});

// @desc    Delete uploaded file
// @route   DELETE /api/uploads/file/:filename
// @access  Private
router.delete('/file/:filename', protect, async (req, res) => {
  try {
    const filename = req.params.filename;

    // Check if file is associated with any expense
    const expense = await Expense.findOne({
      $or: [
        { 'receipts.fileName': filename },
        { 'receipt.fileName': filename }
      ]
    });

    if (expense) {
      // Check if user owns the expense or is admin/manager
      if (expense.submittedBy.toString() !== req.user._id.toString() && 
          !['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this file'
        });
      }
    }

    const deleted = deleteFile(filename);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'File not found or already deleted'
      });
    }

    res.json({
      success: true,
      message: 'File deleted successfully',
      data: {
        filename,
        deletedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
});

// @desc    Get upload statistics
// @route   GET /api/uploads/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const uploadDir = process.env.UPLOAD_PATH || 'uploads/receipts';
    
    if (!fs.existsSync(uploadDir)) {
      return res.json({
        success: true,
        message: 'Upload statistics retrieved successfully',
        data: {
          totalFiles: 0,
          totalSize: 0,
          totalSizeFormatted: '0 Bytes',
          averageFileSize: 0,
          fileTypes: {}
        }
      });
    }

    const files = fs.readdirSync(uploadDir);
    let totalSize = 0;
    const fileTypes = {};

    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      const stats = fs.statSync(filePath);
      const ext = path.extname(file).toLowerCase();
      
      totalSize += stats.size;
      fileTypes[ext] = (fileTypes[ext] || 0) + 1;
    });

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    res.json({
      success: true,
      message: 'Upload statistics retrieved successfully',
      data: {
        totalFiles: files.length,
        totalSize,
        totalSizeFormatted: formatFileSize(totalSize),
        averageFileSize: files.length > 0 ? Math.round(totalSize / files.length) : 0,
        fileTypes,
        uploadPath: uploadDir
      }
    });
  } catch (error) {
    console.error('Error getting upload statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upload statistics',
      error: error.message
    });
  }
});

// @desc    Get upload configuration
// @route   GET /api/uploads/config
// @access  Private
router.get('/config', protect, (req, res) => {
  try {
    const config = {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
      maxFileSizeFormatted: ((parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024) / 1024 / 1024).toFixed(1) + ' MB',
      allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
      maxFilesPerUpload: 5,
      uploadPath: process.env.UPLOAD_PATH || 'uploads/receipts'
    };

    res.json({
      success: true,
      message: 'Upload configuration retrieved successfully',
      data: config
    });
  } catch (error) {
    console.error('Error getting upload configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upload configuration',
      error: error.message
    });
  }
});

module.exports = router;