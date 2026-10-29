import type { Courier } from '../../domain/index.js';

export interface CourierRepository {
  findById(id: string): Promise<Courier | null>;
  findAvailable(): Promise<Courier[]>;
  save(courier: Courier): Promise<Courier>;
}
