# End-to-End Testing Guide for Wayfarer

**Last Updated**: Current Session  
**Status**: Test infrastructure ready, comprehensive testing needed

---

## 📋 Overview

This guide explains how to perform comprehensive end-to-end testing of the Wayfarer MVP. The project has test infrastructure in place, but needs systematic testing of all user journeys.

---

## ✅ What's Already in Place

### Test Infrastructure
- ✅ **Test Runner Script**: `run-integration-tests.sh` - Automated test execution
- ✅ **Test Runner**: `test-integration/test-runner.js` - 700+ lines of test code
- ✅ **External API Tests**: `test-integration/test-external-apis.js` - Google Maps, OpenRouter, Open Trivia DB
- ✅ **Test Helpers**: RPC call wrappers, assertion functions, logging
- ✅ **Test Data Factory**: Creates fake users, quests, and test data

### What Gets Tested Currently
- ✅ User authentication and management
- ✅ Location services (`update_user_location`)
- ✅ Quest discovery (`get_available_quests`)
- ✅ Party/group functionality (`create_party`, `join_party`, `get_party_members`)
- ✅ Leaderboards (`get_leaderboard`)
- ✅ Inventory (`get_user_inventory`)
- ✅ Places discovery (`get_places_nearby`)
- ✅ External API integrations (Google Maps, OpenRouter, Open Trivia DB)

### What's Missing from Tests
- ❌ **Multi-step quest completion** (10-step scavenger hunt flow)
- ❌ **Step-by-step progression** (`complete_step`, `submit_step_media`)
- ❌ **Quest completion** (`complete_quest`)
- ❌ **Photo upload** (MinIO integration)
- ❌ **Progression system** (XP awards, rank changes)
- ❌ **Achievement unlocking** (`check_badge_unlock`)
- ❌ **Rating submission** (`submit_rating`)
- ❌ **Event participation** (`join_event`, `get_event_leaderboard`)

---

## 🚀 Quick Start: Running Existing Tests

### Option 1: Test Against Remote Server (Recommended)

```bash
# From project root
cd /home/cb/wayfarer

# Set environment variables (optional - uses defaults if not set)
export NAKAMA_HOST=5.181.218.160  # Your remote server
export NAKAMA_PORT=7350
export NAKAMA_SERVER_KEY=defaultkey

# Optional: Set API keys for external API tests
export GOOGLE_MAPS_API_KEY=your-key-here
export OPENROUTER_API_KEY=your-key-here

# Run all tests
./run-integration-tests.sh
```

### Option 2: Test Against Local Docker

```bash
# From project root
cd /home/cb/wayfarer

# Set to use local Docker
export USE_REMOTE=false
export NAKAMA_HOST=localhost
export NAKAMA_PORT=7350

# Run tests (will start Docker services automatically)
./run-integration-tests.sh
```

### Option 3: Run Tests Manually

```bash
# Navigate to test directory
cd /home/cb/wayfarer/test-integration

# Set environment variables
export NAKAMA_HOST=5.181.218.160
export NAKAMA_PORT=7350
export NAKAMA_SERVER_KEY=defaultkey

# Run main test suite
node test-runner.js

# Run external API tests separately
node test-external-apis.js
```

---

## 📊 Step-by-Step: Comprehensive End-to-End Testing

### Phase 1: Prerequisites Check (5 minutes)

#### 1.1 Verify Server is Running

```bash
# Test connection to Nakama
curl http://5.181.218.160:7350/

# Should return: {"status":"ok"} or similar
```

#### 1.2 Check Database Migrations

```bash
# SSH to server
ssh root@5.181.218.160

# Check if migrations ran
cd /root/wayfarer/wayfarer-nakama
docker exec wayfarer-nakama-nakama-1 \
  /nakama/nakama migrate status \
  --database.address root@cockroachdb:26257

# Should show all migrations as "up"
```

#### 1.3 Verify RPC Functions Registered

```bash
# Check Nakama logs for RPC registration
ssh root@5.181.218.160
docker logs wayfarer-nakama-nakama-1 | grep "Registered JavaScript runtime RPC" | wc -l

# Should show: 77
```

#### 1.4 Set Environment Variables

```bash
# Create or update .env file in project root
cd /home/cb/wayfarer
cat > .env << EOF
NAKAMA_HOST=5.181.218.160
NAKAMA_PORT=7350
NAKAMA_SERVER_KEY=defaultkey
GOOGLE_MAPS_API_KEY=your-key-here
OPENROUTER_API_KEY=your-key-here
EOF
```

---

### Phase 2: Run Automated Test Suite (15-30 minutes)

#### 2.1 Run Full Test Suite

```bash
cd /home/cb/wayfarer
./run-integration-tests.sh
```

**Expected Output**:
```
╔════════════════════════════════════════════════════════════╗
║   Wayfarer Full Integration Test Suite                   ║
╚════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Checking Prerequisites
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Docker is installed
✅ Node.js v18.x.x is installed
✅ npm 9.x.x is installed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Nakama Host: 5.181.218.160
  Nakama Port: 7350
  Test Mode: Remote Server
  Test Users: 5
  Test Groups: 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Running Integration Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ User authentication
✅ Location updates
✅ Quest discovery
...
```

#### 2.2 Review Test Results

**Success Criteria**:
- ✅ All tests pass (green checkmarks)
- ✅ No connection errors
- ✅ No RPC function not found errors
- ✅ External API tests pass (if keys configured)

**Failure Indicators**:
- ❌ Red X marks indicate failed tests
- ⏭️ Yellow skip marks indicate skipped tests (usually missing API keys)
- Error messages show what failed

#### 2.3 Document Failures

```bash
# Save test output to file
./run-integration-tests.sh 2>&1 | tee test-results-$(date +%Y%m%d-%H%M%S).log

# Review failures
grep "❌" test-results-*.log
```

---

### Phase 3: Manual End-to-End User Journey Testing (30-60 minutes)

The automated tests don't cover complete user journeys. You need to test these manually:

#### 3.1 Test: Complete Scavenger Hunt Quest (10 Steps)

**Goal**: Verify a user can complete a full 10-step scavenger hunt quest.

**Steps**:

1. **Create Test User** (via mobile app or RPC)
   ```bash
   # Use mobile app: Register new account
   # Or use Nakama console: http://5.181.218.160:7351
   ```

2. **Set User Location** (near a quest location)
   ```javascript
   // Via RPC: update_user_location
   // Latitude: 40.7128 (NYC)
   // Longitude: -74.0060
   ```

3. **Discover Quests**
   ```javascript
   // Via RPC: get_available_quests
   // Should return quests near user location
   ```

4. **Generate Scavenger Hunt** (if none exist)
   ```javascript
   // Via RPC: generate_scavenger_hunt
   // Location: NYC coordinates
   // Should create 10-step quest
   ```

5. **Get Quest Detail**
   ```javascript
   // Via RPC: get_quest_detail
   // Should show all 10 steps
   ```

6. **Start Quest**
   ```javascript
   // Via RPC: start_quest
   // Should set user_quests.status = 'active'
   // Should set current_step_index = 0
   ```

7. **Complete Each Step** (repeat 10 times)
   ```javascript
   // For each step (0-9):
   // 1. Update user location to step location
   // 2. Via RPC: complete_step
   //    - Verify step completed
   //    - Verify progress_percent updated
   //    - Verify current_step_index incremented
   // 3. Optional: Via RPC: submit_step_media (photo/text)
   ```

8. **Verify Quest Completion**
   ```javascript
   // Via RPC: get_user_quests
   // Should show status = 'completed'
   // Should show progress_percent = 100
   ```

9. **Verify XP Awarded**
   ```javascript
   // Via RPC: get_user_level
   // Should show increased XP
   // Should show level/rank updated if threshold crossed
   ```

10. **Submit Rating**
    ```javascript
    // Via RPC: submit_rating
    // Should store rating in database
    ```

**Success Criteria**:
- ✅ All 10 steps complete successfully
- ✅ Quest status changes to 'completed'
- ✅ XP is awarded
- ✅ Rating can be submitted

**Failure Points to Check**:
- ❌ Step completion fails if not at location
- ❌ Step completion fails if previous step not completed
- ❌ Quest doesn't complete after 10 steps
- ❌ XP not awarded
- ❌ Rating submission fails

---

#### 3.2 Test: Group Quest with Party Coordination

**Goal**: Verify multiple users can join a party and complete a quest together.

**Steps**:

1. **Create Two Test Users**
   - User A: Leader
   - User B: Member

2. **User A: Create Party**
   ```javascript
   // Via RPC: create_party
   // Should return party_id
   ```

3. **User B: Join Party**
   ```javascript
   // Via RPC: join_party
   // Party code: from User A
   ```

4. **Both Users: Verify Party Members**
   ```javascript
   // Via RPC: get_party_members
   // Should show both users
   ```

5. **Both Users: Start Same Quest**
   ```javascript
   // Both call: start_quest
   // Same quest_id
   ```

6. **User A: Complete Step 1**
   ```javascript
   // Via RPC: complete_step
   ```

7. **User B: Verify Progress**
   ```javascript
   // Via RPC: get_quest_detail
   // Should show step 1 completed (shared progress)
   ```

8. **User B: Complete Step 2**
   ```javascript
   // Via RPC: complete_step
   ```

9. **Both Users: Complete Remaining Steps**
   - Alternate or work together
   - Verify shared progress

10. **Verify Both Users Get Rewards**
    ```javascript
    // Both call: get_user_level
    // Both should have increased XP
    ```

**Success Criteria**:
- ✅ Party creation works
- ✅ Users can join party
- ✅ Quest progress is shared
- ✅ Both users get rewards

---

#### 3.3 Test: Photo Upload Flow

**Goal**: Verify photo upload to MinIO storage works end-to-end.

**Prerequisites**:
- MinIO deployed (see `docs/NEXT_STEPS.md`)
- Environment variables configured

**Steps**:

1. **Start Quest** (as in 3.1)

2. **Complete Step with Photo**
   ```javascript
   // Via RPC: submit_step_media
   // Media type: 'photo'
   // Base64 encoded image data
   ```

3. **Verify Upload Success**
   ```javascript
   // Check response: should have media_url
   // URL format: https://minio-production.up.railway.app/wayfarer-photos/...
   ```

4. **Verify Photo in MinIO**
   - Go to MinIO Console
   - Navigate to `wayfarer-photos` bucket
   - Should see uploaded file

5. **Verify Photo URL Accessible**
   - Copy URL from database
   - Open in browser
   - Should display photo

**Success Criteria**:
- ✅ Photo uploads successfully
- ✅ URL stored in database
- ✅ Photo accessible via URL
- ✅ Photo appears in MinIO bucket

---

#### 3.4 Test: Progression System

**Goal**: Verify XP, ranks, and achievements work correctly.

**Steps**:

1. **Get Initial User Level**
   ```javascript
   // Via RPC: get_user_level
   // Note: current XP, level, rank
   ```

2. **Complete Quest** (as in 3.1)

3. **Verify XP Increased**
   ```javascript
   // Via RPC: get_user_level
   // Should show increased total_xp
   ```

4. **Verify Rank Calculation**
   ```javascript
   // Check rank based on XP thresholds:
   // 0-99: New Wayfarer
   // 100-299: Junior Wayfarer
   // 300-599: Adept Cartographer
   // 600-999: Seasoned Explorer
   // 1000+: Renowned Trailblazer
   ```

5. **Check Achievements**
   ```javascript
   // Via RPC: get_user_achievements
   // Should show achievements earned
   ```

6. **Check Badges**
   ```javascript
   // Via RPC: check_badge_unlock
   // Should unlock badges based on achievements
   ```

7. **Check Leaderboard**
   ```javascript
   // Via RPC: get_leaderboard
   // User should appear in leaderboard
   ```

**Success Criteria**:
- ✅ XP increases correctly
- ✅ Rank updates at thresholds
- ✅ Achievements unlock
- ✅ Badges awarded
- ✅ User appears in leaderboard

---

### Phase 4: Mobile App Testing (30-60 minutes)

Test the complete flow using the mobile app:

#### 4.1 Setup Mobile App

```bash
# Build and run mobile app
cd /home/cb/wayfarer/apps/mobile

# Set environment variables
export EXPO_PUBLIC_NAKAMA_HOST=5.181.218.160
export EXPO_PUBLIC_NAKAMA_PORT=7350
export EXPO_PUBLIC_NAKAMA_USE_SSL=false

# Start Expo
npm start
```

#### 4.2 Test User Journey on Mobile

1. **Register/Login**
   - Create new account
   - Verify login works

2. **Discover Quests**
   - Open map view
   - Verify quests appear
   - Open quest list
   - Verify quests listed

3. **View Quest Detail**
   - Tap on quest
   - Verify step carousel shows
   - Verify all 10 steps visible

4. **Start Quest**
   - Tap "Start Quest"
   - Verify quest status changes

5. **Complete Steps**
   - Navigate to step location (or simulate)
   - Tap "Complete Step"
   - Submit photo (if required)
   - Verify step completes
   - Verify next step becomes active

6. **Complete Quest**
   - Complete all 10 steps
   - Verify quest completion screen
   - Verify rating modal appears

7. **Submit Rating**
   - Rate quest (stars + feedback)
   - Verify submission succeeds

8. **Check Progression**
   - Go to profile/leaderboard
   - Verify XP increased
   - Verify rank updated (if applicable)

9. **Test Party Features**
   - Create party
   - Share party code
   - Join party (second device/user)
   - Verify party members shown

10. **Test Inventory**
    - Go to inventory screen
    - Verify items displayed
    - Test item usage (if applicable)

**Success Criteria**:
- ✅ All screens load correctly
- ✅ No crashes or errors
- ✅ All features work as expected
- ✅ UI is responsive

---

### Phase 5: Performance & Load Testing (Optional, 30 minutes)

#### 5.1 Test Response Times

```bash
# Create simple performance test
cd /home/cb/wayfarer/test-integration

# Test RPC response times
node -e "
const { Client } = require('@heroiclabs/nakama-js');
const client = new Client('defaultkey', '5.181.218.160', 7350, false);

async function test() {
  const session = await client.authenticateDevice('test-device-' + Date.now());
  const start = Date.now();
  await client.rpc(session, 'get_available_quests', {});
  const duration = Date.now() - start;
  console.log('Response time:', duration, 'ms');
}
test();
"
```

**Target Response Times**:
- Quest discovery: < 500ms
- Step completion: < 300ms
- Photo upload: < 2s
- Leaderboard: < 1s

#### 5.2 Test Concurrent Users

```bash
# Run multiple test users simultaneously
for i in {1..10}; do
  node test-runner.js &
done
wait
```

**Success Criteria**:
- ✅ No errors under load
- ✅ Response times acceptable
- ✅ Database remains consistent

---

## 📋 Test Checklist

Use this checklist to track your testing progress:

### Backend RPC Functions
- [ ] User authentication (`authenticateDevice`, `authenticateEmail`)
- [ ] Location updates (`update_user_location`)
- [ ] Quest discovery (`get_available_quests`)
- [ ] Quest generation (`generate_scavenger_hunt`, `generate_mystery_prompt`)
- [ ] Quest detail (`get_quest_detail`)
- [ ] Start quest (`start_quest`)
- [ ] Complete step (`complete_step`)
- [ ] Submit media (`submit_step_media`)
- [ ] Complete quest (`complete_quest`)
- [ ] Party creation (`create_party`)
- [ ] Party joining (`join_party`)
- [ ] Party members (`get_party_members`)
- [ ] User level (`get_user_level`)
- [ ] Leaderboard (`get_leaderboard`)
- [ ] Achievements (`get_user_achievements`)
- [ ] Inventory (`get_user_inventory`)
- [ ] Rating (`submit_rating`)
- [ ] Events (`get_active_event`, `join_event`)

### User Journeys
- [ ] Complete scavenger hunt quest (10 steps)
- [ ] Complete mystery quest (10 steps)
- [ ] Complete single task quest (1 step)
- [ ] Group quest with party coordination
- [ ] Photo upload and storage
- [ ] Progression system (XP, ranks, achievements)
- [ ] Rating and feedback submission
- [ ] Event participation

### Mobile App
- [ ] Login/Register flow
- [ ] Quest discovery (map and list)
- [ ] Quest detail screen
- [ ] Step completion flow
- [ ] Photo capture and upload
- [ ] Party creation and joining
- [ ] Leaderboard display
- [ ] Inventory screen
- [ ] Rating modal

### External APIs
- [ ] Google Maps Places API
- [ ] OpenRouter AI generation
- [ ] Open Trivia DB

### Infrastructure
- [ ] MinIO photo storage
- [ ] Database migrations
- [ ] RPC function registration
- [ ] Environment variables

---

## 🐛 Troubleshooting

### Tests Fail to Connect

```bash
# Check if Nakama is running
curl http://5.181.218.160:7350/

# Check firewall
telnet 5.181.218.160 7350

# Check Nakama logs
ssh root@5.181.218.160
docker logs wayfarer-nakama-nakama-1 | tail -50
```

### RPC Function Not Found

```bash
# Verify RPC is registered
ssh root@5.181.218.160
docker logs wayfarer-nakama-nakama-1 | grep "Registered JavaScript runtime RPC" | grep "function_name"

# Check runtime module loaded
docker logs wayfarer-nakama-nakama-1 | grep "JavaScript runtime modules loaded"
```

### Database Errors

```bash
# Check database connection
ssh root@5.181.218.160
docker exec wayfarer-nakama-cockroachdb-1 \
  cockroach sql --insecure -e "SELECT 1"

# Check migrations
docker exec wayfarer-nakama-nakama-1 \
  /nakama/nakama migrate status \
  --database.address root@cockroachdb:26257
```

### Photo Upload Fails

```bash
# Check MinIO is deployed
# See: docs/NEXT_STEPS.md

# Check environment variables
ssh root@5.181.218.160
docker exec wayfarer-nakama-nakama-1 env | grep MINIO

# Check MinIO logs
# (if deployed on Railway, check Railway logs)
```

---

## 📊 Test Results Documentation

After running tests, document results:

```markdown
# Test Results - [Date]

## Test Environment
- Server: 5.181.218.160:7350
- Database: CockroachDB
- Test Date: [Date]

## Automated Tests
- Total Tests: [X]
- Passed: [X]
- Failed: [X]
- Skipped: [X]

## Manual Tests
- [ ] Scavenger Hunt Quest Flow
- [ ] Group Quest Flow
- [ ] Photo Upload
- [ ] Progression System

## Issues Found
1. [Issue description]
   - Severity: [High/Medium/Low]
   - Status: [Open/Fixed]

## Next Steps
1. [Action item]
```

---

## 🎯 Success Criteria

Your end-to-end testing is complete when:

1. ✅ **All automated tests pass** (100% pass rate)
2. ✅ **All critical user journeys work** (quest completion, progression, groups)
3. ✅ **Photo upload works** (MinIO deployed and tested)
4. ✅ **Mobile app works** (all screens functional)
5. ✅ **No critical bugs** (blocking issues resolved)
6. ✅ **Performance acceptable** (response times < 1s for most operations)

---

## 📚 Next Steps

After completing end-to-end testing:

1. **Fix Critical Issues**: Address any blocking bugs found
2. **Document Known Issues**: Create issue tracker
3. **Performance Optimization**: Address slow queries/operations
4. **Beta Testing**: Deploy to beta users for real-world testing
5. **Monitoring Setup**: Add logging and monitoring for production

---

**Ready to start? Begin with Phase 1: Prerequisites Check!**

