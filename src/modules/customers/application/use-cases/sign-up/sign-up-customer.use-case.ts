import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  Customer,
  Email,
  EmailAlreadyInUseError,
} from '../../../domain/index.js';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../ports/index.js';
import type { UseCase } from '@shared/application/index.js';
import type { SignUpCustomerCommand } from './sign-up-customer.command.js';
import type { SignedUpCustomer } from './signed-up-customer.js';

@Injectable()
export class SignUpCustomer implements UseCase<
  SignUpCustomerCommand,
  SignedUpCustomer
> {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customers: CustomerRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: SignUpCustomerCommand): Promise<SignedUpCustomer> {
    const email = Email.create(command.email);

    if (await this.customers.findByEmail(email)) {
      throw new EmailAlreadyInUseError(email.value);
    }

    const customer = Customer.register({
      id: randomUUID(),
      name: command.name,
      email,
      passwordHash: await this.passwordHasher.hash(command.password),
      now: new Date(),
    });
    const saved = await this.customers.save(customer);

    return {
      id: saved.id,
      name: saved.name,
      email: saved.email.value,
      createdAt: saved.createdAt,
    };
  }
}
