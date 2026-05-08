/**
 * @file AuthServiceImpl.js
 * @description Firebase anonymous-auth implementation of IAuthService.
 * Migrated from utils/authUtils.js — all original logic preserved.
 */
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig.secure';
import { IAuthService } from './IAuthService';

export class AuthServiceImpl extends IAuthService {
  constructor() {
    super();
    this._currentUser  = null;
    this._authPromise  = null;
  }

  /**
   * Initialize authentication — resolves when a user is available.
   * Signs in anonymously if no existing session is found.
   * @returns {Promise<import('firebase/auth').User>}
   */
  async initialize() {
    if (this._authPromise) return this._authPromise;

    this._authPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          this._currentUser = user;
          unsubscribe();
          if (user) {

            resolve(user);
          } else {
            signInAnonymously(auth)
              .then((cred) => {
                this._currentUser = cred.user;
                if (__DEV__) console.log('✅ Anonymous user signed in:', this._currentUser.uid);
                resolve(this._currentUser);
              })
              .catch((error) => {
                console.error('❌ Anonymous sign-in failed:', error);
                reject(error);
              });
          }
        },
        (error) => {
          console.error('❌ Auth state change error:', error);
          reject(error);
        }
      );
    });

    return this._authPromise;
  }

  /**
   * Get the currently authenticated user.
   * @returns {import('firebase/auth').User|null}
   */
  getCurrentUser() { return this._currentUser; }

  /**
   * Get the UID of the current user.
   * @returns {string|undefined}
   */
  getUserId() { return this._currentUser?.uid; }

  /**
   * Sign out and reset cached state.
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      await signOut(auth);
      this._currentUser = null;
      this._authPromise = null;
      if (__DEV__) console.log('✅ User signed out');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Wait for auth to be ready; calls initialize() if no user is cached.
   * @returns {Promise<import('firebase/auth').User>}
   */
  async waitForAuth() {
    if (this._currentUser) return Promise.resolve(this._currentUser);
    return this.initialize();
  }
}

// Re-export the raw auth instance so callers that need it can import from here
export { auth };
