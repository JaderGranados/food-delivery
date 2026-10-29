import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { Money } from '@shared/domain/index.js';
import {
  MenuItemNotFoundError,
  MenuItemUnavailableError,
  Order,
  OrderLine,
  RestaurantNotFoundError,
} from '../../../domain/index.js';
import { MENU_PRICE_PROVIDER, ORDER_REPOSITORY } from '../../ports/index.js';
import type { MenuPriceProvider, OrderRepository } from '../../ports/index.js';
import { toOrderView, type OrderView } from '../order-view.js';
import type { PlaceOrderCommand } from './place-order.command.js';

@Injectable()
export class PlaceOrderUseCase implements UseCase<
  PlaceOrderCommand,
  OrderView
> {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(MENU_PRICE_PROVIDER) private readonly menus: MenuPriceProvider,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<OrderView> {
    const menu = await this.menus.getMenu(command.restaurantId);
    if (!menu) throw new RestaurantNotFoundError(command.restaurantId);

    const lines = command.items.map(({ menuItemId, quantity }) => {
      const item = menu.items.find((candidate) => candidate.id === menuItemId);
      if (!item) throw new MenuItemNotFoundError(menuItemId);
      if (!item.available) throw new MenuItemUnavailableError(menuItemId);
      return OrderLine.create({
        menuItemId,
        name: item.name,
        unitPrice: Money.create(item.price.amount, item.price.currency),
        quantity,
      });
    });

    const order = Order.place({
      id: randomUUID(),
      customerId: command.customerId,
      restaurantId: command.restaurantId,
      lines,
      now: new Date(),
    });

    return toOrderView(await this.orders.save(order));
  }
}
