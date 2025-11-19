#!/usr/bin/env node

/**
 * Event System Tests
 * Tests for event creation, joining, and participation
 */

const { RpcHelper, Assert, ErrorHelper } = require('../test-helpers');
const { UserFactory, EventFactory, LocationHelper } = require('../test-factories');

/**
 * Test: Create Event
 */
async function testCreateEvent() {
    const user = await UserFactory.create(0);
    
    try {
        const startTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
        const endTime = new Date(Date.now() + 7200000).toISOString(); // 2 hours from now
        
        const event = await EventFactory.create(user, {
            title: 'Test Event',
            description: 'Test event description',
            startDate: startTime,
            endDate: endTime
        });
        
        Assert.notNull(event, 'Event should be created');
        Assert.notNull(event.id, 'Event should have ID');
        
        return { name: 'Create Event', passed: true };
    } catch (error) {
        return { name: 'Create Event', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Join Event
 */
async function testJoinEvent() {
    const userA = await UserFactory.create(0);
    const userB = await UserFactory.create(1);
    
    try {
        const startTime = new Date(Date.now() + 3600000).toISOString();
        const endTime = new Date(Date.now() + 7200000).toISOString();
        
        const event = await EventFactory.create(userA, {
            title: 'Test Event',
            startDate: startTime,
            endDate: endTime
        });
        
        const result = await EventFactory.join(userB, event.id);
        Assert.success(result, 'Join event should succeed');
        
        return { name: 'Join Event', passed: true };
    } catch (error) {
        return { name: 'Join Event', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Get Active Event
 */
async function testGetActiveEvent() {
    const user = await UserFactory.create(0);
    
    try {
        const result = await RpcHelper.callSuccess(user.session, 'get_active_event', {});
        Assert.success(result, 'Should return success');
        // Event may or may not exist, so just check structure
        if (result.event) {
            Assert.notNull(result.event.id, 'Event should have ID if present');
        }
        
        return { name: 'Get Active Event', passed: true };
    } catch (error) {
        return { name: 'Get Active Event', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Update Event Participation
 */
async function testUpdateEventParticipation() {
    const user = await UserFactory.create(0);
    
    try {
        const startTime = new Date(Date.now() + 3600000).toISOString();
        const endTime = new Date(Date.now() + 7200000).toISOString();
        
        const event = await EventFactory.create(user, {
            title: 'Test Event',
            startDate: startTime,
            endDate: endTime
        });
        
        await EventFactory.join(user, event.id);
        
        const result = await RpcHelper.callSuccess(user.session, 'update_event_participation', {
            eventId: event.id,
            xpEarned: 100,
            itemsCollected: 1
        });
        
        Assert.success(result, 'Update participation should succeed');
        
        return { name: 'Update Event Participation', passed: true };
    } catch (error) {
        return { name: 'Update Event Participation', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Get Event Leaderboard
 */
async function testGetEventLeaderboard() {
    const user = await UserFactory.create(0);
    
    try {
        const startTime = new Date(Date.now() + 3600000).toISOString();
        const endTime = new Date(Date.now() + 7200000).toISOString();
        
        const event = await EventFactory.create(user, {
            title: 'Test Event',
            startDate: startTime,
            endDate: endTime
        });
        
        const result = await RpcHelper.callSuccess(user.session, 'get_event_leaderboard', {
            eventId: event.id
        });
        
        Assert.success(result, 'Should return success');
        Assert.isArray(result.leaderboard, 'Leaderboard should be array');
        
        return { name: 'Get Event Leaderboard', passed: true };
    } catch (error) {
        return { name: 'Get Event Leaderboard', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Run all event system tests
 */
async function runEventSystemTests() {
    const tests = [
        testCreateEvent,
        testJoinEvent,
        testGetActiveEvent,
        testUpdateEventParticipation,
        testGetEventLeaderboard
    ];
    
    const results = [];
    for (const test of tests) {
        const result = await test();
        results.push(result);
    }
    
    return results;
}

module.exports = {
    runEventSystemTests,
    testCreateEvent,
    testJoinEvent,
    testGetActiveEvent,
    testUpdateEventParticipation,
    testGetEventLeaderboard
};

