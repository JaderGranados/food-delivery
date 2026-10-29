import { Injectable } from '@nestjs/common';
import {
  ReviewAlreadyExistsError,
  type Review,
  type ReviewTarget,
} from '../../domain/index.js';
import type { ReviewRepository } from '../../application/index.js';

@Injectable()
export class InMemoryReviewRepository implements ReviewRepository {
  private readonly reviews: Review[] = [];

  // No `await` between the check and the insert, so it is atomic.
  async add(review: Review): Promise<Review> {
    const taken = this.reviews.some(
      (existing) =>
        existing.orderId === review.orderId &&
        existing.target.type === review.target.type,
    );
    if (taken) {
      throw new ReviewAlreadyExistsError(review.orderId, review.target.type);
    }
    this.reviews.push(review);
    return review;
  }

  async findByTarget(target: ReviewTarget): Promise<Review[]> {
    return this.reviews
      .filter((review) => review.target.equals(target))
      .reverse();
  }
}
