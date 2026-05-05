// OnboardingRepositoryImpl.js
export class OnboardingRepositoryImpl {
  constructor({ onboardingLocalDataSource }) { this._local = onboardingLocalDataSource; }
  async isOnboardingComplete() { return this._local.isComplete(); }
  async completeOnboarding()   { return this._local.markComplete(); }
  async resetOnboarding()      { return this._local.reset(); }
}
