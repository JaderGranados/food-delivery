import { Inject, Injectable } from '@nestjs/common';
import type { UseCase } from '@shared/application/index.js';
import { RatingSummary, ReviewTarget } from '../../../domain/index.js';
import { REVIEW_REPOSITORY } from '../../ports/index.js';
import type { ReviewRepository } from '../../ports/index.js';
import type { GetRatingSummaryCommand } from './get-rating-summary.command.js';
import type { RatingSummaryView } from './rating-summary-view.js';

@Injectable()
export class GetRatingSummaryUseCase implements UseCase<
  GetRatingSummaryCommand,
  RatingSummaryView
> {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
  ) {}

  async execute(command: GetRatingSummaryCommand): Promise<RatingSummaryView> {
    const target = ReviewTarget.create(command.targetType, command.targetId);
    const summary = RatingSummary.from(await this.reviews.findByTarget(target));

    return {
      target: { type: target.type, id: target.id },
      count: summary.count,
      average: summary.average,
      distribution: { ...summary.distribution },
    };
  }
}
