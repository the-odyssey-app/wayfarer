#!/usr/bin/env node

/**
 * Wayfarer Integration Test Runner
 * Comprehensive end-to-end testing for all backend RPCs
 * Uses modular test structure with coverage reporting
 */

const { runAllTestSuites } = require('./tests/index');
const TestReporter = require('./test-reporter');
const path = require('path');

// Configuration from environment
const NAKAMA_HOST = process.env.NAKAMA_HOST || 'localhost';
const NAKAMA_PORT = parseInt(process.env.NAKAMA_PORT || '7350', 10);
const NAKAMA_SERVER_KEY = process.env.NAKAMA_SERVER_KEY || 'defaultkey';
const TEST_USER_COUNT = parseInt(process.env.TEST_USER_COUNT || '5', 10);
const TEST_GROUP_COUNT = parseInt(process.env.TEST_GROUP_COUNT || '2', 10);

// API Keys (optional)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const PLACES_PROXY_URL = process.env.PLACES_PROXY_URL;

// Report configuration
const OUTPUT_DIR = process.env.TEST_OUTPUT_DIR || path.join(__dirname, 'test-results');
const GENERATE_HTML = process.env.TEST_HTML_REPORT !== 'false';
const GENERATE_JSON = process.env.TEST_JSON_REPORT !== 'false';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    log('\n' + '='.repeat(70), 'blue');
    log(title, 'blue');
    log('='.repeat(70), 'blue');
}

/**
 * Main test execution
 */
async function runAllTests() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║   Wayfarer Integration Test Runner                       ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');
    
    log(`\nConfiguration:`, 'cyan');
    log(`  Nakama Host: ${NAKAMA_HOST}:${NAKAMA_PORT}`, 'cyan');
    log(`  Test Users: ${TEST_USER_COUNT}`, 'cyan');
    log(`  Test Groups: ${TEST_GROUP_COUNT}`, 'cyan');
    log(`  Google Maps API: ${GOOGLE_MAPS_API_KEY ? '✅ Configured' : '❌ Not configured'}`, 'cyan');
    log(`  OpenRouter API: ${OPENROUTER_API_KEY ? '✅ Configured' : '❌ Not configured'}`, 'cyan');
    log(`  Places Proxy URL: ${PLACES_PROXY_URL ? '✅ Configured' : '❌ Not configured'}`, 'cyan');
    log(`  Output Directory: ${OUTPUT_DIR}`, 'cyan');
    
    const reporter = new TestReporter(OUTPUT_DIR);
    reporter.start();
    
    try {
        logSection('Running Test Suites');
        
        // Run all test suites
        const allResults = await runAllTestSuites();
        
        // Add results to reporter
        allResults.forEach(result => {
            reporter.addTestResult(result);
        });
        
        reporter.end();
        
        // Generate reports
        logSection('Generating Reports');
        
        if (GENERATE_JSON) {
            const jsonPath = await reporter.generateJSONReport();
            log(`✅ JSON report: ${jsonPath}`, 'green');
        }
        
        if (GENERATE_HTML) {
            const htmlPath = await reporter.generateHTMLReport();
            log(`✅ HTML report: ${htmlPath}`, 'green');
        }
        
        const coveragePath = await reporter.generateCoverageReport();
        if (coveragePath) {
            log(`✅ Coverage report: ${coveragePath}`, 'green');
        }
        
        // Print summary
        logSection('Test Summary');
        const summary = reporter.getSummary();
        
        log(`\nTotal Tests: ${summary.total}`, 'cyan');
        log(`  ✅ Passed: ${summary.passed}`, 'green');
        log(`  ❌ Failed: ${summary.failed}`, 'red');
        log(`  ⏭️  Skipped: ${summary.skipped}`, 'yellow');
        log(`\nDuration: ${(summary.duration / 1000).toFixed(2)}s`, 'cyan');
        log(`\nRPC Coverage: ${summary.coverage.percentage}% (${summary.coverage.tested}/${summary.coverage.total})`, 'cyan');
        
        if (summary.failed > 0) {
            log('\nFailed Tests:', 'red');
            allResults
                .filter(r => !r.passed && !r.skipped)
                .forEach(r => {
                    log(`  ❌ ${r.name}`, 'red');
                    if (r.error) {
                        log(`     ${r.error}`, 'yellow');
                    }
                });
        }
        
        // Exit with appropriate code
        process.exit(summary.failed > 0 ? 1 : 0);
        
    } catch (error) {
        reporter.end();
        log(`\n❌ Fatal error: ${error.message}`, 'red');
        log(error.stack, 'yellow');
        
        // Still generate reports on error
        try {
            await reporter.generateJSONReport();
            await reporter.generateHTMLReport();
        } catch (reportError) {
            log(`Failed to generate reports: ${reportError.message}`, 'red');
        }
        
        process.exit(1);
    }
}

// Run tests
runAllTests().catch(error => {
    log(`\n❌ Unhandled error: ${error.message}`, 'red');
    process.exit(1);
});
