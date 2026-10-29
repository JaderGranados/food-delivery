import {
  Courier,
  CourierNotFoundError,
  InvalidCourierTransitionError,
  Delivery,
  DeliveryNotFoundError,
  InvalidDeliveryTransitionError,
  Location,
} from '../../../domain/index.js';
import type {
  CourierRepository,
  DeliveryRepository,
} from '../../ports/index.js';
import { CompleteDeliveryUseCase } from './complete-delivery.use-case.js';

class FakeCourierRepository implements CourierRepository {
  readonly saved = new Map<string, Courier>();

  findById(id: string): Promise<Courier | null> {
    return Promise.resolve(this.saved.get(id) ?? null);
  }

  findAvailable(): Promise<Courier[]> {
    return Promise.resolve(
      [...this.saved.values()].filter((c) => c.status === 'available'),
    );
  }

  save(courier: Courier): Promise<Courier> {
    this.saved.set(courier.id, courier);
    return Promise.resolve(courier);
  }
}

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

function onlineCourier(id: string, location = here): Courier {
  const courier = Courier.register({ id, name: id, now: new Date() });
  courier.goOnline(location);
  return courier;
}

function pendingDelivery(id = 'd-1', orderId = 'o-1'): Delivery {
  return Delivery.request({
    id,
    orderId,
    pickup: here,
    dropoff: Location.create(9.95, -84.1),
    now: new Date(),
  });
}

describe('CompleteDelivery', () => {
  let couriers: FakeCourierRepository;
  let deliveries: FakeDeliveryRepository;
  let complete: CompleteDeliveryUseCase;

  beforeEach(() => {
    couriers = new FakeCourierRepository();
    deliveries = new FakeDeliveryRepository();
    complete = new CompleteDeliveryUseCase(deliveries, couriers);
  });

  it('delivers the order and frees the courier', async () => {
    const courier = onlineCourier('k-1');
    courier.assign();
    await couriers.save(courier);
    const delivery = pendingDelivery();
    delivery.assignTo('k-1');
    delivery.pickUp();
    await deliveries.save(delivery);

    const result = await complete.execute({ deliveryId: 'd-1' });

    expect(result.status).toBe('delivered');
    expect(couriers.saved.get('k-1')?.status).toBe('available');
  });

  it('fails when the delivery was not picked up', async () => {
    const courier = onlineCourier('k-1');
    courier.assign();
    await couriers.save(courier);
    const delivery = pendingDelivery();
    delivery.assignTo('k-1');
    await deliveries.save(delivery);

    await expect(complete.execute({ deliveryId: 'd-1' })).rejects.toThrow(
      InvalidDeliveryTransitionError,
    );
  });

  it('fails when the delivery does not exist', async () => {
    await expect(complete.execute({ deliveryId: 'nope' })).rejects.toThrow(
      DeliveryNotFoundError,
    );
  });

  it('leaves the delivery picked up when its courier cannot be found', async () => {
    const delivery = pendingDelivery();
    delivery.assignTo('ghost');
    delivery.pickUp();
    await deliveries.save(delivery);

    await expect(complete.execute({ deliveryId: 'd-1' })).rejects.toThrow(
      CourierNotFoundError,
    );

    expect(deliveries.saved.get('d-1')?.status).toBe('picked_up');
  });

  it('keeps the courier busy when the delivery was not picked up', async () => {
    const courier = onlineCourier('k-1');
    courier.assign();
    await couriers.save(courier);
    const delivery = pendingDelivery();
    delivery.assignTo('k-1');
    await deliveries.save(delivery);

    await expect(complete.execute({ deliveryId: 'd-1' })).rejects.toThrow(
      InvalidDeliveryTransitionError,
    );

    expect(couriers.saved.get('k-1')?.status).toBe('busy');
    expect(deliveries.saved.get('d-1')?.status).toBe('assigned');
  });

  it('leaves the delivery picked up when the courier is not busy', async () => {
    await couriers.save(onlineCourier('k-1'));
    const delivery = pendingDelivery();
    delivery.assignTo('k-1');
    delivery.pickUp();
    await deliveries.save(delivery);

    await expect(complete.execute({ deliveryId: 'd-1' })).rejects.toThrow(
      InvalidCourierTransitionError,
    );

    expect(deliveries.saved.get('d-1')?.status).toBe('picked_up');
  });
});
