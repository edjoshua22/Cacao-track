/** @file IBatchRepository.js */
export class IBatchRepository {
  /** @returns {Promise<import('../entities/Batch').Batch[]>} */
  async getAllBatches()                   { throw new Error('IBatchRepository.getAllBatches() not implemented'); }
  /** @param {string} id @returns {Promise<import('../entities/Batch').Batch|null>} */
  async getBatchById(id)                 { throw new Error('IBatchRepository.getBatchById() not implemented'); }
  /** @param {object} batchData @returns {Promise<import('../entities/Batch').Batch>} */
  async createBatch(batchData)           { throw new Error('IBatchRepository.createBatch() not implemented'); }
  /** @param {string} id @returns {Promise<void>} */
  async deleteBatch(id)                  { throw new Error('IBatchRepository.deleteBatch() not implemented'); }
  /** @param {Function} callback @returns {Function} unsubscribe */
  subscribeToUserBatches(userId, callback) { throw new Error('IBatchRepository.subscribeToUserBatches() not implemented'); }
}
