import type { LocationInput } from '../location-input.js';

export interface SetCourierAvailabilityCommand {
  courierId: string;
  available: boolean;
  /** Required when going available. */
  location?: LocationInput;
}
