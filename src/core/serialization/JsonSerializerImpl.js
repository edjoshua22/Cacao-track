/**
 * @file JsonSerializerImpl.js
 * @description Simple JSON serializer using native JSON API.
 */
import { IJsonSerializer } from './IJsonSerializer';

export class JsonSerializerImpl extends IJsonSerializer {
  /**
   * Parse a JSON string.
   * @param {string} json
   * @returns {*} Parsed value.
   */
  deserialize(json) {
    return JSON.parse(json);
  }

  /**
   * Stringify a value to JSON.
   * @param {*} value
   * @returns {string} JSON string.
   */
  serialize(value) {
    return JSON.stringify(value);
  }
}
