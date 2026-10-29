export interface GatewayAmount {
  amount: number;
  currency: string;
}

export interface AuthorizeRequest extends GatewayAmount {
  /** Opaque token for the payment method, issued by the client-side SDK. */
  paymentToken: string;
  /** Same key, same operation: the gateway must not act on it twice. */
  idempotencyKey: string;
}

export type AuthorizationResult =
  { approved: true; reference: string } | { approved: false; reason: string };

/**
 * Thrown by a gateway call that the provider definitely refused, so nothing
 * happened. Any other error means the outcome is unknown: the provider may
 * have acted before the call failed.
 */
export class GatewayRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GatewayRejectedError';
  }
}

/** The external payment provider. Every call carries an idempotency key. */
export interface PaymentGateway {
  authorize(request: AuthorizeRequest): Promise<AuthorizationResult>;
  capture(reference: string, idempotencyKey: string): Promise<void>;
  refund(
    reference: string,
    amount: GatewayAmount,
    idempotencyKey: string,
  ): Promise<void>;
}
