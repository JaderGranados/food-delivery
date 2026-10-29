import { IsString, Length } from 'class-validator';

export class RegisterCourierDto {
  @IsString()
  @Length(1, 100)
  name: string;
}
