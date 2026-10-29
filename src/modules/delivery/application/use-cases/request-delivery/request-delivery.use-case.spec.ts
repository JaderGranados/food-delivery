import {
  DeliveryAlreadyRequestedError,
  InvalidLocationError,
  OrderNotConfirmedError,
  OrderNotFoundError,
  type Delivery,
} from '../../../domain/index.js';
import type {
  DeliveryRepository,
  OrderLookup,
  OrderSummary,
} from '../../ports/index.js';
import { RequestDeliveryUseCase } from './request-delivery.use-case.js';

class FakeDeliveryRepository implements DeliveryRepository {
  readonly saved = new Map<string, Delivery>();

  findById(id: string): Promise<Delivery | null> {
    return Promise.resolve(this.saved.get(id) ?? null);
  }

  findByOrderId(orderId: string): Promise<Delivery | null> {
    return Promise.resolve(
      [...this.saved.values()].find((d) => d.orderId === orderId) ?? null,
    );
  }

  save(delivery: Delivery): Promise<Delivery> {
    this.saved.set(delivery.id, delivery);
    return Promise.resolve(delivery);
  }
}

class FakeOrderLookup implements OrderLookup {
  order: OrderSummary | null = { id: 'o-1', status: 'confirmed' };

  findOrder(): Promise<OrderSummary | null> {
    return Promise.resolve(this.order);
  }
}

const command = {
  orderId: 'o-1',
  pickup: { latitude: 9.93, longitude: -84.08 },
  dropoff: { latitude: 9.95, longitude: -84.1 },
};

describe('RequestDelivery', () => {
  let deliveries: FakeDeliveryRepository;
  let orders: FakeOrderLookup;
  let requestDelivery: RequestDeliveryUseCase;

  beforeEach(() => {
    deliveries = new FakeDeliveryRepository();
    orders = new FakeOrderLookup();
    requestDelivery = new RequestDeliveryUseCase(deliveries, orders);
  });

  it('creates a pending delivery for a confirmed order', async () => {
    const result = await requestDelivery.execute(command);

    expect(result).toEqual({
      id: expect.any(String),
      orderId: 'o-1',
      status: 'pending',
      pickup: command.pickup,
      dropoff: command.dropoff,
      createdAt: expect.any(Date),
    });
    expect(deliveries.saved.has(result.id)).toBe(true);
  });

  it('fails when the order does not exist', async () => {
    orders.order = null;

    await expect(requestDelivery.execute(command)).rejects.toThrow(
      OrderNotFoundError,
    );
  });

  it.each(['placed', 'cancelled'])(
    'fails when the order is %s',
    async (status) => {
      orders.order = { id: 'o-1', status };

      await expect(requestDelivery.execute(command)).rejects.toThrow(
        OrderNotConfirmedError,
      );
      expect(deliveries.saved.size).toBe(0);
    },
  );

  it('fails when the order already has a delivery', async () => {
    await requestDelivery.execute(command);

    await expect(requestDelivery.execute(command)).rejects.toThrow(
      DeliveryAlreadyRequestedError,
    );
  });

  it('rejects an invalid location', async () => {
    await expect(
      requestDelivery.execute({
        ...command,
        pickup: { latitude: 200, longitude: 0 },
      }),
    ).rejects.toThrow(InvalidLocationError);
  });
});
