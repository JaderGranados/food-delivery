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

export class InvalidQuantityError extends BadRequestError {
  constructor(quantity: number) {
    super(`Invalid quantity: ${quantity}`);
    this.name = 'InvalidQuantityError';
  }
}

export class EmptyOrderError extends BadRequestError {
  constructor() {
    super('An order needs at least one item');
    this.name = 'EmptyOrderError';
  }
}

export class DuplicateOrderLineError extends BadRequestError {
  constructor(menuItemId: string) {
    super(`Menu item listed more than once: ${menuItemId}`);
    this.name = 'DuplicateOrderLineError';
  }
}

export class MixedCurrenciesError extends BadRequestError {
  constructor() {
    super('All items in an order must use the same currency');
    this.name = 'MixedCurrenciesError';
  }
}

export class MenuItemUnavailableError extends ConflictError {
  constructor(menuItemId: string) {
    super(`Menu item is not available: ${menuItemId}`);
    this.name = 'MenuItemUnavailableError';
  }
}

export class InvalidOrderTransitionError extends ConflictError {
  constructor(from: string, to: string) {
    super(`Cannot move an order from ${from} to ${to}`);
    this.name = 'InvalidOrderTransitionError';
  }
}

export class OrderNotFoundError extends NotFoundError {
  constructor(orderId: string) {
    super(`Order not found: ${orderId}`);
    this.name = 'OrderNotFoundError';
  }
}

export class RestaurantNotFoundError extends NotFoundError {
  constructor(restaurantId: string) {
    super(`Restaurant not found: ${restaurantId}`);
    this.name = 'RestaurantNotFoundError';
  }
}

export class MenuItemNotFoundError extends NotFoundError {
  constructor(menuItemId: string) {
    super(`Menu item not found: ${menuItemId}`);
    this.name = 'MenuItemNotFoundError';
  }
}
