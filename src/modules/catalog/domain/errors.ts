import { BadRequestError, NotFoundError } from '@shared/domain/index.js';

export class ArgumentRequiredError extends BadRequestError {
  constructor(argumentName: string) {
    super(`${argumentName} is required`);
    this.name = 'ArgumentRequiredError';
  }
}

export class InvalidOpeningHoursError extends BadRequestError {
  constructor(reason: string) {
    super(`Invalid opening hours: ${reason}`);
    this.name = 'InvalidOpeningHoursError';
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
