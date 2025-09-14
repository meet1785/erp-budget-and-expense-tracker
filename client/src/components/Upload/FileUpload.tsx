import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CloudUpload,
  AttachFile,
  Delete,
  Visibility,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import uploadService, { UploadConfig } from '../../services/uploadService';
import toast from 'react-hot-toast';

interface FileUploadProps {
  multiple?: boolean;
  onUploadComplete?: (files: any[]) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  existingFiles?: any[];
  expenseId?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  result?: any;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  multiple = false,
  onUploadComplete,
  onUploadError,
  disabled = false,
  existingFiles = [],
  expenseId
}) => {
  const [uploadConfig, setUploadConfig] = useState<UploadConfig | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load upload configuration on component mount
  React.useEffect(() => {
    loadUploadConfig();
  }, []);

  const loadUploadConfig = async () => {
    try {
      const response = await uploadService.getUploadConfig();
      setUploadConfig(response.data);
    } catch (error) {
      console.error('Failed to load upload configuration:', error);
      toast.error('Failed to load upload configuration');
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !uploadConfig) return;
    
    const fileArray = Array.from(files);
    uploadFiles(fileArray);
  };

  const uploadFiles = async (files: File[]) => {
    if (!uploadConfig) {
      toast.error('Upload configuration not loaded');
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate files
    files.forEach(file => {
      const fileErrors = uploadService.validateFile(file, uploadConfig);
      if (fileErrors.length > 0) {
        errors.push(`${file.name}: ${fileErrors.join(', ')}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      onUploadError?.(errors.join('\n'));
      toast.error(`Validation errors:\n${errors.join('\n')}`);
      return;
    }

    if (validFiles.length === 0) {
      return;
    }

    // Initialize uploading files
    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload files
    try {
      const uploadPromises = validFiles.map(async (file, index) => {
        try {
          let result;
          if (expenseId) {
            result = await uploadService.addReceiptToExpense(expenseId, file);
          } else {
            result = await uploadService.uploadReceipt(file);
          }

          // Update file status
          setUploadingFiles(prev => 
            prev.map((uf, i) => {
              if (uf.file === file) {
                return { ...uf, progress: 100, status: 'completed', result: result.data };
              }
              return uf;
            })
          );

          return result.data;
        } catch (error: any) {
          // Update file status with error
          setUploadingFiles(prev => 
            prev.map((uf, i) => {
              if (uf.file === file) {
                return { 
                  ...uf, 
                  status: 'error', 
                  error: error.response?.data?.message || error.message 
                };
              }
              return uf;
            })
          );
          throw error;
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value);

      if (successfulUploads.length > 0) {
        onUploadComplete?.(successfulUploads);
        toast.success(`Successfully uploaded ${successfulUploads.length} file(s)`);
      }

      const failedUploads = results.filter(result => result.status === 'rejected');
      if (failedUploads.length > 0) {
        const errorMessages = failedUploads.map(
          result => (result as PromiseRejectedResult).reason.message
        );
        onUploadError?.(errorMessages.join('\n'));
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      onUploadError?.(error.message || 'Upload failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = async (fileId: string) => {
    if (!expenseId) return;
    
    try {
      await uploadService.removeReceiptFromExpense(expenseId, fileId);
      toast.success('File removed successfully');
      // Trigger refresh of parent component
      onUploadComplete?.([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove file');
    }
  };

  const openPreview = (file: any) => {
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  const getFileTypeIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
      return '🖼️';
    } else if (ext === 'pdf') {
      return '📄';
    }
    return '📎';
  };

  return (
    <Box>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={uploadConfig?.allowedFileTypes.join(',')}
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Upload Area */}
      <Paper
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          bgcolor: isDragActive ? 'primary.light' : 'grey.50',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.3s ease',
          textAlign: 'center',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.light',
          }
        }}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          {uploadConfig && (
            <>
              Maximum file size: {uploadConfig.maxFileSizeFormatted} • 
              Allowed types: {uploadConfig.allowedFileTypes.join(', ')}
              {multiple && ` • Maximum ${uploadConfig.maxFilesPerUpload} files`}
            </>
          )}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<AttachFile />}
          disabled={disabled}
          sx={{ mt: 1 }}
        >
          Select Files
        </Button>
      </Paper>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploading Files
          </Typography>
          <List>
            {uploadingFiles.map((uploadingFile, index) => (
              <ListItem key={index}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {getFileTypeIcon(uploadingFile.file.name)} {uploadingFile.file.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={uploadingFile.status}
                      color={
                        uploadingFile.status === 'completed' ? 'success' :
                        uploadingFile.status === 'error' ? 'error' : 'primary'
                      }
                      icon={
                        uploadingFile.status === 'completed' ? <CheckCircle /> :
                        uploadingFile.status === 'error' ? <ErrorIcon /> : undefined
                      }
                    />
                    <IconButton 
                      size="small" 
                      onClick={() => removeUploadingFile(index)}
                      sx={{ ml: 1 }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                  {uploadingFile.status === 'uploading' && (
                    <LinearProgress 
                      variant="indeterminate" 
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  )}
                  {uploadingFile.status === 'error' && uploadingFile.error && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {uploadingFile.error}
                    </Alert>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Files
          </Typography>
          <List>
            {existingFiles.map((file, index) => (
              <ListItem key={file.id || index}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: 8 }}>
                        {getFileTypeIcon(file.fileName || file.originalName)}
                      </span>
                      {file.originalName || file.fileName}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" component="div">
                        Size: {uploadService.formatFileSize(file.fileSize || 0)}
                      </Typography>
                      <Typography variant="caption" component="div">
                        Uploaded: {new Date(file.uploadDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={() => openPreview(file)}
                    sx={{ mr: 1 }}
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    onClick={() => removeExistingFile(file.id || file._id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* File Preview Dialog */}
      <Dialog
        open={!!previewFile}
        onClose={closePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          File Preview: {previewFile?.originalName || previewFile?.fileName}
        </DialogTitle>
        <DialogContent>
          {previewFile && (
            <Box sx={{ textAlign: 'center' }}>
              {previewFile.fileType === 'image' ? (
                <img
                  src={previewFile.fileUrl}
                  alt={previewFile.originalName}
                  style={{ maxWidth: '100%', maxHeight: '500px' }}
                />
              ) : (
                <Box sx={{ p: 4 }}>
                  <AttachFile sx={{ fontSize: 64, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    {previewFile.originalName || previewFile.fileName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    File preview not available. Click download to view the file.
                  </Typography>
                  <Button
                    variant="outlined"
                    href={previewFile.fileUrl}
                    target="_blank"
                    sx={{ mt: 2 }}
                  >
                    Download File
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview}>Close</Button>
          {previewFile && (
            <Button
              variant="contained"
              href={previewFile.fileUrl}
              target="_blank"
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileUpload;