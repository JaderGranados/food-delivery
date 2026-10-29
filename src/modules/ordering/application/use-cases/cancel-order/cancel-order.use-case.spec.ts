import { Money } from '@shared/domain/index.js';
import {
  InvalidOrderTransitionError,
  Order,
  OrderLine,
  OrderNotFoundError,
} from '../../../domain/index.js';
import type { OrderRepository } from '../../ports/index.js';
import { CancelOrderUseCase } from './cancel-order.use-case.js';

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

function placedOrder(): Order {
  return Order.place({
    id: 'o-1',
    customerId: 'c-1',
    restaurantId: 'r-1',
    lines: [
      OrderLine.create({
        menuItemId: 'i-1',
        name: 'Casado',
        unitPrice: Money.create(350000, 'CRC'),
        quantity: 1,
      }),
    ],
    now: new Date(),
  });
}

describe('CancelOrder', () => {
  let orders: FakeOrderRepository;
  let useCase: CancelOrderUseCase;

  beforeEach(() => {
    orders = new FakeOrderRepository();
    useCase = new CancelOrderUseCase(orders);
  });

  it('moves a placed order to cancelled', async () => {
    await orders.save(placedOrder());

    const result = await useCase.execute({ orderId: 'o-1' });

    expect(result.status).toBe('cancelled');
    expect(orders.saved.get('o-1')?.status).toBe('cancelled');
  });

  it('fails when the order does not exist', async () => {
    await expect(useCase.execute({ orderId: 'nope' })).rejects.toThrow(
      OrderNotFoundError,
    );
  });

  it('fails when the order cannot make that transition', async () => {
    const order = placedOrder();
    order.cancel();

    await orders.save(order);

    await expect(useCase.execute({ orderId: 'o-1' })).rejects.toThrow(
      InvalidOrderTransitionError,
    );
  });
});
