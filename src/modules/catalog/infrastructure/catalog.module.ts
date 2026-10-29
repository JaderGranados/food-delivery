import { Global, Module } from '@nestjs/common';
import {
  AddMenuItemUseCase,
  GetRestaurantMenuUseCase,
  RESTAURANT_REPOSITORY,
  RegisterRestaurantUseCase,
  SetItemAvailabilityUseCase,
} from '../application/index.js';
import { CatalogController } from './http/index.js';
import { InMemoryRestaurantRepository } from './persistence/index.js';

/**
 * Global so other contexts can inject the use cases listed in `exports`
 * without importing this module (contexts only meet through `application`).
 */
@Global()
@Module({
  controllers: [CatalogController],
  providers: [
    RegisterRestaurantUseCase,
    AddMenuItemUseCase,
    SetItemAvailabilityUseCase,
    GetRestaurantMenuUseCase,
    { provide: RESTAURANT_REPOSITORY, useClass: InMemoryRestaurantRepository },
  ],
  exports: [GetRestaurantMenuUseCase],
})
export class CatalogModule {}
