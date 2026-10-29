import { Module } from '@nestjs/common';
import {
  CalculateDiscountUseCase,
  COUPON_REPOSITORY,
  CreateCouponUseCase,
  GetCouponUseCase,
  RedeemCouponUseCase,
} from '../application/index.js';
import { CouponsController } from './http/index.js';
import { InMemoryCouponRepository } from './persistence/index.js';

@Module({
  controllers: [CouponsController],
  providers: [
    CreateCouponUseCase,
    CalculateDiscountUseCase,
    RedeemCouponUseCase,
    GetCouponUseCase,
    { provide: COUPON_REPOSITORY, useClass: InMemoryCouponRepository },
  ],
})
export class PromotionsModule {}
