export interface AuthorizePaymentCommand {
  orderId: string;
  paymentToken: string;
}
