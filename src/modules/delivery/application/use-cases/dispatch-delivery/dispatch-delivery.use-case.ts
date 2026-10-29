import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import {
  DeliveryNotFoundError,
  NoCourierAvailableError,
} from '../../../domain/index.js';
import { COURIER_REPOSITORY, DELIVERY_REPOSITORY } from '../../ports/index.js';
import type {
  CourierRepository,
  DeliveryRepository,
} from '../../ports/index.js';
import { toDeliveryView, type DeliveryView } from '../delivery-view.js';
import type { DispatchDeliveryCommand } from './dispatch-delivery.command.js';

/** Assigns a pending delivery to the available courier nearest to the pickup. */
@Injectable()
export class DispatchDeliveryUseCase implements UseCase<
  DispatchDeliveryCommand,
  DeliveryView
> {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveries: DeliveryRepository,
    @Inject(COURIER_REPOSITORY) private readonly couriers: CourierRepository,
  ) {}

  async execute(command: DispatchDeliveryCommand): Promise<DeliveryView> {
    const delivery = await this.deliveries.findById(command.deliveryId);
    if (!delivery) throw new DeliveryNotFoundError(command.deliveryId);

    const available = await this.couriers.findAvailable();
    if (available.length === 0) throw new NoCourierAvailableError();

    const nearest = available.reduce((best, candidate) =>
      candidate.distanceTo(delivery.pickup) < best.distanceTo(delivery.pickup)
        ? candidate
        : best,
    );

    // The courier may have been taken since the list was read; check that
    // first so a failure never leaves the delivery half-assigned.
    nearest.assign();
    try {
      delivery.assignTo(nearest.id);
    } catch (error) {
      nearest.release();
      throw error;
    }
    await this.couriers.save(nearest);

    return toDeliveryView(await this.deliveries.save(delivery));
  }
}
