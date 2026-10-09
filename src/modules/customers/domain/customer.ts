import type { Email } from './email.js';

export interface RegisterCustomerProps {
  id: string;
  name: string;
  email: Email;
  passwordHash: string;
  now: Date;
}

export class Customer {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly email: Email,
    readonly passwordHash: string,
    readonly createdAt: Date,
  ) {}

  static register({
    id,
    name,
    email,
    passwordHash,
    now,
  }: RegisterCustomerProps): Customer {
    return new Customer(id, name.trim(), email, passwordHash, now);
  }
}
