import {
  type Customer,
  type Email,
  EmailAlreadyInUseError,
} from '../../../domain/index.js';
import type { CustomerRepository, PasswordHasher } from '../../ports/index.js';
import { SignUpCustomer } from './sign-up-customer.use-case.js';

class FakeCustomerRepository implements CustomerRepository {
  findById(id: string): Promise<Customer | null> {
    return Promise.resolve(this.saved.find((c) => c.id === id) ?? null);
  }
  readonly saved: Customer[] = [];

  async findByEmail(email: Email): Promise<Customer | null> {
    return this.saved.find((c) => c.email.equals(email)) ?? null;
  }

  async save(customer: Customer): Promise<Customer> {
    this.saved.push(customer);
    return customer;
  }
}

const fakeHasher: PasswordHasher = {
  hash: async (plain) => `hashed:${plain}`,
};

describe('SignUpCustomer', () => {
  let customers: FakeCustomerRepository;
  let signUp: SignUpCustomer;

  beforeEach(() => {
    customers = new FakeCustomerRepository();
    signUp = new SignUpCustomer(customers, fakeHasher);
  });

  it('registers a customer with a hashed password', async () => {
    const result = await signUp.execute({
      name: ' Ana ',
      email: 'Ana@Example.com',
      password: 'supersecret',
    });

    expect(result).toEqual({
      id: expect.any(String),
      name: 'Ana',
      email: 'ana@example.com',
      createdAt: expect.any(Date),
    });
    expect(result).not.toHaveProperty('passwordHash');
    expect(customers.saved).toHaveLength(1);
    expect(customers.saved[0].passwordHash).toBe('hashed:supersecret');
  });

  it('rejects an email that is already registered, ignoring case', async () => {
    await signUp.execute({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'supersecret',
    });

    await expect(
      signUp.execute({
        name: 'Other',
        email: 'ANA@example.com',
        password: 'supersecret',
      }),
    ).rejects.toThrow(EmailAlreadyInUseError);
    expect(customers.saved).toHaveLength(1);
  });
});
