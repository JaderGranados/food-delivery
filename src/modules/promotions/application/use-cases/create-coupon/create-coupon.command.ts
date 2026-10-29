import type { MoneyInput } from '../money-input.js';

export type DiscountInput =
  | { type: 'percentage'; percent: number }
  | { type: 'fixed'; amount: number; currency: string };

export interface CreateCouponCommand {
  code: string;
  discount: DiscountInput;
  minimumOrder?: MoneyInput;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
}
