# Mobile App Deployment Guide

This guide covers deploying the Wayfarer mobile app to app stores using Expo Application Services (EAS).

## 📋 Prerequisites

1. **Expo Account**
   - Sign up at [expo.dev](https://expo.dev)
   - Install EAS CLI: `npm install -g eas-cli`

2. **App Store Accounts**
   - Google Play Developer account ($25 one-time fee)
   - Apple Developer account ($99/year)

3. **Project Setup**
   - EAS project ID already configured in `apps/mobile/app.json`
   - Project ID: `a0fe966c-8c3f-4026-afc5-021e626285a4`

## 🚀 Initial Setup

### 1. Login to EAS
```bash
cd apps/mobile
eas login
```

### 2. Link Project (if needed)
```bash
eas project:info
```

### 3. Configure Build Profiles
The build profiles are already configured in `apps/mobile/eas.json`:

- **development**: Development builds with dev client
- **preview**: Internal distribution (APK/IPA)
- **production**: App store builds (AAB for Android, IPA for iOS)

## 📱 Building the App

### Android Build

#### Development Build
```bash
eas build --platform android --profile development
```
- Creates APK with development client
- For testing with Expo Go or custom dev client

#### Preview Build (Internal Testing)
```bash
eas build --platform android --profile preview
```
- Creates APK for internal distribution
- Can be shared directly or via Google Play Internal Testing

#### Production Build (App Store)
```bash
eas build --platform android --profile production
```
- Creates Android App Bundle (AAB)
- Required for Google Play Store submission

### iOS Build

#### Development Build
```bash
eas build --platform ios --profile development
```
- Creates development build
- Requires Apple Developer account

#### Preview Build (TestFlight)
```bash
eas build --platform ios --profile preview
```
- Creates IPA for TestFlight
- Requires Apple Developer account

#### Production Build (App Store)
```bash
eas build --platform ios --profile production
```
- Creates production IPA
- Required for App Store submission

### Build Both Platforms
```bash
eas build --platform all --profile production
```

## 🔐 Environment Variables

Set environment variables for builds:

```bash
# Set for all builds
eas secret:create --scope project --name EXPO_PUBLIC_NAKAMA_HOST --value your-host

# Set for specific environment
eas secret:create --scope project --name EXPO_PUBLIC_NAKAMA_HOST --value your-host --type production
```

Or use `.env` files (not recommended for secrets):
```bash
# Create apps/mobile/.env.production
EXPO_PUBLIC_NAKAMA_HOST=your-production-host
EXPO_PUBLIC_NAKAMA_PORT=7350
EXPO_PUBLIC_NAKAMA_USE_SSL=true
```

## 📤 Submitting to App Stores

### Google Play Store

1. **Build Production AAB**
   ```bash
   eas build --platform android --profile production
   ```

2. **Submit to Play Store**
   ```bash
   eas submit --platform android
   ```
   - First time: Follow prompts to set up Google Play credentials
   - EAS will guide you through the submission process

3. **Manual Submission** (Alternative)
   - Download AAB from EAS dashboard
   - Upload to Google Play Console
   - Complete store listing and metadata

### Apple App Store

1. **Build Production IPA**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit to App Store**
   ```bash
   eas submit --platform ios
   ```
   - First time: Follow prompts to set up Apple credentials
   - EAS will guide you through the submission process

3. **Manual Submission** (Alternative)
   - Download IPA from EAS dashboard
   - Upload via App Store Connect or Transporter

## 🔄 Updating the App

### Version Management

Update version in `apps/mobile/app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // Update version
    "android": {
      "versionCode": 2   // Increment for Android
    },
    "ios": {
      "buildNumber": "2" // Increment for iOS
    }
  }
}
```

### Build and Submit Update
```bash
# Build new version
eas build --platform all --profile production

# Submit to stores
eas submit --platform all
```

## 📊 Build Status

Check build status:
```bash
eas build:list
```

View build details:
```bash
eas build:view [build-id]
```

## 🐛 Troubleshooting

### Build Fails

1. **Check Build Logs**
   ```bash
   eas build:view [build-id]
   ```

2. **Common Issues**
   - Missing environment variables
   - Invalid credentials
   - App store account not configured
   - Version conflicts

### Submission Fails

1. **Check Submission Status**
   ```bash
   eas submit:list
   ```

2. **Common Issues**
   - Missing app store metadata
   - Invalid credentials
   - App not approved yet
   - Version already exists

## 🔗 Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Expo App Configuration](https://docs.expo.dev/versions/latest/config/app/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)

## 📝 Checklist

Before submitting to stores:

- [ ] Version number updated in `app.json`
- [ ] Build number/version code incremented
- [ ] Environment variables configured
- [ ] App icons and splash screens set
- [ ] Store listing metadata prepared
- [ ] Privacy policy URL ready
- [ ] App store accounts set up
- [ ] Tested on physical devices
- [ ] All features working correctly

## 💰 Costs

- **EAS Build**: Free tier available, paid plans for more builds
- **Google Play**: $25 one-time registration fee
- **Apple App Store**: $99/year developer fee
- **Hosting**: Nakama server hosting costs (currently Hostinger)











