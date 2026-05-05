/**
 * @file Batch.js
 * @description Pure batch domain entity — no JSON logic, no Firebase references.
 */
export class Batch {
  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.name
   * @param {number|null} params.createdAt - epoch ms
   * @param {number|null} [params.completedAt]
   * @param {number} [params.avgTemp]
   * @param {number} [params.avgHumidity]
   * @param {number} [params.avgMoisture]
   * @param {number} [params.dataPoints]
   * @param {string} [params.status]
   * @param {string} [params.quality]
   * @param {string|null} [params.notes]
   * @param {object} [params.sensorData]
   * @param {object} [params.day0]
   * @param {object} [params.day1]
   * @param {object} [params.day2]
   * @param {object} [params.day3]
   * @param {object} [params.day4]
   * @param {object} [params.day5]
   * @param {object} [params.day6]
   */
  constructor({
    id, name, createdAt, completedAt = null,
    avgTemp = 0, avgHumidity = 0, avgMoisture = 0, dataPoints = 0,
    status = 'Just Started', quality = 'Needs Attention', notes = null,
    sensorData = null,
    day0 = null, day1 = null, day2 = null, day3 = null,
    day4 = null, day5 = null, day6 = null,
  }) {
    this.id          = id;
    this.name        = name;
    this.createdAt   = createdAt;
    this.completedAt = completedAt;
    this.avgTemp     = avgTemp;
    this.avgHumidity = avgHumidity;
    this.avgMoisture = avgMoisture;
    this.dataPoints  = dataPoints;
    this.status      = status;
    this.quality     = quality;
    this.notes       = notes;
    this.sensorData  = sensorData;
    this.day0 = day0; this.day1 = day1; this.day2 = day2;
    this.day3 = day3; this.day4 = day4; this.day5 = day5; this.day6 = day6;
  }
}
