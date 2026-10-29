import {
  MenuItemNotFoundError,
  MenuItemUnavailableError,
  RestaurantNotFoundError,
  type Order,
} from '../../../domain/index.js';
import type {
  MenuPriceProvider,
  MenuSnapshot,
  OrderRepository,
} from '../../ports/index.js';
import { PlaceOrderUseCase } from './place-order.use-case.js';

class FakeOrderRepository implements OrderRepository {
  readonly saved = new Map<string, Order>();

  findById(id: string): Promise<Order | null> {
    return Promise.resolve(this.saved.get(id) ?? null);
  }

  save(order: Order): Promise<Order> {
    this.saved.set(order.id, order);
    return Promise.resolve(order);
  }
}

class FakeMenuPriceProvider implements MenuPriceProvider {
  menu: MenuSnapshot | null = {
    restaurantId: 'r-1',
    items: [
      {
        id: 'i-1',
        name: 'Casado',
        price: { amount: 350000, currency: 'CRC' },
        available: true,
      },
      {
        id: 'i-2',
        name: 'Gallo pinto',
        price: { amount: 200000, currency: 'CRC' },
        available: false,
      },
    ],
  };

  getMenu(): Promise<MenuSnapshot | null> {
    return Promise.resolve(this.menu);
  }
}

describe('PlaceOrder', () => {
  let orders: FakeOrderRepository;
  let menus: FakeMenuPriceProvider;
  let placeOrder: PlaceOrderUseCase;

  beforeEach(() => {
    orders = new FakeOrderRepository();
    menus = new FakeMenuPriceProvider();
    placeOrder = new PlaceOrderUseCase(orders, menus);
  });

  it('places an order with a snapshot of names and prices', async () => {
    const result = await placeOrder.execute({
      customerId: 'c-1',
      restaurantId: 'r-1',
      items: [{ menuItemId: 'i-1', quantity: 2 }],
    });

    expect(result).toEqual({
      id: expect.any(String),
      customerId: 'c-1',
      restaurantId: 'r-1',
      status: 'placed',
      items: [
        {
          menuItemId: 'i-1',
          name: 'Casado',
          unitPrice: { amount: 350000, currency: 'CRC' },
          quantity: 2,
          lineTotal: { amount: 700000, currency: 'CRC' },
        },
      ],
      total: { amount: 700000, currency: 'CRC' },
      createdAt: expect.any(Date),
    });
    expect(orders.saved.has(result.id)).toBe(true);
  });

  it('keeps the snapshot when the catalog price changes later', async () => {
    const result = await placeOrder.execute({
      customerId: 'c-1',
      restaurantId: 'r-1',
      items: [{ menuItemId: 'i-1', quantity: 1 }],
    });
    menus.menu!.items[0].price.amount = 999999;

    const stored = orders.saved.get(result.id)!;

    expect(stored.total.amount).toBe(350000);
  });

  it('fails when the restaurant does not exist', async () => {
    menus.menu = null;

    await expect(
      placeOrder.execute({
        customerId: 'c-1',
        restaurantId: 'nope',
        items: [{ menuItemId: 'i-1', quantity: 1 }],
      }),
    ).rejects.toThrow(RestaurantNotFoundError);
  });

  it('fails when a menu item does not exist', async () => {
    await expect(
      placeOrder.execute({
        customerId: 'c-1',
        restaurantId: 'r-1',
        items: [{ menuItemId: 'nope', quantity: 1 }],
      }),
    ).rejects.toThrow(MenuItemNotFoundError);
    expect(orders.saved.size).toBe(0);
  });

  it('fails when a menu item is unavailable', async () => {
    await expect(
      placeOrder.execute({
        customerId: 'c-1',
        restaurantId: 'r-1',
        items: [{ menuItemId: 'i-2', quantity: 1 }],
      }),
    ).rejects.toThrow(MenuItemUnavailableError);
    expect(orders.saved.size).toBe(0);
  });
});
