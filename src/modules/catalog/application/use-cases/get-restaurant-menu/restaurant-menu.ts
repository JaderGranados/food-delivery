import type { MenuItemView } from '../menu-item-view.js';

export interface RestaurantMenu {
  restaurantId: string;
  name: string;
  items: MenuItemView[];
}
