import {
  InvalidReviewTargetError,
  Review,
  ReviewAlreadyExistsError,
  ReviewTarget,
  Stars,
} from '../../../domain/index.js';
import type { ReviewRepository } from '../../ports/index.js';
import { GetRatingSummaryUseCase } from './get-rating-summary.use-case.js';

class FakeReviewRepository implements ReviewRepository {
  readonly saved: Review[] = [];

  add(review: Review): Promise<Review> {
    const taken = this.saved.some(
      (r) =>
        r.orderId === review.orderId && r.target.type === review.target.type,
    );
    if (taken) {
      return Promise.reject(
        new ReviewAlreadyExistsError(review.orderId, review.target.type),
      );
    }
    this.saved.push(review);
    return Promise.resolve(review);
  }

  findByTarget(target: ReviewTarget): Promise<Review[]> {
    return Promise.resolve(
      this.saved.filter((r) => r.target.equals(target)).reverse(),
    );
  }
}

function review(
  id: string,
  stars: number,
  target = ReviewTarget.create('restaurant', 'rest-1'),
): Review {
  return Review.write({
    id,
    orderId: id,
    customerId: 'c-1',
    target,
    stars: Stars.create(stars),
    now: new Date(),
  });
}

describe('GetRatingSummary', () => {
  let reviews: FakeReviewRepository;
  let getSummary: GetRatingSummaryUseCase;

  beforeEach(() => {
    reviews = new FakeReviewRepository();
    getSummary = new GetRatingSummaryUseCase(reviews);
  });

  it('summarizes the reviews of the target', async () => {
    await reviews.add(review('o-1', 5));
    await reviews.add(review('o-2', 4));
    await reviews.add(review('o-3', 4));
    await reviews.add(review('o-4', 1, ReviewTarget.create('courier', 'k-1')));

    const result = await getSummary.execute({
      targetType: 'restaurant',
      targetId: 'rest-1',
    });

    expect(result).toEqual({
      target: { type: 'restaurant', id: 'rest-1' },
      count: 3,
      average: 4.33,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 1 },
    });
  });

  it('has no average for a target without reviews', async () => {
    const result = await getSummary.execute({
      targetType: 'courier',
      targetId: 'k-9',
    });

    expect(result).toMatchObject({ count: 0, average: null });
  });

  it('rejects an unknown target type', async () => {
    await expect(
      getSummary.execute({ targetType: 'menu', targetId: 'x' }),
    ).rejects.toThrow(InvalidReviewTargetError);
  });
});
