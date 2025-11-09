# Deprecated Scripts Archive

These scripts have been consolidated into new unified scripts. They are kept here for reference but should not be used.

## Migration Guide

### Old Scripts → New Scripts

1. **`deploy-nakama-fix.sh`** → `wayfarer-nakama/deploy.sh --mode config`
   - Deploys only configuration (local.yml)
   - Restarts Nakama

2. **`check-and-fix-nakama.sh`** → `wayfarer-nakama/deploy.sh --mode config --check`
   - Comprehensive check and fix
   - Deploys config, restarts, runs health checks

3. **`check-server-nakama.sh`** → `scripts/health-check.sh --quick`
   - Quick status check
   - Container and port status

4. **`diagnose-nakama-connection.sh`** → `scripts/health-check.sh --connection`
   - Connection diagnostic
   - Tests SSH and Nakama ports

5. **`fix-database-schema.sh`** → `run-migrations.sh --fix-schema`
   - Schema fixes (adds missing columns)
   - Now integrated into migration runner

## New Script Usage

### Deployment
```bash
# Deploy code only
./wayfarer-nakama/deploy.sh --mode code

# Deploy config only
./wayfarer-nakama/deploy.sh --mode config

# Deploy everything (default)
./wayfarer-nakama/deploy.sh --mode full

# Deploy with health checks
./wayfarer-nakama/deploy.sh --mode full --check
```

### Health Checks
```bash
# Quick check
./scripts/health-check.sh --quick

# Full diagnostic
./scripts/health-check.sh --full

# Connection only
./scripts/health-check.sh --connection
```

### Migrations
```bash
# Run all migrations
./run-migrations.sh

# Run migrations with schema fixes
./run-migrations.sh --fix-schema

# Run specific migration
./run-migrations.sh --migration 001_create_full_schema.sql
```

## Date Archived
2024-12-19

## Notes
- All old scripts have been moved to `scripts/archive/`
- New scripts use centralized configuration from `.env.deployment`
- All scripts now support environment variables for server configuration

