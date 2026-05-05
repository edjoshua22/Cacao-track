/**
 * @file GetFermentationHistoryUseCase.js
 */
import { UseCase } from '../../../../core/utils/UseCase';
import { ok, fail } from '../../../../core/utils/Result';
import { Failure }  from '../../../../core/error/Failure';

export class GetFermentationHistoryUseCase extends UseCase {
  constructor({ fermentationRepository, authService }) {
    super();
    this._repo = fermentationRepository;
    this._auth = authService;
  }
  async execute() {
    try {
      await this._auth.initialize();
      const userId = this._auth.getUserId();
      if (!userId) return fail(new Failure('User not authenticated'));
      const batches = await this._repo.getBatchesWithHistory(userId);
      return ok(batches);
    } catch (error) {
      return fail(new Failure(error.message, error));
    }
  }
}
