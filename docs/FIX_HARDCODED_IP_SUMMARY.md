# Quick Summary: Fix Hardcoded IP & Deployment Scripts

## The Problem
- **114 hardcoded IP addresses** (`5.181.218.160`) across the codebase
- **4 deployment scripts** with unclear purposes
- Hard to switch between environments (dev/staging/prod)

## The Solution

### 1. Centralized Configuration
Create one config file that all scripts read from:
```
.env.deployment          # Base config (committed)
.env.deployment.local    # Local overrides (gitignored)
```

### 2. Config Loader Script
All scripts source this to get variables:
```bash
source scripts/load-deployment-config.sh
# Now $DEPLOYMENT_SERVER_HOST, $NAKAMA_HOST, etc. are available
```

### 3. Update All Scripts
Replace hardcoded IPs with variables:
```bash
# OLD:
REMOTE_HOST="root@5.181.218.160"

# NEW:
source scripts/load-deployment-config.sh
REMOTE_HOST="${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}"
```

### 4. Consolidate Deployment Scripts
- **Main script**: `wayfarer-nakama/deploy.sh` (does everything)
- **Helper scripts**: `scripts/deploy-code.sh`, `scripts/health-check.sh`, etc.
- **Archive old scripts**: Move to `scripts/archive/`

### 5. Update Mobile App
Use environment variables instead of hardcoded IP:
```typescript
// OLD:
host: '5.181.218.160'

// NEW:
host: process.env.EXPO_PUBLIC_NAKAMA_HOST || 'localhost'
```

## Implementation Steps

1. ✅ Create config files (`.env.deployment.example`)
2. ✅ Create config loader (`scripts/load-deployment-config.sh`)
3. ✅ Update one script as proof of concept
4. ✅ Update all remaining scripts
5. ✅ Update mobile app config
6. ✅ Consolidate deployment scripts
7. ✅ Update documentation

## Quick Start (After Implementation)

```bash
# 1. Copy example config
cp .env.deployment.example .env.deployment.local

# 2. Edit with your values
nano .env.deployment.local

# 3. All scripts now use your config automatically
./wayfarer-nakama/deploy.sh
```

## Files That Need Updates

### Scripts (10 files)
- `wayfarer-nakama/deploy-nakama.sh`
- `deploy-nakama-fix.sh`
- `check-and-fix-nakama.sh`
- `check-server-nakama.sh`
- `run-migrations.sh`
- `fix-database-schema.sh`
- `check-database.sh`
- `download-remote-rpcs.sh`
- `diagnose-nakama-connection.sh`
- `run-integration-tests.sh`

### Test Files (5 files)
- `test-integration/test_google_maps.js`
- `test-integration/test_find_matches.js`
- `test-integration/test_quick2.js`
- `test-integration/test_quick.js`
- `test-integration/check-runtime-module.sh`

### Mobile App (2 files)
- `apps/mobile/src/config/nakama.ts`
- `apps/mobile/android/app/src/main/res/xml/network_security_config.xml`

### Documentation (Multiple)
- All README files
- Deployment guides

## Benefits

✅ **Single source of truth** - Change IP in one place  
✅ **Easy environment switching** - Dev/staging/prod  
✅ **No hardcoded values** - Everything configurable  
✅ **Clearer deployment** - One main script  
✅ **Better testing** - Tests can target any environment  

## Estimated Time

**Total**: ~16-23 hours
- Config setup: 2-3 hours
- Script updates: 4-6 hours  
- Mobile app: 2-3 hours
- Script consolidation: 3-4 hours
- Documentation: 2-3 hours
- Testing: 3-4 hours

