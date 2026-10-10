import type { Customer, Email } from '../../domain/index.js';

export interface CustomerRepository {
  findByEmail(email: Email): Promise<Customer | null>;
  findById(id: string): Promise<Customer | null>;
  save(customer: Customer): Promise<Customer>;
}
