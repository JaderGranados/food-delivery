import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type {
  AuthorizationResult,
  AuthorizeRequest,
  GatewayAmount,
  PaymentGateway,
} from '../../application/index.js';

/** Stand-in for a real provider: approves everything except `tok_declined`. */
@Injectable()
export class FakePaymentGateway implements PaymentGateway {
  async authorize({
    paymentToken,
  }: AuthorizeRequest): Promise<AuthorizationResult> {
    if (paymentToken === 'tok_declined') {
      return { approved: false, reason: 'card declined' };
    }
    return { approved: true, reference: `fake_${randomUUID()}` };
  }

  async capture(_reference: string, _idempotencyKey: string): Promise<void> {}

  async refund(
    _reference: string,
    _amount: GatewayAmount,
    _idempotencyKey: string,
  ): Promise<void> {}
}
