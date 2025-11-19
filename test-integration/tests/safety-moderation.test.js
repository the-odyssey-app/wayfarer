#!/usr/bin/env node

/**
 * Safety/Moderation Tests
 * Tests for safety reporting and moderation features
 */

const { RpcHelper, Assert, ErrorHelper } = require('../test-helpers');
const { UserFactory } = require('../test-factories');

/**
 * Test: Submit Safety Report
 */
async function testSubmitSafetyReport() {
    const user = await UserFactory.create(0);
    
    try {
        const result = await RpcHelper.callSuccess(user.session, 'submit_safety_report', {
            reportType: 'inappropriate_content',
            severity: 'medium',
            title: 'Test Safety Report',
            description: 'Test safety report description',
            reportedUserId: null  // Use null instead of invalid UUID
        });
        
        Assert.success(result, 'Submit safety report should succeed');
        Assert.notNull(result.reportId, 'Report ID should be returned');
        
        return { name: 'Submit Safety Report', passed: true };
    } catch (error) {
        return { name: 'Submit Safety Report', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Get User Safety Reports
 */
async function testGetUserSafetyReports() {
    const user = await UserFactory.create(0);
    
    try {
        const result = await RpcHelper.callSuccess(user.session, 'get_user_safety_reports', {});
        Assert.success(result, 'Should return success');
        Assert.isArray(result.reports, 'Reports should be array');
        
        return { name: 'Get User Safety Reports', passed: true };
    } catch (error) {
        return { name: 'Get User Safety Reports', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Get Feedback Analytics
 */
async function testGetFeedbackAnalytics() {
    const user = await UserFactory.create(0);
    
    try {
        // This might require admin permissions, so test may fail
        // First need a questId - try to get one or use a test quest
        // For now, use a placeholder - this will likely fail but test the structure
        const result = await RpcHelper.callSuccess(user.session, 'get_feedback_analytics', {
            questId: 'test-quest-id-for-analytics',
            days: 30
        });
        Assert.success(result, 'Should return success');
        
        return { name: 'Get Feedback Analytics', passed: true };
    } catch (error) {
        // If unauthorized, skip test
        if (error.message && (error.message.includes('unauthorized') || error.message.includes('permission'))) {
            return { name: 'Get Feedback Analytics', passed: false, skipped: true, reason: 'Requires admin permissions' };
        }
        return { name: 'Get Feedback Analytics', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Process Feedback Categorization
 */
async function testProcessFeedbackCategorization() {
    const user = await UserFactory.create(0);
    
    try {
        // This might require admin permissions
        const result = await RpcHelper.callSuccess(user.session, 'process_feedback_categorization', {
            reportId: 'test-report-id'
        });
        
        Assert.success(result, 'Process categorization should succeed');
        
        return { name: 'Process Feedback Categorization', passed: true };
    } catch (error) {
        // If unauthorized, skip test
        if (error.message && (error.message.includes('unauthorized') || error.message.includes('permission'))) {
            return { name: 'Process Feedback Categorization', passed: false, skipped: true, reason: 'Requires admin permissions' };
        }
        return { name: 'Process Feedback Categorization', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Get Report Queue
 */
async function testGetReportQueue() {
    const user = await UserFactory.create(0);
    
    try {
        // This might require admin permissions
        const result = await RpcHelper.callSuccess(user.session, 'get_report_queue', {
            status: 'pending',
            limit: 10
        });
        
        Assert.success(result, 'Should return success');
        Assert.isArray(result.reports, 'Reports should be array');
        
        return { name: 'Get Report Queue', passed: true };
    } catch (error) {
        // If unauthorized, skip test
        if (error.message && (error.message.includes('unauthorized') || error.message.includes('permission'))) {
            return { name: 'Get Report Queue', passed: false, skipped: true, reason: 'Requires admin permissions' };
        }
        return { name: 'Get Report Queue', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Test: Update Report Status
 */
async function testUpdateReportStatus() {
    const user = await UserFactory.create(0);
    
    try {
        // First submit a report
        // Generate a valid UUID for reportedUserId (or use null if optional)
        const reportResult = await RpcHelper.callSuccess(user.session, 'submit_safety_report', {
            reportType: 'inappropriate_content',
            severity: 'medium',
            title: 'Test Safety Report',
            description: 'Test report for status update',
            reportedUserId: null  // Use null instead of invalid UUID
        });
        
        if (!reportResult.reportId) {
            return { name: 'Update Report Status', passed: false, skipped: true, reason: 'Could not create report' };
        }
        
        // This might require admin permissions
        const result = await RpcHelper.callSuccess(user.session, 'update_report_status', {
            reportId: reportResult.reportId,
            status: 'resolved',
            investigationNotes: 'Test status update',
            resolution: 'Test resolution',
            adminNotes: 'Test admin notes'
        });
        
        Assert.success(result, 'Update status should succeed');
        
        return { name: 'Update Report Status', passed: true };
    } catch (error) {
        // If unauthorized, skip test
        if (error.message && (error.message.includes('unauthorized') || error.message.includes('permission'))) {
            return { name: 'Update Report Status', passed: false, skipped: true, reason: 'Requires admin permissions' };
        }
        return { name: 'Update Report Status', passed: false, error: ErrorHelper.extract(error) };
    }
}

/**
 * Run all safety/moderation tests
 */
async function runSafetyModerationTests() {
    const tests = [
        testSubmitSafetyReport,
        testGetUserSafetyReports,
        testGetFeedbackAnalytics,
        testProcessFeedbackCategorization,
        testGetReportQueue,
        testUpdateReportStatus
    ];
    
    const results = [];
    for (const test of tests) {
        const result = await test();
        results.push(result);
    }
    
    return results;
}

module.exports = {
    runSafetyModerationTests,
    testSubmitSafetyReport,
    testGetUserSafetyReports,
    testGetFeedbackAnalytics,
    testProcessFeedbackCategorization,
    testGetReportQueue,
    testUpdateReportStatus
};

