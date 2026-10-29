import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  CalculateDiscountUseCase,
  CreateCouponUseCase,
  GetCouponUseCase,
  RedeemCouponUseCase,
  type CouponView,
  type DiscountInput,
  type DiscountQuote,
  type RedeemedCoupon,
} from '../../application/index.js';
import {
  CalculateDiscountDto,
  CreateCouponDto,
  RedeemCouponDto,
  type DiscountDto,
} from './dtos/index.js';
import { Controller as BaseController } from '@shared/infrastructure/index.js';

function toDiscountInput(dto: DiscountDto): DiscountInput {
  return dto.type === 'percentage'
    ? { type: 'percentage', percent: dto.percent! }
    : { type: 'fixed', amount: dto.amount!, currency: dto.currency! };
}

@Controller('coupons')
export class CouponsController extends BaseController {
  constructor(
    private readonly createCoupon: CreateCouponUseCase,
    private readonly calculateDiscount: CalculateDiscountUseCase,
    private readonly redeemCoupon: RedeemCouponUseCase,
    private readonly getCoupon: GetCouponUseCase,
  ) {
    super();
  }

  @Post()
  async create(@Body() body: CreateCouponDto): Promise<CouponView> {
    try {
      return await this.createCoupon.execute({
        code: body.code,
        discount: toDiscountInput(body.discount),
        minimumOrder: body.minimumOrder && {
          amount: body.minimumOrder.amount,
          currency: body.minimumOrder.currency,
        },
        validFrom: new Date(body.validFrom),
        validUntil: new Date(body.validUntil),
        usageLimit: body.usageLimit,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get(':code')
  async get(@Param('code') code: string): Promise<CouponView> {
    try {
      return await this.getCoupon.execute({ code });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post(':code/discount')
  @HttpCode(HttpStatus.OK)
  async discount(
    @Param('code') code: string,
    @Body() body: CalculateDiscountDto,
  ): Promise<DiscountQuote> {
    try {
      return await this.calculateDiscount.execute({
        code,
        subtotal: {
          amount: body.subtotal.amount,
          currency: body.subtotal.currency,
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post(':code/redeem')
  async redeem(
    @Param('code') code: string,
    @Body() body: RedeemCouponDto,
  ): Promise<RedeemedCoupon> {
    try {
      return await this.redeemCoupon.execute({
        code,
        orderId: body.orderId,
        subtotal: {
          amount: body.subtotal.amount,
          currency: body.subtotal.currency,
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }
}
