import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { CourierNotFoundError, Location } from '../../../domain/index.js';
import { COURIER_REPOSITORY } from '../../ports/index.js';
import type { CourierRepository } from '../../ports/index.js';
import { toCourierView, type CourierView } from '../courier-view.js';
import type { UpdateCourierLocationCommand } from './update-courier-location.command.js';

@Injectable()
export class UpdateCourierLocationUseCase implements UseCase<
  UpdateCourierLocationCommand,
  CourierView
> {
  constructor(
    @Inject(COURIER_REPOSITORY) private readonly couriers: CourierRepository,
  ) {}

  async execute(command: UpdateCourierLocationCommand): Promise<CourierView> {
    const courier = await this.couriers.findById(command.courierId);
    if (!courier) throw new CourierNotFoundError(command.courierId);

    courier.updateLocation(
      Location.create(command.location.latitude, command.location.longitude),
    );

    return toCourierView(await this.couriers.save(courier));
  }
}
