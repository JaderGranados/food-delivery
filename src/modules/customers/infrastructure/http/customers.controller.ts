import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  SignUpCustomer,
  type SignedUpCustomer,
} from '../../application/index.js';
import {
  EmailAlreadyInUseError,
  InvalidEmailError,
} from '../../domain/index.js';
import { SignUpCustomerDto } from './dtos/index.js';

@Controller('customers')
export class CustomersController {
  constructor(private readonly signUpCustomer: SignUpCustomer) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() body: SignUpCustomerDto): Promise<SignedUpCustomer> {
    try {
      return await this.signUpCustomer.execute(body);
    } catch (error) {
      if (error instanceof EmailAlreadyInUseError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof InvalidEmailError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
