# Wayfarer - Location-Based Mobile Game

A location-based mobile game built with React Native (Expo), Nakama game server, and Google Maps integration.

## 📁 Project Structure

```
wayfarer/
├── apps/
│   └── mobile/              # Expo React Native mobile app
├── wayfarer-nakama/         # Nakama game server configuration & modules
├── wayfarer-proxy/          # Vercel serverless function (Google Places API proxy)
├── test-integration/        # Integration tests
├── docs/                    # Documentation
└── old/                     # Legacy Convex code (reference only)
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- Expo CLI (for mobile development)
- Docker (for local Nakama server)

### Development

1. **Start Mobile App**
   ```bash
   npm run dev:mobile
   # or
   cd apps/mobile && npm start
   ```

2. **Start Nakama Server** (local development)
   ```bash
   cd wayfarer-nakama
   docker compose up -d
   ```

3. **Proxy** (deployed on Vercel)
   - See `wayfarer-proxy/README.md` for deployment instructions

## 📦 Components

### Mobile App (`apps/mobile/`)
- **Tech**: Expo ~54.0.7, React Native 0.81.4, TypeScript
- **Features**: Quest discovery, location tracking, social features
- **Deployment**: EAS Build → App Stores
- See `apps/mobile/` for mobile-specific documentation

### Nakama Server (`wayfarer-nakama/`)
- **Tech**: Nakama 3.22.0, Docker, JavaScript Runtime Modules
- **Database**: CockroachDB (PostgreSQL-compatible)
- **Hosting**: Hostinger (temporary)
- **Features**: RPC functions, quest management, user data
- See `wayfarer-nakama/README.md` for server documentation

### Proxy (`wayfarer-proxy/`)
- **Tech**: Node.js serverless function
- **Hosting**: Vercel
- **Purpose**: Google Places API proxy (workaround for Nakama httpRequest limitations)
- See `wayfarer-proxy/README.md` for proxy documentation

## 🛠️ Available Scripts

### Development
```bash
npm run dev:mobile          # Start mobile app development server
```

### Building
```bash
npm run build:mobile        # Build mobile app with EAS
```

### Testing
```bash
npm run test                # Run integration tests
./run-integration-tests.sh  # Run full integration test suite
```

### Deployment & Operations
```bash
# Deploy Nakama (main deployment script)
./wayfarer-nakama/deploy.sh --mode full --check

# Deploy code only
./wayfarer-nakama/deploy.sh --mode code

# Deploy config only
./wayfarer-nakama/deploy.sh --mode config

# Health checks
./scripts/health-check.sh --full        # Full diagnostic
./scripts/health-check.sh --quick      # Quick status
./scripts/health-check.sh --connection # Connection test

# Database migrations
./run-migrations.sh                    # Run all migrations
./run-migrations.sh --fix-schema       # Run with schema fixes

# Database verification
./check-database.sh                    # Check database state
```

**Note**: All scripts use centralized configuration from `.env.deployment`. See [Configuration](#-configuration) below.

## 📚 Documentation

- [Monorepo Evaluation & Plan](./MONOREPO_EVALUATION_AND_PLAN.md) - Architecture decisions
- [Mobile App Deployment Guide](./docs/MOBILE_DEPLOYMENT.md) - How to deploy the mobile app
- [Nakama Server Guide](./wayfarer-nakama/README.md) - Server setup and configuration
- [Deployment Scripts Guide](./docs/DEPLOYMENT_SCRIPTS.md) - **NEW**: Consolidated deployment scripts
- [Integration Tests](./test-integration/README.md) - Testing documentation

## 🔧 Configuration

### Centralized Deployment Configuration

All deployment and operational scripts use centralized configuration from `.env.deployment`:

1. **Copy the example config**:
   ```bash
   cp .env.deployment.example .env.deployment.local
   ```

2. **Edit with your values**:
   ```bash
   nano .env.deployment.local
   ```

3. **Key variables**:
   ```env
   DEPLOYMENT_SERVER_HOST=your-server-ip
   DEPLOYMENT_SERVER_USER=root
   DEPLOYMENT_SERVER_DIR=/root/wayfarer/wayfarer-nakama
   NAKAMA_HOST=your-server-ip
   NAKAMA_PORT=7350
   ```

All scripts automatically load this configuration. No hardcoded IPs needed!

### Mobile App
Create `apps/mobile/.env`:
```env
EXPO_PUBLIC_NAKAMA_HOST=your-nakama-host
EXPO_PUBLIC_NAKAMA_PORT=7350
EXPO_PUBLIC_NAKAMA_USE_SSL=false
```

### Nakama Server
See `wayfarer-nakama/README.md` for environment configuration.

### Proxy
Set `GOOGLE_MAPS_API_KEY` in Vercel project settings.

## 🚢 Deployment

### Mobile App
1. Set up EAS account: `npm install -g eas-cli && eas login`
2. Configure build: `cd apps/mobile && eas build:configure`
3. Build: `eas build --platform android` or `eas build --platform ios`
4. Submit: `eas submit --platform android` or `eas submit --platform ios`

See [Mobile App Deployment Guide](./docs/MOBILE_DEPLOYMENT.md) for detailed instructions.

### Nakama Server
Currently hosted on Hostinger. 

**Deployment**:
```bash
# Full deployment with health checks
./wayfarer-nakama/deploy.sh --mode full --check

# Or deploy code/config separately
./wayfarer-nakama/deploy.sh --mode code
./wayfarer-nakama/deploy.sh --mode config
```

See `wayfarer-nakama/DEPLOYMENT_CHECKLIST.md` for detailed deployment steps.

### Proxy
Deployed on Vercel. See `wayfarer-proxy/README.md` for deployment instructions.

## 📝 License

MIT

## 👥 Contributors

Wayfarer Team

