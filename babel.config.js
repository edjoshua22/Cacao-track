/**
 * @file babel.config.js
 * Reverted to safe baseline — module-resolver is kept but only enabled
 * once the src/ architecture is fully wired. For now aliases are defined
 * but NOT breaking anything since we only use relative imports in screens/.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
