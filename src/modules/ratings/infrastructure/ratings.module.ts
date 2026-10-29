import { Module } from '@nestjs/common';
import {
  DELIVERY_LOOKUP,
  GetRatingSummaryUseCase,
  GetReviewsUseCase,
  ORDER_LOOKUP,
  REVIEW_REPOSITORY,
  SubmitReviewUseCase,
} from '../application/index.js';
import { DeliveryByOrderLookup } from './delivery/index.js';
import { ReviewsController } from './http/index.js';
import { OrderingOrderLookup } from './ordering/index.js';
import { InMemoryReviewRepository } from './persistence/index.js';

@Module({
  controllers: [ReviewsController],
  providers: [
    SubmitReviewUseCase,
    GetReviewsUseCase,
    GetRatingSummaryUseCase,
    { provide: REVIEW_REPOSITORY, useClass: InMemoryReviewRepository },
    { provide: ORDER_LOOKUP, useClass: OrderingOrderLookup },
    { provide: DELIVERY_LOOKUP, useClass: DeliveryByOrderLookup },
  ],
})
export class RatingsModule {}
