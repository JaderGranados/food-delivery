import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { OpeningHours, Restaurant } from '../../../domain/index.js';
import { RESTAURANT_REPOSITORY } from '../../ports/index.js';
import type { RestaurantRepository } from '../../ports/index.js';
import type { RegisterRestaurantCommand } from './register-restaurant.command.js';
import type { RegisteredRestaurant } from './registered-restaurant.js';

@Injectable()
export class RegisterRestaurantUseCase implements UseCase<
  RegisterRestaurantCommand,
  RegisteredRestaurant
> {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurants: RestaurantRepository,
  ) {}

  async execute(
    command: RegisterRestaurantCommand,
  ): Promise<RegisteredRestaurant> {
    const restaurant = Restaurant.register({
      id: randomUUID(),
      name: command.name,
      openingHours: OpeningHours.create(command.openingHours),
      now: new Date(),
    });

    const saved = await this.restaurants.save(restaurant);

    return {
      id: saved.id,
      name: saved.name,
      openingHours: saved.openingHours.slots.map((slot) => ({ ...slot })),
      createdAt: saved.createdAt,
    };
  }
}
