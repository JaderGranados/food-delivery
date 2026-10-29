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

export class InvalidRefundAmountError extends BadRequestError {
  constructor(amount: number) {
    super(`Invalid refund amount: ${amount}`);
    this.name = 'InvalidRefundAmountError';
  }
}

export class CurrencyMismatchError extends BadRequestError {
  constructor(expected: string, received: string) {
    super(`Expected currency ${expected} but received ${received}`);
    this.name = 'CurrencyMismatchError';
  }
}

export class RefundExceedsPaymentError extends ConflictError {
  constructor(requested: number, refundable: number) {
    super(`Cannot refund ${requested}; only ${refundable} is refundable`);
    this.name = 'RefundExceedsPaymentError';
  }
}

export class InvalidPaymentTransitionError extends ConflictError {
  constructor(from: string, action: string) {
    super(`A payment that is ${from} cannot be ${action}`);
    this.name = 'InvalidPaymentTransitionError';
  }
}

export class PaymentAlreadyExistsError extends ConflictError {
  constructor(orderId: string) {
    super(`A payment already exists for order: ${orderId}`);
    this.name = 'PaymentAlreadyExistsError';
  }
}

export class OrderNotPayableError extends ConflictError {
  constructor(orderId: string, status: string) {
    super(`Order ${orderId} cannot be paid while ${status}`);
    this.name = 'OrderNotPayableError';
  }
}

export class PaymentDeclinedError extends ConflictError {
  constructor(reason: string) {
    super(`Payment declined: ${reason}`);
    this.name = 'PaymentDeclinedError';
  }
}

export class PaymentNotFoundError extends NotFoundError {
  constructor(paymentId: string) {
    super(`Payment not found: ${paymentId}`);
    this.name = 'PaymentNotFoundError';
  }
}

export class OrderNotFoundError extends NotFoundError {
  constructor(orderId: string) {
    super(`Order not found: ${orderId}`);
    this.name = 'OrderNotFoundError';
  }
}
