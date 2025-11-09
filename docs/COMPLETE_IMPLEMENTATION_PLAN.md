# 🚀 COMPLETE WAYFARER IMPLEMENTATION PLAN

**Scope**: Full Game.md vision implementation  
**Architecture**: Nakama + CockroachDB + OpenRouter + React Native  
**Timeline**: 6-8 weeks (3 developers) / 4-6 months (1 developer)  
**Estimated Effort**: 660-930 hours total  
**Target**: AAA-quality location-based mobile game (Pokémon GO tier)

---

## 📋 TABLE OF CONTENTS

1. [Executive Overview](#executive-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Database Schema (Complete)](#database-schema-complete)
4. [Phase 0: Critical Fixes (1 week)](#phase-0-critical-fixes-1-week)
5. [Phase 1: Core Quest System (2 weeks)](#phase-1-core-quest-system-2-weeks)
6. [Phase 2: Progression & Multiplayer (2 weeks)](#phase-2-progression--multiplayer-2-weeks)
7. [Phase 3: Advanced Features (2 weeks)](#phase-3-advanced-features-2-weeks)
8. [Phase 4: Monetization & Polish (1-2 weeks)](#phase-4-monetization--polish-1-2-weeks)
9. [API Reference](#api-reference)
10. [Testing & QA Strategy](#testing--qa-strategy)

---

## EXECUTIVE OVERVIEW

### Vision Statement
Build a location-based adventure game that combines:
- AI-generated dynamic quests (via OpenRouter)
- Real-time multiplayer experiences
- Social discovery and collaboration
- Progressive skill-based gameplay
- Monetization through subscriptions and cosmetics
- Sustainability through business partnerships

### Success Metrics
| Metric | Target |
|--------|--------|
| Daily Active Users | 50K+ |
| Retention (Day 7) | 40%+ |
| Average Session | 15-20 min |
| Monetization (ARPPU) | $2-5/month |
| Quest Completion Rate | 60%+ |
| User Rating | 4.5+/5 |

### Team Composition (Recommended)
```
Phase 0 (1 week):     1 developer
Phase 1-2 (4 weeks):  2-3 developers
Phase 3-4 (2 weeks):  2-3 developers
Launch & Support:     2 developers
```

---

## ARCHITECTURE & TECHNOLOGY STACK

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App (Expo)                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ UI Layer (Screens, Components, Navigation)          │    │
│  │ • LoginScreen, HomeScreen, MapComponent             │    │
│  │ • QuestDetailScreen, PartyScreen, ShopScreen        │    │
│  │ • ProfileScreen, LeaderboardScreen, SettingsScreen  │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ State Management (Redux/Zustand)                    │    │
│  │ • Auth state, User profile, Quests, Party state     │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Services Layer                                      │    │
│  │ • NakamaClient, LocationService, NotificationMgr    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────┬──────────────────────────────────────┘
                      │ WebSocket + REST
          ┌───────────┴───────────┐
          ▼                       ▼
    ┌──────────────┐      ┌──────────────┐
    │   Nakama     │      │  OpenRouter  │
    │   Server     │      │  (Claude AI) │
    │   3.22.0     │      │              │
    └──────┬───────┘      └──────────────┘
           │
    ┌──────▼──────────┐
    │  CockroachDB    │
    │  (22 tables)    │
    └─────────────────┘
```

### Technology Choices

| Component | Technology | Why |
|-----------|-----------|-----|
| **Mobile Framework** | React Native (Expo) | Cross-platform, rapid development |
| **Game Server** | Nakama 3.22.0 | Real-time, multiplayer-ready |
| **Database** | CockroachDB | Distributed, scalable, SQL |
| **AI/Content** | OpenRouter + Claude Haiku | Cost-effective, reliable |
| **Maps** | Mapbox | Best location accuracy |
| **Auth** | Nakama built-in | Secure, integrated |
| **Notifications** | Firebase Cloud Messaging | Reliable push notifications |
| **Analytics** | Mixpanel/Amplitude | User behavior tracking |
| **CDN** | Cloudflare | Fast asset delivery |

### Tech Stack Summary

**Frontend**
```json
{
  "react": "19.1.0",
  "react-native": "0.81.4",
  "expo": "~54.0.7",
  "redux": "^4.2.0",
  "@rnmapbox/maps": "^10.1.44",
  "expo-location": "^19.0.7",
  "react-native-gesture-handler": "^2.0.0"
}
```

**Backend**
```javascript
- Nakama 3.22.0
- CockroachDB 23.1
- TypeScript/JavaScript runtime
```

**External Services**
```
- OpenRouter (AI generation)
- Mapbox (Maps)
- Firebase (Push notifications)
- Google Places API (POI discovery)
```

---

## DATABASE SCHEMA (COMPLETE)

### Overview: 22 Tables Across 7 Categories

```
┌─────────────────────────────────────────────────────────┐
│ USER MANAGEMENT (4 tables)                              │
│ • users, user_profiles, user_sessions, devices          │
├─────────────────────────────────────────────────────────┤
│ LOCATION & DISCOVERY (4 tables)                         │
│ • locations, places, user_locations, geofences          │
├─────────────────────────────────────────────────────────┤
│ QUEST SYSTEM (5 tables)                                 │
│ • quests, quest_instances, user_quests, achievements    │
│ • quest_steps                                           │
├─────────────────────────────────────────────────────────┤
│ PROGRESSION (4 tables)                                  │
│ • badges, user_badges, items, user_inventory           │
├─────────────────────────────────────────────────────────┤
│ SOCIAL (3 tables)                                       │
│ • friendships, parties, user_parties                    │
├─────────────────────────────────────────────────────────┤
│ MONETIZATION (2 tables)                                 │
│ • subscriptions, purchases                              │
└─────────────────────────────────────────────────────────┘
```

### Detailed Schema

#### Category 1: USER MANAGEMENT

```sql
-- Users (Core Nakama integration)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false
);

-- User Profiles (Extended info)
CREATE TABLE user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  gems INTEGER DEFAULT 0,
  activities ARRAY,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_user_profiles_level ON user_profiles(level DESC);
Create INDEX idx_user_profiles_xp ON user_profiles(total_xp DESC);

-- User Sessions (Track active sessions)
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  token TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  last_activity TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_active ON user_sessions(is_active, expires_at);

-- Devices (Track devices for push notifications)
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  device_token TEXT,
  device_type TEXT, -- "ios", "android", "web"
  device_os TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_devices_user ON devices(user_id);
```

#### Category 2: LOCATION & DISCOVERY

```sql
-- Locations (Real-world places)
CREATE TABLE places (
  id TEXT PRIMARY KEY,
  google_place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 50,
  types ARRAY,
  photos ARRAY,
  website TEXT,
  phone TEXT,
  rating DECIMAL(3, 2),
  review_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  generative_summary TEXT
);
CREATE INDEX idx_places_location ON places USING GIST (
  ST_Point(longitude, latitude)
);
CREATE INDEX idx_places_active ON places(is_active);

-- User Locations (Real-time user positions)
CREATE TABLE user_locations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  speed DECIMAL(5, 2),
  last_updated TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_user_locations_user ON user_locations(user_id);
CREATE INDEX idx_user_locations_coords ON user_locations USING GIST (
  ST_Point(longitude, latitude)
);

-- Geofences (Trigger areas)
CREATE TABLE geofences (
  id TEXT PRIMARY KEY,
  place_id TEXT REFERENCES places(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 100,
  trigger_type TEXT, -- "enter", "exit", "dwell"
  dwell_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_geofences_place ON geofences(place_id);

-- Favorites (User bookmarked places)
CREATE TABLE user_favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  place_id TEXT REFERENCES places(id),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_favorites_user ON user_favorites(user_id);
CREATE UNIQUE INDEX idx_favorites_unique ON user_favorites(user_id, place_id);
```

#### Category 3: QUEST SYSTEM

```sql
-- Quest Templates (Reusable quest designs)
CREATE TABLE quest_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- "scavenger", "mystery", "exploration"
  difficulty INTEGER DEFAULT 1,
  estimated_time_minutes INTEGER,
  max_participants INTEGER,
  reward_xp INTEGER,
  reward_coins INTEGER,
  created_by TEXT REFERENCES users(id),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Quest Instances (Generated from templates)
CREATE TABLE quests (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES quest_templates(id),
  title TEXT NOT NULL,
  description TEXT,
  generated_prompt TEXT,
  status TEXT DEFAULT 'available', -- available, active, completed, expired
  place_id TEXT REFERENCES places(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  radius_meters INTEGER DEFAULT 100,
  difficulty INTEGER DEFAULT 1,
  estimated_time_minutes INTEGER,
  reward_xp INTEGER,
  reward_coins INTEGER,
  reward_items ARRAY,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  creator_id TEXT REFERENCES users(id),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_quests_status ON quests(status);
CREATE INDEX idx_quests_creator ON quests(creator_id);
CREATE INDEX idx_quests_location ON quests USING GIST (
  ST_Point(longitude, latitude)
);

-- User Quest Progress
CREATE TABLE user_quests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  quest_id TEXT REFERENCES quests(id),
  status TEXT DEFAULT 'pending', -- pending, active, completed, failed, abandoned
  progress_percent INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_user_quests_user ON user_quests(user_id);
CREATE INDEX idx_user_quests_status ON user_quests(status);
CREATE UNIQUE INDEX idx_user_quests_unique ON user_quests(user_id, quest_id);

-- Quest Steps (Individual tasks within quest)
CREATE TABLE quest_steps (
  id TEXT PRIMARY KEY,
  quest_id TEXT REFERENCES quests(id),
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  success_criteria TEXT,
  place_id TEXT REFERENCES places(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  hint TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_quest_steps_quest ON quest_steps(quest_id, step_number);

-- Achievements (Quest completion records)
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  quest_id TEXT REFERENCES quests(id),
  achievement_type TEXT, -- "quest_complete", "speedrun", "no_hints"
  description TEXT,
  reward_xp INTEGER,
  reward_coins INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_achievements_user ON achievements(user_id);
```

#### Category 4: PROGRESSION

```sql
-- Badges (Achievements unlocked)
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  category TEXT, -- "exploration", "social", "achievement"
  unlock_criteria JSONB,
  rarity TEXT, -- "common", "rare", "epic", "legendary"
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Badges (Track earned badges)
CREATE TABLE user_badges (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  badge_id TEXT REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE UNIQUE INDEX idx_user_badges_unique ON user_badges(user_id, badge_id);

-- Items (Collectible items)
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  type TEXT, -- "consumable", "equipment", "collectible"
  rarity TEXT, -- "common", "uncommon", "rare", "epic", "legendary"
  effect_type TEXT, -- "quest_skip", "double_xp", "hint_reveal"
  effect_duration_minutes INTEGER,
  quest_id TEXT REFERENCES quests(id),
  place_id TEXT REFERENCES places(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Inventory
CREATE TABLE user_inventory (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  item_id TEXT REFERENCES items(id),
  quantity INTEGER DEFAULT 1,
  acquired_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP
);
CREATE INDEX idx_inventory_user ON user_inventory(user_id);
CREATE UNIQUE INDEX idx_inventory_unique ON user_inventory(user_id, item_id);
```

#### Category 5: SOCIAL

```sql
-- Friendships
CREATE TABLE friendships (
  id TEXT PRIMARY KEY,
  user_id_1 TEXT REFERENCES users(id),
  user_id_2 TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- pending, accepted, blocked
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
Create INDEX idx_friendships_users ON friendships(user_id_1, user_id_2);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Parties (Groups of players)
CREATE TABLE parties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  leader_id TEXT REFERENCES users(id),
  quest_id TEXT REFERENCES quests(id),
  max_members INTEGER DEFAULT 4,
  current_members INTEGER DEFAULT 1,
  status TEXT DEFAULT 'open', -- open, full, completed, disbanded
  created_at TIMESTAMP DEFAULT NOW(),
  disbanded_at TIMESTAMP
);
CREATE INDEX idx_parties_leader ON parties(leader_id);
CREATE INDEX idx_parties_quest ON parties(quest_id);

-- Party Members
CREATE TABLE party_members (
  id TEXT PRIMARY KEY,
  party_id TEXT REFERENCES parties(id),
  user_id TEXT REFERENCES users(id),
  role TEXT DEFAULT 'member', -- "leader", "member"
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP
);
CREATE INDEX idx_party_members_party ON party_members(party_id);
CREATE UNIQUE INDEX idx_party_members_unique ON party_members(party_id, user_id);
```

#### Category 6: MONETIZATION

```sql
-- Subscriptions
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  tier TEXT, -- "free", "silver", "gold", "platinum"
  status TEXT DEFAULT 'active', -- active, canceled, expired
  monthly_cost DECIMAL(8, 2),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  canceled_at TIMESTAMP
);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- In-App Purchases (Cosmetics, items, etc.)
CREATE TABLE purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  product_id TEXT NOT NULL,
  product_name TEXT,
  amount DECIMAL(8, 2),
  currency TEXT DEFAULT 'USD',
  transaction_id TEXT,
  status TEXT DEFAULT 'completed', -- pending, completed, failed, refunded
  purchased_at TIMESTAMP DEFAULT NOW(),
  refunded_at TIMESTAMP
);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_status ON purchases(status);
```

#### Category 7: ENGAGEMENT

```sql
-- Notifications
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT, -- "quest_ready", "friend_request", "party_invite"
  title TEXT,
  message TEXT,
  data JSONB,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read_at);

-- Leaderboards (Denormalized for performance)
CREATE TABLE leaderboards (
  id TEXT PRIMARY KEY,
  period TEXT, -- "daily", "weekly", "monthly", "alltime"
  rank INTEGER,
  user_id TEXT REFERENCES users(id),
  score INTEGER,
  metric_type TEXT, -- "total_xp", "quests_completed", "distance"
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_leaderboards_period ON leaderboards(period);
CREATE INDEX idx_leaderboards_metric ON leaderboards(metric_type, rank);
```

---

## PHASE 0: CRITICAL FIXES (1 WEEK)

### Objective
Fix breaking bugs to establish foundation for all subsequent work.

### Tasks

#### Task 0.1: Fix Missing RPC Functions (2 hours)
**File**: `wayfarer-nakama/nakama-data/modules/index.js`

```javascript
// Add these functions to the module

function rpcStartQuest(ctx, logger, nk, payload) {
  try {
    const data = JSON.parse(payload);
    const { questId, userId } = data;
    
    // Create user_quest record
    const result = nk.sqlExec(
      `INSERT INTO user_quests (id, user_id, quest_id, status, started_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())`,
      [generateId(), userId, questId, 'active']
    );
    
    // Update quest participant count
    nk.sqlExec(
      `UPDATE quests SET current_participants = current_participants + 1 WHERE id = $1`,
      [questId]
    );
    
    return JSON.stringify({ success: true, message: 'Quest started' });
  } catch (error) {
    logger.error('Error starting quest: ' + error);
    return JSON.stringify({ success: false, error: error.message });
  }
}

function rpcCompleteQuest(ctx, logger, nk, payload) {
  try {
    const data = JSON.parse(payload);
    const { questId, userId } = data;
    
    // Mark quest as completed
    nk.sqlExec(
      `UPDATE user_quests SET status = $1, completed_at = NOW() WHERE user_id = $2 AND quest_id = $3`,
      ['completed', userId, questId]
    );
    
    // Get quest reward
    const quest = nk.sqlQuery(
      `SELECT reward_xp, reward_coins FROM quests WHERE id = $1`,
      [questId]
    )[0];
    
    // Award XP and coins
    nk.sqlExec(
      `UPDATE user_profiles SET total_xp = total_xp + $1, coins = coins + $2 WHERE user_id = $3`,
      [quest.reward_xp, quest.reward_coins, userId]
    );
    
    // Check for level up
    const profile = nk.sqlQuery(
      `SELECT total_xp, level FROM user_profiles WHERE user_id = $1`,
      [userId]
    )[0];
    
    const newLevel = Math.floor(profile.total_xp / 1000) + 1;
    if (newLevel > profile.level) {
      nk.sqlExec(
        `UPDATE user_profiles SET level = $1 WHERE user_id = $2`,
        [newLevel, userId]
      );
    }
    
    return JSON.stringify({
      success: true,
      rewards: { xp: quest.reward_xp, coins: quest.reward_coins }
    });
  } catch (error) {
    logger.error('Error completing quest: ' + error);
    return JSON.stringify({ success: false, error: error.message });
  }
}

function rpcGetUserQuests(ctx, logger, nk, payload) {
  try {
    const data = JSON.parse(payload);
    const { userId, status } = data;
    
    let query = `SELECT q.*, uq.status, uq.progress_percent 
                 FROM quests q
                 JOIN user_quests uq ON q.id = uq.quest_id
                 WHERE uq.user_id = $1`;
    let params = [userId];
    
    if (status) {
      query += ` AND uq.status = $2`;
      params.push(status);
    }
    
    const quests = nk.sqlQuery(query, params);
    
    return JSON.stringify({
      success: true,
      quests: quests,
      count: quests.length
    });
  } catch (error) {
    logger.error('Error getting user quests: ' + error);
    return JSON.stringify({ success: false, error: error.message });
  }
}

// Register in InitModule
function InitModule(ctx, logger, nk, initializer) {
  // ... existing registrations ...
  initializer.registerRpc('start_quest', rpcStartQuest);
  initializer.registerRpc('complete_quest', rpcCompleteQuest);
  initializer.registerRpc('get_user_quests', rpcGetUserQuests);
}
```

#### Task 0.2: Fix MapComponent Syntax Error (30 minutes)
**File**: `apps/mobile/src/components/MapComponent.tsx`

Fix line 80:
```typescript
// BEFORE (broken)
const fetchQuests = async () => {
  try // ❌ MISSING BRACE
    setLoadingQuests(true);

// AFTER (fixed)
const fetchQuests = async () => {
  try {
    setLoadingQuests(true);
```

#### Task 0.3: Remove Hardcoded Tokens (30 minutes)
**File**: `apps/mobile/src/components/MapComponent.tsx`

```typescript
// BEFORE
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 
  'pk.eyJ1IjoidGhla2V5bWFzdGVyIiwiYSI6ImNtYWxjbmZtMDA3amEya3ByY2s5emdsOWsifQ.ibbwzXSyGrIIWIAZhjl1gQ';

// AFTER
const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
if (!mapboxToken) {
  throw new Error('EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN not set in .env');
}
```

#### Task 0.4: Setup OpenRouter (1 hour)
```bash
# 1. Sign up at openrouter.ai
# 2. Create .env.local with:
OPENROUTER_API_KEY=your_key_here

# 3. Test connection
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-haiku-4.5",
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

#### Task 0.5: Create SQL Migration Scripts (1 hour)
**File**: `wayfarer-nakama/migrations/001_create_full_schema.sql`

Execute all 22 table definitions from the schema above.

### Phase 0 Success Criteria
- ✅ Basic quest loop works (start → complete → reward)
- ✅ No syntax errors in codebase
- ✅ MapComponent renders without errors
- ✅ OpenRouter connection verified
- ✅ All 22 tables created
- ✅ Nakama RPC functions registered

---

## PHASE 1: CORE QUEST SYSTEM (2 WEEKS)

### Objective
Implement AI-powered quest generation with complete quest lifecycle.

### Task 1.1: Implement Quest Generation RPC (3 hours)
**File**: `wayfarer-nakama/nakama-data/modules/questGeneration.js`

```javascript
function rpcGenerateScavengerHunt(ctx, logger, nk, payload) {
  try {
    const data = JSON.parse(payload);
    const { locations, userTags, difficulty } = data;
    
    const locationDescriptions = locations
      .map(loc => `${loc.name} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`)
      .join('\n');
    
    const difficultyDesc = {
      1: '5-10 minutes, very easy activities',
      2: '15-20 minutes, moderate difficulty',
      3: '30-45 minutes, challenging activities'
    }[difficulty] || 'moderate';
    
    const prompt = `You are an expert game designer creating immersive scavenger hunts.
    
User interests: ${userTags.join(', ')}
Difficulty: ${difficultyDesc}
Locations to visit:
${locationDescriptions}

Create a 5-stop scavenger hunt. For each stop:
1. Creative activity matching user interests
2. Clear success criteria
3. Estimated time (2-5 min per stop)
4. Optional hint for accessibility

Return ONLY valid JSON with NO extra text:
{
  "title": "Hunt Name",
  "theme": "Theme description",
  "totalTime": 25,
  "stops": [
    {
      "stopNumber": 1,
      "location": {"lat": 0.0, "lng": 0.0},
      "activity": "Activity description",
      "successCriteria": "How to complete",
      "timeMinutes": 5,
      "hint": "Optional hint"
    }
  ]
}`;
    
    // Call OpenRouter
    const response = fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nk.env.get('OPENROUTER_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4.5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      })
    });
    
    const result = response.json();
    const questJson = JSON.parse(result.choices[0].message.content);
    
    return JSON.stringify({
      success: true,
      quest: questJson
    });
  } catch (error) {
    logger.error('Error generating scavenger hunt: ' + error);
    return JSON.stringify({
      success: false,
      error: error.message
    });
  }
}
```

### Task 1.2: Implement Quest Details Screen (4 hours)
**File**: `apps/mobile/src/screens/QuestDetailScreen.tsx`

Create comprehensive quest detail view with:
- Quest title, description, location map
- Difficulty indicator
- Estimated time & rewards (XP, coins, items)
- Step-by-step guide
- Start/Resume/Complete buttons
- Progress indicator

### Task 1.3: Implement Quest List Screen Filters (3 hours)
**File**: `apps/mobile/src/screens/QuestListScreen.tsx`

Add filtering for:
- By distance (1km, 5km, 10km, 20km+)
- By difficulty (Easy, Medium, Hard)
- By type (Scavenger, Mystery, Exploration)
- By status (Available, In Progress, Completed)
- Search by name

### Task 1.4: Implement Achievement Tracking (3 hours)
**File**: `wayfarer-nakama/nakama-data/modules/achievements.js`

```javascript
function rpcCreateAchievement(ctx, logger, nk, payload) {
  try {
    const data = JSON.parse(payload);
    const { userId, questId, type } = data;
    
    const query = `INSERT INTO achievements 
      (id, user_id, quest_id, achievement_type, created_at)
      VALUES ($1, $2, $3, $4, NOW())`;
    
    nk.sqlExec(query, [generateId(), userId, questId, type]);
    
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

### Task 1.5: Quest Completion Screen (3 hours)
**File**: `apps/mobile/src/screens/QuestCompleteScreen.tsx`

Display on quest completion:
- Celebratory animation
- Rewards earned (XP, coins, items, badges)
- Stats (time taken, efficiency rating)
- Share to social
- Next quest recommendation

### Phase 1 Success Criteria
- ✅ Quest generation works (via OpenRouter)
- ✅ Users can view detailed quest info
- ✅ Users can start and complete quests
- ✅ Rewards properly awarded
- ✅ Achievements tracked
- ✅ 60%+ quest completion rate in testing

---

## PHASE 2: PROGRESSION & MULTIPLAYER (2 WEEKS)

### Objective
Implement leveling system, badges, items, and multiplayer party features.

### Task 2.1: Implement Leveling System (3 hours)

```javascript
function rpcGetUserLevel(ctx, logger, nk, payload) {
  try {
    const userId = ctx.userId;
    
    const profile = nk.sqlQuery(
      `SELECT level, total_xp, coins, gems FROM user_profiles WHERE user_id = $1`,
      [userId]
    )[0];
    
    const xpPerLevel = 1000;
    const nextLevelXp = (profile.level) * xpPerLevel;
    const xpProgress = profile.total_xp - (profile.level - 1) * xpPerLevel;
    
    return JSON.stringify({
      success: true,
      level: profile.level,
      currentXp: profile.total_xp,
      xpProgress: xpProgress,
      xpRequired: xpPerLevel,
      coins: profile.coins,
      gems: profile.gems
    });
  } catch (error) {
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

### Task 2.2: Implement Badge System (4 hours)

**Backend RPC**:
```javascript
function rpcCheckBadgeUnlock(ctx, logger, nk, payload) {
  try {
    const userId = ctx.userId;
    
    // Check all badge criteria
    const badges = nk.sqlQuery(`SELECT * FROM badges`);
    
    for (const badge of badges) {
      const criteria = JSON.parse(badge.unlock_criteria);
      
      if (checkCriteria(userId, criteria, nk)) {
        // Check if already earned
        const existing = nk.sqlQuery(
          `SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2`,
          [userId, badge.id]
        );
        
        if (!existing.length) {
          nk.sqlExec(
            `INSERT INTO user_badges (id, user_id, badge_id, earned_at)
             VALUES ($1, $2, $3, NOW())`,
            [generateId(), userId, badge.id]
          );
        }
      }
    }
    
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

**Frontend Screen** - `apps/mobile/src/screens/BadgesScreen.tsx`:
- Show all badges with unlock status
- Display unlock criteria
- Animate newly unlocked badges
- Show rarity level

### Task 2.3: Implement Item System (3 hours)

**Items in inventory**:
```javascript
function rpcUseItem(ctx, logger, nk, payload) {
  try {
    const { itemId } = JSON.parse(payload);
    const userId = ctx.userId;
    
    const item = nk.sqlQuery(
      `SELECT * FROM items WHERE id = $1`,
      [itemId]
    )[0];
    
    // Apply effect based on type
    switch (item.effect_type) {
      case 'quest_skip':
        // Skip current quest step
        break;
      case 'double_xp':
        // Set temporary boost
        nk.sqlExec(
          `UPDATE user_profiles SET xp_multiplier = 2 WHERE user_id = $1`,
          [userId]
        );
        break;
      case 'hint_reveal':
        // Show hint
        break;
    }
    
    // Remove from inventory
    nk.sqlExec(
      `UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = $1 AND item_id = $2`,
      [userId, itemId]
    );
    
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

### Task 2.4: Implement Party System (5 hours)

**RPC Functions**:
```javascript
function rpcCreateParty(ctx, logger, nk, payload) {
  try {
    const { questId, maxMembers } = JSON.parse(payload);
    const userId = ctx.userId;
    
    const partyId = generateId();
    
    nk.sqlExec(
      `INSERT INTO parties (id, name, leader_id, quest_id, max_members, current_members, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 1, 'open', NOW())`,
      [partyId, `Party by ${userId}`, userId, questId, maxMembers]
    );
    
    nk.sqlExec(
      `INSERT INTO party_members (id, party_id, user_id, role, joined_at)
       VALUES ($1, $2, $3, 'leader', NOW())`,
      [generateId(), partyId, userId]
    );
    
    return JSON.stringify({ success: true, partyId: partyId });
  } catch (error) {
    return JSON.stringify({ success: false, error: error.message });
  }
}

function rpcJoinParty(ctx, logger, nk, payload) {
  try {
    const { partyId } = JSON.parse(payload);
    const userId = ctx.userId;
    
    const party = nk.sqlQuery(
      `SELECT * FROM parties WHERE id = $1`,
      [partyId]
    )[0];
    
    if (party.current_members >= party.max_members) {
      return JSON.stringify({ success: false, error: 'Party is full' });
    }
    
    nk.sqlExec(
      `INSERT INTO party_members (id, party_id, user_id, role, joined_at)
       VALUES ($1, $2, $3, 'member', NOW())`,
      [generateId(), partyId, userId]
    );
    
    nk.sqlExec(
      `UPDATE parties SET current_members = current_members + 1 WHERE id = $1`,
      [partyId]
    );
    
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

**Frontend Screen** - `apps/mobile/src/screens/PartyScreen.tsx`:
- Create/join parties
- Show party members and their progress
- Real-time sync of party status
- Leave party

### Task 2.5: Implement Leaderboards (3 hours)

**RPC**:
```javascript
function rpcGetLeaderboard(ctx, logger, nk, payload) {
  try {
    const { period = 'weekly', metricType = 'total_xp', limit = 100 } = JSON.parse(payload);
    
    const leaderboard = nk.sqlQuery(
      `SELECT rank, user_id, score FROM leaderboards
       WHERE period = $1 AND metric_type = $2
       ORDER BY rank ASC
       LIMIT $3`,
      [period, metricType, limit]
    );
    
    return JSON.stringify({ success: true, leaderboard: leaderboard });
  } catch (error) {
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

**Frontend Screen** - `apps/mobile/src/screens/LeaderboardScreen.tsx`:
- Show top players by various metrics
- Period selector (daily, weekly, monthly, all-time)
- User's rank highlighted
- Metric selector (XP, quests completed, distance)

### Phase 2 Success Criteria
- ✅ Level system working (visible progression)
- ✅ Badges unlock properly
- ✅ Items usable in gameplay
- ✅ Parties fully functional
- ✅ Leaderboards updating
- ✅ Multiplayer features tested with 4+ users

---

## PHASE 3: ADVANCED FEATURES (2 WEEKS)

### Objective
Add social features, notifications, and advanced gameplay systems.

### Task 3.1: Implement Friend System (3 hours)

```javascript
function rpcSendFriendRequest(ctx, logger, nk, payload) {
  try {
    const { targetUserId } = JSON.parse(payload);
    const userId = ctx.userId;
    
    nk.sqlExec(
      `INSERT INTO friendships (id, user_id_1, user_id_2, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())`,
      [generateId(), userId, targetUserId]
    );
    
    // Send notification
    sendNotification(nk, targetUserId, 'friend_request', `${userId} sent you a friend request`);
    
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

### Task 3.2: Implement Notifications (4 hours)

**Types**:
- Quest ready in your area
- Friend request/accepted
- Party invite/joined
- Achievement unlocked
- Level up
- Friend completed nearby quest
- Daily reward available

```javascript
function rpcSendNotification(ctx, logger, nk, userId, type, title, message, data) {
  try {
    nk.sqlExec(
      `INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [generateId(), userId, type, title, message, JSON.stringify(data)]
    );
    
    // Also send push notification via Firebase
    sendPushNotification(userId, title, message);
    
    return JSON.stringify({ success: true });
  } catch (error) {
    logger.error('Error sending notification: ' + error);
  }
}
```

### Task 3.3: Implement Profile & Stats (3 hours)

**File**: `apps/mobile/src/screens/ProfileScreen.tsx`

Display:
- User avatar and name
- Current level and XP progress
- Total quests completed
- Badges earned
- Friends list
- Statistics (total distance, playtime, etc.)
- Settings

### Task 3.4: Implement Quest Search & Discovery (3 hours)

**RPC - Search nearby quests**:
```javascript
function rpcSearchNearbyQuests(ctx, logger, nk, payload) {
  try {
    const { latitude, longitude, radiusKm = 5, filters = {} } = JSON.parse(payload);
    
    let query = `
      SELECT q.*, ST_Distance(
        ST_Point(q.longitude, q.latitude),
        ST_Point($1, $2)
      ) as distance_m
      FROM quests q
      WHERE q.status = 'available'
      AND ST_DWithin(
        ST_Point(q.longitude, q.latitude),
        ST_Point($1, $2),
        $3 * 1000
      )`;
    
    let params = [longitude, latitude, radiusKm];
    
    if (filters.difficulty) {
      query += ` AND q.difficulty = $${params.length + 1}`;
      params.push(filters.difficulty);
    }
    
    query += ` ORDER BY distance_m ASC`;
    
    const quests = nk.sqlQuery(query, params);
    
    return JSON.stringify({ success: true, quests: quests });
  } catch (error) {
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

### Task 3.5: Implement Settings & Preferences (2 hours)

**File**: `apps/mobile/src/screens/SettingsScreen.tsx`

Options:
- Notification preferences
- Location tracking (on/off)
- Privacy settings
- Account management
- Language selection
- Theme (light/dark)

### Phase 3 Success Criteria
- ✅ Friends system functional
- ✅ Notifications working (in-app + push)
- ✅ Profile fully functional
- ✅ Quest discovery improved
- ✅ User settings persist

---

## PHASE 4: MONETIZATION & POLISH (1-2 WEEKS)

### Objective
Implement monetization systems and production-ready polish.

### Task 4.1: Implement Shop System (4 hours)

**File**: `apps/mobile/src/screens/ShopScreen.tsx`

Shop categories:
- **Cosmetics** (avatars, emotes, skins)
- **Consumables** (boosters, hints, skips)
- **Battle Pass** (seasonal, cosmetic + rewards)

**RPC**:
```javascript
function rpcPurchaseItem(ctx, logger, nk, payload) {
  try {
    const { productId } = JSON.parse(payload);
    const userId = ctx.userId;
    
    const product = getProduct(productId);
    const user = nk.sqlQuery(`SELECT coins, gems FROM user_profiles WHERE user_id = $1`, [userId])[0];
    
    if (product.currency === 'gems' && user.gems < product.price) {
      return JSON.stringify({ success: false, error: 'Insufficient gems' });
    }
    
    if (product.currency === 'coins' && user.coins < product.price) {
      return JSON.stringify({ success: false, error: 'Insufficient coins' });
    }
    
    // Deduct currency
    nk.sqlExec(
      `UPDATE user_profiles SET ${product.currency} = ${product.currency} - $1 WHERE user_id = $2`,
      [product.price, userId]
    );
    
    // Grant item
    nk.sqlExec(
      `INSERT INTO user_inventory (id, user_id, item_id, quantity, acquired_at)
       VALUES ($1, $2, $3, 1, NOW())`,
      [generateId(), userId, productId]
    );
    
    // Log purchase
    nk.sqlExec(
      `INSERT INTO purchases (id, user_id, product_id, product_name, amount, currency, status, purchased_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW())`,
      [generateId(), userId, productId, product.name, product.price, product.currency]
    );
    
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

### Task 4.2: Implement Subscription System (3 hours)

**Tiers**:
- **Silver** ($3.99/month) - +50% XP, 1 free skip/week
- **Gold** ($7.99/month) - +100% XP, unlimited skips, daily bonus
- **Platinum** ($14.99/month) - All + cosmetics + priority matchmaking

```javascript
function rpcSubscribe(ctx, logger, nk, payload) {
  try {
    const { tier } = JSON.parse(payload);
    const userId = ctx.userId;
    
    const tierConfig = {
      'silver': { cost: 399, xpMultiplier: 1.5 },
      'gold': { cost: 799, xpMultiplier: 2.0 },
      'platinum': { cost: 1499, xpMultiplier: 3.0 }
    };
    
    const config = tierConfig[tier];
    
    nk.sqlExec(
      `INSERT INTO subscriptions (id, user_id, tier, status, monthly_cost, started_at, expires_at, created_at)
       VALUES ($1, $2, $3, 'active', $4, NOW(), NOW() + INTERVAL 30 DAY, NOW())`,
      [generateId(), userId, tier, config.cost / 100]
    );
    
    return JSON.stringify({ success: true });
  } catch (error) {
    return JSON.stringify({ success: false, error: error.message });
  }
}
```

### Task 4.3: Implement Analytics & Telemetry (2 hours)

Track:
- User acquisition source
- Daily active users (DAU)
- Monthly active users (MAU)
- Retention rates
- Quest completion rate
- Average session length
- Revenue metrics

### Task 4.4: Performance Optimization (3 hours)

- Implement query caching
- Optimize location queries with spatial indices
- Reduce API calls
- Optimize image loading
- Implement pagination for lists

### Task 4.5: QA & Testing (4 hours)

- Full E2E testing
- Load testing (1000+ concurrent users)
- Edge case handling
- Crash reporting setup
- User feedback integration

### Task 4.6: Documentation & Deployment (2 hours)

- API documentation
- Setup guide for new developers
- Deployment procedures
- Monitoring setup
- Rollback procedures

### Phase 4 Success Criteria
- ✅ Shop system fully functional
- ✅ Subscriptions working
- ✅ Analytics tracking
- ✅ Performance benchmarks met
- ✅ All QA tests passing
- ✅ Ready for production deployment

---

## API REFERENCE

### Authentication
```
POST /v2/account/authenticate/email
  email: string
  password: string
  create: boolean
  username: string

Response:
  token: string
  user_id: string
```

### Quest System

```
RPC: create_quest
  body: { userId, title, description, location }
  returns: { questId, generatedSteps }

RPC: start_quest
  body: { questId }
  returns: { success, message }

RPC: complete_quest
  body: { questId }
  returns: { success, rewards }

RPC: get_available_quests
  body: { latitude, longitude, radius, filters }
  returns: { quests[], count }

RPC: get_user_quests
  body: { status? }
  returns: { quests[], count }

RPC: get_quest_detail
  body: { questId }
  returns: { quest, steps }
```

### Progression

```
RPC: get_user_level
  returns: { level, currentXp, xpProgress, xpRequired }

RPC: get_user_badges
  returns: { badges[], totalEarned }

RPC: get_leaderboard
  body: { period, metricType, limit }
  returns: { leaderboard[], userRank }

RPC: get_user_inventory
  returns: { items[] }
```

### Social

```
RPC: send_friend_request
  body: { targetUserId }
  returns: { success }

RPC: get_friends
  returns: { friends[] }

RPC: create_party
  body: { questId, maxMembers }
  returns: { partyId }

RPC: join_party
  body: { partyId }
  returns: { success }

RPC: get_party_members
  body: { partyId }
  returns: { members[] }
```

### Monetization

```
RPC: purchase_item
  body: { productId }
  returns: { success, newBalance }

RPC: subscribe
  body: { tier }
  returns: { success, expiresAt }

RPC: get_subscription_status
  returns: { tier, expiresAt, benefits }
```

---

## TESTING & QA STRATEGY

### Unit Testing
```typescript
// Example: Quest creation test
describe('Quest Creation', () => {
  it('should create quest with valid input', async () => {
    const quest = await createQuest({
      title: 'Test Quest',
      location: { lat: 40.7128, lng: -74.0060 }
    });
    expect(quest.id).toBeDefined();
    expect(quest.status).toBe('available');
  });

  it('should reject quest with invalid location', async () => {
    expect(() => createQuest({
      title: 'Test',
      location: { lat: 91, lng: 181 } // Invalid
    })).toThrow();
  });
});
```

### Integration Testing
```typescript
// Full quest lifecycle
describe('Full Quest Lifecycle', () => {
  it('should complete full quest flow', async () => {
    const user = await createTestUser();
    const quest = await generateQuest(user);
    const startResult = await startQuest(user, quest);
    const completeResult = await completeQuest(user, quest);
    
    expect(completeResult.success).toBe(true);
    expect(completeResult.rewards.xp).toBeGreaterThan(0);
  });
});
```

### Load Testing
```bash
# Simulate 1000 concurrent users with k6
k6 run --vus 1000 --duration 30s load_test.js
```

### UAT Scenarios
1. New user onboarding
2. Quest discovery and completion
3. Multiplayer party formation
4. Shop purchase flow
5. Subscription activation

---

## IMPLEMENTATION TIMELINE

### Week 1: Phase 0 (Critical Fixes)
```
Mon-Tue: Fix RPC functions, syntax errors
Wed:     Setup OpenRouter, database
Thu-Fri: Testing, verification
```

### Weeks 2-3: Phase 1 (Core Quests)
```
Mon-Tue: Quest generation, templates
Wed:     Quest detail screens, filters
Thu-Fri: Achievement system, testing
```

### Weeks 4-5: Phase 2 (Progression)
```
Mon-Tue: Leveling, badges
Wed:     Items, inventory
Thu-Fri: Parties, leaderboards, testing
```

### Weeks 6-7: Phase 3 (Advanced)
```
Mon-Tue: Friends, notifications
Wed:     Profile, discovery
Thu-Fri: Settings, testing
```

### Week 8: Phase 4 (Monetization & Launch)
```
Mon-Tue: Shop, subscriptions
Wed:     Analytics, optimization
Thu-Fri: Final QA, deployment prep
```

---

## SUCCESS METRICS & KPIs

### User Engagement
- Daily Active Users: 50K+
- Weekly Active Users: 200K+
- Session Length: 15-20 minutes
- Retention (Day 7): 40%+
- Retention (Day 30): 20%+

### Gameplay
- Quest Completion Rate: 60%+
- Average Party Size: 2.5 players
- Friend Count (avg): 10+ friends
- Badge Unlock Rate: 30% of badges per user

### Monetization
- Conversion Rate (subscription): 5-10%
- ARPPU (Average Revenue Per Paying User): $2-5
- LTV (Lifetime Value): $20-50
- Monetization Ratio: 10-20% conversion

### Technical
- API Response Time: < 500ms (p95)
- Crash Rate: < 0.5%
- Error Rate: < 1%
- Uptime: > 99.9%

---

## RISK MITIGATION

| Risk | Mitigation |
|------|-----------|
| OpenRouter outage | Implement fallback to Nvidia/local generation |
| Database scaling | Use read replicas, caching layer (Redis) |
| Mapbox costs | Implement tile server, cost management |
| User churn | Implement retention campaigns, AB testing |
| Server load | Implement auto-scaling, load balancing |
| Security | Regular audits, bug bounty program |

---

## CONCLUSION

This complete implementation plan provides a clear roadmap to build a world-class location-based game. By following this phased approach:

1. **Week 1**: Fix critical blockers (foundation)
2. **Weeks 2-5**: Build core gameplay (engagement)
3. **Weeks 6-7**: Add social features (retention)
4. **Week 8**: Monetization and launch (revenue)

**Expected Outcomes**:
- ✅ Production-ready application
- ✅ 50K+ DAU potential
- ✅ 5-10% subscription conversion
- ✅ Clear path to profitability
- ✅ Scalable architecture
- ✅ Team-ready codebase

**Next Actions**:
1. Assemble development team
2. Allocate resources
3. Begin Phase 0 immediately
4. Establish daily standups
5. Setup CI/CD pipeline

---

**Generated**: November 4, 2025  
**Status**: Ready for implementation  
**Confidence Level**: High (based on existing code patterns)

🚀 **Let's build something amazing!**
