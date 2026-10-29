import {
  ArgumentRequiredError,
  InvalidDeliveryTransitionError,
} from './errors.js';
import { Delivery } from './delivery.js';
import { Location } from './value-objects/index.js';

const newDelivery = () =>
  Delivery.request({
    id: 'd-1',
    orderId: 'o-1',
    pickup: Location.create(9.93, -84.08),
    dropoff: Location.create(9.95, -84.1),
    now: new Date(),
  });

describe('Delivery', () => {
  it('starts pending without a courier', () => {
    const delivery = newDelivery();

    expect(delivery.status).toBe('pending');
    expect(delivery.courierId).toBeUndefined();
  });

  it('requires an order id', () => {
    expect(() =>
      Delivery.request({
        id: 'd-1',
        orderId: '',
        pickup: Location.create(0, 0),
        dropoff: Location.create(0, 0),
        now: new Date(),
      }),
    ).toThrow(ArgumentRequiredError);
  });

  it('goes through assigned, picked up and delivered', () => {
    const delivery = newDelivery();

    delivery.assignTo('k-1');
    expect(delivery.status).toBe('assigned');
    expect(delivery.courierId).toBe('k-1');

    delivery.pickUp();
    expect(delivery.status).toBe('picked_up');

    delivery.complete();
    expect(delivery.status).toBe('delivered');
  });

  it('rejects out-of-order transitions', () => {
    const delivery = newDelivery();

    expect(() => delivery.pickUp()).toThrow(InvalidDeliveryTransitionError);
    expect(() => delivery.complete()).toThrow(InvalidDeliveryTransitionError);

    delivery.assignTo('k-1');
    expect(() => delivery.assignTo('k-2')).toThrow(
      InvalidDeliveryTransitionError,
    );
    expect(() => delivery.complete()).toThrow(InvalidDeliveryTransitionError);
  });
});
