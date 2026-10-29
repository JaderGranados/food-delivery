export interface SubmitReviewCommand {
  orderId: string;
  customerId: string;
  /** `restaurant` or `courier`. */
  targetType: string;
  stars: number;
  comment?: string;
}
