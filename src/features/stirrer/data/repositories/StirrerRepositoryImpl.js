/**
 * @file StirrerRepositoryImpl.js
 * @description Concrete implementation of IStirrerRepository.
 * Bridges domain use cases to the data layer (remote + local data sources).
 */
import { IStirrerRepository } from '../../domain/repositories/IStirrerRepository';
import { Failure }            from '../../../../core/error/Failure';
import { DEFAULT_ESP_IP }     from '../datasources/StirrerLocalDataSource';

export class StirrerRepositoryImpl extends IStirrerRepository {
  /**
   * @param {{
   *   stirrerRemoteDataSource: import('../datasources/StirrerRemoteDataSource').StirrerRemoteDataSource,
   *   stirrerLocalDataSource:  import('../datasources/StirrerLocalDataSource').StirrerLocalDataSource,
   * }} deps
   */
  constructor({ stirrerRemoteDataSource, stirrerLocalDataSource }) {
    super();
    this._remote = stirrerRemoteDataSource;
    this._local  = stirrerLocalDataSource;
  }

  async startMotor() {
    const model = await this._remote.start();
    if (!model.ok) {
      return { success: false, error: new Failure(model.status || 'Failed to start motor') };
    }
    return { success: true };
  }

  async stopMotor() {
    const model = await this._remote.stop();
    if (!model.ok) {
      return { success: false, error: new Failure(model.status || 'Failed to stop motor') };
    }
    return { success: true };
  }

  async getEspIp() {
    const ip = await this._local.getEspIp();
    return ip ?? DEFAULT_ESP_IP;
  }

  async saveEspIp(ip) {
    await this._local.saveEspIp(ip);
    this._remote.setIp(ip); // sync remote data source immediately
  }
}
