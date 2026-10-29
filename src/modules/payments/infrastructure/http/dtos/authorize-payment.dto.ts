import { IsNotEmpty, IsString } from 'class-validator';

export class AuthorizePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  paymentToken: string;
}
