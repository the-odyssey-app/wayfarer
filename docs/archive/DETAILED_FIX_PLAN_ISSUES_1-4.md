# Detailed Fix Plan: Issues 1-4 - Codebase Audit & Implementation Plan

**Date**: November 9, 2025  
**Scope**: Critical Issues 1-4 from Remaining Issues Fix List  
**Approach**: Explain current state, desired state, and detailed implementation plan (no code)

---

## Executive Summary

This document provides a comprehensive audit of the current test infrastructure and RPC implementations, identifies the root causes of test failures, and outlines a detailed plan to fix issues 1-4. The focus is on understanding **how it works now** vs **how it should work**, then providing a step-by-step plan to bridge the gap.

---

## Issue 1: Quest Creation Tests - Missing Parameters

### Current State Analysis

#### How It Works Now:

**Test File**: `test-integration/test-external-apis.js`

1. **Test Setup**:
   - `testLocation` is defined as a constant object with hardcoded coordinates (line 96-99)
   - `testSession` is initialized in `createTestUser()` function (line 117)
   - Both are module-level variables, accessible to all test functions

2. **Test Functions**:
   - `testCreateQuestFromLocation()` (line 795): Calls `create_quest_from_location` RPC with `questType: 'scavenger'`
   - `testCreateQuestFromLocationScavenger()` (line 841): Also calls `create_quest_from_location` RPC with `questType: 'scavenger'`
   - `testCreateQuestFromLocationMystery()` (line 882): Calls `create_quest_from_location` RPC with `questType: 'mystery'`
   - `testCreateQuestFromLocationSingle()` (line 929): Calls `create_quest_from_location` RPC with `questType: 'single'`

3. **RPC Implementation**:
   - `rpcCreateQuestFromLocation` (line 1175 in `index.js`): Accepts `questType` parameter and handles 'scavenger' and 'mystery', but **rejects 'single'** with error "Unknown quest type"
   - `rpcCreateScavengerQuestFromLocation` (line 1329): Wrapper that sets `questType: 'scavenger'` and calls main function
   - `rpcCreateMysteryQuestFromLocation` (line 1342): Wrapper that sets `questType: 'mystery'` and calls main function
   - `rpcCreateSingleTaskQuestFromLocation` (line 1355): **Separate RPC** that returns a prompt, not a quest

4. **Error Flow**:
   - Tests call `create_quest_from_location` with `questType: 'single'`
   - RPC receives request but doesn't recognize 'single' as valid quest type
   - Returns error: "Unknown quest type: single"
   - Test expects `questId` but gets error instead
   - Test fails with "Missing latitude or longitude" (this is misleading - the real error is the quest type rejection)

#### Root Cause:

1. **Test calls wrong RPC**: Tests use `create_quest_from_location` with `questType: 'single'`, but single task is not a quest type - it's an achievement prompt
2. **Test uses generic RPC**: Tests should use specific wrapper RPCs (`create_scavenger_quest_from_location`, `create_mystery_quest_from_location`) instead of generic one
3. **Misleading error message**: The "Missing latitude or longitude" error suggests parameters aren't being passed, but they are - the real issue is quest type validation

### How It Should Work:

1. **Test Structure**:
   - `testCreateQuestFromLocationScavenger()` should call `create_scavenger_quest_from_location` RPC (not `create_quest_from_location`)
   - `testCreateQuestFromLocationMystery()` should call `create_mystery_quest_from_location` RPC (not `create_quest_from_location`)
   - `testCreateQuestFromLocationSingle()` should call `create_single_task_quest_from_location` RPC and verify prompt return (not quest creation)
   - `testCreateQuestFromLocation()` (basic flow) can use `create_quest_from_location` with `questType: 'scavenger'` OR use `create_scavenger_quest_from_location`

2. **Parameter Flow**:
   - Tests pass `latitude`, `longitude`, `userTags`, `difficulty`, `isGroup`, `maxDistanceKm`
   - RPCs receive parameters and validate them
   - RPCs call Google Maps API to get places
   - RPCs call AI generation functions
   - RPCs save quest to database
   - RPCs return `questId` and quest details

3. **Single Task Flow** (Different from quests):
   - Test calls `create_single_task_quest_from_location`
   - RPC gets place from Google Maps
   - RPC generates prompt via AI
   - RPC returns `prompt`, `place`, and `message` (NOT `questId`)
   - Test verifies prompt is returned (not quest creation)

### Detailed Fix Plan:

#### Step 1.1: Update Test Function Names and RPC Calls

**File**: `test-integration/test-external-apis.js`

1. **`testCreateQuestFromLocation()` (line 795)**:
   - Change RPC call from `create_quest_from_location` to `create_scavenger_quest_from_location`
   - Remove `questType` parameter (wrapper RPC sets it automatically)
   - Keep other parameters: `latitude`, `longitude`, `userTags`, `difficulty`, `isGroup`, `maxDistanceKm`
   - Verify response contains `questId` and `quest.stops` array

2. **`testCreateQuestFromLocationScavenger()` (line 841)**:
   - Change RPC call from `create_quest_from_location` to `create_scavenger_quest_from_location`
   - Remove `questType` parameter
   - Remove `numStops` parameter (wrapper RPC sets it to 10 automatically)
   - Add `isGroup: false` parameter (or make it configurable)
   - Verify response contains `questId` and quest has 10 stops

3. **`testCreateQuestFromLocationMystery()` (line 882)**:
   - Change RPC call from `create_quest_from_location` to `create_mystery_quest_from_location`
   - Remove `questType` parameter
   - Remove `numStops` parameter (wrapper RPC sets it to 10 automatically)
   - Add `isGroup: false` parameter
   - Verify response contains `questId`, `quest.case_overview`, and quest has 10 stops

4. **`testCreateQuestFromLocationSingle()` (line 929)**:
   - Change RPC call from `create_quest_from_location` to `create_single_task_quest_from_location`
   - Remove `questType`, `difficulty`, `numStops` parameters (not applicable)
   - Keep `latitude`, `longitude`, `userTags`, `maxDistanceKm`
   - **Change verification**: Instead of checking for `questId`, check for `prompt` string
   - Verify response contains `prompt`, `place.id`, `place.name`, and `message`
   - Verify prompt is a non-empty string

#### Step 1.2: Verify Test Data Availability

**File**: `test-integration/test-external-apis.js`

1. **Verify `testLocation` is accessible**:
   - Confirm `testLocation` is defined at module level (line 96-99)
   - Confirm it's accessible in all test functions
   - If not, pass it as parameter or ensure it's in scope

2. **Verify `testSession` is initialized**:
   - Confirm `createTestUser()` is called before quest creation tests
   - Confirm `testSession` is set in `createTestUser()` (line 117)
   - Add error handling if `testSession` is null

3. **Add parameter validation in tests**:
   - Log parameters before RPC call for debugging
   - Verify `latitude` and `longitude` are numbers (not strings)
   - Verify `userTags` is an array

#### Step 1.3: Update Error Handling

**File**: `test-integration/test-external-apis.js`

1. **Improve error messages**:
   - Catch RPC errors and extract actual error message
   - Log full error response for debugging
   - Distinguish between "Missing parameters" vs "Quest type error" vs "API error"

2. **Add validation checks**:
   - Before calling RPC, verify `testSession` exists
   - Verify `testLocation.latitude` and `testLocation.longitude` are valid numbers
   - Verify API keys are configured (Google Maps, OpenRouter)

---

## Issue 2: Single Task Prompt - Achievement Type

### Current State Analysis

#### How It Works Now:

**RPC Implementation**: `rpcCreateSingleTaskQuestFromLocation` (line 1355 in `index.js`)

1. **Current Flow**:
   - User calls `create_single_task_quest_from_location` with location and tags
   - RPC gets one place from Google Maps
   - RPC generates prompt via `rpcGenerateSingleTaskPrompt`
   - RPC returns `{ success: true, prompt: "...", place: {...}, message: "..." }`
   - **No quest is created** - this is correct behavior

2. **Test Expectation**:
   - Test expects `questId` in response (line 948)
   - Test expects `quest.title` and `quest.stops` array
   - Test fails because response doesn't contain `questId`

3. **Achievement System**:
   - `achievements` table exists with `achievement_type` column
   - `rpcCreateAchievement` exists (line 4202) but requires `questId` (not applicable for single tasks)
   - No RPC exists to accept single task prompt and create achievement

#### Root Cause:

1. **Conceptual mismatch**: Single task is treated as a quest in tests, but it's actually an achievement prompt
2. **Missing RPC**: No RPC exists to accept the prompt and create an achievement record
3. **Test logic error**: Test verifies quest creation instead of prompt return

### How It Should Work:

1. **Single Task Flow**:
   - User requests single task prompt → `create_single_task_quest_from_location` → Returns prompt + place
   - User reviews prompt and place
   - User accepts prompt → `accept_single_task_achievement` → Creates achievement record
   - User completes task → `complete_single_task_achievement` → Marks achievement as completed, awards XP

2. **Achievement Record Structure**:
   - `achievement_type = 'single_task'`
   - `quest_id = null` (single tasks are not quests)
   - `description = prompt text`
   - `reward_xp = 25` (or configurable)
   - Optional: Link to `place_id` via metadata or separate table

3. **Test Flow**:
   - Test calls `create_single_task_quest_from_location` → Verifies prompt is returned
   - Test calls `accept_single_task_achievement` → Verifies achievement is created
   - Test calls `complete_single_task_achievement` → Verifies achievement is completed and XP awarded

### Detailed Fix Plan:

#### Step 2.1: Create New RPC - Accept Single Task Achievement

**File**: `wayfarer-nakama/nakama-data/modules/index.js`

1. **Function**: `rpcAcceptSingleTaskAchievement`
   - **Input**: `{ prompt: string, placeId: string, latitude: number, longitude: number }`
   - **Process**:
     - Validate user is authenticated
     - Validate prompt and placeId are provided
     - Create achievement record with `achievement_type = 'single_task'`
     - Set `quest_id = null` (single tasks are not quests)
     - Set `description = prompt`
     - Set `reward_xp = 25` (or from config)
     - Optionally store place_id in metadata or separate field
   - **Output**: `{ success: true, achievementId: string, message: "Single task accepted" }`

2. **Function**: `rpcCompleteSingleTaskAchievement`
   - **Input**: `{ achievementId: string, completionProof?: string }`
   - **Process**:
     - Validate user is authenticated
     - Verify achievement exists and belongs to user
     - Verify achievement is not already completed
     - Mark achievement as completed (add `completed_at` timestamp)
     - Award XP to user profile
     - Update user's total XP and level if threshold reached
   - **Output**: `{ success: true, xpAwarded: number, newLevel?: number }`

#### Step 2.2: Register New RPCs

**File**: `wayfarer-nakama/nakama-data/modules/index.js` (in `InitModule`)

1. Add registration:
   - `initializer.registerRpc('accept_single_task_achievement', rpcAcceptSingleTaskAchievement)`
   - `initializer.registerRpc('complete_single_task_achievement', rpcCompleteSingleTaskAchievement)`

#### Step 2.3: Update Test for Single Task

**File**: `test-integration/test-external-apis.js`

1. **`testCreateQuestFromLocationSingle()` (line 929)**:
   - Change to `testCreateSingleTaskPrompt()`
   - Call `create_single_task_quest_from_location` RPC
   - Verify response contains `prompt` (string), `place.id`, `place.name`
   - Verify prompt is non-empty and doesn't contain template variables
   - Store prompt and place for next test

2. **New Test**: `testAcceptSingleTaskAchievement()`
   - Call `accept_single_task_achievement` with prompt and place from previous test
   - Verify response contains `achievementId`
   - Verify achievement exists in database (via `get_user_achievements` RPC)

3. **New Test**: `testCompleteSingleTaskAchievement()`
   - Call `complete_single_task_achievement` with achievementId
   - Verify response contains `xpAwarded`
   - Verify user's XP increased
   - Verify achievement is marked as completed

#### Step 2.4: Update Database Schema (if needed)

**File**: Database migration (if `achievements` table needs updates)

1. **Check if `achievements` table supports single tasks**:
   - Verify `achievement_type` can be 'single_task'
   - Verify `quest_id` can be null (for single tasks)
   - Verify `description` field can store prompt text
   - Add `completed_at` timestamp if not exists
   - Add `place_id` field or metadata column if needed

---

## Issue 3: OpenRouter API Tests - Missing Locations Array

### Current State Analysis

#### How It Works Now:

**Test File**: `test-integration/test-external-apis.js`

1. **Test Functions**:
   - `testOpenRouterMysteryPrompt()` (line 375): Creates hardcoded locations array with 2 locations
   - `testOpenRouterSingleTaskPrompt()` (line 419): Calls RPC with only `tags` (no locations - correct for single task)
   - `testOpenRouterScavengerHunt()` (line 453): Creates hardcoded locations array with 2 locations

2. **RPC Implementations**:
   - `rpcGenerateMysteryPrompt` (line 890): Requires `locations` array in payload
   - `rpcGenerateSingleTaskPrompt` (line 1028): Requires only `tags` (no locations - correct)
   - `rpcGenerateScavengerHunt` (line 800+): Requires `locations` array in payload

3. **Error Flow**:
   - Tests call AI generation RPCs directly
   - Some tests provide hardcoded locations (works but not realistic)
   - Some tests don't provide locations (fails with "Locations array is required")
   - Tests don't use real places from Google Maps API

#### Root Cause:

1. **Hardcoded test data**: Tests use fake coordinates instead of real places from Google Maps
2. **Direct RPC calls**: Tests call AI generation RPCs directly instead of using quest creation RPCs (which handle place fetching)
3. **Inconsistent test approach**: Some tests provide locations, others don't

### How It Should Work:

1. **Test Flow**:
   - Get real places from Google Maps API first
   - Use real place data (coordinates, names) for AI generation
   - Call AI generation RPCs with real locations
   - Verify AI generates quest content based on real places

2. **Alternative Approach**:
   - Skip direct AI generation tests (they're tested via quest creation)
   - Focus on end-to-end quest creation tests (which test AI generation indirectly)
   - Keep direct AI tests only for error handling and edge cases

### Detailed Fix Plan:

#### Step 3.1: Update Test to Use Real Places

**File**: `test-integration/test-external-apis.js`

1. **`testOpenRouterMysteryPrompt()` (line 375)**:
   - Before calling AI RPC, call `get_places_nearby` to get real places
   - Extract locations from places response
   - Format locations as `[{ location: { lat, lng }, place_id }]`
   - Pass formatted locations to `generate_mystery_prompt` RPC
   - Verify response contains quest with stops matching locations

2. **`testOpenRouterScavengerHunt()` (line 453)**:
   - Before calling AI RPC, call `get_places_nearby` to get real places
   - Extract locations from places response
   - Format locations as `[{ lat, lng, name }]`
   - Pass formatted locations to `generate_scavenger_hunt` RPC
   - Verify response contains quest with stops matching locations

3. **`testOpenRouterSingleTaskPrompt()` (line 419)**:
   - Keep as-is (single task doesn't need locations)
   - Verify it only requires `tags` parameter

#### Step 3.2: Alternative - Skip Direct AI Tests

**File**: `test-integration/test-external-apis.js`

1. **Option**: Mark direct AI generation tests as "integration tested via quest creation"
   - Keep tests but mark them as "covered by end-to-end tests"
   - Focus on error handling tests (invalid input, missing API key)
   - Remove happy path tests (covered by quest creation tests)

2. **Rationale**:
   - Quest creation tests already verify AI generation works
   - Direct AI tests are redundant
   - Focus test suite on user-facing flows

#### Step 3.3: Add Error Handling Tests

**File**: `test-integration/test-external-apis.js`

1. **Test missing locations**:
   - Call `generate_mystery_prompt` without locations
   - Verify error: "Locations array is required"

2. **Test invalid locations**:
   - Call `generate_scavenger_hunt` with empty locations array
   - Verify error: "Locations array is required"

3. **Test missing API key**:
   - Temporarily disable API key (if possible)
   - Verify error: "AI service not configured"

---

## Issue 4: Test Data Flow - Missing IDs and Parameters

### Current State Analysis

#### How It Works Now:

**Test File**: `test-integration/test-runner.js`

1. **Test Data Storage**:
   - `testUsers[]`: Array of user objects with `id`, `username`, `session`, `location`
   - `testQuests[]`: Array of quest objects with `id`, `user`, `steps[]`, `placeIds[]`
   - `testPlaces[]`: Array of place objects with `id`, `name`, `latitude`, `longitude`
   - `testGroups[]`: Array of party objects with `partyId`, `leader`, `members[]`
   - `testEvents[]`: Array of event objects
   - `testItems[]`: Array of item objects

2. **Data Seeding** (`seedFixtures()` function, line 291):
   - Gets places from Google Maps API
   - Creates one quest via `create_quest_from_location` (but uses wrong RPC name - line 316)
   - Gets available quests from database
   - Fetches quest details to get steps
   - Populates `testQuests[]` and `testPlaces[]`

3. **Test Functions**:
   - Many tests check `if (testQuests.length === 0)` and skip if empty
   - Tests use `testQuests[0]` to get first quest
   - Tests extract IDs from quest objects: `quest.id || quest.quest_id || quest.questId`
   - Tests pass IDs to subsequent RPCs

4. **Problem Areas**:
   - `testGetQuestDetail()` (line 669): Uses `testQuests[0]` but quest might not have valid ID
   - `testStartQuest()` (line 692): Uses `quest.id || quest.quest_id || quest.questId` (inconsistent ID field names)
   - `testSubmitRating()` (line 933): Uses quest but quest might not be completed
   - `testDiscoverItems()` (line 1200+): Doesn't use real location from places
   - `testGetAudioExperiences()` (line 1300+): Doesn't use real placeId or questId

#### Root Cause:

1. **Inconsistent data structure**: Quest objects have different ID field names (`id`, `quest_id`, `questId`)
2. **Missing data relationships**: Tests don't maintain relationships between quests, steps, places, users
3. **Incomplete seeding**: `seedFixtures()` creates quests but doesn't ensure they have steps, or that steps are linked to places
4. **No data flow**: Tests don't follow proper flow (create → start → complete → rate)

### How It Should Work:

1. **Data Structure**:
   - Standardize quest object: `{ id, title, user, steps: [{ id, step_number, place_id, ... }], placeIds: [...] }`
   - Standardize place object: `{ id, name, latitude, longitude, address }`
   - Maintain relationships: quest → steps → places

2. **Data Seeding**:
   - Get places from Google Maps API
   - Create quests using quest creation RPCs (scavenger, mystery)
   - Verify quests have steps
   - Verify steps are linked to places
   - Store quests, steps, and places in test data arrays
   - Create parties with real quest IDs
   - Create items at real places

3. **Test Flow**:
   - Tests use real IDs from seeded data
   - Tests follow proper flow: create → start → complete → rate
   - Tests maintain state: started quests, completed quests, rated quests
   - Tests use real place IDs for location-based features

### Detailed Fix Plan:

#### Step 4.1: Standardize Test Data Structures

**File**: `test-integration/test-runner.js`

1. **Quest Object Structure**:
   ```javascript
   {
     id: string,              // Always use 'id' (not quest_id or questId)
     title: string,
     user: userObject,
     steps: [
       {
         id: string,
         step_number: number,
         place_id: string,
         latitude: number,
         longitude: number,
         title: string
       }
     ],
     placeIds: [string],      // Array of place IDs from steps
     started: boolean,        // Track if quest is started
     completed: boolean,      // Track if quest is completed
     rated: boolean           // Track if quest is rated
   }
   ```

2. **Place Object Structure**:
   ```javascript
   {
     id: string,
     name: string,
     latitude: number,
     longitude: number,
     address: string,
     types: [string]
   }
   ```

3. **Helper Functions**:
   - `getQuestById(id)`: Find quest in `testQuests[]` by ID
   - `getPlaceById(id)`: Find place in `testPlaces[]` by ID
   - `getQuestWithSteps(id)`: Get quest and ensure it has steps (fetch if needed)

#### Step 4.2: Fix Data Seeding

**File**: `test-integration/test-runner.js` (`seedFixtures()` function, line 291)

1. **Fix RPC Call** (line 316):
   - Change from `create_quest_from_location` to `create_scavenger_quest_from_location`
   - Add `isGroup: false` parameter
   - Remove `questType` and `numStops` (wrapper RPC sets them)

2. **Verify Quest Has Steps**:
   - After creating quest, call `get_quest_detail` to get steps
   - Verify steps array is not empty
   - Verify steps have `place_id` values
   - Store steps in quest object

3. **Create Multiple Quest Types**:
   - Create one scavenger quest (10 stops)
   - Create one mystery quest (10 stops)
   - Create one solo quest (for single user tests)
   - Create one group quest (for party tests)

4. **Populate Places Array**:
   - Extract place IDs from quest steps
   - Fetch place details from database or Google Maps
   - Store places in `testPlaces[]` array
   - Deduplicate places (same place can be in multiple quests)

5. **Create Test Parties**:
   - Use real quest IDs from created quests
   - Create parties with `create_party` RPC
   - Store party IDs in `testGroups[]` array

#### Step 4.3: Update Tests to Use Real Data

**File**: `test-integration/test-runner.js`

1. **Quest Detail Test** (line 669):
   - Use `getQuestById()` helper to find quest
   - Verify quest has valid ID
   - Call `get_quest_detail` with quest ID
   - Update quest object with steps if not already present

2. **Start Quest Test** (line 692):
   - Use standardized `quest.id` (not `quest.quest_id` or `quest.questId`)
   - Verify quest is not already started
   - Call `start_quest` with `quest_id: quest.id`
   - Mark quest as `started: true` in test data

3. **Complete Step Test** (line 723):
   - Use quest from test data (ensure it's started)
   - Get step from `quest.steps[0]`
   - Use step ID and place coordinates
   - Mark step as completed in quest object

4. **Complete Quest Test** (line 772):
   - Use quest from test data (ensure all steps are completed)
   - Call `complete_quest` with quest ID
   - Mark quest as `completed: true` in test data

5. **Submit Rating Test** (line 933):
   - Use quest from test data (ensure it's completed)
   - Verify quest is not already rated
   - Call `submit_rating` with quest ID
   - Mark quest as `rated: true` in test data

6. **Discover Items Test** (line 1200+):
   - Use real place from `testPlaces[]` array
   - Use place coordinates for location
   - Call `discover_items` with place coordinates
   - Store discovered items in `testItems[]` array

7. **Audio Experiences Test** (line 1300+):
   - Use real place ID from `testPlaces[]` array
   - OR use real quest ID from `testQuests[]` array
   - Call `get_audio_experiences` with placeId or questId
   - Verify audio experiences are returned

#### Step 4.4: Create Helper Functions

**File**: `test-integration/test-runner.js`

1. **`async function createTestQuest(user, questType, isGroup)`**:
   - Call appropriate quest creation RPC
   - Verify quest is created with steps
   - Fetch quest details to get steps
   - Store quest in `testQuests[]` array
   - Return quest object

2. **`async function getTestPlace(user, radiusKm)`**:
   - Call `get_places_nearby` with user location
   - Return first place from results
   - Store place in `testPlaces[]` array if not already present

3. **`function getQuestById(questId)`**:
   - Search `testQuests[]` array for quest with matching ID
   - Return quest object or null

4. **`function getPlaceById(placeId)`**:
   - Search `testPlaces[]` array for place with matching ID
   - Return place object or null

5. **`async function ensureQuestHasSteps(quest)`**:
   - Check if quest has steps array
   - If not, call `get_quest_detail` to fetch steps
   - Update quest object with steps
   - Return quest object

6. **`async function startTestQuest(quest, user)`**:
   - Verify quest is not already started
   - Call `start_quest` RPC
   - Mark quest as started in test data
   - Return success status

7. **`async function completeTestQuest(quest, user)`**:
   - Verify quest is started
   - Complete all steps
   - Call `complete_quest` RPC
   - Mark quest as completed in test data
   - Return success status

#### Step 4.5: Update Test Execution Order

**File**: `test-integration/test-runner.js` (`runTests()` function, line 2584)

1. **Ensure Proper Test Order**:
   - Create users → Seed fixtures → Test quest creation → Test quest operations
   - Quest operations must follow: detail → start → complete steps → complete quest → rate
   - Party tests must run after quests are created (parties need quest IDs)
   - Item tests must run after places are discovered
   - Audio tests must run after places/quests are available

2. **Add Dependencies**:
   - Mark tests as dependent on previous tests
   - Skip tests if prerequisites are not met
   - Log warnings if test data is missing

---

## Implementation Priority

### Phase 1: Critical Fixes (Immediate)
1. **Issue 1**: Fix quest creation test RPC calls (1-2 hours)
2. **Issue 2**: Create single task achievement RPCs (2-3 hours)
3. **Issue 3**: Update OpenRouter tests to use real places (1-2 hours)

### Phase 2: Data Flow Fixes (Short Term)
4. **Issue 4**: Standardize test data structures (2-3 hours)
5. **Issue 4**: Fix data seeding (2-3 hours)
6. **Issue 4**: Update tests to use real data (3-4 hours)

### Phase 3: Polish (Medium Term)
7. Add helper functions for test data management
8. Add comprehensive error handling
9. Add test data validation
10. Document test data flow

---

## Expected Outcomes

### After Phase 1:
- Quest creation tests pass (4 tests fixed)
- Single task tests pass (1 test fixed, 2 new tests added)
- OpenRouter tests pass (3 tests fixed)
- **Total**: +8 tests passing (105/155 = 67.7%)

### After Phase 2:
- All quest-related tests pass (10+ tests fixed)
- All location-based tests pass (5+ tests fixed)
- All party tests pass (5+ tests fixed)
- **Total**: +20 tests passing (125/155 = 80.6%)

### After Phase 3:
- Test suite is maintainable and extensible
- Test data flow is clear and documented
- Helper functions reduce code duplication
- **Total**: 80%+ success rate maintained

---

## Risk Assessment

### Low Risk:
- Fixing test RPC calls (Issue 1)
- Updating test data structures (Issue 4, Step 4.1)

### Medium Risk:
- Creating new RPCs (Issue 2) - requires database schema verification
- Fixing data seeding (Issue 4, Step 4.2) - might affect other tests

### High Risk:
- Updating all tests to use real data (Issue 4, Step 4.3) - large change, might introduce new bugs
- Changing test execution order (Issue 4, Step 4.5) - might break existing test dependencies

### Mitigation:
- Test each fix incrementally
- Run test suite after each change
- Keep backup of working test files
- Document all changes

---

## Success Criteria

1. ✅ All quest creation tests pass
2. ✅ Single task achievement flow works end-to-end
3. ✅ OpenRouter API tests use real places
4. ✅ Test data is standardized and consistent
5. ✅ Tests follow proper data flow (create → use → verify)
6. ✅ Test suite success rate is 80%+
7. ✅ Test code is maintainable and well-documented

---

## Notes

- This plan focuses on **explanation** not **implementation**
- All code changes should be made incrementally
- Test after each change to verify it works
- Document any deviations from this plan
- Update this document as implementation progresses

