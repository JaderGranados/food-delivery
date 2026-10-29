import {
  OrderNotFoundError,
  OrderNotPayableError,
  Payment,
  PaymentAlreadyExistsError,
  PaymentDeclinedError,
} from '../../../domain/index.js';
import type {
  AuthorizationResult,
  OrderLookup,
  OrderSummary,
  PaymentGateway,
  PaymentRepository,
} from '../../ports/index.js';
import { AuthorizePaymentUseCase } from './authorize-payment.use-case.js';

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

class FakeOrderLookup implements OrderLookup {
  order: OrderSummary | null = {
    id: 'o-1',
    status: 'placed',
    total: { amount: 10000, currency: 'CRC' },
  };

  findOrder(): Promise<OrderSummary | null> {
    return Promise.resolve(this.order);
  }
}

const command = { orderId: 'o-1', paymentToken: 'tok_ok' };

describe('AuthorizePayment', () => {
  let payments: FakePaymentRepository;
  let gateway: FakeGateway;
  let orders: FakeOrderLookup;
  let authorize: AuthorizePaymentUseCase;

  beforeEach(() => {
    payments = new FakePaymentRepository();
    gateway = new FakeGateway();
    orders = new FakeOrderLookup();
    authorize = new AuthorizePaymentUseCase(payments, gateway, orders);
  });

  it('authorizes the order total', async () => {
    const result = await authorize.execute(command);

    expect(result).toEqual({
      id: expect.any(String),
      orderId: 'o-1',
      status: 'authorized',
      amount: { amount: 10000, currency: 'CRC' },
      refunded: { amount: 0, currency: 'CRC' },
      createdAt: expect.any(Date),
    });
    expect(payments.saved.get(result.id)?.status).toBe('authorized');
  });

  it('accepts a confirmed order', async () => {
    orders.order = { ...orders.order!, status: 'confirmed' };

    await expect(authorize.execute(command)).resolves.toMatchObject({
      status: 'authorized',
    });
  });

  it('fails when the order does not exist', async () => {
    orders.order = null;

    await expect(authorize.execute(command)).rejects.toThrow(
      OrderNotFoundError,
    );
  });

  it('fails when the order is cancelled', async () => {
    orders.order = { ...orders.order!, status: 'cancelled' };

    await expect(authorize.execute(command)).rejects.toThrow(
      OrderNotPayableError,
    );
    expect(gateway.calls).toEqual([]);
  });

  it('fails when the order already has a payment', async () => {
    await authorize.execute(command);

    await expect(authorize.execute(command)).rejects.toThrow(
      PaymentAlreadyExistsError,
    );
    expect(gateway.calls).toEqual(['authorize']);
  });

  it('authorizes only once when two requests arrive together', async () => {
    gateway.hold();

    const results = Promise.allSettled([
      authorize.execute(command),
      authorize.execute(command),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    gateway.open();
    const [first, second] = await results;

    expect(first.status).toBe('fulfilled');
    expect(second.status).toBe('rejected');
    expect((second as PromiseRejectedResult).reason).toBeInstanceOf(
      PaymentAlreadyExistsError,
    );
    expect(gateway.calls).toEqual(['authorize']);
    expect(payments.saved.size).toBe(1);
  });

  it('keeps a declined attempt and lets the customer try again', async () => {
    gateway.declineWith = 'insufficient funds';
    await expect(authorize.execute(command)).rejects.toThrow(
      PaymentDeclinedError,
    );
    expect([...payments.saved.values()].map((p) => p.status)).toEqual([
      'declined',
    ]);

    gateway.declineWith = null;
    const retry = await authorize.execute(command);

    expect(retry.status).toBe('authorized');
    expect(payments.saved.size).toBe(2);
  });

  it('keeps the payment unconfirmed when the gateway fails without answering', async () => {
    gateway.failNext = true;

    await expect(authorize.execute(command)).rejects.toThrow('gateway down');

    expect([...payments.saved.values()].map((p) => p.status)).toEqual([
      'unconfirmed',
    ]);
  });

  it('resumes the unconfirmed payment on retry with the same idempotency key', async () => {
    gateway.failNext = true;
    await expect(authorize.execute(command)).rejects.toThrow('gateway down');
    const [unconfirmed] = [...payments.saved.values()];

    gateway.failNext = false;
    const retry = await authorize.execute(command);

    expect(retry.id).toBe(unconfirmed.id);
    expect(retry.status).toBe('authorized');
    expect(payments.saved.size).toBe(1);
    expect(gateway.authorizeKeys).toEqual([unconfirmed.id, unconfirmed.id]);
  });

  it('can fail again and still be resumed later', async () => {
    gateway.failNext = true;
    await expect(authorize.execute(command)).rejects.toThrow('gateway down');
    await expect(authorize.execute(command)).rejects.toThrow('gateway down');

    gateway.failNext = false;
    await expect(authorize.execute(command)).resolves.toMatchObject({
      status: 'authorized',
    });
    expect(payments.saved.size).toBe(1);
    expect(new Set(gateway.authorizeKeys).size).toBe(1);
  });

  it('resumes an unconfirmed payment only once when two retries arrive together', async () => {
    gateway.failNext = true;
    await expect(authorize.execute(command)).rejects.toThrow('gateway down');
    gateway.failNext = false;
    gateway.hold();

    const results = Promise.allSettled([
      authorize.execute(command),
      authorize.execute(command),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    gateway.open();
    const [first, second] = await results;

    expect(first.status).toBe('fulfilled');
    expect(second.status).toBe('rejected');
    expect((second as PromiseRejectedResult).reason).toBeInstanceOf(
      PaymentAlreadyExistsError,
    );
    expect(gateway.authorizeKeys).toHaveLength(2);
    expect(payments.saved.size).toBe(1);
  });

  it('does not resume a declined payment: a new attempt gets a new payment', async () => {
    gateway.declineWith = 'insufficient funds';
    await expect(authorize.execute(command)).rejects.toThrow(
      PaymentDeclinedError,
    );

    gateway.declineWith = null;
    await authorize.execute(command);

    expect(new Set(gateway.authorizeKeys).size).toBe(2);
  });

  it('keeps the payment resumable when the approval cannot be stored', async () => {
    const originalSave = payments.save.bind(payments);
    let calls = 0;
    // add() succeeds; the save that records the approval fails; the next works.
    payments.save = (payment) => {
      calls += 1;
      return calls === 1
        ? Promise.reject(new Error('store down'))
        : originalSave(payment);
    };

    await expect(authorize.execute(command)).rejects.toThrow('store down');

    expect([...payments.saved.values()].map((p) => p.status)).toEqual([
      'unconfirmed',
    ]);

    const retry = await authorize.execute(command);
    expect(retry.status).toBe('authorized');
    expect(payments.saved.size).toBe(1);
    expect(new Set(gateway.authorizeKeys).size).toBe(1);
  });

  it('reports the gateway error even when saving the unconfirmed state fails', async () => {
    gateway.failNext = true;
    payments.failSaves = 1;

    await expect(authorize.execute(command)).rejects.toThrow('gateway down');

    expect([...payments.saved.values()].map((p) => p.status)).toEqual([
      'unconfirmed',
    ]);
  });

  it('keeps the payment resumable when recording a decline fails', async () => {
    gateway.declineWith = 'insufficient funds';
    payments.failSaves = 1;

    await expect(authorize.execute(command)).rejects.toThrow('store down');

    expect([...payments.saved.values()].map((p) => p.status)).toEqual([
      'unconfirmed',
    ]);
    gateway.declineWith = null;
    await expect(authorize.execute(command)).resolves.toMatchObject({
      status: 'authorized',
    });
  });
});
