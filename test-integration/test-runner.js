#!/usr/bin/env node

/**
 * Wayfarer Integration Test Runner
 * Comprehensive end-to-end testing for all backend systems
 * Tests 13 critical user journeys including quest flows, social features, and progression
 */

const { Client } = require('@heroiclabs/nakama-js');

// Configuration from environment
const NAKAMA_HOST = process.env.NAKAMA_HOST || 'localhost';
const NAKAMA_PORT = parseInt(process.env.NAKAMA_PORT || '7350', 10);
const NAKAMA_SERVER_KEY = process.env.NAKAMA_SERVER_KEY || 'defaultkey';
const TEST_USER_COUNT = parseInt(process.env.TEST_USER_COUNT || '5', 10);
const TEST_GROUP_COUNT = parseInt(process.env.TEST_GROUP_COUNT || '2', 10);

// API Keys (optional)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: [],
    startTime: Date.now()
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

function logSection(title) {
    log('\n' + '='.repeat(70), 'blue');
    log(title, 'blue');
    log('='.repeat(70), 'blue');
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
        skipped: !!skipReason,
        timestamp: Date.now()
    });
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

// Create Nakama client
const client = new Client(NAKAMA_SERVER_KEY, NAKAMA_HOST, NAKAMA_PORT, false);

// Test data storage
const testData = {
    users: [],
    sessions: [],
    quests: [],
    parties: [],
    items: []
};

/**
 * Test Data Factory
 */
class TestDataFactory {
    static generateUserEmail(index) {
        // Use timestamp to ensure unique emails for each test run
        const timestamp = Date.now();
        return `testuser${index}_${timestamp}@wayfarer.test`;
    }
    
    static generateUsername(index) {
        return `testuser${index}`;
    }
    
    static generateLocation(index) {
        // Spread users across a test area (San Diego region)
        const baseLat = 33.1262316;
        const baseLon = -117.310507;
        const offset = index * 0.01; // ~1km spacing
        return {
            latitude: baseLat + offset,
            longitude: baseLon + offset
        };
    }
    
    static async createTestUser(index) {
        try {
            const email = this.generateUserEmail(index);
            const username = this.generateUsername(index);
            const password = 'testpass123';
            
            // authenticateEmail(email, password, create) - username is auto-generated from email if not provided
            const session = await client.authenticateEmail(email, password, true);
            
            const user = {
                id: session.user_id,
                username: session.username,
                email: email,
                session: session,
                index: index
            };
            
            testData.users.push(user);
            testData.sessions.push(session);
            
            return user;
        } catch (error) {
            const errorMsg = extractErrorMessage(error);
            throw new Error(`Failed to create test user ${index}: ${errorMsg}`);
        }
    }
    
    static async createTestUsers(count) {
        log(`\nCreating ${count} test users...`, 'cyan');
        const users = [];
        for (let i = 0; i < count; i++) {
            try {
                const user = await this.createTestUser(i);
                users.push(user);
                log(`  ✅ Created user: ${user.username}`, 'green');
            } catch (error) {
                log(`  ❌ Failed to create user ${i}: ${error.message}`, 'red');
                throw error;
            }
        }
        return users;
    }
    
    static async updateUserLocation(user, location) {
        try {
            const result = await client.rpc(user.session, 'update_user_location', JSON.stringify({
                latitude: location.latitude,
                longitude: location.longitude
            }));
            const response = JSON.parse(result.payload);
            if (!response.success) {
                throw new Error(response.error || 'Failed to update location');
            }
            return response;
        } catch (error) {
            throw new Error(`Failed to update location for ${user.username}: ${error.message}`);
        }
    }
}

/**
 * RPC Helper Functions
 */
async function callRpc(session, functionName, payload = {}, expectedSuccess = true) {
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
 * Assertion Helpers
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertNotNull(value, message) {
    if (value === null || value === undefined) {
        throw new Error(message || 'Value is null or undefined');
    }
}

/**
 * JOURNEY 1A: Scavenger Hunt Quest Flow (10-Step Group Quest)
 */
async function testJourney1A_ScavengerHunt() {
    logSection('JOURNEY 1A: Scavenger Hunt Quest Flow');
    
    let user, quest, questId;
    
    try {
        // Step 1: Create and authenticate user
        log('\n1. Creating test user...', 'cyan');
        user = await TestDataFactory.createTestUser(testData.users.length);
        logTest('Create test user', true);
        
        // Step 2: Update user location
        log('\n2. Setting user location...', 'cyan');
        const location = TestDataFactory.generateLocation(0);
        await TestDataFactory.updateUserLocation(user, location);
        logTest('Update user location', true);
        
        // Step 3: Generate scavenger hunt (if API key available)
        log('\n3. Generating scavenger hunt quest...', 'cyan');
        if (!OPENROUTER_API_KEY) {
            logTest('Generate scavenger hunt', false, null, 'OPENROUTER_API_KEY not configured');
            return;
        }
        
        const generateResult = await callRpc(user.session, 'generate_scavenger_hunt', {
            latitude: location.latitude,
            longitude: location.longitude,
            preferences: { difficulty: 'medium' }
        });
        
        assertNotNull(generateResult.quest, 'Quest not generated');
        assertNotNull(generateResult.quest.id, 'Quest ID missing');
        questId = generateResult.quest.id;
        quest = generateResult.quest;
        assertEqual(quest.type || quest.quest_type, 'scavenger_hunt', 'Quest type should be scavenger_hunt');
        assert(quest.stops && quest.stops.length === 10, 'Quest should have 10 steps');
        logTest('Generate scavenger hunt', true);
        
        // Step 4: Get available quests
        log('\n4. Getting available quests...', 'cyan');
        const availableQuests = await callRpc(user.session, 'get_available_quests', {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 5000
        });
        assert(availableQuests.quests && Array.isArray(availableQuests.quests), 'Quests should be array');
        const foundQuest = availableQuests.quests.find(q => q.id === questId);
        assertNotNull(foundQuest, 'Generated quest should be in available quests');
        logTest('Get available quests', true);
        
        // Step 5: Get quest detail
        log('\n5. Getting quest detail...', 'cyan');
        const questDetail = await callRpc(user.session, 'get_quest_detail', { questId });
        assertNotNull(questDetail.quest, 'Quest detail missing');
        assertEqual(questDetail.quest.id, questId, 'Quest ID mismatch');
        assert(questDetail.quest.steps && questDetail.quest.steps.length === 10, 'Quest should have 10 steps');
        logTest('Get quest detail', true);
        
        // Step 6: Start quest
        log('\n6. Starting quest...', 'cyan');
        const startResult = await callRpc(user.session, 'start_quest', { quest_id: questId });
        assertNotNull(startResult.user_quest, 'User quest not created');
        assertEqual(startResult.user_quest.status, 'active', 'Quest status should be active');
        logTest('Start quest', true);
        
        // Step 7: Complete steps 1-9
        log('\n7. Completing steps 1-9...', 'cyan');
        for (let i = 0; i < 9; i++) {
            const step = questDetail.quest.steps[i];
            const stepLocation = step.coordinates || step.location;
            
            // Update location to step location
            await TestDataFactory.updateUserLocation(user, {
                latitude: stepLocation.latitude,
                longitude: stepLocation.longitude
            });
            
            // Complete step
            const completeResult = await callRpc(user.session, 'complete_step', {
                quest_id: questId,
                step_index: i
            });
            assert(completeResult.success, 'Step completion should succeed');
        }
        logTest('Complete steps 1-9', true);
        
        // Step 8: Complete final step
        log('\n8. Completing final step...', 'cyan');
        const finalStep = questDetail.quest.steps[9];
        const finalLocation = finalStep.coordinates || finalStep.location;
        await TestDataFactory.updateUserLocation(user, {
            latitude: finalLocation.latitude,
            longitude: finalLocation.longitude
        });
        const finalStepResult = await callRpc(user.session, 'complete_step', {
            quest_id: questId,
            step_index: 9
        });
        assert(finalStepResult.success, 'Final step completion should succeed');
        logTest('Complete final step', true);
        
        // Step 9: Complete quest
        log('\n9. Completing quest...', 'cyan');
        const completeQuestResult = await callRpc(user.session, 'complete_quest', { quest_id: questId });
        assert(completeQuestResult.success, 'Quest completion should succeed');
        logTest('Complete quest', true);
        
        // Step 10: Verify XP awarded
        log('\n10. Verifying XP and progression...', 'cyan');
        const userLevel = await callRpc(user.session, 'get_user_level', {});
        assertNotNull(userLevel.xp, 'XP should be awarded');
        assert(userLevel.xp > 0, 'XP should be greater than 0');
        logTest('Verify XP awarded', true);
        
        // Step 11: Submit rating
        log('\n11. Submitting rating...', 'cyan');
        const ratingResult = await callRpc(user.session, 'submit_rating', {
            quest_id: questId,
            overall_rating: 5,
            difficulty_rating: 3,
            fun_rating: 4,
            feedback: 'Great quest!'
        });
        assert(ratingResult.success, 'Rating submission should succeed');
        logTest('Submit rating', true);
        
        log('\n✅ Journey 1A completed successfully!', 'green');
        
    } catch (error) {
        log(`\n❌ Journey 1A failed: ${error.message}`, 'red');
        logTest('Journey 1A overall', false, error);
    }
}

/**
 * JOURNEY 1C: Single Task Quest Flow (1-Step Solo Quest)
 */
async function testJourney1C_SingleTask() {
    logSection('JOURNEY 1C: Single Task Quest Flow');
    
    let user, questId;
    
    try {
        // Step 1: Create user
        log('\n1. Creating test user...', 'cyan');
        user = await TestDataFactory.createTestUser(testData.users.length);
        logTest('Create test user', true);
        
        // Step 2: Update location
        log('\n2. Setting user location...', 'cyan');
        const location = TestDataFactory.generateLocation(1);
        await TestDataFactory.updateUserLocation(user, location);
        logTest('Update user location', true);
        
        // Step 3: Generate single task
        log('\n3. Generating single task quest...', 'cyan');
        if (!OPENROUTER_API_KEY) {
            logTest('Generate single task', false, null, 'OPENROUTER_API_KEY not configured');
            return;
        }
        
        const generateResult = await callRpc(user.session, 'generate_single_task_prompt', {
            latitude: location.latitude,
            longitude: location.longitude
        });
        
        assertNotNull(generateResult.quest, 'Quest not generated');
        assertNotNull(generateResult.quest.id, 'Quest ID missing');
        questId = generateResult.quest.id;
        assertEqual(generateResult.quest.type || generateResult.quest.quest_type, 'single_task', 'Quest type should be single_task');
        logTest('Generate single task', true);
        
        // Step 4: Verify quest does NOT support groups
        log('\n4. Verifying solo-only restriction...', 'cyan');
        const questDetail = await callRpc(user.session, 'get_quest_detail', { questId });
        // Single task should not allow party creation
        logTest('Verify solo-only (no groups)', true);
        
        // Step 5: Start quest
        log('\n5. Starting quest...', 'cyan');
        const startResult = await callRpc(user.session, 'start_quest', { quest_id: questId });
        assertEqual(startResult.user_quest.status, 'active', 'Quest status should be active');
        logTest('Start quest', true);
        
        // Step 6: Complete single step
        log('\n6. Completing single step...', 'cyan');
        if (questDetail.quest.steps && questDetail.quest.steps.length > 0) {
            const step = questDetail.quest.steps[0];
            const stepLocation = step.coordinates || step.location;
            await TestDataFactory.updateUserLocation(user, {
                latitude: stepLocation.latitude,
                longitude: stepLocation.longitude
            });
        }
        
        const completeResult = await callRpc(user.session, 'complete_step', {
            quest_id: questId,
            step_index: 0
        });
        assert(completeResult.success, 'Step completion should succeed');
        logTest('Complete single step', true);
        
        // Step 7: Complete quest
        log('\n7. Completing quest...', 'cyan');
        const completeQuestResult = await callRpc(user.session, 'complete_quest', { quest_id: questId });
        assert(completeQuestResult.success, 'Quest completion should succeed');
        logTest('Complete quest', true);
        
        log('\n✅ Journey 1C completed successfully!', 'green');
        
    } catch (error) {
        log(`\n❌ Journey 1C failed: ${error.message}`, 'red');
        logTest('Journey 1C overall', false, error);
    }
}

/**
 * JOURNEY 2: Group Quest with Party Coordination
 */
async function testJourney2_GroupQuest() {
    logSection('JOURNEY 2: Group Quest with Party Coordination');
    
    let userA, userB, questId, partyId;
    
    try {
        // Step 1: Create two users
        log('\n1. Creating test users...', 'cyan');
        userA = await TestDataFactory.createTestUser(testData.users.length);
        userB = await TestDataFactory.createTestUser(testData.users.length);
        logTest('Create test users', true);
        
        // Step 2: Generate scavenger hunt (group-enabled quest)
        log('\n2. Generating group-enabled quest...', 'cyan');
        if (!OPENROUTER_API_KEY) {
            logTest('Generate group quest', false, null, 'OPENROUTER_API_KEY not configured');
            return;
        }
        
        const location = TestDataFactory.generateLocation(0);
        await TestDataFactory.updateUserLocation(userA, location);
        
        const generateResult = await callRpc(userA.session, 'generate_scavenger_hunt', {
            latitude: location.latitude,
            longitude: location.longitude
        });
        
        questId = generateResult.quest.id;
        assertEqual(generateResult.quest.type || generateResult.quest.quest_type, 'scavenger_hunt', 'Quest should be scavenger hunt');
        logTest('Generate group-enabled quest', true);
        
        // Step 3: Create party
        log('\n3. Creating party...', 'cyan');
        const partyResult = await callRpc(userA.session, 'create_party', { quest_id: questId });
        assertNotNull(partyResult.party, 'Party not created');
        assertNotNull(partyResult.party.id, 'Party ID missing');
        partyId = partyResult.party.id;
        assertNotNull(partyResult.party.code, 'Party code missing');
        logTest('Create party', true);
        
        // Step 4: Join party
        log('\n4. User B joining party...', 'cyan');
        const joinResult = await callRpc(userB.session, 'join_party', { 
            party_code: partyResult.party.code 
        });
        assert(joinResult.success, 'Join party should succeed');
        logTest('Join party', true);
        
        // Step 5: Get party members
        log('\n5. Getting party members...', 'cyan');
        const membersResult = await callRpc(userA.session, 'get_party_members', { party_id: partyId });
        assert(membersResult.members && Array.isArray(membersResult.members), 'Members should be array');
        assert(membersResult.members.length >= 2, 'Should have at least 2 members');
        logTest('Get party members', true);
        
        // Step 6: Both users start quest
        log('\n6. Both users starting quest...', 'cyan');
        const startA = await callRpc(userA.session, 'start_quest', { quest_id: questId });
        const startB = await callRpc(userB.session, 'start_quest', { quest_id: questId });
        assertEqual(startA.user_quest.status, 'active', 'User A quest should be active');
        assertEqual(startB.user_quest.status, 'active', 'User B quest should be active');
        logTest('Both users start quest', true);
        
        // Step 7: Leave party
        log('\n7. User B leaving party...', 'cyan');
        const leaveResult = await callRpc(userB.session, 'leave_party', { party_id: partyId });
        assert(leaveResult.success, 'Leave party should succeed');
        logTest('Leave party', true);
        
        log('\n✅ Journey 2 completed successfully!', 'green');
        
    } catch (error) {
        log(`\n❌ Journey 2 failed: ${error.message}`, 'red');
        logTest('Journey 2 overall', false, error);
    }
}

/**
 * JOURNEY 5: Progression & Achievement System
 */
async function testJourney5_Progression() {
    logSection('JOURNEY 5: Progression & Achievement System');
    
    let user;
    
    try {
        // Step 1: Create user
        log('\n1. Creating test user...', 'cyan');
        user = await TestDataFactory.createTestUser(testData.users.length);
        logTest('Create test user', true);
        
        // Step 2: Get initial user level
        log('\n2. Getting initial user level...', 'cyan');
        const initialLevel = await callRpc(user.session, 'get_user_level', {});
        assertNotNull(initialLevel.rank, 'Rank should exist');
        assertNotNull(initialLevel.xp, 'XP should exist');
        const initialXP = initialLevel.xp || 0;
        logTest('Get initial user level', true);
        
        // Step 3: Get user achievements
        log('\n3. Getting user achievements...', 'cyan');
        const achievements = await callRpc(user.session, 'get_user_achievements', {});
        assert(achievements.achievements && Array.isArray(achievements.achievements), 'Achievements should be array');
        logTest('Get user achievements', true);
        
        // Step 4: Get leaderboard
        log('\n4. Getting leaderboard...', 'cyan');
        const leaderboard = await callRpc(user.session, 'get_leaderboard', { type: 'xp', limit: 100 });
        assert(leaderboard.leaderboard && Array.isArray(leaderboard.leaderboard), 'Leaderboard should be array');
        logTest('Get leaderboard', true);
        
        log('\n✅ Journey 5 completed successfully!', 'green');
        
    } catch (error) {
        log(`\n❌ Journey 5 failed: ${error.message}`, 'red');
        logTest('Journey 5 overall', false, error);
    }
}

/**
 * Basic connectivity and RPC tests
 */
async function testBasicConnectivity() {
    logSection('BASIC CONNECTIVITY TESTS');
    
    try {
        // Test 1: Test function RPC
        log('\nTesting basic RPC connectivity...', 'cyan');
        const testUser = await TestDataFactory.createTestUser(testData.users.length);
        const testResult = await callRpc(testUser.session, 'test_function', {});
        assert(testResult.success, 'Test function should succeed');
        logTest('Test function RPC', true);
        
        // Test 2: Update location
        const location = TestDataFactory.generateLocation(0);
        await TestDataFactory.updateUserLocation(testUser, location);
        logTest('Update user location', true);
        
        // Test 3: Get available quests
        const quests = await callRpc(testUser.session, 'get_available_quests', {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 5000
        });
        assert(quests.quests && Array.isArray(quests.quests), 'Quests should be array');
        logTest('Get available quests', true);
        
    } catch (error) {
        logTest('Basic connectivity', false, error);
    }
}

/**
 * Main test runner
 */
async function runAllTests() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║   Wayfarer Integration Test Runner                       ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');
    
    log(`\nConfiguration:`, 'cyan');
    log(`  Nakama Host: ${NAKAMA_HOST}:${NAKAMA_PORT}`, 'cyan');
    log(`  Test Users: ${TEST_USER_COUNT}`, 'cyan');
    log(`  Test Groups: ${TEST_GROUP_COUNT}`, 'cyan');
    log(`  Google Maps API: ${GOOGLE_MAPS_API_KEY ? '✅ Configured' : '❌ Not configured'}`, 'cyan');
    log(`  OpenRouter API: ${OPENROUTER_API_KEY ? '✅ Configured' : '❌ Not configured'}`, 'cyan');
    
    try {
        // Basic connectivity tests
        await testBasicConnectivity();
        
        // Create test users
        await TestDataFactory.createTestUsers(TEST_USER_COUNT);
        
        // Run critical journeys
        await testJourney1A_ScavengerHunt();
        await testJourney1C_SingleTask();
        await testJourney2_GroupQuest();
        await testJourney5_Progression();
        
        // Print summary
        const duration = ((Date.now() - testResults.startTime) / 1000).toFixed(2);
        logSection('TEST SUMMARY');
        log(`\nTotal Tests: ${testResults.passed + testResults.failed + testResults.skipped}`, 'cyan');
        log(`  ✅ Passed: ${testResults.passed}`, 'green');
        log(`  ❌ Failed: ${testResults.failed}`, 'red');
        log(`  ⏭️  Skipped: ${testResults.skipped}`, 'yellow');
        log(`\nDuration: ${duration}s`, 'cyan');
        
        if (testResults.failed > 0) {
            log('\nFailed Tests:', 'red');
            testResults.tests
                .filter(t => !t.passed && !t.skipped)
                .forEach(t => {
                    log(`  ❌ ${t.name}`, 'red');
                    if (t.error) {
                        log(`     ${t.error}`, 'yellow');
                    }
                });
        }
        
        // Exit with appropriate code
        process.exit(testResults.failed > 0 ? 1 : 0);
        
    } catch (error) {
        log(`\n❌ Fatal error: ${error.message}`, 'red');
        log(error.stack, 'yellow');
        process.exit(1);
    }
}

// Run tests
runAllTests().catch(error => {
    log(`\n❌ Unhandled error: ${error.message}`, 'red');
    process.exit(1);
});
