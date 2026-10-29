import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { Courier } from '../../../domain/index.js';
import { COURIER_REPOSITORY } from '../../ports/index.js';
import type { CourierRepository } from '../../ports/index.js';
import { toCourierView, type CourierView } from '../courier-view.js';
import type { RegisterCourierCommand } from './register-courier.command.js';

@Injectable()
export class RegisterCourierUseCase implements UseCase<
  RegisterCourierCommand,
  CourierView
> {
  constructor(
    @Inject(COURIER_REPOSITORY) private readonly couriers: CourierRepository,
  ) {}

  async execute(command: RegisterCourierCommand): Promise<CourierView> {
    const courier = Courier.register({
      id: randomUUID(),
      name: command.name,
      now: new Date(),
    });

    return toCourierView(await this.couriers.save(courier));
  }
}
