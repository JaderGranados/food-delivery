import { Money } from '@shared/domain/index.js';
import { CurrencyMismatchError, InvalidDiscountError } from '../errors.js';
import { Discount } from './discount.js';

const crc = (amount: number) => Money.create(amount, 'CRC');

describe('Discount', () => {
  describe('percentage', () => {
    it('takes a percent off, rounding down to whole minor units', () => {
      expect(Discount.percentage(10).appliedTo(crc(12345)).amount).toBe(1234);
      expect(Discount.percentage(100).appliedTo(crc(500)).amount).toBe(500);
    });

    it.each([0, -5, 101, 12.5])('rejects %s percent', (percent) => {
      expect(() => Discount.percentage(percent)).toThrow(InvalidDiscountError);
    });
  });

  describe('fixed', () => {
    it('takes the amount off', () => {
      expect(Discount.fixed(crc(2000)).appliedTo(crc(10000)).amount).toBe(2000);
    });

    it('never discounts more than the subtotal', () => {
      expect(Discount.fixed(crc(5000)).appliedTo(crc(3000)).amount).toBe(3000);
    });

    it('rejects a zero amount', () => {
      expect(() => Discount.fixed(crc(0))).toThrow(InvalidDiscountError);
    });

    it('rejects a different currency', () => {
      expect(() =>
        Discount.fixed(crc(1000)).appliedTo(Money.create(5000, 'USD')),
      ).toThrow(CurrencyMismatchError);
    });
  });
});
