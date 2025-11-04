# Quest System Setup Guide

This guide will help you set up the quest system for Wayfarer, including database initialization and testing.

## Prerequisites

- Access to VPS (5.181.218.160)
- Docker and Docker Compose running on VPS
- Nakama server running
- CockroachDB database accessible

## Step 1: Initialize Database Tables

### Option A: Using SQL File (Recommended)

```bash
# SSH into VPS
ssh root@5.181.218.160

# Navigate to project directory
cd ~/wayfarer/wayfarer-nakama

# Copy SQL file to container and execute
docker cp create_quest_tables.sql wayfarer-nakama-cockroachdb-1:/tmp/
docker exec -i wayfarer-nakama-cockroachdb-1 cockroach sql --insecure < create_quest_tables.sql
```

### Option B: Manual SQL Execution

```bash
# Connect to CockroachDB
ssh root@5.181.218.160
docker exec -it wayfarer-nakama-cockroachdb-1 cockroach sql --insecure
```

Then paste the contents of `wayfarer-nakama/create_quest_tables.sql`:

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

## Step 2: Verify Tables Created

```bash
docker exec -it wayfarer-nakama-cockroachdb-1 cockroach sql --insecure
```

```sql
USE nakama;

-- Check quests table
SELECT COUNT(*) FROM quests;
SELECT id, title, location_lat, location_lng FROM quests LIMIT 5;

-- Check user_quests table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'user_quests';
```

Expected output:
- 9 quests in the `quests` table
- `user_quests` table exists with proper columns

## Step 3: Deploy Runtime Module

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
RPC functions registered: test_function, update_user_location, get_available_quests, start_quest, complete_quest, get_user_quests
```

## Step 4: Test RPC Functions

### Using Nakama Console

1. Go to `http://5.181.218.160:7351` (or localhost:7351)
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

## Step 5: Verify Quest Flow

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

### Issue: Tables not created

**Solution:**
```bash
# Check if CockroachDB is running
docker compose ps

# Check CockroachDB logs
docker compose logs cockroachdb

# Try connecting directly
docker exec -it wayfarer-nakama-cockroachdb-1 cockroach sql --insecure
```

### Issue: RPC functions not found

**Solution:**
1. Verify `nakama-data/modules/index.js` exists
2. Check Nakama logs for errors: `docker compose logs nakama`
3. Restart Nakama: `docker compose restart nakama`
4. Verify module path in docker-compose.yml

### Issue: No quests showing in app

**Solution:**
1. Verify quests exist: `SELECT COUNT(*) FROM quests;`
2. Check user location is being sent
3. Verify RPC function is working in Nakama Console
4. Check mobile app logs for errors

### Issue: Quest completion not awarding XP

**Solution:**
1. Check `complete_quest` RPC logs in Nakama
2. Verify user metadata update: Use Nakama Console to check user account
3. Check for errors in mobile app logs

## Next Steps

After setup is complete:

1. ✅ Test quest discovery with location
2. ✅ Test quest start/complete flow
3. ✅ Verify XP rewards
4. ✅ Test multiple users
5. ✅ Add more quests via SQL or future admin interface

## Adding New Quests

To add new quests, use SQL:

```sql
INSERT INTO quests (id, title, description, location_lat, location_lng, radius_meters, difficulty, xp_reward) VALUES
('quest_010', 'Your Quest Title', 'Quest description here', 47.6062, -122.3321, 100, 1, 100);
```

Or create an admin interface for quest management (future enhancement).

