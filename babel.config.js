module.exports = {
  presets: [
    ['module:@react-native/babel-preset', { jsxImportSource: 'nativewind' }],
  ],
  // Reanimated's worklets plugin has to stay last.
  plugins: ['react-native-worklets/plugin'],
};
