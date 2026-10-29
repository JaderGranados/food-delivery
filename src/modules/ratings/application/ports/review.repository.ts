import type { Review, ReviewTarget } from '../../domain/index.js';

export interface ReviewRepository {
  /**
   * Inserts a new review. Like a unique index on (order, target type), it must
   * fail atomically with `ReviewAlreadyExistsError` when the order already has
   * a review for that kind of target.
   */
  add(review: Review): Promise<Review>;
  /** Newest first. */
  findByTarget(target: ReviewTarget): Promise<Review[]>;
}
