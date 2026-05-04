/** @file IBatchRemoteDataSource.js */
export class IBatchRemoteDataSource {
  /** @param {string} userId @returns {Promise<import('../../data/models/BatchModel').BatchModel[]>} */
  async fetchUserBatches(userId)             { throw new Error('not implemented'); }
  /** @param {string} batchId @returns {Promise<import('../../data/models/BatchModel').BatchModel|null>} */
  async fetchBatchById(batchId)              { throw new Error('not implemented'); }
  /** @param {string} userId @param {object} data @returns {Promise<string>} */
  async createBatch(userId, data)            { throw new Error('not implemented'); }
  /** @param {string} userId @param {string} batchId @returns {Promise<void>} */
  async deleteBatch(userId, batchId)         { throw new Error('not implemented'); }
  /** @param {string} userId @param {Function} cb @returns {Function} */
  subscribeToBatches(userId, cb)             { throw new Error('not implemented'); }
}
