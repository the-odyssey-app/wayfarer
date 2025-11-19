# Maestro E2E Testing Setup Guide

This guide will help you set up and run Maestro E2E tests for the Wayfarer mobile app.

## Quick Start

### 1. Install Maestro

**macOS/Linux:**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Or via Homebrew (macOS):**
```bash
brew tap mobile-dev-inc/tap
brew install maestro
```

**Windows:**
Download from [Maestro releases](https://github.com/mobile-dev-inc/maestro/releases)

**Verify installation:**
```bash
maestro --version
```

### 2. Set Up Development Environment

**For iOS Testing:**
- Install Xcode from App Store
- Install Xcode Command Line Tools: `xcode-select --install`
- (Optional) Install `applesimutils` for better simulator management:
  ```bash
  brew tap wix/brew
  brew install applesimutils
  ```

**For Android Testing:**
- Install Android Studio
- Install Android SDK (API 33+ recommended)
- Create an Android Virtual Device (AVD) via Android Studio
- Add Android SDK to PATH:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/tools
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

### 3. Build and Install the App

**Using Expo Dev Client (Recommended):**

1. Build development client:
   ```bash
   cd apps/mobile
   eas build --profile development --platform ios
   eas build --profile development --platform android
   ```

2. Install on device/simulator:
   - iOS: Download from EAS Build and install via Xcode
   - Android: Download APK and install via `adb install`

**Or use Expo Go (Limited):**
```bash
cd apps/mobile
npm start
# Then press 'i' for iOS or 'a' for Android
```

### 4. Run Your First Test

```bash
cd apps/mobile

# List available devices
npm run test:e2e:device:list

# Run all tests
npm run test:e2e

# Run specific test suite
npm run test:e2e:auth
```

## Configuration

### App Identifier

The app identifier is configured in:
- `e2e/maestro.config.yaml` - `appId: com.wayfarer.mobile`
- `app.json` - `ios.bundleIdentifier` and `android.package`

Ensure these match!

### Test Environment

Update `e2e/maestro.config.yaml` to configure:
- Test user credentials
- Backend server settings
- Timeout values
- Test tags

## Running Tests

### Basic Commands

```bash
# Run all test flows
maestro test e2e/flows/

# Run specific flow
maestro test e2e/flows/01-authentication.yaml

# Run on specific device
maestro test e2e/flows/ --device "iPhone 15 Pro"

# Run with verbose output
maestro test e2e/flows/ --debug

# Generate HTML report
maestro test e2e/flows/ --format html
```

### NPM Scripts

```bash
# Run all E2E tests
npm run test:e2e

# Run authentication tests
npm run test:e2e:auth

# Run quest-related tests
npm run test:e2e:quests

# Run party/group tests
npm run test:e2e:party

# Run progression tests
npm run test:e2e:progression

# Run photo upload tests
npm run test:e2e:photo

# List available devices
npm run test:e2e:device:list
```

## Troubleshooting

### Maestro Not Found

If `maestro` command is not found:
1. Add Maestro to PATH:
   ```bash
   export PATH=$PATH:$HOME/.maestro/bin
   ```
2. Add to `~/.zshrc` or `~/.bashrc` for persistence

### App Not Found

If tests can't find the app:
1. Verify app is installed: Check device/simulator
2. Verify appId matches: Check `maestro.config.yaml` and `app.json`
3. Rebuild app: `eas build --profile development`

### Tests Fail Immediately

1. **Check device/simulator is running:**
   ```bash
   # iOS
   xcrun simctl list devices
   
   # Android
   adb devices
   ```

2. **Verify app is installed:**
   ```bash
   # iOS
   xcrun simctl listapps booted | grep wayfarer
   
   # Android
   adb shell pm list packages | grep wayfarer
   ```

3. **Check Maestro logs:**
   ```bash
   maestro test e2e/flows/ --debug
   ```

### Elements Not Found

1. **Use regex patterns** - Maestro uses regex for text matching
2. **Increase timeouts** - Some elements load slowly
3. **Check actual UI text** - Verify text matches what's in the app
4. **Use optional** - For elements that may not always appear

### Permission Dialogs

Handle permission dialogs in tests:
```yaml
- tapOn: 
    text: ".*[Aa]llow.*"
    optional: true
    timeout: 5000
```

## CI/CD Integration

### GitHub Actions

See `e2e/README.md` for GitHub Actions example.

### EAS Build

1. Build test binary:
   ```bash
   eas build --profile test --platform ios
   eas build --profile test --platform android
   ```

2. Download and install test binary

3. Run tests:
   ```bash
   maestro test e2e/flows/
   ```

## Next Steps

1. **Customize test data** - Update `e2e/fixtures/test-data.json`
2. **Add more test flows** - Create new YAML files in `e2e/flows/`
3. **Set up CI/CD** - Integrate tests into your pipeline
4. **Review test results** - Use Maestro's HTML reports

## Resources

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Maestro GitHub](https://github.com/mobile-dev-inc/maestro)
- [Expo E2E Testing](https://docs.expo.dev/build-reference/e2e-tests/)
- [Maestro Best Practices](https://maestro.mobile.dev/best-practices)

## Getting Help

- Check Maestro logs: `maestro test --debug`
- Review test files for syntax errors
- Verify app state matches test expectations
- Check Maestro GitHub issues: https://github.com/mobile-dev-inc/maestro/issues

