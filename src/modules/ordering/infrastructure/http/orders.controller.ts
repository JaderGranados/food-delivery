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
  CancelOrderUseCase,
  ConfirmOrderUseCase,
  GetOrderUseCase,
  PlaceOrderUseCase,
  type OrderView,
} from '../../application/index.js';
import { PlaceOrderDto } from './dtos/index.js';
import { Controller as BaseController } from '@shared/infrastructure/index.js';

@Controller('orders')
export class OrdersController extends BaseController {
  constructor(
    private readonly placeOrder: PlaceOrderUseCase,
    private readonly confirmOrder: ConfirmOrderUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
  ) {
    super();
  }

  @Post()
  async place(@Body() body: PlaceOrderDto): Promise<OrderView> {
    try {
      return await this.placeOrder.execute({
        customerId: body.customerId,
        restaurantId: body.restaurantId,
        items: body.items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(@Param('id') orderId: string): Promise<OrderView> {
    try {
      return await this.confirmOrder.execute({ orderId });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') orderId: string): Promise<OrderView> {
    try {
      return await this.cancelOrder.execute({ orderId });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get(':id')
  async get(@Param('id') orderId: string): Promise<OrderView> {
    try {
      return await this.getOrder.execute({ orderId });
    } catch (error) {
      this.handleError(error);
    }
  }
}
