/**
 * @file BatchLocalDataSourceImpl.js
 * @description AsyncStorage cache for batch data.
 */
import { IBatchLocalDataSource } from './IBatchLocalDataSource';
import { BatchModel } from '../models/BatchModel';

const CACHE_KEY_PREFIX = 'batch_cache_';

export class BatchLocalDataSourceImpl extends IBatchLocalDataSource {
  /**
   * @param {{ storageService: import('../../../../core/storage/IStorageService').IStorageService }} deps
   */
  constructor({ storageService }) {
    super();
    this._storage = storageService;
  }

  /**
   * Retrieve cached batches for a user.
   * @param {string} userId
   * @returns {Promise<BatchModel[]|null>}
   */
  async getCachedBatches(userId) {
    try {
      const raw = await this._storage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.map((b) => BatchModel.fromJson(b, b.id));
    } catch { return null; }
  }

  /**
   * Store batches in cache.
   * @param {string} userId
   * @param {BatchModel[]} batches
   * @returns {Promise<void>}
   */
  async cacheBatches(userId, batches) {
    try {
      const serializable = batches.map((b) => ({ ...b.toJson(), id: b.id }));
      await this._storage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify(serializable));
    } catch { /* cache write failure is non-fatal */ }
  }

  /**
   * Remove cached batches for a user.
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async clearCache(userId) {
    try {
      await this._storage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);
    } catch { /* non-fatal */ }
  }
}
