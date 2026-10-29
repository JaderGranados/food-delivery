import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { REVIEW_TARGET_TYPES } from '../../../domain/index.js';

export class SubmitReviewDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsIn(REVIEW_TARGET_TYPES)
  targetType: string;

  @IsInt()
  @Min(1)
  @Max(5)
  stars: number;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  comment?: string;
}
