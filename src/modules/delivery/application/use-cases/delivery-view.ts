import type { Delivery, DeliveryStatus } from '../../domain/index.js';
import type { LocationInput } from './location-input.js';

export interface DeliveryView {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  courierId?: string;
  pickup: LocationInput;
  dropoff: LocationInput;
  createdAt: Date;
}

export function toDeliveryView(delivery: Delivery): DeliveryView {
  return {
    id: delivery.id,
    orderId: delivery.orderId,
    status: delivery.status,
    ...(delivery.courierId && { courierId: delivery.courierId }),
    pickup: {
      latitude: delivery.pickup.latitude,
      longitude: delivery.pickup.longitude,
    },
    dropoff: {
      latitude: delivery.dropoff.latitude,
      longitude: delivery.dropoff.longitude,
    },
    createdAt: delivery.createdAt,
  };
}
