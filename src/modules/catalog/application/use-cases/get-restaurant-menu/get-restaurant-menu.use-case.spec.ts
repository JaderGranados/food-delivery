import { Money } from '@shared/domain/index.js';
import {
  OpeningHours,
  Restaurant,
  RestaurantNotFoundError,
} from '../../../domain/index.js';
import type { RestaurantRepository } from '../../ports/index.js';
import { GetRestaurantMenuUseCase } from './get-restaurant-menu.use-case.js';

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

describe('GetRestaurantMenu', () => {
  let restaurants: FakeRestaurantRepository;
  let getRestaurantMenu: GetRestaurantMenuUseCase;

  beforeEach(() => {
    restaurants = new FakeRestaurantRepository();
    getRestaurantMenu = new GetRestaurantMenuUseCase(restaurants);
  });

  it('returns the items with price and availability', async () => {
    const restaurant = await seedRestaurant(restaurants);
    restaurant.addMenuItem({
      id: 'i-1',
      name: 'Casado',
      price: Money.create(350000, 'CRC'),
    });
    restaurant.setItemAvailability('i-1', false);

    const menu = await getRestaurantMenu.execute({
      restaurantId: restaurant.id,
    });

    expect(menu).toEqual({
      restaurantId: 'r-1',
      name: 'Soda Tica',
      items: [
        {
          id: 'i-1',
          name: 'Casado',
          price: { amount: 350000, currency: 'CRC' },
          available: false,
        },
      ],
    });
  });

  it('fails when the restaurant does not exist', async () => {
    await expect(
      getRestaurantMenu.execute({ restaurantId: 'nope' }),
    ).rejects.toThrow(RestaurantNotFoundError);
  });
});
