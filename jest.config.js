module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  // Several component tests drain React's act() scheduler in a loop
  // (src/testUtils/flush.ts) to let chained repository/cache promises
  // settle; under full-suite parallel load that scheduling isn't purely
  // microtask-based, so the 5s default can be too tight.
  testTimeout: 20000,
  // pnpm nests real packages under node_modules/.pnpm/<pkg>/node_modules/<pkg>,
  // which defeats the preset's default pattern before it reaches the
  // react-native/@react-native segment. Allow `.pnpm` through so the rest of
  // the pattern can still match.
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm|(jest-)?react-native|@react-native(-community)?|@react-native-async-storage)/)',
  ],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest',
    // The NativeWind stylesheet is compiled by Metro, not Jest; under test the
    // className props are inert, so an empty stub is enough.
    '[.]css$': '<rootDir>/jest.styleMock.js',
  },
};
