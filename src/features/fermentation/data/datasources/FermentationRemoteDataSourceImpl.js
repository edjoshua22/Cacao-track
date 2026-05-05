/**
 * @file FermentationRemoteDataSourceImpl.js
 */
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '../../../../../firebaseConfig.secure';

export class FermentationRemoteDataSourceImpl {
  constructor() { this._db = getDatabase(app); }

  /**
   * Fetch all batches with sensor data for a user.
   * @param {string} userId
   * @returns {Promise<object[]>}
   */
  async fetchBatchesWithHistory(userId) {
    const snap = await get(ref(this._db, `batches/${userId}`));
    if (!snap.exists()) return [];
    return Object.entries(snap.val()).map(([id, b]) => ({ id, name: b.name, createdAt: b.createdAt, raw: b }));
  }
}
