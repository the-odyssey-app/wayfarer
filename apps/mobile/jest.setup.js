// Jest setup file for Wayfarer mobile app
// This file runs before each test file

// Set up React Native globals (normally done by react-native/jest/setup.js)
global.__DEV__ = true;

// Mock timers
jest.useFakeTimers();

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(),
}));

// Mock expo-constants
jest.mock('expo-constants', () => {
  const Constants = {
    expoConfig: {
      extra: {},
      mapboxAccessToken: undefined,
    },
  };
  return {
    __esModule: true,
    default: Constants,
  };
});

// Mock expo-location
jest.mock('expo-location', () => ({}));

// Suppress console warnings in tests (optional)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

