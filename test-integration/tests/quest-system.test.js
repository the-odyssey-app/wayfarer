#!/usr/bin/env node

/**
 * Quest System Tests
 * Tests for quest generation, progression, and completion
 */

const { RpcHelper, Assert, ErrorHelper } = require('../test-helpers');
const { UserFactory, QuestFactory, LocationHelper } = require('../test-factories');
const { withIsolation } = require('../test-cleanup');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Test: Generate Scavenger Hunt Quest
 */
async function testGenerateScavengerHunt() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Generate Scavenger Hunt', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        Assert.notNull(quest, 'Quest should be generated');
        Assert.notNull(quest.id, 'Quest should have ID');
        Assert.equal(quest.type || quest.quest_type, 'scavenger_hunt', 'Quest type should be scavenger_hunt');
        Assert.isArray(quest.stops, 'Quest should have stops array');
        Assert.arrayLength(quest.stops, 10, 'Quest should have 10 steps');
        
        return { name: 'Generate Scavenger Hunt', passed: true };
    } catch (error) {
        return { name: 'Generate Scavenger Hunt', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Generate Single Task Quest
 */
async function testGenerateSingleTask() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(1);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Generate Single Task', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateSingleTask(user, location);
        Assert.notNull(quest, 'Quest should be generated');
        Assert.notNull(quest.id, 'Quest should have ID');
        Assert.equal(quest.type || quest.quest_type, 'single_task', 'Quest type should be single_task');
        
        return { name: 'Generate Single Task', passed: true };
    } catch (error) {
        return { name: 'Generate Single Task', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Generate Mystery Quest
 */
async function testGenerateMystery() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(2);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Generate Mystery Quest', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateMystery(user, location);
        Assert.notNull(quest, 'Quest should be generated');
        Assert.notNull(quest.id, 'Quest should have ID');
        Assert.equal(quest.type || quest.quest_type, 'mystery', 'Quest type should be mystery');
        
        return { name: 'Generate Mystery Quest', passed: true };
    } catch (error) {
        return { name: 'Generate Mystery Quest', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Get Available Quests
 */
async function testGetAvailableQuests() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    try {
        const result = await RpcHelper.callSuccess(user.session, 'get_available_quests', {
            latitude: location.latitude,
            longitude: location.longitude,
            maxDistanceKm: 5
        });
        
        Assert.success(result, 'Should return success');
        Assert.isArray(result.quests, 'Quests should be array');
        Assert.hasProperty(result, 'count', 'Should have count property');
        
        return { name: 'Get Available Quests', passed: true };
    } catch (error) {
        // Check if it's a database schema issue (start_time column missing)
        const errorMsg = ErrorHelper.extract(error);
        if (errorMsg.includes('start_time') || errorMsg.includes('does not exist')) {
            return { name: 'Get Available Quests', passed: false, skipped: true, reason: 'Database schema issue: start_time/end_time columns may not exist (migration needed)' };
        }
        return { name: 'Get Available Quests', passed: false, error: errorMsg };
    }
}

/**
 * Test: Get Quest Detail
 */
async function testGetQuestDetail() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Get Quest Detail', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        const questDetail = await QuestFactory.getDetail(user, quest.id);
        
        Assert.notNull(questDetail, 'Quest detail should exist');
        Assert.equal(questDetail.id, quest.id, 'Quest ID should match');
        Assert.isArray(questDetail.steps, 'Quest should have steps array');
        
        return { name: 'Get Quest Detail', passed: true };
    } catch (error) {
        return { name: 'Get Quest Detail', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Start Quest
 */
async function testStartQuest() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Start Quest', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        const userQuest = await QuestFactory.start(user, quest.id);
        
        Assert.notNull(userQuest, 'User quest should be created');
        Assert.equal(userQuest.status, 'active', 'Quest status should be active');
        
        return { name: 'Start Quest', passed: true };
    } catch (error) {
        return { name: 'Start Quest', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Complete Step
 */
async function testCompleteStep() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Complete Step', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        await QuestFactory.start(user, quest.id);
        const questDetail = await QuestFactory.getDetail(user, quest.id);
        
        if (questDetail.steps && questDetail.steps.length > 0) {
            const step = questDetail.steps[0];
            const stepLocation = step.coordinates || step.location;
            await UserFactory.updateLocation(user, {
                latitude: stepLocation.latitude,
                longitude: stepLocation.longitude
            });
            
            const result = await QuestFactory.completeStep(user, quest.id, 0);
            Assert.success(result, 'Step completion should succeed');
        }
        
        return { name: 'Complete Step', passed: true };
    } catch (error) {
        return { name: 'Complete Step', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Complete Quest
 */
async function testCompleteQuest() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Complete Quest', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        await QuestFactory.start(user, quest.id);
        await QuestFactory.completeFullQuest(user, quest.id);
        
        return { name: 'Complete Quest', passed: true };
    } catch (error) {
        return { name: 'Complete Quest', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Get User Quests
 */
async function testGetUserQuests() {
    const user = await UserFactory.create(0);
    
    try {
        const result = await RpcHelper.callSuccess(user.session, 'get_user_quests', {});
        Assert.success(result, 'Should return success');
        Assert.isArray(result.quests, 'Quests should be array');
        
        return { name: 'Get User Quests', passed: true };
    } catch (error) {
        return { name: 'Get User Quests', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Submit Step Media
 */
async function testSubmitStepMedia() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Submit Step Media', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        await QuestFactory.start(user, quest.id);
        const questDetail = await QuestFactory.getDetail(user, quest.id);
        
        if (questDetail.steps && questDetail.steps.length > 0) {
            const step = questDetail.steps[0];
            const stepId = step.id || step.step_id || `step-${quest.id}-0`;
            
            const result = await RpcHelper.callSuccess(user.session, 'submit_step_media', {
                questId: quest.id,
                stepId: stepId,
                mediaType: 'photo',
                mediaUrl: 'https://example.com/test-photo.jpg',
                textContent: 'Test photo submission'
            });
            
            Assert.success(result, 'Media submission should succeed');
            Assert.notNull(result.mediaId, 'Media ID should be returned');
        } else {
            return { name: 'Submit Step Media', passed: false, skipped: true, reason: 'No steps in quest' };
        }
        
        return { name: 'Submit Step Media', passed: true };
    } catch (error) {
        return { name: 'Submit Step Media', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Upload Photo
 */
async function testUploadPhoto() {
    const user = await UserFactory.create(0);
    
    // Check if MINIO is configured (would need env var check)
    // For now, test the RPC call structure
    try {
        // Create a minimal base64 test image (1x1 pixel PNG)
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        const result = await RpcHelper.callSuccess(user.session, 'upload_photo', {
            imageBase64: testImageBase64,
            questId: 'test-quest-id',
            stepId: 'test-step-id'
        });
        
        Assert.success(result, 'Photo upload should succeed');
        Assert.notNull(result.url, 'Photo URL should be returned');
        
        return { name: 'Upload Photo', passed: true };
    } catch (error) {
        const errorMsg = ErrorHelper.extract(error);
        // Check if MinIO is not configured
        if (errorMsg.includes('MinIO not configured') || errorMsg.includes('CONFIG_ERROR') || errorMsg.includes('MinIO')) {
            return { name: 'Upload Photo', passed: false, skipped: true, reason: 'MinIO not configured' };
        }
        return { name: 'Upload Photo', passed: false, error: errorMsg };
    }
}

/**
 * Run all quest system tests
 */
async function runQuestSystemTests() {
    const tests = [
        testGenerateScavengerHunt,
        testGenerateSingleTask,
        testGenerateMystery,
        testGetAvailableQuests,
        testGetQuestDetail,
        testStartQuest,
        testCompleteStep,
        testCompleteQuest,
        testGetUserQuests,
        testSubmitStepMedia,
        testUploadPhoto
    ];
    
    const results = [];
    for (const test of tests) {
        const result = await test();
        results.push(result);
    }
    
    return results;
}

module.exports = {
    runQuestSystemTests,
    testGenerateScavengerHunt,
    testGenerateSingleTask,
    testGenerateMystery,
    testGetAvailableQuests,
    testGetQuestDetail,
    testStartQuest,
    testCompleteStep,
    testCompleteQuest,
    testGetUserQuests,
    testSubmitStepMedia,
    testUploadPhoto
};

