import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { Money } from '@shared/domain/index.js';
import { PaymentNotFoundError, type Payment } from '../../../domain/index.js';
import {
  GatewayRejectedError,
  PAYMENT_GATEWAY,
  PAYMENT_REPOSITORY,
} from '../../ports/index.js';
import type { PaymentGateway, PaymentRepository } from '../../ports/index.js';
import { toPaymentView, type PaymentView } from '../payment-view.js';
import type { RefundPaymentCommand } from './refund-payment.command.js';

@Injectable()
export class RefundPaymentUseCase implements UseCase<
  RefundPaymentCommand,
  PaymentView
> {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  async execute(command: RefundPaymentCommand): Promise<PaymentView> {
    const payment = await this.payments.findById(command.paymentId);
    if (!payment) throw new PaymentNotFoundError(command.paymentId);

    const amount =
      command.amount === undefined
        ? payment.refundable
        : Money.create(command.amount, payment.amount.currency);

    // Reserve the amount before calling the gateway, so refunds that arrive
    // meanwhile only see what is left and can never exceed the payment.
    const { reference, idempotencyKey, resumed } =
      payment.reserveRefund(amount);
    try {
      await this.payments.save(payment);
    } catch (error) {
      // Nothing was sent to the gateway on this attempt. A new refund is
      // simply dropped, but a retried one may have gone through earlier, so
      // it goes back to unconfirmed with its amount still reserved.
      if (resumed) {
        payment.markRefundUnconfirmed(idempotencyKey);
      } else {
        payment.abortRefund(idempotencyKey);
      }
      throw error;
    }

    try {
      await this.gateway.refund(
        reference,
        { amount: amount.amount, currency: amount.currency },
        idempotencyKey,
      );
    } catch (error) {
      // Only a definite refusal gives the amount back. Otherwise the refund
      // may have happened, so keep it reserved until the same amount is retried.
      if (error instanceof GatewayRejectedError) {
        payment.abortRefund(idempotencyKey);
      } else {
        payment.markRefundUnconfirmed(idempotencyKey);
      }
      await this.keepSaved(payment);
      throw error;
    }

    payment.completeRefund(idempotencyKey);
    return toPaymentView(await this.payments.save(payment));
  }

  /** Best effort: the error being handled matters more than a failed save. */
  private async keepSaved(payment: Payment): Promise<void> {
    try {
      await this.payments.save(payment);
    } catch {
      // The in-memory state is already correct; a retry will save it again.
    }
  }
}
