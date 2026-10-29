import {
  Delivery,
  DeliveryNotFoundError,
  Location,
} from '../../../domain/index.js';
import type { DeliveryRepository } from '../../ports/index.js';
import { GetDeliveryUseCase } from './get-delivery.use-case.js';

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

const here = Location.create(9.9281, -84.0907);

function pendingDelivery(id = 'd-1', orderId = 'o-1'): Delivery {
  return Delivery.request({
    id,
    orderId,
    pickup: here,
    dropoff: Location.create(9.95, -84.1),
    now: new Date(),
  });
}

describe('GetDelivery', () => {
  let deliveries: FakeDeliveryRepository;
  let getDelivery: GetDeliveryUseCase;

  beforeEach(() => {
    deliveries = new FakeDeliveryRepository();
    getDelivery = new GetDeliveryUseCase(deliveries);
  });

  it('returns the delivery', async () => {
    const delivery = pendingDelivery();
    delivery.assignTo('k-1');
    await deliveries.save(delivery);

    const result = await getDelivery.execute({ deliveryId: 'd-1' });

    expect(result).toMatchObject({
      id: 'd-1',
      orderId: 'o-1',
      status: 'assigned',
      courierId: 'k-1',
    });
  });

  it('fails when the delivery does not exist', async () => {
    await expect(getDelivery.execute({ deliveryId: 'nope' })).rejects.toThrow(
      DeliveryNotFoundError,
    );
  });
});
