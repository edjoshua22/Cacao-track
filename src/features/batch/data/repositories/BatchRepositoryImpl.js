/**
 * @file BatchRepositoryImpl.js
 * @description Implements IBatchRepository by coordinating remote and local data sources.
 */
import { IBatchRepository } from '../../domain/repositories/IBatchRepository';

export class BatchRepositoryImpl extends IBatchRepository {
  /**
   * @param {{ batchRemoteDataSource: import('../datasources/IBatchRemoteDataSource').IBatchRemoteDataSource,
   *           batchLocalDataSource:  import('../datasources/IBatchLocalDataSource').IBatchLocalDataSource }} deps
   */
  constructor({ batchRemoteDataSource, batchLocalDataSource }) {
    super();
    this.remote = batchRemoteDataSource;
    this.local  = batchLocalDataSource;
  }

  /**
   * Fetch all batches for the given user.
   * @param {string} userId
   * @returns {Promise<import('../../domain/entities/Batch').Batch[]>}
   */
  async getAllBatches(userId) {
    const models = await this.remote.fetchUserBatches(userId);
    return models.map((m) => m.toEntity());
  }

  /**
   * Fetch a single batch by ID.
   * @param {string} batchId
   * @returns {Promise<import('../../domain/entities/Batch').Batch|null>}
   */
  async getBatchById(batchId) {
    const model = await this.remote.fetchBatchById(batchId);
    return model ? model.toEntity() : null;
  }

  /**
   * Create a new batch.
   * @param {string} userId
   * @param {object} batchData
   * @returns {Promise<string>} New batch ID.
   */
  async createBatch(userId, batchData) {
    return this.remote.createBatch(userId, batchData);
  }

  /**
   * Delete a batch.
   * @param {string} userId
   * @param {string} batchId
   * @returns {Promise<void>}
   */
  async deleteBatch(userId, batchId) {
    return this.remote.deleteBatch(userId, batchId);
  }

  /**
   * Subscribe to real-time batch updates.
   * @param {string} userId
   * @param {Function} callback - Receives Batch[] on each update.
   * @returns {Function} Unsubscribe.
   */
  subscribeToUserBatches(userId, callback) {
    return this.remote.subscribeToBatches(userId, (models) => {
      callback(models.map((m) => m.toEntity()));
    });
  }
}
