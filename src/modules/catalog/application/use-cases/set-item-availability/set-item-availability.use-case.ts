import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { RestaurantNotFoundError } from '../../../domain/index.js';
import { RESTAURANT_REPOSITORY } from '../../ports/index.js';
import type { RestaurantRepository } from '../../ports/index.js';
import { toMenuItemView, type MenuItemView } from '../menu-item-view.js';
import type { SetItemAvailabilityCommand } from './set-item-availability.command.js';

@Injectable()
export class SetItemAvailabilityUseCase implements UseCase<
  SetItemAvailabilityCommand,
  MenuItemView
> {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurants: RestaurantRepository,
  ) {}

  async execute(command: SetItemAvailabilityCommand): Promise<MenuItemView> {
    const restaurant = await this.restaurants.findById(command.restaurantId);
    if (!restaurant) throw new RestaurantNotFoundError(command.restaurantId);

    const item = restaurant.setItemAvailability(
      command.menuItemId,
      command.available,
    );
    await this.restaurants.save(restaurant);

    return toMenuItemView(item);
  }
}
