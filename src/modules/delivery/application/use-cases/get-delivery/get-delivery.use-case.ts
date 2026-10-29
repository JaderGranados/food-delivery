import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { DeliveryNotFoundError } from '../../../domain/index.js';
import { DELIVERY_REPOSITORY } from '../../ports/index.js';
import type { DeliveryRepository } from '../../ports/index.js';
import { toDeliveryView, type DeliveryView } from '../delivery-view.js';
import type { GetDeliveryCommand } from './get-delivery.command.js';

@Injectable()
export class GetDeliveryUseCase implements UseCase<
  GetDeliveryCommand,
  DeliveryView
> {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveries: DeliveryRepository,
  ) {}

  async execute(command: GetDeliveryCommand): Promise<DeliveryView> {
    const delivery = await this.deliveries.findById(command.deliveryId);
    if (!delivery) throw new DeliveryNotFoundError(command.deliveryId);

    return toDeliveryView(delivery);
  }
}
