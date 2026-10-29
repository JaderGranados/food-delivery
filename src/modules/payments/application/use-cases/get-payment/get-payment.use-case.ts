import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { PaymentNotFoundError } from '../../../domain/index.js';
import { PAYMENT_REPOSITORY } from '../../ports/index.js';
import type { PaymentRepository } from '../../ports/index.js';
import { toPaymentView, type PaymentView } from '../payment-view.js';
import type { GetPaymentCommand } from './get-payment.command.js';

@Injectable()
export class GetPaymentUseCase implements UseCase<
  GetPaymentCommand,
  PaymentView
> {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
  ) {}

  async execute(command: GetPaymentCommand): Promise<PaymentView> {
    const payment = await this.payments.findById(command.paymentId);
    if (!payment) throw new PaymentNotFoundError(command.paymentId);

    return toPaymentView(payment);
  }
}
