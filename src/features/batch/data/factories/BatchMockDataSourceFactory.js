/**
 * @file BatchMockDataSourceFactory.js
 * @description Mock factory — creates in-memory stub data sources for dev/testing.
 */
import { BatchDataSourceFactory } from './BatchDataSourceFactory';

class BatchMockRemoteDataSource {
  async fetchUserBatches()   { return []; }
  async fetchBatchById()     { return null; }
  async createBatch()        { return 'mock-id'; }
  async deleteBatch()        { return; }
  subscribeToBatches(uid, cb){ cb([]); return () => {}; }
}

class BatchMockLocalDataSource {
  async getCachedBatches() { return null; }
  async cacheBatches()     { return; }
  async clearCache()       { return; }
}

export class BatchMockDataSourceFactory extends BatchDataSourceFactory {
  createRemoteDataSource() { return new BatchMockRemoteDataSource(); }
  createLocalDataSource()  { return new BatchMockLocalDataSource(); }
}
