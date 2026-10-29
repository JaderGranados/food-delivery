import type { LocationInput } from '../location-input.js';

export interface UpdateCourierLocationCommand {
  courierId: string;
  location: LocationInput;
}
