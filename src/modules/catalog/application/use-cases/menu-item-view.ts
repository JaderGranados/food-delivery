import type { MenuItem } from '../../domain/index.js';

export interface MenuItemView {
  id: string;
  name: string;
  description?: string;
  price: { amount: number; currency: string };
  available: boolean;
}

export function toMenuItemView(item: MenuItem): MenuItemView {
  return {
    id: item.id,
    name: item.name,
    ...(item.description && { description: item.description }),
    price: { amount: item.price.amount, currency: item.price.currency },
    available: item.available,
  };
}
