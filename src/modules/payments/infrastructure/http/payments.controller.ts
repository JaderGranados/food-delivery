import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  AuthorizePaymentUseCase,
  CapturePaymentUseCase,
  GetPaymentUseCase,
  RefundPaymentUseCase,
  type PaymentView,
} from '../../application/index.js';
import { AuthorizePaymentDto, RefundPaymentDto } from './dtos/index.js';
import { Controller as BaseController } from '@shared/infrastructure/index.js';

@Controller('payments')
export class PaymentsController extends BaseController {
  constructor(
    private readonly authorizePayment: AuthorizePaymentUseCase,
    private readonly capturePayment: CapturePaymentUseCase,
    private readonly refundPayment: RefundPaymentUseCase,
    private readonly getPayment: GetPaymentUseCase,
  ) {
    super();
  }

  @Post()
  async authorize(@Body() body: AuthorizePaymentDto): Promise<PaymentView> {
    try {
      return await this.authorizePayment.execute({
        orderId: body.orderId,
        paymentToken: body.paymentToken,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post(':id/capture')
  @HttpCode(HttpStatus.OK)
  async capture(@Param('id') paymentId: string): Promise<PaymentView> {
    try {
      return await this.capturePayment.execute({ paymentId });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  async refund(
    @Param('id') paymentId: string,
    @Body() body: RefundPaymentDto,
  ): Promise<PaymentView> {
    try {
      return await this.refundPayment.execute({
        paymentId,
        amount: body.amount,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get(':id')
  async get(@Param('id') paymentId: string): Promise<PaymentView> {
    try {
      return await this.getPayment.execute({ paymentId });
    } catch (error) {
      this.handleError(error);
    }
  }
}
