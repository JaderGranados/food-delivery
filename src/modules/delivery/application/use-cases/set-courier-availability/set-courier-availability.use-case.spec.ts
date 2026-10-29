import {
  ArgumentRequiredError,
  Courier,
  CourierNotFoundError,
  InvalidCourierTransitionError,
  Location,
} from '../../../domain/index.js';
import type { CourierRepository } from '../../ports/index.js';
import { SetCourierAvailabilityUseCase } from './set-courier-availability.use-case.js';

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

const here = Location.create(9.9281, -84.0907);

function onlineCourier(id: string, location = here): Courier {
  const courier = Courier.register({ id, name: id, now: new Date() });
  courier.goOnline(location);
  return courier;
}

describe('SetCourierAvailability', () => {
  let couriers: FakeCourierRepository;
  let setAvailability: SetCourierAvailabilityUseCase;

  beforeEach(() => {
    couriers = new FakeCourierRepository();
    setAvailability = new SetCourierAvailabilityUseCase(couriers);
  });

  it('puts an offline courier online at a location', async () => {
    await couriers.save(
      Courier.register({ id: 'k-1', name: 'Luis', now: new Date() }),
    );

    const result = await setAvailability.execute({
      courierId: 'k-1',
      available: true,
      location: { latitude: 9.9281, longitude: -84.0907 },
    });

    expect(result).toEqual({
      id: 'k-1',
      name: 'Luis',
      status: 'available',
      location: { latitude: 9.9281, longitude: -84.0907 },
    });
  });

  it('requires a location to go online', async () => {
    await couriers.save(
      Courier.register({ id: 'k-1', name: 'Luis', now: new Date() }),
    );

    await expect(
      setAvailability.execute({ courierId: 'k-1', available: true }),
    ).rejects.toThrow(ArgumentRequiredError);
  });

  it('puts an available courier offline', async () => {
    await couriers.save(onlineCourier('k-1'));

    const result = await setAvailability.execute({
      courierId: 'k-1',
      available: false,
    });

    expect(result.status).toBe('offline');
  });

  it('does not let a busy courier go offline', async () => {
    const courier = onlineCourier('k-1');
    courier.assign();
    await couriers.save(courier);

    await expect(
      setAvailability.execute({ courierId: 'k-1', available: false }),
    ).rejects.toThrow(InvalidCourierTransitionError);
  });

  it('fails when the courier does not exist', async () => {
    await expect(
      setAvailability.execute({ courierId: 'nope', available: false }),
    ).rejects.toThrow(CourierNotFoundError);
  });
});
