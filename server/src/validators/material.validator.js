const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.pptx'];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

/**
 * Determine standardized fileType enum from filename or mimetype
 */
const detectFileType = (filename, mimeType) => {
  const ext = (filename || '').toLowerCase();
  if (ext.endsWith('.pdf') || mimeType === 'application/pdf') return 'PDF';
  if (ext.endsWith('.docx') || ext.endsWith('.doc') || mimeType?.includes('word')) return 'DOCX';
  if (ext.endsWith('.pptx') || ext.endsWith('.ppt') || mimeType?.includes('presentation') || mimeType?.includes('powerpoint')) return 'PPTX';
  return null;
};

/**
 * Validates uploaded course material file parameters
 */
const validateMaterialFile = (file) => {
  const errors = [];

  if (!file) {
    errors.push('Course material file is required.');
    return { isValid: false, errors };
  }

  const fileType = detectFileType(file.originalname, file.mimetype);
  if (!fileType) {
    errors.push('Unsupported file format. Please upload PDF, DOCX, or PPTX documents.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    errors.push(`File size exceeds maximum allowed limit of 25MB.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    fileType,
  };
};

module.exports = {
  validateMaterialFile,
  detectFileType,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
};
