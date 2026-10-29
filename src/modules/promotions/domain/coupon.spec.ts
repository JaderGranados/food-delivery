import { Money } from '@shared/domain/index.js';
import { Coupon } from './coupon.js';
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
import { CouponCode, Discount } from './value-objects/index.js';

const crc = (amount: number) => Money.create(amount, 'CRC');
const from = new Date('2026-06-01T00:00:00Z');
const until = new Date('2026-07-01T00:00:00Z');
const during = new Date('2026-06-15T12:00:00Z');

const coupon = (overrides: Partial<Parameters<typeof Coupon.create>[0]> = {}) =>
  Coupon.create({
    id: 'c-1',
    code: CouponCode.create('SUMMER10'),
    discount: Discount.percentage(10),
    validFrom: from,
    validUntil: until,
    now: new Date('2026-05-01T00:00:00Z'),
    ...overrides,
  });

describe('Coupon', () => {
  describe('creation', () => {
    it('is unlimited without a usage limit', () => {
      expect(coupon().remainingUses).toBeUndefined();
      expect(coupon().redemptions).toEqual([]);
    });

    it('requires an id', () => {
      expect(() => coupon({ id: '' })).toThrow(ArgumentRequiredError);
    });

    it('needs the validity window to be in order', () => {
      expect(() => coupon({ validFrom: until, validUntil: from })).toThrow(
        InvalidValidityWindowError,
      );
      expect(() => coupon({ validFrom: from, validUntil: from })).toThrow(
        InvalidValidityWindowError,
      );
    });

    it('rejects a fixed discount and a minimum order in different currencies', () => {
      expect(() =>
        coupon({
          discount: Discount.fixed(Money.create(1000, 'EUR')),
          minimumOrder: crc(5000),
        }),
      ).toThrow(CurrencyMismatchError);
    });

    it('accepts a fixed discount and a minimum order in the same currency', () => {
      expect(() =>
        coupon({
          discount: Discount.fixed(crc(1000)),
          minimumOrder: crc(5000),
        }),
      ).not.toThrow();
    });

    it.each([0, -1, 1.5])('rejects the usage limit %s', (usageLimit) => {
      expect(() => coupon({ usageLimit })).toThrow(InvalidUsageLimitError);
    });
  });

  describe('calculating a discount', () => {
    it('applies the discount to an eligible order', () => {
      expect(coupon().calculateDiscount(crc(10000), during).amount).toBe(1000);
    });

    it('does not use the coupon', () => {
      const c = coupon({ usageLimit: 1 });
      c.calculateDiscount(crc(10000), during);

      expect(c.remainingUses).toBe(1);
    });

    it('rejects an order before the coupon starts', () => {
      expect(() =>
        coupon().calculateDiscount(
          crc(10000),
          new Date('2026-05-31T23:59:59Z'),
        ),
      ).toThrow(CouponNotYetValidError);
    });

    it('is valid from its start and expired from its end', () => {
      expect(() => coupon().calculateDiscount(crc(10000), from)).not.toThrow();
      expect(() => coupon().calculateDiscount(crc(10000), until)).toThrow(
        CouponExpiredError,
      );
    });

    it('rejects an order below the minimum and accepts one at it', () => {
      const c = coupon({ minimumOrder: crc(5000) });

      expect(() => c.calculateDiscount(crc(4999), during)).toThrow(
        MinimumOrderNotMetError,
      );
      expect(c.calculateDiscount(crc(5000), during).amount).toBe(500);
    });

    it('rejects an order in another currency than the minimum', () => {
      expect(() =>
        coupon({ minimumOrder: crc(5000) }).calculateDiscount(
          Money.create(9000, 'USD'),
          during,
        ),
      ).toThrow(CurrencyMismatchError);
    });
  });

  describe('redeeming', () => {
    it('records the redemption and returns the discount', () => {
      const c = coupon({ usageLimit: 2 });

      const redemption = c.redeem({
        orderId: 'o-1',
        subtotal: crc(10000),
        now: during,
      });

      expect(redemption).toEqual({
        orderId: 'o-1',
        discount: crc(1000),
        redeemedAt: during,
      });
      expect(c.redemptions).toHaveLength(1);
      expect(c.remainingUses).toBe(1);
    });

    it('requires an order id', () => {
      expect(() =>
        coupon().redeem({ orderId: '', subtotal: crc(10000), now: during }),
      ).toThrow(ArgumentRequiredError);
    });

    it('can be redeemed only once per order', () => {
      const c = coupon();
      c.redeem({ orderId: 'o-1', subtotal: crc(10000), now: during });

      expect(() =>
        c.redeem({ orderId: 'o-1', subtotal: crc(10000), now: during }),
      ).toThrow(CouponAlreadyRedeemedForOrderError);
      expect(c.redemptions).toHaveLength(1);
    });

    it('stops at the usage limit', () => {
      const c = coupon({ usageLimit: 1 });
      c.redeem({ orderId: 'o-1', subtotal: crc(10000), now: during });

      expect(() =>
        c.redeem({ orderId: 'o-2', subtotal: crc(10000), now: during }),
      ).toThrow(CouponUsageLimitReachedError);
      expect(c.remainingUses).toBe(0);
    });

    it('does not record a redemption that is not eligible', () => {
      const c = coupon({ minimumOrder: crc(5000) });

      expect(() =>
        c.redeem({ orderId: 'o-1', subtotal: crc(1000), now: during }),
      ).toThrow(MinimumOrderNotMetError);
      expect(c.redemptions).toHaveLength(0);
    });
  });
});
