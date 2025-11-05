# External API Integration Analysis

## Summary

**The integration tests do NOT test external API integrations.** They only test Nakama RPC functions which may internally call external APIs, but the tests don't verify that the external API calls are working correctly.

---

## External APIs Used in Codebase

### Old Convex Backend (`/old` folder)

#### 1. **Google Maps Places API**
- **Library**: `@googlemaps/google-maps-services-js`
- **Files**: `old/locations.ts`
- **Usage**:
  - `client.textSearch()` - Search for places near user location
  - `client.placeDetails()` - Get detailed place information
- **API Key**: `GOOGLE_MAPS_API_KEY` environment variable
- **Endpoint**: Google Maps API (via SDK)
- **Purpose**: 
  - Find nearby places/POIs for users
  - Get place details (address, photos, phone numbers, etc.)
  - Populate places database

#### 2. **NVIDIA AI API**
- **Library**: `openai` (configured with NVIDIA base URL)
- **Files**: 
  - `old/mysteryPrompt.ts` - Creates murder mystery quests
  - `old/singleTaskPrompt.ts` - Creates single task prompts
  - `old/taskPrompt.ts` - Creates multi-stop scavenger hunts
- **Usage**:
  - `configuration.chat.completions.create()` - Generate AI content
- **API Key**: `NVIDIA_APIKEY` environment variable
- **Endpoint**: `https://integrate.api.nvidia.com/v1`
- **Model**: `nvidia/llama-3.1-nemotron-51b-instruct`
- **Purpose**:
  - Generate quest content (murder mysteries, scavenger hunts)
  - Create task prompts based on user interests and locations
  - AI-powered content generation

---

### New Nakama Backend (`/wayfarer-nakama`)

#### 1. **OpenRouter API**
- **Library**: Native HTTP requests via `nk.httpRequest()`
- **File**: `wayfarer-nakama/nakama-data/modules/index.js`
- **Function**: `rpcGenerateScavengerHunt()`
- **Usage**:
  ```javascript
  nk.httpRequest({
    method: 'POST',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4.5',
      messages: [{ role: 'user', content: prompt }]
    })
  })
  ```
- **API Key**: `OPENROUTER_API_KEY` environment variable
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Model**: `anthropic/claude-haiku-4.5`
- **Purpose**:
  - Generate scavenger hunt quests
  - AI-powered quest content creation
  - Replaces NVIDIA API from old backend

#### 2. **Open Trivia DB API** (Not Currently Used)
- **Library**: Native HTTP requests (commented out)
- **File**: `wayfarer-nakama/nakama-data/modules/index.js`
- **Function**: `getTriviaQuestionsFromAPI()` (line ~2440)
- **Usage**:
  ```javascript
  const url = `https://opentdb.com/api.php?amount=${count}&category=${category}&difficulty=${difficulty}&type=multiple`;
  // Currently returns empty array - not implemented
  ```
- **API Key**: None (public API)
- **Endpoint**: `https://opentdb.com/api.php`
- **Purpose**:
  - Get quiz questions for mini-games
  - **Status**: Code exists but function returns empty array (not implemented)

#### 3. **Google Maps Places API** (NOT Used in New Backend)
- **Status**: The new backend's `rpcGetPlacesNearby()` function does **NOT** call Google Maps API
- **Implementation**: Only queries the local database (`places` table) using Haversine formula
- **File**: `wayfarer-nakama/nakama-data/modules/index.js` (line ~4026)
- **Note**: New backend relies on pre-populated places database instead of real-time API calls

---

## Integration Test Coverage

### What the Tests Do
The integration tests (`test-integration/test-runner.js`) test **74 RPC functions** across multiple categories:
- User & Location Functions
- Quest System (12+ functions)
- Party/Group System (10+ functions)
- Items & Inventory (8+ functions)
- Audio Experiences (6+ functions)
- Mini Games (8+ functions)
- Events System (5+ functions)
- Social & Matching (4+ functions)
- Achievements & Badges (3+ functions)
- Verification & Safety (4+ functions)
- Admin & Analytics (4+ functions)
- Places & Location
- Leaderboards

### What the Tests Now Do (After Updates)
- ✅ **Test external API connectivity** (OpenRouter, MinIO)
- ✅ **Verify API keys are configured** before running tests
- ✅ **Test API error handling** and connectivity
- ✅ **Add side-effect assertions** for votes/trades/events/mini-games
- ✅ **Validate database schema** before running tests
- ✅ **Seed deterministic fixtures** before tests
- ✅ **Promote skips to real assertions** when APIs are configured

### External API Functions NOT Tested

#### Functions That Use External APIs:
1. **`generate_scavenger_hunt`** - Uses OpenRouter API
   - **Status**: ✅ Now tested with real assertions when OPENROUTER_API_KEY is configured
   - **Tests**: Connectivity test, error handling, and side-effect verification (quest creation)

#### Functions That Should Use External APIs (But Don't):
2. **`get_places_nearby`** - Uses database only (no external API)
   - **Status**: Tested, but doesn't verify external API integration
   - **Note**: Old backend used Google Maps API, new backend doesn't

---

## Migration Summary: Old vs New APIs

| Feature | Old Backend | New Backend | Status |
|---------|-------------|-------------|--------|
| **Place Discovery** | Google Maps Places API | Database query only | ❌ External API removed |
| **Quest Generation** | NVIDIA AI API | OpenRouter API | ✅ Migrated (different API) |
| **Quiz Questions** | N/A | Open Trivia DB (not implemented) | ⚠️ Not implemented |

---

## Recommendations

### 1. Add External API Tests
Create integration tests that verify:
- OpenRouter API connectivity and key validity
- API response parsing and error handling
- Fallback behavior when APIs are unavailable

### 2. Test `generate_scavenger_hunt` Function
Currently, `generate_scavenger_hunt` is not tested. Add tests that:
- Verify OpenRouter API key is configured
- Test successful quest generation
- Test error handling when API fails

### 3. Consider Re-adding Google Maps API
The new backend removed Google Maps Places API integration. Consider:
- Adding it back for real-time place discovery
- Or documenting that places must be pre-populated

### 4. Implement Open Trivia DB Integration
The code structure exists but is not implemented. Either:
- Complete the implementation
- Or remove the unused code

### 5. Add API Health Checks
Create a health check endpoint that verifies:
- OpenRouter API connectivity
- API key validity
- Response time

---

## Environment Variables Required

### Old Backend
- `GOOGLE_MAPS_API_KEY` - Google Maps Places API
- `NVIDIA_APIKEY` - NVIDIA AI API

### New Backend
- `OPENROUTER_API_KEY` - OpenRouter AI API (for quest generation)

---

## API Usage Details

### OpenRouter API (Current)
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Method**: POST
- **Model**: `anthropic/claude-haiku-4.5`
- **Authentication**: Bearer token
- **Rate Limits**: Unknown (check OpenRouter docs)
- **Cost**: Pay-per-use (check OpenRouter pricing)

### Google Maps Places API (Old - Not in New Backend)
- **Endpoint**: Via `@googlemaps/google-maps-services-js` SDK
- **Methods Used**:
  - `textSearch()` - Search for places
  - `placeDetails()` - Get place details
- **Rate Limits**: Varies by API key tier
- **Cost**: Pay-per-request (check Google Maps pricing)

### NVIDIA AI API (Old - Not in New Backend)
- **Endpoint**: `https://integrate.api.nvidia.com/v1`
- **Model**: `nvidia/llama-3.1-nemotron-51b-instruct`
- **Authentication**: API key in header
- **Rate Limits**: Unknown (check NVIDIA docs)

---

## Conclusion

The integration tests now provide comprehensive coverage including **external API integration testing**. This means:
- ✅ RPC functions are tested for correct database operations
- ✅ External API calls are tested (OpenRouter, MinIO)
- ✅ API key configuration is verified before tests
- ✅ API error handling and connectivity are tested
- ✅ Side-effect assertions verify DB changes after operations
- ✅ Schema validation ensures required tables/indexes exist
- ✅ Deterministic fixtures are seeded before tests

**Status**: The test suite now includes external API integration tests, schema validation, fixture seeding, and side-effect assertions for critical operations.

