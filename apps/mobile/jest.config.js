// Get the jest-expo preset and override setupFiles
const jestExpoPreset = require('jest-expo/jest-preset');

module.exports = {
  ...jestExpoPreset,
  // Override setupFiles to exclude React Native's problematic setup file
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: [],
  // Preserve moduleNameMapper from preset and add our own
  moduleNameMapper: {
    ...jestExpoPreset.moduleNameMapper,
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  globals: {
    ...(jestExpoPreset.globals || {}),
    __DEV__: true,
  },
};

