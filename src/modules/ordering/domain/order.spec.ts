import { Money } from '@shared/domain/index.js';
import {
  DuplicateOrderLineError,
  EmptyOrderError,
  InvalidOrderTransitionError,
  MixedCurrenciesError,
} from './errors.js';
import { Order } from './order.js';
import { OrderLine } from './value-objects/index.js';

const line = (
  menuItemId: string,
  amount: number,
  quantity: number,
  currency = 'CRC',
) =>
  OrderLine.create({
    menuItemId,
    name: `Item ${menuItemId}`,
    unitPrice: Money.create(amount, currency),
    quantity,
  });

const place = (lines = [line('a', 1000, 2), line('b', 500, 1)]) =>
  Order.place({
    id: 'o-1',
    customerId: 'c-1',
    restaurantId: 'r-1',
    lines,
    now: new Date('2026-01-01T00:00:00Z'),
  });

describe('Order', () => {
  it('places a placed order with the total of its lines', () => {
    const order = place();

    expect(order.status).toBe('placed');
    expect(order.total.equals(Money.create(2500, 'CRC'))).toBe(true);
    expect(order.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
  });

  it('rejects an order without lines', () => {
    expect(() => place([])).toThrow(EmptyOrderError);
  });

  it('rejects the same menu item twice', () => {
    expect(() => place([line('a', 100, 1), line('a', 100, 2)])).toThrow(
      DuplicateOrderLineError,
    );
  });

  it('rejects mixed currencies', () => {
    expect(() => place([line('a', 100, 1), line('b', 100, 1, 'USD')])).toThrow(
      MixedCurrenciesError,
    );
  });

  it('confirms a placed order only once', () => {
    const order = place();
    order.confirm();

    expect(order.status).toBe('confirmed');
    expect(() => order.confirm()).toThrow(InvalidOrderTransitionError);
  });

  it('cancels a placed or confirmed order but not twice', () => {
    const placed = place();
    placed.cancel();
    const confirmed = place();
    confirmed.confirm();
    confirmed.cancel();

    expect(placed.status).toBe('cancelled');
    expect(confirmed.status).toBe('cancelled');
    expect(() => placed.cancel()).toThrow(InvalidOrderTransitionError);
  });

  it('cannot confirm a cancelled order', () => {
    const order = place();
    order.cancel();

    expect(() => order.confirm()).toThrow(InvalidOrderTransitionError);
  });
});
