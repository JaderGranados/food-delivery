import type { ReviewTargetType } from '../../../domain/index.js';

export interface RatingSummaryView {
  target: { type: ReviewTargetType; id: string };
  count: number;
  /** Mean stars to two decimals, or `null` when there are no reviews. */
  average: number | null;
  /** How many reviews gave each number of stars. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}
