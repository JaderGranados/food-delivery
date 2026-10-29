import { Injectable } from '@nestjs/common';
import type { Delivery } from '../../domain/index.js';
import type { DeliveryRepository } from '../../application/index.js';

@Injectable()
export class InMemoryDeliveryRepository implements DeliveryRepository {
  private readonly deliveriesById = new Map<string, Delivery>();

  async findById(id: string): Promise<Delivery | null> {
    return this.deliveriesById.get(id) ?? null;
  }

  async findByOrderId(orderId: string): Promise<Delivery | null> {
    return (
      [...this.deliveriesById.values()].find(
        (delivery) => delivery.orderId === orderId,
      ) ?? null
    );
  }

  async save(delivery: Delivery): Promise<Delivery> {
    this.deliveriesById.set(delivery.id, delivery);
    return delivery;
  }
}
