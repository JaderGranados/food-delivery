import type { LocationInput } from '../location-input.js';

export interface RequestDeliveryCommand {
  orderId: string;
  pickup: LocationInput;
  dropoff: LocationInput;
}
