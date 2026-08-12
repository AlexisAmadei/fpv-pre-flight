module.exports = {
  preset: '@react-native/jest-preset',
  // pnpm nests real packages under node_modules/.pnpm/<pkg>/node_modules/<pkg>,
  // which defeats the preset's default pattern before it reaches the
  // react-native/@react-native segment. Allow `.pnpm` through so the rest of
  // the pattern can still match.
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm|(jest-)?react-native|@react-native(-community)?)/)',
  ],
};
