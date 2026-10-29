import {
  ArgumentRequiredError,
  InvalidCourierTransitionError,
} from './errors.js';
import type { Location } from './value-objects/index.js';

export type CourierStatus = 'offline' | 'available' | 'busy';

export interface RegisterCourierProps {
  id: string;
  name: string;
  now: Date;
}

export class Courier {
  private currentStatus: CourierStatus = 'offline';
  private currentLocation: Location | undefined;

  private constructor(
    readonly id: string,
    readonly name: string,
    readonly createdAt: Date,
  ) {}

  static register({ id, name, now }: RegisterCourierProps): Courier {
    if (!id) throw new ArgumentRequiredError('ID');
    if (!name?.trim()) throw new ArgumentRequiredError('Name');
    return new Courier(id, name.trim(), now);
  }

  get status(): CourierStatus {
    return this.currentStatus;
  }

  get location(): Location | undefined {
    return this.currentLocation;
  }

  goOnline(location: Location): void {
    if (this.currentStatus === 'busy') {
      throw new InvalidCourierTransitionError(this.currentStatus, 'go online');
    }
    this.currentLocation = location;
    this.currentStatus = 'available';
  }

  goOffline(): void {
    if (this.currentStatus === 'busy') {
      throw new InvalidCourierTransitionError(this.currentStatus, 'go offline');
    }
    this.currentStatus = 'offline';
  }

  updateLocation(location: Location): void {
    this.currentLocation = location;
  }

  distanceTo(target: Location): number {
    if (!this.currentLocation) return Number.POSITIVE_INFINITY;
    return this.currentLocation.distanceTo(target);
  }

  assign(): void {
    if (this.currentStatus !== 'available') {
      throw new InvalidCourierTransitionError(
        this.currentStatus,
        'take a delivery',
      );
    }
    this.currentStatus = 'busy';
  }

  release(): void {
    if (this.currentStatus !== 'busy') {
      throw new InvalidCourierTransitionError(
        this.currentStatus,
        'finish a delivery',
      );
    }
    this.currentStatus = 'available';
  }
}
