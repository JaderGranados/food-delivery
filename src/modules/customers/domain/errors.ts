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

export class InvalidEmailError extends BadRequestError {
  constructor(email: string) {
    super(`Invalid email: ${email}`);
    this.name = 'InvalidEmailError';
  }
}

export class EmailAlreadyInUseError extends ConflictError {
  constructor(email: string) {
    super(`Email already in use: ${email}`);
    this.name = 'EmailAlreadyInUseError';
  }
}

export class AddressFieldRequiredError extends BadRequestError {
  constructor(field: string) {
    super(`Invalid address: ${field} is required`);
    this.name = 'AddressFieldRequiredError';
  }
}

export class AddressFieldTooLongError extends BadRequestError {
  constructor(field: string, maxLength: number) {
    super(`Invalid address: ${field} must be at most ${maxLength} characters`);
    this.name = 'AddressFieldTooLongError';
  }
}

export class InvalidPostalCodeError extends BadRequestError {
  constructor(postalCode: string) {
    super(`Invalid postal code: ${postalCode}`);
    this.name = 'InvalidPostalCodeError';
  }
}

export class CustomerNotFoundError extends NotFoundError {
  constructor(customerId: string) {
    super(`Customer not found: ${customerId}`);
    this.name = 'CustomerNotFoundError';
  }
}
