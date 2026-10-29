export interface DeliverySummary {
  status: string;
  courierId?: string;
}

/** Ratings' view of Delivery: whether an order arrived, and who brought it. */
export interface DeliveryLookup {
  /** Resolves to `null` when the order has no delivery. */
  findDeliveryByOrder(orderId: string): Promise<DeliverySummary | null>;
}
