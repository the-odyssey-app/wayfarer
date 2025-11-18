#!/usr/bin/env node

/**
 * Test Data Factories
 * Factory functions for creating test data and complex scenarios
 */

const { client } = require('./test-helpers');
const { LocationHelper } = require('./test-helpers');

// Test data storage (shared across tests)
const testData = {
    users: [],
    sessions: [],
    quests: [],
    parties: [],
    items: [],
    events: [],
    trades: []
};

/**
 * User Factory
 */
class UserFactory {
    static generateEmail(index) {
        const timestamp = Date.now();
        return `testuser${index}_${timestamp}@wayfarer.test`;
    }

    static generateUsername(index) {
        return `testuser${index}`;
    }

    static async create(index) {
        try {
            const email = this.generateEmail(index);
            const password = 'testpass123';
            
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
            throw new Error(`Failed to create test user ${index}: ${error.message}`);
        }
    }

    static async createMultiple(count) {
        const users = [];
        for (let i = 0; i < count; i++) {
            users.push(await this.create(testData.users.length));
        }
        return users;
    }

    static async updateLocation(user, location) {
        const { RpcHelper } = require('./test-helpers');
        return await RpcHelper.callSuccess(user.session, 'update_user_location', {
            latitude: location.latitude,
            longitude: location.longitude
        });
    }
}

/**
 * Quest Factory
 */
class QuestFactory {
    static async generateScavengerHunt(user, location, preferences = {}) {
        const { RpcHelper } = require('./test-helpers');
        
        // First try to get places from Google Maps, then use those as locations
        // If that fails, create a locations array from the single location
        let locations = [];
        try {
            const placesResult = await RpcHelper.callSuccess(user.session, 'get_places_nearby', {
                latitude: location.latitude,
                longitude: location.longitude,
                radiusKm: 5,
                minResults: 10
            });
            
            if (placesResult && placesResult.places && placesResult.places.length >= 2) {
                locations = placesResult.places.slice(0, 10).map(p => ({
                    name: p.name || 'Location',
                    lat: parseFloat(p.latitude || p.lat),
                    lng: parseFloat(p.longitude || p.lng)
                }));
            }
        } catch (error) {
            // If get_places_nearby fails, create locations from single location
        }
        
        // If we don't have enough locations, create some from the provided location
        if (locations.length < 2) {
            // Create 10 locations around the provided location (simulated)
            for (let i = 0; i < 10; i++) {
                locations.push({
                    name: `Location ${i + 1}`,
                    lat: location.latitude + (Math.random() - 0.5) * 0.01,
                    lng: location.longitude + (Math.random() - 0.5) * 0.01
                });
            }
        }
        
        const result = await RpcHelper.callSuccess(user.session, 'generate_scavenger_hunt', {
            locations: locations,
            userTags: preferences.userTags || ['exploration'],
            difficulty: preferences.difficulty || 2
        });
        
        const quest = result.quest;
        testData.quests.push(quest);
        return quest;
    }

    static async generateSingleTask(user, location) {
        const { RpcHelper } = require('./test-helpers');
        
        // Single task uses create_single_task_quest_from_location which returns a prompt
        // For testing purposes, we'll use create_single_task_quest_from_location
        // Note: This returns a prompt, not a quest, so we need to handle it differently
        const result = await RpcHelper.callSuccess(user.session, 'create_single_task_quest_from_location', {
            latitude: location.latitude,
            longitude: location.longitude,
            userTags: [],
            maxDistanceKm: 5
        });
        
        // Single task returns a prompt, not a quest, so we create a mock quest object for testing
        if (!result.success || !result.prompt) {
            throw new Error('create_single_task_quest_from_location did not return prompt');
        }
        
        // Return a quest-like object for test compatibility
        const quest = {
            id: 'single-task-' + Date.now(),
            type: 'single_task',
            prompt: result.prompt,
            place: result.place
        };
        testData.quests.push(quest);
        return quest;
    }

    static async generateMystery(user, location) {
        const { RpcHelper } = require('./test-helpers');
        
        // Get places first, then format as locations array
        let locations = [];
        try {
            const placesResult = await RpcHelper.callSuccess(user.session, 'get_places_nearby', {
                latitude: location.latitude,
                longitude: location.longitude,
                radiusKm: 5,
                minResults: 5
            });
            
            if (placesResult && placesResult.places && placesResult.places.length >= 2) {
                locations = placesResult.places.slice(0, 5).map(p => ({
                    name: p.name || 'Location',
                    lat: parseFloat(p.latitude || p.lat),
                    lng: parseFloat(p.longitude || p.lng)
                }));
            }
        } catch (error) {
            // Create locations from single location if get_places fails
            for (let i = 0; i < 5; i++) {
                locations.push({
                    name: `Location ${i + 1}`,
                    lat: location.latitude + (Math.random() - 0.5) * 0.01,
                    lng: location.longitude + (Math.random() - 0.5) * 0.01
                });
            }
        }
        
        const result = await RpcHelper.callSuccess(user.session, 'generate_mystery_prompt', {
            locations: locations,
            tags: ['mystery', 'adventure']
        });
        
        const quest = result.quest;
        testData.quests.push(quest);
        return quest;
    }

    static async start(user, questId) {
        const { RpcHelper } = require('./test-helpers');
        const result = await RpcHelper.callSuccess(user.session, 'start_quest', {
            quest_id: questId
        });
        return result.user_quest;
    }

    static async getDetail(user, questId) {
        const { RpcHelper } = require('./test-helpers');
        const result = await RpcHelper.callSuccess(user.session, 'get_quest_detail', {
            questId: questId
        });
        return result.quest;
    }

    static async completeStep(user, questId, stepIndex) {
        const { RpcHelper } = require('./test-helpers');
        return await RpcHelper.callSuccess(user.session, 'complete_step', {
            quest_id: questId,
            step_index: stepIndex
        });
    }

    static async complete(user, questId) {
        const { RpcHelper } = require('./test-helpers');
        return await RpcHelper.callSuccess(user.session, 'complete_quest', {
            quest_id: questId
        });
    }

    static async completeFullQuest(user, questId) {
        // Complete all steps then complete quest
        const questDetail = await this.getDetail(user, questId);
        const steps = questDetail.steps || [];
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepLocation = step.coordinates || step.location;
            
            // Update location to step location
            await UserFactory.updateLocation(user, {
                latitude: stepLocation.latitude,
                longitude: stepLocation.longitude
            });
            
            // Complete step
            await this.completeStep(user, questId, i);
        }
        
        // Complete quest
        return await this.complete(user, questId);
    }
}

/**
 * Party Factory
 */
class PartyFactory {
    static async create(user, questId, maxMembers = 4) {
        const { RpcHelper } = require('./test-helpers');
        const result = await RpcHelper.callSuccess(user.session, 'create_party', {
            quest_id: questId,
            maxMembers: maxMembers
        });
        
        const party = result.party || { id: result.partyId, code: result.party?.code };
        testData.parties.push(party);
        return party;
    }

    static async join(user, partyCode) {
        const { RpcHelper } = require('./test-helpers');
        return await RpcHelper.callSuccess(user.session, 'join_party', {
            party_code: partyCode
        });
    }

    static async leave(user, partyId) {
        const { RpcHelper } = require('./test-helpers');
        return await RpcHelper.callSuccess(user.session, 'leave_party', {
            party_id: partyId
        });
    }

    static async getMembers(user, partyId) {
        const { RpcHelper } = require('./test-helpers');
        const result = await RpcHelper.callSuccess(user.session, 'get_party_members', {
            party_id: partyId
        });
        return result.members;
    }

    static async createVote(user, partyId, voteData) {
        const { RpcHelper } = require('./test-helpers');
        const result = await RpcHelper.callSuccess(user.session, 'create_party_vote', {
            partyId: partyId,
            voteType: voteData.voteType || 'decision',
            title: voteData.title || 'Test Vote',
            description: voteData.description || 'Test vote description',
            options: voteData.options || ['Option 1', 'Option 2'],
            expiresInMinutes: voteData.expiresInMinutes || 30
        });
        return result.voteId;
    }

    static async castVote(user, voteId, optionIndex) {
        const { RpcHelper } = require('./test-helpers');
        return await RpcHelper.callSuccess(user.session, 'cast_vote', {
            voteId: voteId,
            optionIndex: optionIndex
        });
    }
}

/**
 * Event Factory
 */
class EventFactory {
    static async create(user, eventData) {
        const { RpcHelper } = require('./test-helpers');
        const result = await RpcHelper.callSuccess(user.session, 'create_event', {
            title: eventData.title || eventData.name || 'Test Event',
            description: eventData.description || 'Test event description',
            startDate: eventData.startDate || eventData.startTime || new Date(Date.now() + 3600000).toISOString(),
            endDate: eventData.endDate || eventData.endTime || new Date(Date.now() + 7200000).toISOString(),
            mechanics: eventData.mechanics,
            rewardConfig: eventData.rewardConfig,
            leaderboardConfig: eventData.leaderboardConfig
        });
        
        const event = result.event || { id: result.eventId };
        testData.events.push(event);
        return event;
    }

    static async join(user, eventId) {
        const { RpcHelper } = require('./test-helpers');
        return await RpcHelper.callSuccess(user.session, 'join_event', {
            eventId: eventId
        });
    }
}

/**
 * Trade Factory
 */
class TradeFactory {
    static async create(user, targetUserId, offeredItems, requestedItems) {
        const { RpcHelper } = require('./test-helpers');
        const result = await RpcHelper.callSuccess(user.session, 'create_item_trade', {
            targetUserId: targetUserId,
            offeredItems: offeredItems,
            requestedItems: requestedItems
        });
        
        const trade = { id: result.tradeId };
        testData.trades.push(trade);
        return trade;
    }

    static async respond(user, tradeId, response) {
        const { RpcHelper } = require('./test-helpers');
        return await RpcHelper.callSuccess(user.session, 'respond_to_trade', {
            tradeId: tradeId,
            response: response // 'accept' or 'reject'
        });
    }
}

/**
 * Cleanup Factory
 */
class CleanupFactory {
    static getTestData() {
        return testData;
    }

    static clearTestData() {
        testData.users = [];
        testData.sessions = [];
        testData.quests = [];
        testData.parties = [];
        testData.items = [];
        testData.events = [];
        testData.trades = [];
    }

    static async cleanupUser(user) {
        // Note: Nakama doesn't provide user deletion in standard API
        // This would require admin RPC or database cleanup
        // For now, we just remove from test data
        const index = testData.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            testData.users.splice(index, 1);
        }
        const sessionIndex = testData.sessions.findIndex(s => s.user_id === user.id);
        if (sessionIndex !== -1) {
            testData.sessions.splice(sessionIndex, 1);
        }
    }
}

module.exports = {
    UserFactory,
    QuestFactory,
    PartyFactory,
    EventFactory,
    TradeFactory,
    CleanupFactory,
    testData,
    LocationHelper
};

