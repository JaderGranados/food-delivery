import type { MoneyInput } from '../money-input.js';

export interface CalculateDiscountCommand {
  code: string;
  subtotal: MoneyInput;
}
