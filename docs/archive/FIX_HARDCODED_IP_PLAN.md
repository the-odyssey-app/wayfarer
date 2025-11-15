# Plan: Fix Hardcoded IP & Consolidate Deployment Scripts

## Overview
This plan addresses two critical issues:
1. **Hardcoded IP addresses** (114 occurrences of `5.181.218.160`)
2. **Multiple deployment scripts** (4 scripts with unclear purposes)

---

## Phase 1: Create Centralized Configuration System

### 1.1 Create Root-Level Config File
**File**: `.env.deployment` (or `config/deployment.env`)

```bash
# Deployment Configuration
# This file centralizes all server/host configuration
# DO NOT commit actual production values - use .env.deployment.local

# Server Configuration
DEPLOYMENT_ENV=production  # production, staging, development
DEPLOYMENT_SERVER_HOST=5.181.218.160
DEPLOYMENT_SERVER_USER=root
DEPLOYMENT_SERVER_DIR=/root/wayfarer/wayfarer-nakama

# Nakama Configuration
NAKAMA_HOST=5.181.218.160
NAKAMA_PORT=7350
NAKAMA_CONSOLE_PORT=7351
NAKAMA_SERVER_KEY=defaultkey
NAKAMA_HTTP_KEY=defaulthttpkey

# Local Development (override in .env.deployment.local)
LOCAL_NAKAMA_HOST=localhost
LOCAL_NAKAMA_PORT=7350
```

### 1.2 Create Config Loader Script
**File**: `scripts/load-deployment-config.sh`

```bash
#!/bin/bash
# Load deployment configuration from centralized source
# Usage: source scripts/load-deployment-config.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/.env.deployment"
LOCAL_CONFIG="${SCRIPT_DIR}/.env.deployment.local"

# Load base config
if [ -f "$CONFIG_FILE" ]; then
    set -a
    source "$CONFIG_FILE"
    set +a
fi

# Override with local config if exists
if [ -f "$LOCAL_CONFIG" ]; then
    set -a
    source "$LOCAL_CONFIG"
    set +a
fi

# Set defaults if not set
export DEPLOYMENT_SERVER_HOST="${DEPLOYMENT_SERVER_HOST:-5.181.218.160}"
export DEPLOYMENT_SERVER_USER="${DEPLOYMENT_SERVER_USER:-root}"
export DEPLOYMENT_SERVER_DIR="${DEPLOYMENT_SERVER_DIR:-/root/wayfarer/wayfarer-nakama}"
export NAKAMA_HOST="${NAKAMA_HOST:-${DEPLOYMENT_SERVER_HOST}}"
export NAKAMA_PORT="${NAKAMA_PORT:-7350}"
export NAKAMA_CONSOLE_PORT="${NAKAMA_CONSOLE_PORT:-7351}"
export REMOTE_SERVER="${REMOTE_SERVER:-${DEPLOYMENT_SERVER_HOST}}"
```

### 1.3 Create Environment-Specific Configs
**Files**:
- `.env.deployment.local` (gitignored, for local overrides)
- `.env.deployment.example` (template, committed)

---

## Phase 2: Update All Scripts to Use Centralized Config

### 2.1 Update Deployment Scripts
**Scripts to update** (all should source the config loader):
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

**Pattern to apply**:
```bash
#!/bin/bash
# Load centralized config
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../scripts/load-deployment-config.sh"

# Use variables instead of hardcoded values
REMOTE_HOST="${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}"
REMOTE_DIR="${DEPLOYMENT_SERVER_DIR}"
NAKAMA_HOST="${NAKAMA_HOST}"
```

### 2.2 Update Test Files
**Files to update**:
- `test-integration/test_google_maps.js`
- `test-integration/test_find_matches.js`
- `test-integration/test_quick2.js`
- `test-integration/test_quick.js`
- `test-integration/check-runtime-module.sh`

**Pattern for Node.js test files**:
```javascript
// Load config from environment or defaults
const NAKAMA_HOST = process.env.NAKAMA_HOST || process.env.DEPLOYMENT_SERVER_HOST || 'localhost';
const NAKAMA_PORT = process.env.NAKAMA_PORT || '7350';
const client = new Client("defaultkey", NAKAMA_HOST, NAKAMA_PORT);
```

---

## Phase 3: Update Mobile App Configuration

### 3.1 Create Mobile Config with Environment Variables
**File**: `apps/mobile/src/config/nakama.ts`

**Changes**:
- Use Expo environment variables
- Support different environments (dev/staging/prod)
- Remove hardcoded IP

**New structure**:
```typescript
// Load from environment variables
const getNakamaConfig = () => {
  const env = process.env.EXPO_PUBLIC_ENV || 'development';
  
  if (env === 'production') {
    return {
      host: process.env.EXPO_PUBLIC_NAKAMA_HOST || '5.181.218.160',
      port: parseInt(process.env.EXPO_PUBLIC_NAKAMA_PORT || '7350'),
      useSSL: process.env.EXPO_PUBLIC_NAKAMA_USE_SSL === 'true',
    };
  }
  
  // Development defaults
  return {
    host: process.env.EXPO_PUBLIC_NAKAMA_HOST || 'localhost',
    port: parseInt(process.env.EXPO_PUBLIC_NAKAMA_PORT || '7350'),
    useSSL: false,
  };
};

export const NAKAMA_CONFIG = {
  ...getNakamaConfig(),
  serverKey: 'defaultkey',
  timeout: 10000,
};

// Platform-specific hosts
export const NAKAMA_HOSTS = {
  android_emulator: '10.0.2.2',
  ios_simulator: 'localhost',
  physical_device: process.env.EXPO_PUBLIC_NAKAMA_HOST || '5.181.218.160',
};
```

### 3.2 Update Android Network Security Config
**File**: `apps/mobile/android/app/src/main/res/xml/network_security_config.xml`

**Change**: Use placeholder or environment variable (if possible) or document that this needs manual update per environment.

---

## Phase 4: Consolidate Deployment Scripts

### 4.1 Create Main Deployment Script
**File**: `wayfarer-nakama/deploy.sh` (new, main script)

**Purpose**: Single entry point for all deployments

**Features**:
- Validate pre-deployment
- Deploy code/config
- Restart services
- Run health checks
- Support different deployment modes (full, config-only, code-only)

### 4.2 Create Specialized Helper Scripts
**Files** (in `wayfarer-nakama/scripts/`):
- `deploy-code.sh` - Deploy only code changes
- `deploy-config.sh` - Deploy only configuration
- `health-check.sh` - Check server health
- `diagnose.sh` - Diagnostic information

### 4.3 Deprecate Old Scripts
**Action**: 
- Move old scripts to `scripts/archive/`
- Update main `deploy.sh` to call appropriate helpers
- Add deprecation notices in old scripts

**Scripts to archive**:
- `deploy-nakama-fix.sh` → functionality in `deploy.sh --mode config`
- `check-and-fix-nakama.sh` → functionality in `deploy.sh --check` + `health-check.sh`
- `check-server-nakama.sh` → functionality in `health-check.sh`

---

## Phase 5: Update Documentation

### 5.1 Update README Files
**Files to update**:
- `wayfarer-nakama/README.md`
- `README.md` (root)
- `docs/README.md`

**Add sections**:
- Configuration setup
- Environment variables
- Deployment guide

### 5.2 Create Deployment Guide
**File**: `docs/DEPLOYMENT_GUIDE.md`

**Contents**:
- How to set up configuration
- How to deploy to different environments
- Troubleshooting guide
- Script reference

---

## Phase 6: Implementation Order

### Step 1: Create Config Infrastructure (Low Risk)
1. Create `.env.deployment.example`
2. Create `scripts/load-deployment-config.sh`
3. Test config loading

### Step 2: Update One Script as Proof of Concept
1. Pick one simple script (e.g., `check-server-nakama.sh`)
2. Update it to use centralized config
3. Test thoroughly
4. Use as template for others

### Step 3: Update All Scripts (Medium Risk)
1. Update all deployment scripts
2. Update all test scripts
3. Test each one

### Step 4: Update Mobile App (Medium Risk)
1. Update `apps/mobile/src/config/nakama.ts`
2. Update Android config
3. Test on different platforms

### Step 5: Consolidate Deployment Scripts (Low Risk)
1. Create new `deploy.sh`
2. Create helper scripts
3. Archive old scripts
4. Update documentation

### Step 6: Update Documentation (Low Risk)
1. Update all README files
2. Create deployment guide
3. Add migration notes

---

## Phase 7: Testing Strategy

### 7.1 Test Each Phase
- **Config loading**: Test with different environments
- **Script updates**: Test each script individually
- **Mobile app**: Test on emulator and physical device
- **Deployment**: Test full deployment flow

### 7.2 Validation Checklist
- [ ] All scripts use centralized config
- [ ] No hardcoded IPs remain (except in example/template files)
- [ ] Mobile app works in dev and prod modes
- [ ] Deployment works to remote server
- [ ] Tests work with configurable host
- [ ] Documentation is updated

---

## Phase 8: Migration Notes

### 8.1 For Developers
1. Copy `.env.deployment.example` to `.env.deployment.local`
2. Set your local values
3. All scripts will automatically use new config

### 8.2 For CI/CD
1. Set environment variables in CI/CD system
2. Scripts will pick them up automatically
3. No code changes needed

### 8.3 Backward Compatibility
- Keep old scripts in archive for reference
- Add deprecation warnings
- Document migration path

---

## Benefits

1. **Single Source of Truth**: One config file for all server info
2. **Easy Environment Switching**: Change one file to switch environments
3. **No Hardcoded Values**: All configurable via environment variables
4. **Clearer Deployment**: One main script with clear options
5. **Better Testing**: Tests can easily target different environments
6. **Easier Onboarding**: New developers just copy example config

---

## Estimated Effort

- **Phase 1** (Config Infrastructure): 2-3 hours
- **Phase 2** (Update Scripts): 4-6 hours
- **Phase 3** (Mobile App): 2-3 hours
- **Phase 4** (Consolidate Scripts): 3-4 hours
- **Phase 5** (Documentation): 2-3 hours
- **Phase 6** (Testing): 3-4 hours

**Total**: ~16-23 hours

---

## Risk Assessment

- **Low Risk**: Config infrastructure, documentation
- **Medium Risk**: Script updates (need thorough testing)
- **Medium Risk**: Mobile app changes (need device testing)
- **Low Risk**: Script consolidation (can keep old scripts as backup)

---

## Rollback Plan

1. Keep all old scripts in `scripts/archive/`
2. Git allows easy rollback of changes
3. Config changes are additive (old hardcoded values still work during transition)

