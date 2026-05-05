/**
 * @file AsyncStorageImpl.js
 * @description AsyncStorage implementation of IStorageService.
 * The ONLY file that imports @react-native-async-storage/async-storage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IStorageService } from './IStorageService';

export class AsyncStorageImpl extends IStorageService {
  /**
   * Store a string value.
   * @param {string} key
   * @param {string} value
   * @returns {Promise<void>}
   */
  async setItem(key, value)  { return AsyncStorage.setItem(key, value); }

  /**
   * Retrieve a stored string value.
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async getItem(key)         { return AsyncStorage.getItem(key); }

  /**
   * Remove a stored key.
   * @param {string} key
   * @returns {Promise<void>}
   */
  async removeItem(key)      { return AsyncStorage.removeItem(key); }

  /**
   * Store multiple key-value pairs.
   * @param {string[][]} pairs
   * @returns {Promise<void>}
   */
  async multiSet(pairs)      { return AsyncStorage.multiSet(pairs); }

  /**
   * Retrieve multiple values.
   * @param {string[]} keys
   * @returns {Promise<[string, string|null][]>}
   */
  async multiGet(keys)       { return AsyncStorage.multiGet(keys); }
}
