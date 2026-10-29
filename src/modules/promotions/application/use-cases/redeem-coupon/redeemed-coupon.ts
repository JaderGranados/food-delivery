import type { MoneyInput } from '../money-input.js';

export interface RedeemedCoupon {
  couponId: string;
  code: string;
  orderId: string;
  subtotal: MoneyInput;
  discount: MoneyInput;
  total: MoneyInput;
  redeemedAt: Date;
}
