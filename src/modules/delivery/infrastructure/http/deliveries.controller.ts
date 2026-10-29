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
  CompleteDeliveryUseCase,
  DispatchDeliveryUseCase,
  GetDeliveryUseCase,
  PickUpDeliveryUseCase,
  RequestDeliveryUseCase,
  type DeliveryView,
} from '../../application/index.js';
import { RequestDeliveryDto } from './dtos/index.js';
import { Controller as BaseController } from '@shared/infrastructure/index.js';

@Controller('deliveries')
export class DeliveriesController extends BaseController {
  constructor(
    private readonly requestDelivery: RequestDeliveryUseCase,
    private readonly dispatchDelivery: DispatchDeliveryUseCase,
    private readonly pickUpDelivery: PickUpDeliveryUseCase,
    private readonly completeDelivery: CompleteDeliveryUseCase,
    private readonly getDelivery: GetDeliveryUseCase,
  ) {
    super();
  }

  @Post()
  async request(@Body() body: RequestDeliveryDto): Promise<DeliveryView> {
    try {
      return await this.requestDelivery.execute({
        orderId: body.orderId,
        pickup: {
          latitude: body.pickup.latitude,
          longitude: body.pickup.longitude,
        },
        dropoff: {
          latitude: body.dropoff.latitude,
          longitude: body.dropoff.longitude,
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post(':id/dispatch')
  @HttpCode(HttpStatus.OK)
  async dispatch(@Param('id') deliveryId: string): Promise<DeliveryView> {
    try {
      return await this.dispatchDelivery.execute({ deliveryId });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post(':id/pick-up')
  @HttpCode(HttpStatus.OK)
  async pickUp(@Param('id') deliveryId: string): Promise<DeliveryView> {
    try {
      return await this.pickUpDelivery.execute({ deliveryId });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(@Param('id') deliveryId: string): Promise<DeliveryView> {
    try {
      return await this.completeDelivery.execute({ deliveryId });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get(':id')
  async get(@Param('id') deliveryId: string): Promise<DeliveryView> {
    try {
      return await this.getDelivery.execute({ deliveryId });
    } catch (error) {
      this.handleError(error);
    }
  }
}
