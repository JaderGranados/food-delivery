import {
  OpeningHours,
  Restaurant,
  RestaurantNotFoundError,
} from '../../../domain/index.js';
import { InvalidMoneyAmountError } from '@shared/domain/index.js';
import type { RestaurantRepository } from '../../ports/index.js';
import { AddMenuItemUseCase } from './add-menu-item.use-case.js';

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

describe('AddMenuItem', () => {
  let restaurants: FakeRestaurantRepository;
  let addMenuItem: AddMenuItemUseCase;

  beforeEach(() => {
    restaurants = new FakeRestaurantRepository();
    addMenuItem = new AddMenuItemUseCase(restaurants);
  });

  it('adds an available item to the restaurant menu', async () => {
    const restaurant = await seedRestaurant(restaurants);

    const result = await addMenuItem.execute({
      restaurantId: restaurant.id,
      name: 'Casado',
      description: 'Rice, beans and chicken',
      price: { amount: 350000, currency: 'CRC' },
    });

    expect(result).toEqual({
      id: expect.any(String),
      name: 'Casado',
      description: 'Rice, beans and chicken',
      price: { amount: 350000, currency: 'CRC' },
      available: true,
    });
    expect(restaurant.menu).toHaveLength(1);
  });

  it('fails when the restaurant does not exist', async () => {
    await expect(
      addMenuItem.execute({
        restaurantId: 'nope',
        name: 'Casado',
        price: { amount: 100, currency: 'CRC' },
      }),
    ).rejects.toThrow(RestaurantNotFoundError);
  });

  it('rejects an invalid price without changing the menu', async () => {
    const restaurant = await seedRestaurant(restaurants);

    await expect(
      addMenuItem.execute({
        restaurantId: restaurant.id,
        name: 'Casado',
        price: { amount: -1, currency: 'CRC' },
      }),
    ).rejects.toThrow(InvalidMoneyAmountError);
    expect(restaurant.menu).toHaveLength(0);
  });
});
