import { Injectable } from '@nestjs/common';
import type { Restaurant } from '../../domain/index.js';
import type { RestaurantRepository } from '../../application/index.js';

@Injectable()
export class InMemoryRestaurantRepository implements RestaurantRepository {
  private readonly restaurantsById = new Map<string, Restaurant>();

  async findById(id: string): Promise<Restaurant | null> {
    return this.restaurantsById.get(id) ?? null;
  }

  async save(restaurant: Restaurant): Promise<Restaurant> {
    this.restaurantsById.set(restaurant.id, restaurant);
    return restaurant;
  }
}
