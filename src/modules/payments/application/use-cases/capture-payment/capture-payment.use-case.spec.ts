import { Money } from '@shared/domain/index.js';
import {
  InvalidPaymentTransitionError,
  Payment,
  PaymentAlreadyExistsError,
  PaymentNotFoundError,
} from '../../../domain/index.js';
import type {
  AuthorizationResult,
  PaymentGateway,
  PaymentRepository,
} from '../../ports/index.js';
import { CapturePaymentUseCase } from './capture-payment.use-case.js';

class FakePaymentRepository implements PaymentRepository {
  readonly saved = new Map<string, Payment>();
  /** Makes the next `save` calls fail, to simulate a store outage. */
  failSaves = 0;

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
    const taken = [...this.saved.values()].some(
      (p) => p.orderId === payment.orderId && p.isActive,
    );
    if (taken)
      return Promise.reject(new PaymentAlreadyExistsError(payment.orderId));
    this.saved.set(payment.id, payment);
    return Promise.resolve(payment);
  }

  save(payment: Payment): Promise<Payment> {
    if (this.failSaves > 0) {
      this.failSaves -= 1;
      return Promise.reject(new Error('store down'));
    }
    this.saved.set(payment.id, payment);
    return Promise.resolve(payment);
  }
}

class FakeGateway implements PaymentGateway {
  readonly calls: string[] = [];
  readonly refunded: number[] = [];
  readonly authorizeKeys: string[] = [];
  readonly refundKeys: string[] = [];
  failNext = false;
  declineWith: string | null = null;
  /** Holds every call until released, to line up concurrent requests. */
  private gate: Promise<void> = Promise.resolve();
  private release: () => void = () => {};

  hold(): void {
    this.gate = new Promise((resolve) => {
      this.release = resolve;
    });
  }

  open(): void {
    this.release();
  }

  private async call(name: string): Promise<void> {
    this.calls.push(name);
    await this.gate;
    if (this.failNext) throw new Error('gateway down');
  }

  async authorize(request: {
    idempotencyKey: string;
  }): Promise<AuthorizationResult> {
    this.authorizeKeys.push(request.idempotencyKey);
    await this.call('authorize');
    return this.declineWith
      ? { approved: false, reason: this.declineWith }
      : { approved: true, reference: 'gw-1' };
  }

  async capture(): Promise<void> {
    await this.call('capture');
  }

  async refund(
    _reference: string,
    amount: { amount: number },
    idempotencyKey: string,
  ): Promise<void> {
    this.refundKeys.push(idempotencyKey);
    await this.call('refund');
    this.refunded.push(amount.amount);
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

describe('CapturePayment', () => {
  let payments: FakePaymentRepository;
  let gateway: FakeGateway;
  let capture: CapturePaymentUseCase;

  beforeEach(async () => {
    payments = new FakePaymentRepository();
    gateway = new FakeGateway();
    capture = new CapturePaymentUseCase(payments, gateway);
    await payments.save(authorizedPayment());
  });

  it('captures an authorized payment', async () => {
    const result = await capture.execute({ paymentId: 'p-1' });

    expect(result.status).toBe('captured');
    expect(gateway.calls).toEqual(['capture']);
  });

  it('fails when the payment does not exist', async () => {
    await expect(capture.execute({ paymentId: 'nope' })).rejects.toThrow(
      PaymentNotFoundError,
    );
  });

  it('does not call the gateway again for a captured payment', async () => {
    await capture.execute({ paymentId: 'p-1' });

    await expect(capture.execute({ paymentId: 'p-1' })).rejects.toThrow(
      InvalidPaymentTransitionError,
    );
    expect(gateway.calls).toEqual(['capture']);
  });

  it('captures only once when two requests arrive together', async () => {
    gateway.hold();

    const results = Promise.allSettled([
      capture.execute({ paymentId: 'p-1' }),
      capture.execute({ paymentId: 'p-1' }),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    gateway.open();
    const [first, second] = await results;

    expect(first.status).toBe('fulfilled');
    expect(second.status).toBe('rejected');
    expect((second as PromiseRejectedResult).reason).toBeInstanceOf(
      InvalidPaymentTransitionError,
    );
    expect(gateway.calls).toEqual(['capture']);
    expect(payments.saved.get('p-1')?.status).toBe('captured');
  });

  it('puts the payment back to authorized when the gateway fails', async () => {
    gateway.failNext = true;
    await expect(capture.execute({ paymentId: 'p-1' })).rejects.toThrow(
      'gateway down',
    );
    expect(payments.saved.get('p-1')?.status).toBe('authorized');

    gateway.failNext = false;
    await expect(capture.execute({ paymentId: 'p-1' })).resolves.toMatchObject({
      status: 'captured',
    });
  });

  it('leaves the payment capturable when the claim cannot be saved', async () => {
    payments.failSaves = 1;

    await expect(capture.execute({ paymentId: 'p-1' })).rejects.toThrow(
      'store down',
    );

    expect(gateway.calls).toEqual([]);
    expect(payments.saved.get('p-1')?.status).toBe('authorized');
    await expect(capture.execute({ paymentId: 'p-1' })).resolves.toMatchObject({
      status: 'captured',
    });
  });
});
