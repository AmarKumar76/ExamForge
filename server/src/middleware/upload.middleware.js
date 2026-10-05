const multer = require('multer');
const path = require('path');
const { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES } = require('../validators/material.validator');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error('Unsupported file format. Please upload PDF, DOCX, or PPTX documents.');
    error.statusCode = 400;
    error.code = 'UNSUPPORTED_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter,
});

module.exports = upload;
