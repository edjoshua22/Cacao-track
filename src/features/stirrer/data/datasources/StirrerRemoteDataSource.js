/**
 * @file StirrerRemoteDataSource.js
 * @description Handles all HTTP communication with the ESP32 stirrer controller.
 * Only this file knows about fetch/networking — all other layers are unaware.
 */
const TIMEOUT_MS = 5000;

export class StirrerRemoteDataSource {
  /**
   * @param {string} espIp - IP address of the ESP32 (e.g. "192.168.1.100")
   */
  constructor(espIp) {
    this._espIp = espIp;
  }

  /** Update the target ESP32 IP address at runtime. */
  setIp(espIp) {
    this._espIp = espIp;
  }

  /**
   * Send a GET request to a specific ESP32 endpoint.
   * @param {'start'|'stop'} command
   * @returns {Promise<import('../models/StirrerCommandModel').StirrerCommandModel>}
   */
  async sendCommand(command) {
    const { StirrerCommandModel } = await import('../models/StirrerCommandModel');
    const url = `http://${this._espIp}/${command}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      return StirrerCommandModel.fromResponse(response);
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout = err.name === 'AbortError';
      const model = new StirrerCommandModel({
        ok: false,
        status: isTimeout ? 'Connection timed out' : err.message,
      });
      return model;
    }
  }

  async start() { return this.sendCommand('start'); }
  async stop() { return this.sendCommand('stop'); }
}
