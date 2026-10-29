import { Money } from '@shared/domain/index.js';
import { Order, OrderLine, OrderNotFoundError } from '../../../domain/index.js';
import type { OrderRepository } from '../../ports/index.js';
import { GetOrderUseCase } from './get-order.use-case.js';

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

describe('GetOrder', () => {
  let orders: FakeOrderRepository;
  let getOrder: GetOrderUseCase;

  beforeEach(() => {
    orders = new FakeOrderRepository();
    getOrder = new GetOrderUseCase(orders);
  });

  it('returns the order', async () => {
    await orders.save(
      Order.place({
        id: 'o-1',
        customerId: 'c-1',
        restaurantId: 'r-1',
        lines: [
          OrderLine.create({
            menuItemId: 'i-1',
            name: 'Casado',
            unitPrice: Money.create(350000, 'CRC'),
            quantity: 2,
          }),
        ],
        now: new Date(),
      }),
    );

    const result = await getOrder.execute({ orderId: 'o-1' });

    expect(result).toMatchObject({
      id: 'o-1',
      status: 'placed',
      total: { amount: 700000, currency: 'CRC' },
    });
  });

  it('fails when the order does not exist', async () => {
    await expect(getOrder.execute({ orderId: 'nope' })).rejects.toThrow(
      OrderNotFoundError,
    );
  });
});
