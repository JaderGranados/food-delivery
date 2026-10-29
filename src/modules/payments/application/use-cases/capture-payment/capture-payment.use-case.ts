import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { PaymentNotFoundError } from '../../../domain/index.js';
import { PAYMENT_GATEWAY, PAYMENT_REPOSITORY } from '../../ports/index.js';
import type { PaymentGateway, PaymentRepository } from '../../ports/index.js';
import { toPaymentView, type PaymentView } from '../payment-view.js';
import type { CapturePaymentCommand } from './capture-payment.command.js';

@Injectable()
export class CapturePaymentUseCase implements UseCase<
  CapturePaymentCommand,
  PaymentView
> {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  async execute(command: CapturePaymentCommand): Promise<PaymentView> {
    const payment = await this.payments.findById(command.paymentId);
    if (!payment) throw new PaymentNotFoundError(command.paymentId);

    // Claim the capture before calling the gateway, so a second request that
    // arrives meanwhile is rejected instead of capturing again.
    const reference = payment.beginCapture();
    try {
      await this.payments.save(payment);
    } catch (error) {
      // Nothing was sent to the gateway, so the payment is still capturable.
      payment.abortCapture();
      throw error;
    }

    try {
      await this.gateway.capture(reference, `${payment.id}:capture`);
    } catch (error) {
      payment.abortCapture();
      await this.payments.save(payment);
      throw error;
    }

    payment.completeCapture();
    return toPaymentView(await this.payments.save(payment));
  }
}
