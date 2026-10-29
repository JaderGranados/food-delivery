import type { Coupon } from '../../domain/index.js';
import type { MoneyInput } from './money-input.js';

export type DiscountView =
  | { type: 'percentage'; percent: number }
  | { type: 'fixed'; amount: number; currency: string };

export interface CouponView {
  id: string;
  code: string;
  discount: DiscountView;
  minimumOrder?: MoneyInput;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  remainingUses?: number;
  redemptionCount: number;
  createdAt: Date;
}

export function toCouponView(coupon: Coupon): CouponView {
  const { discount, minimumOrder } = coupon;
  return {
    id: coupon.id,
    code: coupon.code.value,
    discount:
      discount.type === 'percentage'
        ? { type: 'percentage', percent: discount.percent! }
        : {
            type: 'fixed',
            amount: discount.fixedAmount!.amount,
            currency: discount.fixedAmount!.currency,
          },
    ...(minimumOrder && {
      minimumOrder: {
        amount: minimumOrder.amount,
        currency: minimumOrder.currency,
      },
    }),
    validFrom: coupon.validFrom,
    validUntil: coupon.validUntil,
    ...(coupon.usageLimit !== undefined && {
      usageLimit: coupon.usageLimit,
      remainingUses: coupon.remainingUses,
    }),
    redemptionCount: coupon.redemptions.length,
    createdAt: coupon.createdAt,
  };
}
