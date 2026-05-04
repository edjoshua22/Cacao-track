// MonitoringRemoteDataSourceImpl.js
import { getDatabase, ref, onValue, query, limitToLast } from 'firebase/database';
import { app } from '../../../../../firebaseConfig.secure';

export class MonitoringRemoteDataSourceImpl {
  constructor() { this._db = getDatabase(app); }
  subscribeToLiveSensors(callback) {
    const dht1Ref    = ref(this._db, 'DHT1');
    const dht2Ref    = ref(this._db, 'DHT2');
    const avgRef     = ref(this._db, 'Average');
    const sensorRef  = query(ref(this._db, 'sensorData'), limitToLast(20));
    const unsubs = [];
    unsubs.push(onValue(dht1Ref,   (snap) => callback({ type: 'dht1',    data: snap.exists() ? snap.val() : null })));
    unsubs.push(onValue(dht2Ref,   (snap) => callback({ type: 'dht2',    data: snap.exists() ? snap.val() : null })));
    unsubs.push(onValue(avgRef,    (snap) => callback({ type: 'average', data: snap.exists() ? snap.val() : null })));
    unsubs.push(onValue(sensorRef, (snap) => callback({ type: 'history', data: snap.exists() ? snap.val() : null })));
    return () => unsubs.forEach((u) => u());
  }
}
