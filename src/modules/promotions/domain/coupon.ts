import { Money } from '@shared/domain/index.js';
import {
  ArgumentRequiredError,
  CouponAlreadyRedeemedForOrderError,
  CouponExpiredError,
  CouponNotYetValidError,
  CouponUsageLimitReachedError,
  CurrencyMismatchError,
  InvalidUsageLimitError,
  InvalidValidityWindowError,
  MinimumOrderNotMetError,
} from './errors.js';
import type { CouponCode, Discount } from './value-objects/index.js';

export interface CreateCouponProps {
  id: string;
  code: CouponCode;
  discount: Discount;
  /** Orders below this subtotal are not eligible. */
  minimumOrder?: Money;
  validFrom: Date;
  validUntil: Date;
  /** Total redemptions allowed across all customers. Omit for unlimited. */
  usageLimit?: number;
  now: Date;
}

export interface Redemption {
  orderId: string;
  discount: Money;
  redeemedAt: Date;
}

export class Coupon {
  private readonly redemptionList: Redemption[] = [];

  private constructor(
    readonly id: string,
    readonly code: CouponCode,
    readonly discount: Discount,
    readonly minimumOrder: Money | undefined,
    readonly validFrom: Date,
    readonly validUntil: Date,
    readonly usageLimit: number | undefined,
    readonly createdAt: Date,
  ) {}

  static create({
    id,
    code,
    discount,
    minimumOrder,
    validFrom,
    validUntil,
    usageLimit,
    now,
  }: CreateCouponProps): Coupon {
    if (!id) throw new ArgumentRequiredError('ID');
    if (validFrom >= validUntil) throw new InvalidValidityWindowError();
    if (
      discount.fixedAmount &&
      minimumOrder &&
      discount.fixedAmount.currency !== minimumOrder.currency
    ) {
      // Such a coupon could never match an order, so refuse it up front.
      throw new CurrencyMismatchError(
        discount.fixedAmount.currency,
        minimumOrder.currency,
      );
    }
    if (
      usageLimit !== undefined &&
      (!Number.isInteger(usageLimit) || usageLimit < 1)
    ) {
      throw new InvalidUsageLimitError(usageLimit);
    }
    return new Coupon(
      id,
      code,
      discount,
      minimumOrder,
      validFrom,
      validUntil,
      usageLimit,
      now,
    );
  }

  get redemptions(): readonly Redemption[] {
    return [...this.redemptionList];
  }

  /** Uses left, or `undefined` when the coupon is unlimited. */
  get remainingUses(): number | undefined {
    return this.usageLimit === undefined
      ? undefined
      : this.usageLimit - this.redemptionList.length;
  }

  /** The discount `subtotal` would get right now, without using the coupon. */
  calculateDiscount(subtotal: Money, now: Date): Money {
    if (this.minimumOrder && this.minimumOrder.currency !== subtotal.currency) {
      throw new CurrencyMismatchError(
        this.minimumOrder.currency,
        subtotal.currency,
      );
    }
    if (now < this.validFrom) throw new CouponNotYetValidError(this.code.value);
    if (now >= this.validUntil) throw new CouponExpiredError(this.code.value);
    if (this.remainingUses !== undefined && this.remainingUses <= 0) {
      throw new CouponUsageLimitReachedError(this.code.value);
    }
    if (this.minimumOrder && subtotal.amount < this.minimumOrder.amount) {
      throw new MinimumOrderNotMetError(
        this.minimumOrder.amount,
        subtotal.amount,
      );
    }
    return this.discount.appliedTo(subtotal);
  }

  /** Uses the coupon on an order. An order can use a coupon only once. */
  redeem({
    orderId,
    subtotal,
    now,
  }: {
    orderId: string;
    subtotal: Money;
    now: Date;
  }): Redemption {
    if (!orderId) throw new ArgumentRequiredError('Order ID');
    if (this.redemptionList.some((r) => r.orderId === orderId)) {
      throw new CouponAlreadyRedeemedForOrderError(this.code.value, orderId);
    }
    const discount = this.calculateDiscount(subtotal, now);
    const redemption: Redemption = { orderId, discount, redeemedAt: now };
    this.redemptionList.push(redemption);
    return redemption;
  }
}
