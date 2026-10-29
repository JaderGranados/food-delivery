import {
  Delivery,
  DeliveryNotFoundError,
  Location,
} from '../../../domain/index.js';
import type { DeliveryRepository } from '../../ports/index.js';
import { GetDeliveryByOrderUseCase } from './get-delivery-by-order.use-case.js';

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

describe('GetDeliveryByOrder', () => {
  let deliveries: FakeDeliveryRepository;
  let getDeliveryByOrder: GetDeliveryByOrderUseCase;

  beforeEach(() => {
    deliveries = new FakeDeliveryRepository();
    getDeliveryByOrder = new GetDeliveryByOrderUseCase(deliveries);
  });

  it('returns the delivery of the order', async () => {
    const delivery = Delivery.request({
      id: 'd-1',
      orderId: 'o-1',
      pickup: Location.create(9.93, -84.08),
      dropoff: Location.create(9.95, -84.1),
      now: new Date(),
    });
    delivery.assignTo('k-1');
    await deliveries.save(delivery);

    const result = await getDeliveryByOrder.execute({ orderId: 'o-1' });

    expect(result).toMatchObject({
      id: 'd-1',
      orderId: 'o-1',
      status: 'assigned',
      courierId: 'k-1',
    });
  });

  it('fails when the order has no delivery', async () => {
    await expect(
      getDeliveryByOrder.execute({ orderId: 'nope' }),
    ).rejects.toThrow(DeliveryNotFoundError);
  });
});
