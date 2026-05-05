/**
 * @file CalculateFermentationUseCase.js
 * @description Encapsulates all fermentation day/stage/quality calculation logic.
 */
import { UseCase } from '../../../../core/utils/UseCase';
import { ok, fail } from '../../../../core/utils/Result';
import { Failure }  from '../../../../core/error/Failure';
import {
  calculateFermentationDay,
  calculateBatchQuality,
  calculateBatchStatus,
  buildDayBuckets,
} from '../../../../core/utils/fermentationUtils';

export class CalculateFermentationUseCase extends UseCase {
  constructor() { super(); }

  /**
   * @param {{ batchRaw: object }} input
   * @returns {Promise<{ success: boolean, data?: object, error?: Failure }>}
   */
  async execute({ batchRaw }) {
    try {
      const days = buildDayBuckets ? buildDayBuckets(batchRaw) : [];
      return ok({ days, dayCount: days?.length ?? 0 });
    } catch (error) {
      return fail(new Failure(error.message, error));
    }
  }
}
