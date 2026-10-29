import { InvalidOpeningHoursError } from '../errors.js';

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export interface OpeningSlot {
  day: DayOfWeek;
  /** 24h `HH:mm`. */
  open: string;
  /** 24h `HH:mm`, later than `open`. */
  close: string;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class OpeningHours {
  private constructor(readonly slots: readonly OpeningSlot[]) {}

  static create(slots: readonly OpeningSlot[]): OpeningHours {
    if (slots.length === 0) {
      throw new InvalidOpeningHoursError('at least one slot is required');
    }
    for (const slot of slots) {
      if (!DAYS_OF_WEEK.includes(slot.day)) {
        throw new InvalidOpeningHoursError(`unknown day: ${slot.day}`);
      }
      if (!TIME_PATTERN.test(slot.open) || !TIME_PATTERN.test(slot.close)) {
        throw new InvalidOpeningHoursError(
          `times must be HH:mm, got ${slot.open}-${slot.close}`,
        );
      }
      if (slot.open >= slot.close) {
        throw new InvalidOpeningHoursError(
          `${slot.day} opens at ${slot.open} but closes at ${slot.close}`,
        );
      }
    }
    OpeningHours.assertNoOverlap(slots);
    return new OpeningHours(slots.map((slot) => ({ ...slot })));
  }

  private static assertNoOverlap(slots: readonly OpeningSlot[]): void {
    for (const day of DAYS_OF_WEEK) {
      const sameDay = slots
        .filter((slot) => slot.day === day)
        .sort((a, b) => a.open.localeCompare(b.open));
      for (let i = 1; i < sameDay.length; i++) {
        if (sameDay[i].open < sameDay[i - 1].close) {
          throw new InvalidOpeningHoursError(`overlapping slots on ${day}`);
        }
      }
    }
  }
}
