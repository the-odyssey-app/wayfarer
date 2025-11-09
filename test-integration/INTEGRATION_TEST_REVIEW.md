# Integration Test Script Review: Detailed User Journey Analysis

**Review Date**: Current  
**Script**: `run-integration-tests.sh`  
**Purpose**: End-to-end backend testing for Wayfarer game MVP

---

## Executive Summary

The `run-integration-tests.sh` script provides infrastructure setup but lacks comprehensive end-to-end testing of multi-step user journeys. Based on Game.md (18 major systems) and the current implementation status (~90% MVP complete), the script should test **13 critical user journeys** spanning quest completion (3 quest types), social features, progression, and monetization.

**Key Quest Type Distinctions**:
- **Scavenger Hunt**: 10-step quest, supports groups/parties
- **Mystery Quest**: 10-step quest with narrative, supports groups/parties  
- **Single Task**: 1-step quest, solo only (NO groups/parties)

Users select ONE quest type, then complete that specific flow. Only Scavenger Hunt and Mystery Quest support multiplayer party coordination.

---

## Critical Issues (Summary)

1. **Empty test runner** - `test-runner.js` is empty, so no tests actually run
2. **No multi-step flow testing** - Only individual RPC calls, not complete user journeys
3. **Missing test data setup** - No fake users/groups created despite configuration
4. **No end-to-end workflows** - Doesn't test real user scenarios from Game.md

---

## Detailed Multi-Step User Journeys to Test

Based on Game.md and GAME_MD_VS_REALITY_AUDIT.md, here are the critical user journeys that must be tested end-to-end:

---

### Journey 1A: Scavenger Hunt Quest Flow (10-Step Group Quest) ⭐ CRITICAL

**Game.md Reference**: Lines 7-61 (General Quest System), Lines 303-390 (Group Quest System)  
**Quest Type**: Scavenger Hunt (10 steps, supports groups/parties)  
**Implementation Status**: ~95% complete  
**Priority**: HIGHEST - Core multiplayer gameplay loop

**Steps to Test**:
1. **User Registration & Authentication**
   - Create test user account
   - Authenticate with Nakama
   - Verify session is valid

2. **Location Setup**
   - Call `update_user_location` with GPS coordinates
   - Verify location stored in `user_locations` table
   - Verify location appears in user profile

3. **Quest Type Selection & Generation**
   - User selects "Scavenger Hunt" quest type
   - User calls `generate_scavenger_hunt` with location and preferences
   - Verify OpenRouter API called with correct prompt
   - Verify AI response parsed correctly
   - Verify quest structure created (10 steps)
   - Verify quest type = 'scavenger_hunt'
   - Verify quest saved to database
   - Verify quest ID returned

4. **Quest Discovery**
   - Call `get_available_quests` with user location
   - Verify scavenger hunt quests returned are within proximity
   - Verify quest metadata (title, description, difficulty, type='scavenger_hunt')
   - Verify participant capacity (current/max)
   - Verify public vs private distinction
   - Verify quest supports groups (can create party)

5. **Quest Detail Retrieval**
   - Call `get_quest_detail` with quest ID
   - Verify quest structure (10 steps)
   - Verify step order and requirements
   - Verify quest status (available, active, completed)
   - Verify quest type = 'scavenger_hunt'

6. **Start Quest (Solo or with Party)**
   - Call `start_quest` with quest ID
   - Verify `user_quests` record created with status 'active'
   - Verify `current_step_index` initialized to 0
   - Verify participant count incremented
   - Verify quest capacity not exceeded

7. **Complete Steps 1-9 (Sequential Progression)**
   For each step (1-9):
   - Verify user cannot skip steps (must complete in order)
   - Call `update_user_location` to move to step location
   - Call `complete_step` with step ID and location
   - Verify proximity check (within 50m radius)
   - Verify step marked complete in `step_progress` table
   - Verify `current_step_index` incremented
   - Verify `progress_percent` updated correctly
   - Optionally: Call `submit_step_media` with photo/text
   - Verify media stored and associated with step

8. **Final Step Completion**
   - Complete step 10
   - Verify all 10 steps completed
   - Verify `progress_percent` = 100%

9. **Quest Completion**
   - Call `complete_quest` (or auto-complete after step 10)
   - Verify `user_quests.status` = 'completed'
   - Verify XP awarded to user
   - Verify XP added to `user_profiles.total_xp`
   - Verify rank calculated correctly (if threshold crossed)

10. **Rating & Feedback**
    - Verify rating prompt triggered
    - Call `submit_rating` with quest ID
    - Verify multi-dimensional ratings stored (overall, difficulty, fun)
    - Verify feedback text stored
    - Verify rating appears in quest aggregate

11. **Rewards & Progression**
    - Verify rewards distributed (if any)
    - Verify achievement badges checked (`check_badge_unlock`)
    - Verify leaderboard position updated
    - Verify inventory items awarded (if applicable)

**Edge Cases to Test**:
- User tries to complete steps out of order
- User completes quest from wrong location (proximity failure)
- User completes quest twice (duplicate prevention)
- Quest reaches max participants (capacity enforcement)
- Quest expires while active
- AI generation fails (fallback to manual quest)

---

### Journey 1B: Mystery Quest Flow (10-Step Group Quest with Narrative) ⭐ CRITICAL

**Game.md Reference**: Lines 7-61 (General Quest System), Lines 303-390 (Group Quest System)  
**Quest Type**: Mystery Quest (10 steps with narrative, supports groups/parties)  
**Implementation Status**: ~95% complete  
**Priority**: HIGHEST - Core multiplayer gameplay loop

**Steps to Test**:
1. **User Registration & Authentication**
   - Create test user account
   - Authenticate with Nakama
   - Verify session is valid

2. **Location Setup**
   - Call `update_user_location` with GPS coordinates
   - Verify location stored in `user_locations` table

3. **Quest Type Selection & Generation**
   - User selects "Mystery Quest" quest type
   - User provides array of locations for mystery narrative
   - User calls `generate_mystery_prompt` with locations array
   - Verify OpenRouter API called with mystery narrative prompt
   - Verify AI response parsed correctly
   - Verify quest structure created (10 steps with narrative)
   - Verify quest type = 'mystery'
   - Verify narrative coherence across steps
   - Verify locations used correctly in story
   - Verify quest saved to database
   - Verify quest ID returned

4. **Quest Discovery**
   - Call `get_available_quests` with user location
   - Verify mystery quests returned are within proximity
   - Verify quest metadata (title, description, difficulty, type='mystery')
   - Verify narrative elements visible in quest detail
   - Verify participant capacity (current/max)
   - Verify quest supports groups (can create party)

5. **Quest Detail Retrieval**
   - Call `get_quest_detail` with quest ID
   - Verify quest structure (10 steps with narrative)
   - Verify narrative story elements present
   - Verify step order and requirements
   - Verify quest status (available, active, completed)
   - Verify quest type = 'mystery'

6. **Start Quest (Solo or with Party)**
   - Call `start_quest` with quest ID
   - Verify `user_quests` record created with status 'active'
   - Verify `current_step_index` initialized to 0
   - Verify participant count incremented

7. **Complete Steps 1-9 (Sequential Progression with Narrative)**
   For each step (1-9):
   - Verify user cannot skip steps (must complete in order)
   - Verify narrative context provided for each step
   - Call `update_user_location` to move to step location
   - Call `complete_step` with step ID and location
   - Verify proximity check (within 50m radius)
   - Verify step marked complete in `step_progress` table
   - Verify `current_step_index` incremented
   - Verify `progress_percent` updated correctly
   - Optionally: Call `submit_step_media` with photo/text
   - Verify media stored and associated with step

8. **Final Step Completion**
   - Complete step 10 (mystery resolution)
   - Verify all 10 steps completed
   - Verify `progress_percent` = 100%
   - Verify narrative conclusion provided

9. **Quest Completion**
   - Call `complete_quest` (or auto-complete after step 10)
   - Verify `user_quests.status` = 'completed'
   - Verify XP awarded to user
   - Verify XP added to `user_profiles.total_xp`
   - Verify rank calculated correctly (if threshold crossed)

10. **Rating & Feedback**
    - Verify rating prompt triggered
    - Call `submit_rating` with quest ID
    - Verify multi-dimensional ratings stored (overall, difficulty, fun)
    - Verify feedback text stored
    - Verify rating appears in quest aggregate

11. **Rewards & Progression**
    - Verify rewards distributed (if any)
    - Verify achievement badges checked (`check_badge_unlock`)
    - Verify leaderboard position updated
    - Verify inventory items awarded (if applicable)

**Edge Cases to Test**:
- User tries to complete steps out of order
- Narrative coherence broken (AI generation issue)
- User completes quest from wrong location (proximity failure)
- Quest reaches max participants (capacity enforcement)
- AI generation fails (fallback to manual quest)

---

### Journey 1C: Single Task Quest Flow (1-Step Solo Quest) ⭐ CRITICAL

**Game.md Reference**: Lines 7-61 (General Quest System)  
**Quest Type**: Single Task (1 step, solo only - NO groups/parties)  
**Implementation Status**: ~95% complete  
**Priority**: HIGHEST - Core solo gameplay loop

**Steps to Test**:
1. **User Registration & Authentication**
   - Create test user account
   - Authenticate with Nakama
   - Verify session is valid

2. **Location Setup**
   - Call `update_user_location` with GPS coordinates
   - Verify location stored in `user_locations` table

3. **Quest Type Selection & Generation**
   - User selects "Single Task" quest type
   - User calls `generate_single_task_prompt` with location
   - Verify OpenRouter API called with single task prompt
   - Verify AI response parsed correctly
   - Verify quest structure created (1 step only)
   - Verify quest type = 'single_task'
   - Verify task appropriate for location
   - Verify quest saved to database
   - Verify quest ID returned

4. **Quest Discovery**
   - Call `get_available_quests` with user location
   - Verify single task quests returned are within proximity
   - Verify quest metadata (title, description, difficulty, type='single_task')
   - Verify quest does NOT support groups (no party creation option)
   - Verify participant capacity = 1 (solo only)

5. **Quest Detail Retrieval**
   - Call `get_quest_detail` with quest ID
   - Verify quest structure (1 step only)
   - Verify step requirements
   - Verify quest status (available, active, completed)
   - Verify quest type = 'single_task'
   - Verify no party/group options available

6. **Start Quest (Solo Only)**
   - Call `start_quest` with quest ID
   - Verify `user_quests` record created with status 'active'
   - Verify `current_step_index` initialized to 0
   - Verify participant count = 1 (solo quest)
   - Verify party creation blocked (if attempted)

7. **Complete Single Step**
   - Call `update_user_location` to move to step location
   - Call `complete_step` with step ID and location
   - Verify proximity check (within 50m radius)
   - Verify step marked complete in `step_progress` table
   - Verify `progress_percent` = 100% (only 1 step)
   - Optionally: Call `submit_step_media` with photo/text
   - Verify media stored and associated with step

8. **Quest Completion**
   - Call `complete_quest` (or auto-complete after step 1)
   - Verify `user_quests.status` = 'completed'
   - Verify XP awarded to user (typically less than 10-step quests)
   - Verify XP added to `user_profiles.total_xp`
   - Verify rank calculated correctly (if threshold crossed)

9. **Rating & Feedback**
   - Verify rating prompt triggered
   - Call `submit_rating` with quest ID
   - Verify multi-dimensional ratings stored (overall, difficulty, fun)
   - Verify feedback text stored
   - Verify rating appears in quest aggregate

10. **Rewards & Progression**
    - Verify rewards distributed (if any)
    - Verify achievement badges checked (`check_badge_unlock`)
    - Verify leaderboard position updated
    - Verify inventory items awarded (if applicable)

**Edge Cases to Test**:
- User tries to create party for single task quest (should fail)
- User completes quest from wrong location (proximity failure)
- User completes quest twice (duplicate prevention)
- AI generation fails (fallback to manual quest)
- Single task quest incorrectly shows group options (UI bug)

---

### Journey 2: Group Quest with Party Coordination (Scavenger Hunt & Mystery Only) ⭐ CRITICAL

**Game.md Reference**: Lines 303-390 (Group Quest System, Group Activity Coordination)  
**Quest Types**: Scavenger Hunt and Mystery Quest ONLY (Single Task does NOT support groups)  
**Implementation Status**: ~85% complete  
**Priority**: HIGH - Core multiplayer feature

**Prerequisites**: 
- Quest must be type 'scavenger_hunt' or 'mystery' (NOT 'single_task')
- Users must be verified (if verification required for groups)

**Steps to Test**:
1. **Create Party for Group Quest**
   - User A selects Scavenger Hunt or Mystery Quest
   - User A calls `create_party` with quest ID
   - Verify party created in `parties` table
   - Verify party code generated
   - Verify User A added to `party_members` as leader
   - Verify party status = 'active'
   - Verify quest type supports groups (scavenger_hunt or mystery)

2. **Join Party**
   - User B calls `join_party` with party code
   - Verify User B added to `party_members`
   - Verify party member count incremented
   - Verify User B can see party details
   - Verify User B can see quest details

3. **View Party Members**
   - User A calls `get_party_members` with party ID
   - Verify all members returned (User A, User B)
   - Verify member roles (leader, member)
   - Verify member status (active, inactive)

4. **Start Quest Together**
   - User A calls `start_quest` with quest ID
   - Verify User A's quest status = 'active'
   - User B calls `start_quest` with same quest ID
   - Verify User B's quest status = 'active'
   - Verify both users share same quest instance
   - Verify both users see same 10-step quest structure

5. **Coordinated Step Completion**
   - User A completes step 1
   - Verify User A's progress updated
   - User B completes step 1
   - Verify User B's progress updated independently
   - Verify party aggregate progress calculated (if implemented)
   - Verify both users can see each other's progress (if real-time sync exists)

6. **Shared Objectives**
   - Verify both users see same quest steps
   - Verify both users can see each other's progress (if real-time sync exists)
   - Verify group rewards calculated correctly
   - Verify both users complete all 10 steps independently

7. **Leave Party**
   - User B calls `leave_party` with party ID
   - Verify User B removed from `party_members`
   - Verify User B's quest continues independently
   - Verify party still exists (User A remains)
   - Verify User B can still complete quest solo

8. **Party Disband**
   - User A (leader) leaves party
   - Verify party status = 'disbanded' or deleted
   - Verify all members removed
   - Verify quests continue independently for all former members

**Edge Cases to Test**:
- User tries to create party for single task quest (should fail/block)
- User tries to join full party (capacity check)
- User tries to join non-existent party (invalid code)
- Leader leaves party (leadership transfer or disband)
- Multiple users complete steps simultaneously (race conditions)
- User tries to join party for different quest type (should fail)

---

### Journey 3: User Verification & Safety Flow

**Game.md Reference**: Lines 77-120 (User Verification System)  
**Implementation Status**: ~30% complete (framework exists)  
**Priority**: MEDIUM - Required for social features

**Steps to Test**:
1. **Request Verification**
   - New user calls `request_verification`
   - Verify verification record created in `user_verifications`
   - Verify status = 'pending'
   - Verify submission timestamp recorded

2. **Submit Verification Data**
   - Verify user can submit phone number
   - Verify user can submit photo ID
   - Verify user can submit selfie
   - Verify documents stored securely

3. **Check Verification Status**
   - User calls `get_verification_status`
   - Verify current status returned (pending, approved, rejected)
   - Verify status history available

4. **Verification Approval** (if auto-approve enabled)
   - Verify status transitions to 'approved'
   - Verify approval timestamp recorded
   - Verify user gains access to social features

5. **Feature Gating**
   - Verify unverified users cannot create parties
   - Verify unverified users cannot join public quests
   - Verify verified users have full access

**Edge Cases to Test**:
- User submits invalid documents
- User tries to verify twice
- Verification rejection with reason codes
- Re-verification triggers

---

### Journey 4: Matching & Social Discovery

**Game.md Reference**: Lines 123-165 (Matching Algorithm), Lines 211-256 (Geographic Proximity)  
**Implementation Status**: ~40% complete (basic matching exists)  
**Priority**: MEDIUM - Social engagement feature

**Steps to Test**:
1. **Update User Preferences**
   - User calls `update_user_preferences` with interests, activity types
   - Verify preferences stored in user profile
   - Verify preferences used for matching

2. **Record Activity Pattern**
   - User calls `record_activity_pattern` with time, location, activity type
   - Verify pattern stored for context analysis
   - Verify patterns used for future matching

3. **Find Matches**
   - User calls `find_matches` with location, radius, preferences
   - Verify matches returned based on:
     - Geographic proximity
     - Interest compatibility
     - Activity pattern compatibility
     - Availability overlap
   - Verify match score/percentage calculated
   - Verify matches sorted by compatibility

4. **Create Match Request**
   - User A calls `create_match_request` for User B
   - Verify match request created
   - Verify User B notified (if notification system exists)
   - Verify request status = 'pending'

5. **Accept/Reject Match**
   - User B accepts match request
   - Verify match status = 'accepted'
   - Verify both users can see each other's profile
   - Verify quest suggestions generated for matched pair

6. **Quest Participation with Match**
   - Matched users join same quest
   - Verify quest difficulty adapted for group
   - Verify shared rewards calculated
   - Verify match success tracked for future compatibility

**Edge Cases to Test**:
- No matches found (empty result handling)
- User outside search radius
- User blocks another user
- Match request expires

---

### Journey 5: Progression & Achievement System

**Game.md Reference**: Lines 549-604 (Progression System)  
**Implementation Status**: ~85% complete  
**Priority**: HIGH - User retention feature

**Steps to Test**:
1. **Initial User State**
   - New user calls `get_user_level`
   - Verify rank = "New Wayfarer" (0 XP)
   - Verify XP = 0
   - Verify no achievements unlocked

2. **Earn XP from Quest**
   - User completes quest (Journey 1)
   - Verify XP awarded based on quest difficulty
   - Verify XP added to `user_profiles.total_xp`
   - Verify rank recalculated

3. **Rank Progression**
   - User earns 100 XP → Verify rank = "Junior Wayfarer"
   - User earns 300 XP → Verify rank = "Adept Cartographer"
   - User earns 600 XP → Verify rank = "Experienced Explorer"
   - User earns 1000 XP → Verify rank = "Renowned Trailblazer"
   - Verify rank-up notification triggered (if implemented)
   - Verify feature unlocks at each rank

4. **Achievement Unlocks**
   - User completes 10 quests → Verify "Novice Explorer" badge
   - User visits 5 different locations → Verify "Curiosity" badge
   - User calls `check_badge_unlock` after each milestone
   - Verify badges stored in `user_badges` table
   - Verify badges appear in user profile

5. **Leaderboard Position**
   - User calls `get_leaderboard` with type='xp'
   - Verify user appears in correct position
   - Verify top 100 users returned
   - Verify user's rank displayed
   - Verify leaderboard sorted correctly

6. **Achievement Display**
   - User calls `get_user_achievements`
   - Verify all unlocked badges returned
   - Verify achievement progress for incomplete badges
   - Verify achievement metadata (description, rarity)

**Edge Cases to Test**:
- User at rank boundary (99 XP → 100 XP rank up)
- Multiple achievements unlock simultaneously
- Leaderboard ties (same XP, different order)
- Achievement progress calculation (e.g., 9/10 quests completed)

---

### Journey 6: Item Discovery & Inventory Management

**Game.md Reference**: Lines 391-458 (Item System)  
**Implementation Status**: ~80% complete  
**Priority**: MEDIUM - Engagement feature

**Steps to Test**:
1. **Discover Items at Location**
   - User calls `update_user_location` at POI
   - User calls `discover_items` with location
   - Verify items returned based on:
     - Location type (POI association)
     - Time-based spawn rotation
     - Rarity distribution
     - User's discovery history (cooldown)
   - Verify item metadata (name, description, rarity, value)

2. **Collect Item**
   - User calls `collect_item` with item ID and location
   - Verify proximity check (within collection radius)
   - Verify item added to `user_inventory`
   - Verify inventory capacity not exceeded (300 item limit)
   - Verify item spawn marked as collected (cooldown)

3. **View Inventory**
   - User calls `get_user_inventory`
   - Verify all items returned
   - Verify items categorized (collectible, consumable)
   - Verify items sorted/filtered correctly
   - Verify item details (rarity, collection set, value)

4. **Use Consumable Item**
   - User calls `use_item` with consumable item ID
   - Verify item removed from inventory
   - Verify item effect applied (e.g., speed boost, hint)
   - Verify cooldown period enforced
   - Verify item usage logged

5. **Collection Set Completion**
   - User collects all items in a set
   - Verify collection set badge unlocked
   - Verify achievement triggered
   - Verify reward distributed

**Edge Cases to Test**:
- Inventory full (300 items) - cannot collect more
- Item spawn cooldown (3-day restriction)
- User tries to collect same item twice
- Item rarity distribution (common vs rare)

---

### Journey 7: Event Participation & Limited-Time Content

**Game.md Reference**: Lines 505-548 (Weekly Events System)  
**Implementation Status**: ~75% complete  
**Priority**: MEDIUM - Engagement and retention

**Steps to Test**:
1. **Get Active Event**
   - User calls `get_active_event`
   - Verify current event returned (if active)
   - Verify event metadata (name, theme, duration, rewards)
   - Verify event quests associated

2. **Join Event**
   - User calls `join_event` with event ID
   - Verify event participation recorded in `event_participation`
   - Verify user can access event quests
   - Verify event-specific rewards available

3. **Complete Event Quest**
   - User starts event-associated quest
   - User completes quest steps
   - Verify event-specific XP multiplier applied
   - Verify event progress tracked
   - Verify limited-edition items awarded

4. **Event Leaderboard**
   - User calls `get_event_leaderboard` with event ID
   - Verify event-specific rankings returned
   - Verify user's position in event
   - Verify tiered rewards thresholds displayed

5. **Event Completion**
   - User completes event objectives
   - Verify event completion badge awarded
   - Verify exclusive collectibles unlocked
   - Verify event rewards distributed

**Edge Cases to Test**:
- Event expires while user is participating
- User joins event after it started
- Event has no active quests
- Multiple events active simultaneously

---

### Journey 8: Audio Experience Purchase & Playback

**Game.md Reference**: Lines 605-660 (Audio Experience System)  
**Implementation Status**: ~70% complete  
**Priority**: LOW - Premium feature

**Steps to Test**:
1. **Discover Audio Experiences**
   - User calls `get_audio_experiences` with location or place ID
   - Verify audio experiences returned for location
   - Verify audio metadata (title, narrator, duration, price)
   - Verify free vs premium distinction

2. **Purchase Premium Audio**
   - User calls `purchase_audio` with audio ID
   - Verify payment processed (if monetization enabled)
   - Verify audio added to user's library
   - Verify purchase recorded in transactions

3. **Play Audio Experience**
   - User calls `start_audio_playback` with audio ID
   - Verify playback started
   - Verify location-triggered playback (if at correct location)
   - Verify progress tracked in `user_audio_progress`

4. **Save/Favorite Audio**
   - User calls `favorite_audio` with audio ID
   - Verify audio added to favorites
   - Verify favorites returned in `get_user_audio_favorites`

5. **Rate Audio**
   - User calls `rate_audio` with audio ID and rating
   - Verify rating stored
   - Verify aggregate rating updated

**Edge Cases to Test**:
- User tries to purchase audio without funds
- Audio not available at user's location
- Playback interrupted (resume functionality)

---

### Journey 9: Places Discovery & POI Integration

**Game.md Reference**: Lines 821-864 (Non-Gaming Exploration)  
**Implementation Status**: ~60% complete  
**Priority**: MEDIUM - Core location feature

**Steps to Test**:
1. **Get Places Nearby**
   - User calls `get_places_nearby` with location and radius
   - Verify Google Maps API integration (if key provided)
   - Verify places returned from API
   - Verify places cached in database
   - Verify 3-day cooldown filtering applied
   - Verify place metadata (name, address, type, rating)

2. **Database Fallback**
   - If Google Maps API fails or unavailable
   - Verify places returned from database
   - Verify database places filtered by proximity
   - Verify fallback gracefully handled

3. **Place Details**
   - User calls `get_place_details` with place ID
   - Verify detailed place information returned
   - Verify place ratings aggregated
   - Verify place associated with quests (if any)

4. **Rate Place**
   - User calls `rate_place` with place ID and ratings
   - Verify multi-dimensional ratings stored (architecture, accessibility, etc.)
   - Verify aggregate ratings updated
   - Verify rating history tracked

**Edge Cases to Test**:
- No places found in radius
- Google Maps API rate limit exceeded
- Place not in database (first discovery)
- User rates same place twice (update vs new)

---

### Journey 10: Mini-Games & Challenges

**Game.md Reference**: Lines 865-907 (Mini-Games and Challenges)  
**Implementation Status**: ~70% complete  
**Priority**: LOW - Engagement feature

**Steps to Test**:
1. **Get Quiz Questions**
   - User calls `get_quiz_questions` with quest step ID or location
   - Verify questions returned from Open Trivia DB API
   - Verify question structure (question, answers, correct answer, difficulty)
   - Verify category mapping correct
   - Verify difficulty scaling based on user level

2. **Get Observation Puzzle**
   - User calls `get_observation_puzzle` with quest step ID
   - Verify puzzle returned
   - Verify puzzle difficulty appropriate for user level
   - Verify puzzle state tracked

3. **Submit Quiz Answer**
   - User submits answer to quiz question
   - Verify answer validated
   - Verify score calculated
   - Verify completion tracked

4. **Complete Puzzle**
   - User solves observation puzzle
   - Verify puzzle marked complete
   - Verify rewards awarded
   - Verify quest step progression (if puzzle is quest step)

**Edge Cases to Test**:
- Open Trivia DB API unavailable (fallback handling)
- User fails quiz (retry logic)
- Puzzle timeout (if time-limited)

---

### Journey 11: Quest Type Selection & AI Generation Flow

**Game.md Reference**: Lines 7-61 (Quest System with AI generation)  
**Implementation Status**: ~80% complete (OpenRouter integration exists)  
**Priority**: HIGH - Core feature

**Note**: This journey tests the quest type selection and generation process. After generation, users complete the quest using Journey 1A (Scavenger Hunt), Journey 1B (Mystery), or Journey 1C (Single Task).

**Steps to Test**:

#### Scenario A: User Selects Scavenger Hunt
1. **User Selects Quest Type**
   - User chooses "Scavenger Hunt" from quest type options
   - Verify UI shows scavenger hunt as selected
   - Verify group/party option available (scavenger hunt supports groups)

2. **Generate Scavenger Hunt**
   - User provides location and preferences
   - User calls `generate_scavenger_hunt` with location and preferences
   - Verify OpenRouter API called with correct scavenger hunt prompt
   - Verify AI response parsed correctly
   - Verify quest structure created (10 steps)
   - Verify quest type = 'scavenger_hunt'
   - Verify quest supports groups (party creation enabled)
   - Verify quest saved to database
   - Verify quest ID returned

3. **Continue to Quest Completion**
   - User proceeds to complete quest (see Journey 1A for full flow)
   - Verify quest functions identically to manually created scavenger hunts

#### Scenario B: User Selects Mystery Quest
1. **User Selects Quest Type**
   - User chooses "Mystery Quest" from quest type options
   - Verify UI shows mystery quest as selected
   - Verify group/party option available (mystery quest supports groups)

2. **Generate Mystery Quest**
   - User provides array of locations for mystery narrative
   - User calls `generate_mystery_prompt` with locations array
   - Verify OpenRouter API called with mystery narrative prompt
   - Verify AI response parsed correctly
   - Verify quest structure created (10 steps with narrative)
   - Verify quest type = 'mystery'
   - Verify narrative coherence across steps
   - Verify locations used correctly in story
   - Verify quest supports groups (party creation enabled)
   - Verify quest saved to database
   - Verify quest ID returned

3. **Continue to Quest Completion**
   - User proceeds to complete quest (see Journey 1B for full flow)
   - Verify quest functions identically to manually created mystery quests

#### Scenario C: User Selects Single Task
1. **User Selects Quest Type**
   - User chooses "Single Task" from quest type options
   - Verify UI shows single task as selected
   - Verify group/party option NOT available (single task is solo only)

2. **Generate Single Task**
   - User provides location
   - User calls `generate_single_task_prompt` with location
   - Verify OpenRouter API called with single task prompt
   - Verify AI response parsed correctly
   - Verify quest structure created (1 step only)
   - Verify quest type = 'single_task'
   - Verify task appropriate for location
   - Verify quest does NOT support groups (party creation disabled)
   - Verify quest saved to database
   - Verify quest ID returned

3. **Continue to Quest Completion**
   - User proceeds to complete quest (see Journey 1C for full flow)
   - Verify quest functions identically to manually created single tasks

**Edge Cases to Test**:
- User tries to create party for single task quest (should fail/block)
- OpenRouter API unavailable (error handling, fallback to manual quests)
- AI returns invalid quest structure (validation, error message)
- AI returns inappropriate content (safety filters, content moderation)
- Rate limiting on AI API calls (queue or retry logic)
- User cancels generation mid-process
- User generates multiple quest types in sequence

---

## Test Data Requirements

For comprehensive end-to-end testing, the test runner must create:

### Test Users (5+ users)
- Different ranks (New Wayfarer → Renowned Trailblazer)
- Different verification statuses (verified, unverified, pending)
- Different locations (spread across test area)
- Different preferences and activity patterns
- Different inventory states

### Test Quests (15+ quests)
- **Scavenger Hunt Quests** (5+ quests)
  - Public scavenger hunts (various participant counts)
  - Private scavenger hunts
  - Different difficulty levels
  - AI-generated scavenger hunts
  - Manually created scavenger hunts
  - Quests at different stages (available, active, completed)
  - Event-associated scavenger hunts
  
- **Mystery Quests** (5+ quests)
  - Public mystery quests (various participant counts)
  - Private mystery quests
  - Different narrative themes
  - Different difficulty levels
  - AI-generated mystery quests
  - Manually created mystery quests
  - Quests at different stages (available, active, completed)
  - Event-associated mystery quests
  
- **Single Task Quests** (5+ quests)
  - Public single tasks (solo only)
  - Private single tasks
  - Different task types
  - Different difficulty levels
  - AI-generated single tasks
  - Manually created single tasks
  - Quests at different stages (available, active, completed)
  - Event-associated single tasks

### Test Groups/Parties (4+ parties)
- **Scavenger Hunt Parties** (2+ parties)
  - Active parties with multiple members
  - Parties at different stages of quest completion
  - Parties with different member counts (2-10 members)
  - Parties for public scavenger hunts
  - Parties for private scavenger hunts
  
- **Mystery Quest Parties** (2+ parties)
  - Active parties with multiple members
  - Parties at different stages of quest completion
  - Parties with different member counts (2-10 members)
  - Parties for public mystery quests
  - Parties for private mystery quests
  
- **Note**: Single Task quests do NOT have parties (solo only)

### Test Items
- Various rarities (common, rare, epic, legendary)
- Different types (collectible, consumable)
- Items in different collection sets
- Items at different locations

### Test Events
- Active weekly event
- Event with associated quests
- Event with leaderboard

---

## Missing Test Coverage

The current script does NOT test:

1. **Multi-step sequential flows** - Only individual RPC calls
2. **State transitions** - User progression, rank changes, status updates
3. **Cross-system integration** - How systems interact (quests → XP → ranks → achievements)
4. **Error recovery** - What happens when steps fail mid-flow
5. **Concurrency** - Multiple users performing actions simultaneously
6. **Data consistency** - Ensuring database state remains consistent across operations
7. **Performance** - Response times, load handling
8. **Real-world scenarios** - Actual user behavior patterns

---

## Recommendations

### Immediate Actions:
1. **Implement test-runner.js** with all 13 user journeys above (3 quest type flows + 10 other journeys)
2. **Create test data factory** to generate users, quests (3 types), items, events
3. **Add test isolation** - Each test run starts with clean state
4. **Add test assertions** - Verify each step in journey succeeds
5. **Add error reporting** - Show which step failed and why
6. **Test quest type restrictions** - Verify groups only work for scavenger hunt and mystery quest

### Test Structure:
```javascript
// Pseudo-code structure
async function testCompleteQuestFlow() {
  const user = await createTestUser();
  const quest = await createTestQuest();
  
  // Step 1: Location
  await updateUserLocation(user, quest.startLocation);
  
  // Step 2: Discover
  const availableQuests = await getAvailableQuests(user, location);
  assert(availableQuests.includes(quest));
  
  // Step 3: Start
  await startQuest(user, quest.id);
  const userQuest = await getUserQuest(user, quest.id);
  assert(userQuest.status === 'active');
  assert(userQuest.currentStepIndex === 0);
  
  // Step 4-13: Complete all 10 steps
  for (let i = 0; i < 10; i++) {
    await updateUserLocation(user, quest.steps[i].location);
    await completeStep(user, quest.steps[i].id);
    // Verify step completed, progress updated
  }
  
  // Step 14: Verify completion
  const finalQuest = await getUserQuest(user, quest.id);
  assert(finalQuest.status === 'completed');
  assert(finalQuest.progressPercent === 100);
  
  // Step 15: Verify XP awarded
  const userLevel = await getUserLevel(user);
  assert(userLevel.xp > 0);
  
  // Step 16: Verify rating can be submitted
  await submitRating(user, quest.id, { overall: 5, difficulty: 3, fun: 4 });
}
```

### Test Execution:
- Run all journeys sequentially
- Track pass/fail for each journey
- Report summary with timing
- Save detailed logs for failures
- Support running individual journeys for debugging

---

## Conclusion

The `run-integration-tests.sh` script is a good foundation but needs a comprehensive test runner that implements the 13 user journeys above. These journeys cover:

- ✅ **Core gameplay** - Three quest type flows:
  - Scavenger Hunt (10-step group quest)
  - Mystery Quest (10-step group quest with narrative)
  - Single Task (1-step solo quest, NO groups)
- ✅ **Social features** - Group coordination (scavenger hunt & mystery only)
- ✅ **Progression** - Ranks, achievements, leaderboards
- ✅ **Engagement** - Items, events, audio
- ✅ **Location services** - Places, POIs
- ✅ **AI integration** - Quest type selection and generation
- ✅ **Safety** - Verification

**Key Distinctions**:
- **Scavenger Hunt** and **Mystery Quest** support groups/parties (multiplayer)
- **Single Task** is solo-only (no groups/parties)
- Users select ONE quest type, then complete that specific flow
- Each quest type has its own generation RPC and completion flow

Without testing these end-to-end flows, the script cannot verify that the backend systems work together correctly for real users, especially the critical distinction between group-enabled quests (scavenger hunt, mystery) and solo-only quests (single task).

