/**
 * Babel configuration for the CAP mobile app (Expo).
 */
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
  }
}
