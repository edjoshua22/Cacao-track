/**
 * @file AnalyticsRemoteDataSourceImpl.js
 * @description Concrete Firebase implementation of IAnalyticsDataSource.
 * Uses the existing Firebase app from firebaseConfig.secure.
 * Injected via DI container — no direct import of Firebase in the screen.
 */
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../../../../../firebaseConfig.secure';
import { IAnalyticsDataSource } from './IAnalyticsDataSource';
import { SensorEntryFactory } from '../../factories/SensorEntryFactory';

export class AnalyticsRemoteDataSourceImpl extends IAnalyticsDataSource {
  constructor() {
    super();
    this._db = getDatabase(app);
  }

  /**
   * Opens a realtime listener on /sensorData, parses all records via
   * SensorEntryFactory, and calls onData with the normalized SensorEntry[].
   *
   * @param {function(import('../../domain/entities/SensorEntry').SensorEntry[]): void} onData
   * @param {function(Error): void} onError
   * @returns {function} Firebase unsubscribe function
   */
  subscribeToSensorData(onData, onError) {
    const sensorRef = ref(this._db, 'sensorData');

    const unsub = onValue(
      sensorRef,
      (snap) => {
        if (snap.exists()) {
          const entries = SensorEntryFactory.createFromSnapshot(snap.val());
          onData(entries);
        } else {
          onData([]);
        }
      },
      (err) => {
        console.warn('[AnalyticsRemoteDataSource] Firebase error:', err.message);
        onError?.(err);
      }
    );

    return unsub; // caller must invoke this to unsubscribe
  }
}
