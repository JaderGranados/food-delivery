import type { Payment } from '../../domain/index.js';

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  /** The order's payment that is not declined, if any. */
  findActiveByOrderId(orderId: string): Promise<Payment | null>;
  /**
   * Inserts a new payment. Like a unique index, it must fail atomically with
   * `PaymentAlreadyExistsError` when the order already has an active payment,
   * so two concurrent authorizations cannot both be recorded.
   */
  add(payment: Payment): Promise<Payment>;
  save(payment: Payment): Promise<Payment>;
}
