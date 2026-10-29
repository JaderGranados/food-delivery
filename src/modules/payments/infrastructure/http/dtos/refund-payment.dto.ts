import { IsInt, IsOptional, Min } from 'class-validator';

export class RefundPaymentDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  amount?: number;
}
