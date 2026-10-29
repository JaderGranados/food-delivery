import { RatingSummary } from './rating-summary.js';
import { Review } from './review.js';
import { ReviewTarget, Stars } from './value-objects/index.js';

const review = (stars: number, id = `r-${Math.random()}`) =>
  Review.write({
    id,
    orderId: id,
    customerId: 'c-1',
    target: ReviewTarget.create('restaurant', 'rest-1'),
    stars: Stars.create(stars),
    now: new Date(),
  });

describe('RatingSummary', () => {
  it('has no average without reviews', () => {
    const summary = RatingSummary.from([]);

    expect(summary.count).toBe(0);
    expect(summary.average).toBeNull();
    expect(summary.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  });

  it('counts the reviews and averages the stars', () => {
    const summary = RatingSummary.from([review(5), review(4), review(4)]);

    expect(summary.count).toBe(3);
    expect(summary.average).toBe(4.33);
    expect(summary.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 2, 5: 1 });
  });

  it('rounds the average to two decimals', () => {
    expect(RatingSummary.from([review(1), review(2), review(2)]).average).toBe(
      1.67,
    );
    expect(RatingSummary.from([review(5), review(5)]).average).toBe(5);
  });
});
