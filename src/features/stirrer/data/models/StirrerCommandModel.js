/**
 * @file StirrerCommandModel.js
 * @description Data model representing a raw HTTP response from the ESP32.
 * Responsible for parsing the plain-text "OK" response body.
 */
export class StirrerCommandModel {
  /**
   * @param {object} params
   * @param {boolean} params.ok      - Whether the HTTP request succeeded.
   * @param {string}  params.status  - Raw response text from ESP32.
   */
  constructor({ ok, status }) {
    this.ok     = ok;
    this.status = status;
  }

  /** Parse the raw fetch Response into a StirrerCommandModel. */
  static async fromResponse(response) {
    const text = await response.text().catch(() => '');
    return new StirrerCommandModel({ ok: response.ok, status: text.trim() });
  }
}
