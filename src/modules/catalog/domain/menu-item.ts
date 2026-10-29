import type { Money } from '@shared/domain/index.js';
import { ArgumentRequiredError } from './errors.js';

export interface CreateMenuItemProps {
  id: string;
  name: string;
  description?: string;
  price: Money;
}

export class MenuItem {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly description: string | undefined,
    readonly price: Money,
    private isAvailable: boolean,
  ) {}

  static create({
    id,
    name,
    description,
    price,
  }: CreateMenuItemProps): MenuItem {
    if (!id) throw new ArgumentRequiredError('ID');
    if (!name?.trim()) throw new ArgumentRequiredError('Name');
    return new MenuItem(
      id,
      name.trim(),
      description?.trim() || undefined,
      price,
      true,
    );
  }

  get available(): boolean {
    return this.isAvailable;
  }

  setAvailability(available: boolean): void {
    this.isAvailable = available;
  }
}
