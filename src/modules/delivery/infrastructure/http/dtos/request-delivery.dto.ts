import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { LocationDto } from './location.dto.js';

export class RequestDeliveryDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => LocationDto)
  pickup: LocationDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => LocationDto)
  dropoff: LocationDto;
}
