# API Comparison: Old Convex Backend vs New Nakama Backend

## Overview

The integration tests **do NOT test HTTP REST API endpoints**. Instead, they test **Nakama RPC functions** which are called via the Nakama client SDK.

### Architecture Differences

**Old Backend (Convex):**
- Used Convex functions: `query`, `mutation`, `action`
- Functions were called directly via Convex client
- No explicit HTTP endpoints

**New Backend (Nakama):**
- Uses Nakama RPC functions registered in JavaScript runtime module
- Functions are called via Nakama client SDK (`client.rpc()`)
- No explicit HTTP endpoints (RPC layer abstracts HTTP)

---

## Integration Tests Coverage

The integration tests (`test-runner.js`) currently test **12 RPC functions**:

### ✅ Tested RPC Functions

1. **`update_user_location`** - Update user's GPS coordinates
2. **`get_available_quests`** - Get quests near user location
3. **`get_user_level`** - Get user's level and XP progress
4. **`get_user_quests`** - Get quests assigned to user
5. **`create_party`** - Create a party/group for quest
6. **`join_party`** - Join an existing party
7. **`get_party_members`** - Get members of a party
8. **`get_places_nearby`** - Discover nearby places/POIs
9. **`get_user_inventory`** - Get user's items/collection
10. **`get_leaderboard`** - Get global leaderboard
11. **`get_user_achievements`** - Get user's earned achievements/badges

### ❌ Not Tested (But Available)

The following RPC functions are registered but **NOT tested** by integration tests:

#### Quest System
- `start_quest` - Start a quest
- `complete_quest` - Complete a quest
- `get_quest_detail` - Get detailed quest information
- `generate_scavenger_hunt` - Generate new scavenger hunt
- `complete_step` - Complete a quest step
- `submit_step_media` - Submit media for a step

#### Achievement System
- `create_achievement` - Create a new achievement
- `check_badge_unlock` - Check if badge should be unlocked

#### Party/Group System
- `leave_party` - Leave a party
- `create_party_vote` - Create a vote in party
- `cast_vote` - Cast a vote
- `get_vote_results` - Get vote results
- `get_party_votes` - Get all votes in party
- `create_subgroups` - Create subgroups
- `get_subgroups` - Get subgroups
- `update_party_objective_progress` - Update party objective
- `get_party_objective_progress` - Get party objective progress

#### Items & Inventory
- `use_item` - Use an item from inventory
- `discover_items` - Discover items at location
- `get_collection_sets` - Get collection sets
- `add_item_to_group_pool` - Add item to group pool
- `get_group_pool_items` - Get group pool items
- `create_item_trade` - Create trade request
- `respond_to_trade` - Respond to trade

#### Audio Experiences
- `get_audio_experiences` - Get audio experiences at location
- `update_audio_progress` - Update audio playback progress
- `toggle_audio_favorite` - Favorite/unfavorite audio
- `purchase_audio` - Purchase audio experience
- `rate_audio` - Rate audio experience
- `get_user_audio_collection` - Get user's audio collection

#### Social & Matching
- `find_matches` - Find matching users
- `create_match_request` - Create match request
- `record_activity_pattern` - Record user activity pattern

#### Events
- `create_event` - Create an event
- `join_event` - Join an event
- `update_event_participation` - Update event participation
- `get_active_event` - Get active event
- `get_event_leaderboard` - Get event leaderboard

#### Media & Content
- `upload_photo` - Upload photo for quest/step
- `submit_rating` - Submit rating for quest/place
- `get_quest_rating_summary` - Get rating summary

#### Verification & Safety
- `request_verification` - Request verification
- `get_verification_status` - Get verification status
- `submit_safety_report` - Submit safety report
- `get_user_safety_reports` - Get user safety reports

#### Analytics & Admin
- `get_feedback_analytics` - Get feedback analytics
- `process_feedback_categorization` - Process feedback
- `get_report_queue` - Get report queue
- `update_report_status` - Update report status

#### Mini Games
- `get_quiz_questions` - Get quiz questions
- `start_quiz_session` - Start quiz session
- `submit_quiz_answer` - Submit quiz answer
- `complete_quiz_session` - Complete quiz session
- `get_observation_puzzle` - Get observation puzzle
- `start_observation_session` - Start observation session
- `verify_observation_item` - Verify observation item
- `submit_observation_count` - Submit observation count
- `complete_observation_session` - Complete observation session
- `create_quiz_question` - Create quiz question (admin)
- `create_observation_puzzle` - Create observation puzzle (admin)
- `get_available_mini_games` - Get available mini games

#### User Preferences
- `update_user_preferences` - Update user preferences

---

## Old Convex Backend APIs

### User Management (`users.ts`)

| Old API | Type | Description | New Equivalent |
|---------|------|-------------|----------------|
| `getUser` | `query` | Get user by ID | Nakama built-in user system |
| `getUserLocation` | `query` | Get user's location | `update_user_location` (RPC) |
| `updateLocationForUser` | `mutation` | Update user location | `update_user_location` (RPC) |
| `getSystemActivities` | `query` | Get available activities | `update_user_preferences` (RPC) |
| `updateUserActivities` | `mutation` | Update user activities | `update_user_preferences` (RPC) |
| `getUserTotalCoins` | `query` | Get user's total coins | `get_user_inventory` (RPC) |
| `getUserStats` | `query` | Get user statistics | Multiple RPCs (level, achievements, etc.) |

### Quest System (`quests.ts`)

| Old API | Type | Description | New Equivalent |
|---------|------|-------------|----------------|
| `createQuest` | `action` | Create new quest | `generate_scavenger_hunt` (RPC) |
| `joinQuest` | `mutation` | Join a quest | `start_quest` (RPC) |
| `getQuestLeaderboard` | `query` | Get quest leaderboard | `get_leaderboard` (RPC) |
| `getNearbyQuests` | `action` | Get nearby quests | `get_available_quests` (RPC) |
| `getPublicQuests` | `query` | Get public quests | `get_available_quests` (RPC) |
| `updateQuestProgress` | `mutation` | Update quest progress | `complete_step` (RPC) |
| `getActiveQuest` | `query` | Get active quest | `get_user_quests` (RPC) |
| `insertQuest` | `mutation` | Insert quest (internal) | Internal (RPC) |
| `initializeProgress` | `mutation` | Initialize progress | `start_quest` (RPC) |
| `getActivePublicQuests` | `query` | Get active public quests | `get_available_quests` (RPC) |
| `checkQuestsEndingSoon` | `action` | Check quests ending soon | Not implemented |

### Locations (`locations.ts`)

| Old API | Type | Description | New Equivalent |
|---------|------|-------------|----------------|
| `getLocationsForUser` | `action` | Get locations using Google Maps API | `get_places_nearby` (RPC) |
| `insertPlace` | `mutation` | Insert place into DB | Internal (RPC) |

### Achievements (`achievements.ts`)

| Old API | Type | Description | New Equivalent |
|---------|------|-------------|----------------|
| `insertAchievement` | `mutation` | Insert achievement | `create_achievement` (RPC) |
| `getAchievement` | `query` | Get achievement | `get_user_achievements` (RPC) |
| `updateAchievementStatus` | `mutation` | Update achievement status | `check_badge_unlock` (RPC) |
| `getUserAchievements` | `query` | Get user achievements | `get_user_achievements` (RPC) |

### Badges (`badges.ts`)

| Old API | Type | Description | New Equivalent |
|---------|------|-------------|----------------|
| `insertBadge` | `mutation` | Insert badge | Internal (RPC) |
| `getBadge` | `query` | Get badge | `get_user_achievements` (RPC) |
| `getUserBadges` | `query` | Get user badges | `get_user_achievements` (RPC) |
| `awardBadge` | `mutation` | Award badge to user | `check_badge_unlock` (RPC) |

### Items (`items.ts`)

| Old API | Type | Description | New Equivalent |
|---------|------|-------------|----------------|
| `insertItem` | `mutation` | Insert item | Internal (RPC) |
| `getItem` | `query` | Get item | `get_user_inventory` (RPC) |
| `getUserItems` | `query` | Get user items | `get_user_inventory` (RPC) |
| `addItemToUser` | `mutation` | Add item to user | `discover_items` (RPC) |
| `useItem` | `mutation` | Use an item | `use_item` (RPC) |

### Friends (`friends.ts`)

| Old API | Type | Description | New Equivalent |
|---------|------|-------------|----------------|
| `sendFriendRequest` | `mutation` | Send friend request | Not implemented (can use Nakama friends) |
| `acceptFriendRequest` | `mutation` | Accept friend request | Not implemented (can use Nakama friends) |
| `rejectFriendRequest` | `mutation` | Reject friend request | Not implemented (can use Nakama friends) |
| `getFriends` | `query` | Get friends list | Not implemented (can use Nakama friends) |
| `removeFriend` | `mutation` | Remove friend | Not implemented (can use Nakama friends) |

### Posts (`posts.ts`)

| Old API | Type | Description | New Equivalent |
|---------|------|-------------|----------------|
| `createPost` | `mutation` | Create post at location | Not implemented |
| `getPosts` | `query` | Get posts | Not implemented |
| `getPostsByPlace` | `query` | Get posts by place | Not implemented |
| `getUserPosts` | `query` | Get user posts | Not implemented |

### Rewards (`rewards.ts`)

| Old API | Type | Description | New Equivalent |
|---------|------|-------------|----------------|
| `addReward` | `mutation` | Add reward to user | Internal (RPC) |
| `getAllRewards` | `query` | Get all rewards | `get_user_inventory` (RPC) |
| `claimDailyReward` | `mutation` | Claim daily reward | Not implemented |

### Place Audio (`placeAudio.ts`)

| Old API | Type | Description | New Equivalent |
|---------|------|-------------|----------------|
| `uploadPlaceAudio` | `mutation` | Upload audio for place | `purchase_audio` (RPC) |
| `getPlaceAudio` | `query` | Get place audio | `get_audio_experiences` (RPC) |
| `getUserAudioCollection` | `query` | Get user audio collection | `get_user_audio_collection` (RPC) |

### Notifications (`notifications.ts`)

| Old API | Type | Description | New Equivalent |
|---------|------|-------------|----------------|
| `storeExpoToken` | `mutation` | Store Expo push token | Not implemented |
| `sendPushNotification` | `action` | Send push notification | Not implemented |
| `sendItemCollectionNotification` | `action` | Send item collection notification | Not implemented |
| `sendFriendRequestNotification` | `action` | Send friend request notification | Not implemented |
| `sendNewBadgeNotification` | `action` | Send badge notification | Not implemented |
| `sendNearbyQuestNotification` | `action` | Send nearby quest notification | Not implemented |
| `sendQuestEndingSoonNotification` | `action` | Send quest ending soon notification | Not implemented |

### Favorites (`favorites.ts`)

| Old API | Type | Description | New Equivalent |
|---------|------|-------------|----------------|
| `addFavorite` | `mutation` | Add favorite place | Not implemented |
| `removeFavorite` | `mutation` | Remove favorite | Not implemented |
| `getUserFavorites` | `query` | Get user favorites | Not implemented |

### Mystery Prompt (`mysteryPrompt.ts`, `singleTaskPrompt.ts`)

| Old API | Type | Description | New Equivalent |
|---------|------|-------------|----------------|
| `createMysteryPrompt` | `action` | Generate mystery prompt (AI) | `generate_scavenger_hunt` (RPC) |
| `createTaskPrompt` | `action` | Generate single task prompt (AI) | `generate_scavenger_hunt` (RPC) |

---

## External APIs Used

### Old Convex Backend
- **Google Maps Places API** (`@googlemaps/google-maps-services-js`)
  - `textSearch()` - Search for places
  - `placeDetails()` - Get place details
- **NVIDIA AI API** (`integrate.api.nvidia.com`)
  - Used for quest/task generation

### New Nakama Backend
- **OpenRouter API** (configured via `OPENROUTER_API_KEY`)
  - Used for AI quest generation (Claude Haiku)
- **Google Maps Places API** (potentially, via `get_places_nearby`)
  - Not directly visible in current codebase

---

## Summary

### Integration Test Coverage: **12/66 RPC Functions (18%)**

**Covered:**
- ✅ User location updates
- ✅ Quest discovery
- ✅ User level/progression
- ✅ Party/group creation and management
- ✅ Places discovery
- ✅ Inventory retrieval
- ✅ Leaderboards
- ✅ Achievements

**Missing Coverage:**
- ❌ Quest start/completion flow
- ❌ Quest step progression
- ❌ Media uploads
- ❌ Audio experiences
- ❌ Item usage and trading
- ❌ Mini games (quiz, observation)
- ❌ Events system
- ❌ Social features (matches, friends)
- ❌ Safety/verification features
- ❌ Admin/analytics features

### Migration Status

**Fully Migrated:**
- User location system
- Quest discovery
- Party/group system
- Places discovery
- Inventory system
- Leaderboards
- Achievements/badges

**Partially Migrated:**
- Quest system (missing step-by-step progression in tests)
- Items system (missing usage and trading)
- Audio system (missing in tests)

**Not Migrated:**
- Friends system (use Nakama built-in)
- Posts system
- Daily rewards
- Push notifications
- Favorites system

---

## Recommendations

1. **Expand Integration Tests** to cover:
   - Quest start → step completion → quest completion flow
   - Item usage and trading
   - Audio experience purchase and playback
   - Mini games (quiz, observation puzzles)
   - Event participation

2. **Add Missing Features:**
   - Friends system (using Nakama built-in friends)
   - Posts system for location-based social content
   - Daily rewards system
   - Push notifications integration

3. **Document API Endpoints:**
   - Create OpenAPI/Swagger documentation for all RPC functions
   - Document request/response formats
   - Add usage examples

