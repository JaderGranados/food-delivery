import { Money } from '@shared/domain/index.js';
import { CurrencyMismatchError, InvalidDiscountError } from '../errors.js';

export type DiscountType = 'percentage' | 'fixed';

export class Discount {
  private constructor(
    readonly type: DiscountType,
    /** Whole percent, for percentage discounts. */
    readonly percent: number | undefined,
    /** Fixed amount off, for fixed discounts. */
    readonly fixedAmount: Money | undefined,
  ) {}

  static percentage(percent: number): Discount {
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
      throw new InvalidDiscountError(
        `percentage must be a whole number from 1 to 100, got ${percent}`,
      );
    }
    return new Discount('percentage', percent, undefined);
  }

  static fixed(amount: Money): Discount {
    if (amount.amount <= 0) {
      throw new InvalidDiscountError('a fixed amount must be above zero');
    }
    return new Discount('fixed', undefined, amount);
  }

  /** How much comes off `subtotal`; never more than the subtotal itself. */
  appliedTo(subtotal: Money): Money {
    if (this.type === 'percentage') {
      const off = Math.floor((subtotal.amount * this.percent!) / 100);
      return Money.create(off, subtotal.currency);
    }
    const fixed = this.fixedAmount!;
    if (fixed.currency !== subtotal.currency) {
      throw new CurrencyMismatchError(fixed.currency, subtotal.currency);
    }
    return Money.create(
      Math.min(fixed.amount, subtotal.amount),
      fixed.currency,
    );
  }
}
