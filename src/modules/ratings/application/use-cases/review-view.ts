import type { Review, ReviewTargetType } from '../../domain/index.js';

export interface ReviewView {
  id: string;
  orderId: string;
  customerId: string;
  target: { type: ReviewTargetType; id: string };
  stars: number;
  comment?: string;
  createdAt: Date;
}

export function toReviewView(review: Review): ReviewView {
  return {
    id: review.id,
    orderId: review.orderId,
    customerId: review.customerId,
    target: { type: review.target.type, id: review.target.id },
    stars: review.stars.value,
    ...(review.comment && { comment: review.comment }),
    createdAt: review.createdAt,
  };
}
