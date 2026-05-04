/**
 * @file GetBatchesUseCase.js
 */
import { UseCase } from '../../../../core/utils/UseCase';
import { ok, fail } from '../../../../core/utils/Result';
import { Failure }  from '../../../../core/error/Failure';

export class GetBatchesUseCase extends UseCase {
  /** @param {{ batchRepository: import('../../data/repositories/BatchRepositoryImpl').BatchRepositoryImpl, authService: import('../../../../core/auth/AuthServiceImpl').AuthServiceImpl }} deps */
  constructor({ batchRepository, authService }) {
    super();
    this._repo = batchRepository;
    this._auth = authService;
  }

  /**
   * @returns {Promise<{ success: boolean, data?: import('../../domain/entities/Batch').Batch[], error?: Failure }>}
   */
  async execute() {
    try {
      await this._auth.initialize();
      const userId = this._auth.getUserId();
      if (!userId) return fail(new Failure('User not authenticated'));
      const batches = await this._repo.getAllBatches(userId);
      return ok(batches);
    } catch (error) {
      return fail(new Failure(error.message, error));
    }
  }
}
