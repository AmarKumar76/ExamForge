const mongoose = require('mongoose');
const Course = require('../../src/models/Course');

describe('Unit Test: Course Model', () => {
  it('should format code to uppercase', () => {
    const course = new Course({
      institutionId: new mongoose.Types.ObjectId(),
      name: 'Data Structures',
      code: ' cs301 ',
    });
    expect(course.code).toBe('CS301');
  });

  it('should require institutionId, name and code', () => {
    const course = new Course({});
    const err = course.validateSync();
    expect(err.errors.institutionId).toBeDefined();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.code).toBeDefined();
  });

  it('should set default department to General and status to ACTIVE', () => {
    const course = new Course({
      institutionId: new mongoose.Types.ObjectId(),
      name: 'Algorithms',
      code: 'CS302',
    });
    expect(course.department).toBe('General');
    expect(course.status).toBe('ACTIVE');
  });
});
