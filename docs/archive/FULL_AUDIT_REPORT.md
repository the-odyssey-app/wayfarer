# Full Audit Report: Why Data Is Not Being Saved

**Date**: November 9, 2025  
**Purpose**: Comprehensive audit of migration script, database connection, and implementation to understand why tests pass but no data is created

---

## 🔍 Executive Summary

**Problem**: Tests report "All Integration Tests Passed!" but database shows:
- 0 new quests (only 5 seeded quests with `quest_001` format)
- 0 quest steps
- 0 achievements  
- 0 user quests
- 40 places (this IS working)

**Hypothesis**: Multiple potential issues:
1. Tests might not be calling RPCs (mocking responses)
2. RPCs might be executing but failing silently
3. Database connection might be to wrong database
4. Transactions might be rolling back
5. Schema mismatches causing silent failures

---

## 📋 Part 1: Migration Script Audit (`run-migrations.sh`)

### Current Implementation Analysis

**File**: `run-migrations.sh`

#### Strengths:
1. ✅ Uploads migration files to server
2. ✅ Finds CockroachDB container correctly
3. ✅ Executes migrations in order
4. ✅ Uses `--database=nakama` flag correctly

#### Critical Issues:

**Issue 1.1: Migration Execution Method**
```bash
docker exec $COCKROACH_CONTAINER sh -c "cockroach sql --insecure --database=nakama < /tmp/$filename" 2>&1
```

**Problem**: 
- Uses shell redirection (`<`) which might not work correctly in `docker exec`
- Error handling only checks exit code, not actual SQL errors
- If migration fails partway through, script continues anyway

**Impact**: Migrations might fail silently, leaving schema incomplete.

**Issue 1.2: Error Handling**
```bash
if [ $EXIT_CODE -eq 0 ]; then
    echo "  ✅ $filename completed successfully"
else
    echo "  ⚠️  $filename exited with code $EXIT_CODE"
    echo "     (This may be OK if tables already exist - continuing...)"
fi
```

**Problem**:
- Assumes non-zero exit code means "tables already exist"
- Doesn't check for actual SQL errors
- Doesn't verify tables were actually created

**Impact**: Schema might be incomplete, but script reports success.

**Issue 1.3: No Verification Step**
- Script doesn't verify that required columns exist after migration
- Doesn't check if `activity_type`, `time_minutes`, `reward_xp`, `reward_coins` were added
- Doesn't verify `is_group` column exists

**Impact**: Schema might be missing columns, causing INSERT failures.

---

## 📋 Part 2: Database Connection Audit

### Current Configuration

**File**: `wayfarer-nakama/local.yml`
```yaml
database:
  address:
    - "cockroach:26257"
  name: "nakama"
  user: "root"
  password: ""
```

**File**: `wayfarer-nakama/docker-compose.yml`
```yaml
entrypoint:
  - "/bin/sh"
  - "-ecx"
  - >
    /nakama/nakama migrate up --database.address root@cockroachdb:26257 &&
    exec /nakama/nakama --name nakama1 --database.address root@cockroachdb:26257 --config /nakama/local.yml
```

### Analysis:

**Issue 2.1: Database Name Consistency**
- Docker-compose migration: Uses `root@cockroachdb:26257` (no database name specified)
- Nakama config: Uses `name: "nakama"` (database name specified)
- Migration script: Uses `--database=nakama` (database name specified)

**Question**: Does Nakama's migration command create/use the `nakama` database automatically?

**Issue 2.2: Migration Command**
```bash
/nakama/nakama migrate up --database.address root@cockroachdb:26257
```

**Problem**:
- Nakama's `migrate up` command uses its own migration system
- It might be using a different database or schema than our manual migrations
- Our `run-migrations.sh` script runs SQL files directly, which might conflict

**Impact**: Two migration systems might be conflicting or using different databases.

**Issue 2.3: Database Verification**
- We verified `nakama` database exists ✅
- We verified tables exist ✅
- But we haven't verified Nakama is actually using this database

**Question**: Is Nakama connecting to the `nakama` database, or defaulting to another?

---

## 📋 Part 3: RPC Implementation Audit

### Quest Creation RPC Analysis

**File**: `wayfarer-nakama/nakama-data/modules/index.js`
**Function**: `rpcCreateQuestFromLocation` (line 1175)

#### Step-by-Step Flow:

**Step 1: Get Places** (Line 1190-1201)
```javascript
const placesResultStr = rpcGetPlacesNearby(ctx, logger, nk, placesPayload);
const placesResult = JSON.parse(placesResultStr);
```

**Analysis**: 
- ✅ Calls `rpcGetPlacesNearby` (we know this works - 40 places in DB)
- ✅ Parses result correctly

**Step 2: Generate Quest** (Line 1203-1247)
```javascript
if (questType === 'scavenger') {
    const genResultStr = rpcGenerateScavengerHunt(ctx, logger, nk, genPayload);
    const genResult = JSON.parse(genResultStr);
    // ... process result
}
```

**Analysis**:
- ✅ Calls AI generation RPC
- ✅ Processes result
- ⚠️ **No error handling if AI generation fails** - function might return early

**Step 3: Save Quest** (Line 1249-1260)
```javascript
nk.sqlExec(`
  INSERT INTO quests (id, title, description, location_lat, location_lng, 
                      radius_meters, difficulty, xp_reward, creator_id, 
                      is_public, max_participants, current_participants, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
`, [questId, questData.title, questData.description, latitude, longitude, 
    radiusMeters, difficulty, xpReward, userId, true, isGroup ? 10 : null, 0]);
```

**Critical Issues**:

**Issue 3.1: Missing `is_group` Column in INSERT**
- Code uses `isGroup` variable (line 1184)
- INSERT statement doesn't include `is_group` column
- We added `is_group` column to schema, but INSERT doesn't use it

**Impact**: INSERT might fail if `is_group` is required, OR it might succeed but not set the value.

**Issue 3.2: No Error Handling for SQL**
- `nk.sqlExec` doesn't throw errors by default
- If INSERT fails, function continues anyway
- No logging of SQL errors

**Impact**: Quest creation might fail silently, but RPC returns success.

**Step 4: Save Quest Steps** (Line 1294-1326)
```javascript
nk.sqlExec(`
  INSERT INTO quest_steps (id, quest_id, step_number, title, description,
                           latitude, longitude, place_id, activity_type,
                           success_criteria, time_minutes, hint, created_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
`, [stepId, questId, stepNumber, stepTitle, stepDescription,
    stepLat, stepLng, place.id, questType,
    stop.successCriteria || stop.clues || null, stop.timeMinutes || 5, stop.hint || null]);
```

**Critical Issues**:

**Issue 3.3: Schema Mismatch (FIXED)**
- ✅ We added `activity_type` and `time_minutes` columns
- ✅ INSERT should now work

**Issue 3.4: No Error Handling**
- If step INSERT fails, loop continues
- No logging of which step failed
- Function still returns success even if no steps saved

**Impact**: Quest might be created but have 0 steps (exactly what we're seeing).

**Issue 3.5: Transaction Handling**
- Each `nk.sqlExec` call is a separate transaction
- If quest INSERT succeeds but step INSERT fails, quest exists with no steps
- No rollback mechanism

**Impact**: Partial data creation (quest without steps).

---

## 📋 Part 4: Test Execution Audit

### Test RPC Call Analysis

**File**: `test-integration/test-external-apis.js`
**Function**: `testRpc` (line 127)

```javascript
async function testRpc(session, functionName, payload = {}, expectedSuccess = true) {
    try {
        const payloadString = JSON.stringify(payload);
        const result = await client.rpc(session, functionName, payloadString);
        
        let response;
        if (typeof result.payload === 'string') {
            try {
                response = JSON.parse(result.payload);
            } catch {
                response = { raw: result.payload };
            }
        }
        
        if (expectedSuccess && response.success === false) {
            throw new Error(response.error || 'RPC returned success: false');
        }
        
        return response;
    } catch (error) {
        if (expectedSuccess) {
            throw error;
        }
        return null;
    }
}
```

### Analysis:

**Issue 4.1: Test Only Checks Response, Not Data**
- Test calls RPC and checks if `response.success === true`
- **Does NOT verify data was actually saved to database**
- **Does NOT query database to confirm persistence**

**Impact**: RPC can return `success: true` even if INSERT failed silently.

**Issue 4.2: No Database Verification**
- Tests don't query database after RPC calls
- Tests don't verify quest exists with correct ID
- Tests don't verify steps were created

**Impact**: Tests pass even if data isn't persisted.

**Issue 4.3: Error Handling**
- If RPC throws error, test catches it and throws
- But if RPC returns `success: true` with no data, test passes

**Impact**: Silent failures are not detected.

---

## 📋 Part 5: Nakama SQL Execution Audit

### How `nk.sqlExec` Works

**Key Questions**:
1. Does `nk.sqlExec` auto-commit transactions?
2. Does it throw errors on SQL failures?
3. Does it log errors?

**From Nakama Documentation** (inferred):
- `nk.sqlExec` executes SQL and commits automatically
- Errors are logged but don't throw exceptions by default
- Must check return value or catch errors explicitly

### Analysis:

**Issue 5.1: No Error Checking**
```javascript
nk.sqlExec(`INSERT INTO quests ...`, [...]);
// No error checking - continues even if INSERT fails
```

**Problem**: If INSERT fails (e.g., missing column, constraint violation), function continues.

**Impact**: RPC returns success even if database operation failed.

**Issue 5.2: No Return Value Checking**
- `nk.sqlExec` might return error information
- Code doesn't check return value
- Assumes success if no exception thrown

**Impact**: Silent failures.

---

## 📋 Part 6: Database State Analysis

### Current Database State:

**From Latest Check**:
- ✅ 5 quests (seeded data: `quest_001`, `quest_002`, etc.)
- ✅ 40 places (real data from Google Maps)
- ❌ 0 quest steps
- ❌ 0 achievements
- ❌ 0 user quests
- ❌ 0 user profiles

### Key Observations:

**Observation 1: Places Are Being Saved**
- 40 places exist in database
- This proves:
  - ✅ Database connection works
  - ✅ `nk.sqlExec` works for places
  - ✅ `rpcGetPlacesNearby` is saving data

**Observation 2: Quests Are NOT Being Created**
- No quests with UUID format (our RPCs generate UUIDs)
- Only seeded quests exist
- This suggests:
  - ❌ Quest creation RPCs are NOT executing
  - OR RPCs are executing but failing silently

**Observation 3: Quest Steps Are NOT Being Saved**
- Even seeded quests have 0 steps
- This suggests:
  - ❌ Steps were never created for seeded quests
  - OR steps are being created but not saved

**Observation 4: Achievements Are NOT Being Created**
- 0 achievements total
- Schema was missing columns (now fixed)
- But still no achievements
- This suggests:
  - ❌ Achievement RPCs are NOT executing
  - OR RPCs are executing but failing silently

---

## 🔍 Root Cause Analysis

### Most Likely Causes (Ranked):

#### 1. **Tests Are Not Actually Calling RPCs** (HIGH PROBABILITY)
**Evidence**:
- No quest creation logs in Nakama
- No UUID quests in database
- Tests pass but no data created

**Explanation**:
- Tests might be checking if RPCs exist, not calling them
- OR tests are calling RPCs but with invalid parameters
- OR tests are catching errors and reporting success anyway

**Verification Needed**:
- Check if `client.rpc()` is actually being called
- Check Nakama logs for RPC invocations
- Manually test RPC to verify it works

#### 2. **RPCs Are Executing But Failing Silently** (MEDIUM PROBABILITY)
**Evidence**:
- Places ARE being saved (proves RPCs can work)
- Quests are NOT being saved
- No error logs

**Explanation**:
- Quest creation RPC might be failing at AI generation step
- OR failing at quest INSERT step
- OR failing at step INSERT step
- But returning `success: true` anyway

**Verification Needed**:
- Check Nakama logs for SQL errors
- Add error handling to RPCs
- Check if AI generation is working

#### 3. **Schema Mismatches Causing Silent Failures** (MEDIUM PROBABILITY)
**Evidence**:
- We found missing columns (`activity_type`, `time_minutes`, `reward_xp`, `reward_coins`, `is_group`)
- Fixed them, but still no data

**Explanation**:
- INSERT statements might still have mismatches
- OR other required columns are missing
- OR data type mismatches

**Verification Needed**:
- Compare INSERT statements with actual schema
- Check for all required columns
- Verify data types match

#### 4. **Transaction Rollback** (LOW PROBABILITY)
**Evidence**:
- Places are saved (proves transactions work)
- Quests are not saved

**Explanation**:
- Unlikely - if transactions were rolling back, places wouldn't be saved either

---

## 📋 Part 7: Migration Script Issues

### Critical Problems:

**Problem 7.1: Migration Execution**
- Script uses shell redirection in `docker exec`, which might not work
- Better approach: Use `-e` flag with SQL string, or copy file and execute

**Problem 7.2: No Schema Verification**
- Script doesn't verify columns were actually added
- Should check `information_schema.columns` after each migration

**Problem 7.3: Error Handling**
- Assumes non-zero exit = "tables already exist"
- Doesn't distinguish between "already exists" and "actual error"

**Problem 7.4: Migration Order**
- Runs migrations in file order
- Doesn't check if migrations have dependencies
- Doesn't verify previous migrations succeeded

---

## 📋 Part 8: Implementation Issues

### Quest Creation RPC Issues:

**Issue 8.1: Missing `is_group` in INSERT**
- Code has `isGroup` variable but INSERT doesn't include it
- We added column to schema, but INSERT statement wasn't updated

**Issue 8.2: No Error Handling**
- No try-catch around SQL operations
- No logging of SQL errors
- No verification that INSERT succeeded

**Issue 8.3: No Transaction Management**
- Quest and steps are inserted separately
- If steps fail, quest exists with no steps
- No rollback mechanism

**Issue 8.4: AI Generation Failure Handling**
- If AI generation fails, function returns error
- But if AI generation succeeds but quest INSERT fails, function might still return success

---

## 🎯 Recommended Investigation Steps

### Step 1: Verify RPCs Are Being Called
1. Check Nakama logs for quest creation RPC invocations
2. Add logging to test functions to confirm `client.rpc()` is called
3. Manually call quest creation RPC and verify it works

### Step 2: Verify Schema Matches Code
1. Compare INSERT statements with actual database schema
2. Check for all required columns
3. Verify data types match
4. Check for NOT NULL constraints

### Step 3: Add Error Handling
1. Add try-catch around SQL operations
2. Log SQL errors
3. Check return values from `nk.sqlExec`
4. Verify data was actually inserted

### Step 4: Fix Migration Script
1. Use proper SQL execution method
2. Add schema verification after migrations
3. Check for actual errors, not just exit codes
4. Verify columns were added

### Step 5: Add Database Verification to Tests
1. After calling RPC, query database to verify data exists
2. Check for quest with correct ID
3. Check for quest steps
4. Fail test if data not found

---

## 📊 Summary of Findings

### Migration Script:
- ⚠️ Uses potentially unreliable execution method
- ⚠️ No schema verification
- ⚠️ Poor error handling

### Database Connection:
- ✅ Database exists and is accessible
- ⚠️ Unclear if Nakama migration and manual migrations conflict
- ⚠️ Need to verify Nakama is using correct database

### RPC Implementation:
- ⚠️ Missing `is_group` in quest INSERT
- ⚠️ No error handling for SQL operations
- ⚠️ No verification that data was saved

### Test Implementation:
- ⚠️ Tests only check RPC response, not database
- ⚠️ No database verification
- ⚠️ Silent failures not detected

### Database State:
- ✅ Places are being saved (proves system works)
- ❌ Quests are not being created
- ❌ Steps are not being saved
- ❌ Achievements are not being created

---

## 🎯 Most Likely Root Cause

**Hypothesis**: Tests are calling RPCs, but RPCs are failing silently due to:
1. Missing `is_group` in INSERT statement (causing quest INSERT to fail)
2. No error handling, so failures aren't logged
3. Tests check response but not database, so failures go undetected

**Evidence**:
- Places work (simpler INSERT, no missing columns)
- Quests don't work (more complex, might have schema issues)
- No error logs (silent failures)

**Next Step**: Fix INSERT statement to include `is_group`, add error handling, and verify.

