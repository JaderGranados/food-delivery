import {
  Coupon,
  CouponCode,
  CouponCodeAlreadyExistsError,
  CouponNotFoundError,
  Discount,
} from '../../../domain/index.js';
import { Money } from '@shared/domain/index.js';
import type { CouponRepository } from '../../ports/index.js';
import { GetCouponUseCase } from './get-coupon.use-case.js';

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

describe('GetCoupon', () => {
  let coupons: FakeCouponRepository;
  let getCoupon: GetCouponUseCase;

  beforeEach(() => {
    coupons = new FakeCouponRepository();
    getCoupon = new GetCouponUseCase(coupons);
  });

  it('returns the coupon with its usage', async () => {
    const coupon = seedCoupon(coupons, { usageLimit: 3 });
    coupon.redeem({
      orderId: 'o-1',
      subtotal: Money.create(10000, 'CRC'),
      now: new Date(),
    });

    const result = await getCoupon.execute({ code: 'summer10' });

    expect(result).toMatchObject({
      code: 'SUMMER10',
      discount: { type: 'percentage', percent: 10 },
      usageLimit: 3,
      remainingUses: 2,
      redemptionCount: 1,
    });
  });

  it('fails when the coupon does not exist', async () => {
    await expect(getCoupon.execute({ code: 'NOPE' })).rejects.toThrow(
      CouponNotFoundError,
    );
  });
});
