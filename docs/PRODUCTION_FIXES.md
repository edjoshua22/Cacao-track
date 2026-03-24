# Production Deployment Guide

## Fixed Issues

### 1. ✅ Android Cleartext Traffic
- Added `usesCleartextTraffic: true` to app.json
- Created network security config to allow HTTP for development IPs
- Updated AndroidManifest.xml with proper permissions

### 2. ✅ Environment Variables
- Fixed config.js to handle missing environment variables gracefully
- Created .env.production template with production values
- Added proper error handling for production builds

### 3. ✅ Firebase Configuration
- Enhanced Firebase initialization with error handling
- Added validation for required Firebase fields in production
- Improved logging for debugging

### 4. ✅ Network Error Handling
- Added comprehensive error logging in inferImage.js
- Created debugUtils.js for production error tracking
- Implemented API call logging for debugging

### 5. ✅ Android Permissions
- Added ACCESS_NETWORK_STATE permission
- Added HTTP scheme support in queries
- Enhanced network security configuration

## Before Building for Production

### 1. Set Environment Variables
Create a `.env` file in your project root:
```bash
# Copy the production template
cp .env.production .env

# Edit .env with your actual production values
EXPO_PUBLIC_API_BASE_URL=https://your-production-api.com
```

### 2. Update API URL
Replace `https://your-production-api.com` with your actual production API endpoint.

### 3. Build Commands
```bash
# Development build (for testing)
eas build --profile development --platform android

# Production build
eas build --profile production --platform android
```

## Testing Checklist

- [ ] Environment variables are set correctly
- [ ] API endpoint is accessible from devices (not localhost)
- [ ] Network requests work in production build
- [ ] Firebase initializes properly
- [ ] Error logging works in production
- [ ] App doesn't crash on startup

## Common Issues & Solutions

### Issue: "Network request failed"
**Solution**: Check that your API URL is not using localhost/127.0.0.1 in production

### Issue: "EXPO_PUBLIC_API_BASE_URL not set"
**Solution**: Ensure .env file exists and is properly configured

### Issue: Firebase initialization fails
**Solution**: Check Firebase configuration values in environment variables

## Debugging in Production

The app now includes comprehensive logging:
- Environment info is logged at startup
- All API calls are logged with success/failure status
- Errors are logged with full context
- Global error handler catches unhandled exceptions

Check the device logs using:
```bash
# Android
adb logcat

# Filter for app logs
adb logcat | grep "CacaoTrack"
```
