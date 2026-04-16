import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Firebase configuration - MUST use environment variables in production
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const requiredFields = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error('Missing Firebase configuration fields:', missingFields);
  console.error('Please set EXPO_PUBLIC_FIREBASE_* environment variables');
  console.error('See .env.example for required variables');
  
  if (!__DEV__) {
    throw new Error('Missing required Firebase configuration. Check environment variables.');
  }
}

// Initialize Firebase with error handling
let app;
let db;
let auth;

try {
  // Only initialize if we have valid config
  if (missingFields.length === 0) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getDatabase(app);
    auth = getAuth(app);
    
    if (__DEV__) {
      console.log('Firebase initialized successfully');
      console.log('Project ID:', firebaseConfig.projectId);
    }
  } else {
    console.warn('Firebase not initialized - missing configuration');
    if (__DEV__) {
      console.warn('App will run in offline mode');
    }
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  if (!__DEV__) {
    throw error;
  }
}

export { app, db, auth };
