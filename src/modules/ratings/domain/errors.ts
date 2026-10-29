import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@shared/domain/index.js';

export class ArgumentRequiredError extends BadRequestError {
  constructor(argumentName: string) {
    super(`${argumentName} is required`);
    this.name = 'ArgumentRequiredError';
  }
}

export class InvalidStarsError extends BadRequestError {
  constructor(stars: number) {
    super(`Stars must be a whole number from 1 to 5, got ${stars}`);
    this.name = 'InvalidStarsError';
  }
}

export class InvalidReviewTargetError extends BadRequestError {
  constructor(type: string) {
    super(`Invalid review target: ${type}`);
    this.name = 'InvalidReviewTargetError';
  }
}

export class ReviewCommentTooLongError extends BadRequestError {
  constructor(maxLength: number) {
    super(`A review comment must be at most ${maxLength} characters`);
    this.name = 'ReviewCommentTooLongError';
  }
}

export class ReviewAlreadyExistsError extends ConflictError {
  constructor(orderId: string, targetType: string) {
    super(`Order ${orderId} already has a ${targetType} review`);
    this.name = 'ReviewAlreadyExistsError';
  }
}

export class OrderNotDeliveredError extends ConflictError {
  constructor(orderId: string) {
    super(`Order has not been delivered yet: ${orderId}`);
    this.name = 'OrderNotDeliveredError';
  }
}

export class NotOrderCustomerError extends ForbiddenError {
  constructor(orderId: string) {
    super(`Only the customer who placed order ${orderId} can review it`);
    this.name = 'NotOrderCustomerError';
  }
}

export class OrderNotFoundError extends NotFoundError {
  constructor(orderId: string) {
    super(`Order not found: ${orderId}`);
    this.name = 'OrderNotFoundError';
  }
}
