import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { LocationDto } from './location.dto.js';

export class SetCourierAvailabilityDto {
  @IsBoolean()
  available: boolean;

  @ValidateIf((dto: SetCourierAvailabilityDto) => dto.available === true)
  @IsDefined()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}
