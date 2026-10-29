import { InvalidCurrencyError, InvalidMoneyAmountError } from './errors.js';

const CURRENCY_PATTERN = /^[A-Z]{3}$/;

export class Money {
  private constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}

  /** `amount` is expressed in minor units (e.g. cents). */
  static create(amount: number, currency: string): Money {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new InvalidMoneyAmountError(amount);
    }
    if (!CURRENCY_PATTERN.test(currency)) {
      throw new InvalidCurrencyError(currency);
    }
    return new Money(amount, currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
