import { Money } from '@shared/domain/index.js';
import {
  ArgumentRequiredError,
  DuplicateOrderLineError,
  EmptyOrderError,
  InvalidOrderTransitionError,
  MixedCurrenciesError,
} from './errors.js';
import type { OrderLine } from './value-objects/index.js';

export type OrderStatus = 'placed' | 'confirmed' | 'cancelled';

export interface PlaceOrderProps {
  id: string;
  customerId: string;
  restaurantId: string;
  lines: readonly OrderLine[];
  now: Date;
}

export class Order {
  private currentStatus: OrderStatus = 'placed';

  private constructor(
    readonly id: string,
    readonly customerId: string,
    readonly restaurantId: string,
    readonly lines: readonly OrderLine[],
    readonly total: Money,
    readonly createdAt: Date,
  ) {}

  static place({
    id,
    customerId,
    restaurantId,
    lines,
    now,
  }: PlaceOrderProps): Order {
    if (!id) throw new ArgumentRequiredError('ID');
    if (!customerId) throw new ArgumentRequiredError('Customer ID');
    if (!restaurantId) throw new ArgumentRequiredError('Restaurant ID');
    if (lines.length === 0) throw new EmptyOrderError();

    const seen = new Set<string>();
    for (const line of lines) {
      if (seen.has(line.menuItemId)) {
        throw new DuplicateOrderLineError(line.menuItemId);
      }
      seen.add(line.menuItemId);
    }

    const currency = lines[0].unitPrice.currency;
    if (lines.some((line) => line.unitPrice.currency !== currency)) {
      throw new MixedCurrenciesError();
    }
    const total = Money.create(
      lines.reduce((sum, line) => sum + line.total.amount, 0),
      currency,
    );

    return new Order(id, customerId, restaurantId, [...lines], total, now);
  }

  get status(): OrderStatus {
    return this.currentStatus;
  }

  confirm(): void {
    if (this.currentStatus !== 'placed') {
      throw new InvalidOrderTransitionError(this.currentStatus, 'confirmed');
    }
    this.currentStatus = 'confirmed';
  }

  cancel(): void {
    if (this.currentStatus === 'cancelled') {
      throw new InvalidOrderTransitionError(this.currentStatus, 'cancelled');
    }
    this.currentStatus = 'cancelled';
  }
}
