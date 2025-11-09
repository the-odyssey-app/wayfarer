# Deployment Scripts Guide

## Overview

All deployment and operational scripts use **centralized configuration** from `.env.deployment`. This eliminates hardcoded IPs and makes it easy to switch between environments.

## Quick Setup

1. **Copy the example config**:
   ```bash
   cp .env.deployment.example .env.deployment.local
   ```

2. **Edit with your values**:
   ```bash
   nano .env.deployment.local
   ```

3. **All scripts automatically use this config!**

## Available Scripts

### Deployment

#### `wayfarer-nakama/deploy.sh`
Main deployment script with multiple modes.

**Usage**:
```bash
# Full deployment (code + config) with health checks
./wayfarer-nakama/deploy.sh --mode full --check

# Deploy code only
./wayfarer-nakama/deploy.sh --mode code

# Deploy config only
./wayfarer-nakama/deploy.sh --mode config

# Skip backup
./wayfarer-nakama/deploy.sh --mode full --no-backup
```

**Modes**:
- `code` - Deploy only code (index.js)
- `config` - Deploy only configuration (local.yml)
- `full` - Deploy both (default)

**Options**:
- `--check` - Run health checks after deployment
- `--no-backup` - Skip creating backup before deployment

**Replaces**: `deploy-nakama-fix.sh`, `check-and-fix-nakama.sh`

### Health Checks

#### `scripts/health-check.sh`
Unified health check and diagnostics.

**Usage**:
```bash
# Full diagnostic (default)
./scripts/health-check.sh --full

# Quick status check
./scripts/health-check.sh --quick

# Connection test only
./scripts/health-check.sh --connection
```

**Replaces**: `check-server-nakama.sh`, `diagnose-nakama-connection.sh`

### Database

#### `run-migrations.sh`
Database migration runner.

**Usage**:
```bash
# Run all migrations
./run-migrations.sh

# Run with schema fixes
./run-migrations.sh --fix-schema

# Run specific migration
./run-migrations.sh --migration 001_create_full_schema.sql
```

**Replaces**: `fix-database-schema.sh`

#### `check-database.sh`
Database verification and queries.

**Usage**:
```bash
./check-database.sh
```

### Utilities

#### `download-remote-rpcs.sh`
Download RPC files from remote server.

**Usage**:
```bash
./download-remote-rpcs.sh
```

#### `run-integration-tests.sh`
Run full integration test suite.

**Usage**:
```bash
./run-integration-tests.sh
```

## Configuration Variables

All scripts use these variables from `.env.deployment`:

- `DEPLOYMENT_SERVER_HOST` - Server IP address
- `DEPLOYMENT_SERVER_USER` - SSH user (default: root)
- `DEPLOYMENT_SERVER_DIR` - Remote directory path
- `NAKAMA_HOST` - Nakama host (defaults to DEPLOYMENT_SERVER_HOST)
- `NAKAMA_PORT` - Nakama port (default: 7350)
- `NAKAMA_CONSOLE_PORT` - Console port (default: 7351)

## Migration from Old Scripts

Old scripts have been archived to `scripts/archive/`. See `scripts/archive/DEPRECATED_SCRIPTS.md` for migration guide.

### Quick Reference

| Old Script | New Command |
|------------|-------------|
| `deploy-nakama-fix.sh` | `./wayfarer-nakama/deploy.sh --mode config` |
| `check-and-fix-nakama.sh` | `./wayfarer-nakama/deploy.sh --mode config --check` |
| `check-server-nakama.sh` | `./scripts/health-check.sh --quick` |
| `diagnose-nakama-connection.sh` | `./scripts/health-check.sh --connection` |
| `fix-database-schema.sh` | `./run-migrations.sh --fix-schema` |

## Examples

### Deploy Code Changes
```bash
./wayfarer-nakama/deploy.sh --mode code
```

### Deploy Config and Verify
```bash
./wayfarer-nakama/deploy.sh --mode config --check
```

### Check Server Health
```bash
./scripts/health-check.sh --full
```

### Run Migrations with Fixes
```bash
./run-migrations.sh --fix-schema
```

## Troubleshooting

### Scripts can't find config
Make sure `.env.deployment.local` exists:
```bash
cp .env.deployment.example .env.deployment.local
```

### Connection issues
Run connection diagnostic:
```bash
./scripts/health-check.sh --connection
```

### Deployment fails
Check server status:
```bash
./scripts/health-check.sh --full
```

## See Also

- [Consolidation Report](./CONSOLIDATION_REPORT.md) - Details on script consolidation
- [IP Fix Plan](./FIX_HARDCODED_IP_PLAN.md) - Centralized configuration plan
- [Script Consolidation Analysis](./SCRIPT_CONSOLIDATION_ANALYSIS.md) - Analysis of script redundancies

