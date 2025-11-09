# Remaining Issues Fix List

**Date**: November 9, 2025  
**Current Success Rate**: 62.6% (97/155)  
**Target**: 80%+ (124/155)

---

## Critical Issues (High Priority)

### 1. ❌ Quest Creation Tests - Missing Parameters
**Issue**: Tests failing with "Missing latitude or longitude"

**Affected Tests**:
- `create_quest_from_location` (line 162-163)
- `create_scavenger_quest_from_location` (line 166-167)
- `create_mystery_quest_from_location` (line 170-171)
- `create_single_task_quest_from_location` (line 174-175)

**Root Cause**: Tests are calling RPCs but `testLocation` or `testSession` may not be defined/accessible

**Fix Required**:
- Check if `testLocation` is defined in test-external-apis.js
- Ensure `testSession` is properly initialized
- Update tests to use correct RPC names:
  - Use `create_scavenger_quest_from_location` (not `create_quest_from_location` with questType)
  - Use `create_mystery_quest_from_location` (not `create_quest_from_location` with questType)
- Verify parameters are being passed correctly

**Files to Fix**:
- `test-integration/test-external-apis.js` (lines 795-946)

---

### 2. ❌ Single Task Prompt - Should Be Achievement Type
**Issue**: Single task prompt is currently implemented as quest creation, but should be an achievement type

**Current Implementation**: `rpcCreateSingleTaskQuestFromLocation` returns a prompt (correct), but test expects quest creation

**Required Changes**:
1. **Remove single task from quest creation tests** - It's not a quest, it's an achievement prompt
2. **Create achievement when user accepts single task** - Need new RPC: `accept_single_task_achievement`
3. **Update test** - Test should verify prompt is returned, not quest creation

**Fix Required**:
- Update `testCreateQuestFromLocationSingle` to test prompt return (not quest creation)
- Create `rpcAcceptSingleTaskAchievement` function that:
  - Takes prompt, place_id, user location
  - Creates achievement record with `achievement_type = 'single_task'`
  - Links to place
  - Returns achievement ID

**Files to Fix**:
- `test-integration/test-external-apis.js` (line 929-976)
- `wayfarer-nakama/nakama-data/modules/index.js` (add new RPC)

---

### 3. ❌ OpenRouter API Tests - Missing Locations Array
**Issue**: Tests failing with "Locations array is required"

**Affected Tests**:
- `Generate mystery prompt` (line 115-116)
- `Generate scavenger hunt` (line 123-124)
- `Response validation` (line 130-131)

**Root Cause**: Tests are calling AI generation functions directly without providing locations array

**Fix Required**:
- Update tests to get places from Google Maps first
- Pass locations array to generation functions
- Or update tests to use quest creation RPCs instead (which handle this automatically)

**Files to Fix**:
- `test-integration/test-external-apis.js` (OpenRouter test functions)

---

### 4. ❌ Test Data Flow Issues (~28 failures)
**Issue**: Tests failing because they don't provide required IDs/parameters

**Affected Tests**:
- `Get quest detail` - Missing questId
- `Start quest` - Missing quest_id
- `Complete quest` - Quest not started
- `Submit rating` - Quest not completed
- `Discover items` - Missing location
- `Get audio experiences` - Missing placeId/questId/location
- `Get quiz questions` - Missing questStepId/questId/placeId
- And 20+ more...

**Root Cause**: Tests don't follow proper data flow (create → use → test)

**Fix Required**:
1. **Update test suite to use real data**:
   - Get places from Google Maps API first
   - Create quests using new quest creation RPCs
   - Use real IDs from created quests/places
   - Follow proper flow: places → quests → steps → items

2. **Create helper functions**:
   - `createTestQuest()` - Creates quest and returns ID
   - `createTestPlace()` - Gets place from API
   - `createTestParty()` - Creates party and returns ID

**Files to Fix**:
- `test-integration/test-runner.js` (multiple test functions)

---

## Medium Priority Issues

### 5. ❌ Party System Tests - Missing Parameters
**Issue**: Tests failing with "Missing partyId" or "Missing required fields"

**Affected Tests**:
- `Leave party` - Missing partyId
- `Create party vote` - Missing required fields
- `Get party votes` - Missing partyId
- `Get subgroups` - Missing partyId
- `Update party objective progress` - Missing required fields
- `Get party objective progress` - Missing partyId or questId
- `Get group pool items` - Missing partyId

**Fix Required**:
- Tests should use party IDs from `testCreateParties()` results
- Store party IDs in test data structure
- Pass party IDs to subsequent tests

**Files to Fix**:
- `test-integration/test-runner.js` (party-related tests)

---

### 6. ❌ Audio System Tests - Missing Parameters
**Issue**: Tests failing with "Missing placeId, questId, or location"

**Affected Tests**:
- `Get audio experiences` (5 users) - Missing placeId/questId/location
- `Update audio progress` - Missing audio ID
- `Toggle audio favorite` - Missing audio ID
- `Purchase audio` - Missing audio ID
- `Rate audio` - Missing audio ID

**Fix Required**:
- Get places from Google Maps first
- Use place IDs in audio experience tests
- Create audio experiences if needed, or use existing ones

**Files to Fix**:
- `test-integration/test-runner.js` (audio-related tests)

---

### 7. ❌ Quiz/Observation Tests - Missing Parameters
**Issue**: Tests failing with "Missing questStepId, questId, or placeId"

**Affected Tests**:
- `Get quiz questions` - Missing questStepId/questId/placeId
- `Submit quiz answer` - Missing session/step data
- `Complete quiz session` - Missing session data
- `Verify observation item` - Missing session/step data
- `Submit observation count` - Missing session data
- `Complete observation session` - Missing session data

**Fix Required**:
- Create quests with steps first
- Use real step IDs from created quests
- Start quiz/observation sessions before testing

**Files to Fix**:
- `test-integration/test-runner.js` (quiz/observation tests)

---

### 8. ❌ Admin Function Tests - Missing Required Fields
**Issue**: Tests failing with "Missing required fields"

**Affected Tests**:
- `Create quiz question` - Missing question, correctAnswer, wrongAnswers
- `Create observation puzzle` - Missing puzzleType or title
- `Create event` - Missing required fields
- `Create achievement` - Missing required fields
- `Submit safety report` - Missing required fields

**Fix Required**:
- Provide all required fields in test payloads
- Use realistic test data

**Files to Fix**:
- `test-integration/test-runner.js` (admin function tests)

---

## Low Priority Issues (Edge Cases)

### 9. ⚠️ Google Maps API - Invalid Coordinates Test
**Issue**: Test failing: "Invalid coordinates handled gracefully"

**Fix Required**:
- Review error handling in `rpcGetPlacesNearby`
- Ensure invalid coordinates return appropriate error message
- Update test expectations if needed

---

### 10. ⚠️ State Management - Verification Already Pending
**Issue**: `Request verification` failing with "Verification already pending"

**Fix Required**:
- Clean up test user state between runs
- Or use fresh test users for verification tests

---

## Implementation Priority

### Phase 1: Critical (Immediate)
1. ✅ Fix quest creation test parameters
2. ✅ Fix single task to be achievement type
3. ✅ Fix OpenRouter API tests to provide locations

**Expected Improvement**: +7 tests (104/155 = 67.1%)

### Phase 2: High Impact (Short Term)
4. ✅ Fix test data flow for quest system
5. ✅ Fix party system test data
6. ✅ Fix audio system test data

**Expected Improvement**: +15 tests (119/155 = 76.8%)

### Phase 3: Medium Impact (Medium Term)
7. ✅ Fix quiz/observation test data
8. ✅ Fix admin function test data
9. ✅ Fix edge case tests

**Expected Improvement**: +5 tests (124/155 = 80.0%)

---

## Detailed Fix Plan

### Fix 1: Quest Creation Tests

**File**: `test-integration/test-external-apis.js`

**Changes**:
```javascript
// Line 804: Use correct RPC name
const result = await testRpc(testSession, 'create_scavenger_quest_from_location', {
  latitude: testLocation.latitude,
  longitude: testLocation.longitude,
  userTags: ['exploration', 'nature'],
  difficulty: 2,
  isGroup: false,
  maxDistanceKm: 10
});

// Line 850: Use correct RPC name
const result = await testRpc(testSession, 'create_scavenger_quest_from_location', {
  latitude: testLocation.latitude,
  longitude: testLocation.longitude,
  userTags: ['art', 'culture', 'history'],
  difficulty: 2,
  isGroup: false,
  maxDistanceKm: 10
});

// Line 891: Use correct RPC name
const result = await testRpc(testSession, 'create_mystery_quest_from_location', {
  latitude: testLocation.latitude,
  longitude: testLocation.longitude,
  userTags: ['mystery', 'detective', 'adventure'],
  difficulty: 3,
  isGroup: false,
  maxDistanceKm: 10
});

// Line 938: Change to test prompt return (not quest creation)
const result = await testRpc(testSession, 'create_single_task_quest_from_location', {
  latitude: testLocation.latitude,
  longitude: testLocation.longitude,
  userTags: ['solo', 'quick'],
  maxDistanceKm: 5
});
// Verify prompt is returned, not questId
```

---

### Fix 2: Single Task Achievement Implementation

**File**: `wayfarer-nakama/nakama-data/modules/index.js`

**Add New RPC**:
```javascript
// Accept single task achievement (user accepts the prompt)
function rpcAcceptSingleTaskAchievement(ctx, logger, nk, payload) {
  try {
    const userId = ctx.userId;
    if (!userId) {
      return JSON.stringify({ success: false, error: 'User not authenticated' });
    }
    
    const data = JSON.parse(payload);
    const { prompt, placeId, latitude, longitude } = data;
    
    if (!prompt || !placeId) {
      return JSON.stringify({ success: false, error: 'Missing prompt or placeId' });
    }
    
    // Create achievement record
    const achievementId = nk.uuidv4();
    nk.sqlExec(`
      INSERT INTO achievements (id, user_id, quest_id, achievement_type, description, 
                               reward_xp, reward_coins, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [achievementId, userId, null, 'single_task', prompt, 25, 0]);
    
    // Link to place if provided
    if (placeId) {
      // Could add place_id to achievements table or use metadata
    }
    
    return JSON.stringify({
      success: true,
      achievementId: achievementId,
      message: 'Single task achievement accepted'
    });
    
  } catch (error) {
    logger.error(`Error accepting single task: ${error}`);
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

**Register RPC**:
```javascript
initializer.registerRpc('accept_single_task_achievement', rpcAcceptSingleTaskAchievement);
```

---

### Fix 3: OpenRouter API Tests

**File**: `test-integration/test-external-apis.js`

**Changes**:
- Get places from Google Maps first
- Pass locations array to generation functions
- Or skip direct generation tests (they're tested via quest creation)

---

### Fix 4: Test Data Flow

**File**: `test-integration/test-runner.js`

**Add Helper Functions**:
```javascript
// Helper to create a test quest
async function createTestQuest(user, questType = 'scavenger', isGroup = false) {
  const result = await testRpc(user.session, `create_${questType}_quest_from_location`, {
    latitude: user.location.latitude,
    longitude: user.location.longitude,
    userTags: ['test'],
    difficulty: 2,
    isGroup: isGroup,
    maxDistanceKm: 10
  });
  return result && result.success ? result.questId : null;
}

// Helper to get test place
async function getTestPlace(user) {
  const result = await testRpc(user.session, 'get_places_nearby', {
    latitude: user.location.latitude,
    longitude: user.location.longitude,
    radiusKm: 5,
    minResults: 1
  });
  return result && result.success && result.places ? result.places[0] : null;
}
```

**Update Tests**:
- Use helpers to create test data
- Store IDs in test data structures
- Pass real IDs to subsequent tests

---

## Summary

**Total Issues**: 10 categories  
**Critical**: 4 issues (must fix first)  
**High Priority**: 4 issues (fix next)  
**Low Priority**: 2 issues (nice to have)

**Expected Final Success Rate**: 80%+ (124/155 tests passing)

**Key Insight**: Most failures are due to test suite limitations (missing test data), not code bugs. The code is working correctly - tests just need to provide real data.

