/**
 * Metro transformer for a bare React Native CLI project using NativeWind v5.
 *
 * `react-native-css` (NativeWind's engine) ships a transformer that delegates
 * every non-CSS file to `@expo/metro-config`'s worker. That worker emits full
 * source maps for Metro's own polyfills, which bare RN's serializer rejects
 * with "Unexpected module with full source map found". ADR-0001 keeps this
 * project on the bare CLI rather than Expo, so instead of adopting Expo's
 * whole Metro pipeline we compile `.css` through react-native-css and hand
 * everything else to React Native's standard worker.
 */

// react-native-css does not expose its transformer through its `exports` map,
// so resolve it relative to the package entry rather than by subpath.
const path = require('node:path');
const upstream = require(path.join(
  path.dirname(require.resolve('react-native-css')),
  'metro',
  'metro-transformer.js',
));
const rnWorker = require('metro-transform-worker');

const isCss = (filePath, options) =>
  options.type !== 'asset' && /\.(s?css|sass)$/.test(filePath);

async function transform(config, projectRoot, filePath, data, options) {
  if (!isCss(filePath, options)) {
    return rnWorker.transform(config, projectRoot, filePath, data, options);
  }

  const result = await upstream.transform(
    config,
    projectRoot,
    filePath,
    data,
    options,
  );

  // The compiled stylesheet comes back carrying a full source map, which the
  // bare RN serializer refuses ("Unexpected module with full source map").
  // The map is meaningless here anyway — the module is generated, not authored
  // — so drop it and let Metro treat this like any other generated module.
  return {
    ...result,
    output: result.output.map(out => ({
      ...out,
      data: { ...out.data, functionMap: null, map: [] },
    })),
  };
}

module.exports = {
  ...rnWorker,
  transform,
  // Metro asks the transformer to contribute to its cache key; changing this
  // file should invalidate previously cached transforms.
  getCacheKey: rnWorker.getCacheKey,
};
