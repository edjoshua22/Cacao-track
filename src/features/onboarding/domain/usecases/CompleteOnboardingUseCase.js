import { UseCase } from '../../../../core/utils/UseCase';
import { ok, fail } from '../../../../core/utils/Result';
import { Failure }  from '../../../../core/error/Failure';

export class CompleteOnboardingUseCase extends UseCase {
  constructor({ onboardingRepository }) { super(); this._repo = onboardingRepository; }
  async execute() {
    try { await this._repo.completeOnboarding(); return ok(null); }
    catch (e) { return fail(new Failure(e.message, e)); }
  }
}
