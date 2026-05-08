/**
 * @file StirrerState.js
 * @description Domain entity representing the state of the stirrer motor.
 */
export class StirrerState {
  /**
   * @param {object} params
   * @param {boolean} params.isRunning  - Whether the motor is currently running.
   * @param {string}  params.espIp      - IP address of the ESP32 controller.
   * @param {string|null} params.error  - Last error message, or null if none.
   */
  constructor({ isRunning = false, espIp = '', error = null } = {}) {
    this.isRunning = isRunning;
    this.espIp     = espIp;
    this.error     = error;
  }
}
