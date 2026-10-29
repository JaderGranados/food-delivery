import { ArgumentRequiredError, MenuItemNotFoundError } from './errors.js';
import { MenuItem, type CreateMenuItemProps } from './menu-item.js';
import type { OpeningHours } from './value-objects/index.js';

export interface RegisterRestaurantProps {
  id: string;
  name: string;
  openingHours: OpeningHours;
  now: Date;
}

export class Restaurant {
  private readonly items: MenuItem[] = [];

  private constructor(
    readonly id: string,
    readonly name: string,
    readonly openingHours: OpeningHours,
    readonly createdAt: Date,
  ) {}

  static register({
    id,
    name,
    openingHours,
    now,
  }: RegisterRestaurantProps): Restaurant {
    if (!id) throw new ArgumentRequiredError('ID');
    if (!name?.trim()) throw new ArgumentRequiredError('Name');
    return new Restaurant(id, name.trim(), openingHours, now);
  }

  get menu(): readonly MenuItem[] {
    return [...this.items];
  }

  addMenuItem(props: CreateMenuItemProps): MenuItem {
    const item = MenuItem.create(props);
    this.items.push(item);
    return item;
  }

  setItemAvailability(menuItemId: string, available: boolean): MenuItem {
    const item = this.items.find((candidate) => candidate.id === menuItemId);
    if (!item) throw new MenuItemNotFoundError(menuItemId);
    item.setAvailability(available);
    return item;
  }
}
