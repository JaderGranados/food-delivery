import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { Money } from '@shared/domain/index.js';
import { CouponCode, CouponNotFoundError } from '../../../domain/index.js';
import { COUPON_REPOSITORY } from '../../ports/index.js';
import type { CouponRepository } from '../../ports/index.js';
import type { CalculateDiscountCommand } from './calculate-discount.command.js';
import type { DiscountQuote } from './discount-quote.js';

/** Shows what a coupon would take off a subtotal, without using the coupon. */
@Injectable()
export class CalculateDiscountUseCase implements UseCase<
  CalculateDiscountCommand,
  DiscountQuote
> {
  constructor(
    @Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepository,
  ) {}

  async execute(command: CalculateDiscountCommand): Promise<DiscountQuote> {
    const code = CouponCode.create(command.code);
    const coupon = await this.coupons.findByCode(code.value);
    if (!coupon) throw new CouponNotFoundError(code.value);

    const subtotal = Money.create(
      command.subtotal.amount,
      command.subtotal.currency,
    );
    const discount = coupon.calculateDiscount(subtotal, new Date());

    return {
      couponId: coupon.id,
      code: coupon.code.value,
      subtotal: { amount: subtotal.amount, currency: subtotal.currency },
      discount: { amount: discount.amount, currency: discount.currency },
      total: {
        amount: subtotal.amount - discount.amount,
        currency: subtotal.currency,
      },
    };
  }
}
