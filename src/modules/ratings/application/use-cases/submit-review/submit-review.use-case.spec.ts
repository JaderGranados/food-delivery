import {
  InvalidReviewTargetError,
  InvalidStarsError,
  NotOrderCustomerError,
  OrderNotDeliveredError,
  OrderNotFoundError,
  ReviewAlreadyExistsError,
  ReviewCommentTooLongError,
  type Review,
  type ReviewTarget,
} from '../../../domain/index.js';
import type {
  DeliveryLookup,
  DeliverySummary,
  OrderLookup,
  OrderSummary,
  ReviewRepository,
} from '../../ports/index.js';
import { SubmitReviewUseCase } from './submit-review.use-case.js';

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

class FakeOrderLookup implements OrderLookup {
  order: OrderSummary | null = {
    id: 'o-1',
    customerId: 'c-1',
    restaurantId: 'rest-1',
  };

  findOrder(): Promise<OrderSummary | null> {
    return Promise.resolve(this.order);
  }
}

class FakeDeliveryLookup implements DeliveryLookup {
  delivery: DeliverySummary | null = { status: 'delivered', courierId: 'k-1' };

  findDeliveryByOrder(): Promise<DeliverySummary | null> {
    return Promise.resolve(this.delivery);
  }
}

const command = {
  orderId: 'o-1',
  customerId: 'c-1',
  targetType: 'restaurant',
  stars: 5,
  comment: 'Delicious',
};

describe('SubmitReview', () => {
  let reviews: FakeReviewRepository;
  let orders: FakeOrderLookup;
  let deliveries: FakeDeliveryLookup;
  let submit: SubmitReviewUseCase;

  beforeEach(() => {
    reviews = new FakeReviewRepository();
    orders = new FakeOrderLookup();
    deliveries = new FakeDeliveryLookup();
    submit = new SubmitReviewUseCase(reviews, orders, deliveries);
  });

  it('reviews the restaurant of the order', async () => {
    const result = await submit.execute(command);

    expect(result).toEqual({
      id: expect.any(String),
      orderId: 'o-1',
      customerId: 'c-1',
      target: { type: 'restaurant', id: 'rest-1' },
      stars: 5,
      comment: 'Delicious',
      createdAt: expect.any(Date),
    });
    expect(reviews.saved).toHaveLength(1);
  });

  it('reviews the courier who delivered the order', async () => {
    const result = await submit.execute({ ...command, targetType: 'courier' });

    expect(result.target).toEqual({ type: 'courier', id: 'k-1' });
  });

  it('lets the same order have one restaurant and one courier review', async () => {
    await submit.execute(command);

    await expect(
      submit.execute({ ...command, targetType: 'courier' }),
    ).resolves.toBeDefined();
    expect(reviews.saved).toHaveLength(2);
  });

  it('rejects a second review of the same kind for an order', async () => {
    await submit.execute(command);

    await expect(submit.execute({ ...command, stars: 1 })).rejects.toThrow(
      ReviewAlreadyExistsError,
    );
    expect(reviews.saved).toHaveLength(1);
  });

  it('accepts only one review when two arrive together', async () => {
    const results = await Promise.allSettled([
      submit.execute(command),
      submit.execute(command),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(reviews.saved).toHaveLength(1);
  });

  it('fails when the order does not exist', async () => {
    orders.order = null;

    await expect(submit.execute(command)).rejects.toThrow(OrderNotFoundError);
  });

  it('refuses a customer who did not place the order', async () => {
    await expect(
      submit.execute({ ...command, customerId: 'someone-else' }),
    ).rejects.toThrow(NotOrderCustomerError);
    expect(reviews.saved).toHaveLength(0);
  });

  it.each([
    ['has no delivery', null],
    ['is still pending', { status: 'pending' }],
    ['is on its way', { status: 'picked_up', courierId: 'k-1' }],
  ])('fails when the order %s', async (_case, delivery) => {
    deliveries.delivery = delivery;

    await expect(submit.execute(command)).rejects.toThrow(
      OrderNotDeliveredError,
    );
    expect(reviews.saved).toHaveLength(0);
  });

  it('fails to review a courier when there is none', async () => {
    deliveries.delivery = { status: 'delivered' };

    await expect(
      submit.execute({ ...command, targetType: 'courier' }),
    ).rejects.toThrow(InvalidReviewTargetError);
  });

  it('rejects an unknown target type', async () => {
    await expect(
      submit.execute({ ...command, targetType: 'customer' }),
    ).rejects.toThrow(InvalidReviewTargetError);
  });

  it.each([0, 6, 2.5])('rejects %s stars', async (stars) => {
    await expect(submit.execute({ ...command, stars })).rejects.toThrow(
      InvalidStarsError,
    );
  });

  it('rejects a comment that is too long', async () => {
    await expect(
      submit.execute({ ...command, comment: 'a'.repeat(501) }),
    ).rejects.toThrow(ReviewCommentTooLongError);
    expect(reviews.saved).toHaveLength(0);
  });
});
