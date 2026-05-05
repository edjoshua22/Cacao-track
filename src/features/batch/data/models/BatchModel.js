/**
 * @file BatchModel.js
 * @description Data model bridging the Firebase JSON shape and the Batch domain entity.
 */
import { Batch } from '../../domain/entities/Batch';

export class BatchModel {
  constructor({ id, name, createdAt, completedAt, avgTemp, avgHumidity, avgMoisture, dataPoints, status, quality, notes, sensorData, day0, day1, day2, day3, day4, day5, day6 }) {
    this.id          = id;
    this.name        = name;
    this.createdAt   = createdAt   ? Number(createdAt)   : null;
    this.completedAt = completedAt ? Number(completedAt) : null;
    this.avgTemp     = avgTemp     ?? 0;
    this.avgHumidity = avgHumidity ?? 0;
    this.avgMoisture = avgMoisture ?? 0;
    this.dataPoints  = dataPoints  ?? 0;
    this.status      = status      ?? 'Just Started';
    this.quality     = quality     ?? 'Needs Attention';
    this.notes       = notes       ?? null;
    this.sensorData  = sensorData  ?? null;
    this.day0 = day0 ?? null; this.day1 = day1 ?? null; this.day2 = day2 ?? null;
    this.day3 = day3 ?? null; this.day4 = day4 ?? null; this.day5 = day5 ?? null;
    this.day6 = day6 ?? null;
  }

  /**
   * Deserialize a Firebase snapshot value into a BatchModel.
   * @param {object} json - Raw Firebase object.
   * @param {string} id   - Document key.
   * @returns {BatchModel}
   */
  static fromJson(json, id) {
    return new BatchModel({
      id,
      name:        json.name,
      createdAt:   json.createdAt   || json.startTime,
      completedAt: json.completedAt || null,
      avgTemp:     json.avgTemp     ?? 0,
      avgHumidity: json.avgHumidity ?? 0,
      avgMoisture: json.avgMoisture ?? 0,
      dataPoints:  json.dataPoints  ?? 0,
      status:      json.status,
      quality:     json.quality,
      notes:       json.notes,
      sensorData:  json.sensorData,
      day0: json.stagesData?.day0 || json.day0, 
      day1: json.stagesData?.day1 || json.day1, 
      day2: json.stagesData?.day2 || json.day2,
      day3: json.stagesData?.day3 || json.day3, 
      day4: json.stagesData?.day4 || json.day4, 
      day5: json.stagesData?.day5 || json.day5, 
      day6: json.stagesData?.day6 || json.day6,
    });
  }

  /**
   * Serialize to a plain object suitable for Firebase writes.
   * @returns {object}
   */
  toJson() {
    return {
      name:        this.name,
      createdAt:   this.createdAt,
      completedAt: this.completedAt,
      avgTemp:     this.avgTemp,
      avgHumidity: this.avgHumidity,
      avgMoisture: this.avgMoisture,
      dataPoints:  this.dataPoints,
      status:      this.status,
      quality:     this.quality,
      notes:       this.notes,
    };
  }

  /**
   * Convert to domain Batch entity.
   * @returns {Batch}
   */
  toEntity() {
    return new Batch({
      id:          this.id,
      name:        this.name,
      createdAt:   this.createdAt,
      completedAt: this.completedAt,
      avgTemp:     this.avgTemp,
      avgHumidity: this.avgHumidity,
      avgMoisture: this.avgMoisture,
      dataPoints:  this.dataPoints,
      status:      this.status,
      quality:     this.quality,
      notes:       this.notes,
      sensorData:  this.sensorData,
      day0: this.day0, day1: this.day1, day2: this.day2,
      day3: this.day3, day4: this.day4, day5: this.day5, day6: this.day6,
    });
  }

  /**
   * Create a BatchModel from a domain entity.
   * @param {Batch} entity
   * @returns {BatchModel}
   */
  static fromEntity(entity) {
    return new BatchModel({ ...entity });
  }
}
