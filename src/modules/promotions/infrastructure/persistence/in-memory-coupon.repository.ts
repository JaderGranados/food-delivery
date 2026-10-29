import { Injectable } from '@nestjs/common';
import {
  CouponCodeAlreadyExistsError,
  type Coupon,
} from '../../domain/index.js';
import type { CouponRepository } from '../../application/index.js';

@Injectable()
export class InMemoryCouponRepository implements CouponRepository {
  private readonly couponsByCode = new Map<string, Coupon>();

  async findByCode(code: string): Promise<Coupon | null> {
    return this.couponsByCode.get(code) ?? null;
  }

  // No `await` between the check and the insert, so it is atomic.
  async add(coupon: Coupon): Promise<Coupon> {
    if (this.couponsByCode.has(coupon.code.value)) {
      throw new CouponCodeAlreadyExistsError(coupon.code.value);
    }
    this.couponsByCode.set(coupon.code.value, coupon);
    return coupon;
  }

  async save(coupon: Coupon): Promise<Coupon> {
    this.couponsByCode.set(coupon.code.value, coupon);
    return coupon;
  }
}
