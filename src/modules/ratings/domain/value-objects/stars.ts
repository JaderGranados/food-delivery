import { InvalidStarsError } from '../errors.js';

export class Stars {
  private constructor(readonly value: number) {}

  static create(value: number): Stars {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new InvalidStarsError(value);
    }
    return new Stars(value);
  }
}
