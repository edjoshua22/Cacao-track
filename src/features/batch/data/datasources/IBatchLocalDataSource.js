/** @file IBatchLocalDataSource.js */
export class IBatchLocalDataSource {
  /** @param {string} userId @returns {Promise<import('../models/BatchModel').BatchModel[]|null>} */
  async getCachedBatches(userId)         { throw new Error('not implemented'); }
  /** @param {string} userId @param {import('../models/BatchModel').BatchModel[]} batches @returns {Promise<void>} */
  async cacheBatches(userId, batches)    { throw new Error('not implemented'); }
  /** @param {string} userId @returns {Promise<void>} */
  async clearCache(userId)              { throw new Error('not implemented'); }
}
