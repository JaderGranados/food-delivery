import { UseCase } from '@shared/application/index.js';
import { AddAddressCommand } from './add-address.command.js';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
} from '../../ports/index.js';
import { Inject } from '@nestjs/common';
import { CustomerNotFoundError } from '@modules/customers/domain/index.js';
import { AddAddressResponseDto } from './add-address-response.dto.js';

export class AddAddressUseCase implements UseCase<
  AddAddressCommand,
  AddAddressResponseDto
> {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepository: CustomerRepository,
  ) {}
  async execute(input: AddAddressCommand): Promise<AddAddressResponseDto> {
    const customer = await this.customerRepository.findById(input.customerId);
    if (!customer) {
      throw new CustomerNotFoundError(input.customerId);
    }

    const address = customer.addAddress(
      input.street,
      input.city,
      input.state,
      input.postalCode,
      input.country,
      input.reference,
    );

    await this.customerRepository.save(customer);

    return Promise.resolve({
      id: address.id,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      reference: address.reference,
    });
  }
}
