import type { OpeningSlot } from '../../../domain/index.js';

export interface RegisterRestaurantCommand {
  name: string;
  openingHours: OpeningSlot[];
}
