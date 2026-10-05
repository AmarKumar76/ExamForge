const Institution = require('../../src/models/Institution');

describe('Unit Test: Institution Model', () => {
  it('should format code to uppercase', () => {
    const inst = new Institution({
      name: 'Test University',
      code: '  test_uni  ',
    });
    expect(inst.code).toBe('TEST_UNI');
  });

  it('should require name and code', () => {
    const inst = new Institution({});
    const err = inst.validateSync();
    expect(err.errors.name).toBeDefined();
    expect(err.errors.code).toBeDefined();
  });

  it('should set default status to ACTIVE', () => {
    const inst = new Institution({
      name: 'Sample College',
      code: 'SAMPLE',
    });
    expect(inst.status).toBe('ACTIVE');
  });
});
