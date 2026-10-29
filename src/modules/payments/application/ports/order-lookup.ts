export interface OrderSummary {
  id: string;
  status: string;
  total: { amount: number; currency: string };
}

/** Payments' view of Ordering: what is owed and whether the order is payable. */
export interface OrderLookup {
  /** Resolves to `null` when the order does not exist. */
  findOrder(orderId: string): Promise<OrderSummary | null>;
}
