import type { Delivery } from '../../domain/index.js';

export interface DeliveryRepository {
  findById(id: string): Promise<Delivery | null>;
  findByOrderId(orderId: string): Promise<Delivery | null>;
  save(delivery: Delivery): Promise<Delivery>;
}
