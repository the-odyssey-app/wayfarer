// Mock for react-native/jest/setup.js to avoid TypeScript syntax issues
// This provides the same functionality as the original setup file

global.__DEV__ = true;

// Mock timers
jest.useFakeTimers();

// Mock clearTimeout and setTimeout
global.clearTimeout = jest.fn((id) => {
  return clearTimeout(id);
});

global.setTimeout = jest.fn((fn, delay) => {
  return setTimeout(fn, delay);
});

global.clearInterval = jest.fn((id) => {
  return clearInterval(id);
});

global.setInterval = jest.fn((fn, delay) => {
  return setInterval(fn, delay);
});

