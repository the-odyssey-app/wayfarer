#!/usr/bin/env node

/**
 * Audio Experiences Tests
 * Tests for audio experience features
 */

const { RpcHelper, Assert, ErrorHelper } = require('../test-helpers');
const { UserFactory, LocationHelper } = require('../test-factories');

/**
 * Test: Get Audio Experiences
 */
async function testGetAudioExperiences() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    try {
        const result = await RpcHelper.callSuccess(user.session, 'get_audio_experiences', {
            latitude: location.latitude,
            longitude: location.longitude,
            maxDistanceKm: 5
        });
        Assert.success(result, 'Should return success');
        Assert.isArray(result.experiences, 'Experiences should be array');
        
        return { name: 'Get Audio Experiences', passed: true };
    } catch (error) {
        return { name: 'Get Audio Experiences', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Purchase Audio
 */
async function testPurchaseAudio() {
    const user = await UserFactory.create(0);
    
    try {
        const location = LocationHelper.generateLocation(0);
        await UserFactory.updateLocation(user, location);
        
        // First get available audio experiences
        const experiencesResult = await RpcHelper.callSuccess(user.session, 'get_audio_experiences', {
            latitude: location.latitude,
            longitude: location.longitude,
            maxDistanceKm: 5
        });
        
        if (!experiencesResult.experiences || experiencesResult.experiences.length === 0) {
            return { name: 'Purchase Audio', passed: false, skipped: true, reason: 'No audio experiences available' };
        }
        
        const audioId = experiencesResult.experiences[0].id;
        
        const result = await RpcHelper.callSuccess(user.session, 'purchase_audio', {
            audioExperienceId: audioId
        });
        
        Assert.success(result, 'Purchase audio should succeed');
        
        return { name: 'Purchase Audio', passed: true };
    } catch (error) {
        return { name: 'Purchase Audio', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Rate Audio
 */
async function testRateAudio() {
    const user = await UserFactory.create(0);
    
    try {
        const location = LocationHelper.generateLocation(0);
        await UserFactory.updateLocation(user, location);
        
        // Get audio experiences
        const experiencesResult = await RpcHelper.callSuccess(user.session, 'get_audio_experiences', {
            latitude: location.latitude,
            longitude: location.longitude,
            maxDistanceKm: 5
        });
        
        if (!experiencesResult.experiences || experiencesResult.experiences.length === 0) {
            return { name: 'Rate Audio', passed: false, skipped: true, reason: 'No audio experiences available' };
        }
        
        const audioId = experiencesResult.experiences[0].id;
        
        const result = await RpcHelper.callSuccess(user.session, 'rate_audio', {
            audioExperienceId: audioId,
            rating: 5,
            reviewText: 'Great audio experience!'
        });
        
        Assert.success(result, 'Rate audio should succeed');
        
        return { name: 'Rate Audio', passed: true };
    } catch (error) {
        return { name: 'Rate Audio', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Toggle Audio Favorite
 */
async function testToggleAudioFavorite() {
    const user = await UserFactory.create(0);
    
    try {
        const location = LocationHelper.generateLocation(0);
        await UserFactory.updateLocation(user, location);
        
        // Get audio experiences
        const experiencesResult = await RpcHelper.callSuccess(user.session, 'get_audio_experiences', {
            latitude: location.latitude,
            longitude: location.longitude,
            maxDistanceKm: 5
        });
        
        if (!experiencesResult.experiences || experiencesResult.experiences.length === 0) {
            return { name: 'Toggle Audio Favorite', passed: false, skipped: true, reason: 'No audio experiences available' };
        }
        
        const audioId = experiencesResult.experiences[0].id;
        
        const result = await RpcHelper.callSuccess(user.session, 'toggle_audio_favorite', {
            audioExperienceId: audioId
        });
        
        Assert.success(result, 'Toggle favorite should succeed');
        
        return { name: 'Toggle Audio Favorite', passed: true };
    } catch (error) {
        return { name: 'Toggle Audio Favorite', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Update Audio Progress
 */
async function testUpdateAudioProgress() {
    const user = await UserFactory.create(0);
    
    try {
        const location = LocationHelper.generateLocation(0);
        await UserFactory.updateLocation(user, location);
        
        // Get audio experiences
        const experiencesResult = await RpcHelper.callSuccess(user.session, 'get_audio_experiences', {
            latitude: location.latitude,
            longitude: location.longitude,
            maxDistanceKm: 5
        });
        
        if (!experiencesResult.experiences || experiencesResult.experiences.length === 0) {
            return { name: 'Update Audio Progress', passed: false, skipped: true, reason: 'No audio experiences available' };
        }
        
        const audioId = experiencesResult.experiences[0].id;
        
        const result = await RpcHelper.callSuccess(user.session, 'update_audio_progress', {
            audioExperienceId: audioId,
            currentPositionSeconds: 50,
            completed: false
        });
        
        Assert.success(result, 'Update progress should succeed');
        
        return { name: 'Update Audio Progress', passed: true };
    } catch (error) {
        return { name: 'Update Audio Progress', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Get User Audio Collection
 */
async function testGetUserAudioCollection() {
    const user = await UserFactory.create(0);
    
    try {
        const result = await RpcHelper.callSuccess(user.session, 'get_user_audio_collection', {});
        Assert.success(result, 'Should return success');
        // Response has favorites and progress arrays, not collection
        Assert.isArray(result.favorites, 'Favorites should be array');
        Assert.isArray(result.progress, 'Progress should be array');
        
        return { name: 'Get User Audio Collection', passed: true };
    } catch (error) {
        return { name: 'Get User Audio Collection', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Run all audio system tests
 */
async function runAudioSystemTests() {
    const tests = [
        testGetAudioExperiences,
        testPurchaseAudio,
        testRateAudio,
        testToggleAudioFavorite,
        testUpdateAudioProgress,
        testGetUserAudioCollection
    ];
    
    const results = [];
    for (const test of tests) {
        const result = await test();
        results.push(result);
    }
    
    return results;
}

module.exports = {
    runAudioSystemTests,
    testGetAudioExperiences,
    testPurchaseAudio,
    testRateAudio,
    testToggleAudioFavorite,
    testUpdateAudioProgress,
    testGetUserAudioCollection
};

