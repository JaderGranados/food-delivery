import { Type } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class PriceDto {
  @IsInt()
  @Min(0)
  amount: number;

  @Matches(/^[A-Z]{3}$/)
  currency: string;
}

export class AddMenuItemDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(1, 500)
  @IsOptional()
  description?: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => PriceDto)
  price: PriceDto;
}
