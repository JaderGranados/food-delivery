import {
  InvalidReviewTargetError,
  Review,
  ReviewAlreadyExistsError,
  ReviewTarget,
  Stars,
} from '../../../domain/index.js';
import type { ReviewRepository } from '../../ports/index.js';
import { GetReviewsUseCase } from './get-reviews.use-case.js';

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

describe('GetReviews', () => {
  let reviews: FakeReviewRepository;
  let getReviews: GetReviewsUseCase;

  beforeEach(() => {
    reviews = new FakeReviewRepository();
    getReviews = new GetReviewsUseCase(reviews);
  });

  it('returns the reviews of the target, newest first', async () => {
    await reviews.add(review('o-1', 3));
    await reviews.add(review('o-2', 5));

    const result = await getReviews.execute({
      targetType: 'restaurant',
      targetId: 'rest-1',
    });

    expect(result.map((r) => r.orderId)).toEqual(['o-2', 'o-1']);
    expect(result[0]).toMatchObject({
      target: { type: 'restaurant', id: 'rest-1' },
      stars: 5,
    });
  });

  it('leaves out reviews of other targets', async () => {
    await reviews.add(review('o-1', 3));
    await reviews.add(review('o-2', 5, ReviewTarget.create('courier', 'k-1')));
    await reviews.add(
      review('o-3', 4, ReviewTarget.create('restaurant', 'rest-2')),
    );

    const result = await getReviews.execute({
      targetType: 'restaurant',
      targetId: 'rest-1',
    });

    expect(result).toHaveLength(1);
  });

  it('returns an empty list for a target without reviews', async () => {
    await expect(
      getReviews.execute({ targetType: 'courier', targetId: 'k-9' }),
    ).resolves.toEqual([]);
  });

  it('rejects an unknown target type', async () => {
    await expect(
      getReviews.execute({ targetType: 'menu', targetId: 'x' }),
    ).rejects.toThrow(InvalidReviewTargetError);
  });
});
