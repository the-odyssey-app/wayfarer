# Quick Testing Checklist

**Quick Reference**: Step-by-step checklist for end-to-end testing

---

## 🚀 Quick Start (5 minutes)

### Step 1: Run Automated Tests

```bash
cd /home/cb/wayfarer
./run-integration-tests.sh
```

**Check**: All tests should pass (green ✅)

---

## 📋 Complete Testing Checklist

### Phase 1: Automated Tests (15-30 min)

- [ ] **Prerequisites Check**
  ```bash
  curl http://5.181.218.160:7350/  # Should return {"status":"ok"}
  ```

- [ ] **Run Full Test Suite**
  ```bash
  ./run-integration-tests.sh
  ```

- [ ] **Review Results**
  - [ ] All tests pass (no red ❌)
  - [ ] No connection errors
  - [ ] External API tests pass (if keys configured)

- [ ] **Document Failures** (if any)
  ```bash
  ./run-integration-tests.sh 2>&1 | tee test-results.log
  ```

---

### Phase 2: Manual Backend Testing (30-60 min)

#### Test 1: Complete Scavenger Hunt Quest

- [ ] Create test user (via mobile app or RPC)
- [ ] Set user location (near quest)
- [ ] Discover quests (`get_available_quests`)
- [ ] Generate scavenger hunt (`generate_scavenger_hunt`)
- [ ] Get quest detail (`get_quest_detail`) - verify 10 steps
- [ ] Start quest (`start_quest`)
- [ ] Complete step 1 (`complete_step`) - verify progress
- [ ] Complete step 2 (`complete_step`) - verify progress
- [ ] Complete steps 3-10 (`complete_step`) - verify progress
- [ ] Verify quest completed (`get_user_quests` - status = 'completed')
- [ ] Verify XP awarded (`get_user_level` - XP increased)
- [ ] Submit rating (`submit_rating`)

**Success**: Quest completes, XP awarded, rating submitted

---

#### Test 2: Group Quest with Party

- [ ] Create two test users (User A, User B)
- [ ] User A: Create party (`create_party`)
- [ ] User B: Join party (`join_party` - use party code)
- [ ] Both: Verify party members (`get_party_members`)
- [ ] Both: Start same quest (`start_quest`)
- [ ] User A: Complete step 1 (`complete_step`)
- [ ] User B: Verify progress (`get_quest_detail`)
- [ ] User B: Complete step 2 (`complete_step`)
- [ ] Both: Complete remaining steps
- [ ] Both: Verify rewards (`get_user_level` - both have XP)

**Success**: Party works, progress shared, both get rewards

---

#### Test 3: Photo Upload

**Prerequisites**: MinIO deployed (see `docs/NEXT_STEPS.md`)

- [ ] Start quest (as in Test 1)
- [ ] Complete step with photo (`submit_step_media` - type: 'photo')
- [ ] Verify upload success (response has `media_url`)
- [ ] Check MinIO bucket (photo should be in `wayfarer-photos`)
- [ ] Verify photo URL accessible (open URL in browser)

**Success**: Photo uploads, URL stored, photo accessible

---

#### Test 4: Progression System

- [ ] Get initial user level (`get_user_level` - note XP, rank)
- [ ] Complete quest (as in Test 1)
- [ ] Verify XP increased (`get_user_level` - XP higher)
- [ ] Verify rank calculated correctly (based on XP thresholds)
- [ ] Check achievements (`get_user_achievements`)
- [ ] Check badges (`check_badge_unlock`)
- [ ] Check leaderboard (`get_leaderboard` - user appears)

**Success**: XP increases, rank updates, achievements unlock

---

### Phase 3: Mobile App Testing (30-60 min)

- [ ] **Setup Mobile App**
  ```bash
  cd apps/mobile
  export EXPO_PUBLIC_NAKAMA_HOST=5.181.218.160
  npm start
  ```

- [ ] **Register/Login**
  - [ ] Create new account
  - [ ] Login works

- [ ] **Quest Discovery**
  - [ ] Map view shows quests
  - [ ] Quest list shows quests
  - [ ] Quest detail screen loads

- [ ] **Quest Completion**
  - [ ] Start quest works
  - [ ] Step carousel shows all steps
  - [ ] Complete step works
  - [ ] Photo capture works (if required)
  - [ ] Quest completion screen appears
  - [ ] Rating modal appears

- [ ] **Rating**
  - [ ] Submit rating works
  - [ ] Feedback saved

- [ ] **Progression**
  - [ ] Profile shows XP
  - [ ] Leaderboard shows user
  - [ ] Rank displayed correctly

- [ ] **Party Features**
  - [ ] Create party works
  - [ ] Join party works (second device)
  - [ ] Party members shown

- [ ] **Inventory**
  - [ ] Inventory screen loads
  - [ ] Items displayed
  - [ ] Item usage works (if applicable)

**Success**: All screens work, no crashes

---

### Phase 4: Critical RPC Functions (15 min)

Test each critical RPC function individually:

- [ ] `update_user_location` - Location updates
- [ ] `get_available_quests` - Quest discovery
- [ ] `generate_scavenger_hunt` - Quest generation
- [ ] `get_quest_detail` - Quest details
- [ ] `start_quest` - Start quest
- [ ] `complete_step` - Step completion
- [ ] `submit_step_media` - Media submission
- [ ] `complete_quest` - Quest completion
- [ ] `create_party` - Party creation
- [ ] `join_party` - Party joining
- [ ] `get_party_members` - Party members
- [ ] `get_user_level` - User progression
- [ ] `get_leaderboard` - Leaderboard
- [ ] `submit_rating` - Rating submission

**Success**: All RPCs return expected results

---

## 🐛 Common Issues & Fixes

### Issue: Tests fail to connect

**Fix**:
```bash
# Check server is running
curl http://5.181.218.160:7350/

# Check firewall
telnet 5.181.218.160 7350
```

### Issue: RPC function not found

**Fix**:
```bash
# Check RPC registered
ssh root@5.181.218.160
docker logs wayfarer-nakama-nakama-1 | grep "Registered JavaScript runtime RPC" | wc -l
# Should show: 77
```

### Issue: Photo upload fails

**Fix**:
- Deploy MinIO (see `docs/NEXT_STEPS.md`)
- Check environment variables set
- Verify MinIO bucket exists

### Issue: Database errors

**Fix**:
```bash
# Check migrations
ssh root@5.181.218.160
docker exec wayfarer-nakama-nakama-1 \
  /nakama/nakama migrate status \
  --database.address root@cockroachdb:26257
```

---

## ✅ Completion Criteria

Testing is complete when:

- [x] All automated tests pass
- [x] Scavenger hunt quest completes end-to-end
- [x] Group quest with party works
- [x] Photo upload works (if MinIO deployed)
- [x] Progression system works (XP, ranks, achievements)
- [x] Mobile app works (all screens functional)
- [x] No critical bugs blocking production

---

## 📊 Test Results Template

```markdown
# Test Results - [Date]

## Environment
- Server: 5.181.218.160:7350
- Date: [Date]

## Automated Tests
- Passed: [X]
- Failed: [X]
- Skipped: [X]

## Manual Tests
- [ ] Scavenger Hunt Quest
- [ ] Group Quest
- [ ] Photo Upload
- [ ] Progression System
- [ ] Mobile App

## Issues
1. [Issue]
   - Severity: [High/Medium/Low]
   - Status: [Open/Fixed]

## Next Steps
1. [Action]
```

---

**Start with automated tests, then move to manual testing!**

