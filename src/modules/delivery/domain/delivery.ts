import {
  ArgumentRequiredError,
  InvalidDeliveryTransitionError,
} from './errors.js';
import type { Location } from './value-objects/index.js';

export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'delivered';

export interface RequestDeliveryProps {
  id: string;
  orderId: string;
  pickup: Location;
  dropoff: Location;
  now: Date;
}

/** Delivery job for an order. It only references the order by id. */
export class Delivery {
  private currentStatus: DeliveryStatus = 'pending';
  private assignedCourierId: string | undefined;

  private constructor(
    readonly id: string,
    readonly orderId: string,
    readonly pickup: Location,
    readonly dropoff: Location,
    readonly createdAt: Date,
  ) {}

  static request({
    id,
    orderId,
    pickup,
    dropoff,
    now,
  }: RequestDeliveryProps): Delivery {
    if (!id) throw new ArgumentRequiredError('ID');
    if (!orderId) throw new ArgumentRequiredError('Order ID');
    return new Delivery(id, orderId, pickup, dropoff, now);
  }

  get status(): DeliveryStatus {
    return this.currentStatus;
  }

  get courierId(): string | undefined {
    return this.assignedCourierId;
  }

  assignTo(courierId: string): void {
    this.transition('pending', 'assigned');
    this.assignedCourierId = courierId;
  }

  pickUp(): void {
    this.transition('assigned', 'picked_up');
  }

  complete(): void {
    this.transition('picked_up', 'delivered');
  }

  private transition(expected: DeliveryStatus, next: DeliveryStatus): void {
    if (this.currentStatus !== expected) {
      throw new InvalidDeliveryTransitionError(this.currentStatus, next);
    }
    this.currentStatus = next;
  }
}
