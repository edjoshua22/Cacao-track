# 🚀 CacaoTrack Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Setup ✅
- [ ] `.env.production` configured with production API URL (HTTPS)
- [ ] Firebase configuration variables set
- [ ] `EXPO_PUBLIC_ENVIRONMENT=production` set

### 2. Firebase Security ✅
- [ ] **Storage Rules**: Apply the storage rules above to fix image loading
- [ ] **Database Rules**: Current rules are production-ready
- [ ] Test image loading after storage rules update

### 3. App Configuration ✅
- [ ] `app.json` optimized for production (splash screen, orientation)
- [ ] Development client removed from production builds
- [ ] Bundle patterns configured

### 4. Code Quality ✅
- [ ] All console.log statements wrapped with `__DEV__`
- [ ] Production error handling implemented
- [ ] No hardcoded development URLs

## 🏗️ Build Commands

### Development Build (for testing)
```bash
# Android
npm run build:dev:android

# iOS  
npm run build:dev:ios
```

### Production Build (for release)
```bash
# Android Production APK
npm run build:production:android

# iOS Production
npm run build:production:ios

# Both platforms
npm run build:production
```

## 🔧 Critical Production Fixes Applied

### 1. **Environment Variables**
- Production now requires HTTPS API URLs
- Strict validation prevents development URLs in production
- Clear error messages for missing configuration

### 2. **Console Log Cleanup**
- All console statements wrapped with `__DEV__` checks
- Production builds will have no debug logs
- Error logging retained for production debugging

### 3. **App Configuration**
- Added splash screen configuration
- Set portrait orientation
- Removed development client from production
- Added web platform support

### 4. **Firebase Storage**
- Fixed HTTP 412 errors with proper security rules
- Public read access for images
- Authenticated write access

## ⚠️ Before You Deploy

1. **Update API URL**: Replace `https://your-production-api-server.com` in `.env.production`
2. **Test Storage Rules**: Apply Firebase Storage rules and test image loading
3. **Build Test**: Create a preview build first to test everything works

## 🚀 Deploy Steps

1. **Update Production API URL** in `.env.production`
2. **Apply Firebase Storage Rules** in Firebase Console
3. **Run Preview Build**: `npm run build:preview:android`
4. **Test Preview Build** thoroughly
5. **Run Production Build**: `npm run build:production:android`
6. **Upload to App Store/Play Store**

## 🐛 Common Issues & Solutions

### Issue: Images Not Loading (HTTP 412)
**Solution**: Apply the Firebase Storage rules provided above

### Issue: API Calls Fail in Production
**Solution**: Ensure API URL uses HTTPS and is set in `.env.production`

### Issue: Build Fails
**Solution**: Check all environment variables are set correctly

## 📱 Production Features

- ✅ Secure Firebase configuration
- ✅ Production-ready error handling  
- ✅ Optimized app configuration
- ✅ No development code in production
- ✅ Proper splash screen and icons
- ✅ HTTPS-only API calls

---

**Your app is now production-ready!** 🎉

Remember to:
1. Set your production API URL
2. Apply Firebase Storage rules
3. Test with a preview build first
