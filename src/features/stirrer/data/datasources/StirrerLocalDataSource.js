/**
 * @file StirrerLocalDataSource.js
 * @description Handles persisting the ESP32 IP address to AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@stirrer_esp32_ip';
export const DEFAULT_ESP_IP = '192.168.1.53';

export class StirrerLocalDataSource {
  /**
   * Load the saved ESP32 IP from AsyncStorage.
   * @returns {Promise<string|null>}
   */
  async getEspIp() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Persist the ESP32 IP to AsyncStorage.
   * @param {string} ip
   * @returns {Promise<void>}
   */
  async saveEspIp(ip) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, ip);
    } catch {
      // silently fail — non-critical
    }
  }
}
