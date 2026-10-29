import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { DAYS_OF_WEEK, type DayOfWeek } from '../../../domain/index.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class OpeningSlotDto {
  @IsIn(DAYS_OF_WEEK)
  day: DayOfWeek;

  @Matches(TIME_PATTERN)
  open: string;

  @Matches(TIME_PATTERN)
  close: string;
}

export class RegisterRestaurantDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OpeningSlotDto)
  openingHours: OpeningSlotDto[];
}
