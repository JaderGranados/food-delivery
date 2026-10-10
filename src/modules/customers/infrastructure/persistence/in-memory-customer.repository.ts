import { Injectable } from '@nestjs/common';
import type { Customer, Email } from '../../domain/index.js';
import type { CustomerRepository } from '../../application/index.js';

@Injectable()
export class InMemoryCustomerRepository implements CustomerRepository {
  private readonly customersByEmail = new Map<string, Customer>();

  async findById(id: string): Promise<Customer | null> {
    const customer = Array.from(this.customersByEmail.values()).find(
      (c) => c.id === id,
    );
    return Promise.resolve(customer ?? null);
  }

  async findByEmail(email: Email): Promise<Customer | null> {
    return Promise.resolve(this.customersByEmail.get(email.value) ?? null);
  }

  async save(customer: Customer): Promise<Customer> {
    this.customersByEmail.set(customer.email.value, customer);
    return Promise.resolve(customer);
  }
}
