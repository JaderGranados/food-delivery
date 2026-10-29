import type { Courier, CourierStatus } from '../../domain/index.js';
import type { LocationInput } from './location-input.js';

export interface CourierView {
  id: string;
  name: string;
  status: CourierStatus;
  location?: LocationInput;
}

export function toCourierView(courier: Courier): CourierView {
  return {
    id: courier.id,
    name: courier.name,
    status: courier.status,
    ...(courier.location && {
      location: {
        latitude: courier.location.latitude,
        longitude: courier.location.longitude,
      },
    }),
  };
}
