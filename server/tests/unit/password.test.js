const { hashPassword, comparePassword } = require('../../src/utils/password');

describe('Unit Test: Password Hashing Utility', () => {
  it('should hash plaintext password correctly', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(rawPassword);
    expect(hash.length).toBeGreaterThan(20);
  });

  it('should verify correct password match', async () => {
    const rawPassword = 'MySecretPassword';
    const hash = await hashPassword(rawPassword);
    const isMatch = await comparePassword(rawPassword, hash);

    expect(isMatch).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const rawPassword = 'MySecretPassword';
    const hash = await hashPassword(rawPassword);
    const isMatch = await comparePassword('WrongPassword', hash);

    expect(isMatch).toBe(false);
  });
});
