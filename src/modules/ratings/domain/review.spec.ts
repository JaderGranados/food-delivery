import { ArgumentRequiredError, ReviewCommentTooLongError } from './errors.js';
import { Review } from './review.js';
import { ReviewTarget, Stars } from './value-objects/index.js';

const write = (overrides: Partial<Parameters<typeof Review.write>[0]> = {}) =>
  Review.write({
    id: 'r-1',
    orderId: 'o-1',
    customerId: 'c-1',
    target: ReviewTarget.create('restaurant', 'rest-1'),
    stars: Stars.create(4),
    now: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

describe('Review', () => {
  it('writes a review without a comment', () => {
    const review = write();

    expect(review.stars.value).toBe(4);
    expect(review.comment).toBeUndefined();
    expect(review.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
  });

  it('trims the comment and drops a blank one', () => {
    expect(write({ comment: '  Great food  ' }).comment).toBe('Great food');
    expect(write({ comment: '   ' }).comment).toBeUndefined();
  });

  it('accepts a comment of 500 characters and rejects 501', () => {
    expect(() => write({ comment: 'a'.repeat(500) })).not.toThrow();
    expect(() => write({ comment: 'a'.repeat(501) })).toThrow(
      ReviewCommentTooLongError,
    );
  });

  it.each(['id', 'orderId', 'customerId'] as const)('requires %s', (field) => {
    expect(() => write({ [field]: '' })).toThrow(ArgumentRequiredError);
  });
});
