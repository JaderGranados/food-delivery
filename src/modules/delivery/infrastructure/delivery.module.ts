import { Global, Module } from '@nestjs/common';
import {
  COURIER_REPOSITORY,
  CompleteDeliveryUseCase,
  DELIVERY_REPOSITORY,
  DispatchDeliveryUseCase,
  GetDeliveryByOrderUseCase,
  GetDeliveryUseCase,
  ORDER_LOOKUP,
  PickUpDeliveryUseCase,
  RegisterCourierUseCase,
  RequestDeliveryUseCase,
  SetCourierAvailabilityUseCase,
  UpdateCourierLocationUseCase,
} from '../application/index.js';
import { CouriersController, DeliveriesController } from './http/index.js';
import { OrderingOrderLookup } from './ordering/index.js';
import {
  InMemoryCourierRepository,
  InMemoryDeliveryRepository,
} from './persistence/index.js';

/**
 * Global so other contexts can inject the use cases listed in `exports`
 * without importing this module (contexts only meet through `application`).
 */
@Global()
@Module({
  controllers: [CouriersController, DeliveriesController],
  providers: [
    RegisterCourierUseCase,
    SetCourierAvailabilityUseCase,
    UpdateCourierLocationUseCase,
    RequestDeliveryUseCase,
    DispatchDeliveryUseCase,
    PickUpDeliveryUseCase,
    CompleteDeliveryUseCase,
    GetDeliveryUseCase,
    GetDeliveryByOrderUseCase,
    { provide: COURIER_REPOSITORY, useClass: InMemoryCourierRepository },
    { provide: DELIVERY_REPOSITORY, useClass: InMemoryDeliveryRepository },
    { provide: ORDER_LOOKUP, useClass: OrderingOrderLookup },
  ],
  exports: [GetDeliveryByOrderUseCase],
})
export class DeliveryModule {}
