import { Injectable } from '@nestjs/common';
import { GetRestaurantMenuUseCase } from '@modules/catalog/application/index.js';
import { NotFoundError } from '@shared/domain/index.js';
import type {
  MenuPriceProvider,
  MenuSnapshot,
} from '../../application/index.js';

/** Reads menus from the catalog context through its public application API. */
@Injectable()
export class CatalogMenuPriceProvider implements MenuPriceProvider {
  constructor(private readonly getRestaurantMenu: GetRestaurantMenuUseCase) {}

  async getMenu(restaurantId: string): Promise<MenuSnapshot | null> {
    try {
      const menu = await this.getRestaurantMenu.execute({ restaurantId });
      return {
        restaurantId: menu.restaurantId,
        items: menu.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: { amount: item.price.amount, currency: item.price.currency },
          available: item.available,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  }
}
