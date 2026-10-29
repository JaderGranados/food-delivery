import {
  Coupon,
  CouponAlreadyRedeemedForOrderError,
  CouponCode,
  CouponCodeAlreadyExistsError,
  CouponNotFoundError,
  CouponUsageLimitReachedError,
  Discount,
} from '../../../domain/index.js';
import type { CouponRepository } from '../../ports/index.js';
import { RedeemCouponUseCase } from './redeem-coupon.use-case.js';

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

describe('RedeemCoupon', () => {
  let coupons: FakeCouponRepository;
  let redeem: RedeemCouponUseCase;

  beforeEach(() => {
    coupons = new FakeCouponRepository();
    redeem = new RedeemCouponUseCase(coupons);
  });

  it('redeems the coupon for an order', async () => {
    seedCoupon(coupons);

    const result = await redeem.execute({
      code: 'summer10',
      orderId: 'o-1',
      subtotal,
    });

    expect(result).toEqual({
      couponId: 'c-1',
      code: 'SUMMER10',
      orderId: 'o-1',
      subtotal,
      discount: { amount: 1000, currency: 'CRC' },
      total: { amount: 9000, currency: 'CRC' },
      redeemedAt: expect.any(Date),
    });
    expect(coupons.saved.get('SUMMER10')?.redemptions).toHaveLength(1);
  });

  it('fails when the coupon does not exist', async () => {
    await expect(
      redeem.execute({ code: 'NOPE', orderId: 'o-1', subtotal }),
    ).rejects.toThrow(CouponNotFoundError);
  });

  it('fails when the order already used the coupon', async () => {
    seedCoupon(coupons);
    await redeem.execute({ code: 'SUMMER10', orderId: 'o-1', subtotal });

    await expect(
      redeem.execute({ code: 'SUMMER10', orderId: 'o-1', subtotal }),
    ).rejects.toThrow(CouponAlreadyRedeemedForOrderError);
  });

  it('stops at the usage limit', async () => {
    seedCoupon(coupons, { usageLimit: 1 });
    await redeem.execute({ code: 'SUMMER10', orderId: 'o-1', subtotal });

    await expect(
      redeem.execute({ code: 'SUMMER10', orderId: 'o-2', subtotal }),
    ).rejects.toThrow(CouponUsageLimitReachedError);
  });

  it('never redeems more than the limit when requests arrive together', async () => {
    seedCoupon(coupons, { usageLimit: 1 });

    const results = await Promise.allSettled([
      redeem.execute({ code: 'SUMMER10', orderId: 'o-1', subtotal }),
      redeem.execute({ code: 'SUMMER10', orderId: 'o-2', subtotal }),
      redeem.execute({ code: 'SUMMER10', orderId: 'o-3', subtotal }),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(coupons.saved.get('SUMMER10')?.redemptions).toHaveLength(1);
  });

  it('does not redeem an order twice when requests arrive together', async () => {
    seedCoupon(coupons);

    const results = await Promise.allSettled([
      redeem.execute({ code: 'SUMMER10', orderId: 'o-1', subtotal }),
      redeem.execute({ code: 'SUMMER10', orderId: 'o-1', subtotal }),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(coupons.saved.get('SUMMER10')?.redemptions).toHaveLength(1);
  });
});
