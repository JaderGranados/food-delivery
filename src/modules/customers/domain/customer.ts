import { ArgumentRequiredError } from './errors.js';
import { Address, Email } from './value-objects/index.js';

export interface RegisterCustomerProps {
  id: string;
  name: string;
  email: Email;
  passwordHash: string;
  now: Date;
}

export class Customer {
  private addresses: Address[] = [];
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
  }: RegisterCustomerProps): Customer {
    if (!id) {
      throw new ArgumentRequiredError('ID');
    } else if (!name) {
      throw new ArgumentRequiredError('Name');
    } else if (!email) {
      throw new ArgumentRequiredError('Email');
    } else if (!passwordHash) {
      throw new ArgumentRequiredError('Password');
    }

    const now = new Date();
    return new Customer(id, name.trim(), email, passwordHash, now);
  }

  public addAddress(
    street: string,
    city: string,
    state: string,
    postalCode: string,
    country: string,
    reference?: string,
  ) {
    const address = Address.create({
      street,
      city,
      state,
      postalCode,
      country,
      reference,
    });
    this.addresses.push(address);
    return address;
  }
}
