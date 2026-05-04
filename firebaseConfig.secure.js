/**
 * firebaseConfig.secure.js
 * Direct Firebase initialization for CacaoTrack dev/production builds.
 *
 * For production: swap these values via EAS Secrets or a CI build step
 * that replaces this file before bundling.
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase }                    from "firebase/database";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage            from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey:            "AIzaSyCCYGL3JyYkLD_5MJ3sgHVMGklR9G-A7aU",
  authDomain:        "cacaotrack-6a1db.firebaseapp.com",
  databaseURL:       "https://cacaotrack-6a1db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "cacaotrack-6a1db",
  storageBucket:     "cacaotrack-6a1db.firebasestorage.app",
  messagingSenderId: "29624202284",
  appId:             "1:29624202284:web:9f2dc3515832b603b74d89",
};

// ── Initialize ────────────────────────────────────────────────────────────────
let app;
let db;
let auth;

try {
  const isFirstInit = !getApps().length;

  // Guard against double-init on hot-reload
  app = isFirstInit ? initializeApp(firebaseConfig) : getApp();
  db  = getDatabase(app);

  // initializeAuth must only be called once per app instance.
  // On hot-reload, getApps() returns the existing app so we use getAuth() instead.
  auth = isFirstInit
    ? initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      })
    : getAuth(app);

  if (__DEV__) console.log("[Firebase] ✅ Ready — project:", firebaseConfig.projectId);
} catch (error) {
  console.error("[Firebase] ❌ Init failed:", error.message);
  if (!__DEV__) throw error;
}

export { app, db, auth };
