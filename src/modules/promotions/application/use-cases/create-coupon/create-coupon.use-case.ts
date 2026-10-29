import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { Money } from '@shared/domain/index.js';
import { Coupon, CouponCode, Discount } from '../../../domain/index.js';
import { COUPON_REPOSITORY } from '../../ports/index.js';
import type { CouponRepository } from '../../ports/index.js';
import { toCouponView, type CouponView } from '../coupon-view.js';
import type { CreateCouponCommand } from './create-coupon.command.js';

@Injectable()
export class CreateCouponUseCase implements UseCase<
  CreateCouponCommand,
  CouponView
> {
  constructor(
    @Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepository,
  ) {}

  async execute(command: CreateCouponCommand): Promise<CouponView> {
    const { discount } = command;
    const coupon = Coupon.create({
      id: randomUUID(),
      code: CouponCode.create(command.code),
      discount:
        discount.type === 'percentage'
          ? Discount.percentage(discount.percent)
          : Discount.fixed(Money.create(discount.amount, discount.currency)),
      minimumOrder: command.minimumOrder
        ? Money.create(
            command.minimumOrder.amount,
            command.minimumOrder.currency,
          )
        : undefined,
      validFrom: command.validFrom,
      validUntil: command.validUntil,
      usageLimit: command.usageLimit,
      now: new Date(),
    });

    return toCouponView(await this.coupons.add(coupon));
  }
}
