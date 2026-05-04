/**
 * @file SensorEntry.js
 * @description JSON-serializable domain entity for a single sensor reading.
 * Mirrors the raw Firebase /sensorData record but with normalized, typed fields.
 *
 * "JSON Serializable Generator" pattern — fromJson / toJson static methods act
 * as the generated serialization hooks (equivalent to json_serializable in Dart).
 */
export class SensorEntry {
  /**
   * @param {object} params
   * @param {string} params.time       ISO-like datetime string "YYYY-MM-DD HH:mm:ss"
   * @param {number} params.tempDHT1
   * @param {number} params.tempDHT2
   * @param {number} params.humidDHT1
   * @param {number} params.humidDHT2
   * @param {number} params.moisture
   * @param {string} params.dateKey    "YYYY-MM-DD" portion
   * @param {string} params.timeLabel  "HH:MM" portion for chart labels
   */
  constructor({ time, tempDHT1, tempDHT2, humidDHT1, humidDHT2, moisture, dateKey, timeLabel }) {
    this.time       = time;
    this.tempDHT1   = tempDHT1;
    this.tempDHT2   = tempDHT2;
    this.humidDHT1  = humidDHT1;
    this.humidDHT2  = humidDHT2;
    this.moisture   = moisture;
    this.dateKey    = dateKey;
    this.timeLabel  = timeLabel;
  }

  /** Deserialize from a raw Firebase /sensorData record. */
  static fromJson(raw) {
    return new SensorEntry(SensorEntry._normalize(raw));
  }

  /** Serialize back to a plain object (for caching / AsyncStorage). */
  toJson() {
    return {
      time:      this.time,
      tempDHT1:  this.tempDHT1,
      tempDHT2:  this.tempDHT2,
      humidDHT1: this.humidDHT1,
      humidDHT2: this.humidDHT2,
      moisture:  this.moisture,
      dateKey:   this.dateKey,
      timeLabel: this.timeLabel,
    };
  }

  // ── private helpers ────────────────────────────────────────────────────────
  static _n(v) { const n = Number(v); return isFinite(n) ? n : 0; }

  static _normalize(raw) {
    const time      = raw.time ? String(raw.time) : '';
    const dateKey   = time.split(' ')[0] || '';
    const timeLabel = time.split(' ')[1]?.slice(0, 5) || time;
    return {
      time,
      dateKey,
      timeLabel,
      tempDHT1:  SensorEntry._n(raw.tempDHT1  ?? raw.temp1    ?? raw.temp ?? raw.temperature),
      tempDHT2:  SensorEntry._n(raw.tempDHT2  ?? raw.temp2    ?? raw.temp ?? raw.temperature),
      humidDHT1: SensorEntry._n(raw.humidDHT1 ?? raw.humidity1 ?? raw.humidity),
      humidDHT2: SensorEntry._n(raw.humidDHT2 ?? raw.humidity2 ?? raw.humidity),
      moisture:  SensorEntry._n(raw.soilMoisture),
    };
  }
}
