import { ArgumentRequiredError, type Courier } from '../../../domain/index.js';
import type { CourierRepository } from '../../ports/index.js';
import { RegisterCourierUseCase } from './register-courier.use-case.js';

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

describe('RegisterCourier', () => {
  let couriers: FakeCourierRepository;
  let registerCourier: RegisterCourierUseCase;

  beforeEach(() => {
    couriers = new FakeCourierRepository();
    registerCourier = new RegisterCourierUseCase(couriers);
  });

  it('registers an offline courier', async () => {
    const result = await registerCourier.execute({ name: 'Luis' });

    expect(result).toEqual({
      id: expect.any(String),
      name: 'Luis',
      status: 'offline',
    });
    expect(couriers.saved.has(result.id)).toBe(true);
  });

  it('rejects an empty name without saving', async () => {
    await expect(registerCourier.execute({ name: ' ' })).rejects.toThrow(
      ArgumentRequiredError,
    );
    expect(couriers.saved.size).toBe(0);
  });
});
