import { Money } from '@shared/domain/index.js';
import {
  InvalidPaymentTransitionError,
  Payment,
  PaymentAlreadyExistsError,
  PaymentNotFoundError,
  RefundExceedsPaymentError,
} from '../../../domain/index.js';
import {
  GatewayRejectedError,
  type AuthorizationResult,
  type PaymentGateway,
  PaymentRepository,
} from '../../ports/index.js';
import { RefundPaymentUseCase } from './refund-payment.use-case.js';

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
    const taken = [...this.saved.values()].some(
      (p) => p.orderId === payment.orderId && p.isActive,
    );
    if (taken)
      return Promise.reject(new PaymentAlreadyExistsError(payment.orderId));
    this.saved.set(payment.id, payment);
    return Promise.resolve(payment);
  }

  save(payment: Payment): Promise<Payment> {
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
  rejectNext = false;
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
    if (this.rejectNext) throw new GatewayRejectedError('refused');
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

const together = async (gateway: FakeGateway, ...runs: Promise<unknown>[]) => {
  const settled = Promise.allSettled(runs);
  await new Promise((resolve) => setTimeout(resolve, 0));
  gateway.open();
  return settled;
};

describe('RefundPayment', () => {
  let payments: FakePaymentRepository;
  let gateway: FakeGateway;
  let refund: RefundPaymentUseCase;

  beforeEach(async () => {
    payments = new FakePaymentRepository();
    gateway = new FakeGateway();
    refund = new RefundPaymentUseCase(payments, gateway);
    const payment = authorizedPayment();
    payment.beginCapture();
    payment.completeCapture();
    await payments.save(payment);
  });

  it('refunds part of the payment', async () => {
    const result = await refund.execute({ paymentId: 'p-1', amount: 4000 });

    expect(result.status).toBe('partially_refunded');
    expect(result.refunded).toEqual({ amount: 4000, currency: 'CRC' });
  });

  it('refunds everything left when no amount is given', async () => {
    await refund.execute({ paymentId: 'p-1', amount: 4000 });

    const result = await refund.execute({ paymentId: 'p-1' });

    expect(result.status).toBe('refunded');
    expect(result.refunded).toEqual({ amount: 10000, currency: 'CRC' });
    expect(gateway.refunded).toEqual([4000, 6000]);
  });

  it('fails when asking for more than is refundable', async () => {
    await expect(
      refund.execute({ paymentId: 'p-1', amount: 10001 }),
    ).rejects.toThrow(RefundExceedsPaymentError);
    expect(gateway.calls).toEqual([]);
  });

  it('fails when the payment was never captured', async () => {
    const payment = Payment.initiate({
      id: 'p-2',
      orderId: 'o-2',
      amount: Money.create(500, 'CRC'),
      now: new Date(),
    });
    payment.authorize('gw-2');
    await payments.save(payment);

    await expect(refund.execute({ paymentId: 'p-2' })).rejects.toThrow(
      InvalidPaymentTransitionError,
    );
    expect(gateway.calls).toEqual([]);
  });

  it('fails when the payment does not exist', async () => {
    await expect(refund.execute({ paymentId: 'nope' })).rejects.toThrow(
      PaymentNotFoundError,
    );
  });

  it('never refunds more than the payment when two refunds arrive together', async () => {
    gateway.hold();

    const [first, second] = await together(
      gateway,
      refund.execute({ paymentId: 'p-1', amount: 8000 }),
      refund.execute({ paymentId: 'p-1', amount: 8000 }),
    );

    expect(first.status).toBe('fulfilled');
    expect(second.status).toBe('rejected');
    expect((second as PromiseRejectedResult).reason).toBeInstanceOf(
      RefundExceedsPaymentError,
    );
    expect(gateway.refunded).toEqual([8000]);
    expect(payments.saved.get('p-1')?.refunded.amount).toBe(8000);
  });

  it('refunds the total once when two full refunds arrive together', async () => {
    gateway.hold();

    const [first, second] = await together(
      gateway,
      refund.execute({ paymentId: 'p-1' }),
      refund.execute({ paymentId: 'p-1' }),
    );

    expect(first.status).toBe('fulfilled');
    expect(second.status).toBe('rejected');
    expect(gateway.refunded).toEqual([10000]);
    expect(payments.saved.get('p-1')?.status).toBe('refunded');
  });

  it('lets two refunds that fit together both go through', async () => {
    gateway.hold();

    const [first, second] = await together(
      gateway,
      refund.execute({ paymentId: 'p-1', amount: 4000 }),
      refund.execute({ paymentId: 'p-1', amount: 6000 }),
    );

    expect(first.status).toBe('fulfilled');
    expect(second.status).toBe('fulfilled');
    expect(payments.saved.get('p-1')?.status).toBe('refunded');
  });

  it('gives the amount back when the gateway definitely refuses', async () => {
    gateway.rejectNext = true;
    await expect(
      refund.execute({ paymentId: 'p-1', amount: 4000 }),
    ).rejects.toThrow(GatewayRejectedError);
    expect(payments.saved.get('p-1')?.status).toBe('captured');
    expect(payments.saved.get('p-1')?.refunded.amount).toBe(0);
    expect(payments.saved.get('p-1')?.refundable.amount).toBe(10000);

    gateway.rejectNext = false;
    await expect(
      refund.execute({ paymentId: 'p-1', amount: 10000 }),
    ).resolves.toMatchObject({ status: 'refunded' });
  });

  it('keeps the amount reserved when the gateway fails without answering', async () => {
    gateway.failNext = true;
    await expect(
      refund.execute({ paymentId: 'p-1', amount: 4000 }),
    ).rejects.toThrow('gateway down');
    gateway.failNext = false;

    expect(payments.saved.get('p-1')?.refunded.amount).toBe(0);
    expect(payments.saved.get('p-1')?.refundable.amount).toBe(6000);
    await expect(
      refund.execute({ paymentId: 'p-1', amount: 8000 }),
    ).rejects.toThrow(RefundExceedsPaymentError);
    expect(gateway.refundKeys).toHaveLength(1);
  });

  it('settles an unconfirmed refund by retrying the same amount with the same key', async () => {
    gateway.failNext = true;
    await expect(
      refund.execute({ paymentId: 'p-1', amount: 4000 }),
    ).rejects.toThrow('gateway down');

    gateway.failNext = false;
    const result = await refund.execute({ paymentId: 'p-1', amount: 4000 });

    expect(gateway.refundKeys).toHaveLength(2);
    expect(gateway.refundKeys[0]).toBe(gateway.refundKeys[1]);
    expect(result.refunded.amount).toBe(4000);
    expect(payments.saved.get('p-1')?.refundable.amount).toBe(6000);
  });

  it('does not double count an unconfirmed refund when a different amount follows', async () => {
    gateway.failNext = true;
    await expect(
      refund.execute({ paymentId: 'p-1', amount: 4000 }),
    ).rejects.toThrow('gateway down');
    gateway.failNext = false;

    await refund.execute({ paymentId: 'p-1', amount: 6000 });
    await expect(
      refund.execute({ paymentId: 'p-1', amount: 1000 }),
    ).rejects.toThrow(RefundExceedsPaymentError);

    expect(gateway.refunded).toEqual([6000]);
  });

  it('gives each distinct refund its own idempotency key', async () => {
    await refund.execute({ paymentId: 'p-1', amount: 4000 });
    await refund.execute({ paymentId: 'p-1', amount: 4000 });

    expect(new Set(gateway.refundKeys).size).toBe(2);
  });

  it('gives refunds that arrive together different idempotency keys', async () => {
    gateway.hold();

    await together(
      gateway,
      refund.execute({ paymentId: 'p-1', amount: 4000 }),
      refund.execute({ paymentId: 'p-1', amount: 4000 }),
    );

    expect(new Set(gateway.refundKeys).size).toBe(2);
  });
});
