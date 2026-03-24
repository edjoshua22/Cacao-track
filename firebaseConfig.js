import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Firebase configuration with environment variable support
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCCYGL3JyYkLD_5MJ3sgHVMGklR9G-A7aU",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "cacaotrack-6a1db.firebaseapp.com",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "https://cacaotrack-6a1db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "cacaotrack-6a1db",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "cacaotrack-6a1db.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "29624202284",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:29624202284:android:9f2dc3515832b603b74d89",
};

// Validate Firebase configuration in production
if (!__DEV__) {
  const requiredFields = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing Firebase configuration fields:', missingFields);
    console.error('Please set EXPO_PUBLIC_FIREBASE_* environment variables');
  }
}

// Initialize Firebase with error handling
let app;
let db;
let auth;

try {
  // Avoid duplicate initialization
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getDatabase(app);
  auth = getAuth(app);
  
  if (__DEV__) {
    console.log('✅ Firebase initialized successfully');
    console.log('🔥 Firebase project ID:', firebaseConfig.projectId);
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // In production, you might want to throw the error
  if (!__DEV__) {
    throw error;
  }
}

export { app, db, auth };