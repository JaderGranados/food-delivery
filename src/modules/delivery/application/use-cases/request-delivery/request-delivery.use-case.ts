import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import {
  Delivery,
  DeliveryAlreadyRequestedError,
  Location,
  OrderNotConfirmedError,
  OrderNotFoundError,
} from '../../../domain/index.js';
import { DELIVERY_REPOSITORY, ORDER_LOOKUP } from '../../ports/index.js';
import type { DeliveryRepository, OrderLookup } from '../../ports/index.js';
import { toDeliveryView, type DeliveryView } from '../delivery-view.js';
import type { RequestDeliveryCommand } from './request-delivery.command.js';

@Injectable()
export class RequestDeliveryUseCase implements UseCase<
  RequestDeliveryCommand,
  DeliveryView
> {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveries: DeliveryRepository,
    @Inject(ORDER_LOOKUP) private readonly orders: OrderLookup,
  ) {}

  async execute(command: RequestDeliveryCommand): Promise<DeliveryView> {
    const pickup = Location.create(
      command.pickup.latitude,
      command.pickup.longitude,
    );
    const dropoff = Location.create(
      command.dropoff.latitude,
      command.dropoff.longitude,
    );

    const order = await this.orders.findOrder(command.orderId);
    if (!order) throw new OrderNotFoundError(command.orderId);
    if (order.status !== 'confirmed') {
      throw new OrderNotConfirmedError(command.orderId);
    }
    if (await this.deliveries.findByOrderId(command.orderId)) {
      throw new DeliveryAlreadyRequestedError(command.orderId);
    }

    const delivery = Delivery.request({
      id: randomUUID(),
      orderId: command.orderId,
      pickup,
      dropoff,
      now: new Date(),
    });

    return toDeliveryView(await this.deliveries.save(delivery));
  }
}
