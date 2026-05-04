/**
 * @file TimelineRemoteDataSourceImpl.js
 */
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../../../../../firebaseConfig.secure';

export class TimelineRemoteDataSourceImpl {
  constructor() { this._db = getDatabase(app); }

  /**
   * Subscribe to captures for a specific user (falls back to global).
   * @param {string} userId
   * @param {Function} callback - ({ type: 'user'|'global', data: object }) => void
   * @returns {Function} unsubscribe
   */
  subscribeToCapturesForUser(userId, callback) {
    const userRef   = ref(this._db, `captures/${userId}`);
    const globalRef = ref(this._db, 'captures');
    let globalUnsub = null;

    const userUnsub = onValue(userRef, (snap) => {
      if (snap.exists()) {
        callback({ type: 'user', data: snap.val() });
      } else {
        // Fall back to global captures
        if (globalUnsub) globalUnsub();
        globalUnsub = onValue(globalRef, (gSnap) => {
          if (gSnap.exists()) callback({ type: 'global', data: gSnap.val() });
        });
      }
    }, (err) => {
      console.error('TimelineRemoteDataSource error:', err);
    });

    return () => {
      userUnsub();
      if (globalUnsub) globalUnsub();
    };
  }
}
