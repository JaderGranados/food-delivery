import {
  Coupon,
  CouponCode,
  CouponCodeAlreadyExistsError,
  CouponExpiredError,
  CouponNotFoundError,
  Discount,
  MinimumOrderNotMetError,
} from '../../../domain/index.js';
import { Money } from '@shared/domain/index.js';
import type { CouponRepository } from '../../ports/index.js';
import { CalculateDiscountUseCase } from './calculate-discount.use-case.js';

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

function seedCoupon(
  repository: FakeCouponRepository,
  overrides: Partial<Parameters<typeof Coupon.create>[0]> = {},
): Coupon {
  const coupon = Coupon.create({
    id: 'c-1',
    code: CouponCode.create('SUMMER10'),
    discount: Discount.percentage(10),
    validFrom: new Date('2020-01-01T00:00:00Z'),
    validUntil: new Date('2099-01-01T00:00:00Z'),
    now: new Date(),
    ...overrides,
  });
  repository.saved.set(coupon.code.value, coupon);
  return coupon;
}

const subtotal = { amount: 10000, currency: 'CRC' };

describe('CalculateDiscount', () => {
  let coupons: FakeCouponRepository;
  let calculate: CalculateDiscountUseCase;

  beforeEach(() => {
    coupons = new FakeCouponRepository();
    calculate = new CalculateDiscountUseCase(coupons);
  });

  it('quotes the discount and the new total', async () => {
    seedCoupon(coupons);

    const result = await calculate.execute({ code: 'summer10', subtotal });

    expect(result).toEqual({
      couponId: 'c-1',
      code: 'SUMMER10',
      subtotal,
      discount: { amount: 1000, currency: 'CRC' },
      total: { amount: 9000, currency: 'CRC' },
    });
  });

  it('does not use the coupon', async () => {
    const coupon = seedCoupon(coupons, { usageLimit: 1 });

    await calculate.execute({ code: 'SUMMER10', subtotal });

    expect(coupon.redemptions).toHaveLength(0);
    expect(coupon.remainingUses).toBe(1);
  });

  it('fails when the coupon does not exist', async () => {
    await expect(calculate.execute({ code: 'NOPE', subtotal })).rejects.toThrow(
      CouponNotFoundError,
    );
  });

  it('fails when the coupon has expired', async () => {
    seedCoupon(coupons, {
      validFrom: new Date('2020-01-01T00:00:00Z'),
      validUntil: new Date('2021-01-01T00:00:00Z'),
    });

    await expect(
      calculate.execute({ code: 'SUMMER10', subtotal }),
    ).rejects.toThrow(CouponExpiredError);
  });

  it('fails when the order is below the minimum', async () => {
    seedCoupon(coupons, { minimumOrder: Money.create(20000, 'CRC') });

    await expect(
      calculate.execute({ code: 'SUMMER10', subtotal }),
    ).rejects.toThrow(MinimumOrderNotMetError);
  });
});
