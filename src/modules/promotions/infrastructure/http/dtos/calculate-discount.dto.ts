import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import { MoneyDto } from './money.dto.js';

export class CalculateDiscountDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => MoneyDto)
  subtotal: MoneyDto;
}
