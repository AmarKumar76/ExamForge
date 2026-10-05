const { generateAccessToken, verifyAccessToken } = require('../../src/utils/jwt');

describe('Unit Test: JWT Utility', () => {
  it('should generate and verify JWT token payload', () => {
    const payload = {
      userId: '507f1f77bcf86cd799439011',
      role: 'STUDENT',
      institutionId: '507f1f77bcf86cd799439022',
    };

    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toEqual(payload.userId);
    expect(decoded.role).toEqual(payload.role);
    expect(decoded.institutionId).toEqual(payload.institutionId);
  });

  it('should throw error for invalid token verification', () => {
    expect(() => {
      verifyAccessToken('invalid.token.string');
    }).toThrow();
  });
});
