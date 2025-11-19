#!/usr/bin/env node

/**
 * Coverage Validation Script
 * Validates that all RPCs are tested and generates final coverage report
 */

const { generateInventory } = require('./generate-rpc-inventory');
const fs = require('fs');
const path = require('path');

// Extract tested RPCs from all test files
function extractAllTestedRPCs() {
    const testDir = path.join(__dirname, 'tests');
    const tested = new Set();
    
    // Read all test files
    const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js'));
    
    testFiles.forEach(file => {
        const content = fs.readFileSync(path.join(testDir, file), 'utf8');
        
        // Pattern 1: RpcHelper.callSuccess(session, 'rpc_name', ...)
        const pattern1 = /RpcHelper\.call(Success|Failure)?\([^,]+,\s*['"]([^'"]+)['"]/g;
        let match;
        while ((match = pattern1.exec(content)) !== null) {
            tested.add(match[2]);
        }
        
        // Pattern 2: Factory methods that call RPCs
        const pattern2 = /await\s+\w+Factory\.\w+\([^)]*\)/g;
        // This is handled by the factories themselves
        
        // Pattern 3: Direct RPC calls in test files
        const pattern3 = /['"](\w+_\w+)['"]/g;
        // Too broad, but we'll use it as a fallback
    });
    
    // Also check the original test-runner.js
    const oldRunner = path.join(__dirname, 'test-runner.js');
    if (fs.existsSync(oldRunner)) {
        const content = fs.readFileSync(oldRunner, 'utf8');
        const pattern = /callRpc\([^,]+,\s*['"]([^'"]+)['"]/g;
        let match;
        while ((match = pattern.exec(content)) !== null) {
            tested.add(match[1]);
        }
        
        const pattern2 = /client\.rpc\([^,]+,\s*['"]([^'"]+)['"]/g;
        while ((match = pattern2.exec(content)) !== null) {
            tested.add(match[1]);
        }
    }
    
    return Array.from(tested).sort();
}

// Generate validation report
function generateValidationReport() {
    console.log('🔍 Validating RPC test coverage...\n');
    
    const inventory = generateInventory();
    const allTested = extractAllTestedRPCs();
    const testedSet = new Set(allTested);
    
    // Update inventory with all tested RPCs
    inventory.inventory.forEach(rpc => {
        rpc.tested = testedSet.has(rpc.name);
    });
    
    // Recalculate coverage
    const tested = inventory.inventory.filter(r => r.tested).length;
    const untested = inventory.inventory.filter(r => !r.tested);
    const coverage = ((tested / inventory.total) * 100).toFixed(1);
    
    console.log('📊 Coverage Summary:');
    console.log(`   Total RPCs: ${inventory.total}`);
    console.log(`   Tested: ${tested}`);
    console.log(`   Untested: ${untested.length}`);
    console.log(`   Coverage: ${coverage}%\n`);
    
    // Group untested by priority
    const untestedByPriority = {
        critical: untested.filter(r => r.priority === 'critical'),
        high: untested.filter(r => r.priority === 'high'),
        medium: untested.filter(r => r.priority === 'medium'),
        low: untested.filter(r => r.priority === 'low')
    };
    
    console.log('⚠️  Untested RPCs by Priority:');
    Object.keys(untestedByPriority).forEach(priority => {
        const rpcs = untestedByPriority[priority];
        if (rpcs.length > 0) {
            console.log(`\n   ${priority.toUpperCase()} (${rpcs.length}):`);
            rpcs.forEach(rpc => {
                console.log(`     - ${rpc.name} [${rpc.category}]`);
            });
        }
    });
    
    // Check for untestable RPCs (admin-only, etc.)
    const untestable = [];
    const adminRPCs = [
        'get_feedback_analytics',
        'get_report_queue',
        'update_report_status',
        'process_feedback_categorization',
        'create_quiz_question',
        'create_observation_puzzle'
    ];
    
    adminRPCs.forEach(rpcName => {
        if (!testedSet.has(rpcName)) {
            untestable.push({
                name: rpcName,
                reason: 'Requires admin permissions'
            });
        }
    });
    
    if (untestable.length > 0) {
        console.log('\n📝 Untestable RPCs (require special permissions):');
        untestable.forEach(rpc => {
            console.log(`   - ${rpc.name}: ${rpc.reason}`);
        });
    }
    
    // Generate final report
    const report = {
        generated: new Date().toISOString(),
        summary: {
            total: inventory.total,
            tested: tested,
            untested: untested.length,
            coverage: parseFloat(coverage),
            untestable: untestable.length
        },
        tested: inventory.inventory.filter(r => r.tested).map(r => r.name),
        untested: untested.map(r => ({
            name: r.name,
            category: r.category,
            priority: r.priority
        })),
        untestable: untestable,
        byCategory: Object.keys(inventory.byCategory).reduce((acc, cat) => {
            const rpcs = inventory.byCategory[cat];
            acc[cat] = {
                total: rpcs.length,
                tested: rpcs.filter(r => r.tested).length,
                untested: rpcs.filter(r => !r.tested).length,
                coverage: ((rpcs.filter(r => r.tested).length / rpcs.length) * 100).toFixed(1)
            };
            return acc;
        }, {})
    };
    
    // Save report
    const reportPath = path.join(__dirname, 'test-results', 'coverage-validation.json');
    if (!fs.existsSync(path.dirname(reportPath))) {
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n✅ Validation report saved: ${reportPath}`);
    
    // Return exit code based on critical/high untested
    const criticalUntested = untestedByPriority.critical.length;
    const highUntested = untestedByPriority.high.length;
    
    if (criticalUntested > 0 || highUntested > 0) {
        console.log(`\n⚠️  Warning: ${criticalUntested} critical and ${highUntested} high priority RPCs are untested`);
        return 1;
    }
    
    return 0;
}

// Run validation
if (require.main === module) {
    const exitCode = generateValidationReport();
    process.exit(exitCode);
}

module.exports = { generateValidationReport, extractAllTestedRPCs };

