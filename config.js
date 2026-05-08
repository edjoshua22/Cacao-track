// API Configuration
// Production stays strict; development allows safe fallbacks for Expo Go.
const getApiBaseUrl = () => {
  const environment = process.env.EXPO_PUBLIC_ENVIRONMENT;

  // Production: explicit + HTTPS only
  if (environment === 'production') {
    const url = process.env.EXPO_PUBLIC_API_BASE_URL;

    if (!url) {
      throw new Error(
        'Production API URL is required. Set EXPO_PUBLIC_API_BASE_URL (HTTPS) in EAS env vars or .env.production.'
      );
    }

    if (!url.startsWith('https://')) {
      throw new Error('Production API must use HTTPS. Current URL: ' + url);
    }

    return url;
  }

  // Development/preview: allow explicit override (EXPO_PUBLIC_* preferred).
  const explicitUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    // Back-compat with existing .env usage in this repo:
    process.env.API_BASE_URL_DEV ||
    process.env.API_BASE_URL_PROD;

  if (explicitUrl) return explicitUrl;

  // Dev-only fallback so Expo Go keeps working on LAN.
  if (__DEV__) return 'http://192.168.1.40:8000';

  throw new Error('API URL not configured for current environment');
};

// Export the validated URL
export const API_BASE_URL = getApiBaseUrl();
export { getApiBaseUrl };
