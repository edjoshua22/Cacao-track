/**
 * @file debugUtils.js
 * @description Production debugging utilities. Moved from utils/debugUtils.js.
 * Logs are suppressed differently in dev vs production to avoid leaking sensitive data.
 */
import { Platform, Alert } from 'react-native';

/**
 * Log a production error with structured metadata.
 * @param {Error} error - The error object.
 * @param {string} [context=''] - Where in the app the error occurred.
 * @returns {void}
 */
export const logProductionError = (error, context = '') => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    platform: Platform.OS,
    context,
    message: error.message,
    stack: error.stack,
    name: error.name,
  };

  if (__DEV__) {
    console.error('🚨 Production Error Debug:', errorInfo);
    return;
  }

  // In production, log with clear indicator
  console.error('🚨 PRODUCTION ERROR:', JSON.stringify(errorInfo, null, 2));

  // TODO: Add crash reporting service integration here
  // Examples: Sentry, Firebase Crashlytics, etc.
};

/**
 * Log an API call for debugging purposes.
 * @param {string} url - The URL that was called.
 * @param {string} method - HTTP method (GET, POST, etc.).
 * @param {boolean} success - Whether the call succeeded.
 * @param {Error|null} [error=null] - Error, if any.
 * @returns {void}
 */
export const logApiCall = (url, method, success, error = null) => {
  const logData = {
    timestamp: new Date().toISOString(),
    url,
    method,
    success,
    error: error?.message,
  };

  if (__DEV__) {
    console.log('🌐 API Call:', logData);
  } else {
    console.log('🌐 API:', JSON.stringify(logData));
  }
};

/**
 * Log environment configuration at startup.
 * @returns {void}
 */
export const logEnvironmentInfo = () => {
  const envInfo = {
    EXPO_PUBLIC_API_BASE_URL:          process.env.EXPO_PUBLIC_API_BASE_URL ? 'SET' : 'NOT_SET',
    EXPO_PUBLIC_FIREBASE_PROJECT_ID:   process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'DEFAULT',
    isDev:    __DEV__,
    platform: Platform.OS,
  };

  if (__DEV__) {
    console.log('🔧 Environment Info:', envInfo);
  } else {
    console.log('🔧 ENV:', JSON.stringify(envInfo));
  }
};

/**
 * Log a critical error and optionally alert the user in production.
 * @param {Error} error - The critical error.
 * @param {string} context - Where the error originated.
 * @returns {void}
 */
export const logCriticalError = (error, context) => {
  const criticalInfo = {
    timestamp: new Date().toISOString(),
    context,
    error: error.message,
    stack: error.stack,
  };

  console.error('🔥 CRITICAL ERROR:', JSON.stringify(criticalInfo, null, 2));

  if (!__DEV__) {
    Alert.alert('Critical Error', 'An unexpected error occurred. Please restart the app.');
  }
};
