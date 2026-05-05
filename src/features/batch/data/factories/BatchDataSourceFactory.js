/**
 * @file BatchDataSourceFactory.js
 * @description Abstract factory base for batch data sources.
 */
export class BatchDataSourceFactory {
  /** @returns {import('../datasources/IBatchRemoteDataSource').IBatchRemoteDataSource} */
  createRemoteDataSource() { throw new Error('BatchDataSourceFactory.createRemoteDataSource() not implemented'); }
  /** @returns {import('../datasources/IBatchLocalDataSource').IBatchLocalDataSource} */
  createLocalDataSource()  { throw new Error('BatchDataSourceFactory.createLocalDataSource() not implemented'); }
}
