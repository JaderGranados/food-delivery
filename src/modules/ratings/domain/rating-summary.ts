import type { Review } from './review.js';

export type StarCount = 1 | 2 | 3 | 4 | 5;

/** Aggregate score of a target, worked out from its reviews. */
export class RatingSummary {
  private constructor(
    readonly count: number,
    /** Mean stars to two decimals, or `null` when there are no reviews. */
    readonly average: number | null,
    readonly distribution: Readonly<Record<StarCount, number>>,
  ) {}

  static from(reviews: readonly Review[]): RatingSummary {
    const distribution: Record<StarCount, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    let total = 0;
    for (const review of reviews) {
      distribution[review.stars.value as StarCount] += 1;
      total += review.stars.value;
    }
    const average =
      reviews.length === 0
        ? null
        : Math.round((total / reviews.length) * 100) / 100;
    return new RatingSummary(reviews.length, average, distribution);
  }
}
