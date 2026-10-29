import { IsInt, Matches, Min } from 'class-validator';

export class MoneyDto {
  /** Minor units (e.g. cents). */
  @IsInt()
  @Min(0)
  amount: number;

  @Matches(/^[A-Z]{3}$/)
  currency: string;
}
