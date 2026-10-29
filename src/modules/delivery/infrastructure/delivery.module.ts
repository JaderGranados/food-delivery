import { Module } from '@nestjs/common';
import {
  COURIER_REPOSITORY,
  CompleteDeliveryUseCase,
  DELIVERY_REPOSITORY,
  DispatchDeliveryUseCase,
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
    { provide: COURIER_REPOSITORY, useClass: InMemoryCourierRepository },
    { provide: DELIVERY_REPOSITORY, useClass: InMemoryDeliveryRepository },
    { provide: ORDER_LOOKUP, useClass: OrderingOrderLookup },
  ],
})
export class DeliveryModule {}
