import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@shared/domain/index.js';

export abstract class Controller {
  protected handleError(error: unknown): never {
    if (error instanceof ConflictError) {
      throw new ConflictException(error.message);
    }
    if (error instanceof BadRequestError) {
      throw new BadRequestException(error.message);
    }
    if (error instanceof ForbiddenError) {
      throw new ForbiddenException(error.message);
    }
    if (error instanceof NotFoundError) {
      throw new NotFoundException(error.message);
    }
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
