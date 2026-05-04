/** @file IStorageService.js */
export class IStorageService {
  /** @param {string} key @param {string} value @returns {Promise<void>} */
  async setItem(key, value)  { throw new Error('IStorageService.setItem() not implemented'); }
  /** @param {string} key @returns {Promise<string|null>} */
  async getItem(key)         { throw new Error('IStorageService.getItem() not implemented'); }
  /** @param {string} key @returns {Promise<void>} */
  async removeItem(key)      { throw new Error('IStorageService.removeItem() not implemented'); }
  /** @param {string[][]} pairs @returns {Promise<void>} */
  async multiSet(pairs)      { throw new Error('IStorageService.multiSet() not implemented'); }
  /** @param {string[]} keys @returns {Promise<[string, string|null][]>} */
  async multiGet(keys)       { throw new Error('IStorageService.multiGet() not implemented'); }
}
