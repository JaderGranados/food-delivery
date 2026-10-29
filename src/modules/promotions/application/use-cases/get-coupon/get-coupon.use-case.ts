import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { CouponCode, CouponNotFoundError } from '../../../domain/index.js';
import { COUPON_REPOSITORY } from '../../ports/index.js';
import type { CouponRepository } from '../../ports/index.js';
import { toCouponView, type CouponView } from '../coupon-view.js';
import type { GetCouponCommand } from './get-coupon.command.js';

@Injectable()
export class GetCouponUseCase implements UseCase<GetCouponCommand, CouponView> {
  constructor(
    @Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepository,
  ) {}

  async execute(command: GetCouponCommand): Promise<CouponView> {
    const code = CouponCode.create(command.code);
    const coupon = await this.coupons.findByCode(code.value);
    if (!coupon) throw new CouponNotFoundError(code.value);

    return toCouponView(coupon);
  }
}
