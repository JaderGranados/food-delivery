import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '@shared/domain/index.js';

export class ArgumentRequiredError extends BadRequestError {
  constructor(argumentName: string) {
    super(`${argumentName} is required`);
    this.name = 'ArgumentRequiredError';
  }
}

export class InvalidLocationError extends BadRequestError {
  constructor(latitude: number, longitude: number) {
    super(`Invalid location: ${latitude}, ${longitude}`);
    this.name = 'InvalidLocationError';
  }
}

export class CourierNotFoundError extends NotFoundError {
  constructor(courierId: string) {
    super(`Courier not found: ${courierId}`);
    this.name = 'CourierNotFoundError';
  }
}

export class DeliveryNotFoundError extends NotFoundError {
  constructor(deliveryId: string) {
    super(`Delivery not found: ${deliveryId}`);
    this.name = 'DeliveryNotFoundError';
  }
}

export class OrderNotFoundError extends NotFoundError {
  constructor(orderId: string) {
    super(`Order not found: ${orderId}`);
    this.name = 'OrderNotFoundError';
  }
}

export class OrderNotConfirmedError extends ConflictError {
  constructor(orderId: string) {
    super(`Order is not confirmed: ${orderId}`);
    this.name = 'OrderNotConfirmedError';
  }
}

export class DeliveryAlreadyRequestedError extends ConflictError {
  constructor(orderId: string) {
    super(`A delivery already exists for order: ${orderId}`);
    this.name = 'DeliveryAlreadyRequestedError';
  }
}

export class NoCourierAvailableError extends ConflictError {
  constructor() {
    super('No courier is available');
    this.name = 'NoCourierAvailableError';
  }
}

export class InvalidCourierTransitionError extends ConflictError {
  constructor(from: string, action: string) {
    super(`A courier who is ${from} cannot ${action}`);
    this.name = 'InvalidCourierTransitionError';
  }
}

export class InvalidDeliveryTransitionError extends ConflictError {
  constructor(from: string, to: string) {
    super(`Cannot move a delivery from ${from} to ${to}`);
    this.name = 'InvalidDeliveryTransitionError';
  }
}
