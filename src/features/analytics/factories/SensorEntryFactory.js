/**
 * @file SensorEntryFactory.js
 * @description Factory Pattern — centralises construction of SensorEntry objects
 * from raw Firebase payloads. Decouples data-source shape from domain entity shape.
 *
 * Factory Pattern: one class, one responsibility — know how to build SensorEntry
 * from every possible raw format the Firebase node might produce.
 */
import { SensorEntry } from '../domain/entities/SensorEntry';

export class SensorEntryFactory {
  /**
   * Build a single SensorEntry from a raw Firebase record.
   * @param {object} raw  Raw record from /sensorData
   * @returns {SensorEntry}
   */
  static create(raw) {
    return SensorEntry.fromJson(raw);
  }

  /**
   * Build an array of SensorEntry from a Firebase snapshot value.
   * Handles both array and object (push-ID keyed) shapes.
   * @param {object|Array} snapshotVal  snap.val() from Firebase
   * @returns {SensorEntry[]}  sorted chronologically
   */
  static createFromSnapshot(snapshotVal) {
    if (!snapshotVal) return [];

    const rawArr = Array.isArray(snapshotVal)
      ? snapshotVal.filter(Boolean)
      : Object.values(snapshotVal).filter(Boolean);

    // Build entities
    const entries = rawArr
      .filter(raw => raw && raw.time)          // must have a time field
      .map(raw => SensorEntryFactory.create(raw));

    // Sort lexicographically on time string — ISO-like "YYYY-MM-DD HH:mm:ss" sorts correctly
    entries.sort((a, b) => a.time.localeCompare(b.time));

    return entries;
  }
}
