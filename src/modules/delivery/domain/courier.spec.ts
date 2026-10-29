import {
  ArgumentRequiredError,
  InvalidCourierTransitionError,
} from './errors.js';
import { Courier } from './courier.js';
import { Location } from './value-objects/index.js';

const here = Location.create(9.9281, -84.0907);
const newCourier = () =>
  Courier.register({ id: 'k-1', name: ' Luis ', now: new Date() });

describe('Courier', () => {
  it('registers offline with a trimmed name', () => {
    const courier = newCourier();

    expect(courier.name).toBe('Luis');
    expect(courier.status).toBe('offline');
    expect(courier.location).toBeUndefined();
  });

  it('requires a name', () => {
    expect(() =>
      Courier.register({ id: 'k-1', name: ' ', now: new Date() }),
    ).toThrow(ArgumentRequiredError);
  });

  it('goes online at a location and offline again', () => {
    const courier = newCourier();

    courier.goOnline(here);
    expect(courier.status).toBe('available');
    expect(courier.location).toBe(here);

    courier.goOffline();
    expect(courier.status).toBe('offline');
  });

  it('takes a delivery only when available and is released afterwards', () => {
    const courier = newCourier();
    expect(() => courier.assign()).toThrow(InvalidCourierTransitionError);

    courier.goOnline(here);
    courier.assign();
    expect(courier.status).toBe('busy');

    courier.release();
    expect(courier.status).toBe('available');
  });

  it('cannot go online or offline while busy', () => {
    const courier = newCourier();
    courier.goOnline(here);
    courier.assign();

    expect(() => courier.goOffline()).toThrow(InvalidCourierTransitionError);
    expect(() => courier.goOnline(here)).toThrow(InvalidCourierTransitionError);
  });

  it('cannot be released when not busy', () => {
    expect(() => newCourier().release()).toThrow(InvalidCourierTransitionError);
  });

  it('is infinitely far away without a location', () => {
    expect(newCourier().distanceTo(here)).toBe(Number.POSITIVE_INFINITY);
  });
});
