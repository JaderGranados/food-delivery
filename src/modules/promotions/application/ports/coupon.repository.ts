import type { Coupon } from '../../domain/index.js';

export interface CouponRepository {
  /** `code` is the normalized (upper-case) coupon code. */
  findByCode(code: string): Promise<Coupon | null>;
  /**
   * Inserts a new coupon. Like a unique index, it must fail atomically with
   * `CouponCodeAlreadyExistsError` when the code is taken.
   */
  add(coupon: Coupon): Promise<Coupon>;
  save(coupon: Coupon): Promise<Coupon>;
}
