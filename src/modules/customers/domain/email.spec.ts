import { Email } from './value-objects/index.js';
import { InvalidEmailError } from './errors.js';

describe('Email', () => {
  it('trims and lowercases the address', () => {
    expect(Email.create('  Ana@Example.COM ').value).toBe('ana@example.com');
  });

  it('treats differently cased addresses as equal', () => {
    expect(
      Email.create('ana@example.com').equals(Email.create('ANA@example.com')),
    ).toBe(true);
  });

  it.each([
    '',
    'ana',
    'ana@',
    '@example.com',
    'ana@example',
    'a na@example.com',
  ])('rejects %j', (raw) => {
    expect(() => Email.create(raw)).toThrow(InvalidEmailError);
  });
});
