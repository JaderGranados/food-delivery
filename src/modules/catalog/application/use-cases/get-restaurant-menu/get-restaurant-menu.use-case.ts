import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { RestaurantNotFoundError } from '../../../domain/index.js';
import { RESTAURANT_REPOSITORY } from '../../ports/index.js';
import type { RestaurantRepository } from '../../ports/index.js';
import { toMenuItemView } from '../menu-item-view.js';
import type { GetRestaurantMenuCommand } from './get-restaurant-menu.command.js';
import type { RestaurantMenu } from './restaurant-menu.js';

@Injectable()
export class GetRestaurantMenuUseCase implements UseCase<
  GetRestaurantMenuCommand,
  RestaurantMenu
> {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurants: RestaurantRepository,
  ) {}

  async execute(command: GetRestaurantMenuCommand): Promise<RestaurantMenu> {
    const restaurant = await this.restaurants.findById(command.restaurantId);
    if (!restaurant) throw new RestaurantNotFoundError(command.restaurantId);

    return {
      restaurantId: restaurant.id,
      name: restaurant.name,
      items: restaurant.menu.map(toMenuItemView),
    };
  }
}
