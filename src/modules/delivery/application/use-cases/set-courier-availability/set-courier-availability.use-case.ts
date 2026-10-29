import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import {
  ArgumentRequiredError,
  CourierNotFoundError,
  Location,
} from '../../../domain/index.js';
import { COURIER_REPOSITORY } from '../../ports/index.js';
import type { CourierRepository } from '../../ports/index.js';
import { toCourierView, type CourierView } from '../courier-view.js';
import type { SetCourierAvailabilityCommand } from './set-courier-availability.command.js';

@Injectable()
export class SetCourierAvailabilityUseCase implements UseCase<
  SetCourierAvailabilityCommand,
  CourierView
> {
  constructor(
    @Inject(COURIER_REPOSITORY) private readonly couriers: CourierRepository,
  ) {}

  async execute(command: SetCourierAvailabilityCommand): Promise<CourierView> {
    const courier = await this.couriers.findById(command.courierId);
    if (!courier) throw new CourierNotFoundError(command.courierId);

    if (command.available) {
      if (!command.location) throw new ArgumentRequiredError('Location');
      courier.goOnline(
        Location.create(command.location.latitude, command.location.longitude),
      );
    } else {
      courier.goOffline();
    }

    return toCourierView(await this.couriers.save(courier));
  }
}
