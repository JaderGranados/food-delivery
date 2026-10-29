import { Injectable } from '@nestjs/common';
import { GetDeliveryByOrderUseCase } from '@modules/delivery/application/index.js';
import { NotFoundError } from '@shared/domain/index.js';
import type {
  DeliveryLookup,
  DeliverySummary,
} from '../../application/index.js';

/** Reads deliveries from the delivery context through its public application API. */
@Injectable()
export class DeliveryByOrderLookup implements DeliveryLookup {
  constructor(private readonly getDeliveryByOrder: GetDeliveryByOrderUseCase) {}

  async findDeliveryByOrder(orderId: string): Promise<DeliverySummary | null> {
    try {
      const delivery = await this.getDeliveryByOrder.execute({ orderId });
      return { status: delivery.status, courierId: delivery.courierId };
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  }
}
