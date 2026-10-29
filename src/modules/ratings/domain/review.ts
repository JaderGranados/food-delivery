import { ArgumentRequiredError, ReviewCommentTooLongError } from './errors.js';
import type { ReviewTarget, Stars } from './value-objects/index.js';

const MAX_COMMENT_LENGTH = 500;

export interface WriteReviewProps {
  id: string;
  orderId: string;
  customerId: string;
  target: ReviewTarget;
  stars: Stars;
  comment?: string;
  now: Date;
}

export class Review {
  private constructor(
    readonly id: string,
    readonly orderId: string,
    readonly customerId: string,
    readonly target: ReviewTarget,
    readonly stars: Stars,
    readonly comment: string | undefined,
    readonly createdAt: Date,
  ) {}

  static write({
    id,
    orderId,
    customerId,
    target,
    stars,
    comment,
    now,
  }: WriteReviewProps): Review {
    if (!id) throw new ArgumentRequiredError('ID');
    if (!orderId) throw new ArgumentRequiredError('Order ID');
    if (!customerId) throw new ArgumentRequiredError('Customer ID');
    const trimmed = comment?.trim() || undefined;
    if (trimmed && trimmed.length > MAX_COMMENT_LENGTH) {
      throw new ReviewCommentTooLongError(MAX_COMMENT_LENGTH);
    }
    return new Review(id, orderId, customerId, target, stars, trimmed, now);
  }
}
