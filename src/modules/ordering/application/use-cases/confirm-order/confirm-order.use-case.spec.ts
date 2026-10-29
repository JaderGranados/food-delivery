import { Money } from '@shared/domain/index.js';
import {
  InvalidOrderTransitionError,
  Order,
  OrderLine,
  OrderNotFoundError,
} from '../../../domain/index.js';
import type { OrderRepository } from '../../ports/index.js';
import { ConfirmOrderUseCase } from './confirm-order.use-case.js';

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

describe('ConfirmOrder', () => {
  let orders: FakeOrderRepository;
  let useCase: ConfirmOrderUseCase;

  beforeEach(() => {
    orders = new FakeOrderRepository();
    useCase = new ConfirmOrderUseCase(orders);
  });

  it('moves a placed order to confirmed', async () => {
    await orders.save(placedOrder());

    const result = await useCase.execute({ orderId: 'o-1' });

    expect(result.status).toBe('confirmed');
    expect(orders.saved.get('o-1')?.status).toBe('confirmed');
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
