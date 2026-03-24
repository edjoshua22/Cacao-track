# Production Deployment Guide

## Environment Setup

1. **Create production environment file**:
   ```bash
   cp .env.example .env.production
   ```

2. **Set required environment variables**:
   - `EXPO_PUBLIC_API_BASE_URL`: Your production API endpoint
   - Firebase credentials (optional, overrides defaults)

## Build Commands

### Preview Build (Testing)
```bash
eas build:preview --platform all
```

### Production Build (App Store)
```bash
eas build:production --platform all
```

## Security Notes

- ✅ API URL validation prevents hardcoded fallbacks in production
- ✅ All console logs wrapped in `__DEV__` checks
- ✅ Environment variables properly configured
- ✅ Bundle size optimized (removed unused dependencies)

## Pre-Flight Checklist

- [ ] Set `EXPO_PUBLIC_API_BASE_URL` in build environment
- [ ] Test API connectivity with production endpoint
- [ ] Verify Firebase security rules
- [ ] Run preview build for final testing

## Bundle Optimization

- Removed unused `d3-shape` dependency
- All dependencies are actively used
- Patch-package applied for expo-sharing fix
