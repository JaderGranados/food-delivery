import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import {
  RegisterCourierUseCase,
  SetCourierAvailabilityUseCase,
  UpdateCourierLocationUseCase,
  type CourierView,
} from '../../application/index.js';
import {
  LocationDto,
  RegisterCourierDto,
  SetCourierAvailabilityDto,
} from './dtos/index.js';
import { Controller as BaseController } from '@shared/infrastructure/index.js';

@Controller('couriers')
export class CouriersController extends BaseController {
  constructor(
    private readonly registerCourier: RegisterCourierUseCase,
    private readonly setCourierAvailability: SetCourierAvailabilityUseCase,
    private readonly updateCourierLocation: UpdateCourierLocationUseCase,
  ) {
    super();
  }

  @Post()
  async register(@Body() body: RegisterCourierDto): Promise<CourierView> {
    try {
      return await this.registerCourier.execute({ name: body.name });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch(':id/availability')
  async setAvailability(
    @Param('id') courierId: string,
    @Body() body: SetCourierAvailabilityDto,
  ): Promise<CourierView> {
    try {
      return await this.setCourierAvailability.execute({
        courierId,
        available: body.available,
        location: body.location && {
          latitude: body.location.latitude,
          longitude: body.location.longitude,
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Patch(':id/location')
  async updateLocation(
    @Param('id') courierId: string,
    @Body() body: LocationDto,
  ): Promise<CourierView> {
    try {
      return await this.updateCourierLocation.execute({
        courierId,
        location: { latitude: body.latitude, longitude: body.longitude },
      });
    } catch (error) {
      this.handleError(error);
    }
  }
}
