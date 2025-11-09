# Script Consolidation Analysis

## Current Scripts in Phase 2

### Deployment Scripts
1. **`wayfarer-nakama/deploy-nakama.sh`** - Main deployment (code + validation)
2. **`deploy-nakama-fix.sh`** - Config-only deployment
3. **`check-and-fix-nakama.sh`** - Comprehensive check + fix + config deploy

### Diagnostic Scripts
4. **`check-server-nakama.sh`** - Simple status check
5. **`diagnose-nakama-connection.sh`** - Connection diagnostic

### Database Scripts
6. **`run-migrations.sh`** - Run database migrations
7. **`fix-database-schema.sh`** - Fix specific schema issues
8. **`check-database.sh`** - Database verification/queries

### Utility Scripts
9. **`download-remote-rpcs.sh`** - Download RPC files from server
10. **`run-integration-tests.sh`** - Test runner (keep as-is)

---

## Redundancy Analysis

### 🔴 HIGH REDUNDANCY - Can Be Consolidated

#### Group 1: Deployment Scripts
**Scripts**: `deploy-nakama-fix.sh` + `check-and-fix-nakama.sh`

**Overlap**:
- Both deploy `local.yml` config
- Both restart Nakama
- Both verify connection
- `check-and-fix-nakama.sh` also does diagnostics (overlaps with diagnostic scripts)

**Recommendation**: 
- **DELETE** `deploy-nakama-fix.sh` (functionality covered by main deploy script)
- **CONSOLIDATE** `check-and-fix-nakama.sh` into main `deploy-nakama.sh` as `--mode fix` or separate helper

#### Group 2: Diagnostic Scripts
**Scripts**: `check-server-nakama.sh` + `diagnose-nakama-connection.sh`

**Overlap**:
- Both check container status
- Both check port accessibility
- Both check logs
- Both provide troubleshooting info

**Recommendation**:
- **CONSOLIDATE** into single `scripts/health-check.sh` or `scripts/diagnose.sh`
- Keep one comprehensive diagnostic script

### 🟡 MEDIUM REDUNDANCY - Can Be Simplified

#### Database Scripts
**Scripts**: `fix-database-schema.sh` + `run-migrations.sh`

**Analysis**:
- `fix-database-schema.sh` adds specific columns (one-time fix)
- `run-migrations.sh` runs full migration files
- Different purposes but could be unified

**Recommendation**:
- **KEEP** `run-migrations.sh` (main migration runner)
- **CONVERT** `fix-database-schema.sh` to a migration file OR merge into `run-migrations.sh` as a helper

### 🟢 LOW REDUNDANCY - Keep Separate

- **`check-database.sh`** - Different purpose (queries/verification, not fixes)
- **`download-remote-rpcs.sh`** - Unique purpose (download from server)
- **`run-integration-tests.sh`** - Unique purpose (test runner)

---

## Proposed Consolidation Plan

### Option A: Aggressive Consolidation (Recommended)

#### Keep These Scripts:
1. ✅ **`wayfarer-nakama/deploy.sh`** (renamed from `deploy-nakama.sh`)
   - Main deployment script with modes:
     - `--mode code` - Deploy code only
     - `--mode config` - Deploy config only  
     - `--mode full` - Deploy everything
     - `--check` - Run health checks after deployment

2. ✅ **`scripts/health-check.sh`** (new, consolidates diagnostics)
   - Combines: `check-server-nakama.sh` + `diagnose-nakama-connection.sh`
   - Options: `--quick`, `--full`, `--connection`

3. ✅ **`run-migrations.sh`** (keep, enhance)
   - Add option to run specific migrations
   - Include schema fix functionality

4. ✅ **`check-database.sh`** (keep as-is)
   - Database queries/verification

5. ✅ **`download-remote-rpcs.sh`** (keep as-is)
   - Unique utility

6. ✅ **`run-integration-tests.sh`** (keep as-is)
   - Test runner

#### Delete These Scripts:
- ❌ **`deploy-nakama-fix.sh`** → Functionality in `deploy.sh --mode config`
- ❌ **`check-and-fix-nakama.sh`** → Functionality in `deploy.sh --mode config --check`
- ❌ **`check-server-nakama.sh`** → Functionality in `scripts/health-check.sh`
- ❌ **`diagnose-nakama-connection.sh`** → Functionality in `scripts/health-check.sh --connection`
- ❌ **`fix-database-schema.sh`** → Convert to migration or merge into `run-migrations.sh`

**Result**: 10 scripts → 6 scripts (40% reduction)

---

### Option B: Conservative Consolidation

#### Keep These Scripts:
1. ✅ **`wayfarer-nakama/deploy-nakama.sh`** (main deployment)
2. ✅ **`scripts/deploy-config.sh`** (new, from `deploy-nakama-fix.sh`)
3. ✅ **`scripts/health-check.sh`** (new, consolidates diagnostics)
4. ✅ **`run-migrations.sh`** (keep)
5. ✅ **`check-database.sh`** (keep)
6. ✅ **`download-remote-rpcs.sh`** (keep)
7. ✅ **`run-integration-tests.sh`** (keep)

#### Archive These Scripts:
- 📦 **`check-and-fix-nakama.sh`** → Archive (functionality split)
- 📦 **`check-server-nakama.sh`** → Archive (replaced by health-check.sh)
- 📦 **`diagnose-nakama-connection.sh`** → Archive (replaced by health-check.sh)
- 📦 **`fix-database-schema.sh`** → Archive (convert to migration)

**Result**: 10 scripts → 7 scripts (30% reduction)

---

## Recommended Approach: Option A

### Benefits:
1. **Clearer structure** - One main deploy script with modes
2. **Less confusion** - No duplicate functionality
3. **Easier maintenance** - Fewer scripts to update
4. **Better organization** - Helper scripts in `scripts/` directory

### Implementation:
1. Create new `wayfarer-nakama/deploy.sh` with modes
2. Create `scripts/health-check.sh` consolidating diagnostics
3. Enhance `run-migrations.sh` to include schema fixes
4. Move old scripts to `scripts/archive/` with deprecation notices
5. Update documentation

### Migration Path:
- Keep old scripts in `scripts/archive/` for 1-2 releases
- Add deprecation warnings pointing to new scripts
- Remove after team confirms new scripts work

---

## Script Functionality Mapping

### Deployment Functions Needed:
- ✅ Deploy code (index.js)
- ✅ Deploy config (local.yml)
- ✅ Restart services
- ✅ Validate deployment
- ✅ Health checks
- ✅ Backup before deploy

### Diagnostic Functions Needed:
- ✅ Check container status
- ✅ Check port accessibility
- ✅ Check logs
- ✅ Check firewall
- ✅ Connection testing
- ✅ Service health

### Database Functions Needed:
- ✅ Run migrations
- ✅ Fix schema issues
- ✅ Verify database state
- ✅ Query database

---

## Summary

**Current**: 10 scripts  
**After Consolidation**: 6 scripts  
**Reduction**: 40% fewer scripts  
**Deleted**: 4 scripts  
**New**: 2 scripts (deploy.sh with modes, health-check.sh)

**Key Consolidations**:
1. 3 deployment scripts → 1 script with modes
2. 2 diagnostic scripts → 1 health-check script
3. Schema fix → Migration or helper function

