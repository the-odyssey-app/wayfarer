# Unit Testing Guide for Wayfarer Mobile App

## Overview

This document describes the unit testing setup and strategy for the Wayfarer mobile application.

## Testing Framework

We use **Jest** with **jest-expo** preset for React Native/Expo testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit
```

## Test Structure

Tests are located alongside the code they test:

```
src/
  utils/
    businessLogic.ts
    __tests__/
      businessLogic.test.ts
  services/
    NavigationService.ts
    __tests__/
      NavigationService.test.ts
```

## What We Test

### ✅ High Priority (Business Logic)

1. **XP and Rank Calculation**
   - Rank determination based on XP thresholds
   - XP reward calculations
   - Level-up detection
   - Quiz XP with perfect score bonuses

2. **Distance Calculations**
   - Haversine formula for coordinate distance
   - Arrival detection (proximity checks)
   - Location validation

3. **Quest Validation**
   - Step sequence validation
   - Location coordinate validation

4. **Quiz Functions**
   - Score percentage calculation
   - Pass/fail determination

### ⚠️ Medium Priority (Utilities)

- Date formatting
- Data validators
- Transform functions

### ❌ Low Priority (Skipped)

- Simple presentational components (covered by E2E tests)
- Thin API wrappers
- Frequently changing UI components

## Test Coverage Goals

- **Business Logic**: 90%+ coverage
- **Utility Functions**: 85%+ coverage
- **UI Components**: 0% (covered by E2E tests)

## Writing New Tests

### Example Test Structure

```typescript
import { calculateRank } from '../businessLogic';

describe('calculateRank', () => {
  it('should return rank 1 for 0-199 XP', () => {
    expect(calculateRank(0)).toBe(1);
    expect(calculateRank(199)).toBe(1);
  });

  it('should return rank 2 for 200-499 XP', () => {
    expect(calculateRank(200)).toBe(2);
    expect(calculateRank(499)).toBe(2);
  });
});
```

### Best Practices

1. **Test behavior, not implementation**
   - Focus on what the function does, not how it does it
   - Test edge cases and boundary conditions

2. **Use descriptive test names**
   - Test names should clearly describe what is being tested
   - Use "should" or "when" to describe expected behavior

3. **Test one thing per test**
   - Each test should verify a single behavior
   - Use multiple assertions only when testing related behaviors

4. **Test edge cases**
   - Boundary values (0, -1, max values)
   - Invalid inputs (null, undefined, NaN)
   - Empty inputs

5. **Keep tests independent**
   - Tests should not depend on each other
   - Use `beforeEach`/`afterEach` for setup/teardown if needed

## Business Logic Functions

### XP and Rank System

Located in `src/utils/businessLogic.ts`:

- `calculateRank(totalXp)` - Determines rank from XP
- `getRankName(rank)` - Gets rank name from rank number
- `calculateNewXp(currentXp, xpReward)` - Calculates new XP total
- `checkLevelUp(currentRank, newXp)` - Checks if user leveled up
- `calculateQuizXp(correctAnswers, totalQuestions, baseXp)` - Calculates quiz XP

### Distance Calculations

Located in `src/utils/businessLogic.ts` and `src/services/NavigationService.ts`:

- `calculateDistance(lat1, lon1, lat2, lon2)` - Haversine distance calculation
- `hasArrived(userLocation, destination, threshold)` - Proximity check

### Quest Validation

Located in `src/utils/businessLogic.ts`:

- `validateStepSequence(currentStep, stepNumber)` - Validates step order
- `validateLocation(latitude, longitude)` - Validates coordinates

### Quiz Functions

Located in `src/utils/businessLogic.ts`:

- `calculateQuizScore(correctAnswers, totalQuestions)` - Score percentage
- `isQuizPassed(scorePercent, minScore)` - Pass/fail determination

## Mocking

Common mocks are set up in `jest.setup.js`:

- `@react-native-async-storage/async-storage`
- `@react-native-community/netinfo`

For component tests, use `react-test-renderer`:

```typescript
import renderer from 'react-test-renderer';

it('renders correctly', () => {
  const tree = renderer.create(<MyComponent />).toJSON();
  expect(tree).toMatchSnapshot();
});
```

## Continuous Integration

Tests should run automatically on:
- Pull requests
- Before merging to main
- On deployment

## Troubleshooting

### Tests not running

1. Check that Jest is installed: `npm list jest`
2. Verify `jest.config.js` exists and is valid
3. Check for syntax errors in test files

### Coverage not generating

1. Run with coverage flag: `npm run test:coverage`
2. Check `jest.config.js` has `collectCoverageFrom` configured
3. Verify test files match the pattern in `testMatch`

### Mock errors

1. Check `jest.setup.js` for correct mock setup
2. Verify mock paths match actual module paths
3. Clear Jest cache: `npm test -- --clearCache`

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [jest-expo Documentation](https://github.com/expo/expo/tree/main/packages/jest-expo)

