import { Money } from '@shared/domain/index.js';
import {
  ArgumentRequiredError,
  CurrencyMismatchError,
  InvalidPaymentTransitionError,
  InvalidRefundAmountError,
  RefundExceedsPaymentError,
} from './errors.js';

export type PaymentStatus =
  | 'pending'
  | 'unconfirmed'
  | 'authorized'
  | 'capturing'
  | 'captured'
  | 'partially_refunded'
  | 'refunded'
  | 'declined';

export interface InitiatePaymentProps {
  id: string;
  orderId: string;
  amount: Money;
  now: Date;
}

export interface RefundReservation {
  /** Gateway reference of the authorization being refunded. */
  reference: string;
  idempotencyKey: string;
}

interface RefundEntry {
  idempotencyKey: string;
  amount: number;
  /** The gateway failed without answering, so the refund may have happened. */
  unconfirmed: boolean;
}

/**
 * Anything that talks to the gateway is split into a synchronous "begin" that
 * claims the state (`beginCapture`, `reserveRefund`), the gateway call, and a
 * "complete" or "abort". Claiming before the call means a second request that
 * arrives while the gateway is busy is rejected instead of acting twice.
 */
export class Payment {
  private currentStatus: PaymentStatus = 'pending';
  private reference: string | undefined;
  private refundedAmount = 0;
  private refundEntries: RefundEntry[] = [];
  private refundCount = 0;

  private constructor(
    readonly id: string,
    readonly orderId: string,
    readonly amount: Money,
    readonly createdAt: Date,
  ) {}

  static initiate({ id, orderId, amount, now }: InitiatePaymentProps): Payment {
    if (!id) throw new ArgumentRequiredError('ID');
    if (!orderId) throw new ArgumentRequiredError('Order ID');
    return new Payment(id, orderId, amount, now);
  }

  get status(): PaymentStatus {
    return this.currentStatus;
  }

  /** A declined payment no longer holds the order; anything else does. */
  get isActive(): boolean {
    return this.currentStatus !== 'declined';
  }

  get refunded(): Money {
    return Money.create(this.refundedAmount, this.amount.currency);
  }

  /** What can still be refunded, excluding refunds in flight or unconfirmed. */
  get refundable(): Money {
    return Money.create(
      this.amount.amount - this.refundedAmount - this.reservedRefundAmount,
      this.amount.currency,
    );
  }

  private get reservedRefundAmount(): number {
    return this.refundEntries.reduce((sum, entry) => sum + entry.amount, 0);
  }

  authorize(gatewayReference: string): void {
    if (!gatewayReference) throw new ArgumentRequiredError('Gateway reference');
    this.transition('pending', 'authorized', 'authorized');
    this.reference = gatewayReference;
  }

  decline(): void {
    this.transition('pending', 'declined', 'declined');
  }

  /**
   * The authorization attempt ended in a way we could not record: the gateway
   * failed without answering, or its answer could not be stored. The card may
   * or may not be on hold, so the payment keeps the order and can be resumed,
   * which asks the gateway again with the same idempotency key (the payment
   * id). Valid from any status an authorization attempt can end in.
   */
  markUnconfirmed(): void {
    const outcomes: PaymentStatus[] = ['pending', 'authorized', 'declined'];
    if (!outcomes.includes(this.currentStatus)) {
      throw new InvalidPaymentTransitionError(
        this.currentStatus,
        'unconfirmed',
      );
    }
    this.currentStatus = 'unconfirmed';
  }

  /** Claims a retry of an unconfirmed authorization. */
  resume(): void {
    this.transition('unconfirmed', 'pending', 'resumed');
  }

  /** Claims the capture and returns the gateway reference to capture. */
  beginCapture(): string {
    this.transition('authorized', 'capturing', 'captured');
    return this.reference!;
  }

  completeCapture(): void {
    this.transition('capturing', 'captured', 'captured');
  }

  /** The gateway did not capture; the payment can be captured again. */
  abortCapture(): void {
    this.transition('capturing', 'authorized', 'captured');
  }

  /**
   * Claims `amount` for a refund. Asking again for the amount of an
   * unconfirmed refund retries that same refund, with the same idempotency
   * key, instead of reserving a second amount.
   */
  reserveRefund(amount: Money): RefundReservation {
    if (
      this.currentStatus !== 'captured' &&
      this.currentStatus !== 'partially_refunded'
    ) {
      throw new InvalidPaymentTransitionError(this.currentStatus, 'refunded');
    }
    if (amount.currency !== this.amount.currency) {
      throw new CurrencyMismatchError(this.amount.currency, amount.currency);
    }

    const retry = this.refundEntries.find(
      (entry) => entry.unconfirmed && entry.amount === amount.amount,
    );
    if (retry) {
      retry.unconfirmed = false;
      return {
        reference: this.reference!,
        idempotencyKey: retry.idempotencyKey,
      };
    }

    const refundable = this.refundable.amount;
    if (refundable === 0) {
      throw new RefundExceedsPaymentError(amount.amount, 0);
    }
    if (amount.amount <= 0) throw new InvalidRefundAmountError(amount.amount);
    if (amount.amount > refundable) {
      throw new RefundExceedsPaymentError(amount.amount, refundable);
    }

    this.refundCount += 1;
    const idempotencyKey = `${this.id}:refund:${this.refundCount}`;
    this.refundEntries.push({
      idempotencyKey,
      amount: amount.amount,
      unconfirmed: false,
    });
    return { reference: this.reference!, idempotencyKey };
  }

  completeRefund(idempotencyKey: string): void {
    const entry = this.takeRefundEntry(idempotencyKey);
    this.refundedAmount += entry.amount;
    this.currentStatus =
      this.refundedAmount === this.amount.amount
        ? 'refunded'
        : 'partially_refunded';
  }

  /** The gateway definitely refused: give the reserved amount back. */
  abortRefund(idempotencyKey: string): void {
    this.takeRefundEntry(idempotencyKey);
  }

  /**
   * The gateway failed without answering, so the refund may have happened.
   * The amount stays reserved so it cannot be refunded again; retry the same
   * amount to settle it with the same idempotency key.
   */
  markRefundUnconfirmed(idempotencyKey: string): void {
    const entry = this.refundEntries.find(
      (candidate) => candidate.idempotencyKey === idempotencyKey,
    );
    if (!entry) {
      throw new InvalidPaymentTransitionError(
        this.currentStatus,
        'marking an unknown refund unconfirmed',
      );
    }
    entry.unconfirmed = true;
  }

  private takeRefundEntry(idempotencyKey: string): RefundEntry {
    const index = this.refundEntries.findIndex(
      (entry) => entry.idempotencyKey === idempotencyKey,
    );
    if (index === -1) {
      throw new InvalidPaymentTransitionError(
        this.currentStatus,
        'settling an unknown refund',
      );
    }
    return this.refundEntries.splice(index, 1)[0];
  }

  private transition(
    expected: PaymentStatus,
    next: PaymentStatus,
    action: string,
  ): void {
    if (this.currentStatus !== expected) {
      throw new InvalidPaymentTransitionError(this.currentStatus, action);
    }
    this.currentStatus = next;
  }
}
