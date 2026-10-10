import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  SignUpCustomer,
  type SignedUpCustomer,
  AddAddressUseCase,
} from '../../application/index.js';
import { AddAddressDto, SignUpCustomerDto } from './dtos/index.js';
import { Controller as BaseController } from '@shared/infrastructure/index.js';

@Controller('customers')
export class CustomersController extends BaseController {
  constructor(
    private readonly signUpCustomer: SignUpCustomer,
    private readonly addAddressUseCase: AddAddressUseCase,
  ) {
    super();
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() body: SignUpCustomerDto): Promise<SignedUpCustomer> {
    try {
      return await this.signUpCustomer.execute(body);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post(':id/add-address')
  async addAddress(
    @Param('id') customerId: string,
    @Body() body: AddAddressDto,
  ) {
    try {
      return await this.addAddressUseCase.execute({
        customerId,
        street: body.street,
        city: body.city,
        state: body.state,
        postalCode: body.postalCode,
        country: body.country,
        reference: body.reference,
      });
    } catch (error) {
      this.handleError(error);
    }
  }
}
