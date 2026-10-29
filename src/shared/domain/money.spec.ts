import { InvalidCurrencyError, InvalidMoneyAmountError } from './errors.js';
import { Money } from './money.js';

describe('Money', () => {
  it('creates a money value in minor units', () => {
    const money = Money.create(1250, 'USD');

    expect(money.amount).toBe(1250);
    expect(money.currency).toBe('USD');
  });

  it('accepts zero', () => {
    expect(Money.create(0, 'CRC').amount).toBe(0);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects the amount %s',
    (amount) => {
      expect(() => Money.create(amount, 'USD')).toThrow(
        InvalidMoneyAmountError,
      );
    },
  );

  it.each(['', 'usd', 'US', 'USDD', '123'])(
    'rejects the currency "%s"',
    (currency) => {
      expect(() => Money.create(100, currency)).toThrow(InvalidCurrencyError);
    },
  );

  it('compares by amount and currency', () => {
    expect(Money.create(100, 'USD').equals(Money.create(100, 'USD'))).toBe(
      true,
    );
    expect(Money.create(100, 'USD').equals(Money.create(100, 'CRC'))).toBe(
      false,
    );
    expect(Money.create(100, 'USD').equals(Money.create(200, 'USD'))).toBe(
      false,
    );
  });
});
