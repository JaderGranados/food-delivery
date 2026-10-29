import { InvalidStarsError } from '../errors.js';
import { Stars } from './stars.js';

describe('Stars', () => {
  it.each([1, 2, 3, 4, 5])('accepts %s', (value) => {
    expect(Stars.create(value).value).toBe(value);
  });

  it.each([0, 6, -1, 2.5, Number.NaN])('rejects %s', (value) => {
    expect(() => Stars.create(value)).toThrow(InvalidStarsError);
  });
});
