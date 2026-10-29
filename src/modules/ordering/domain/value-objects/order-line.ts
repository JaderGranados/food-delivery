import { Money } from '@shared/domain/index.js';
import { ArgumentRequiredError, InvalidQuantityError } from '../errors.js';

const MAX_QUANTITY = 99;

export interface CreateOrderLineProps {
  menuItemId: string;
  name: string;
  unitPrice: Money;
  quantity: number;
}

/** Name and price are a snapshot taken when the order is placed. */
export class OrderLine {
  private constructor(
    readonly menuItemId: string,
    readonly name: string,
    readonly unitPrice: Money,
    readonly quantity: number,
  ) {}

  static create({
    menuItemId,
    name,
    unitPrice,
    quantity,
  }: CreateOrderLineProps): OrderLine {
    if (!menuItemId) throw new ArgumentRequiredError('Menu item ID');
    if (!name?.trim()) throw new ArgumentRequiredError('Name');
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      throw new InvalidQuantityError(quantity);
    }
    return new OrderLine(menuItemId, name.trim(), unitPrice, quantity);
  }

  get total(): Money {
    return Money.create(
      this.unitPrice.amount * this.quantity,
      this.unitPrice.currency,
    );
  }
}
