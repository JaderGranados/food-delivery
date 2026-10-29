import { Money } from '@shared/domain/index.js';
import { ArgumentRequiredError, MenuItemNotFoundError } from './errors.js';
import { Restaurant } from './restaurant.js';
import { OpeningHours } from './value-objects/index.js';

const openingHours = OpeningHours.create([
  { day: 'monday', open: '09:00', close: '22:00' },
]);

function newRestaurant(): Restaurant {
  return Restaurant.register({
    id: 'r-1',
    name: '  Soda Tica ',
    openingHours,
    now: new Date('2026-01-01T00:00:00Z'),
  });
}

describe('Restaurant', () => {
  it('registers a restaurant with a trimmed name and the given date', () => {
    const restaurant = newRestaurant();

    expect(restaurant.name).toBe('Soda Tica');
    expect(restaurant.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
    expect(restaurant.menu).toEqual([]);
  });

  it('requires a name', () => {
    expect(() =>
      Restaurant.register({
        id: 'r-1',
        name: ' ',
        openingHours,
        now: new Date(),
      }),
    ).toThrow(ArgumentRequiredError);
  });

  it('adds an available menu item', () => {
    const restaurant = newRestaurant();

    const item = restaurant.addMenuItem({
      id: 'i-1',
      name: 'Casado',
      price: Money.create(350000, 'CRC'),
    });

    expect(item.available).toBe(true);
    expect(restaurant.menu).toHaveLength(1);
  });

  it('changes the availability of a menu item', () => {
    const restaurant = newRestaurant();
    restaurant.addMenuItem({
      id: 'i-1',
      name: 'Casado',
      price: Money.create(350000, 'CRC'),
    });

    const item = restaurant.setItemAvailability('i-1', false);

    expect(item.available).toBe(false);
  });

  it('fails when the menu item does not exist', () => {
    expect(() => newRestaurant().setItemAvailability('nope', false)).toThrow(
      MenuItemNotFoundError,
    );
  });
});
