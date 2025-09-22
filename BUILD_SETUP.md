# Wayfarer Development Build Setup

This guide explains how to set up the GitHub Actions CI/CD pipeline for building development apps with Mapbox support.

## Prerequisites

1. **Mapbox Account**: Sign up at [mapbox.com](https://mapbox.com)
2. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
3. **GitHub Repository**: Your code should be in a GitHub repository

## Setup Steps

### 1. Get Mapbox Tokens

1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Create a new token with these scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`
   - `geocoding:read`
   - `navigation:read`
   - `navigation:write`
3. Copy the **Access Token** and **Download Token**

### 2. Get Expo Project ID

1. Go to [Expo Dashboard](https://expo.dev)
2. Create a new project or use existing one
3. Copy the **Project ID** from the project settings

### 3. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

```
EXPO_TOKEN=your_expo_access_token
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
MAPBOX_DOWNLOAD_TOKEN=your_mapbox_download_token
EXPO_PROJECT_ID=your_expo_project_id
```

### 4. Update Configuration Files

1. **Update `apps/mobile/app.json`**:
   - Replace `YOUR_MAPBOX_DOWNLOAD_TOKEN` with your actual token
   - Replace `your-project-id-here` with your Expo project ID

2. **Update `apps/mobile/src/components/MapComponent.tsx`**:
   - Replace `YOUR_MAPBOX_ACCESS_TOKEN` with your actual token

### 5. Initialize EAS Project

Run these commands in your local development environment:

```bash
cd apps/mobile
npm install -g @expo/eas-cli
eas login
eas build:configure
```

This will create the `eas.json` file and link your project to Expo.

## Building the App

### Automatic Builds

The app will automatically build when you:
- Push to `main` or `develop` branches
- Create a pull request
- Manually trigger the workflow

### Manual Builds

You can also build manually:

```bash
cd apps/mobile
eas build --platform android --profile development
```

## Downloading Builds

1. Go to your GitHub repository
2. Click on **Actions** tab
3. Find your build workflow
4. Download the APK from the **Artifacts** section

## Troubleshooting

### Common Issues

1. **"Mapbox token not found"**
   - Check that `MAPBOX_ACCESS_TOKEN` is set in GitHub secrets
   - Verify the token has the correct permissions

2. **"Expo project not found"**
   - Check that `EXPO_PROJECT_ID` is correct in `app.json`
   - Verify `EXPO_TOKEN` has access to the project

3. **"Build failed"**
   - Check the GitHub Actions logs for specific errors
   - Ensure all dependencies are properly installed

### Getting Help

- Check the [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/)
- Review [Mapbox React Native documentation](https://github.com/rnmapbox/maps)
- Check GitHub Actions logs for detailed error messages

## Cost Information

- **GitHub Actions**: Free for public repos, 2000 minutes/month for private repos
- **Expo EAS Build**: Free tier includes 30 builds/month
- **Mapbox**: Free tier includes 50,000 map loads/month

Total estimated cost: **$0/month** for development builds within free tiers.
