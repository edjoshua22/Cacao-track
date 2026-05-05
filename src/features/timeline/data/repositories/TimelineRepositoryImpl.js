export class TimelineRepositoryImpl {
  constructor({ timelineRemoteDataSource }) { this.remote = timelineRemoteDataSource; }
  subscribeToCapturesForUser(userId, cb) { return this.remote.subscribeToCapturesForUser(userId, cb); }
}
