import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { Money } from '@shared/domain/index.js';
import { CouponCode, CouponNotFoundError } from '../../../domain/index.js';
import { COUPON_REPOSITORY } from '../../ports/index.js';
import type { CouponRepository } from '../../ports/index.js';
import type { RedeemCouponCommand } from './redeem-coupon.command.js';
import type { RedeemedCoupon } from './redeemed-coupon.js';

/** Uses a coupon on an order. The caller supplies the order's subtotal. */
@Injectable()
export class RedeemCouponUseCase implements UseCase<
  RedeemCouponCommand,
  RedeemedCoupon
> {
  constructor(
    @Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepository,
  ) {}

  async execute(command: RedeemCouponCommand): Promise<RedeemedCoupon> {
    const code = CouponCode.create(command.code);
    const coupon = await this.coupons.findByCode(code.value);
    if (!coupon) throw new CouponNotFoundError(code.value);

    const subtotal = Money.create(
      command.subtotal.amount,
      command.subtotal.currency,
    );
    const redemption = coupon.redeem({
      orderId: command.orderId,
      subtotal,
      now: new Date(),
    });
    await this.coupons.save(coupon);

    return {
      couponId: coupon.id,
      code: coupon.code.value,
      orderId: redemption.orderId,
      subtotal: { amount: subtotal.amount, currency: subtotal.currency },
      discount: {
        amount: redemption.discount.amount,
        currency: redemption.discount.currency,
      },
      total: {
        amount: subtotal.amount - redemption.discount.amount,
        currency: subtotal.currency,
      },
      redeemedAt: redemption.redeemedAt,
    };
  }
}
