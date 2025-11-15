# How to Run All Tests

This guide explains how to run the complete test suite for Wayfarer, including all external API integration tests.

## Quick Start

### Option 1: Run All Tests (Recommended)

```bash
# From the project root directory
./run-integration-tests.sh
```

This will:
- ✅ Test against remote server by default (or local if configured)
- ✅ Run all 74+ RPC function tests
- ✅ Run external API integration tests (Google Maps, OpenRouter, Open Trivia DB)
- ✅ Provide comprehensive test results

### Option 2: Run Tests with API Keys

For full external API test coverage, set your API keys:

```bash
# Set API keys (optional - tests will skip if not set)
export GOOGLE_MAPS_API_KEY=your-google-maps-api-key
export OPENROUTER_API_KEY=your-openrouter-api-key

# Run all tests
./run-integration-tests.sh
```

**Note**: Open Trivia DB tests will always run (no API key required).

## Test Modes

### Remote Server Testing (Default)

Tests against the remote Nakama server:

```bash
# Default - tests remote server
./run-integration-tests.sh

# Or explicitly set
export USE_REMOTE=true
export REMOTE_SERVER=5.181.218.160
./run-integration-tests.sh
```

### Local Docker Testing

Tests against local Docker containers:

```bash
# Test against local services
export USE_REMOTE=false
./run-integration-tests.sh
```

This will:
- Start CockroachDB and Nakama in Docker
- Run all tests
- Stop services when done (unless `KEEP_SERVICES_RUNNING=true`)

## Running Specific Test Suites

### Run External API Tests Only

```bash
cd test-integration

# Set API keys
export GOOGLE_MAPS_API_KEY=your-key
export OPENROUTER_API_KEY=your-key

# Run external API tests
node test-external-apis.js
```

### Run Main Test Suite Only

```bash
cd test-integration

# Set Nakama connection
export NAKAMA_HOST=localhost  # or remote server IP
export NAKAMA_PORT=7350
export NAKAMA_SERVER_KEY=defaultkey

# Run main test suite
node test-runner.js
```

## Configuration Options

### Environment Variables

```bash
# Nakama Connection
export NAKAMA_HOST=localhost          # or remote IP
export NAKAMA_PORT=7350
export NAKAMA_SERVER_KEY=defaultkey
export NAKAMA_HTTP_KEY=defaulthttpkey

# Test Configuration
export TEST_USER_COUNT=5              # Number of test users
export TEST_GROUP_COUNT=2              # Number of test groups
export USE_REMOTE=true                 # Use remote server
export REMOTE_SERVER=5.181.218.160     # Remote server IP

# External API Keys (Optional)
export GOOGLE_MAPS_API_KEY=your-key
export OPENROUTER_API_KEY=your-key

# Local Mode Options
export KEEP_SERVICES_RUNNING=true      # Keep Docker services running
```

## What Gets Tested

### Main Test Suite (74+ RPC Functions)
- ✅ User authentication and management
- ✅ Location services
- ✅ Quest system (discovery, starting, completion)
- ✅ Party/group functionality
- ✅ Leaderboards and achievements
- ✅ Inventory system
- ✅ Places discovery
- ✅ Mini-games (quiz, observation)
- ✅ Events system
- ✅ Safety reporting
- ✅ And more...

### External API Integration Tests
- ✅ **Google Maps Places API**
  - Place discovery (`get_places_nearby`)
  - Database fallback behavior
  - 3-day cooldown filtering
  - Error handling
- ✅ **OpenRouter API**
  - Mystery prompt generation
  - Single task prompt generation
  - Scavenger hunt generation
  - Response validation
- ✅ **Open Trivia DB API**
  - Question fetching
  - Category mapping
  - Difficulty mapping
  - Fallback behavior
  - Question caching

## Test Output

The test suite provides:
- ✅ **Green checkmarks** for passed tests
- ❌ **Red X marks** for failed tests
- ⏭️ **Yellow skip marks** for skipped tests (usually API keys not configured)
- 📊 **Summary statistics** at the end
- 🔍 **Error details** for failed tests

## Troubleshooting

### Tests Fail to Connect

```bash
# Check if Nakama is running
curl http://localhost:7350/

# For local mode, check Docker
cd wayfarer-nakama
docker-compose ps
docker-compose logs nakama
```

### External API Tests Skip

If you see skipped tests, it's because API keys aren't configured:

```bash
# Set API keys
export GOOGLE_MAPS_API_KEY=your-key
export OPENROUTER_API_KEY=your-key

# Re-run tests
./run-integration-tests.sh
```

**Note**: Open Trivia DB tests will always run (no API key needed).

### Services Won't Start (Local Mode)

```bash
# Check if ports are available
netstat -an | grep 7350
netstat -an | grep 26257

# Stop conflicting services
cd wayfarer-nakama
docker-compose down

# Check Docker logs
docker-compose logs
```

### Database Migration Errors

```bash
# Ensure migrations are run
cd wayfarer-nakama
docker-compose exec nakama nakama migrate up
```

## Example Output

```
╔════════════════════════════════════════════════════════════╗
║   Wayfarer Full Integration Test Suite                   ║
╚════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXTERNAL API INTEGRATION TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗺️  Testing Google Maps Places API - Get places nearby...
  ✅ Get places nearby (found 5 places)
  ✅ Places inserted into database

🎭 Testing OpenRouter API - Generate mystery prompt...
  ✅ Generate mystery prompt: The Gemstone Grill
  ✅ Mystery has case overview
  ✅ Mystery has stops with witnesses

📚 Testing Open Trivia DB API - Get quiz questions...
  ✅ Get quiz questions (found 5 questions)
  ✅ Open Trivia DB questions included

╔════════════════════════════════════════════════════════════╗
║   External API Test Summary                              ║
╚════════════════════════════════════════════════════════════╝

  Total Tests: 14
  ✅ Passed: 14
  ❌ Failed: 0
  ⏭️  Skipped: 0
```

## Next Steps

After running tests:
1. Review any failed tests
2. Check error messages for details
3. Fix issues and re-run tests
4. All tests should pass before deploying

For more details, see:
- `test-integration/README.md` - Detailed test documentation
- `EXTERNAL_APIS_IMPLEMENTATION_PLAN.md` - External API implementation details

