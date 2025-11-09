# Quest System Setup Guide

Quick setup guide for Wayfarer quest system.

## Prerequisites

- Docker and Docker Compose running
- Nakama server running
- CockroachDB database accessible

## Step 1: Initialize Database (Complete Schema)

**⚠️ IMPORTANT**: Use the full schema migration, not the old `create_quest_tables.sql`.

See **[DATABASE_MIGRATION.md](wayfarer-nakama/DATABASE_MIGRATION.md)** for detailed instructions.

**Quick Command** (using migration script):
```bash
# Run migrations (uses centralized config from .env.deployment)
./run-migrations.sh

# Or with schema fixes
./run-migrations.sh --fix-schema
```

**Manual Command** (if needed):
```bash
# SSH into VPS (using configured host from .env.deployment.local)
ssh ${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}
cd ${DEPLOYMENT_SERVER_DIR}
docker exec -i wayfarer-nakama-cockroachdb-1 cockroach sql --insecure < migrations/001_create_full_schema.sql
```

This creates all 22 tables including quests, user_quests, achievements, badges, items, parties, etc.

### Verify Tables Created

```bash
# Using health check script (recommended)
./scripts/health-check.sh --full

# Or manually on VPS (using configured host)
ssh ${DEPLOYMENT_SERVER_USER}@${DEPLOYMENT_SERVER_HOST}
cd ${DEPLOYMENT_SERVER_DIR}
docker exec -it wayfarer-nakama-cockroachdb-1 cockroach sql --insecure
```

```sql
USE nakama;
SHOW TABLES;  -- Should show 22 tables
SELECT COUNT(*) FROM quests;  -- Will be 0 initially, but table exists
```

## Step 1b: Add Test Quests (Optional)

If you want test data, use the old schema file or add manually:

```sql
USE nakama;

CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 50,
  difficulty INTEGER DEFAULT 1,
  xp_reward INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_quests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quests_location ON quests(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_status ON user_quests(status);

-- Insert test quests (Seattle area)
INSERT INTO quests (id, title, description, location_lat, location_lng, radius_meters, difficulty, xp_reward) VALUES
('quest_001', 'Snapshot of Seattle', 'Seattle is a multi-location adventure that guides players through diverse neighborhoods, from the bustling Pike Place Market to the serene Washington Park Arboretum.', 47.6085, -122.3406, 100, 1, 100),
('quest_002', 'Pike Place Market Explorer', 'Discover the rich history of Pike Place Market, from its founding in 1907 to its current status as one of America''s most famous public markets.', 47.6096, -122.3422, 75, 1, 100),
('quest_003', 'City Explorer Quest', 'Explore the hidden gems of the city!', 47.6062, -122.3321, 150, 2, 150),
('quest_004', 'The Foodie Get Down', 'Find the best food spots in Seattle', 47.6143, -122.3353, 200, 2, 150),
('quest_005', 'Park Tour', 'Visit beautiful parks and green spaces', 47.6306, -122.2757, 300, 1, 125),
('quest_006', 'Murder at the Pier', 'Solve the mystery at the waterfront', 47.6062, -122.3387, 100, 3, 200),
('quest_007', 'The Great Boba Adventure', 'Discover the best boba tea shops', 47.6114, -122.3327, 150, 1, 100),
('quest_008', 'It wasn''t me!', 'A fun adventure quest', 47.6085, -122.3367, 120, 2, 150),
('quest_009', 'Thrift your heart out', 'Find hidden treasures at thrift stores', 47.6136, -122.3234, 180, 1, 125)
ON CONFLICT (id) DO NOTHING;
```

## Step 2: Deploy Runtime Module

The runtime module should be in `wayfarer-nakama/nakama-data/modules/index.js`. 

### Ensure Module is Loaded

```bash
# Check if Nakama container is running
docker compose ps

# Restart Nakama to reload modules
docker compose restart nakama

# Check logs for module initialization
docker compose logs nakama | grep -i "runtime module"
```

You should see:
```
Wayfarer JavaScript Runtime Module initialized
RPC functions registered: test_function, update_user_location, get_available_quests, start_quest, complete_quest, get_user_quests, generate_scavenger_hunt, create_achievement, get_user_level, check_badge_unlock, get_quest_detail, get_user_inventory, use_item, create_party, join_party, leave_party, get_party_members, get_leaderboard
```

## Step 3: Test RPC Functions

### Using Nakama Console

1. Go to `http://${NAKAMA_HOST}:${NAKAMA_CONSOLE_PORT}` (default: 7351) or localhost:7351
2. Login: `admin` / `password`
3. Navigate to "RPC" section
4. Test functions:

**Test `get_available_quests`:**
```json
{}
```

**Test `get_available_quests` with location:**
```json
{
  "latitude": 47.6085,
  "longitude": -122.3406,
  "maxDistanceKm": 10
}
```

### Using Mobile App

1. Start the mobile app
2. Login with an account
3. Navigate to HomeScreen
4. You should see quest markers on the map
5. Click "View Quests" button to see quest list
6. Click on a quest to see details
7. Click "Join Quest" to start a quest
8. Click "Complete Quest" to finish and earn XP

## Step 4: Verify Quest Flow

### Test Complete Flow

1. **Login** → User authenticated
2. **Location Update** → Call `update_user_location` RPC
3. **Fetch Quests** → Call `get_available_quests` with location
4. **Start Quest** → Call `start_quest` RPC
5. **Complete Quest** → Call `complete_quest` RPC
6. **Check XP** → User metadata should have updated XP and level

### Check User Progress

```sql
-- Check user quests
SELECT uq.*, q.title 
FROM user_quests uq 
JOIN quests q ON uq.quest_id = q.id 
WHERE uq.user_id = 'your-user-id-here';

-- Check user XP (stored in Nakama metadata)
-- This requires querying Nakama's users table or using the console
```

## Troubleshooting

### Common Issues

**Tables not created**: See [DATABASE_MIGRATION.md](wayfarer-nakama/DATABASE_MIGRATION.md) for troubleshooting.

**RPC functions not found**:
1. Verify `nakama-data/modules/index.js` exists
2. Check logs: `docker compose logs nakama`
3. Restart: `docker compose restart nakama`

**No quests showing**: 
- Use `generate_scavenger_hunt` RPC to create AI-generated quests
- Or insert manually via SQL

**Quest completion not awarding XP**:
- Check `complete_quest` RPC logs
- Verify user_profiles table exists and has user record
- Check mobile app logs for errors

