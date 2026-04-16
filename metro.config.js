const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure all asset types are properly handled
config.resolver.assetExts.push(
  // Image formats
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  // Add any other asset types you might need
);

module.exports = config;
