import {
  Coupon,
  CouponCodeAlreadyExistsError,
  InvalidCouponCodeError,
  InvalidDiscountError,
  InvalidValidityWindowError,
} from '../../../domain/index.js';
import type { CouponRepository } from '../../ports/index.js';
import { CreateCouponUseCase } from './create-coupon.use-case.js';

class FakeCouponRepository implements CouponRepository {
  readonly saved = new Map<string, Coupon>();

  findByCode(code: string): Promise<Coupon | null> {
    return Promise.resolve(this.saved.get(code) ?? null);
  }

  add(coupon: Coupon): Promise<Coupon> {
    if (this.saved.has(coupon.code.value)) {
      return Promise.reject(
        new CouponCodeAlreadyExistsError(coupon.code.value),
      );
    }
    this.saved.set(coupon.code.value, coupon);
    return Promise.resolve(coupon);
  }

  save(coupon: Coupon): Promise<Coupon> {
    this.saved.set(coupon.code.value, coupon);
    return Promise.resolve(coupon);
  }
}

const command = {
  code: 'summer10',
  discount: { type: 'percentage' as const, percent: 10 },
  validFrom: new Date('2026-06-01T00:00:00Z'),
  validUntil: new Date('2026-07-01T00:00:00Z'),
};

describe('CreateCoupon', () => {
  let coupons: FakeCouponRepository;
  let createCoupon: CreateCouponUseCase;

  beforeEach(() => {
    coupons = new FakeCouponRepository();
    createCoupon = new CreateCouponUseCase(coupons);
  });

  it('creates a percentage coupon with an upper-cased code', async () => {
    const result = await createCoupon.execute(command);

    expect(result).toEqual({
      id: expect.any(String),
      code: 'SUMMER10',
      discount: { type: 'percentage', percent: 10 },
      validFrom: command.validFrom,
      validUntil: command.validUntil,
      redemptionCount: 0,
      createdAt: expect.any(Date),
    });
    expect(coupons.saved.has('SUMMER10')).toBe(true);
  });

  it('creates a fixed coupon with a minimum order and a usage limit', async () => {
    const result = await createCoupon.execute({
      ...command,
      discount: { type: 'fixed', amount: 200000, currency: 'CRC' },
      minimumOrder: { amount: 500000, currency: 'CRC' },
      usageLimit: 50,
    });

    expect(result).toMatchObject({
      discount: { type: 'fixed', amount: 200000, currency: 'CRC' },
      minimumOrder: { amount: 500000, currency: 'CRC' },
      usageLimit: 50,
      remainingUses: 50,
    });
  });

  it('rejects a code that is already taken, in any case', async () => {
    await createCoupon.execute(command);

    await expect(
      createCoupon.execute({ ...command, code: 'Summer10' }),
    ).rejects.toThrow(CouponCodeAlreadyExistsError);
    expect(coupons.saved.size).toBe(1);
  });

  it.each([
    ['an invalid code', { code: '!!' }, InvalidCouponCodeError],
    [
      'an invalid percentage',
      { discount: { type: 'percentage' as const, percent: 150 } },
      InvalidDiscountError,
    ],
    [
      'an end before the start',
      { validUntil: new Date('2026-05-01T00:00:00Z') },
      InvalidValidityWindowError,
    ],
  ])('rejects %s without saving', async (_case, override, error) => {
    await expect(
      createCoupon.execute({ ...command, ...override }),
    ).rejects.toThrow(error);
    expect(coupons.saved.size).toBe(0);
  });
});
