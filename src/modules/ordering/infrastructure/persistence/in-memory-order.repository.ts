import { Injectable } from '@nestjs/common';
import type { Order } from '../../domain/index.js';
import type { OrderRepository } from '../../application/index.js';

@Injectable()
export class InMemoryOrderRepository implements OrderRepository {
  private readonly ordersById = new Map<string, Order>();

  async findById(id: string): Promise<Order | null> {
    return this.ordersById.get(id) ?? null;
  }

  async save(order: Order): Promise<Order> {
    this.ordersById.set(order.id, order);
    return order;
  }
}
