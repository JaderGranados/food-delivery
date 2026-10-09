import { IsEmail, IsString, Length } from 'class-validator';

export class SignUpCustomerDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 128)
  password: string;
}
