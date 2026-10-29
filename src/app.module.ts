import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CatalogModule } from '@modules/catalog/infrastructure/index.js';
import { DeliveryModule } from '@modules/delivery/infrastructure/index.js';
import { PromotionsModule } from '@modules/promotions/infrastructure/index.js';
import { PaymentsModule } from '@modules/payments/infrastructure/index.js';
import { OrderingModule } from '@modules/ordering/infrastructure/index.js';
import { CustomersModule } from '@modules/customers/infrastructure/index.js';

@Module({
  imports: [
    CustomersModule,
    CatalogModule,
    OrderingModule,
    DeliveryModule,
    PaymentsModule,
    PromotionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
