import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { REVIEW_TARGET_TYPES } from '../../../domain/index.js';

export class ReviewTargetQueryDto {
  @IsIn(REVIEW_TARGET_TYPES)
  targetType: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;
}
