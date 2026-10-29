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

export class InvalidCouponCodeError extends BadRequestError {
  constructor(code: string) {
    super(`Invalid coupon code: ${code}`);
    this.name = 'InvalidCouponCodeError';
  }
}

export class InvalidDiscountError extends BadRequestError {
  constructor(reason: string) {
    super(`Invalid discount: ${reason}`);
    this.name = 'InvalidDiscountError';
  }
}

export class InvalidValidityWindowError extends BadRequestError {
  constructor() {
    super('A coupon must stop being valid after it starts');
    this.name = 'InvalidValidityWindowError';
  }
}

export class InvalidUsageLimitError extends BadRequestError {
  constructor(limit: number) {
    super(`Invalid usage limit: ${limit}`);
    this.name = 'InvalidUsageLimitError';
  }
}

export class CurrencyMismatchError extends BadRequestError {
  constructor(expected: string, received: string) {
    super(`Expected currency ${expected} but received ${received}`);
    this.name = 'CurrencyMismatchError';
  }
}

export class CouponCodeAlreadyExistsError extends ConflictError {
  constructor(code: string) {
    super(`Coupon code already exists: ${code}`);
    this.name = 'CouponCodeAlreadyExistsError';
  }
}

export class CouponNotYetValidError extends ConflictError {
  constructor(code: string) {
    super(`Coupon is not valid yet: ${code}`);
    this.name = 'CouponNotYetValidError';
  }
}

export class CouponExpiredError extends ConflictError {
  constructor(code: string) {
    super(`Coupon has expired: ${code}`);
    this.name = 'CouponExpiredError';
  }
}

export class CouponUsageLimitReachedError extends ConflictError {
  constructor(code: string) {
    super(`Coupon usage limit reached: ${code}`);
    this.name = 'CouponUsageLimitReachedError';
  }
}

export class MinimumOrderNotMetError extends ConflictError {
  constructor(minimum: number, subtotal: number) {
    super(`Order of ${subtotal} is below the minimum of ${minimum}`);
    this.name = 'MinimumOrderNotMetError';
  }
}

export class CouponAlreadyRedeemedForOrderError extends ConflictError {
  constructor(code: string, orderId: string) {
    super(`Coupon ${code} was already redeemed for order: ${orderId}`);
    this.name = 'CouponAlreadyRedeemedForOrderError';
  }
}

export class CouponNotFoundError extends NotFoundError {
  constructor(code: string) {
    super(`Coupon not found: ${code}`);
    this.name = 'CouponNotFoundError';
  }
}
