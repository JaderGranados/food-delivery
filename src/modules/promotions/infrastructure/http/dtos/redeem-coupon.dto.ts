import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MoneyDto } from './money.dto.js';

export class RedeemCouponDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => MoneyDto)
  subtotal: MoneyDto;
}
