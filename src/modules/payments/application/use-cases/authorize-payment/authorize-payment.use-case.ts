import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { Money } from '@shared/domain/index.js';
import {
  OrderNotFoundError,
  OrderNotPayableError,
  Payment,
  PaymentAlreadyExistsError,
  PaymentDeclinedError,
} from '../../../domain/index.js';
import {
  ORDER_LOOKUP,
  PAYMENT_GATEWAY,
  PAYMENT_REPOSITORY,
} from '../../ports/index.js';
import type {
  OrderLookup,
  PaymentGateway,
  PaymentRepository,
} from '../../ports/index.js';
import { toPaymentView, type PaymentView } from '../payment-view.js';
import type { AuthorizePaymentCommand } from './authorize-payment.command.js';

const PAYABLE_ORDER_STATUSES = ['placed', 'confirmed'];

/** Authorizes the order total; the amount always comes from Ordering. */
@Injectable()
export class AuthorizePaymentUseCase implements UseCase<
  AuthorizePaymentCommand,
  PaymentView
> {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    @Inject(ORDER_LOOKUP) private readonly orders: OrderLookup,
  ) {}

  async execute(command: AuthorizePaymentCommand): Promise<PaymentView> {
    const order = await this.orders.findOrder(command.orderId);
    if (!order) throw new OrderNotFoundError(command.orderId);
    if (!PAYABLE_ORDER_STATUSES.includes(order.status)) {
      throw new OrderNotPayableError(order.id, order.status);
    }

    // Claim the order before calling the gateway: `add` rejects a second
    // active payment for the same order, so only one request gets this far.
    // The one exception is an unconfirmed attempt (the gateway failed without
    // answering), which is resumed with the same payment and idempotency key
    // so the card cannot be held twice.
    const existing = await this.payments.findActiveByOrderId(order.id);
    let payment: Payment;
    if (existing) {
      if (existing.status !== 'unconfirmed') {
        throw new PaymentAlreadyExistsError(order.id);
      }
      existing.resume();
      payment = await this.payments.save(existing);
    } else {
      payment = await this.payments.add(
        Payment.initiate({
          id: randomUUID(),
          orderId: order.id,
          amount: Money.create(order.total.amount, order.total.currency),
          now: new Date(),
        }),
      );
    }

    try {
      const result = await this.gateway.authorize({
        amount: payment.amount.amount,
        currency: payment.amount.currency,
        paymentToken: command.paymentToken,
        idempotencyKey: payment.id,
      });

      if (!result.approved) {
        payment.decline();
        await this.payments.save(payment);
        throw new PaymentDeclinedError(result.reason);
      }
      payment.authorize(result.reference);
      await this.payments.save(payment);
    } catch (error) {
      if (error instanceof PaymentDeclinedError) throw error;
      // No definite answer, or the answer could not be recorded: the card may
      // be on hold, so keep the payment and let a retry resume it.
      await this.keepUnconfirmed(payment);
      throw error;
    }

    return toPaymentView(payment);
  }

  /** Best effort: the error being handled matters more than a failed save. */
  private async keepUnconfirmed(payment: Payment): Promise<void> {
    try {
      payment.markUnconfirmed();
      await this.payments.save(payment);
    } catch {
      // The original error is what the caller needs to see.
    }
  }
}
