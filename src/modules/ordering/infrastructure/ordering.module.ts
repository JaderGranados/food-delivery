import { Global, Module } from '@nestjs/common';
import {
  CancelOrderUseCase,
  ConfirmOrderUseCase,
  GetOrderUseCase,
  MENU_PRICE_PROVIDER,
  ORDER_REPOSITORY,
  PlaceOrderUseCase,
} from '../application/index.js';
import { CatalogMenuPriceProvider } from './catalog/index.js';
import { OrdersController } from './http/index.js';
import { InMemoryOrderRepository } from './persistence/index.js';

/**
 * Global so other contexts can inject the use cases listed in `exports`
 * without importing this module (contexts only meet through `application`).
 */
@Global()
@Module({
  controllers: [OrdersController],
  providers: [
    PlaceOrderUseCase,
    ConfirmOrderUseCase,
    CancelOrderUseCase,
    GetOrderUseCase,
    { provide: ORDER_REPOSITORY, useClass: InMemoryOrderRepository },
    { provide: MENU_PRICE_PROVIDER, useClass: CatalogMenuPriceProvider },
  ],
  exports: [GetOrderUseCase],
})
export class OrderingModule {}
