# Maestro E2E Testing - Quick Start

## Installation (One-Time Setup)

```bash
# Install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

## Running Tests

### Prerequisites
1. Start Expo app: `cd apps/mobile && npm start`
2. Launch on simulator: Press `i` (iOS) or `a` (Android)

### Run Tests

```bash
cd apps/mobile

# Run all tests
npm run test:e2e

# Run specific test suite
npm run test:e2e:auth        # Authentication
npm run test:e2e:quests       # Quest discovery & completion
npm run test:e2e:party        # Party/group features
npm run test:e2e:progression  # XP, ranks, leaderboard
npm run test:e2e:photo        # Photo upload

# List available devices
npm run test:e2e:device:list
```

## Test Structure

```
e2e/
├── flows/                    # Test flow files
│   ├── 01-authentication.yaml
│   ├── 02-quest-discovery.yaml
│   ├── 03-quest-completion.yaml
│   ├── 04-party-creation.yaml
│   ├── 05-progression.yaml
│   └── 06-photo-upload.yaml
├── fixtures/                  # Test data
├── maestro.config.yaml       # Configuration
└── README.md                 # Full documentation
```

## Common Issues

**App not found?**
- Verify app is installed on simulator/device
- Check `appId` in `maestro.config.yaml` matches `app.json`

**Elements not found?**
- Use regex patterns: `".*[Tt]ext.*"`
- Increase timeout: `timeout: 15000`
- Use `optional: true` for conditional elements

**Need help?**
- See `e2e/README.md` for full documentation
- See `e2e/SETUP.md` for detailed setup guide
- Run with debug: `maestro test e2e/flows/ --debug`

