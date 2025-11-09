# Mobile App Configuration

## Environment Variables

The mobile app uses Expo environment variables for configuration. Set these in your `app.json` or via `EXPO_PUBLIC_*` environment variables.

### Required Variables

```json
{
  "expo": {
    "extra": {
      "env": "production",
      "nakamaHost": "your-server-ip",
      "nakamaPort": "7350",
      "nakamaUseSSL": "false",
      "nakamaServerKey": "defaultkey"
    }
  }
}
```

### Or via Environment Variables

```bash
export EXPO_PUBLIC_ENV=production
export EXPO_PUBLIC_NAKAMA_HOST=your-server-ip
export EXPO_PUBLIC_NAKAMA_PORT=7350
export EXPO_PUBLIC_NAKAMA_USE_SSL=false
export EXPO_PUBLIC_NAKAMA_SERVER_KEY=defaultkey
```

### Android Network Security Config

**Note**: Android's `network_security_config.xml` doesn't support environment variables directly. 

If you need to change the server IP:
1. Edit `android/app/src/main/res/xml/network_security_config.xml`
2. Update the domain entry for your server IP
3. Rebuild the app

For production, consider using a build script to replace the IP at build time.

## Configuration Priority

1. `app.json` extra config (highest priority)
2. `EXPO_PUBLIC_*` environment variables
3. Hardcoded defaults (for backward compatibility)

## Development vs Production

- **Development**: Defaults to `localhost:7350`
- **Production**: Uses configured host from environment variables

The app automatically detects the environment and uses appropriate defaults.

