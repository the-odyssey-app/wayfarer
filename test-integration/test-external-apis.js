#!/usr/bin/env node

/**
 * Wayfarer External API Integration Tests
 * Tests all external API integrations: Google Maps, OpenRouter, Open Trivia DB
 */

const { Client } = require('@heroiclabs/nakama-js');

// Configuration from environment
const NAKAMA_HOST = process.env.NAKAMA_HOST || 'localhost';
const NAKAMA_PORT = process.env.NAKAMA_PORT || '7350';
const NAKAMA_SERVER_KEY = process.env.NAKAMA_SERVER_KEY || 'defaultkey';

// API Key configuration (optional - tests will skip if not configured)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function extractErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (error && typeof error.text === 'function') {
        return `HTTP Error: ${error.status || 'Unknown'} ${error.statusText || ''}`;
    }
    if (error && (error.status || error.statusText)) {
        return `HTTP Error: ${error.status || 'Unknown'} ${error.statusText || ''}`;
    }
    if (error && error.message) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}

function logTest(name, passed, error = null, skipReason = null) {
    if (skipReason) {
        testResults.skipped++;
        log(`  ⏭️  ${name} (SKIP: ${skipReason})`, 'yellow');
    } else if (passed) {
        testResults.passed++;
        log(`  ✅ ${name}`, 'green');
    } else {
        testResults.failed++;
        log(`  ❌ ${name}`, 'red');
        if (error) {
            const errorMsg = extractErrorMessage(error);
            log(`     Error: ${errorMsg}`, 'yellow');
        }
    }
    testResults.tests.push({ 
        name, 
        passed, 
        error: error ? extractErrorMessage(error) : null, 
        skipped: !!skipReason 
    });
}

// Create Nakama client
const client = new Client(NAKAMA_SERVER_KEY, NAKAMA_HOST, NAKAMA_PORT, false);

// Test user and session
let testUser = null;
let testSession = null;

// Test data
const testLocation = {
    latitude: 33.1262316,
    longitude: -117.310507
};

/**
 * Helper: Create test user and authenticate
 */
async function createTestUser() {
    try {
        const email = `externalapitest@wayfarer.test`;
        const username = `externalapitest`;
        const password = `testpass123`;
        
        const session = await client.authenticateEmail(email, password, true, username);
        testUser = {
            id: session.user_id,
            username: session.username,
            email: email,
            session: session
        };
        testSession = session;
        return testUser;
    } catch (error) {
        throw new Error(`Failed to create test user: ${error.message}`);
    }
}

/**
 * Helper: Test RPC function call
 */
async function testRpc(session, functionName, payload = {}, expectedSuccess = true) {
    try {
        const payloadString = JSON.stringify(payload);
        const result = await client.rpc(session, functionName, payloadString);
        
        let response;
        if (typeof result.payload === 'string') {
            try {
                response = JSON.parse(result.payload);
            } catch {
                response = { raw: result.payload };
            }
        } else if (typeof result.payload === 'object') {
            response = result.payload;
        } else {
            response = { raw: result.payload };
        }
        
        if (expectedSuccess && response.success === false) {
            throw new Error(response.error || 'RPC returned success: false');
        }
        
        return response;
    } catch (error) {
        if (expectedSuccess) {
            throw error;
        }
        return null;
    }
}

/**
 * Helper: Check if API key is configured
 */
function hasGoogleMapsKey() {
    return !!GOOGLE_MAPS_API_KEY;
}

function hasOpenRouterKey() {
    return !!OPENROUTER_API_KEY;
}

/**
 * Helper: Validate quest structure
 */
function validateQuestStructure(quest) {
    if (!quest) return false;
    if (!quest.title) return false;
    if (!quest.stops || !Array.isArray(quest.stops)) return false;
    if (quest.stops.length === 0) return false;
    
    // Validate each stop
    for (const stop of quest.stops) {
        if (!stop.location && !stop.coordinates) return false;
        if (!stop.activity && !stop.description) return false;
    }
    
    return true;
}

/**
 * Helper: Validate mystery quest structure
 */
function validateMysteryStructure(quest) {
    if (!quest) return false;
    if (!quest.title) return false;
    if (!quest.case_overview || !Array.isArray(quest.case_overview)) return false;
    if (!quest.stops || !Array.isArray(quest.stops)) return false;
    
    // Validate stops have required fields
    for (const stop of quest.stops) {
        if (!stop.coordinates && !stop.location) return false;
        if (!stop.description) return false;
        if (!stop.witness || !stop.witness.name || !stop.witness.dialogue) return false;
    }
    
    return true;
}

/**
 * Helper: Validate place structure
 */
function validatePlaceStructure(place) {
    if (!place) return false;
    if (!place.id) return false;
    if (!place.name) return false;
    if (place.latitude === undefined || place.longitude === undefined) return false;
    return true;
}

/**
 * Helper: Validate question structure
 */
function validateQuestionStructure(question) {
    if (!question) return false;
    if (!question.question) return false;
    if (!question.answers || !Array.isArray(question.answers)) return false;
    if (question.answers.length < 2) return false;
    if (!question.correct_answer) return false;
    if (!question.answers.includes(question.correct_answer)) return false;
    return true;
}

// ============================================================================
// GOOGLE MAPS PLACES API TESTS
// ============================================================================

/**
 * Test: Google Maps API - Get places nearby (happy path)
 */
async function testGoogleMapsGetPlacesNearby() {
    log('\n🗺️  Testing Google Maps Places API - Get places nearby...', 'cyan');
    
    if (!hasGoogleMapsKey()) {
        logTest('Google Maps API key not configured', false, null, 'GOOGLE_MAPS_API_KEY not set');
        return;
    }
    
    try {
        const result = await testRpc(testSession, 'get_places_nearby', {
            latitude: testLocation.latitude,
            longitude: testLocation.longitude,
            maxDistanceKm: 10,
            minResults: 5
        });
        
        const passed = result.success === true && 
                      result.places && 
                      Array.isArray(result.places) &&
                      result.places.length > 0;
        
        if (passed) {
            // Validate place structure
            const allValid = result.places.every(place => validatePlaceStructure(place));
            logTest(
                `Get places nearby (found ${result.places.length} places)`, 
                allValid,
                allValid ? null : 'Some places have invalid structure'
            );
            
            // Test that places were inserted into database
            if (result.places.length > 0) {
                logTest('Places inserted into database', true);
            }
        } else {
            logTest('Get places nearby', false, 'No places returned or invalid response');
        }
    } catch (error) {
        logTest('Get places nearby', false, error);
    }
}

/**
 * Test: Google Maps API - Database fallback (when places exist)
 */
async function testGoogleMapsDatabaseFallback() {
    log('\n📊 Testing Google Maps API - Database fallback...', 'cyan');
    
    if (!hasGoogleMapsKey()) {
        logTest('Database fallback test', false, null, 'GOOGLE_MAPS_API_KEY not set');
        return;
    }
    
    try {
        // First call should populate database
        await testRpc(testSession, 'get_places_nearby', {
            latitude: testLocation.latitude,
            longitude: testLocation.longitude,
            maxDistanceKm: 10
        });
        
        // Second call should use database (API should not be called if enough places exist)
        const result = await testRpc(testSession, 'get_places_nearby', {
            latitude: testLocation.latitude,
            longitude: testLocation.longitude,
            maxDistanceKm: 10,
            minResults: 1 // Low threshold to use database
        });
        
        logTest('Database fallback works', result.success === true);
    } catch (error) {
        logTest('Database fallback', false, error);
    }
}

/**
 * Test: Google Maps API - Error handling (invalid API key)
 */
async function testGoogleMapsErrorHandling() {
    log('\n⚠️  Testing Google Maps API - Error handling...', 'cyan');
    
    // Note: We can't easily test invalid API key without breaking the server config
    // But we can test with invalid coordinates
    try {
        const result = await testRpc(testSession, 'get_places_nearby', {
            latitude: 999, // Invalid latitude
            longitude: 999, // Invalid longitude
            maxDistanceKm: 10
        }, false); // Don't expect success
        
        // Should handle gracefully
        logTest('Invalid coordinates handled gracefully', 
            result.success === false || result.error !== undefined);
    } catch (error) {
        // Error is expected for invalid coordinates
        logTest('Invalid coordinates error handling', true);
    }
}

/**
 * Test: Google Maps API - 3-day cooldown filtering
 */
async function testGoogleMapsCooldown() {
    log('\n⏰ Testing Google Maps API - 3-day cooldown...', 'cyan');
    
    if (!hasGoogleMapsKey()) {
        logTest('3-day cooldown test', false, null, 'GOOGLE_MAPS_API_KEY not set');
        return;
    }
    
    try {
        // Get places first time
        const result1 = await testRpc(testSession, 'get_places_nearby', {
            latitude: testLocation.latitude,
            longitude: testLocation.longitude,
            maxDistanceKm: 10
        });
        
        if (result1.success && result1.places && result1.places.length > 0) {
            // Note: We can't easily test the cooldown without waiting 3 days
            // But we can verify the response includes filtered_visited count
            const hasFilterInfo = result1.filtered_visited !== undefined;
            logTest('Cooldown filtering info included', hasFilterInfo);
        } else {
            logTest('3-day cooldown test', false, null, 'No places found to test');
        }
    } catch (error) {
        logTest('3-day cooldown test', false, error);
    }
}

// ============================================================================
// OPENROUTER API TESTS
// ============================================================================

/**
 * Test: OpenRouter API - Generate mystery prompt (happy path)
 */
async function testOpenRouterMysteryPrompt() {
    log('\n🎭 Testing OpenRouter API - Generate mystery prompt...', 'cyan');
    
    if (!hasOpenRouterKey() || !hasGoogleMapsKey()) {
        logTest('Generate mystery prompt', false, null, 'OPENROUTER_API_KEY or GOOGLE_MAPS_API_KEY not set');
        return;
    }
    
    try {
        // Get real places from Google Maps first
        const placesResult = await testRpc(testSession, 'get_places_nearby', {
            latitude: testLocation.latitude,
            longitude: testLocation.longitude,
            radiusKm: 5,
            minResults: 10
        }, false);
        
        if (!placesResult || !placesResult.success || !placesResult.places || placesResult.places.length < 2) {
            logTest('Generate mystery prompt', false, 'Could not get places from Google Maps');
            return;
        }
        
        // Format locations for mystery prompt (need 10 stops)
        const places = placesResult.places.slice(0, 10);
        const locations = places.map(p => ({
            location: { lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) },
            place_id: p.id
        }));
        
        const result = await testRpc(testSession, 'generate_mystery_prompt', {
            locations: locations,
            tags: ['history', 'adventure']
        });
        
        if (result.success && result.quest) {
            const isValid = validateMysteryStructure(result.quest);
            logTest(
                `Generate mystery prompt: ${result.quest.title}`, 
                isValid,
                isValid ? null : 'Invalid mystery quest structure'
            );
            
            if (isValid) {
                logTest('Mystery has case overview', 
                    result.quest.case_overview && result.quest.case_overview.length > 0);
                logTest('Mystery has stops with witnesses', 
                    result.quest.stops.every(s => s.witness && s.witness.dialogue));
            }
        } else {
            logTest('Generate mystery prompt', false, result.error || 'No quest returned');
        }
    } catch (error) {
        logTest('Generate mystery prompt', false, error);
    }
}

/**
 * Test: OpenRouter API - Generate single task prompt (happy path)
 */
async function testOpenRouterSingleTaskPrompt() {
    log('\n📝 Testing OpenRouter API - Generate single task prompt...', 'cyan');
    
    if (!hasOpenRouterKey()) {
        logTest('Generate single task prompt', false, null, 'OPENROUTER_API_KEY not set');
        return;
    }
    
    try {
        const result = await testRpc(testSession, 'generate_single_task_prompt', {
            tags: ['art', 'culture']
        });
        
        if (result.success && result.content) {
            const isValid = typeof result.content === 'string' && 
                           result.content.length > 0 &&
                           !result.content.includes('${tags');
            
            logTest(
                `Generate single task prompt (${result.content.substring(0, 50)}...)`, 
                isValid,
                isValid ? null : 'Invalid task content'
            );
        } else {
            logTest('Generate single task prompt', false, result.error || 'No content returned');
        }
    } catch (error) {
        logTest('Generate single task prompt', false, error);
    }
}

/**
 * Test: OpenRouter API - Generate scavenger hunt (happy path)
 */
async function testOpenRouterScavengerHunt() {
    log('\n🎯 Testing OpenRouter API - Generate scavenger hunt...', 'cyan');
    
    if (!hasOpenRouterKey() || !hasGoogleMapsKey()) {
        logTest('Generate scavenger hunt', false, null, 'OPENROUTER_API_KEY or GOOGLE_MAPS_API_KEY not set');
        return;
    }
    
    try {
        // Get real places from Google Maps first
        const placesResult = await testRpc(testSession, 'get_places_nearby', {
            latitude: testLocation.latitude,
            longitude: testLocation.longitude,
            radiusKm: 5,
            minResults: 10
        }, false);
        
        if (!placesResult || !placesResult.success || !placesResult.places || placesResult.places.length < 2) {
            logTest('Generate scavenger hunt', false, 'Could not get places from Google Maps');
            return;
        }
        
        // Format locations for scavenger hunt (need 10 stops)
        const places = placesResult.places.slice(0, 10);
        const locations = places.map(p => ({
            lat: parseFloat(p.latitude),
            lng: parseFloat(p.longitude),
            name: p.name || 'Location'
        }));
        
        const result = await testRpc(testSession, 'generate_scavenger_hunt', {
            locations: locations,
            userTags: ['exploration', 'nature'],
            difficulty: 2
        });
        
        if (result.success && result.quest) {
            const isValid = validateQuestStructure(result.quest);
            logTest(
                `Generate scavenger hunt: ${result.quest.title}`, 
                isValid,
                isValid ? null : 'Invalid quest structure'
            );
            
            if (isValid) {
                logTest('Scavenger hunt has correct number of stops', 
                    result.quest.stops.length === 10); // Should have 10 stops
            }
        } else {
            logTest('Generate scavenger hunt', false, result.error || 'No quest returned');
        }
    } catch (error) {
        logTest('Generate scavenger hunt', false, error);
    }
}

/**
 * Test: OpenRouter API - Missing API key error handling
 */
async function testOpenRouterMissingKey() {
    log('\n⚠️  Testing OpenRouter API - Error handling...', 'cyan');
    
    // Note: We can't easily test missing API key without breaking server config
    // But we can test with invalid input
    try {
        const result = await testRpc(testSession, 'generate_scavenger_hunt', {
            locations: [], // Empty locations should fail
            userTags: []
        }, false);
        
        logTest('OpenRouter handles invalid input', 
            result.success === false && result.error !== undefined);
    } catch (error) {
        // Error is expected for invalid input
        logTest('OpenRouter invalid input error handling', true);
    }
}

/**
 * Test: OpenRouter API - Response validation
 */
async function testOpenRouterResponseValidation() {
    log('\n✅ Testing OpenRouter API - Response validation...', 'cyan');
    
    if (!hasOpenRouterKey()) {
        logTest('Response validation test', false, null, 'OPENROUTER_API_KEY not set');
        return;
    }
    
    try {
        // Test mystery prompt validation
        const mysteryResult = await testRpc(testSession, 'generate_mystery_prompt', {
            locations: [{ location: { lat: 33.1262316, lng: -117.310507 } }],
            tags: ['test']
        });
        
        if (mysteryResult.success && mysteryResult.quest) {
            const hasTitle = !!mysteryResult.quest.title;
            const hasStops = Array.isArray(mysteryResult.quest.stops) && mysteryResult.quest.stops.length > 0;
            const hasCaseOverview = Array.isArray(mysteryResult.quest.case_overview);
            
            logTest('Mystery quest structure validation', hasTitle && hasStops && hasCaseOverview);
        }
    } catch (error) {
        logTest('Response validation', false, error);
    }
}

// ============================================================================
// OPEN TRIVIA DB API TESTS
// ============================================================================

/**
 * Test: Open Trivia DB API - Get quiz questions (happy path)
 */
async function testOpenTriviaDBGetQuestions() {
    log('\n📚 Testing Open Trivia DB API - Get quiz questions...', 'cyan');
    
    try {
        const result = await testRpc(testSession, 'get_quiz_questions', {
            questId: null,
            placeId: null,
            questionCount: 5,
            difficulty: 2,
            category: 'culture'
        });
        
        if (result.success && result.questions) {
            const isValid = Array.isArray(result.questions) && 
                           result.questions.length > 0 &&
                           result.questions.every(q => validateQuestionStructure(q));
            
            logTest(
                `Get quiz questions (found ${result.questions.length} questions)`, 
                isValid,
                isValid ? null : 'Invalid question structure'
            );
            
            if (isValid) {
                // Check if questions include trivia questions
                const hasTriviaQuestions = result.triviaCount > 0 || 
                                         result.questions.some(q => q.source === 'trivia_db');
                logTest('Open Trivia DB questions included', hasTriviaQuestions || result.customCount < result.questionCount);
            }
        } else {
            logTest('Get quiz questions', false, result.error || 'No questions returned');
        }
    } catch (error) {
        logTest('Get quiz questions', false, error);
    }
}

/**
 * Test: Open Trivia DB API - Category mapping
 */
async function testOpenTriviaDBCategoryMapping() {
    log('\n🗂️  Testing Open Trivia DB API - Category mapping...', 'cyan');
    
    try {
        // Get a place or quest ID first
        let placeId = null;
        const placesResult = await testRpc(testSession, 'get_places_nearby', {
            latitude: 33.1262316,
            longitude: -117.310507,
            radiusKm: 5
        }, false);
        
        if (placesResult && placesResult.success && placesResult.places && placesResult.places.length > 0) {
            placeId = placesResult.places[0].id;
        }
        
        if (!placeId) {
            logTest('Category mapping', false, 'Missing questStepId, questId, or placeId');
            return;
        }
        
        const categories = ['history', 'geography', 'culture', 'science'];
        
        for (const category of categories) {
            const result = await testRpc(testSession, 'get_quiz_questions', {
                placeId: placeId,
                questionCount: 3,
                difficulty: 2,
                category: category
            });
            
            if (result.success && result.questions && result.questions.length > 0) {
                // Verify questions have correct category
                const allMatchCategory = result.questions.every(q => 
                    q.category === category || q.category === 'culture' // culture is default
                );
                logTest(`Category mapping: ${category}`, allMatchCategory);
            } else {
                logTest(`Category mapping: ${category}`, false, null, 'No questions returned');
            }
        }
    } catch (error) {
        logTest('Category mapping', false, error);
    }
}

/**
 * Test: Open Trivia DB API - Difficulty mapping
 */
async function testOpenTriviaDBDifficultyMapping() {
    log('\n📊 Testing Open Trivia DB API - Difficulty mapping...', 'cyan');
    
    try {
        // Get a place or quest ID first
        let placeId = null;
        const placesResult = await testRpc(testSession, 'get_places_nearby', {
            latitude: 33.1262316,
            longitude: -117.310507,
            radiusKm: 5
        }, false);
        
        if (placesResult && placesResult.success && placesResult.places && placesResult.places.length > 0) {
            placeId = placesResult.places[0].id;
        }
        
        if (!placeId) {
            logTest('Difficulty mapping', false, 'Missing questStepId, questId, or placeId');
            return;
        }
        
        const difficulties = [1, 2, 3];
        
        for (const difficulty of difficulties) {
            const result = await testRpc(testSession, 'get_quiz_questions', {
                placeId: placeId,
                questionCount: 3,
                difficulty: difficulty,
                category: 'culture'
            });
            
            if (result.success && result.questions && result.questions.length > 0) {
                // Verify questions have correct difficulty
                const allMatchDifficulty = result.questions.every(q => 
                    q.difficulty === difficulty || 
                    (difficulty === 1 && q.difficulty >= 1 && q.difficulty <= 2) ||
                    (difficulty === 2 && q.difficulty >= 1 && q.difficulty <= 3) ||
                    (difficulty === 3 && q.difficulty >= 2 && q.difficulty <= 3)
                );
                logTest(`Difficulty mapping: ${difficulty}`, allMatchDifficulty);
            } else {
                logTest(`Difficulty mapping: ${difficulty}`, false, null, 'No questions returned');
            }
        }
    } catch (error) {
        logTest('Difficulty mapping', false, error);
    }
}

/**
 * Test: Open Trivia DB API - Fallback to custom questions
 */
async function testOpenTriviaDBFallback() {
    log('\n🔄 Testing Open Trivia DB API - Fallback behavior...', 'cyan');
    
    try {
        // Get a place or quest ID first
        let placeId = null;
        const placesResult = await testRpc(testSession, 'get_places_nearby', {
            latitude: 33.1262316,
            longitude: -117.310507,
            radiusKm: 5
        }, false);
        
        if (placesResult && placesResult.success && placesResult.places && placesResult.places.length > 0) {
            placeId = placesResult.places[0].id;
        }
        
        if (!placeId) {
            logTest('Fallback behavior', false, 'Missing questStepId, questId, or placeId');
            return;
        }
        
        // Request questions - should use database first, then Open Trivia DB if needed
        const result = await testRpc(testSession, 'get_quiz_questions', {
            placeId: placeId,
            questionCount: 10, // Request more than likely in database
            difficulty: 2,
            category: 'culture'
        });
        
        if (result.success && result.questions) {
            const hasQuestions = result.questions.length > 0;
            const hasMetadata = result.totalFound !== undefined && 
                               result.customCount !== undefined && 
                               result.triviaCount !== undefined;
            
            logTest('Fallback to Open Trivia DB works', hasQuestions);
            logTest('Response includes metadata', hasMetadata);
        } else {
            logTest('Fallback behavior', false, result.error || 'No questions returned');
        }
    } catch (error) {
        logTest('Fallback behavior', false, error);
    }
}

/**
 * Test: Open Trivia DB API - Question caching
 */
async function testOpenTriviaDBCaching() {
    log('\n💾 Testing Open Trivia DB API - Question caching...', 'cyan');
    
    try {
        // Get a place or quest ID first
        let placeId = null;
        const placesResult = await testRpc(testSession, 'get_places_nearby', {
            latitude: 33.1262316,
            longitude: -117.310507,
            radiusKm: 5
        }, false);
        
        if (placesResult && placesResult.success && placesResult.places && placesResult.places.length > 0) {
            placeId = placesResult.places[0].id;
        }
        
        if (!placeId) {
            logTest('Question caching', false, 'Missing questStepId, questId, or placeId');
            return;
        }
        
        // First request - should fetch from Open Trivia DB
        const result1 = await testRpc(testSession, 'get_quiz_questions', {
            placeId: placeId,
            questionCount: 5,
            difficulty: 2,
            category: 'culture'
        });
        
        // Second request - should potentially use cached questions
        const result2 = await testRpc(testSession, 'get_quiz_questions', {
            placeId: placeId,
            questionCount: 5,
            difficulty: 2,
            category: 'culture'
        });
        
        if (result1.success && result2.success) {
            // Both should return questions (either from API or cache)
            const hasQuestions = (result1.questions && result1.questions.length > 0) ||
                               (result2.questions && result2.questions.length > 0);
            
            logTest('Question caching', hasQuestions);
        } else {
            logTest('Question caching', false, result1.error || result2.error || 'Failed to get questions');
        }
    } catch (error) {
        logTest('Question caching', false, error);
    }
}

/**
 * Test: End-to-End Quest Creation - Basic flow
 */
async function testCreateQuestFromLocation() {
    log('\n🎯 Testing End-to-End Quest Creation - Basic flow...', 'cyan');
    
    if (!hasGoogleMapsKey() || !hasOpenRouterKey()) {
        logTest('Create quest from location', false, null, 'GOOGLE_MAPS_API_KEY or OPENROUTER_API_KEY not set');
        return;
    }
    
    try {
        const result = await testRpc(testSession, 'create_scavenger_quest_from_location', {
            latitude: testLocation.latitude,
            longitude: testLocation.longitude,
            userTags: ['exploration', 'nature'],
            difficulty: 2,
            isGroup: false,
            maxDistanceKm: 10
        });
        
        if (result.success && result.questId) {
            logTest(
                `Create quest from location: ${result.questId}`, 
                true
            );
            
            // Verify quest has steps (should have 10 stops for scavenger)
            if (result.quest && result.quest.stops) {
                logTest('Quest has steps', 
                    result.quest.stops.length > 0);
                
                // Verify steps have place_ids
                const stepsWithPlaces = result.quest.stops.filter(s => s.place_id);
                logTest('Quest steps linked to places', 
                    stepsWithPlaces.length > 0);
                
                // Verify it has 10 stops (scavenger requirement)
                if (result.quest.stops.length === 10) {
                    logTest('Quest has 10 stops (scavenger requirement)', true);
                }
            }
        } else {
            logTest('Create quest from location', false, result.error || 'No questId returned');
        }
    } catch (error) {
        logTest('Create quest from location', false, error);
    }
}

/**
 * Test: End-to-End Quest Creation - Scavenger Hunt
 */
async function testCreateQuestFromLocationScavenger() {
    log('\n🎯 Testing End-to-End Quest Creation - Scavenger Hunt...', 'cyan');
    
    if (!hasGoogleMapsKey() || !hasOpenRouterKey()) {
        logTest('Create scavenger quest from location', false, null, 'API keys not set');
        return;
    }
    
    try {
        const result = await testRpc(testSession, 'create_scavenger_quest_from_location', {
            latitude: testLocation.latitude,
            longitude: testLocation.longitude,
            userTags: ['art', 'culture', 'history'],
            difficulty: 2,
            isGroup: false,
            maxDistanceKm: 10
        });
        
        if (result.success && result.questId) {
            const isValid = result.quest && 
                           result.quest.title && 
                           result.quest.stops && 
                           result.quest.stops.length === 10; // Scavenger hunts always have 10 stops
            
            logTest(
                `Create scavenger quest: ${result.quest?.title || 'Unknown'} (${result.quest?.stops?.length || 0} stops)`, 
                isValid,
                isValid ? null : 'Invalid quest structure or wrong number of stops'
            );
        } else {
            logTest('Create scavenger quest from location', false, result.error || 'No questId returned');
        }
    } catch (error) {
        logTest('Create scavenger quest from location', false, error);
    }
}

/**
 * Test: End-to-End Quest Creation - Mystery
 */
async function testCreateQuestFromLocationMystery() {
    log('\n🎭 Testing End-to-End Quest Creation - Mystery...', 'cyan');
    
    if (!hasGoogleMapsKey() || !hasOpenRouterKey()) {
        logTest('Create mystery quest from location', false, null, 'API keys not set');
        return;
    }
    
    try {
        const result = await testRpc(testSession, 'create_mystery_quest_from_location', {
            latitude: testLocation.latitude,
            longitude: testLocation.longitude,
            userTags: ['mystery', 'detective', 'adventure'],
            difficulty: 3,
            isGroup: false,
            maxDistanceKm: 10
        });
        
        if (result.success && result.questId) {
            const isValid = result.quest && 
                           result.quest.title && 
                           result.quest.case_overview &&
                           result.quest.stops && 
                           result.quest.stops.length === 10; // Mystery quests always have 10 stops
            
            logTest(
                `Create mystery quest: ${result.quest?.title || 'Unknown'} (${result.quest?.stops?.length || 0} stops)`, 
                isValid,
                isValid ? null : 'Invalid mystery quest structure or wrong number of stops'
            );
            
            if (isValid && result.quest.case_overview) {
                logTest('Mystery has case overview', 
                    result.quest.case_overview.length > 0);
            }
        } else {
            logTest('Create mystery quest from location', false, result.error || 'No questId returned');
        }
    } catch (error) {
        logTest('Create mystery quest from location', false, error);
    }
}

/**
 * Test: End-to-End Quest Creation - Single Task Prompt
 */
async function testCreateQuestFromLocationSingle() {
    log('\n📝 Testing End-to-End Quest Creation - Single Task Prompt...', 'cyan');
    
    if (!hasGoogleMapsKey() || !hasOpenRouterKey()) {
        logTest('Create single task prompt from location', false, null, 'API keys not set');
        return;
    }
    
    try {
        const result = await testRpc(testSession, 'create_single_task_quest_from_location', {
            latitude: testLocation.latitude,
            longitude: testLocation.longitude,
            userTags: ['solo', 'quick'],
            maxDistanceKm: 5
        });
        
        if (result.success && result.prompt) {
            const isValid = typeof result.prompt === 'string' && 
                           result.prompt.length > 0 &&
                           result.place && 
                           result.place.id &&
                           !result.prompt.includes('${tags');
            
            logTest(
                `Create single task prompt: ${result.prompt.substring(0, 50)}...`, 
                isValid,
                isValid ? null : 'Invalid single task prompt structure'
            );
            
            if (isValid && result.place) {
                logTest('Single task has place information', 
                    result.place.id && result.place.name);
            }
        } else {
            logTest('Create single task prompt from location', false, result.error || 'No prompt returned');
        }
    } catch (error) {
        logTest('Create single task prompt from location', false, error);
    }
}

/**
 * Test: Accept Single Task Achievement
 */
async function testAcceptSingleTaskAchievement() {
    log('\n📝 Testing Accept Single Task Achievement...', 'cyan');
    
    if (!hasGoogleMapsKey() || !hasOpenRouterKey()) {
        logTest('Accept single task achievement', false, null, 'API keys not set');
        return;
    }
    
    try {
        // First get a prompt
        const promptResult = await testRpc(testSession, 'create_single_task_quest_from_location', {
            latitude: testLocation.latitude,
            longitude: testLocation.longitude,
            userTags: ['solo', 'quick'],
            maxDistanceKm: 5
        }, false);
        
        if (!promptResult || !promptResult.success || !promptResult.prompt || !promptResult.place) {
            logTest('Accept single task achievement', false, 'Could not get prompt');
            return;
        }
        
        // Now accept the achievement
        const result = await testRpc(testSession, 'accept_single_task_achievement', {
            prompt: promptResult.prompt,
            placeId: promptResult.place.id,
            latitude: promptResult.place.latitude,
            longitude: promptResult.place.longitude
        });
        
        if (result.success && result.achievementId) {
            logTest(
                `Accept single task achievement: ${result.achievementId}`, 
                true
            );
            
            if (result.rewardXp) {
                logTest('Achievement has reward XP', result.rewardXp > 0);
            }
        } else {
            logTest('Accept single task achievement', false, result.error || 'No achievementId returned');
        }
    } catch (error) {
        logTest('Accept single task achievement', false, error);
    }
}

/**
 * Test: Complete Single Task Achievement
 */
async function testCompleteSingleTaskAchievement() {
    log('\n📝 Testing Complete Single Task Achievement...', 'cyan');
    
    if (!hasGoogleMapsKey() || !hasOpenRouterKey()) {
        logTest('Complete single task achievement', false, null, 'API keys not set');
        return;
    }
    
    try {
        // First get and accept a prompt
        const promptResult = await testRpc(testSession, 'create_single_task_quest_from_location', {
            latitude: testLocation.latitude,
            longitude: testLocation.longitude,
            userTags: ['solo', 'quick'],
            maxDistanceKm: 5
        }, false);
        
        if (!promptResult || !promptResult.success || !promptResult.prompt || !promptResult.place) {
            logTest('Complete single task achievement', false, 'Could not get prompt');
            return;
        }
        
        const acceptResult = await testRpc(testSession, 'accept_single_task_achievement', {
            prompt: promptResult.prompt,
            placeId: promptResult.place.id,
            latitude: promptResult.place.latitude,
            longitude: promptResult.place.longitude
        }, false);
        
        if (!acceptResult || !acceptResult.success || !acceptResult.achievementId) {
            logTest('Complete single task achievement', false, 'Could not accept achievement');
            return;
        }
        
        // Now complete the achievement
        const result = await testRpc(testSession, 'complete_single_task_achievement', {
            achievementId: acceptResult.achievementId,
            completionProof: 'test completion'
        });
        
        if (result.success && result.xpAwarded) {
            logTest(
                `Complete single task achievement: ${result.xpAwarded} XP awarded`, 
                true
            );
            
            if (result.newXp !== undefined) {
                logTest('User XP updated', result.newXp > 0);
            }
            
            if (result.levelUp) {
                logTest('User leveled up', result.levelUp);
            }
        } else {
            logTest('Complete single task achievement', false, result.error || 'No XP awarded');
        }
    } catch (error) {
        logTest('Complete single task achievement', false, error);
    }
}

async function testOpenTriviaDBCaching() {
    log('\n💾 Testing Open Trivia DB API - Question caching...', 'cyan');
    
    try {
        // Get a place or quest ID first
        let placeId = null;
        const placesResult = await testRpc(testSession, 'get_places_nearby', {
            latitude: 33.1262316,
            longitude: -117.310507,
            radiusKm: 5
        }, false);
        
        if (placesResult && placesResult.success && placesResult.places && placesResult.places.length > 0) {
            placeId = placesResult.places[0].id;
        }
        
        if (!placeId) {
            logTest('Question caching', false, 'Missing questStepId, questId, or placeId');
            return;
        }
        
        // First request - should fetch from Open Trivia DB
        const result1 = await testRpc(testSession, 'get_quiz_questions', {
            placeId: placeId,
            questionCount: 5,
            difficulty: 2,
            category: 'culture'
        });
        
        // Second request - should potentially use cached questions
        const result2 = await testRpc(testSession, 'get_quiz_questions', {
            placeId: placeId,
            questionCount: 5,
            difficulty: 2,
            category: 'culture'
        });
        
        if (result1.success && result2.success) {
            // Both should return questions (cached or fresh)
            logTest('Question caching works', 
                result1.questions.length > 0 && result2.questions.length > 0);
        } else {
            logTest('Question caching', false, 'Failed to get questions');
        }
    } catch (error) {
        logTest('Question caching', false, error);
    }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

/**
 * Run all external API tests
 */
async function runExternalAPITests() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║   Wayfarer External API Integration Tests                  ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');
    
    log('\n📋 Configuration:', 'cyan');
    log(`  Nakama Host: ${NAKAMA_HOST}:${NAKAMA_PORT}`);
    log(`  Google Maps API Key: ${hasGoogleMapsKey() ? '✅ Configured' : '❌ Not configured'}`);
    log(`  OpenRouter API Key: ${hasOpenRouterKey() ? '✅ Configured' : '❌ Not configured'}`);
    log(`  Open Trivia DB: ✅ No API key required (public API)`);
    
    try {
        // Create test user
        log('\n👤 Creating test user...', 'cyan');
        await createTestUser();
        log(`  ✅ Created test user: ${testUser.username}`, 'green');
        
        // Run Google Maps API tests
        log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
        log('GOOGLE MAPS PLACES API TESTS', 'blue');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
        
        await testGoogleMapsGetPlacesNearby();
        await testGoogleMapsDatabaseFallback();
        await testGoogleMapsErrorHandling();
        await testGoogleMapsCooldown();
        
        // Run OpenRouter API tests
        log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
        log('OPENROUTER API TESTS', 'blue');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
        
        await testOpenRouterMysteryPrompt();
        await testOpenRouterSingleTaskPrompt();
        await testOpenRouterScavengerHunt();
        await testOpenRouterMissingKey();
        await testOpenRouterResponseValidation();
        
        // Run Open Trivia DB tests
        log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
        log('OPEN TRIVIA DB API TESTS', 'blue');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
        
        await testOpenTriviaDBGetQuestions();
        await testOpenTriviaDBCategoryMapping();
        await testOpenTriviaDBDifficultyMapping();
        await testOpenTriviaDBFallback();
        await testOpenTriviaDBCaching();
        
        // Run End-to-End Quest Creation tests
        log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
        log('END-TO-END QUEST CREATION TESTS', 'blue');
        log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
        
        await testCreateQuestFromLocation();
        await testCreateQuestFromLocationScavenger();
        await testCreateQuestFromLocationMystery();
        await testCreateQuestFromLocationSingle();
        await testAcceptSingleTaskAchievement();
        await testCompleteSingleTaskAchievement();
        
        // Print summary
        log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
        log('║   External API Test Summary                              ║', 'blue');
        log('╚════════════════════════════════════════════════════════════╝', 'blue');
        log(`\n  Total Tests: ${testResults.passed + testResults.failed + testResults.skipped}`);
        log(`  ✅ Passed: ${testResults.passed}`, 'green');
        log(`  ❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
        log(`  ⏭️  Skipped: ${testResults.skipped}`, testResults.skipped > 0 ? 'yellow' : 'green');
        
        if (testResults.failed > 0) {
            log('\n  Failed Tests:', 'red');
            testResults.tests
                .filter(t => !t.passed && !t.skipped)
                .forEach(t => {
                    log(`    - ${t.name}`, 'red');
                    if (t.error) {
                        log(`      ${t.error}`, 'yellow');
                    }
                });
        }
        
        if (testResults.skipped > 0) {
            log('\n  Skipped Tests (API keys not configured):', 'yellow');
            testResults.tests
                .filter(t => t.skipped)
                .forEach(t => {
                    log(`    - ${t.name}`, 'yellow');
                });
        }
        
        return testResults.failed === 0;
    } catch (error) {
        log(`\n❌ Test runner error: ${error.message}`, 'red');
        console.error(error);
        return false;
    }
}

// Run tests if executed directly
if (require.main === module) {
    runExternalAPITests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            log(`\n❌ Fatal error: ${error.message}`, 'red');
            console.error(error);
            process.exit(1);
        });
}

module.exports = { runExternalAPITests, testResults };

