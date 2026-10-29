import {
  InvalidOpeningHoursError,
  type Restaurant,
} from '../../../domain/index.js';
import type { RestaurantRepository } from '../../ports/index.js';
import { RegisterRestaurantUseCase } from './register-restaurant.use-case.js';

class FakeRestaurantRepository implements RestaurantRepository {
  readonly saved = new Map<string, Restaurant>();

  findById(id: string): Promise<Restaurant | null> {
    return Promise.resolve(this.saved.get(id) ?? null);
  }

  save(restaurant: Restaurant): Promise<Restaurant> {
    this.saved.set(restaurant.id, restaurant);
    return Promise.resolve(restaurant);
  }
}

describe('RegisterRestaurant', () => {
  let restaurants: FakeRestaurantRepository;
  let registerRestaurant: RegisterRestaurantUseCase;

  beforeEach(() => {
    restaurants = new FakeRestaurantRepository();
    registerRestaurant = new RegisterRestaurantUseCase(restaurants);
  });

  it('registers a restaurant with its opening hours', async () => {
    const openingHours = [
      { day: 'monday' as const, open: '09:00', close: '22:00' },
    ];

    const result = await registerRestaurant.execute({
      name: 'Soda Tica',
      openingHours,
    });

    expect(result).toEqual({
      id: expect.any(String),
      name: 'Soda Tica',
      openingHours,
      createdAt: expect.any(Date),
    });
    expect(restaurants.saved.has(result.id)).toBe(true);
  });

  it('rejects invalid opening hours without saving', async () => {
    await expect(
      registerRestaurant.execute({
        name: 'Soda Tica',
        openingHours: [{ day: 'monday', open: '22:00', close: '09:00' }],
      }),
    ).rejects.toThrow(InvalidOpeningHoursError);
    expect(restaurants.saved.size).toBe(0);
  });
});
