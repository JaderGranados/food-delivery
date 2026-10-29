import { Money } from '@shared/domain/index.js';
import { Payment, PaymentNotFoundError } from '../../../domain/index.js';
import type { PaymentRepository } from '../../ports/index.js';
import { GetPaymentUseCase } from './get-payment.use-case.js';

class FakePaymentRepository implements PaymentRepository {
  readonly saved = new Map<string, Payment>();

  findById(id: string): Promise<Payment | null> {
    return Promise.resolve(this.saved.get(id) ?? null);
  }

  findActiveByOrderId(orderId: string): Promise<Payment | null> {
    return Promise.resolve(
      [...this.saved.values()].find(
        (p) => p.orderId === orderId && p.isActive,
      ) ?? null,
    );
  }

  add(payment: Payment): Promise<Payment> {
    this.saved.set(payment.id, payment);
    return Promise.resolve(payment);
  }

  save(payment: Payment): Promise<Payment> {
    this.saved.set(payment.id, payment);
    return Promise.resolve(payment);
  }
}

function authorizedPayment(): Payment {
  const payment = Payment.initiate({
    id: 'p-1',
    orderId: 'o-1',
    amount: Money.create(10000, 'CRC'),
    now: new Date(),
  });
  payment.authorize('gw-1');
  return payment;
}

describe('GetPayment', () => {
  let payments: FakePaymentRepository;
  let getPayment: GetPaymentUseCase;

  beforeEach(() => {
    payments = new FakePaymentRepository();
    getPayment = new GetPaymentUseCase(payments);
  });

  it('returns the payment', async () => {
    await payments.save(authorizedPayment());

    const result = await getPayment.execute({ paymentId: 'p-1' });

    expect(result).toMatchObject({
      id: 'p-1',
      orderId: 'o-1',
      status: 'authorized',
      amount: { amount: 10000, currency: 'CRC' },
    });
  });

  it('fails when the payment does not exist', async () => {
    await expect(getPayment.execute({ paymentId: 'nope' })).rejects.toThrow(
      PaymentNotFoundError,
    );
  });
});
