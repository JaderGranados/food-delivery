import { Money } from '@shared/domain/index.js';
import {
  MenuItemNotFoundError,
  OpeningHours,
  Restaurant,
  RestaurantNotFoundError,
} from '../../../domain/index.js';
import type { RestaurantRepository } from '../../ports/index.js';
import { SetItemAvailabilityUseCase } from './set-item-availability.use-case.js';

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

async function seedRestaurant(
  repository: FakeRestaurantRepository,
): Promise<Restaurant> {
  const restaurant = Restaurant.register({
    id: 'r-1',
    name: 'Soda Tica',
    openingHours: OpeningHours.create([
      { day: 'monday', open: '09:00', close: '22:00' },
    ]),
    now: new Date(),
  });
  return repository.save(restaurant);
}

describe('SetItemAvailability', () => {
  let restaurants: FakeRestaurantRepository;
  let setItemAvailability: SetItemAvailabilityUseCase;

  beforeEach(() => {
    restaurants = new FakeRestaurantRepository();
    setItemAvailability = new SetItemAvailabilityUseCase(restaurants);
  });

  it('marks an item as unavailable and back', async () => {
    const restaurant = await seedRestaurant(restaurants);
    restaurant.addMenuItem({
      id: 'i-1',
      name: 'Casado',
      price: Money.create(350000, 'CRC'),
    });

    const off = await setItemAvailability.execute({
      restaurantId: restaurant.id,
      menuItemId: 'i-1',
      available: false,
    });
    const on = await setItemAvailability.execute({
      restaurantId: restaurant.id,
      menuItemId: 'i-1',
      available: true,
    });

    expect(off.available).toBe(false);
    expect(on.available).toBe(true);
  });

  it('fails when the restaurant does not exist', async () => {
    await expect(
      setItemAvailability.execute({
        restaurantId: 'nope',
        menuItemId: 'i-1',
        available: false,
      }),
    ).rejects.toThrow(RestaurantNotFoundError);
  });

  it('fails when the menu item does not exist', async () => {
    const restaurant = await seedRestaurant(restaurants);

    await expect(
      setItemAvailability.execute({
        restaurantId: restaurant.id,
        menuItemId: 'nope',
        available: false,
      }),
    ).rejects.toThrow(MenuItemNotFoundError);
  });
});
