/**
 * @file GetBatchDetailUseCase.js
 */
import { UseCase } from '../../../../core/utils/UseCase';
import { ok, fail } from '../../../../core/utils/Result';
import { Failure }  from '../../../../core/error/Failure';

export class GetBatchDetailUseCase extends UseCase {
  /** @param {{ batchRepository: import('../../data/repositories/BatchRepositoryImpl').BatchRepositoryImpl }} deps */
  constructor({ batchRepository }) {
    super();
    this._repo = batchRepository;
  }

  /**
   * @param {{ batchId: string }} input
   * @returns {Promise<{ success: boolean, data?: import('../../domain/entities/Batch').Batch, error?: Failure }>}
   */
  async execute({ batchId }) {
    try {
      const batch = await this._repo.getBatchById(batchId);
      if (!batch) return fail(new Failure(`Batch ${batchId} not found`));
      return ok(batch);
    } catch (error) {
      return fail(new Failure(error.message, error));
    }
  }
}
