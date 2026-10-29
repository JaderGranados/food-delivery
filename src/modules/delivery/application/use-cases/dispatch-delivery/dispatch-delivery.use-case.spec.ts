import {
  Courier,
  Delivery,
  DeliveryNotFoundError,
  InvalidCourierTransitionError,
  InvalidDeliveryTransitionError,
  Location,
  NoCourierAvailableError,
} from '../../../domain/index.js';
import type {
  CourierRepository,
  DeliveryRepository,
} from '../../ports/index.js';
import { DispatchDeliveryUseCase } from './dispatch-delivery.use-case.js';

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

describe('DispatchDelivery', () => {
  let couriers: FakeCourierRepository;
  let deliveries: FakeDeliveryRepository;
  let dispatch: DispatchDeliveryUseCase;

  beforeEach(async () => {
    couriers = new FakeCourierRepository();
    deliveries = new FakeDeliveryRepository();
    dispatch = new DispatchDeliveryUseCase(deliveries, couriers);
    await deliveries.save(pendingDelivery());
  });

  it('assigns the nearest available courier and marks them busy', async () => {
    await couriers.save(onlineCourier('far', Location.create(10.5, -84.5)));
    await couriers.save(onlineCourier('near', Location.create(9.93, -84.09)));

    const result = await dispatch.execute({ deliveryId: 'd-1' });

    expect(result.status).toBe('assigned');
    expect(result.courierId).toBe('near');
    expect(couriers.saved.get('near')?.status).toBe('busy');
    expect(couriers.saved.get('far')?.status).toBe('available');
  });

  it('ignores couriers that are offline or busy', async () => {
    const offline = Courier.register({
      id: 'off',
      name: 'off',
      now: new Date(),
    });
    const busy = onlineCourier('busy');
    busy.assign();
    await couriers.save(offline);
    await couriers.save(busy);

    await expect(dispatch.execute({ deliveryId: 'd-1' })).rejects.toThrow(
      NoCourierAvailableError,
    );
    expect(deliveries.saved.get('d-1')?.status).toBe('pending');
  });

  it('fails when the delivery does not exist', async () => {
    await expect(dispatch.execute({ deliveryId: 'nope' })).rejects.toThrow(
      DeliveryNotFoundError,
    );
  });

  it('fails when the delivery was already dispatched', async () => {
    await couriers.save(onlineCourier('k-1'));
    await couriers.save(onlineCourier('k-2'));
    await dispatch.execute({ deliveryId: 'd-1' });

    await expect(dispatch.execute({ deliveryId: 'd-1' })).rejects.toThrow(
      InvalidDeliveryTransitionError,
    );
  });

  it('leaves the courier available when the delivery cannot be dispatched', async () => {
    await couriers.save(onlineCourier('k-1'));
    await couriers.save(onlineCourier('k-2'));
    await dispatch.execute({ deliveryId: 'd-1' });
    const spare = [...couriers.saved.values()].find(
      (courier) => courier.status === 'available',
    )!;

    await expect(dispatch.execute({ deliveryId: 'd-1' })).rejects.toThrow(
      InvalidDeliveryTransitionError,
    );

    expect(spare.status).toBe('available');
  });

  it('does not touch the delivery when the chosen courier was taken meanwhile', async () => {
    const taken = onlineCourier('k-1');
    taken.assign();
    couriers.findAvailable = () => Promise.resolve([taken]);

    await expect(dispatch.execute({ deliveryId: 'd-1' })).rejects.toThrow(
      InvalidCourierTransitionError,
    );

    expect(deliveries.saved.get('d-1')?.status).toBe('pending');
    expect(deliveries.saved.get('d-1')?.courierId).toBeUndefined();
  });
});
