/**
 * @file FermentationRepositoryImpl.js
 */
export class FermentationRepositoryImpl {
  constructor({ fermentationRemoteDataSource }) {
    this.remote = fermentationRemoteDataSource;
  }
  async getBatchesWithHistory(userId) {
    return this.remote.fetchBatchesWithHistory(userId);
  }
}
