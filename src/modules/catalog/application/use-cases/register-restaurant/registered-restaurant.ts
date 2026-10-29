import type { OpeningSlot } from '../../../domain/index.js';

export interface RegisteredRestaurant {
  id: string;
  name: string;
  openingHours: OpeningSlot[];
  createdAt: Date;
}
