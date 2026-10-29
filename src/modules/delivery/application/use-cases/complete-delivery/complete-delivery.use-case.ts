import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import {
  CourierNotFoundError,
  DeliveryNotFoundError,
} from '../../../domain/index.js';
import { COURIER_REPOSITORY, DELIVERY_REPOSITORY } from '../../ports/index.js';
import type {
  CourierRepository,
  DeliveryRepository,
} from '../../ports/index.js';
import { toDeliveryView, type DeliveryView } from '../delivery-view.js';
import type { CompleteDeliveryCommand } from './complete-delivery.command.js';

/** Marks the delivery as delivered and frees the courier for the next one. */
@Injectable()
export class CompleteDeliveryUseCase implements UseCase<
  CompleteDeliveryCommand,
  DeliveryView
> {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveries: DeliveryRepository,
    @Inject(COURIER_REPOSITORY) private readonly couriers: CourierRepository,
  ) {}

  async execute(command: CompleteDeliveryCommand): Promise<DeliveryView> {
    const delivery = await this.deliveries.findById(command.deliveryId);
    if (!delivery) throw new DeliveryNotFoundError(command.deliveryId);

    // Only a delivery that already has a courier can be delivered; check the
    // courier before touching the delivery so a failure leaves both unchanged.
    const courierId = delivery.courierId;
    const courier = courierId ? await this.couriers.findById(courierId) : null;
    if (courierId && !courier) throw new CourierNotFoundError(courierId);

    courier?.release();
    try {
      delivery.complete();
    } catch (error) {
      courier?.assign();
      throw error;
    }
    if (courier) await this.couriers.save(courier);

    return toDeliveryView(await this.deliveries.save(delivery));
  }
}
