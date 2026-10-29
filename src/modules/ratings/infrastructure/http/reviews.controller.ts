import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  GetRatingSummaryUseCase,
  GetReviewsUseCase,
  SubmitReviewUseCase,
  type RatingSummaryView,
  type ReviewView,
} from '../../application/index.js';
import { ReviewTargetQueryDto, SubmitReviewDto } from './dtos/index.js';
import { Controller as BaseController } from '@shared/infrastructure/index.js';

@Controller('reviews')
export class ReviewsController extends BaseController {
  constructor(
    private readonly submitReview: SubmitReviewUseCase,
    private readonly getReviews: GetReviewsUseCase,
    private readonly getRatingSummary: GetRatingSummaryUseCase,
  ) {
    super();
  }

  @Post()
  async submit(@Body() body: SubmitReviewDto): Promise<ReviewView> {
    try {
      return await this.submitReview.execute({
        orderId: body.orderId,
        customerId: body.customerId,
        targetType: body.targetType,
        stars: body.stars,
        comment: body.comment,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get()
  async list(@Query() query: ReviewTargetQueryDto): Promise<ReviewView[]> {
    try {
      return await this.getReviews.execute({
        targetType: query.targetType,
        targetId: query.targetId,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('summary')
  async summary(
    @Query() query: ReviewTargetQueryDto,
  ): Promise<RatingSummaryView> {
    try {
      return await this.getRatingSummary.execute({
        targetType: query.targetType,
        targetId: query.targetId,
      });
    } catch (error) {
      this.handleError(error);
    }
  }
}
