import { Money } from '@shared/domain/index.js';
import {
  ArgumentRequiredError,
  CurrencyMismatchError,
  InvalidPaymentTransitionError,
  InvalidRefundAmountError,
  RefundExceedsPaymentError,
} from './errors.js';
import { Payment } from './payment.js';

const crc = (amount: number) => Money.create(amount, 'CRC');

const pending = () =>
  Payment.initiate({
    id: 'p-1',
    orderId: 'o-1',
    amount: crc(10000),
    now: new Date('2026-01-01T00:00:00Z'),
  });

const authorized = () => {
  const payment = pending();
  payment.authorize('gw-1');
  return payment;
};

const captured = () => {
  const payment = authorized();
  payment.beginCapture();
  payment.completeCapture();
  return payment;
};

/** Reserves and settles a refund in one go. */
const refundNow = (payment: Payment, amount: number) => {
  const { idempotencyKey } = payment.reserveRefund(crc(amount));
  payment.completeRefund(idempotencyKey);
};

describe('Payment', () => {
  it('starts pending, active and with nothing refunded', () => {
    const payment = pending();

    expect(payment.status).toBe('pending');
    expect(payment.isActive).toBe(true);
    expect(payment.refunded.equals(crc(0))).toBe(true);
    expect(payment.refundable.equals(crc(10000))).toBe(true);
    expect(payment.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
  });

  it('requires an id and an order id', () => {
    expect(() =>
      Payment.initiate({
        id: '',
        orderId: 'o-1',
        amount: crc(1),
        now: new Date(),
      }),
    ).toThrow(ArgumentRequiredError);
    expect(() =>
      Payment.initiate({
        id: 'p-1',
        orderId: '',
        amount: crc(1),
        now: new Date(),
      }),
    ).toThrow(ArgumentRequiredError);
  });

  describe('authorization', () => {
    it('is authorized with a gateway reference, only once', () => {
      const payment = pending();
      payment.authorize('gw-1');

      expect(payment.status).toBe('authorized');
      expect(() => payment.authorize('gw-2')).toThrow(
        InvalidPaymentTransitionError,
      );
    });

    it('requires a gateway reference', () => {
      expect(() => pending().authorize('')).toThrow(ArgumentRequiredError);
    });

    it('can be declined, and a declined payment is no longer active', () => {
      const payment = pending();
      payment.decline();

      expect(payment.status).toBe('declined');
      expect(payment.isActive).toBe(false);
      expect(() => payment.authorize('gw-1')).toThrow(
        InvalidPaymentTransitionError,
      );
    });
  });

  describe('unconfirmed authorization', () => {
    it('keeps the order active and can be resumed', () => {
      const payment = pending();
      payment.markUnconfirmed();

      expect(payment.status).toBe('unconfirmed');
      expect(payment.isActive).toBe(true);

      payment.resume();
      expect(payment.status).toBe('pending');

      payment.authorize('gw-1');
      expect(payment.status).toBe('authorized');
    });

    it('cannot be authorized, declined or resumed twice while unconfirmed', () => {
      const payment = pending();
      payment.markUnconfirmed();

      expect(() => payment.authorize('gw-1')).toThrow(
        InvalidPaymentTransitionError,
      );
      expect(() => payment.decline()).toThrow(InvalidPaymentTransitionError);

      payment.resume();
      expect(() => payment.resume()).toThrow(InvalidPaymentTransitionError);
    });

    it.each([
      ['authorized', authorized],
      [
        'declined',
        () => {
          const payment = pending();
          payment.decline();
          return payment;
        },
      ],
    ])(
      'can be marked from %s when the outcome could not be recorded',
      (_status, build) => {
        const payment = build();
        payment.markUnconfirmed();

        expect(payment.status).toBe('unconfirmed');
        expect(payment.isActive).toBe(true);
      },
    );

    it('cannot be marked once the payment moved on', () => {
      expect(() => captured().markUnconfirmed()).toThrow(
        InvalidPaymentTransitionError,
      );
    });
  });

  describe('capture', () => {
    it('claims, then completes the capture', () => {
      const payment = authorized();

      expect(payment.beginCapture()).toBe('gw-1');
      expect(payment.status).toBe('capturing');

      payment.completeCapture();
      expect(payment.status).toBe('captured');
    });

    it('cannot be claimed twice while in flight', () => {
      const payment = authorized();
      payment.beginCapture();

      expect(() => payment.beginCapture()).toThrow(
        InvalidPaymentTransitionError,
      );
    });

    it('can be aborted and claimed again', () => {
      const payment = authorized();
      payment.beginCapture();
      payment.abortCapture();

      expect(payment.status).toBe('authorized');
      expect(payment.beginCapture()).toBe('gw-1');
    });

    it('cannot be captured before authorization or after capture', () => {
      expect(() => pending().beginCapture()).toThrow(
        InvalidPaymentTransitionError,
      );
      expect(() => captured().beginCapture()).toThrow(
        InvalidPaymentTransitionError,
      );
    });
  });

  describe('refund', () => {
    it('cannot be reserved before capture', () => {
      expect(() => authorized().reserveRefund(crc(100))).toThrow(
        InvalidPaymentTransitionError,
      );
    });

    it('refunds partially and then fully', () => {
      const payment = captured();

      expect(payment.reserveRefund(crc(4000)).reference).toBe('gw-1');
      payment.completeRefund(`${payment.id}:refund:1`);
      expect(payment.status).toBe('partially_refunded');
      expect(payment.refundable.equals(crc(6000))).toBe(true);

      refundNow(payment, 6000);
      expect(payment.status).toBe('refunded');
      expect(payment.refunded.equals(crc(10000))).toBe(true);
    });

    it('counts a refund in flight against what is refundable', () => {
      const payment = captured();
      payment.reserveRefund(crc(8000));

      expect(payment.refundable.equals(crc(2000))).toBe(true);
      expect(() => payment.reserveRefund(crc(8000))).toThrow(
        RefundExceedsPaymentError,
      );
      expect(payment.status).toBe('captured');
    });

    it('rejects any refund once everything is reserved', () => {
      const payment = captured();
      payment.reserveRefund(crc(10000));

      expect(() => payment.reserveRefund(crc(1))).toThrow(
        RefundExceedsPaymentError,
      );
    });

    it('gives the amount back when a refund is aborted', () => {
      const payment = captured();
      const { idempotencyKey } = payment.reserveRefund(crc(8000));
      payment.abortRefund(idempotencyKey);

      expect(payment.refundable.equals(crc(10000))).toBe(true);
      expect(payment.status).toBe('captured');
      expect(payment.refunded.equals(crc(0))).toBe(true);
    });

    it('rejects refunds above what is left', () => {
      const payment = captured();
      refundNow(payment, 9000);

      expect(() => payment.reserveRefund(crc(2000))).toThrow(
        RefundExceedsPaymentError,
      );
    });

    it('rejects a zero refund and a wrong currency', () => {
      const payment = captured();

      expect(() => payment.reserveRefund(crc(0))).toThrow(
        InvalidRefundAmountError,
      );
      expect(() => payment.reserveRefund(Money.create(100, 'USD'))).toThrow(
        CurrencyMismatchError,
      );
    });

    it('cannot refund a fully refunded payment', () => {
      const payment = captured();
      refundNow(payment, 10000);

      expect(() => payment.reserveRefund(crc(1))).toThrow(
        InvalidPaymentTransitionError,
      );
    });

    it('cannot settle a refund it does not know', () => {
      const payment = captured();
      payment.reserveRefund(crc(1000));

      expect(() => payment.completeRefund('nope')).toThrow(
        InvalidPaymentTransitionError,
      );
      expect(() => payment.abortRefund('nope')).toThrow(
        InvalidPaymentTransitionError,
      );
      expect(() => payment.markRefundUnconfirmed('nope')).toThrow(
        InvalidPaymentTransitionError,
      );
    });

    describe('unconfirmed refunds', () => {
      it('keep the amount reserved so it cannot be refunded again', () => {
        const payment = captured();
        const { idempotencyKey } = payment.reserveRefund(crc(8000));
        payment.markRefundUnconfirmed(idempotencyKey);

        expect(payment.refundable.equals(crc(2000))).toBe(true);
        expect(() => payment.reserveRefund(crc(5000))).toThrow(
          RefundExceedsPaymentError,
        );
      });

      it('are retried with the same key by asking for the same amount', () => {
        const payment = captured();
        const first = payment.reserveRefund(crc(4000));
        payment.markRefundUnconfirmed(first.idempotencyKey);

        const retry = payment.reserveRefund(crc(4000));

        expect(retry.idempotencyKey).toBe(first.idempotencyKey);
        expect(first.resumed).toBe(false);
        expect(retry.resumed).toBe(true);
        expect(payment.refundable.equals(crc(6000))).toBe(true);

        payment.completeRefund(retry.idempotencyKey);
        expect(payment.refunded.equals(crc(4000))).toBe(true);
      });

      it('are not mistaken for a different amount', () => {
        const payment = captured();
        const first = payment.reserveRefund(crc(4000));
        payment.markRefundUnconfirmed(first.idempotencyKey);

        const other = payment.reserveRefund(crc(3000));

        expect(other.idempotencyKey).not.toBe(first.idempotencyKey);
        expect(payment.refundable.equals(crc(3000))).toBe(true);
      });

      it('are not retried while another attempt is in flight', () => {
        const payment = captured();
        const first = payment.reserveRefund(crc(4000));
        payment.markRefundUnconfirmed(first.idempotencyKey);
        payment.reserveRefund(crc(4000));

        const another = payment.reserveRefund(crc(4000));

        expect(another.idempotencyKey).not.toBe(first.idempotencyKey);
        expect(payment.refundable.equals(crc(2000))).toBe(true);
      });
    });

    it('gives each refund its own idempotency key', () => {
      const payment = captured();

      const a = payment.reserveRefund(crc(3000));
      const b = payment.reserveRefund(crc(3000));
      payment.completeRefund(a.idempotencyKey);
      payment.completeRefund(b.idempotencyKey);
      const c = payment.reserveRefund(crc(3000));

      expect(
        new Set([a.idempotencyKey, b.idempotencyKey, c.idempotencyKey]).size,
      ).toBe(3);
    });
  });
});
