/**
 * @file IAuthService.js
 * @description Abstract base class for authentication service.
 * Subclasses must implement all methods.
 */
export class IAuthService {
  /** @returns {Promise<import('firebase/auth').User>} */
  async initialize()    { throw new Error('IAuthService.initialize() not implemented'); }
  /** @returns {import('firebase/auth').User|null} */
  getCurrentUser()      { throw new Error('IAuthService.getCurrentUser() not implemented'); }
  /** @returns {string|undefined} */
  getUserId()           { throw new Error('IAuthService.getUserId() not implemented'); }
  /** @returns {Promise<void>} */
  async signOut()       { throw new Error('IAuthService.signOut() not implemented'); }
  /** @returns {Promise<import('firebase/auth').User>} */
  async waitForAuth()   { throw new Error('IAuthService.waitForAuth() not implemented'); }
}
