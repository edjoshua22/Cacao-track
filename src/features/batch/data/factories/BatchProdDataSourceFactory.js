/**
 * @file BatchProdDataSourceFactory.js
 * @description Production factory — creates live Firebase + AsyncStorage data sources.
 */
import { BatchDataSourceFactory }       from './BatchDataSourceFactory';
import { BatchRemoteDataSourceImpl }    from '../datasources/BatchRemoteDataSourceImpl';
import { BatchLocalDataSourceImpl }     from '../datasources/BatchLocalDataSourceImpl';

export class BatchProdDataSourceFactory extends BatchDataSourceFactory {
  /** @param {{ storageService }} deps */
  constructor({ storageService }) {
    super();
    this._storageService = storageService;
  }
  /** @returns {BatchRemoteDataSourceImpl} */
  createRemoteDataSource() { return new BatchRemoteDataSourceImpl(); }
  /** @returns {BatchLocalDataSourceImpl} */
  createLocalDataSource()  { return new BatchLocalDataSourceImpl({ storageService: this._storageService }); }
}
