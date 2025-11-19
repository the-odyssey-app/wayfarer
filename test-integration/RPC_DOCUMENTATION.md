# RPC Function Documentation

**Generated:** 2025-11-15  
**Purpose:** Complete reference for all RPC functions including expected inputs, outputs, and test requirements.

---

## Table of Contents

- [Quest System](#quest-system)
- [Party/Group System](#partygroup-system)
- [Achievement System](#achievement-system)
- [Inventory/Items](#inventoryitems)
- [Trading System](#trading-system)
- [Events System](#events-system)
- [Audio Experiences](#audio-experiences)
- [Social/Matching](#socialmatching)
- [Safety/Moderation](#safetymoderation)
- [Verification](#verification)
- [Mini-Games](#mini-games)
- [Progression](#progression)
- [Location Services](#location-services)
- [Rating System](#rating-system)

---

## Quest System

### `update_user_location` ⚠️ CRITICAL - UNTESTED
**Category:** Location Services  
**Priority:** Critical  
**Status:** ❌ Untested

**Input:**
```json
{
  "latitude": 33.1262316,
  "longitude": -117.310507
}
```

**Output:**
```json
{
  "success": true,
  "message": "Location updated"
}
```

**Test Requirements:**
- Valid coordinates
- Invalid coordinates (should fail)
- Missing parameters (should fail)

---

### `get_available_quests` ✅ TESTED
**Category:** Quest System  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{
  "latitude": 33.1262316,
  "longitude": -117.310507,
  "radius": 5000,
  "maxDistanceKm": 5
}
```

**Output:**
```json
{
  "success": true,
  "quests": [
    {
      "id": "quest-uuid",
      "title": "Quest Title",
      "description": "Quest description",
      "latitude": 33.1262316,
      "longitude": -117.310507,
      "radius_meters": 100,
      "difficulty": "medium",
      "xp_reward": 100,
      "status": "available",
      "user_status": "available"
    }
  ],
  "count": 1
}
```

---

### `start_quest` ✅ TESTED
**Category:** Quest System  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{
  "quest_id": "quest-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "user_quest": {
    "id": "user-quest-uuid",
    "user_id": "user-uuid",
    "quest_id": "quest-uuid",
    "status": "active",
    "started_at": "2025-11-15T16:00:00Z"
  }
}
```

**Test Requirements:**
- Valid quest_id
- Quest must be available
- User must not already have active quest
- Invalid quest_id (should fail)

---

### `complete_quest` ✅ TESTED
**Category:** Quest System  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{
  "quest_id": "quest-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "xp_awarded": 100,
  "items_awarded": []
}
```

---

### `get_user_quests` ⚠️ HIGH PRIORITY - UNTESTED
**Category:** Quest System  
**Priority:** High  
**Status:** ❌ Untested

**Input:**
```json
{
  "status": "active" // optional: "active", "completed", "abandoned"
}
```

**Output:**
```json
{
  "success": true,
  "quests": [
    {
      "id": "user-quest-uuid",
      "quest_id": "quest-uuid",
      "status": "active",
      "progress": 0.5,
      "started_at": "2025-11-15T16:00:00Z"
    }
  ]
}
```

---

### `generate_scavenger_hunt` ✅ TESTED
**Category:** Quest System  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{
  "latitude": 33.1262316,
  "longitude": -117.310507,
  "preferences": {
    "difficulty": "medium"
  }
}
```

**Output:**
```json
{
  "success": true,
  "quest": {
    "id": "quest-uuid",
    "type": "scavenger_hunt",
    "title": "Scavenger Hunt",
    "stops": [
      {
        "index": 0,
        "coordinates": {
          "latitude": 33.1262316,
          "longitude": -117.310507
        }
      }
    ]
  }
}
```

**Test Requirements:**
- Requires OPENROUTER_API_KEY
- Should generate 10-step quest
- Valid location required

---

### `generate_mystery_prompt` ⚠️ HIGH PRIORITY - UNTESTED
**Category:** Quest System  
**Priority:** High  
**Status:** ❌ Untested

**Input:**
```json
{
  "latitude": 33.1262316,
  "longitude": -117.310507
}
```

**Output:**
```json
{
  "success": true,
  "quest": {
    "id": "quest-uuid",
    "type": "mystery",
    "title": "Mystery Quest",
    "description": "Mystery description"
  }
}
```

**Test Requirements:**
- Requires OPENROUTER_API_KEY

---

### `generate_single_task_prompt` ✅ TESTED
**Category:** Quest System  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{
  "latitude": 33.1262316,
  "longitude": -117.310507
}
```

**Output:**
```json
{
  "success": true,
  "quest": {
    "id": "quest-uuid",
    "type": "single_task",
    "title": "Single Task"
  }
}
```

---

### `get_quest_detail` ✅ TESTED
**Category:** Quest System  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{
  "questId": "quest-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "quest": {
    "id": "quest-uuid",
    "title": "Quest Title",
    "description": "Description",
    "steps": [
      {
        "index": 0,
        "coordinates": {
          "latitude": 33.1262316,
          "longitude": -117.310507
        }
      }
    ]
  }
}
```

---

### `complete_step` ✅ TESTED
**Category:** Quest System  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{
  "quest_id": "quest-uuid",
  "step_index": 0
}
```

**Output:**
```json
{
  "success": true,
  "step_completed": true,
  "progress": 0.1
}
```

---

### `submit_step_media` ⚠️ HIGH PRIORITY - UNTESTED
**Category:** Quest System  
**Priority:** High  
**Status:** ❌ Untested

**Input:**
```json
{
  "questId": "quest-uuid",
  "stepId": "step-uuid",
  "mediaType": "photo",
  "mediaUrl": "https://example.com/photo.jpg",
  "textContent": "Optional text"
}
```

**Output:**
```json
{
  "success": true,
  "mediaId": "media-uuid"
}
```

**Test Requirements:**
- Requires step to exist
- If step requires observation, observation must be completed first
- Valid mediaType: "photo", "video", "text"

---

### `upload_photo` ⚠️ UNTESTED
**Category:** Uncategorized  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "photoData": "base64-encoded-image",
  "contentType": "image/jpeg",
  "fileName": "photo.jpg"
}
```

**Output:**
```json
{
  "success": true,
  "url": "https://storage.example.com/photo.jpg",
  "key": "photo-key",
  "etag": "etag-value"
}
```

**Test Requirements:**
- Requires MINIO configuration
- Base64 encoded image data
- Valid content type

---

### `get_quest_participants` ⚠️ UNTESTED
**Category:** Quest System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "questId": "quest-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "participants": [
    {
      "user_id": "user-uuid",
      "username": "username",
      "status": "active",
      "progress": 0.5
    }
  ]
}
```

---

## Party/Group System

### `create_party` ✅ TESTED
**Category:** Party/Group System  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{
  "quest_id": "quest-uuid",
  "maxMembers": 4
}
```

**Output:**
```json
{
  "success": true,
  "party": {
    "id": "party-uuid",
    "code": "ABC123",
    "quest_id": "quest-uuid",
    "leader_id": "user-uuid"
  }
}
```

---

### `join_party` ✅ TESTED
**Category:** Party/Group System  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{
  "party_code": "ABC123"
}
```

**Output:**
```json
{
  "success": true,
  "party": {
    "id": "party-uuid",
    "members": []
  }
}
```

---

### `leave_party` ✅ TESTED
**Category:** Party/Group System  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{
  "party_id": "party-uuid"
}
```

**Output:**
```json
{
  "success": true
}
```

---

### `get_party_members` ✅ TESTED
**Category:** Party/Group System  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{
  "party_id": "party-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "members": [
    {
      "user_id": "user-uuid",
      "username": "username",
      "role": "leader"
    }
  ]
}
```

---

### `create_party_vote` ⚠️ CRITICAL - UNTESTED
**Category:** Party/Group System  
**Priority:** Critical  
**Status:** ❌ Untested

**Input:**
```json
{
  "partyId": "party-uuid",
  "voteType": "decision",
  "title": "Vote Title",
  "description": "Vote description",
  "options": ["Option 1", "Option 2"],
  "expiresInMinutes": 30
}
```

**Output:**
```json
{
  "success": true,
  "voteId": "vote-uuid"
}
```

**Test Requirements:**
- User must be party member
- At least 2 options required
- Valid voteType

---

### `cast_vote` ⚠️ UNTESTED
**Category:** Party/Group System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "voteId": "vote-uuid",
  "optionIndex": 0
}
```

**Output:**
```json
{
  "success": true,
  "vote": {
    "id": "vote-uuid",
    "optionIndex": 0
  }
}
```

**Test Requirements:**
- User must be party member
- Vote must be open
- Valid optionIndex

---

### `get_vote_results` ⚠️ UNTESTED
**Category:** Party/Group System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "voteId": "vote-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "results": {
    "voteId": "vote-uuid",
    "options": [
      {
        "index": 0,
        "text": "Option 1",
        "votes": 3
      }
    ],
    "totalVotes": 3
  }
}
```

---

### `get_party_votes` ⚠️ UNTESTED
**Category:** Party/Group System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "partyId": "party-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "votes": [
    {
      "id": "vote-uuid",
      "title": "Vote Title",
      "status": "open",
      "expires_at": "2025-11-15T17:00:00Z"
    }
  ]
}
```

---

### `create_subgroups` ⚠️ UNTESTED
**Category:** Party/Group System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "partyId": "party-uuid",
  "subgroups": [
    {
      "name": "Subgroup 1",
      "memberIds": ["user-uuid-1", "user-uuid-2"]
    }
  ]
}
```

**Output:**
```json
{
  "success": true,
  "subgroups": [
    {
      "id": "subgroup-uuid",
      "name": "Subgroup 1"
    }
  ]
}
```

---

### `get_subgroups` ⚠️ UNTESTED
**Category:** Party/Group System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "partyId": "party-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "subgroups": [
    {
      "id": "subgroup-uuid",
      "name": "Subgroup 1",
      "members": []
    }
  ]
}
```

---

### `update_party_objective_progress` ⚠️ UNTESTED
**Category:** Party/Group System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "partyId": "party-uuid",
  "objectiveId": "objective-uuid",
  "progress": 50
}
```

**Output:**
```json
{
  "success": true
}
```

---

### `get_party_objective_progress` ⚠️ UNTESTED
**Category:** Party/Group System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "partyId": "party-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "objectives": [
    {
      "id": "objective-uuid",
      "progress": 50,
      "target": 100
    }
  ]
}
```

---

## Achievement System

### `get_user_achievements` ✅ TESTED
**Category:** Achievement System  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{}
```

**Output:**
```json
{
  "success": true,
  "achievements": [
    {
      "id": "achievement-uuid",
      "name": "Achievement Name",
      "description": "Description",
      "unlocked_at": "2025-11-15T16:00:00Z"
    }
  ]
}
```

---

### `check_badge_unlock` ⚠️ UNTESTED
**Category:** Achievement System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "badgeId": "badge-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "unlocked": true,
  "badge": {
    "id": "badge-uuid",
    "name": "Badge Name"
  }
}
```

---

### `create_achievement` ⚠️ UNTESTED
**Category:** Achievement System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "name": "Achievement Name",
  "description": "Description",
  "criteria": {}
}
```

**Output:**
```json
{
  "success": true,
  "achievement": {
    "id": "achievement-uuid"
  }
}
```

---

## Progression

### `get_user_level` ✅ TESTED
**Category:** Progression  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{}
```

**Output:**
```json
{
  "success": true,
  "rank": "Explorer",
  "xp": 1000,
  "level": 5,
  "nextLevelXp": 2000
}
```

---

### `get_leaderboard` ✅ TESTED
**Category:** Progression  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{
  "type": "xp",
  "limit": 100
}
```

**Output:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "user_id": "user-uuid",
      "username": "username",
      "xp": 1000,
      "rank": 1
    }
  ]
}
```

---

## Rating System

### `submit_rating` ✅ TESTED
**Category:** Rating System  
**Priority:** Critical  
**Status:** ✅ Tested

**Input:**
```json
{
  "quest_id": "quest-uuid",
  "overall_rating": 5,
  "difficulty_rating": 3,
  "fun_rating": 4,
  "feedback": "Great quest!"
}
```

**Output:**
```json
{
  "success": true
}
```

---

### `get_quest_rating_summary` ⚠️ UNTESTED
**Category:** Rating System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "questId": "quest-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "summary": {
    "averageRating": 4.5,
    "totalRatings": 10,
    "ratings": {
      "overall": 4.5,
      "difficulty": 3.2,
      "fun": 4.8
    }
  }
}
```

---

## Location Services

### `get_places_nearby` ⚠️ UNTESTED
**Category:** Location Services  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "latitude": 33.1262316,
  "longitude": -117.310507,
  "radiusKm": 10,
  "minResults": 10
}
```

**Output:**
```json
{
  "success": true,
  "places": [
    {
      "id": "place-uuid",
      "name": "Place Name",
      "latitude": 33.1262316,
      "longitude": -117.310507,
      "distance_km": 0.5
    }
  ]
}
```

**Test Requirements:**
- Requires GOOGLE_MAPS_API_KEY for full functionality
- Filters out recently visited places (3-day cooldown)

---

## Inventory/Items

### `get_user_inventory` ⚠️ UNTESTED
**Category:** Inventory/Items  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{}
```

**Output:**
```json
{
  "success": true,
  "inventory": [
    {
      "item_id": "item-uuid",
      "name": "Item Name",
      "quantity": 5,
      "type": "consumable"
    }
  ]
}
```

---

### `use_item` ⚠️ UNTESTED
**Category:** Inventory/Items  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "itemId": "item-uuid",
  "quantity": 1,
  "context": {
    "questId": "quest-uuid"
  }
}
```

**Output:**
```json
{
  "success": true,
  "effect": {}
}
```

---

### `discover_items` ⚠️ UNTESTED
**Category:** Inventory/Items  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "latitude": 33.1262316,
  "longitude": -117.310507
}
```

**Output:**
```json
{
  "success": true,
  "items": [
    {
      "id": "item-uuid",
      "name": "Item Name",
      "rarity": "common"
    }
  ]
}
```

---

## Trading System

### `create_item_trade` ⚠️ UNTESTED
**Category:** Trading System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "targetUserId": "user-uuid",
  "offeredItems": [
    {
      "itemId": "item-uuid",
      "quantity": 1
    }
  ],
  "requestedItems": [
    {
      "itemId": "item-uuid-2",
      "quantity": 1
    }
  ]
}
```

**Output:**
```json
{
  "success": true,
  "tradeId": "trade-uuid"
}
```

---

### `respond_to_trade` ⚠️ UNTESTED
**Category:** Trading System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "tradeId": "trade-uuid",
  "response": "accept" // or "reject"
}
```

**Output:**
```json
{
  "success": true
}
```

---

## Events System

### `create_event` ⚠️ UNTESTED
**Category:** Events System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "name": "Event Name",
  "description": "Event description",
  "startTime": "2025-11-20T10:00:00Z",
  "endTime": "2025-11-20T18:00:00Z",
  "location": {
    "latitude": 33.1262316,
    "longitude": -117.310507
  }
}
```

**Output:**
```json
{
  "success": true,
  "event": {
    "id": "event-uuid"
  }
}
```

---

### `join_event` ⚠️ UNTESTED
**Category:** Events System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "eventId": "event-uuid"
}
```

**Output:**
```json
{
  "success": true
}
```

---

### `get_active_event` ⚠️ UNTESTED
**Category:** Events System  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{}
```

**Output:**
```json
{
  "success": true,
  "event": {
    "id": "event-uuid",
    "name": "Event Name",
    "status": "active"
  }
}
```

---

## Mini-Games

### `get_quiz_questions` ⚠️ UNTESTED
**Category:** Mini-Games  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "questId": "quest-uuid",
  "stepId": "step-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "question-uuid",
      "question": "Question text",
      "options": ["Option 1", "Option 2"],
      "correctAnswer": 0
    }
  ]
}
```

---

### `start_quiz_session` ⚠️ UNTESTED
**Category:** Mini-Games  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "questId": "quest-uuid",
  "stepId": "step-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "sessionId": "session-uuid"
}
```

---

### `submit_quiz_answer` ⚠️ UNTESTED
**Category:** Mini-Games  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "sessionId": "session-uuid",
  "questionId": "question-uuid",
  "answerIndex": 0
}
```

**Output:**
```json
{
  "success": true,
  "correct": true,
  "score": 1
}
```

---

### `complete_quiz_session` ⚠️ UNTESTED
**Category:** Mini-Games  
**Priority:** Medium  
**Status:** ❌ Untested

**Input:**
```json
{
  "sessionId": "session-uuid"
}
```

**Output:**
```json
{
  "success": true,
  "finalScore": 8,
  "totalQuestions": 10
}
```

---

## Notes

### Test Dependencies

Some RPCs require external services:
- **OPENROUTER_API_KEY**: Required for quest generation RPCs
- **GOOGLE_MAPS_API_KEY**: Required for `get_places_nearby` and location-based features
- **MINIO**: Required for `upload_photo` and media uploads

### Test Data Requirements

- Valid user sessions (authenticated)
- Valid quest IDs (from generated quests)
- Valid party IDs (from created parties)
- Valid location coordinates

### Error Handling

All RPCs should return:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `UNAUTHORIZED`: User not authenticated
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input parameters
- `FORBIDDEN`: User lacks permission

---

**Last Updated:** 2025-11-15  
**Coverage:** 19.3% (16/83 RPCs tested)

