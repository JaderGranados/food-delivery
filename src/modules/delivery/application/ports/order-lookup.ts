export interface OrderSummary {
  id: string;
  status: string;
}

/** Delivery's view of Ordering: just enough to know whether an order is ready. */
export interface OrderLookup {
  /** Resolves to `null` when the order does not exist. */
  findOrder(orderId: string): Promise<OrderSummary | null>;
}
