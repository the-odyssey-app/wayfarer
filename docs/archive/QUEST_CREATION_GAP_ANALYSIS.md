# Quest Creation Gap Analysis

**Date**: November 9, 2025  
**Status**: Missing End-to-End Quest Creation RPCs

---

## Current State

### ✅ What We Have

1. **Google Maps API Integration** ✅
   - `get_places_nearby` - Returns real places from Google Maps API
   - Places stored in database
   - Working correctly (16 places found in tests)

2. **AI Quest Generation Functions** ✅
   - `generate_scavenger_hunt` - Generates quest JSON from locations array
   - `generate_mystery_prompt` - Generates mystery quest prompt
   - `generate_single_task_prompt` - Generates single task prompt
   - All use OpenRouter API

3. **Quest Management Functions** ✅
   - `start_quest` - Starts a quest for a user
   - `complete_quest` - Completes a quest
   - `get_quest_detail` - Gets quest details
   - `get_available_quests` - Lists available quests

### ❌ What's Missing

**End-to-End Quest Creation RPCs** (404 Not Found):
- `create_quest_from_location` - Should create quest from location using Google Maps + AI
- `create_scavenger_quest_from_location` - Should create scavenger hunt quest
- `create_mystery_quest_from_location` - Should create mystery quest
- `create_single_task_quest_from_location` - Should create single task quest

---

## The Gap

### Current Flow (Broken)
```
1. Get places from Google Maps ✅
2. Generate quest JSON from AI ✅
3. ❌ MISSING: Save quest to database
4. ❌ MISSING: Create quest steps
5. Start quest ❌ (fails - no quest in database)
6. Complete quest ❌ (fails - quest not started)
7. Submit rating ❌ (fails - quest not completed)
```

### Required Flow (Complete)
```
1. Get places from Google Maps ✅
2. Generate quest JSON from AI ✅
3. ✅ NEW: Save quest to database
4. ✅ NEW: Create quest steps with place_ids
5. ✅ Start quest (now works - quest exists)
6. ✅ Complete quest (now works - quest started)
7. ✅ Submit rating (now works - quest completed)
```

---

## What Needs to Be Built

### 1. `create_quest_from_location` RPC

**Purpose**: End-to-end quest creation from a location

**Flow**:
1. Get places near location using `get_places_nearby` (or use existing places)
2. Call `generate_scavenger_hunt` with places
3. **Save quest to `quests` table**
4. **Create quest steps in `quest_steps` table**
5. **Link steps to places via `place_id`**
6. Return quest ID and details

**Parameters**:
```javascript
{
  latitude: number,
  longitude: number,
  questType: 'scavenger' | 'mystery' | 'single_task',
  userTags: string[],
  difficulty: 1-3,
  numStops: number,
  maxDistanceKm: number
}
```

**Returns**:
```javascript
{
  success: true,
  questId: string,
  quest: {
    id: string,
    title: string,
    steps: [...]
  }
}
```

### 2. `create_scavenger_quest_from_location` RPC

**Purpose**: Create scavenger hunt quest specifically

**Flow**: Same as above, but hardcoded to `questType: 'scavenger'`

### 3. `create_mystery_quest_from_location` RPC

**Purpose**: Create mystery quest specifically

**Flow**: 
1. Get places near location
2. Call `generate_mystery_prompt` with places
3. Save quest and steps to database
4. Return quest ID

### 4. `create_single_task_quest_from_location` RPC

**Purpose**: Create single task quest specifically

**Flow**:
1. Get places near location
2. Call `generate_single_task_prompt` with first place
3. Save quest and single step to database
4. Return quest ID

---

## Implementation Details

### Database Schema (Already Exists)

**`quests` table**:
- `id` (UUID)
- `title` (string)
- `description` (text)
- `location_lat`, `location_lng` (coordinates)
- `radius_meters` (number)
- `difficulty` (1-3)
- `xp_reward` (number)
- `creator_id` (user ID)
- `is_public` (boolean)
- `max_participants` (number)
- `created_at` (timestamp)

**`quest_steps` table**:
- `id` (UUID)
- `quest_id` (UUID, FK)
- `step_number` (integer)
- `title` (string)
- `description` (text)
- `latitude`, `longitude` (coordinates)
- `place_id` (UUID, FK to places)
- `activity_type` (string)
- `success_criteria` (text)
- `time_minutes` (number)
- `hint` (text)
- `created_at` (timestamp)

### Key Functions to Use

1. **Get Places**: `rpcGetPlacesNearby` (already exists)
2. **Generate Quest**: `rpcGenerateScavengerHunt`, `rpcGenerateMysteryPrompt`, `rpcGenerateSingleTaskPrompt` (already exist)
3. **Save Quest**: Need to implement database insertion
4. **Save Steps**: Need to implement database insertion

---

## Example Implementation Pattern

```javascript
function rpcCreateQuestFromLocation(ctx, logger, nk, payload) {
  try {
    const userId = ctx.userId;
    if (!userId) return JSON.stringify({ success: false, error: 'User not authenticated' });
    
    const data = JSON.parse(payload);
    const { latitude, longitude, questType = 'scavenger', userTags = [], 
            difficulty = 2, numStops = 5, maxDistanceKm = 5 } = data;
    
    // Step 1: Get places from Google Maps
    const placesResult = await rpcGetPlacesNearby(ctx, logger, nk, JSON.stringify({
      latitude, longitude, radiusKm: maxDistanceKm
    }));
    const places = JSON.parse(placesResult).places || [];
    
    if (places.length === 0) {
      return JSON.stringify({ success: false, error: 'No places found near location' });
    }
    
    // Step 2: Generate quest using AI
    let questJson;
    if (questType === 'scavenger') {
      const locations = places.slice(0, numStops).map(p => ({
        name: p.name,
        lat: p.latitude,
        lng: p.longitude
      }));
      const genResult = await rpcGenerateScavengerHunt(ctx, logger, nk, JSON.stringify({
        locations, userTags, difficulty
      }));
      questJson = JSON.parse(genResult).quest;
    } else if (questType === 'mystery') {
      // Similar for mystery
    } else if (questType === 'single_task') {
      // Similar for single task
    }
    
    // Step 3: Save quest to database
    const questId = nk.uuidv4();
    nk.sqlExec(`
      INSERT INTO quests (id, title, description, location_lat, location_lng, 
                          radius_meters, difficulty, xp_reward, creator_id, 
                          is_public, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `, [questId, questJson.title, questJson.theme, latitude, longitude, 
        500, difficulty, 100, userId, true]);
    
    // Step 4: Save quest steps to database
    for (let i = 0; i < questJson.stops.length; i++) {
      const stop = questJson.stops[i];
      const place = places[i];
      const stepId = nk.uuidv4();
      
      nk.sqlExec(`
        INSERT INTO quest_steps (id, quest_id, step_number, title, description,
                                 latitude, longitude, place_id, activity_type,
                                 success_criteria, time_minutes, hint, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      `, [stepId, questId, stop.stopNumber, stop.activity, stop.activity,
          stop.location.lat, stop.location.lng, place.id, 'scavenger',
          stop.successCriteria, stop.timeMinutes, stop.hint || null]);
    }
    
    return JSON.stringify({
      success: true,
      questId: questId,
      quest: {
        id: questId,
        title: questJson.title,
        steps: questJson.stops.map((stop, i) => ({
          ...stop,
          place_id: places[i]?.id
        }))
      }
    });
    
  } catch (error) {
    logger.error(`Error creating quest: ${error}`);
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

---

## Impact on Tests

### Current Test Failures (Will Be Fixed)

1. **`create_quest_from_location`** - 404 → ✅ Will work
2. **`create_scavenger_quest_from_location`** - 404 → ✅ Will work
3. **`create_mystery_quest_from_location`** - 404 → ✅ Will work
4. **`create_single_task_quest_from_location`** - 404 → ✅ Will work
5. **`start_quest`** - Missing quest_id → ✅ Will work (quests will exist)
6. **`complete_quest`** - Quest not started → ✅ Will work (can start first)
7. **`submit_rating`** - Quest not completed → ✅ Will work (can complete first)

### Expected Test Improvement

**Before**: 97/155 (62.6%)  
**After**: ~104/155 (67.1%)  
**Improvement**: +7 tests passing

---

## Next Steps

1. **Implement `create_quest_from_location`** - Main function
2. **Implement type-specific variants** - Scavenger, mystery, single task
3. **Register RPCs** - Add to `InitModule`
4. **Test end-to-end flow** - Verify quest creation → start → complete → rate
5. **Update test suite** - Tests should now pass

---

## Priority

**HIGH** - This is the missing link that prevents the full quest flow from working. Without these RPCs, users cannot create quests from locations, which is a core feature.

---

## Dependencies

- ✅ Google Maps API (working)
- ✅ OpenRouter API (working)
- ✅ Database schema (exists)
- ✅ AI generation functions (exist)
- ❌ Quest creation RPCs (need to implement)

