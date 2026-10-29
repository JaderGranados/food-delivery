import {
  Courier,
  CourierNotFoundError,
  InvalidLocationError,
} from '../../../domain/index.js';
import type { CourierRepository } from '../../ports/index.js';
import { UpdateCourierLocationUseCase } from './update-courier-location.use-case.js';

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

describe('UpdateCourierLocation', () => {
  let couriers: FakeCourierRepository;
  let updateLocation: UpdateCourierLocationUseCase;

  beforeEach(async () => {
    couriers = new FakeCourierRepository();
    updateLocation = new UpdateCourierLocationUseCase(couriers);
    await couriers.save(
      Courier.register({ id: 'k-1', name: 'Luis', now: new Date() }),
    );
  });

  it('updates the location', async () => {
    const result = await updateLocation.execute({
      courierId: 'k-1',
      location: { latitude: 10, longitude: -84 },
    });

    expect(result.location).toEqual({ latitude: 10, longitude: -84 });
  });

  it('rejects an invalid location', async () => {
    await expect(
      updateLocation.execute({
        courierId: 'k-1',
        location: { latitude: 100, longitude: 0 },
      }),
    ).rejects.toThrow(InvalidLocationError);
  });

  it('fails when the courier does not exist', async () => {
    await expect(
      updateLocation.execute({
        courierId: 'nope',
        location: { latitude: 10, longitude: -84 },
      }),
    ).rejects.toThrow(CourierNotFoundError);
  });
});
