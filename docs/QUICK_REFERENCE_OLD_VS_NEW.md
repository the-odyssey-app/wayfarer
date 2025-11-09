# 🔄 OLD vs NEW IMPLEMENTATION - QUICK REFERENCE

## 📊 SIDE-BY-SIDE COMPARISON

### Architecture
```
OLD (Convex-based)              NEW (Nakama-based)              HYBRID (RECOMMENDED)
├─ Serverless DB                ├─ Game Server                  ├─ Nakama (core)
├─ Real-time APIs               ├─ RPC Functions                ├─ RPC Functions
├─ Type-safe client             ├─ SQL Queries                  ├─ OpenRouter AI
└─ 22 tables                    └─ 2 tables (minimal)           └─ 22 tables (merged)
```

### Quest Generation
```
OLD:                            NEW:                           RECOMMENDED:
Nvidia Llama 3.1 API       →    None (hardcoded)        →     OpenRouter Claude Haiku 4.5
2-3 sec generation              Not applicable                 500-800ms generation
Fixed 10 stops                  Fixed ~9 stops                 Flexible stops
Custom prompts                  No AI                          Prompt engineering
$0.0001/quest                   $0/quest                       $0.00008/quest
```

### Database Capabilities
```
OLD (22 tables):               NEW (2 tables):               NEEDED (20 more):
- User profiles                - quests                      - user_profiles
- Achievements ✓              - user_quests                 - achievements
- Badges ✓                    (minimal)                     - badges
- Rewards ✓                                                 - rewards
- Items ✓                                                   - items
- Friends ✓                                                 - friends
- Notifications ✓                                           - notifications
- Audio tours ✓                                             - placeAudio
- Places ✓                                                  - places
- And 13 more...                                            - And 11 more...
```

---

## 🚀 THREE MIGRATION PATHS

### PATH 1: Minimal (1 week) 🟢 FASTEST
```
Keep:  Current 2 tables + Nakama
Add:   OpenRouter quest generation only
Result: Working quest generation system
Cost:   ~$60/month (AI only)
Skills: Basic AI integration
```

### PATH 2: Recommended (3 weeks) 🟡 BALANCED  
```
Keep:  Nakama as primary
Merge: Add 20 more tables from old schema
Add:   OpenRouter quest generation
Add:   Achievements, rewards, badges
Result: MVP with progression systems
Cost:   ~$70-80/month
Skills: Database schema migration + AI integration
```

### PATH 3: Complete (6 weeks) 🔴 COMPREHENSIVE
```
Migrate: Full old system to Nakama
Replace: Nvidia → OpenRouter
Result:  Full Game.md Phase 1-2 features
Cost:    ~$80-100/month
Skills:  Full system migration
Time:    ~80-120 development hours
```

---

## 📝 OLD IMPLEMENTATION FILES TO REUSE

| File | Purpose | Reusability | Effort |
|------|---------|-------------|--------|
| `schema.ts` | Database schema | 90% | 2 hours (convert to SQL) |
| `quests.ts` | Quest CRUD | 70% | 3 hours (adapt to RPC) |
| `taskPrompt.ts` | Scavenger hunt generation | 95% | 1 hour (switch API) |
| `mysteryPrompt.ts` | Murder mystery generation | 95% | 1 hour (switch API) |
| `achievements.ts` | Achievement system | 80% | 4 hours (Nakama integration) |
| `badges.ts` | Badge system | 80% | 3 hours (Nakama integration) |
| `rewards.ts` | Reward distribution | 70% | 3 hours (Nakama integration) |
| `friends.ts` | Friend relationships | 85% | 2 hours (Nakama integration) |
| `places.ts` | POI management | 75% | 2 hours (Nakama integration) |
| `items.ts` | Item collection | 80% | 3 hours (Nakama integration) |

**Total Reusable Code: ~60-70% of old implementation**

---

## 💰 COST COMPARISON

```
MONTHLY COSTS

                    OLD             NEW (Min)       NEW (Rec)       NEW (Full)
Database            $25-50          $0              $10-20          $10-20
Functions           Included        $0              $0              $0
Storage             Included        $10             $20             $30
AI (Nvidia)         $60             $0              $60             $60
AI (OpenRouter)     -               $0              $60             $60
─────────────────────────────────────────────────────────────────────────
TOTAL               $85-110         $10             $70-80          $80-100
SAVINGS vs OLD      -               88% ↓           20% ↓           10% ↓
```

---

## 🎯 IMPLEMENTATION ROADMAP

### Week 1: AI Integration + Core Features (Minimal Path)
```
Day 1:    OpenRouter setup, test Claude connection
Day 2:    Implement generate_scavenger_hunt RPC
Day 3:    Implement generate_mystery_quest RPC
Day 4:    Wire to current quest system
Day 5:    E2E testing, fix bugs
```

### Week 2-3: Schema + Features (Recommended Path)
```
Day 1:    Design schema migration (20 tables)
Day 2:    Create SQL migration scripts
Day 3:    Achievement system implementation
Day 4:    Rewards + Badges implementation
Day 5:    Friends + Notifications
Day 6:    Testing & optimization
Day 7:    Deployment
```

---

## 📋 HOW TO USE OLD CODE

### 1. Quest Generation (Schema patterns)
```typescript
// OLD: Using Convex action syntax
export const createTaskPrompt = action({...})

// NEW: Using Nakama RPC syntax
function rpcGenerateScavengerHunt(ctx, logger, nk, payload) {...}

// MIGRATION: Copy prompt logic, adapt API calls
```

### 2. Database Schema
```sql
-- OLD: Convex schema definition
defineTable({ name: v.string(), ... })

-- NEW: SQL CREATE TABLE
CREATE TABLE quests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ...
);

-- MIGRATION: Direct conversion + add indices
```

### 3. Feature Logic
```typescript
// OLD: Convex mutation pattern
export const insertAchievement = mutation({...})

// NEW: Nakama RPC pattern
function rpcInsertAchievement(ctx, logger, nk, payload) {...}

// MIGRATION: Port logic, adapt database calls
```

---

## ⚡ QUICK START (30 MIN)

### Step 1: Setup OpenRouter (10 min)
```bash
1. Go to openrouter.ai
2. Sign up & get API key
3. Set OPENROUTER_API_KEY env var
```

### Step 2: Test Connection (5 min)
```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"anthropic/claude-haiku-4.5","messages":[{"role":"user","content":"Hello"}]}'
```

### Step 3: First RPC Function (15 min)
```javascript
// Copy from old taskPrompt.ts
// Replace: baseURL from Nvidia → OpenRouter
// Replace: model from Nvidia/Llama → anthropic/claude-haiku-4.5
// Test via Nakama console
```

---

## 🎓 DECISION MATRIX

Choose path based on your priorities:

```
                    PATH 1 (MIN)   PATH 2 (REC)   PATH 3 (FULL)
Time to MVP         1 week         3 weeks        6 weeks
Cost                Lowest ↓       Balanced       Highest ↑
Features            Basic          Advanced       Complete
Complexity          Simple         Moderate       Complex
Reusable Code       30%            70%            90%
Game.md Coverage    ~20%           ~50%           ~100%
```

**RECOMMENDATION**: Start with PATH 1 (1 week), then evaluate if PATH 2 (3 weeks total) is worth the investment based on user feedback.

---

## 📞 NEXT STEPS

1. **Clarify Path**: Which implementation path for next 2 weeks?
2. **Setup OpenRouter**: Get API key, test connection
3. **Prioritize Features**: Which old systems to migrate first?
4. **Allocate Time**: How many hours/week available?
5. **Start Implementation**: Begin with quest generation RPC

---

## 📚 DETAILED DOCUMENTATION

For more information, see:
- `OLD_IMPLEMENTATION_ANALYSIS_AND_INTEGRATION.md` (comprehensive guide)
- `old/schema.ts` (22-table database design)
- `old/taskPrompt.ts` & `old/mysteryPrompt.ts` (quest generation logic)
- `GAME_MD_VS_REALITY_AUDIT.md` (what Game.md expects)
