# Wayfarer Integration Test Suite

This directory contains the integration test suite for the Wayfarer backend.

## Overview

The integration test suite runs comprehensive tests against all backend processes using fake users and groups. It tests:

- User authentication and management
- Location services
- Quest system
- Party/group functionality
- Leaderboards and achievements
- Inventory system
- Places discovery
- And more...

## Quick Start

Run the full integration test suite:

```bash
# From the project root
./run-integration-tests.sh
```

## Configuration

The test suite can be configured via environment variables:

### Remote Server Testing (Default)
```bash
# Test against remote server (default)
export USE_REMOTE=true
export REMOTE_SERVER=5.181.218.160  # Your remote server IP
export NAKAMA_HOST=5.181.218.160    # Or set directly
export NAKAMA_PORT=7350
export NAKAMA_SERVER_KEY=defaultkey
```

### Local Docker Testing
```bash
# Test against local Docker services
export USE_REMOTE=false
export NAKAMA_HOST=localhost
export NAKAMA_PORT=7350
export NAKAMA_SERVER_KEY=defaultkey
```

### Test Configuration
```bash
export TEST_USER_COUNT=5      # Number of fake users to create
export TEST_GROUP_COUNT=2     # Number of fake groups to create

# Keep services running after tests (only for local mode)
export KEEP_SERVICES_RUNNING=true
```

**Note**: By default, the script tests against the remote server at `5.181.218.160:7350`. To test locally, set `USE_REMOTE=false`.

## What It Does

1. **Checks Prerequisites**: Verifies Node.js, npm, and Docker (only needed for local mode)
2. **Connects to Backend**: 
   - **Remote mode**: Connects to remote server at `5.181.218.160:7350`
   - **Local mode**: Starts CockroachDB and Nakama using docker-compose
3. **Waits for Health**: Ensures services are ready before testing
4. **Creates Test Users**: Creates fake users with authentication
5. **Runs Test Suite**: Tests all major backend RPC functions:
   - User location updates
   - Quest discovery and management
   - Party creation and joining
   - Leaderboards and achievements
   - Inventory management
   - Places discovery
   - **External API integrations** (Google Maps, OpenRouter, Open Trivia DB)
   - And more...

## Test Output

The script provides colored output showing:
- ✅ Passed tests (green)
- ❌ Failed tests (red)
- Summary statistics
- Error details for failures

## External API Tests

The test suite includes comprehensive tests for external API integrations:

### Google Maps Places API
- Tests `get_places_nearby` RPC function
- Validates place structure and database persistence
- Tests database fallback behavior
- Tests 3-day cooldown filtering
- **Required**: `GOOGLE_MAPS_API_KEY` environment variable

### OpenRouter API
- Tests `generate_mystery_prompt` (murder mystery quests)
- Tests `generate_single_task_prompt` (single task prompts)
- Tests `generate_scavenger_hunt` (scavenger hunt quests)
- Validates quest structure and response format
- **Required**: `OPENROUTER_API_KEY` environment variable

### Open Trivia DB API
- Tests `get_quiz_questions` with automatic fallback
- Validates question structure and category mapping
- Tests difficulty mapping and caching
- **No API key required** (public API)

### Running External API Tests Separately

You can run only the external API tests:

```bash
cd test-integration
node test-external-apis.js
```

Set environment variables for API keys:
```bash
export GOOGLE_MAPS_API_KEY=your-key-here
export OPENROUTER_API_KEY=your-key-here
```

**Note**: Tests will skip if API keys are not configured, but Open Trivia DB tests will always run.

## Manual Testing

You can also run the test runner directly:

```bash
cd test-integration
node test-runner.js
```

Make sure Nakama is running and accessible first.

## Troubleshooting

### Services won't start
- Check if ports 7350, 7351, 26257 are available
- Ensure Docker is running
- Check docker-compose logs: `cd wayfarer-nakama && docker-compose logs`

### Tests fail with connection errors
- Verify Nakama is accessible at the configured host/port
- Check firewall settings
- Ensure NAKAMA_SERVER_KEY matches your Nakama configuration

### Database errors
- Ensure database migrations have been run
- Check CockroachDB logs: `docker-compose logs cockroachdb`

## Extending Tests

To add new tests, edit `test-runner.js` and add new test functions following the pattern:

```javascript
async function testNewFeature() {
    log('\n🔧 Testing new feature...', 'cyan');
    
    for (const user of testUsers) {
        try {
            const result = await testRpc(user.session, 'new_rpc_function', {
                // test data
            });
            
            logTest(`Test name for ${user.username}`, result.success === true);
        } catch (error) {
            logTest(`Test name for ${user.username}`, false, error);
        }
    }
}
```

Then call it in the `runTests()` function.
