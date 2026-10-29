import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { ReviewTarget } from '../../../domain/index.js';
import { REVIEW_REPOSITORY } from '../../ports/index.js';
import type { ReviewRepository } from '../../ports/index.js';
import { toReviewView, type ReviewView } from '../review-view.js';
import type { GetReviewsCommand } from './get-reviews.command.js';

@Injectable()
export class GetReviewsUseCase implements UseCase<
  GetReviewsCommand,
  ReviewView[]
> {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
  ) {}

  async execute(command: GetReviewsCommand): Promise<ReviewView[]> {
    const target = ReviewTarget.create(command.targetType, command.targetId);
    const reviews = await this.reviews.findByTarget(target);

    return reviews.map(toReviewView);
  }
}
