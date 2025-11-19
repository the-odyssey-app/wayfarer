#!/usr/bin/env node

/**
 * Mini-Games Tests
 * Tests for quiz and observation puzzle mini-games
 */

const { RpcHelper, Assert, ErrorHelper } = require('../test-helpers');
const { UserFactory, QuestFactory, LocationHelper } = require('../test-factories');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Test: Get Quiz Questions
 */
async function testGetQuizQuestions() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Get Quiz Questions', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        await QuestFactory.start(user, quest.id);
        const questDetail = await QuestFactory.getDetail(user, quest.id);
        
        if (questDetail.steps && questDetail.steps.length > 0) {
            const step = questDetail.steps[0];
            const stepId = step.id || step.step_id || `step-${quest.id}-0`;
            
            const result = await RpcHelper.callSuccess(user.session, 'get_quiz_questions', {
                questId: quest.id,
                questStepId: stepId
            });
            
            Assert.success(result, 'Should return success');
            Assert.isArray(result.questions, 'Questions should be array');
        } else {
            return { name: 'Get Quiz Questions', passed: false, skipped: true, reason: 'No steps in quest' };
        }
        
        return { name: 'Get Quiz Questions', passed: true };
    } catch (error) {
        return { name: 'Get Quiz Questions', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Start Quiz Session
 */
async function testStartQuizSession() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Start Quiz Session', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        await QuestFactory.start(user, quest.id);
        const questDetail = await QuestFactory.getDetail(user, quest.id);
        
        if (questDetail.steps && questDetail.steps.length > 0) {
            const step = questDetail.steps[0];
            const stepId = step.id || step.step_id || `step-${quest.id}-0`;
            
            const result = await RpcHelper.callSuccess(user.session, 'start_quiz_session', {
                questId: quest.id,
                stepId: stepId
            });
            
            Assert.success(result, 'Should return success');
            Assert.notNull(result.sessionId, 'Session ID should be returned');
            
            return { name: 'Start Quiz Session', passed: true };
        } else {
            return { name: 'Start Quiz Session', passed: false, skipped: true, reason: 'No steps in quest' };
        }
    } catch (error) {
        return { name: 'Start Quiz Session', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Submit Quiz Answer
 */
async function testSubmitQuizAnswer() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Submit Quiz Answer', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        await QuestFactory.start(user, quest.id);
        const questDetail = await QuestFactory.getDetail(user, quest.id);
        
        if (questDetail.steps && questDetail.steps.length > 0) {
            const step = questDetail.steps[0];
            const stepId = step.id || step.step_id || `step-${quest.id}-0`;
            
            // Start session
            const sessionResult = await RpcHelper.callSuccess(user.session, 'start_quiz_session', {
                questId: quest.id,
                stepId: stepId
            });
            
            if (!sessionResult.sessionId) {
                return { name: 'Submit Quiz Answer', passed: false, skipped: true, reason: 'Could not start quiz session' };
            }
            
            // Get questions
            const questionsResult = await RpcHelper.callSuccess(user.session, 'get_quiz_questions', {
                questId: quest.id,
                stepId: stepId
            });
            
            if (questionsResult.questions && questionsResult.questions.length > 0) {
                const question = questionsResult.questions[0];
                
                const result = await RpcHelper.callSuccess(user.session, 'submit_quiz_answer', {
                    sessionId: sessionResult.sessionId,
                    questionId: question.id,
                    answerIndex: 0
                });
                
                Assert.success(result, 'Submit answer should succeed');
            } else {
                return { name: 'Submit Quiz Answer', passed: false, skipped: true, reason: 'No questions available' };
            }
            
            return { name: 'Submit Quiz Answer', passed: true };
        } else {
            return { name: 'Submit Quiz Answer', passed: false, skipped: true, reason: 'No steps in quest' };
        }
    } catch (error) {
        return { name: 'Submit Quiz Answer', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Complete Quiz Session
 */
async function testCompleteQuizSession() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Complete Quiz Session', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        await QuestFactory.start(user, quest.id);
        const questDetail = await QuestFactory.getDetail(user, quest.id);
        
        if (questDetail.steps && questDetail.steps.length > 0) {
            const step = questDetail.steps[0];
            const stepId = step.id || step.step_id || `step-${quest.id}-0`;
            
            // Start session
            const sessionResult = await RpcHelper.callSuccess(user.session, 'start_quiz_session', {
                questId: quest.id,
                stepId: stepId
            });
            
            if (!sessionResult.sessionId) {
                return { name: 'Complete Quiz Session', passed: false, skipped: true, reason: 'Could not start quiz session' };
            }
            
            const result = await RpcHelper.callSuccess(user.session, 'complete_quiz_session', {
                sessionId: sessionResult.sessionId
            });
            
            Assert.success(result, 'Complete session should succeed');
            Assert.notNull(result.finalScore, 'Final score should be returned');
            
            return { name: 'Complete Quiz Session', passed: true };
        } else {
            return { name: 'Complete Quiz Session', passed: false, skipped: true, reason: 'No steps in quest' };
        }
    } catch (error) {
        return { name: 'Complete Quiz Session', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Get Observation Puzzle
 */
async function testGetObservationPuzzle() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Get Observation Puzzle', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        await QuestFactory.start(user, quest.id);
        const questDetail = await QuestFactory.getDetail(user, quest.id);
        
        if (questDetail.steps && questDetail.steps.length > 0) {
            const step = questDetail.steps[0];
            const stepId = step.id || step.step_id || `step-${quest.id}-0`;
            
            const result = await RpcHelper.callSuccess(user.session, 'get_observation_puzzle', {
                questId: quest.id,
                stepId: stepId
            });
            
            Assert.success(result, 'Should return success');
            Assert.notNull(result.puzzle, 'Puzzle should be returned');
            
            return { name: 'Get Observation Puzzle', passed: true };
        } else {
            return { name: 'Get Observation Puzzle', passed: false, skipped: true, reason: 'No steps in quest' };
        }
    } catch (error) {
        return { name: 'Get Observation Puzzle', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Start Observation Session
 */
async function testStartObservationSession() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Start Observation Session', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        await QuestFactory.start(user, quest.id);
        const questDetail = await QuestFactory.getDetail(user, quest.id);
        
        if (questDetail.steps && questDetail.steps.length > 0) {
            const step = questDetail.steps[0];
            const stepId = step.id || step.step_id || `step-${quest.id}-0`;
            
            const result = await RpcHelper.callSuccess(user.session, 'start_observation_session', {
                questId: quest.id,
                stepId: stepId
            });
            
            Assert.success(result, 'Should return success');
            Assert.notNull(result.sessionId, 'Session ID should be returned');
            
            return { name: 'Start Observation Session', passed: true };
        } else {
            return { name: 'Start Observation Session', passed: false, skipped: true, reason: 'No steps in quest' };
        }
    } catch (error) {
        return { name: 'Start Observation Session', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Verify Observation Item
 */
async function testVerifyObservationItem() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Verify Observation Item', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        await QuestFactory.start(user, quest.id);
        const questDetail = await QuestFactory.getDetail(user, quest.id);
        
        if (questDetail.steps && questDetail.steps.length > 0) {
            const step = questDetail.steps[0];
            const stepId = step.id || step.step_id || `step-${quest.id}-0`;
            
            // Start session
            const sessionResult = await RpcHelper.callSuccess(user.session, 'start_observation_session', {
                questId: quest.id,
                stepId: stepId
            });
            
            if (!sessionResult.sessionId) {
                return { name: 'Verify Observation Item', passed: false, skipped: true, reason: 'Could not start observation session' };
            }
            
            // Get puzzle
            const puzzleResult = await RpcHelper.callSuccess(user.session, 'get_observation_puzzle', {
                questId: quest.id,
                stepId: stepId
            });
            
            if (puzzleResult.puzzle && puzzleResult.puzzle.items && puzzleResult.puzzle.items.length > 0) {
                const item = puzzleResult.puzzle.items[0];
                
                const result = await RpcHelper.callSuccess(user.session, 'verify_observation_item', {
                    sessionId: sessionResult.sessionId,
                    itemId: item.id,
                    verified: true
                });
                
                Assert.success(result, 'Verify item should succeed');
            } else {
                return { name: 'Verify Observation Item', passed: false, skipped: true, reason: 'No items in puzzle' };
            }
            
            return { name: 'Verify Observation Item', passed: true };
        } else {
            return { name: 'Verify Observation Item', passed: false, skipped: true, reason: 'No steps in quest' };
        }
    } catch (error) {
        return { name: 'Verify Observation Item', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Submit Observation Count
 */
async function testSubmitObservationCount() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Submit Observation Count', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        await QuestFactory.start(user, quest.id);
        const questDetail = await QuestFactory.getDetail(user, quest.id);
        
        if (questDetail.steps && questDetail.steps.length > 0) {
            const step = questDetail.steps[0];
            const stepId = step.id || step.step_id || `step-${quest.id}-0`;
            
            // Start session
            const sessionResult = await RpcHelper.callSuccess(user.session, 'start_observation_session', {
                questId: quest.id,
                stepId: stepId
            });
            
            if (!sessionResult.sessionId) {
                return { name: 'Submit Observation Count', passed: false, skipped: true, reason: 'Could not start observation session' };
            }
            
            const result = await RpcHelper.callSuccess(user.session, 'submit_observation_count', {
                sessionId: sessionResult.sessionId,
                count: 5
            });
            
            Assert.success(result, 'Submit count should succeed');
            
            return { name: 'Submit Observation Count', passed: true };
        } else {
            return { name: 'Submit Observation Count', passed: false, skipped: true, reason: 'No steps in quest' };
        }
    } catch (error) {
        return { name: 'Submit Observation Count', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Complete Observation Session
 */
async function testCompleteObservationSession() {
    const user = await UserFactory.create(0);
    const location = LocationHelper.generateLocation(0);
    await UserFactory.updateLocation(user, location);
    
    if (!OPENROUTER_API_KEY) {
        return { name: 'Complete Observation Session', passed: false, skipped: true, reason: 'OPENROUTER_API_KEY not configured' };
    }
    
    try {
        const quest = await QuestFactory.generateScavengerHunt(user, location);
        await QuestFactory.start(user, quest.id);
        const questDetail = await QuestFactory.getDetail(user, quest.id);
        
        if (questDetail.steps && questDetail.steps.length > 0) {
            const step = questDetail.steps[0];
            const stepId = step.id || step.step_id || `step-${quest.id}-0`;
            
            // Start session
            const sessionResult = await RpcHelper.callSuccess(user.session, 'start_observation_session', {
                questId: quest.id,
                stepId: stepId
            });
            
            if (!sessionResult.sessionId) {
                return { name: 'Complete Observation Session', passed: false, skipped: true, reason: 'Could not start observation session' };
            }
            
            const result = await RpcHelper.callSuccess(user.session, 'complete_observation_session', {
                sessionId: sessionResult.sessionId
            });
            
            Assert.success(result, 'Complete session should succeed');
            Assert.notNull(result.isCorrect, 'Correctness should be returned');
            
            return { name: 'Complete Observation Session', passed: true };
        } else {
            return { name: 'Complete Observation Session', passed: false, skipped: true, reason: 'No steps in quest' };
        }
    } catch (error) {
        return { name: 'Complete Observation Session', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Get Available Mini Games
 */
async function testGetAvailableMiniGames() {
    const user = await UserFactory.create(0);
    
    try {
        const result = await RpcHelper.callSuccess(user.session, 'get_available_mini_games', {});
        Assert.success(result, 'Should return success');
        Assert.isArray(result.games, 'Games should be array');
        
        return { name: 'Get Available Mini Games', passed: true };
    } catch (error) {
        return { name: 'Get Available Mini Games', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Run all mini-games tests
 */
async function runMiniGamesTests() {
    const tests = [
        testGetQuizQuestions,
        testStartQuizSession,
        testSubmitQuizAnswer,
        testCompleteQuizSession,
        testGetObservationPuzzle,
        testStartObservationSession,
        testVerifyObservationItem,
        testSubmitObservationCount,
        testCompleteObservationSession,
        testGetAvailableMiniGames
    ];
    
    const results = [];
    for (const test of tests) {
        const result = await test();
        results.push(result);
    }
    
    return results;
}

module.exports = {
    runMiniGamesTests,
    testGetQuizQuestions,
    testStartQuizSession,
    testSubmitQuizAnswer,
    testCompleteQuizSession,
    testGetObservationPuzzle,
    testStartObservationSession,
    testVerifyObservationItem,
    testSubmitObservationCount,
    testCompleteObservationSession,
    testGetAvailableMiniGames
};

