import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { OrderNotFoundError } from '../../../domain/index.js';
import { ORDER_REPOSITORY } from '../../ports/index.js';
import type { OrderRepository } from '../../ports/index.js';
import { toOrderView, type OrderView } from '../order-view.js';
import type { GetOrderCommand } from './get-order.command.js';

@Injectable()
export class GetOrderUseCase implements UseCase<GetOrderCommand, OrderView> {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
  ) {}

  async execute(command: GetOrderCommand): Promise<OrderView> {
    const order = await this.orders.findById(command.orderId);
    if (!order) throw new OrderNotFoundError(command.orderId);

    return toOrderView(order);
  }
}
