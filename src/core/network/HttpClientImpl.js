/**
 * @file HttpClientImpl.js
 * @description Axios-based HTTP client implementation.
 * All axios calls are isolated to this file — no other layer imports axios directly.
 */
import axios from 'axios';
import { API_BASE_URL } from '../../../config';
import { IHttpClient } from './IHttpClient';
import { logApiCall } from '../utils/debugUtils';

export class HttpClientImpl extends IHttpClient {
  constructor() {
    super();
    this._client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Perform a GET request.
   * @param {string} url - Relative or absolute URL.
   * @param {object} [config] - Axios config overrides.
   * @returns {Promise<*>} Response data.
   */
  async get(url, config) {
    try {
      const response = await this._client.get(url, config);
      logApiCall(url, 'GET', true);
      return response.data;
    } catch (error) {
      logApiCall(url, 'GET', false, error);
      throw error;
    }
  }

  /**
   * Perform a POST request.
   * @param {string} url
   * @param {object} data - Request body.
   * @param {object} [config]
   * @returns {Promise<*>} Response data.
   */
  async post(url, data, config) {
    try {
      const response = await this._client.post(url, data, config);
      logApiCall(url, 'POST', true);
      return response.data;
    } catch (error) {
      logApiCall(url, 'POST', false, error);
      throw error;
    }
  }

  /**
   * Perform a PUT request.
   * @param {string} url
   * @param {object} data
   * @param {object} [config]
   * @returns {Promise<*>}
   */
  async put(url, data, config) {
    try {
      const response = await this._client.put(url, data, config);
      logApiCall(url, 'PUT', true);
      return response.data;
    } catch (error) {
      logApiCall(url, 'PUT', false, error);
      throw error;
    }
  }

  /**
   * Perform a DELETE request.
   * @param {string} url
   * @param {object} [config]
   * @returns {Promise<*>}
   */
  async delete(url, config) {
    try {
      const response = await this._client.delete(url, config);
      logApiCall(url, 'DELETE', true);
      return response.data;
    } catch (error) {
      logApiCall(url, 'DELETE', false, error);
      throw error;
    }
  }
}
