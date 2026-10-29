import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import {
  InvalidReviewTargetError,
  NotOrderCustomerError,
  OrderNotDeliveredError,
  OrderNotFoundError,
  Review,
  ReviewTarget,
  Stars,
} from '../../../domain/index.js';
import {
  DELIVERY_LOOKUP,
  ORDER_LOOKUP,
  REVIEW_REPOSITORY,
} from '../../ports/index.js';
import type {
  DeliveryLookup,
  OrderLookup,
  ReviewRepository,
} from '../../ports/index.js';
import { toReviewView, type ReviewView } from '../review-view.js';
import type { SubmitReviewCommand } from './submit-review.command.js';

/**
 * A customer reviews the restaurant or the courier of an order that was
 * delivered to them. Both are taken from Ordering and Delivery, never from
 * the request, so reviews cannot be made up for strangers or other people's
 * orders.
 */
@Injectable()
export class SubmitReviewUseCase implements UseCase<
  SubmitReviewCommand,
  ReviewView
> {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(ORDER_LOOKUP) private readonly orders: OrderLookup,
    @Inject(DELIVERY_LOOKUP) private readonly deliveries: DeliveryLookup,
  ) {}

  async execute(command: SubmitReviewCommand): Promise<ReviewView> {
    const stars = Stars.create(command.stars);

    const order = await this.orders.findOrder(command.orderId);
    if (!order) throw new OrderNotFoundError(command.orderId);
    if (order.customerId !== command.customerId) {
      throw new NotOrderCustomerError(order.id);
    }

    const delivery = await this.deliveries.findDeliveryByOrder(order.id);
    if (!delivery || delivery.status !== 'delivered') {
      throw new OrderNotDeliveredError(order.id);
    }

    const target = this.resolveTarget(command.targetType, order, delivery);

    const review = Review.write({
      id: randomUUID(),
      orderId: order.id,
      customerId: command.customerId,
      target,
      stars,
      comment: command.comment,
      now: new Date(),
    });

    return toReviewView(await this.reviews.add(review));
  }

  private resolveTarget(
    targetType: string,
    order: { restaurantId: string },
    delivery: { courierId?: string },
  ): ReviewTarget {
    if (targetType === 'restaurant') {
      return ReviewTarget.create('restaurant', order.restaurantId);
    }
    if (targetType === 'courier') {
      if (!delivery.courierId) {
        // A delivered order always has a courier; without one there is
        // nobody to review.
        throw new InvalidReviewTargetError('courier');
      }
      return ReviewTarget.create('courier', delivery.courierId);
    }
    throw new InvalidReviewTargetError(targetType);
  }
}
