import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { DeliveryNotFoundError } from '../../../domain/index.js';
import { DELIVERY_REPOSITORY } from '../../ports/index.js';
import type { DeliveryRepository } from '../../ports/index.js';
import { toDeliveryView, type DeliveryView } from '../delivery-view.js';
import type { PickUpDeliveryCommand } from './pick-up-delivery.command.js';

@Injectable()
export class PickUpDeliveryUseCase implements UseCase<
  PickUpDeliveryCommand,
  DeliveryView
> {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveries: DeliveryRepository,
  ) {}

  async execute(command: PickUpDeliveryCommand): Promise<DeliveryView> {
    const delivery = await this.deliveries.findById(command.deliveryId);
    if (!delivery) throw new DeliveryNotFoundError(command.deliveryId);

    delivery.pickUp();

    return toDeliveryView(await this.deliveries.save(delivery));
  }
}
