#!/usr/bin/env node

/**
 * Social/Matching Tests
 * Tests for user matching and social features
 */

const { RpcHelper, Assert, ErrorHelper } = require('../test-helpers');
const { UserFactory, LocationHelper } = require('../test-factories');

/**
 * Test: Find Matches
 */
async function testFindMatches() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    try {
        const result = await RpcHelper.callSuccess(user.session, 'find_matches', {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 5,
            preferences: {}
        });
        
        Assert.success(result, 'Should return success');
        Assert.isArray(result.matches, 'Matches should be array');
        
        return { name: 'Find Matches', passed: true };
    } catch (error) {
        return { name: 'Find Matches', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Create Match Request
 */
async function testCreateMatchRequest() {
    const userA = await UserFactory.create(0);
    const userB = await UserFactory.create(1);
    
    try {
        const result = await RpcHelper.callSuccess(userA.session, 'create_match_request', {
            targetUserId: userB.id,
            message: 'Hello, would you like to team up?'
        });
        
        Assert.success(result, 'Create match request should succeed');
        Assert.notNull(result.requestId, 'Request ID should be returned');
        
        return { name: 'Create Match Request', passed: true };
    } catch (error) {
        return { name: 'Create Match Request', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Record Activity Pattern
 */
async function testRecordActivityPattern() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    try {
        const result = await RpcHelper.callSuccess(user.session, 'record_activity_pattern', {
            activityType: 'quest',
            location: {
                latitude: location.latitude,
                longitude: location.longitude
            },
            timestamp: new Date().toISOString()
        });
        
        Assert.success(result, 'Record activity pattern should succeed');
        
        return { name: 'Record Activity Pattern', passed: true };
    } catch (error) {
        return { name: 'Record Activity Pattern', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Update User Preferences
 */
async function testUpdateUserPreferences() {
    const user = await UserFactory.create(0);
    
    try {
        const result = await RpcHelper.callSuccess(user.session, 'update_user_preferences', {
            questDifficulty: 'medium',
            questTypes: ['scavenger_hunt', 'mystery'],
            socialSettings: {
                allowMatchRequests: true,
                showLocation: true
            }
        });
        
        Assert.success(result, 'Update preferences should succeed');
        
        return { name: 'Update User Preferences', passed: true };
    } catch (error) {
        return { name: 'Update User Preferences', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Run all social/matching tests
 */
async function runSocialMatchingTests() {
    const tests = [
        testFindMatches,
        testCreateMatchRequest,
        testRecordActivityPattern,
        testUpdateUserPreferences
    ];
    
    const results = [];
    for (const test of tests) {
        const result = await test();
        results.push(result);
    }
    
    return results;
}

module.exports = {
    runSocialMatchingTests,
    testFindMatches,
    testCreateMatchRequest,
    testRecordActivityPattern,
    testUpdateUserPreferences
};

