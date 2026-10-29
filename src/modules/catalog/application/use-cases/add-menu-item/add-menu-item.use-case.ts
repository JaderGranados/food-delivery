import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { Money } from '@shared/domain/index.js';
import { RestaurantNotFoundError } from '../../../domain/index.js';
import { RESTAURANT_REPOSITORY } from '../../ports/index.js';
import type { RestaurantRepository } from '../../ports/index.js';
import { toMenuItemView, type MenuItemView } from '../menu-item-view.js';
import type { AddMenuItemCommand } from './add-menu-item.command.js';

@Injectable()
export class AddMenuItemUseCase implements UseCase<
  AddMenuItemCommand,
  MenuItemView
> {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurants: RestaurantRepository,
  ) {}

  async execute(command: AddMenuItemCommand): Promise<MenuItemView> {
    const restaurant = await this.restaurants.findById(command.restaurantId);
    if (!restaurant) throw new RestaurantNotFoundError(command.restaurantId);

    const item = restaurant.addMenuItem({
      id: randomUUID(),
      name: command.name,
      description: command.description,
      price: Money.create(command.price.amount, command.price.currency),
    });
    await this.restaurants.save(restaurant);

    return toMenuItemView(item);
  }
}
