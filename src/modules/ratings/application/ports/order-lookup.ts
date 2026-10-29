export interface OrderSummary {
  id: string;
  customerId: string;
  restaurantId: string;
}

/** Ratings' view of Ordering: who ordered, and from which restaurant. */
export interface OrderLookup {
  /** Resolves to `null` when the order does not exist. */
  findOrder(orderId: string): Promise<OrderSummary | null>;
}
