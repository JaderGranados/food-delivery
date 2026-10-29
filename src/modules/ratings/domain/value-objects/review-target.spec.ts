import { ArgumentRequiredError, InvalidReviewTargetError } from '../errors.js';
import { ReviewTarget } from './review-target.js';

describe('ReviewTarget', () => {
  it.each(['restaurant', 'courier'])('accepts a %s', (type) => {
    const target = ReviewTarget.create(type, 'x-1');

    expect(target.type).toBe(type);
    expect(target.id).toBe('x-1');
  });

  it('rejects an unknown type', () => {
    expect(() => ReviewTarget.create('customer', 'x-1')).toThrow(
      InvalidReviewTargetError,
    );
  });

  it('requires an id', () => {
    expect(() => ReviewTarget.create('courier', '')).toThrow(
      ArgumentRequiredError,
    );
  });

  it('compares by type and id', () => {
    const a = ReviewTarget.create('courier', 'x-1');

    expect(a.equals(ReviewTarget.create('courier', 'x-1'))).toBe(true);
    expect(a.equals(ReviewTarget.create('restaurant', 'x-1'))).toBe(false);
    expect(a.equals(ReviewTarget.create('courier', 'x-2'))).toBe(false);
  });
});
