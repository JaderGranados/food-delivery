import { Injectable } from '@nestjs/common';
import type { Courier } from '../../domain/index.js';
import type { CourierRepository } from '../../application/index.js';

@Injectable()
export class InMemoryCourierRepository implements CourierRepository {
  private readonly couriersById = new Map<string, Courier>();

  async findById(id: string): Promise<Courier | null> {
    return this.couriersById.get(id) ?? null;
  }

  async findAvailable(): Promise<Courier[]> {
    return [...this.couriersById.values()].filter(
      (courier) => courier.status === 'available',
    );
  }

  async save(courier: Courier): Promise<Courier> {
    this.couriersById.set(courier.id, courier);
    return courier;
  }
}
