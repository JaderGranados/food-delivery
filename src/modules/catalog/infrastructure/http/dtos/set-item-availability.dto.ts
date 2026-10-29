import { IsBoolean } from 'class-validator';

export class SetItemAvailabilityDto {
  @IsBoolean()
  available: boolean;
}
