# External APIs Implementation Plan

## Overview

This plan outlines the implementation of three external API integrations and comprehensive testing:
1. **Google Maps Places API** - Re-add to enable real-time place discovery
2. **OpenRouter API** - Migrate NVIDIA AI endpoints (mystery prompts, single task prompts)
3. **Open Trivia DB API** - Complete implementation for quiz questions
4. **Integration Tests** - Test all external API integrations

---

## Phase 1: Google Maps Places API Integration

### Current State
- Old implementation: `old/locations.ts` uses Google Maps Places API
- New implementation: `rpcGetPlacesNearby()` only queries database (no external API)
- Missing: Real-time place discovery and database population

### Implementation Tasks

#### Task 1.1: Add Google Maps API Dependency
**File**: `wayfarer-nakama/nakama-data/modules/package.json`
- Add Google Maps SDK (or use HTTP requests directly)
- Option A: Use `@googlemaps/google-maps-services-js` (requires npm modules in Nakama)
- Option B: Use native `nk.httpRequest()` for REST API calls (recommended for Nakama)

**Decision**: Use native HTTP requests via `nk.httpRequest()` for compatibility with Nakama runtime.

#### Task 1.2: Create Helper Function for Google Maps API
**File**: `wayfarer-nakama/nakama-data/modules/index.js`
- Add `GOOGLE_MAPS_API_KEY` environment variable handling
- Create helper function `callGoogleMapsPlacesAPI()` that:
  - Calls Google Places Text Search API
  - Calls Google Places Details API
  - Handles errors and rate limiting
  - Returns formatted place data

**Function Signature**:
```javascript
function callGoogleMapsPlacesAPI(logger, nk, latitude, longitude, radius = 8500) {
  // 1. Call textSearch API
  // 2. For each result, call placeDetails API
  // 3. Format and return places
}
```

#### Task 1.3: Enhance `rpcGetPlacesNearby` Function
**File**: `wayfarer-nakama/nakama-data/modules/index.js` (line ~4026)

**New Behavior**:
1. First, query local database for nearby places (existing behavior)
2. If no results or insufficient results, call Google Maps Places API
3. Insert new places into database
4. Return combined results

**Implementation**:
```javascript
function rpcGetPlacesNearby(ctx, logger, nk, payload) {
  // 1. Parse payload (existing)
  // 2. Query database (existing)
  // 3. If results < threshold or empty:
  //    - Call Google Maps API
  //    - Insert places into database
  //    - Query database again
  // 4. Return results
}
```

#### Task 1.4: Create Place Formatting Function
**File**: `wayfarer-nakama/nakama-data/modules/index.js`

**Function**: Convert Google Maps API response to database format
- Map Google Places fields to `places` table schema
- Handle missing/optional fields
- Generate place ID if needed

**Database Schema Mapping**:
- `google_place_id` ← `place_id`
- `name` ← `name`
- `address` ← `formatted_address`
- `latitude` ← `geometry.location.lat`
- `longitude` ← `geometry.location.lng`
- `photos` ← `photos[]` (array of photo references)
- `types` ← `types[]` (array of place types)
- `website` ← `website`
- `phone` ← `formatted_phone_number`
- `generative_summary` ← `generative_summary.summary`
- `rating` ← `rating`
- `review_count` ← `user_ratings_total`

#### Task 1.5: Add Place Insertion Logic
**File**: `wayfarer-nakama/nakama-data/modules/index.js`

**Function**: Insert or update places in database
- Use `ON CONFLICT` to handle duplicates (by `google_place_id`)
- Set `is_active = true` for new places
- Update `updated_at` timestamp

#### Task 1.6: Environment Variable Configuration
**Files**: 
- `wayfarer-nakama/local.yml` - Add `GOOGLE_MAPS_API_KEY` to runtime.env
- `env.template` - Document the new environment variable
- `wayfarer-nakama/docker-compose.yml` - Add to environment section

---

## Phase 2: OpenRouter API - Migrate NVIDIA AI Endpoints

### Current State
- Old implementation: Uses NVIDIA AI API for:
  - `mysteryPrompt.ts` - Murder mystery quests
  - `singleTaskPrompt.ts` - Single task prompts
  - `taskPrompt.ts` - Multi-stop scavenger hunts
- New implementation: Only `rpcGenerateScavengerHunt()` uses OpenRouter
- Missing: Mystery prompt and single task prompt functions

### Implementation Tasks

#### Task 2.1: Create `rpcGenerateMysteryPrompt` Function
**File**: `wayfarer-nakama/nakama-data/modules/index.js`

**Based on**: `old/mysteryPrompt.ts`

**Function Signature**:
```javascript
function rpcGenerateMysteryPrompt(ctx, logger, nk, payload) {
  // Input: { locations: [{place_id, location: {lat, lng}}], tags: string[] }
  // Output: { success: true, quest: { title, theme, case_overview, stops[] } }
}
```

**Implementation Steps**:
1. Parse payload (locations, tags)
2. Get OpenRouter API key (reuse existing logic)
3. Build prompt (similar to old implementation)
4. Call OpenRouter API with Claude Haiku model
5. Parse JSON response
6. Validate structure
7. Return formatted quest

**Prompt Template** (from old implementation):
- Include murder mystery elements (murderer, victim, motive, method)
- 10-stop mystery
- Witness dialogue at each location
- Location-based clues

#### Task 2.2: Create `rpcGenerateSingleTaskPrompt` Function
**File**: `wayfarer-nakama/nakama-data/modules/index.js`

**Based on**: `old/singleTaskPrompt.ts`

**Function Signature**:
```javascript
function rpcGenerateSingleTaskPrompt(ctx, logger, nk, payload) {
  // Input: { tags: string[] }
  // Output: { success: true, content: string }
}
```

**Implementation Steps**:
1. Parse payload (tags)
2. Get OpenRouter API key
3. Build prompt (single task, not location-based)
4. Call OpenRouter API
5. Extract content from response
6. Return formatted result

**Prompt Template** (from old implementation):
- Solo scavenger hunt activity
- Based on user interests (tags)
- Single activity that can be submitted as image or text
- No location attachment

#### Task 2.3: Enhance `rpcGenerateScavengerHunt` Function
**File**: `wayfarer-nakama/nakama-data/modules/index.js` (line ~649)

**Current Status**: Already uses OpenRouter, but may need enhancement

**Potential Enhancements**:
- Better error handling
- Retry logic for API failures
- Response validation improvements
- Support for different quest types

#### Task 2.4: Register New RPC Functions
**File**: `wayfarer-nakama/nakama-data/modules/index.js` (InitModule function)

**Add to registration**:
```javascript
initializer.registerRpc('generate_mystery_prompt', rpcGenerateMysteryPrompt);
initializer.registerRpc('generate_single_task_prompt', rpcGenerateSingleTaskPrompt);
```

#### Task 2.5: Create Shared OpenRouter Helper Function
**File**: `wayfarer-nakama/nakama-data/modules/index.js`

**Function**: Centralize OpenRouter API calls
```javascript
function callOpenRouterAPI(logger, nk, prompt, model = 'anthropic/claude-haiku-4.5', temperature = 0.7, maxTokens = 8000) {
  // 1. Get API key
  // 2. Build HTTP request
  // 3. Call API
  // 4. Handle errors
  // 5. Return response
}
```

**Benefits**:
- Reusable across all AI functions
- Consistent error handling
- Easier to update API configuration

---

## Phase 3: Open Trivia DB API Implementation

### Current State
- Code exists but returns empty array
- Function: `getTriviaQuestionsFromAPI()` (line ~2440)
- Used by: `rpcGetQuizQuestions()` (line ~2468)

### Implementation Tasks

#### Task 3.1: Complete `getTriviaQuestionsFromAPI` Function
**File**: `wayfarer-nakama/nakama-data/modules/index.js` (line ~2440)

**Current Code**: Returns empty array
**New Implementation**: Make actual API call

**Function**:
```javascript
function getTriviaQuestionsFromAPI(logger, nk, category, difficulty, count) {
  // 1. Map category to Open Trivia DB category ID
  // 2. Map difficulty level
  // 3. Build URL with query parameters
  // 4. Call Open Trivia DB API using nk.httpRequest
  // 5. Parse response
  // 6. Format questions for database
  // 7. Return questions array
}
```

**API Endpoint**: `https://opentdb.com/api.php`
**Parameters**:
- `amount` - Number of questions
- `category` - Category ID (0-32)
- `difficulty` - easy, medium, hard
- `type` - multiple (default)

**Response Format**:
```json
{
  "response_code": 0,
  "results": [
    {
      "category": "History",
      "type": "multiple",
      "difficulty": "medium",
      "question": "Question text?",
      "correct_answer": "Correct answer",
      "incorrect_answers": ["Wrong 1", "Wrong 2", "Wrong 3"]
    }
  ]
}
```

#### Task 3.2: Integrate with `rpcGetQuizQuestions`
**File**: `wayfarer-nakama/nakama-data/modules/index.js` (line ~2468)

**New Behavior**:
1. Get custom questions from database (existing)
2. If insufficient questions, call Open Trivia DB API
3. Optionally save trivia questions to database for reuse
4. Combine custom and trivia questions
5. Shuffle and return

**Implementation**:
```javascript
// In rpcGetQuizQuestions function
const customQuestions = nk.sqlQuery(query, params);
const questions = formatQuestions(customQuestions);

// If we need more questions
if (questions.length < questionCount) {
  const needed = questionCount - questions.length;
  const triviaQuestions = getTriviaQuestionsFromAPI(
    logger, nk, category, difficulty, needed
  );
  questions.push(...triviaQuestions);
}
```

#### Task 3.3: Add Question Caching (Optional Enhancement)
**File**: `wayfarer-nakama/nakama-data/modules/index.js`

**Function**: Save trivia questions to database for reuse
- Prevents duplicate API calls
- Improves performance
- Allows customization

**Table**: `quiz_questions` (already exists)
- Insert trivia questions with `quest_id = NULL`, `place_id = NULL`
- Mark as `source = 'trivia_db'`

#### Task 3.4: Handle API Errors
**Implementation**:
- Network errors → Return empty array, log warning
- Invalid category → Use default category
- Rate limiting → Implement retry logic
- Invalid response → Parse safely, log error

---

## Phase 4: Integration Tests for External APIs

### Current State
- Integration tests exist but don't test external APIs
- Tests only verify RPC function responses
- No API connectivity or error handling tests

### Implementation Tasks

#### Task 4.1: Create External API Test Module
**File**: `test-integration/test-external-apis.js`

**Structure**:
```javascript
const { Client } = require('@heroiclabs/nakama-js');

// Test configuration
const NAKAMA_HOST = process.env.NAKAMA_HOST || 'localhost';
const NAKAMA_PORT = process.env.NAKAMA_PORT || '7350';
const NAKAMA_SERVER_KEY = process.env.NAKAMA_SERVER_KEY || 'defaultkey';

// Test functions
async function testGoogleMapsAPI() { }
async function testOpenRouterMysteryPrompt() { }
async function testOpenRouterSingleTaskPrompt() { }
async function testOpenRouterScavengerHunt() { }
async function testOpenTriviaDB() { }

async function runExternalAPITests() {
  // Run all tests
}
```

#### Task 4.2: Test Google Maps Places API
**Test Cases**:
1. ✅ **Happy Path**: Call `get_places_nearby` with valid coordinates
   - Verify API is called when database is empty
   - Verify places are inserted into database
   - Verify response contains places

2. ✅ **Database Fallback**: When places exist in database
   - Verify API is not called unnecessarily
   - Verify database results are returned

3. ❌ **API Error**: When Google Maps API key is invalid
   - Verify graceful error handling
   - Verify error message is returned
   - Verify no crash occurs

4. ❌ **API Timeout**: When API is slow/unresponsive
   - Verify timeout handling
   - Verify fallback to database

5. ⚠️ **Rate Limiting**: Test with multiple rapid calls
   - Verify rate limit handling
   - Verify proper error messages

**Test Data**:
- Test location: `{ latitude: 33.1262316, longitude: -117.310507 }` (existing test location)

#### Task 4.3: Test OpenRouter API - Mystery Prompt
**Test Cases**:
1. ✅ **Happy Path**: Generate mystery prompt
   - Verify API key is configured
   - Verify valid quest structure is returned
   - Verify all required fields are present

2. ❌ **Missing API Key**: When `OPENROUTER_API_KEY` is not set
   - Verify error message
   - Verify no crash

3. ❌ **Invalid API Key**: When key is wrong
   - Verify error handling
   - Verify error message

4. ❌ **API Error**: When OpenRouter API is down
   - Verify error handling
   - Verify graceful degradation

5. ✅ **Response Validation**: Verify quest structure
   - Title, theme, case_overview, stops array
   - Each stop has coordinates, description, clues, witness

#### Task 4.4: Test OpenRouter API - Single Task Prompt
**Test Cases**:
1. ✅ **Happy Path**: Generate single task prompt
   - Verify content is returned
   - Verify content is a string
   - Verify content is not empty

2. ❌ **Error Cases**: Same as mystery prompt tests
   - Missing API key
   - Invalid API key
   - API errors

#### Task 4.5: Test OpenRouter API - Scavenger Hunt
**Test Cases**:
1. ✅ **Happy Path**: Generate scavenger hunt
   - Verify quest structure
   - Verify stops match locations
   - Verify activities are generated

2. ❌ **Error Cases**: Same as other OpenRouter tests

#### Task 4.6: Test Open Trivia DB API
**Test Cases**:
1. ✅ **Happy Path**: Get trivia questions
   - Verify API is called when needed
   - Verify questions are returned
   - Verify question format is correct

2. ✅ **Category Mapping**: Test different categories
   - History → category 23
   - Geography → category 22
   - Culture → category 9
   - Science → category 17

3. ✅ **Difficulty Mapping**: Test difficulty levels
   - Level 1 → easy
   - Level 2 → medium
   - Level 3+ → hard

4. ❌ **API Error**: When Open Trivia DB is down
   - Verify graceful fallback
   - Verify no crash
   - Verify custom questions still work

5. ✅ **Integration**: Test with `get_quiz_questions` RPC
   - Verify custom + trivia questions are combined
   - Verify questions are shuffled
   - Verify correct answer is included

#### Task 4.7: Create Test Helper Functions
**File**: `test-integration/test-helpers.js`

**Functions**:
```javascript
// API Key validation helpers
function hasGoogleMapsKey() { }
function hasOpenRouterKey() { }

// Test data generators
function generateTestLocations() { }
function generateTestTags() { }

// Response validators
function validateQuestStructure(quest) { }
function validatePlaceStructure(place) { }
function validateQuestionStructure(question) { }

// Error checkers
function isAPIError(response) { }
function isRateLimitError(response) { }
```

#### Task 4.8: Update Test Runner
**File**: `test-integration/test-runner.js`

**Add**:
- Import external API tests
- Run external API tests after basic RPC tests
- Report external API test results separately
- Skip tests if API keys are not configured (with warning)

#### Task 4.9: Create Mock/Stub Support (Optional)
**File**: `test-integration/test-mocks.js`

**Purpose**: Allow testing without actual API calls
- Mock Google Maps API responses
- Mock OpenRouter API responses
- Mock Open Trivia DB responses

**Use Cases**:
- CI/CD environments without API keys
- Faster test execution
- Testing error scenarios

#### Task 4.10: Update Test Documentation
**File**: `test-integration/README.md`

**Add**:
- Instructions for setting up API keys
- How to run external API tests
- What each test verifies
- Troubleshooting guide

---

## Phase 5: Environment Configuration & Documentation

### Task 5.1: Update Environment Template
**File**: `env.template`

**Add**:
```bash
# Google Maps Places API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# OpenRouter AI API (already exists, verify)
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Task 5.2: Update Docker Configuration
**Files**:
- `wayfarer-nakama/docker-compose.yml`
- `wayfarer-nakama/local.yml`

**Add environment variables**:
```yaml
runtime:
  env:
    - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
    - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
```

### Task 5.3: Update Documentation
**Files**:
- `docs/DEVELOPMENT.md` - Add API setup instructions
- `wayfarer-nakama/README.md` - Update environment variable section

---

## Implementation Order & Dependencies

### Phase 1: Google Maps Places API (Foundation)
- **Priority**: High
- **Dependencies**: None
- **Estimated Time**: 4-6 hours
- **Blocks**: Nothing (but enables place discovery)

### Phase 2: OpenRouter API Migration (Core Feature)
- **Priority**: High
- **Dependencies**: None (OpenRouter already partially implemented)
- **Estimated Time**: 6-8 hours
- **Blocks**: Quest generation features

### Phase 3: Open Trivia DB (Enhancement)
- **Priority**: Medium
- **Dependencies**: None
- **Estimated Time**: 2-3 hours
- **Blocks**: Quiz mini-game features

### Phase 4: Integration Tests (Quality Assurance)
- **Priority**: High
- **Dependencies**: Phases 1, 2, 3 must be complete
- **Estimated Time**: 8-10 hours
- **Blocks**: Nothing (but required for deployment confidence)

### Phase 5: Documentation (Support)
- **Priority**: Medium
- **Dependencies**: Phases 1-4
- **Estimated Time**: 1-2 hours
- **Blocks**: Nothing

---

## Testing Strategy

### Unit Tests (Not in this plan, but recommended)
- Test individual helper functions
- Test API response parsing
- Test error handling logic

### Integration Tests (This plan)
- Test complete RPC functions with real APIs
- Test API connectivity
- Test error scenarios
- Test response validation

### Manual Testing Checklist
- [ ] Google Maps API returns places
- [ ] Places are inserted into database
- [ ] Mystery prompt generation works
- [ ] Single task prompt generation works
- [ ] Scavenger hunt generation works
- [ ] Trivia questions are fetched
- [ ] All API errors are handled gracefully
- [ ] Missing API keys are handled gracefully

---

## Risk Mitigation

### API Key Security
- ✅ Never commit API keys to git
- ✅ Use environment variables
- ✅ Document in `.env.template` only
- ✅ Add to `.gitignore`

### Rate Limiting
- ✅ Implement retry logic with exponential backoff
- ✅ Cache API responses when possible
- ✅ Log rate limit errors
- ✅ Provide user-friendly error messages

### API Failures
- ✅ Graceful error handling
- ✅ Fallback to database when possible
- ✅ Log errors for debugging
- ✅ Return meaningful error messages

### Cost Control
- ✅ Monitor API usage
- ✅ Implement caching to reduce API calls
- ✅ Use database queries when possible
- ✅ Set usage limits/quotas

---

## Success Criteria

### Functional Requirements
- [x] Google Maps Places API integrated and working
- [x] Mystery prompt generation works via OpenRouter
- [x] Single task prompt generation works via OpenRouter
- [x] Open Trivia DB integration complete
- [x] All functions handle errors gracefully

### Testing Requirements
- [x] Integration tests for all external APIs
- [x] Tests for happy path scenarios
- [x] Tests for error scenarios
- [x] Tests for missing API keys
- [x] All tests pass

### Documentation Requirements
- [x] Environment variables documented
- [x] API setup instructions provided
- [x] Test documentation updated
- [x] Error handling documented

---

## Estimated Timeline

- **Phase 1**: 4-6 hours
- **Phase 2**: 6-8 hours
- **Phase 3**: 2-3 hours
- **Phase 4**: 8-10 hours
- **Phase 5**: 1-2 hours

**Total**: 21-29 hours

---

## Next Steps

1. Review and approve this plan
2. Set up API keys (Google Maps, OpenRouter)
3. Start with Phase 1 (Google Maps)
4. Proceed through phases sequentially
5. Test each phase before moving to next
6. Document as you go

---

## Notes

- All API calls should use `nk.httpRequest()` for Nakama compatibility
- Error messages should be user-friendly and logged for debugging
- Consider implementing caching to reduce API costs
- Monitor API usage and costs
- Keep API keys secure and never commit them

