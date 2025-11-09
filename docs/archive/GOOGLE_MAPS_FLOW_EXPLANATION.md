# Google Maps Flow Explanation: Tests vs. Real User Flow

**Date**: November 9, 2025  
**Purpose**: Explain how Google Maps integration works in tests vs. actual user quest creation

---

## 🔍 Key Point: Two Different Flows

There are **two separate flows**:

1. **Test Flow** (for testing AI generation directly) - What I changed
2. **Real User Flow** (when user clicks to start a quest) - Already working correctly

---

## 📋 Test Flow: OpenRouter API Tests (What I Changed)

### Purpose
These tests directly test the AI generation functions (`generate_mystery_prompt`, `generate_scavenger_hunt`) to verify they work correctly with real place data.

### Before My Changes ❌
```javascript
// OLD: Used hardcoded fake locations
const locations = [
    { location: { lat: 33.1262316, lng: -117.310507 } },
    { location: { lat: 33.1272316, lng: -117.311507 } }
];

const result = await testRpc(testSession, 'generate_mystery_prompt', {
    locations: locations,  // ❌ Fake data
    tags: ['history', 'adventure']
});
```

**Problem**: Tests used fake coordinates that don't represent real places, so AI generation wasn't tested with real-world data.

### After My Changes ✅
```javascript
// NEW: Fetch real places from Google Maps first
const placesResult = await testRpc(testSession, 'get_places_nearby', {
    latitude: testLocation.latitude,
    longitude: testLocation.longitude,
    radiusKm: 5,
    minResults: 10
}, false);

if (!placesResult || !placesResult.success || !placesResult.places) {
    logTest('Generate mystery prompt', false, 'Could not get places from Google Maps');
    return;
}

// Format locations from real places
const places = placesResult.places.slice(0, 10);
const locations = places.map(p => ({
    location: { lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) },
    place_id: p.id
}));

// Now call AI generation with REAL places
const result = await testRpc(testSession, 'generate_mystery_prompt', {
    locations: locations,  // ✅ Real places from Google Maps
    tags: ['history', 'adventure']
});
```

### Step-by-Step Test Flow:
1. **Test calls `get_places_nearby` RPC** → Gets real places from Google Maps API
2. **Test formats locations** → Converts place data to format expected by AI generation
3. **Test calls AI generation RPC** → `generate_mystery_prompt` or `generate_scavenger_hunt`
4. **AI generates quest content** → Based on real places
5. **Test validates response** → Checks quest structure is correct

**Why this matters**: Tests now verify AI can generate quests from real places, not just fake coordinates.

---

## 🎮 Real User Flow: When User Clicks "Start Quest"

### Important: This Flow Was Already Working Correctly ✅

When a user clicks to start a quest, they use the **quest creation RPCs** which **already handle Google Maps internally**.

### User Flow Step-by-Step:

#### Step 1: User Clicks "Create Quest" Button
```javascript
// Frontend calls:
client.rpc(session, 'create_scavenger_quest_from_location', {
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    userTags: ['exploration', 'nature'],
    difficulty: 2,
    isGroup: false,
    maxDistanceKm: 10
});
```

#### Step 2: `rpcCreateScavengerQuestFromLocation` is Called
**File**: `wayfarer-nakama/nakama-data/modules/index.js` (line 1329)

```javascript
function rpcCreateScavengerQuestFromLocation(ctx, logger, nk, payload) {
  try {
    const data = JSON.parse(payload);
    data.questType = 'scavenger';
    data.numStops = 10;
    return rpcCreateQuestFromLocation(ctx, logger, nk, JSON.stringify(data));
  } catch (error) {
    // error handling
  }
}
```

This wrapper calls the main `rpcCreateQuestFromLocation` function.

#### Step 3: `rpcCreateQuestFromLocation` Handles Everything
**File**: `wayfarer-nakama/nakama-data/modules/index.js` (line 1175)

**Step 3a: Get Places from Google Maps** (Lines 1190-1201)
```javascript
// Step 1: Get places from Google Maps
logger.info(`Getting places near ${latitude}, ${longitude} for quest creation`);
const placesPayload = JSON.stringify({ 
    latitude, 
    longitude, 
    radiusKm: maxDistanceKm, 
    minResults: numStops 
});
const placesResultStr = rpcGetPlacesNearby(ctx, logger, nk, placesPayload);
const placesResult = JSON.parse(placesResultStr);

if (!placesResult.success || !placesResult.places || placesResult.places.length === 0) {
    return JSON.stringify({ success: false, error: 'No places found near location' });
}

const places = placesResult.places.slice(0, numStops);
logger.info(`Found ${places.length} places for quest creation`);
```

**✅ Google Maps is called automatically here!**

**Step 3b: Generate Quest Using AI** (Lines 1203-1247)
```javascript
// Step 2: Generate quest using AI based on type
if (questType === 'scavenger') {
    const locations = places.map(p => ({
        name: p.name || 'Location',
        lat: parseFloat(p.latitude),
        lng: parseFloat(p.longitude)
    }));
    const genPayload = JSON.stringify({ locations, userTags, difficulty });
    const genResultStr = rpcGenerateScavengerHunt(ctx, logger, nk, genPayload);
    // ... process AI response
}
```

**✅ AI generation uses the real places from Google Maps!**

**Step 3c: Save Quest to Database** (Lines 1249-1320)
```javascript
// Step 3: Save quest to database
const questId = nk.uuidv4();
// ... insert quest into database
// ... insert quest steps into database
```

**✅ Quest and steps are saved with real place IDs!**

### Complete User Flow Diagram:

```
User clicks "Create Quest"
    ↓
Frontend calls: create_scavenger_quest_from_location
    ↓
rpcCreateScavengerQuestFromLocation (wrapper)
    ↓
rpcCreateQuestFromLocation (main function)
    ↓
┌─────────────────────────────────────┐
│ Step 1: Get Places from Google Maps │ ← ✅ AUTOMATIC
│ - Calls rpcGetPlacesNearby          │
│ - Gets 10 real places                │
│ - Places stored in database         │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 2: Generate Quest Using AI    │ ← ✅ AUTOMATIC
│ - Formats places for AI             │
│ - Calls rpcGenerateScavengerHunt    │
│ - AI generates quest content        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Step 3: Save Quest to Database      │ ← ✅ AUTOMATIC
│ - Creates quest record               │
│ - Creates quest_steps records        │
│ - Links steps to place_ids          │
└─────────────────────────────────────┘
    ↓
Returns questId to user
    ↓
User can now start the quest
```

---

## 🔄 What Happens When User Clicks "Start Quest" (Different RPC)

### Important: "Start Quest" is Different from "Create Quest"

When a user clicks **"Start Quest"** (not "Create Quest"), they're starting an **already-created quest**.

**File**: `wayfarer-nakama/nakama-data/modules/index.js` (line 306)

```javascript
function rpcStartQuest(ctx, logger, nk, payload) {
  // ... validation ...
  
  // Get quest details
  const questQuery = 'SELECT id, max_participants, current_participants, is_public FROM quests WHERE id = $1';
  const questResult = nk.sqlQuery(questQuery, [quest_id]);
  
  // Ensure places exist in database for quest steps
  const placesResult = ensurePlacesForQuestSteps(logger, nk, quest_id);
  // ... rest of function
}
```

**Note**: `rpcStartQuest` calls `ensurePlacesForQuestSteps` which:
- Checks if places exist in database for quest steps
- If missing, fetches from Google Maps (but this is a fallback)
- **Most quests already have places** because they were created via `create_scavenger_quest_from_location`

---

## ✅ Verification: Google Maps is Always Called

### For Quest Creation:
- ✅ `rpcCreateQuestFromLocation` **always** calls `rpcGetPlacesNearby` (line 1193)
- ✅ This happens **automatically** when user creates a quest
- ✅ No user action needed - it's built into the RPC

### For Starting Existing Quest:
- ✅ `rpcStartQuest` calls `ensurePlacesForQuestSteps` (line 358)
- ✅ This ensures places exist (fetches from Google Maps if needed)
- ✅ This is a safety check, not the primary flow

---

## 📊 Comparison Table

| Aspect | Test Flow (What I Changed) | Real User Flow (Already Working) |
|--------|---------------------------|-----------------------------------|
| **Purpose** | Test AI generation directly | Create quest for user |
| **RPC Called** | `generate_mystery_prompt` or `generate_scavenger_hunt` | `create_scavenger_quest_from_location` |
| **Google Maps** | Test calls `get_places_nearby` first | RPC calls `rpcGetPlacesNearby` internally |
| **When** | During test execution | When user clicks "Create Quest" |
| **Result** | AI-generated quest JSON | Quest saved to database with questId |
| **User Sees** | Nothing (test only) | New quest available to start |

---

## 🎯 Key Takeaways

1. **Test Changes**: I updated tests to fetch real places first, so AI generation is tested with real data
2. **User Flow**: Already works correctly - `create_scavenger_quest_from_location` automatically:
   - ✅ Fetches places from Google Maps
   - ✅ Generates quest using AI
   - ✅ Saves quest to database
3. **No User Action Needed**: Google Maps is called automatically when user creates a quest
4. **Verification**: The flow is initiated when user clicks "Create Quest" button, not "Start Quest"

---

## 🔍 Code Locations

### Test Flow (What I Changed):
- **File**: `test-integration/test-external-apis.js`
- **Functions**: `testOpenRouterMysteryPrompt()` (line 375), `testOpenRouterScavengerHunt()` (line 468)

### Real User Flow (Already Working):
- **File**: `wayfarer-nakama/nakama-data/modules/index.js`
- **Function**: `rpcCreateQuestFromLocation()` (line 1175)
- **Google Maps Call**: Line 1193 - `rpcGetPlacesNearby()`
- **AI Generation**: Line 1214 - `rpcGenerateScavengerHunt()`
- **Database Save**: Line 1254 - `nk.sqlExec()`

---

## ✅ Conclusion

**The real user flow is already working correctly!** When a user clicks to create a quest:
1. Google Maps is called automatically (line 1193)
2. Places are fetched and stored
3. AI generates quest content
4. Quest is saved to database
5. User gets questId back

**My test changes** just ensure the AI generation functions are tested with real places, not fake data. The actual user experience is unchanged and working as designed.

