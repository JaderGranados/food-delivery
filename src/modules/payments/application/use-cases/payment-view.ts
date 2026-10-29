import type { Payment, PaymentStatus } from '../../domain/index.js';

interface MoneyView {
  amount: number;
  currency: string;
}

export interface PaymentView {
  id: string;
  orderId: string;
  status: PaymentStatus;
  amount: MoneyView;
  refunded: MoneyView;
  createdAt: Date;
}

export function toPaymentView(payment: Payment): PaymentView {
  return {
    id: payment.id,
    orderId: payment.orderId,
    status: payment.status,
    amount: {
      amount: payment.amount.amount,
      currency: payment.amount.currency,
    },
    refunded: {
      amount: payment.refunded.amount,
      currency: payment.refunded.currency,
    },
    createdAt: payment.createdAt,
  };
}
