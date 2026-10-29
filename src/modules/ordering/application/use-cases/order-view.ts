import type { Order, OrderStatus } from '../../domain/index.js';

export interface OrderView {
  id: string;
  customerId: string;
  restaurantId: string;
  status: OrderStatus;
  items: {
    menuItemId: string;
    name: string;
    unitPrice: { amount: number; currency: string };
    quantity: number;
    lineTotal: { amount: number; currency: string };
  }[];
  total: { amount: number; currency: string };
  createdAt: Date;
}

export function toOrderView(order: Order): OrderView {
  return {
    id: order.id,
    customerId: order.customerId,
    restaurantId: order.restaurantId,
    status: order.status,
    items: order.lines.map((line) => ({
      menuItemId: line.menuItemId,
      name: line.name,
      unitPrice: {
        amount: line.unitPrice.amount,
        currency: line.unitPrice.currency,
      },
      quantity: line.quantity,
      lineTotal: { amount: line.total.amount, currency: line.total.currency },
    })),
    total: { amount: order.total.amount, currency: order.total.currency },
    createdAt: order.createdAt,
  };
}
