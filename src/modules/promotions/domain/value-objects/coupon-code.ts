import { InvalidCouponCodeError } from '../errors.js';

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;

export class CouponCode {
  private constructor(readonly value: string) {}

  /** Codes are case-insensitive: they are stored upper-cased. */
  static create(raw: string): CouponCode {
    const normalized = raw?.trim().toUpperCase() ?? '';
    if (!CODE_PATTERN.test(normalized)) throw new InvalidCouponCodeError(raw);
    return new CouponCode(normalized);
  }

  equals(other: CouponCode): boolean {
    return this.value === other.value;
  }
}
