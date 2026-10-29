import { Injectable } from '@nestjs/common';
import { PaymentAlreadyExistsError, type Payment } from '../../domain/index.js';
import type { PaymentRepository } from '../../application/index.js';

@Injectable()
export class InMemoryPaymentRepository implements PaymentRepository {
  private readonly paymentsById = new Map<string, Payment>();

  async findById(id: string): Promise<Payment | null> {
    return this.paymentsById.get(id) ?? null;
  }

  async findActiveByOrderId(orderId: string): Promise<Payment | null> {
    return (
      [...this.paymentsById.values()].find(
        (payment) => payment.orderId === orderId && payment.isActive,
      ) ?? null
    );
  }

  // No `await` between the check and the insert, so it is atomic.
  async add(payment: Payment): Promise<Payment> {
    const taken = [...this.paymentsById.values()].some(
      (existing) => existing.orderId === payment.orderId && existing.isActive,
    );
    if (taken) throw new PaymentAlreadyExistsError(payment.orderId);
    this.paymentsById.set(payment.id, payment);
    return payment;
  }

  async save(payment: Payment): Promise<Payment> {
    this.paymentsById.set(payment.id, payment);
    return payment;
  }
}
