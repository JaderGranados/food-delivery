import { Module } from '@nestjs/common';
import {
  PASSWORD_HASHER,
  SignUpCustomerUseCase,
  AddAddressUseCase,
  CUSTOMER_REPOSITORY,
} from '../application/index.js';
import { CustomersController } from './http/index.js';
import { InMemoryCustomerRepository } from './persistence/index.js';
import { ScryptPasswordHasher } from './security/index.js';

@Module({
  controllers: [CustomersController],
  providers: [
    SignUpCustomerUseCase,
    AddAddressUseCase,
    { provide: CUSTOMER_REPOSITORY, useClass: InMemoryCustomerRepository },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
  ],
})
export class CustomersModule {}
