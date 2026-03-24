// Production debugging utility
import { Platform, Alert } from 'react-native';

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
  
  // In development, log to console
  if (__DEV__) {
    console.error('🚨 Production Error Debug:', errorInfo);
    return;
  }
  
  // In production, log with clear indicator
  console.error('🚨 PRODUCTION ERROR:', JSON.stringify(errorInfo, null, 2));
  
  // TODO: Add crash reporting service integration here
  // Examples: Sentry, Firebase Crashlytics, etc.
};

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

export const logEnvironmentInfo = () => {
  const envInfo = {
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ? 'SET' : 'NOT_SET',
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'DEFAULT',
    isDev: __DEV__,
    platform: Platform.OS,
  };
  
  if (__DEV__) {
    console.log('🔧 Environment Info:', envInfo);
  } else {
    console.log('🔧 ENV:', JSON.stringify(envInfo));
  }
};

export const logCriticalError = (error, context) => {
  // For errors that should be visible in production
  const criticalInfo = {
    timestamp: new Date().toISOString(),
    context,
    error: error.message,
    stack: error.stack,
  };
  
  console.error('🔥 CRITICAL ERROR:', JSON.stringify(criticalInfo, null, 2));
  
  // In production, you might want to show this to the user
  if (!__DEV__) {
    // Could show an error modal or send to crash service
    Alert.alert('Critical Error', 'An unexpected error occurred. Please restart the app.');
  }
};
