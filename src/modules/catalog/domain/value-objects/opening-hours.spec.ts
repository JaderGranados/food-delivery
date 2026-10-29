import { InvalidOpeningHoursError } from '../errors.js';
import { OpeningHours } from './opening-hours.js';

describe('OpeningHours', () => {
  it('creates opening hours from valid slots', () => {
    const hours = OpeningHours.create([
      { day: 'monday', open: '09:00', close: '14:00' },
      { day: 'monday', open: '18:00', close: '23:00' },
    ]);

    expect(hours.slots).toHaveLength(2);
  });

  it.each([
    ['no slots', []],
    ['an unknown day', [{ day: 'funday', open: '09:00', close: '10:00' }]],
    ['a malformed time', [{ day: 'monday', open: '9am', close: '10:00' }]],
    [
      'an out of range time',
      [{ day: 'monday', open: '09:00', close: '24:00' }],
    ],
    ['close before open', [{ day: 'monday', open: '10:00', close: '09:00' }]],
    ['close equal to open', [{ day: 'monday', open: '10:00', close: '10:00' }]],
    [
      'overlapping slots on the same day',
      [
        { day: 'friday', open: '09:00', close: '15:00' },
        { day: 'friday', open: '14:00', close: '20:00' },
      ],
    ],
  ])('rejects %s', (_case, slots) => {
    expect(() => OpeningHours.create(slots as never)).toThrow(
      InvalidOpeningHoursError,
    );
  });

  it('allows the same times on different days', () => {
    expect(() =>
      OpeningHours.create([
        { day: 'monday', open: '09:00', close: '15:00' },
        { day: 'tuesday', open: '09:00', close: '15:00' },
      ]),
    ).not.toThrow();
  });
});
