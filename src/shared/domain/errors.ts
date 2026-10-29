export abstract class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export abstract class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export abstract class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class InvalidMoneyAmountError extends BadRequestError {
  constructor(amount: number) {
    super(`Invalid money amount: ${amount}`);
    this.name = 'InvalidMoneyAmountError';
  }
}

export class InvalidCurrencyError extends BadRequestError {
  constructor(currency: string) {
    super(`Invalid currency: ${currency}`);
    this.name = 'InvalidCurrencyError';
  }
}
