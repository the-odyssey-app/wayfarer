# 🔧 Implementation Fixes Required

**Status**: CRITICAL - Core functionality missing  
**Priority**: URGENT - Must complete before any testing  
**Estimated Time**: 2-3 hours

---

## 1. IMPLEMENT start_quest RPC

**Location**: `wayfarer-nakama/nakama-data/modules/index.js`  
**Priority**: CRITICAL  
**Time**: 30 minutes

### Issue
Frontend calls `await callRpc('start_quest', { quest_id: quest.id })` but this RPC doesn't exist.

### Template Code to Add

```javascript
// Start quest RPC function
function rpcStartQuest(ctx, logger, nk, payload) {
  try {
    logger.info('Start quest RPC called');
    
    // Get user ID from context
    const userId = ctx.userId;
    if (!userId) {
      logger.error('No user ID in context');
      return JSON.stringify({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    // Parse the payload
    const data = JSON.parse(payload);
    const { quest_id } = data;
    
    if (!quest_id) {
      logger.error('Missing quest_id in payload');
      return JSON.stringify({ 
        success: false, 
        error: 'Missing quest_id' 
      });
    }
    
    // Check if quest exists
    const questQuery = 'SELECT id FROM quests WHERE id = $1';
    const questResult = nk.sqlQuery(questQuery, [quest_id]);
    
    if (!questResult || questResult.length === 0) {
      logger.error(`Quest ${quest_id} not found`);
      return JSON.stringify({ 
        success: false, 
        error: 'Quest not found' 
      });
    }
    
    // Check if user already has this quest active
    const existingQuery = 'SELECT id, status FROM user_quests WHERE user_id = $1 AND quest_id = $2';
    const existingResult = nk.sqlQuery(existingQuery, [userId, quest_id]);
    
    let userQuestId;
    if (existingResult && existingResult.length > 0) {
      // Update existing user_quest
      userQuestId = existingResult[0].id;
      const updateQuery = 'UPDATE user_quests SET status = $1, started_at = NOW() WHERE id = $2';
      nk.sqlExec(updateQuery, ['active', userQuestId]);
      logger.info(`Updated user_quest ${userQuestId} to active`);
    } else {
      // Create new user_quest record
      userQuestId = nk.uuidv4();
      const insertQuery = `
        INSERT INTO user_quests (id, user_id, quest_id, status, progress, started_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
      `;
      nk.sqlExec(insertQuery, [userQuestId, userId, quest_id, 'active', 0]);
      logger.info(`Created new user_quest ${userQuestId} for user ${userId}`);
    }
    
    return JSON.stringify({ 
      success: true, 
      message: 'Quest started successfully',
      user_quest_id: userQuestId
    });
    
  } catch (error) {
    logger.error(`Error starting quest: ${error}`);
    return JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
```

### Registration
Add to `InitModule` function:
```javascript
initializer.registerRpc('start_quest', rpcStartQuest);
```

---

## 2. IMPLEMENT complete_quest RPC

**Location**: `wayfarer-nakama/nakama-data/modules/index.js`  
**Priority**: CRITICAL  
**Time**: 45 minutes

### Issue
Frontend calls `await callRpc('complete_quest', { quest_id: quest.id })` but this RPC doesn't exist.

### Template Code to Add

```javascript
// Complete quest RPC function
function rpcCompleteQuest(ctx, logger, nk, payload) {
  try {
    logger.info('Complete quest RPC called');
    
    // Get user ID from context
    const userId = ctx.userId;
    if (!userId) {
      logger.error('No user ID in context');
      return JSON.stringify({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    // Parse the payload
    const data = JSON.parse(payload);
    const { quest_id } = data;
    
    if (!quest_id) {
      logger.error('Missing quest_id in payload');
      return JSON.stringify({ 
        success: false, 
        error: 'Missing quest_id' 
      });
    }
    
    // Get quest details (need xp_reward)
    const questQuery = 'SELECT id, xp_reward FROM quests WHERE id = $1';
    const questResult = nk.sqlQuery(questQuery, [quest_id]);
    
    if (!questResult || questResult.length === 0) {
      logger.error(`Quest ${quest_id} not found`);
      return JSON.stringify({ 
        success: false, 
        error: 'Quest not found' 
      });
    }
    
    const quest = questResult[0];
    const xpReward = quest.xp_reward || 100;
    
    // Check if user has this quest active
    const userQuestQuery = 'SELECT id FROM user_quests WHERE user_id = $1 AND quest_id = $2 AND status = $3';
    const userQuestResult = nk.sqlQuery(userQuestQuery, [userId, quest_id, 'active']);
    
    if (!userQuestResult || userQuestResult.length === 0) {
      logger.error(`User ${userId} does not have active quest ${quest_id}`);
      return JSON.stringify({ 
        success: false, 
        error: 'Quest not active for this user' 
      });
    }
    
    // Update user_quests status to completed
    const userQuestId = userQuestResult[0].id;
    const updateQuestQuery = 'UPDATE user_quests SET status = $1, progress = $2, completed_at = NOW(), updated_at = NOW() WHERE id = $3';
    nk.sqlExec(updateQuestQuery, ['completed', 100, userQuestId]);
    
    // Get user's current metadata to update XP
    const accountQuery = 'SELECT user_id, metadata FROM users WHERE id = $1';
    const accountResult = nk.sqlQuery(accountQuery, [userId]);
    
    let currentXp = 0;
    let currentLevel = 1;
    
    if (accountResult && accountResult.length > 0) {
      const account = accountResult[0];
      if (account.metadata) {
        const metadata = JSON.parse(account.metadata);
        currentXp = metadata.xp || 0;
        currentLevel = metadata.level || 1;
      }
    }
    
    // Calculate new XP and level
    const newXp = currentXp + xpReward;
    const newLevel = Math.floor(newXp / 100) + 1;
    
    // Update user metadata with new XP and level
    const newMetadata = {
      xp: newXp,
      level: newLevel,
      last_quest_completed: quest_id,
      last_quest_completed_at: new Date().toISOString()
    };
    
    nk.accountUpdateId(userId, null, null, null, null, null, newMetadata);
    
    logger.info(`User ${userId} completed quest ${quest_id}. XP: ${currentXp} → ${newXp}, Level: ${currentLevel} → ${newLevel}`);
    
    return JSON.stringify({ 
      success: true, 
      message: 'Quest completed successfully',
      xp_reward: xpReward,
      total_xp: newXp,
      new_level: newLevel,
      level_up: newLevel > currentLevel
    });
    
  } catch (error) {
    logger.error(`Error completing quest: ${error}`);
    return JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
```

### Registration
Add to `InitModule` function:
```javascript
initializer.registerRpc('complete_quest', rpcCompleteQuest);
```

---

## 3. IMPLEMENT get_user_quests RPC

**Location**: `wayfarer-nakama/nakama-data/modules/index.js`  
**Priority**: HIGH  
**Time**: 30 minutes

### Issue
No RPC to retrieve user's quest progress and history.

### Template Code to Add

```javascript
// Get user's quests RPC function
function rpcGetUserQuests(ctx, logger, nk, payload) {
  try {
    logger.info('Get user quests RPC called');
    
    // Get user ID from context
    const userId = ctx.userId;
    if (!userId) {
      logger.error('No user ID in context');
      return JSON.stringify({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }
    
    // Query user's quests with details
    const query = `
      SELECT 
        uq.id as user_quest_id,
        uq.quest_id,
        uq.status,
        uq.progress,
        uq.started_at,
        uq.completed_at,
        q.title,
        q.description,
        q.xp_reward,
        q.difficulty
      FROM user_quests uq
      JOIN quests q ON uq.quest_id = q.id
      WHERE uq.user_id = $1
      ORDER BY uq.updated_at DESC
    `;
    
    const result = nk.sqlQuery(query, [userId]);
    
    logger.info(`Found ${result.length} quests for user ${userId}`);
    
    return JSON.stringify({ 
      success: true, 
      quests: result,
      count: result.length
    });
    
  } catch (error) {
    logger.error(`Error getting user quests: ${error}`);
    return JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
```

### Registration
Add to `InitModule` function:
```javascript
initializer.registerRpc('get_user_quests', rpcGetUserQuests);
```

---

## 4. FIX MapComponent.tsx SYNTAX ERROR

**File**: `apps/mobile/src/components/MapComponent.tsx`  
**Line**: 79-107  
**Priority**: CRITICAL  
**Time**: 10 minutes

### Issue
Missing opening brace after `try` statement on line 80.

### CURRENT CODE (WRONG):
```typescript
const fetchQuests = async () => {
  try // ❌ MISSING BRACE HERE
    setLoadingQuests(true);
    
    // Only fetch quests if we have a valid session
    if (!isConnected) {
      return;
    }
    
    // Pass location data if available for location-based filtering
    const payload = location
      ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          maxDistanceKm: 10,
        }
      : undefined;
    
    const result = await callRpc('get_available_quests', payload);
    
    if (result.success) {
      setQuests(result.quests || []);
    }
  } catch (error) {
    console.error('Error fetching quests:', error);
  } finally {
    setLoadingQuests(false);
  }
};
```

### FIXED CODE:
```typescript
const fetchQuests = async () => {
  try { // ✅ ADDED OPENING BRACE
    setLoadingQuests(true);
    
    // Only fetch quests if we have a valid session
    if (!isConnected) {
      return;
    }
    
    // Pass location data if available for location-based filtering
    const payload = location
      ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          maxDistanceKm: 10,
        }
      : undefined;
    
    const result = await callRpc('get_available_quests', payload);
    
    if (result.success) {
      setQuests(result.quests || []);
    }
  } catch (error) {
    console.error('Error fetching quests:', error);
  } finally {
    setLoadingQuests(false);
  }
};
```

---

## 5. REMOVE HARDCODED MAPBOX TOKEN

**File**: `apps/mobile/src/components/MapComponent.tsx`  
**Line**: 16  
**Priority**: MEDIUM (Security)  
**Time**: 10 minutes

### Issue
Mapbox token hardcoded as fallback value - security risk.

### CURRENT CODE (VULNERABLE):
```typescript
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 
  'pk.eyJ1IjoidGhla2V5bWFzdGVyIiwiYSI6ImNtYWxjbmZtMDA3amEya3ByY2s5emdsOWsifQ.ibbwzXSyGrIIWIAZhjl1gQ';
  // ⚠️ Hardcoded token visible in source
```

### FIXED CODE:
```typescript
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (!mapboxToken) {
  console.error('Mapbox token not configured. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN environment variable.');
}
```

### Environment Setup
Create `.env.local` file in `apps/mobile/`:
```bash
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_actual_token_here
```

---

## 6. UPDATE InitModule Registration

**File**: `wayfarer-nakama/nakama-data/modules/index.js`  
**Lines**: 119-128  
**Priority**: CRITICAL  
**Time**: 5 minutes

### CURRENT CODE:
```javascript
// Initialize the runtime module
function InitModule(ctx, logger, nk, initializer) {
  logger.info('Wayfarer JavaScript Runtime Module initialized');

  // Register RPC functions
  initializer.registerRpc('test_function', rpcTestFunction);
  initializer.registerRpc('update_user_location', rpcUpdateUserLocation);
  initializer.registerRpc('get_available_quests', rpcGetAvailableQuests);

  logger.info('RPC functions registered: test_function, update_user_location, get_available_quests');
}
```

### FIXED CODE:
```javascript
// Initialize the runtime module
function InitModule(ctx, logger, nk, initializer) {
  logger.info('Wayfarer JavaScript Runtime Module initialized');

  // Register RPC functions
  initializer.registerRpc('test_function', rpcTestFunction);
  initializer.registerRpc('update_user_location', rpcUpdateUserLocation);
  initializer.registerRpc('get_available_quests', rpcGetAvailableQuests);
  initializer.registerRpc('start_quest', rpcStartQuest);           // ✅ NEW
  initializer.registerRpc('complete_quest', rpcCompleteQuest);     // ✅ NEW
  initializer.registerRpc('get_user_quests', rpcGetUserQuests);    // ✅ NEW

  logger.info('RPC functions registered: test_function, update_user_location, get_available_quests, start_quest, complete_quest, get_user_quests');
}
```

---

## 7. VERIFY DATABASE IS INITIALIZED

**File**: `wayfarer-nakama/create_quest_tables.sql`  
**Priority**: HIGH  
**Time**: 5 minutes

### Check if tables exist:
```bash
# SSH into VPS
ssh root@5.181.218.160

# Connect to CockroachDB
docker exec -it wayfarer-nakama-cockroachdb-1 cockroach sql --insecure

# Run this query:
USE nakama;
SHOW TABLES;
```

### If tables don't exist, create them:
```bash
# Copy SQL file to container
docker cp wayfarer-nakama/create_quest_tables.sql wayfarer-nakama-cockroachdb-1:/tmp/

# Execute SQL
docker exec -i wayfarer-nakama-cockroachdb-1 cockroach sql --insecure < /tmp/create_quest_tables.sql
```

### Verify tables and data:
```sql
USE nakama;
SELECT COUNT(*) as quest_count FROM quests;
SELECT COUNT(*) as user_quest_count FROM user_quests;
```

---

## 8. DEPLOY AND TEST

**Time**: 30-60 minutes

### Step 1: Update Backend
```bash
# SSH into VPS
ssh root@5.181.218.160
cd ~/wayfarer/wayfarer-nakama

# Back up current modules
cp nakama-data/modules/index.js nakama-data/modules/index.js.backup

# Copy updated file or edit in place
# ... add the new RPC functions ...

# Restart Nakama
docker compose restart nakama

# Check logs
docker compose logs nakama -f
```

### Step 2: Deploy Mobile App
```bash
cd apps/mobile

# Update app.json with correct tokens
# Create .env.local with EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN

# Build development app
npm run build

# Or use GitHub Actions for automatic builds
```

### Step 3: Test End-to-End Flow
1. Login to mobile app
2. Wait for map to load (allow location permissions)
3. Tap "View Quests" button
4. See quest list
5. Tap a quest to view details
6. **Click "Join Quest"** → Should see success alert ✅
7. **Click "Complete Quest"** → Should see XP earned alert ✅
8. Check user XP/Level increased ✅

---

## 9. INTEGRATION TEST CHECKLIST

**Time**: 2 hours

- [ ] User can login
- [ ] User can see map with quest markers
- [ ] User can see quest list
- [ ] **NEW: User can click "Join Quest" and it succeeds** 🔴
- [ ] **NEW: Quest status changes to "active"** 🔴
- [ ] **NEW: User can click "Complete Quest" and it succeeds** 🔴
- [ ] **NEW: User receives XP notification** 🔴
- [ ] **NEW: User level increases** 🔴
- [ ] **NEW: Quest status changes to "completed"** 🔴
- [ ] User cannot complete quest twice
- [ ] User cannot complete quest not yet started
- [ ] XP calculation correct (matches quest xp_reward)
- [ ] Level calculation correct (floor(xp/100)+1)
- [ ] Multiple quests work correctly
- [ ] Mapbox renders correctly (requires dev build)

---

## 📋 DEPLOYMENT CHECKLIST

Before releasing:

- [ ] All 3 new RPC functions implemented and registered
- [ ] MapComponent.tsx syntax error fixed
- [ ] Hardcoded Mapbox token removed
- [ ] Environment variables properly configured
- [ ] Database tables verified in production
- [ ] End-to-end test flow completed
- [ ] Security review completed (no hardcoded credentials)
- [ ] Performance tested (multiple quests, multiple users)
- [ ] Error handling tested (invalid quest IDs, etc.)
- [ ] Nakama logs reviewed for errors

---

## 🚨 ROLLBACK PROCEDURE

If something goes wrong:

```bash
# Revert Nakama backend
ssh root@5.181.218.160
cd ~/wayfarer/wayfarer-nakama

# Restore backup
cp nakama-data/modules/index.js.backup nakama-data/modules/index.js

# Restart
docker compose restart nakama

# Verify
docker compose logs nakama | tail -20
```

---

**Total Estimated Time**: 2-3 hours  
**Difficulty**: Medium  
**Risk Level**: Low (fixes isolated, can rollback)
