import { Module } from '@nestjs/common';
import {
  AddMenuItemUseCase,
  GetRestaurantMenuUseCase,
  RESTAURANT_REPOSITORY,
  RegisterRestaurantUseCase,
  SetItemAvailabilityUseCase,
} from '../application/index.js';
import { CatalogController } from './http/index.js';
import { InMemoryRestaurantRepository } from './persistence/index.js';

@Module({
  controllers: [CatalogController],
  providers: [
    RegisterRestaurantUseCase,
    AddMenuItemUseCase,
    SetItemAvailabilityUseCase,
    GetRestaurantMenuUseCase,
    { provide: RESTAURANT_REPOSITORY, useClass: InMemoryRestaurantRepository },
  ],
})
export class CatalogModule {}
