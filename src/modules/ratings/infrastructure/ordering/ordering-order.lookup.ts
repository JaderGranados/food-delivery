import { Injectable } from '@nestjs/common';
import { GetOrderUseCase } from '@modules/ordering/application/index.js';
import { NotFoundError } from '@shared/domain/index.js';
import type { OrderLookup, OrderSummary } from '../../application/index.js';

/** Reads orders from the ordering context through its public application API. */
@Injectable()
export class OrderingOrderLookup implements OrderLookup {
  constructor(private readonly getOrder: GetOrderUseCase) {}

  async findOrder(orderId: string): Promise<OrderSummary | null> {
    try {
      const order = await this.getOrder.execute({ orderId });
      return {
        id: order.id,
        customerId: order.customerId,
        restaurantId: order.restaurantId,
      };
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  }
}
