const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

// Bare RN CLI, not Expo (ADR-0001): the default config comes from
// @react-native/metro-config rather than expo/metro-config.
const nativeWindConfig = withNativeWind(
  mergeConfig(getDefaultConfig(__dirname), config),
  { input: './global.css' },
);

module.exports = {
  ...nativeWindConfig,
  // NativeWind points transformerPath at react-native-css's worker, which
  // routes every non-CSS file through @expo/metro-config. See
  // ./metro.transformer.js for why that breaks a bare RN build.
  transformerPath: require.resolve('./metro.transformer.js'),
};
