export interface RefundPaymentCommand {
  paymentId: string;
  /** Minor units. Omit to refund everything still refundable. */
  amount?: number;
}
