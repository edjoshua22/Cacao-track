// MonitoringRepositoryImpl.js
export class MonitoringRepositoryImpl {
  constructor({ monitoringRemoteDataSource }) { this.remote = monitoringRemoteDataSource; }
  subscribeToLiveSensors(callback) { return this.remote.subscribeToLiveSensors(callback); }
}
