import { Money } from '@shared/domain/index.js';
import { ArgumentRequiredError, InvalidQuantityError } from '../errors.js';
import { OrderLine } from './order-line.js';

const props = {
  menuItemId: 'i-1',
  name: ' Casado ',
  unitPrice: Money.create(350000, 'CRC'),
  quantity: 3,
};

describe('OrderLine', () => {
  it('snapshots the item and computes its total', () => {
    const line = OrderLine.create(props);

    expect(line.name).toBe('Casado');
    expect(line.total.equals(Money.create(1050000, 'CRC'))).toBe(true);
  });

  it.each([0, -1, 1.5, 100])('rejects the quantity %s', (quantity) => {
    expect(() => OrderLine.create({ ...props, quantity })).toThrow(
      InvalidQuantityError,
    );
  });

  it('requires an item id and a name', () => {
    expect(() => OrderLine.create({ ...props, menuItemId: '' })).toThrow(
      ArgumentRequiredError,
    );
    expect(() => OrderLine.create({ ...props, name: ' ' })).toThrow(
      ArgumentRequiredError,
    );
  });
});
