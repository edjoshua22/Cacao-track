import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

let currentUser = null;
let authPromise = null;

// Initialize authentication and get current user
export const initializeAuth = () => {
  if (authPromise) {
    return authPromise;
  }

  authPromise = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        currentUser = user;
        unsubscribe();
        
        if (user) {
          console.log('✅ User authenticated:', user.uid);
          resolve(user);
        } else {
          // Sign in anonymously if no user is authenticated
          signInAnonymously(auth)
            .then((userCredential) => {
              currentUser = userCredential.user;
              console.log('✅ Anonymous user signed in:', currentUser.uid);
              resolve(currentUser);
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

  return authPromise;
};

// Get current authenticated user
export const getCurrentUser = () => {
  return currentUser;
};

// Get current user ID (UID)
export const getUserId = () => {
  return currentUser?.uid;
};

// Sign out current user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    currentUser = null;
    authPromise = null;
    console.log('✅ User signed out');
  } catch (error) {
    console.error('❌ Sign out failed:', error);
    throw error;
  }
};

// Wait for authentication to be ready
export const waitForAuth = () => {
  if (currentUser) {
    return Promise.resolve(currentUser);
  }
  return initializeAuth();
};

export { auth };
