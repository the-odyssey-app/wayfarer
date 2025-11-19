# Wayfarer Mobile E2E Tests with Maestro

This directory contains end-to-end (E2E) tests for the Wayfarer mobile app using [Maestro](https://maestro.mobile.dev/), a mobile UI testing framework that works seamlessly with Expo.

## Prerequisites

1. **Install Maestro CLI**:
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
   
   Or via Homebrew (macOS):
   ```bash
   brew tap mobile-dev-inc/tap
   brew install maestro
   ```

2. **Verify Installation**:
   ```bash
   maestro --version
   ```

3. **Install iOS Simulator** (for iOS testing):
   - Xcode with iOS Simulator
   - Or use `applesimutils` for better simulator management

4. **Install Android Emulator** (for Android testing):
   - Android Studio with Android SDK
   - Create an Android Virtual Device (AVD)

## Project Structure

```
e2e/
├── maestro.config.yaml      # Maestro configuration
├── flows/                    # Test flow files
│   ├── 01-authentication.yaml
│   ├── 02-quest-discovery.yaml
│   ├── 03-quest-completion.yaml
│   ├── 04-party-creation.yaml
│   ├── 05-progression.yaml
│   └── 06-photo-upload.yaml
├── fixtures/                 # Test data fixtures (future)
└── README.md                 # This file
```

## Running Tests

### Prerequisites

1. **Start the Expo app**:
   ```bash
   cd apps/mobile
   npm start
   ```

2. **Launch on iOS Simulator**:
   ```bash
   npm run ios
   ```

3. **Launch on Android Emulator**:
   ```bash
   npm run android
   ```

### Run All Tests

```bash
# From apps/mobile directory
maestro test e2e/flows/
```

### Run Specific Test Flow

```bash
# Run authentication tests only
maestro test e2e/flows/01-authentication.yaml

# Run quest discovery tests
maestro test e2e/flows/02-quest-discovery.yaml
```

### Run Tests on Specific Device

```bash
# iOS Simulator
maestro test e2e/flows/ --device "iPhone 15 Pro"

# Android Emulator
maestro test e2e/flows/ --device "Pixel_7_API_33"
```

### List Available Devices

```bash
# iOS Simulators
maestro device list ios

# Android Emulators
maestro device list android
```

## Test Flows

### 01-authentication.yaml
Tests user registration, login, session persistence, and logout.

**Scenarios:**
- User registration with email/password
- User login
- Session persistence after app restart
- User logout

### 02-quest-discovery.yaml
Tests quest discovery on map and list views.

**Scenarios:**
- Map view with quest markers
- Quest list view
- Quest detail screen
- Quest filtering (if available)

### 03-quest-completion.yaml
Tests complete quest flow from start to finish.

**Scenarios:**
- Start quest
- Complete quest steps
- Quest completion screen
- Submit rating

### 04-party-creation.yaml
Tests party/group features.

**Scenarios:**
- Create party
- Join party (requires party code)
- View party members
- Leave party

### 05-progression.yaml
Tests progression system features.

**Scenarios:**
- View user profile and XP
- View leaderboard
- View achievements
- View inventory

### 06-photo-upload.yaml
Tests photo upload functionality.

**Scenarios:**
- Camera permission request
- Photo capture
- Photo library selection
- Photo upload confirmation

## Configuration

### Maestro Config (`maestro.config.yaml`)

- **appId**: Bundle identifier (`com.wayfarer.mobile`)
- **env**: Environment variables for test data
- **timeouts**: Default timeout settings
- **tags**: Test organization tags

### Test Environment

Tests use the following environment variables (set in `maestro.config.yaml`):
- `NAKAMA_HOST`: Backend server host
- `NAKAMA_PORT`: Backend server port
- `NAKAMA_USE_SSL`: SSL configuration

## Writing New Tests

### Basic Test Structure

```yaml
appId: com.wayfarer.mobile
tags:
  - your-tag

---
# Test scenario name
- launchApp
- assertVisible: 
    text: ".*[Ee]xpected.*[Tt]ext.*"
- tapOn: 
    text: ".*[Bb]utton.*"
- assertVisible: 
    text: ".*[Rr]esult.*"
```

### Common Maestro Commands

- `launchApp`: Launch the app
- `assertVisible`: Assert element is visible
- `tapOn`: Tap on element (by text, point, or index)
- `inputText`: Input text into field
- `scroll`: Scroll the screen
- `swipe`: Swipe gesture
- `waitForAnimationToEnd`: Wait for animations

### Best Practices

1. **Use regex patterns** for flexible text matching:
   ```yaml
   assertVisible: 
       text: ".*[Qq]uest.*"
   ```

2. **Add timeouts** for slow-loading elements:
   ```yaml
   assertVisible: 
       text: ".*[Qq]uest.*"
       timeout: 15000
   ```

3. **Use optional** for elements that may not appear:
   ```yaml
   tapOn: 
       text: ".*[Oo]ptional.*"
       optional: true
   ```

4. **Organize tests** by feature/flow
5. **Use tags** for test categorization
6. **Keep tests independent** - each test should be runnable standalone

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Maestro
        run: curl -Ls "https://get.maestro.mobile.dev" | bash
      - name: Run E2E Tests
        run: |
          cd apps/mobile
          maestro test e2e/flows/
```

### EAS Build Integration

Maestro tests can be integrated with EAS Build for automated testing:

1. Configure test build profile in `eas.json`
2. Build test binary: `eas build --profile test`
3. Run tests against test build

## Troubleshooting

### Tests Fail to Find Elements

- **Check text patterns**: Use regex patterns that match actual UI text
- **Increase timeouts**: Some elements may load slowly
- **Verify app state**: Ensure app is in expected state before assertions

### App Not Launching

- **Verify app is installed**: Ensure app is built and installed on device/simulator
- **Check appId**: Verify `appId` in test files matches `bundleIdentifier` in `app.json`
- **Check device availability**: Ensure simulator/emulator is running

### Permission Dialogs

- **Handle permissions**: Use `optional: true` for permission dialogs
- **Tap "Allow"**: Add steps to accept permissions when they appear

### Flaky Tests

- **Add waits**: Use `waitForAnimationToEnd` before assertions
- **Increase timeouts**: Give elements more time to appear
- **Verify test data**: Ensure test data is consistent

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Maestro GitHub](https://github.com/mobile-dev-inc/maestro)
- [Expo E2E Testing Guide](https://docs.expo.dev/build-reference/e2e-tests/)
- [Maestro Best Practices](https://maestro.mobile.dev/best-practices)

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Add appropriate tags
4. Document any special setup requirements
5. Update this README if adding new test categories

