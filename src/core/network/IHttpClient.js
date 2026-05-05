/**
 * @file IHttpClient.js
 * @description Abstract base class for HTTP client.
 */
export class IHttpClient {
  /**
   * @param {string} url
   * @param {object} [config]
   * @returns {Promise<*>}
   */
  async get(url, config)              { throw new Error('IHttpClient.get() not implemented'); }
  async post(url, data, config)       { throw new Error('IHttpClient.post() not implemented'); }
  async put(url, data, config)        { throw new Error('IHttpClient.put() not implemented'); }
  async delete(url, config)           { throw new Error('IHttpClient.delete() not implemented'); }
}
