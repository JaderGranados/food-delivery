import { InvalidLocationError } from '../errors.js';
import { Location } from './location.js';

describe('Location', () => {
  it('creates a valid location', () => {
    const location = Location.create(9.9281, -84.0907);

    expect(location.latitude).toBe(9.9281);
    expect(location.longitude).toBe(-84.0907);
  });

  it.each([
    [91, 0],
    [-91, 0],
    [0, 181],
    [0, -181],
    [Number.NaN, 0],
    [0, Number.POSITIVE_INFINITY],
  ])('rejects (%s, %s)', (latitude, longitude) => {
    expect(() => Location.create(latitude, longitude)).toThrow(
      InvalidLocationError,
    );
  });

  it('computes the distance in kilometres', () => {
    const sanJose = Location.create(9.9281, -84.0907);
    const heredia = Location.create(9.9981, -84.1165);

    expect(sanJose.distanceTo(heredia)).toBeGreaterThan(7);
    expect(sanJose.distanceTo(heredia)).toBeLessThan(9);
    expect(sanJose.distanceTo(sanJose)).toBe(0);
  });
});
