import { Injectable } from '@nestjs/common';
import type { Customer, Email } from '../../domain/index.js';
import type { CustomerRepository } from '../../application/index.js';

@Injectable()
export class InMemoryCustomerRepository implements CustomerRepository {
  private readonly customersByEmail = new Map<string, Customer>();

  async findByEmail(email: Email): Promise<Customer | null> {
    return this.customersByEmail.get(email.value) ?? null;
  }

  async save(customer: Customer): Promise<Customer> {
    this.customersByEmail.set(customer.email.value, customer);
    return customer;
  }
}
