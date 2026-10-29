import type { Restaurant } from '../../domain/index.js';

export interface RestaurantRepository {
  findById(id: string): Promise<Restaurant | null>;
  save(restaurant: Restaurant): Promise<Restaurant>;
}
