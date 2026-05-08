const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
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

/**
 * Disable minification to prevent Awilix DI from breaking in production.
 *
 * Awilix resolves constructor dependencies by reading parameter names via
 * Function.prototype.toString(). The default minifier (terser/hermes) renames
 * all parameters (e.g. `batchRepository` → `a`), so Awilix can't match them
 * to registered tokens and throws on startup — causing the app to not open.
 *
 * Long-term fix: add static `inject` arrays to each Awilix-registered class.
 * Short-term fix: disable mangling here (bundle size increases slightly).
 */
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,    // preserve function/class names
    keep_classnames: true, // preserve class names
    // Critical: keep constructor parameter names intact for Awilix.
    // If this causes bundle-size concerns later, migrate to static `inject` arrays.
    mangle: false,
  },
};

module.exports = config;
