/**
 * @file CreateBatchUseCase.js
 */
import { UseCase } from '../../../../core/utils/UseCase';
import { ok, fail } from '../../../../core/utils/Result';
import { Failure }  from '../../../../core/error/Failure';

export class CreateBatchUseCase extends UseCase {
  /** @param {{ batchRepository, authService }} deps */
  constructor({ batchRepository, authService }) {
    super();
    this._repo = batchRepository;
    this._auth = authService;
  }

  /**
   * @param {{ name: string, notes?: string }} input
   * @returns {Promise<{ success: boolean, data?: string, error?: Failure }>}
   */
  async execute({ name, notes }) {
    try {
      await this._auth.initialize();
      const userId = this._auth.getUserId();
      if (!userId) return fail(new Failure('User not authenticated'));
      const id = await this._repo.createBatch(userId, { name, notes: notes || null, status: 'Just Started', quality: 'Needs Attention' });
      return ok(id);
    } catch (error) {
      return fail(new Failure(error.message, error));
    }
  }
}
