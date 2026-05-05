// API Configuration
// Uses environment variable for production, with secure fallbacks
const getApiBaseUrl = () => {
  // Production environment - must have HTTPS URL
  if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'production') {
    const prodUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (!prodUrl) {
      throw new Error('Production API URL is required. Set EXPO_PUBLIC_API_BASE_URL in .env.production');
    }
    if (!prodUrl.startsWith('https://')) {
      throw new Error('Production API must use HTTPS. Current URL: ' + prodUrl);
    }
    return prodUrl;
  }
  
  // Check for explicit development environment variable
  if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'development') {
    const devUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (devUrl) {
      return devUrl;
    }
  }
  
  // Development fallback with warning
  if (__DEV__) {
    console.warn('⚠️ EXPO_PUBLIC_API_BASE_URL not set. Using development fallback.');
    return 'http://192.168.1.40:8000';
  }
  
  // If not dev and not production, throw error
  throw new Error('API URL not configured for current environment');
};

// Export the validated URL
export const API_BASE_URL = getApiBaseUrl();
export { getApiBaseUrl };
