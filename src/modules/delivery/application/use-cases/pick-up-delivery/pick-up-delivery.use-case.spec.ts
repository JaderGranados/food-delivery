import {
  Delivery,
  DeliveryNotFoundError,
  InvalidDeliveryTransitionError,
  Location,
} from '../../../domain/index.js';
import type { DeliveryRepository } from '../../ports/index.js';
import { PickUpDeliveryUseCase } from './pick-up-delivery.use-case.js';

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

describe('PickUpDelivery', () => {
  let deliveries: FakeDeliveryRepository;
  let pickUp: PickUpDeliveryUseCase;

  beforeEach(() => {
    deliveries = new FakeDeliveryRepository();
    pickUp = new PickUpDeliveryUseCase(deliveries);
  });

  it('marks an assigned delivery as picked up', async () => {
    const delivery = pendingDelivery();
    delivery.assignTo('k-1');
    await deliveries.save(delivery);

    const result = await pickUp.execute({ deliveryId: 'd-1' });

    expect(result.status).toBe('picked_up');
  });

  it('fails when the delivery has no courier yet', async () => {
    await deliveries.save(pendingDelivery());

    await expect(pickUp.execute({ deliveryId: 'd-1' })).rejects.toThrow(
      InvalidDeliveryTransitionError,
    );
  });

  it('fails when the delivery does not exist', async () => {
    await expect(pickUp.execute({ deliveryId: 'nope' })).rejects.toThrow(
      DeliveryNotFoundError,
    );
  });
});
