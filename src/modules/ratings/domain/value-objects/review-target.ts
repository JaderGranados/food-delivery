import { ArgumentRequiredError, InvalidReviewTargetError } from '../errors.js';

export const REVIEW_TARGET_TYPES = ['restaurant', 'courier'] as const;

export type ReviewTargetType = (typeof REVIEW_TARGET_TYPES)[number];

/** What is being reviewed: a restaurant or a courier, by id. */
export class ReviewTarget {
  private constructor(
    readonly type: ReviewTargetType,
    readonly id: string,
  ) {}

  static create(type: string, id: string): ReviewTarget {
    if (!REVIEW_TARGET_TYPES.includes(type as ReviewTargetType)) {
      throw new InvalidReviewTargetError(type);
    }
    if (!id) throw new ArgumentRequiredError('Target ID');
    return new ReviewTarget(type as ReviewTargetType, id);
  }

  equals(other: ReviewTarget): boolean {
    return this.type === other.type && this.id === other.id;
  }
}
