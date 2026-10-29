import { InvalidCouponCodeError } from '../errors.js';
import { CouponCode } from './coupon-code.js';

describe('CouponCode', () => {
  it('trims and upper-cases the code', () => {
    expect(CouponCode.create('  summer-10 ').value).toBe('SUMMER-10');
  });

  it('treats codes as case-insensitive', () => {
    expect(
      CouponCode.create('welcome').equals(CouponCode.create('WELCOME')),
    ).toBe(true);
  });

  it.each(['', 'ab', '-start', 'has space', 'bad!', 'x'.repeat(33)])(
    'rejects "%s"',
    (raw) => {
      expect(() => CouponCode.create(raw)).toThrow(InvalidCouponCodeError);
    },
  );
});
