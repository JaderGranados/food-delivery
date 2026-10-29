import { Module } from '@nestjs/common';
import {
  AuthorizePaymentUseCase,
  CapturePaymentUseCase,
  GetPaymentUseCase,
  ORDER_LOOKUP,
  PAYMENT_GATEWAY,
  PAYMENT_REPOSITORY,
  RefundPaymentUseCase,
} from '../application/index.js';
import { FakePaymentGateway } from './gateway/index.js';
import { PaymentsController } from './http/index.js';
import { OrderingOrderLookup } from './ordering/index.js';
import { InMemoryPaymentRepository } from './persistence/index.js';

@Module({
  controllers: [PaymentsController],
  providers: [
    AuthorizePaymentUseCase,
    CapturePaymentUseCase,
    RefundPaymentUseCase,
    GetPaymentUseCase,
    { provide: PAYMENT_REPOSITORY, useClass: InMemoryPaymentRepository },
    { provide: PAYMENT_GATEWAY, useClass: FakePaymentGateway },
    { provide: ORDER_LOOKUP, useClass: OrderingOrderLookup },
  ],
})
export class PaymentsModule {}
