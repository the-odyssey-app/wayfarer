#!/usr/bin/env node

/**
 * Test Cleanup Utilities
 * Functions for cleaning up test data and ensuring test isolation
 */

const { client } = require('./test-helpers');
const { CleanupFactory, testData } = require('./test-factories');

/**
 * Cleanup Manager
 */
class CleanupManager {
    /**
     * Cleanup all test data
     */
    static async cleanupAll() {
        // Note: Nakama doesn't provide direct deletion APIs for most resources
        // In a real scenario, you might need:
        // 1. Admin RPCs for cleanup
        // 2. Direct database access
        // 3. Test-specific cleanup endpoints
        
        // For now, we clear the in-memory test data
        CleanupFactory.clearTestData();
    }

    /**
     * Cleanup specific user's data
     */
    static async cleanupUser(user) {
        // Remove from test data
        await CleanupFactory.cleanupUser(user);
        
        // Note: In production, you might want to:
        // - Delete user's quests
        // - Delete user's party memberships
        // - Delete user's inventory
        // - Delete user's achievements
        // etc.
    }

    /**
     * Cleanup quest-related data
     */
    static async cleanupQuest(questId) {
        // Remove from test data
        const index = testData.quests.findIndex(q => q.id === questId);
        if (index !== -1) {
            testData.quests.splice(index, 1);
        }
    }

    /**
     * Cleanup party-related data
     */
    static async cleanupParty(partyId) {
        // Remove from test data
        const index = testData.parties.findIndex(p => p.id === partyId);
        if (index !== -1) {
            testData.parties.splice(index, 1);
        }
    }

    /**
     * Setup test isolation - clear state before test
     */
    static async setupIsolation() {
        // Clear test data
        CleanupFactory.clearTestData();
        
        // Add any other setup needed for test isolation
        // e.g., reset counters, clear caches, etc.
    }

    /**
     * Teardown test isolation - cleanup after test
     */
    static async teardownIsolation() {
        // Cleanup test data
        await this.cleanupAll();
    }
}

/**
 * Test Isolation Wrapper
 * Wraps a test function with setup/teardown
 */
function withIsolation(testFn) {
    return async function(...args) {
        try {
            // Setup isolation
            await CleanupManager.setupIsolation();
            
            // Run test
            const result = await testFn(...args);
            
            return result;
        } finally {
            // Teardown isolation (always runs)
            await CleanupManager.teardownIsolation();
        }
    };
}

module.exports = {
    CleanupManager,
    withIsolation
};

