// OnboardingLocalDataSourceImpl.js
const KEY = 'onboardingComplete';
export class OnboardingLocalDataSourceImpl {
  constructor({ storageService }) { this._storage = storageService; }
  async isComplete()      { const v = await this._storage.getItem(KEY); return v === 'true'; }
  async markComplete()    { await this._storage.setItem(KEY, 'true'); }
  async reset()           { await this._storage.removeItem(KEY); }
}
