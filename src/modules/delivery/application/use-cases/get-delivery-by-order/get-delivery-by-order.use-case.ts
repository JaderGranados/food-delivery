import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { DeliveryNotFoundError } from '../../../domain/index.js';
import { DELIVERY_REPOSITORY } from '../../ports/index.js';
import type { DeliveryRepository } from '../../ports/index.js';
import { toDeliveryView, type DeliveryView } from '../delivery-view.js';
import type { GetDeliveryByOrderCommand } from './get-delivery-by-order.command.js';

/** Looks a delivery up by the order it carries, for other contexts. */
@Injectable()
export class GetDeliveryByOrderUseCase implements UseCase<
  GetDeliveryByOrderCommand,
  DeliveryView
> {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveries: DeliveryRepository,
  ) {}

  async execute(command: GetDeliveryByOrderCommand): Promise<DeliveryView> {
    const delivery = await this.deliveries.findByOrderId(command.orderId);
    if (!delivery) throw new DeliveryNotFoundError(command.orderId);

    return toDeliveryView(delivery);
  }
}
