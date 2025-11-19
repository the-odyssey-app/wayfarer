#!/usr/bin/env node

/**
 * Test Suite Index
 * Exports all test suites for execution
 */

const questSystemTests = require('./quest-system.test');
const partySystemTests = require('./party-system.test');
const eventSystemTests = require('./event-system.test');
const miniGamesTests = require('./mini-games.test');
const tradingSystemTests = require('./trading-system.test');
const audioSystemTests = require('./audio-system.test');
const socialMatchingTests = require('./social-matching.test');
const safetyModerationTests = require('./safety-moderation.test');
const proxySystemTests = require('./proxy-system.test');

/**
 * Run all test suites
 */
async function runAllTestSuites() {
    const allResults = [];
    const testSuites = [
        { name: 'Proxy System', run: () => proxySystemTests.runProxySystemTests(), icon: '🌐' },
        { name: 'Quest System', run: () => questSystemTests.runQuestSystemTests(), icon: '📋' },
        { name: 'Party System', run: () => partySystemTests.runPartySystemTests(), icon: '👥' },
        { name: 'Event System', run: () => eventSystemTests.runEventSystemTests(), icon: '🎉' },
        { name: 'Mini-Games', run: () => miniGamesTests.runMiniGamesTests(), icon: '🎮' },
        { name: 'Trading System', run: () => tradingSystemTests.runTradingSystemTests(), icon: '🔄' },
        { name: 'Audio System', run: () => audioSystemTests.runAudioSystemTests(), icon: '🎵' },
        { name: 'Social/Matching', run: () => socialMatchingTests.runSocialMatchingTests(), icon: '👤' },
        { name: 'Safety/Moderation', run: () => safetyModerationTests.runSafetyModerationTests(), icon: '🛡️' }
    ];
    
    for (const suite of testSuites) {
        console.log(`\n${suite.icon} Running ${suite.name} Tests...`);
        try {
            const results = await suite.run();
            allResults.push(...results);
        } catch (error) {
            console.error(`Error running ${suite.name} tests:`, error);
            allResults.push({
                name: `${suite.name} Suite`,
                passed: false,
                error: error.message
            });
        }
    }
    
    return allResults;
}

module.exports = {
    runAllTestSuites,
    proxySystemTests,
    questSystemTests,
    partySystemTests,
    eventSystemTests,
    miniGamesTests,
    tradingSystemTests,
    audioSystemTests,
    socialMatchingTests,
    safetyModerationTests
};

