import { Type } from 'class-transformer';
import {
  IsDateString,
  IsDefined,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { MoneyDto } from './money.dto.js';

export class DiscountDto {
  @IsIn(['percentage', 'fixed'])
  type: 'percentage' | 'fixed';

  /** Whole percent, for `percentage`. */
  @ValidateIf((dto: DiscountDto) => dto.type === 'percentage')
  @IsInt()
  @Min(1)
  @Max(100)
  percent?: number;

  /** Minor units, for `fixed`. */
  @ValidateIf((dto: DiscountDto) => dto.type === 'fixed')
  @IsInt()
  @Min(1)
  amount?: number;

  @ValidateIf((dto: DiscountDto) => dto.type === 'fixed')
  @Matches(/^[A-Z]{3}$/)
  currency?: string;
}

export class CreateCouponDto {
  @IsString()
  @Length(3, 32)
  code: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => DiscountDto)
  discount: DiscountDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyDto)
  minimumOrder?: MoneyDto;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUntil: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;
}
