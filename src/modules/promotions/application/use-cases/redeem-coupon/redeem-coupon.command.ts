import type { MoneyInput } from '../money-input.js';

export interface RedeemCouponCommand {
  code: string;
  orderId: string;
  subtotal: MoneyInput;
}
