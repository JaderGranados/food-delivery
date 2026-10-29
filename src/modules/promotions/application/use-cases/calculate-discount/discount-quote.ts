import type { MoneyInput } from '../money-input.js';

export interface DiscountQuote {
  couponId: string;
  code: string;
  subtotal: MoneyInput;
  discount: MoneyInput;
  total: MoneyInput;
}
