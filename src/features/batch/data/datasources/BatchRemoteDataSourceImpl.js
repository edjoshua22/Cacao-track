/**
 * @file BatchRemoteDataSourceImpl.js
 * @description Firebase Realtime Database implementation for batch remote data.
 */
import { getDatabase, ref, onValue, get, push, set, remove } from 'firebase/database';
import { app } from '../../../../../firebaseConfig.secure';
import { IBatchRemoteDataSource } from './IBatchRemoteDataSource';
import { BatchModel } from '../models/BatchModel';
import { logProductionError } from '../../../../core/utils/debugUtils';

export class BatchRemoteDataSourceImpl extends IBatchRemoteDataSource {
  constructor() {
    super();
    this._db = getDatabase(app);
  }

  /**
   * Fetch all batches for a user once.
   * @param {string} userId
   * @returns {Promise<BatchModel[]>}
   */
  async fetchUserBatches(userId) {
    try {
      const snapshot = await get(ref(this._db, `batches/${userId}`));
      if (!snapshot.exists()) return [];
      return Object.entries(snapshot.val()).map(([id, data]) => BatchModel.fromJson(data, id));
    } catch (error) {
      logProductionError(error, 'BatchRemoteDataSource.fetchUserBatches');
      throw error;
    }
  }

  /**
   * Fetch a single batch by ID, trying user path then global path.
   * @param {string} batchId
   * @returns {Promise<BatchModel|null>}
   */
  async fetchBatchById(batchId) {
    try {
      const snapshot = await get(ref(this._db, `batches/${batchId}`));
      if (!snapshot.exists()) return null;
      return BatchModel.fromJson(snapshot.val(), batchId);
    } catch (error) {
      logProductionError(error, 'BatchRemoteDataSource.fetchBatchById');
      throw error;
    }
  }

  /**
   * Create a new batch under the user's node.
   * @param {string} userId
   * @param {object} data - Plain batch data object.
   * @returns {Promise<string>} Newly created batch ID.
   */
  async createBatch(userId, data) {
    try {
      const batchesRef = ref(this._db, `batches/${userId}`);
      const newRef     = push(batchesRef);
      await set(newRef, { ...data, createdAt: Date.now() });
      return newRef.key;
    } catch (error) {
      logProductionError(error, 'BatchRemoteDataSource.createBatch');
      throw error;
    }
  }

  /**
   * Delete a batch — tries user path first, then global path.
   * @param {string} userId
   * @param {string} batchId
   * @returns {Promise<void>}
   */
  async deleteBatch(userId, batchId) {
    try {
      const userPath = ref(this._db, `batches/${userId}/${batchId}`);
      const userSnap = await get(userPath);
      if (userSnap.exists()) { await remove(userPath); return; }

      const globalPath = ref(this._db, `batches/${batchId}`);
      const globalSnap = await get(globalPath);
      if (globalSnap.exists()) { await remove(globalPath); return; }

      throw new Error(`Batch ${batchId} not found in any path`);
    } catch (error) {
      logProductionError(error, 'BatchRemoteDataSource.deleteBatch');
      throw error;
    }
  }

  /**
   * Subscribe to real-time batch updates for a user.
   * @param {string} userId
   * @param {Function} callback - Called with BatchModel[] on each update.
   * @returns {Function} Unsubscribe function.
   */
  subscribeToBatches(userId, callback) {
    const userRef = ref(this._db, `batches/${userId}`);
    return onValue(userRef, (snapshot) => {
      if (!snapshot.exists()) { callback([]); return; }
      const batches = Object.entries(snapshot.val()).map(([id, data]) => BatchModel.fromJson(data, id));
      callback(batches);
    }, (error) => {
      logProductionError(error, 'BatchRemoteDataSource.subscribeToBatches');
    });
  }
}
