#!/usr/bin/env node

/**
 * Test Reporter
 * Generates coverage reports and test result summaries
 */

const fs = require('fs');
const path = require('path');

class TestReporter {
    constructor(outputDir = './test-results') {
        this.outputDir = outputDir;
        this.results = {
            startTime: null,
            endTime: null,
            duration: 0,
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: [],
            coverage: {
                total: 0,
                tested: 0,
                untested: 0,
                percentage: 0
            }
        };
    }

    start() {
        this.results.startTime = Date.now();
    }

    end() {
        this.results.endTime = Date.now();
        this.results.duration = this.results.endTime - this.results.startTime;
    }

    addTestResult(testResult) {
        this.results.tests.push({
            name: testResult.name,
            passed: testResult.passed,
            skipped: testResult.skipped || false,
            error: testResult.error || null,
            reason: testResult.reason || null,
            timestamp: Date.now()
        });

        this.results.total++;
        if (testResult.skipped) {
            this.results.skipped++;
        } else if (testResult.passed) {
            this.results.passed++;
        } else {
            this.results.failed++;
        }
    }

    async updateCoverage() {
        try {
            const { generateInventory } = require('./generate-rpc-inventory');
            const inventory = generateInventory();
            
            this.results.coverage = {
                total: inventory.total,
                tested: inventory.tested,
                untested: inventory.untested,
                percentage: parseFloat(inventory.coverage)
            };
        } catch (error) {
            console.error('Failed to update coverage:', error);
        }
    }

    async generateJSONReport() {
        await this.updateCoverage();
        
        const reportPath = path.join(this.outputDir, `test-results-${Date.now()}.json`);
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        
        const report = {
            ...this.results,
            generated: new Date().toISOString(),
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                skipped: this.results.skipped,
                successRate: ((this.results.passed / (this.results.total - this.results.skipped)) * 100).toFixed(2),
                coverage: this.results.coverage
            }
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        return reportPath;
    }

    async generateHTMLReport() {
        await this.updateCoverage();
        
        const reportPath = path.join(this.outputDir, `test-results-${Date.now()}.html`);
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        
        const passedTests = this.results.tests.filter(t => t.passed && !t.skipped);
        const failedTests = this.results.tests.filter(t => !t.passed && !t.skipped);
        const skippedTests = this.results.tests.filter(t => t.skipped);
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Wayfarer Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { padding: 15px; border-radius: 6px; text-align: center; }
        .stat-card.passed { background: #d4edda; color: #155724; }
        .stat-card.failed { background: #f8d7da; color: #721c24; }
        .stat-card.skipped { background: #fff3cd; color: #856404; }
        .stat-card.coverage { background: #d1ecf1; color: #0c5460; }
        .stat-value { font-size: 2em; font-weight: bold; }
        .stat-label { font-size: 0.9em; margin-top: 5px; }
        .section { margin: 30px 0; }
        .test-item { padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 4px solid; }
        .test-item.passed { background: #d4edda; border-color: #28a745; }
        .test-item.failed { background: #f8d7da; border-color: #dc3545; }
        .test-item.skipped { background: #fff3cd; border-color: #ffc107; }
        .error { color: #721c24; font-size: 0.9em; margin-top: 5px; }
        .coverage-bar { background: #e9ecef; height: 30px; border-radius: 15px; overflow: hidden; margin: 10px 0; }
        .coverage-fill { background: #28a745; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; transition: width 0.3s; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Wayfarer Integration Test Results</h1>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        <p><strong>Duration:</strong> ${(this.results.duration / 1000).toFixed(2)}s</p>
        
        <div class="summary">
            <div class="stat-card passed">
                <div class="stat-value">${this.results.passed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card failed">
                <div class="stat-value">${this.results.failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card skipped">
                <div class="stat-value">${this.results.skipped}</div>
                <div class="stat-label">Skipped</div>
            </div>
            <div class="stat-card coverage">
                <div class="stat-value">${this.results.coverage.percentage}%</div>
                <div class="stat-label">RPC Coverage</div>
            </div>
        </div>
        
        <div class="section">
            <h2>RPC Coverage</h2>
            <div class="coverage-bar">
                <div class="coverage-fill" style="width: ${this.results.coverage.percentage}%">
                    ${this.results.coverage.tested} / ${this.results.coverage.total} RPCs Tested
                </div>
            </div>
            <p>Tested: ${this.results.coverage.tested} | Untested: ${this.results.coverage.untested}</p>
        </div>
        
        ${failedTests.length > 0 ? `
        <div class="section">
            <h2>❌ Failed Tests (${failedTests.length})</h2>
            ${failedTests.map(test => `
                <div class="test-item failed">
                    <strong>${test.name}</strong>
                    ${test.error ? `<div class="error">${test.error}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${skippedTests.length > 0 ? `
        <div class="section">
            <h2>⏭️ Skipped Tests (${skippedTests.length})</h2>
            ${skippedTests.map(test => `
                <div class="test-item skipped">
                    <strong>${test.name}</strong>
                    ${test.reason ? `<div>Reason: ${test.reason}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="section">
            <h2>✅ All Test Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>Status</th>
                        <th>Error</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.results.tests.map(test => `
                        <tr>
                            <td>${test.name}</td>
                            <td>${test.skipped ? '⏭️ Skipped' : test.passed ? '✅ Passed' : '❌ Failed'}</td>
                            <td>${test.error || test.reason || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;
        
        fs.writeFileSync(reportPath, html);
        return reportPath;
    }

    async generateCoverageReport() {
        try {
            const { generateInventory } = require('./generate-rpc-inventory');
            const inventory = generateInventory();
            
            const reportPath = path.join(this.outputDir, `rpc-coverage-${Date.now()}.json`);
            
            if (!fs.existsSync(this.outputDir)) {
                fs.mkdirSync(this.outputDir, { recursive: true });
            }
            
            const coverageReport = {
                generated: new Date().toISOString(),
                summary: {
                    total: inventory.total,
                    tested: inventory.tested,
                    untested: inventory.untested,
                    coverage: parseFloat(inventory.coverage)
                },
                tested: inventory.testedRPCs,
                untested: inventory.inventory.filter(r => !r.tested).map(r => ({
                    name: r.name,
                    category: r.category,
                    priority: r.priority
                })),
                byCategory: Object.keys(inventory.byCategory).reduce((acc, cat) => {
                    const rpcs = inventory.byCategory[cat];
                    acc[cat] = {
                        total: rpcs.length,
                        tested: rpcs.filter(r => r.tested).length,
                        untested: rpcs.filter(r => !r.tested).length
                    };
                    return acc;
                }, {})
            };
            
            fs.writeFileSync(reportPath, JSON.stringify(coverageReport, null, 2));
            return reportPath;
        } catch (error) {
            console.error('Failed to generate coverage report:', error);
            return null;
        }
    }

    getSummary() {
        return {
            total: this.results.total,
            passed: this.results.passed,
            failed: this.results.failed,
            skipped: this.results.skipped,
            duration: this.results.duration,
            coverage: this.results.coverage
        };
    }
}

module.exports = TestReporter;

