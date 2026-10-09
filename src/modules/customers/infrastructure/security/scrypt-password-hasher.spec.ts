import { ScryptPasswordHasher } from './scrypt-password-hasher.js';

describe('ScryptPasswordHasher', () => {
  const hasher = new ScryptPasswordHasher();

  it('produces a salted scrypt hash, never the plain password', async () => {
    const hash = await hasher.hash('supersecret');

    expect(hash).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(hash).not.toContain('supersecret');
  });

  it('uses a different salt on every call', async () => {
    const [a, b] = await Promise.all([
      hasher.hash('supersecret'),
      hasher.hash('supersecret'),
    ]);

    expect(a).not.toBe(b);
  });
});
