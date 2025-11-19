#!/usr/bin/env node

/**
 * Party/Group System Tests
 * Tests for party creation, voting, and group coordination
 */

const { RpcHelper, Assert, ErrorHelper } = require('../test-helpers');
const { UserFactory, QuestFactory, PartyFactory, LocationHelper } = require('../test-factories');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Test: Create Party
 */
async function testCreateParty() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Create Party', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        const party = await PartyFactory.create(user, quest.id);
        
        Assert.notNull(party, 'Party should be created');
        Assert.notNull(party.id, 'Party should have ID');
        Assert.notNull(party.code, 'Party should have code');
        
        return { name: 'Create Party', passed: true };
    } catch (error) {
        return { name: 'Create Party', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Join Party
 */
async function testJoinParty() {
    const userA = await UserFactory.create(0);
    const userB = await UserFactory.create(1);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(userA, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Join Party', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(userA, location);
        const party = await PartyFactory.create(userA, quest.id);
        const result = await PartyFactory.join(userB, party.code);
        
        Assert.success(result, 'Join party should succeed');
        
        return { name: 'Join Party', passed: true };
    } catch (error) {
        return { name: 'Join Party', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Get Party Members
 */
async function testGetPartyMembers() {
    const userA = await UserFactory.create(0);
    const userB = await UserFactory.create(1);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(userA, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Get Party Members', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(userA, location);
        const party = await PartyFactory.create(userA, quest.id);
        await PartyFactory.join(userB, party.code);
        
        const members = await PartyFactory.getMembers(userA, party.id);
        Assert.isArray(members, 'Members should be array');
        Assert.greaterThanOrEqual(members.length, 2, 'Should have at least 2 members');
        
        return { name: 'Get Party Members', passed: true };
    } catch (error) {
        return { name: 'Get Party Members', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Leave Party
 */
async function testLeaveParty() {
    const userA = await UserFactory.create(0);
    const userB = await UserFactory.create(1);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(userA, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Leave Party', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(userA, location);
        const party = await PartyFactory.create(userA, quest.id);
        await PartyFactory.join(userB, party.code);
        const result = await PartyFactory.leave(userB, party.id);
        
        Assert.success(result, 'Leave party should succeed');
        
        return { name: 'Leave Party', passed: true };
    } catch (error) {
        return { name: 'Leave Party', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Create Party Vote
 */
async function testCreatePartyVote() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Create Party Vote', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        const party = await PartyFactory.create(user, quest.id);
        
        const voteId = await PartyFactory.createVote(user, party.id, {
            voteType: 'decision',
            title: 'Test Vote',
            description: 'Test vote description',
            options: ['Option 1', 'Option 2'],
            expiresInMinutes: 30
        });
        
        Assert.notNull(voteId, 'Vote ID should be returned');
        
        return { name: 'Create Party Vote', passed: true };
    } catch (error) {
        return { name: 'Create Party Vote', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Cast Vote
 */
async function testCastVote() {
    const userA = await UserFactory.create(0);
    const userB = await UserFactory.create(1);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(userA, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Cast Vote', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(userA, location);
        const party = await PartyFactory.create(userA, quest.id);
        await PartyFactory.join(userB, party.code);
        
        const voteId = await PartyFactory.createVote(userA, party.id, {
            options: ['Yes', 'No']
        });
        
        const result = await PartyFactory.castVote(userB, voteId, 0);
        Assert.success(result, 'Cast vote should succeed');
        
        return { name: 'Cast Vote', passed: true };
    } catch (error) {
        return { name: 'Cast Vote', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Get Vote Results
 */
async function testGetVoteResults() {
    const userA = await UserFactory.create(0);
    const userB = await UserFactory.create(1);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(userA, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Get Vote Results', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(userA, location);
        const party = await PartyFactory.create(userA, quest.id);
        await PartyFactory.join(userB, party.code);
        
        const voteId = await PartyFactory.createVote(userA, party.id, {
            options: ['Yes', 'No']
        });
        
        await PartyFactory.castVote(userA, voteId, 0);
        await PartyFactory.castVote(userB, voteId, 1);
        
        const result = await RpcHelper.callSuccess(userA.session, 'get_vote_results', {
            voteId: voteId
        });
        
        Assert.success(result, 'Should return success');
        Assert.notNull(result.results, 'Results should exist');
        Assert.isArray(result.results.options, 'Options should be array');
        
        return { name: 'Get Vote Results', passed: true };
    } catch (error) {
        return { name: 'Get Vote Results', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Run all party system tests
 */
async function runPartySystemTests() {
    const tests = [
        testCreateParty,
        testJoinParty,
        testGetPartyMembers,
        testLeaveParty,
        testCreatePartyVote,
        testCastVote,
        testGetVoteResults
    ];
    
    const results = [];
    for (const test of tests) {
        const result = await test();
        results.push(result);
    }
    
    return results;
}

module.exports = {
    runPartySystemTests,
    testCreateParty,
    testJoinParty,
    testGetPartyMembers,
    testLeaveParty,
    testCreatePartyVote,
    testCastVote,
    testGetVoteResults
};

