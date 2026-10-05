const mongoose = require('mongoose');
const CourseMaterial = require('../../src/models/CourseMaterial');

describe('Unit Test: CourseMaterial Model', () => {
  it('should set default status to READY and visibility to DRAFT', () => {
    const mat = new CourseMaterial({
      courseId: new mongoose.Types.ObjectId(),
      institutionId: new mongoose.Types.ObjectId(),
      title: 'Syllabus PDF',
      fileName: 'test_file.pdf',
      originalFileName: 'Syllabus.pdf',
      fileType: 'PDF',
      mimeType: 'application/pdf',
      fileSize: 1024,
      fileKey: 'key_123.pdf',
      uploadedBy: new mongoose.Types.ObjectId(),
    });

    expect(mat.status).toBe('READY');
    expect(mat.visibility).toBe('DRAFT');
    expect(mat.version).toBe(1);
  });

  it('should require courseId, title, fileType and uploadedBy', () => {
    const mat = new CourseMaterial({});
    const err = mat.validateSync();
    expect(err.errors.courseId).toBeDefined();
    expect(err.errors.title).toBeDefined();
    expect(err.errors.fileType).toBeDefined();
    expect(err.errors.uploadedBy).toBeDefined();
  });

  it('should reject invalid fileType enum', () => {
    const mat = new CourseMaterial({
      courseId: new mongoose.Types.ObjectId(),
      institutionId: new mongoose.Types.ObjectId(),
      title: 'Script',
      fileName: 'file.exe',
      originalFileName: 'file.exe',
      fileType: 'EXE',
      mimeType: 'application/octet-stream',
      fileSize: 100,
      fileKey: 'key_exe',
      uploadedBy: new mongoose.Types.ObjectId(),
    });
    const err = mat.validateSync();
    expect(err.errors.fileType).toBeDefined();
  });
});
