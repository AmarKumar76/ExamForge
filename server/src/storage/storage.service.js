const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class StorageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads/materials');
    this.ensureUploadDirExists();
  }

  ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Sanitizes original filename to prevent path traversal
   */
  sanitizeFilename(originalName) {
    const basename = path.basename(originalName);
    return basename.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  /**
   * Save uploaded file to storage location
   * @param {object} file Multer file object
   * @returns {Promise<object>} { fileKey, fileName, fileSize, mimeType }
   */
  async saveFile(file) {
    this.ensureUploadDirExists();
    const safeOriginalName = this.sanitizeFilename(file.originalname);
    const uniquePrefix = crypto.randomBytes(12).toString('hex');
    const fileKey = `${uniquePrefix}_${safeOriginalName}`;
    const destinationPath = path.join(this.uploadDir, fileKey);

    if (file.buffer) {
      await fs.promises.writeFile(destinationPath, file.buffer);
    } else if (file.path && file.path !== destinationPath) {
      await fs.promises.rename(file.path, destinationPath);
    }

    return {
      fileKey,
      fileName: safeOriginalName,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Get safe absolute file path for downloading
   */
  getFilePath(fileKey) {
    const safeKey = path.basename(fileKey);
    const fullPath = path.join(this.uploadDir, safeKey);
    
    // Prevent path traversal
    if (!fullPath.startsWith(this.uploadDir)) {
      throw new Error('Invalid file path requested.');
    }

    if (!fs.existsSync(fullPath)) {
      const error = new Error('File not found in storage.');
      error.statusCode = 404;
      throw error;
    }

    return fullPath;
  }

  /**
   * Delete file from storage
   */
  async deleteFile(fileKey) {
    try {
      const safeKey = path.basename(fileKey);
      const fullPath = path.join(this.uploadDir, safeKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (err) {
      console.warn(`Storage delete warning for key ${fileKey}:`, err.message);
    }
  }
}

module.exports = new StorageService();
