#!/usr/bin/env node

/**
 * RPC Inventory Generator
 * Extracts all registered RPCs from index.js and generates:
 * 1. Complete RPC list
 * 2. Test coverage matrix
 * 3. Categorization by feature/system
 * 4. Priority classification
 */

const fs = require('fs');
const path = require('path');

const INDEX_JS = path.join(__dirname, '../wayfarer-nakama/nakama-data/modules/index.js');
const TEST_RUNNER = path.join(__dirname, 'test-runner.js');

// RPC Categories
const CATEGORIES = {
  QUEST_SYSTEM: 'Quest System',
  PARTY_GROUP: 'Party/Group System',
  ACHIEVEMENT: 'Achievement System',
  INVENTORY_ITEMS: 'Inventory/Items',
  TRADING: 'Trading System',
  EVENTS: 'Events System',
  AUDIO: 'Audio Experiences',
  SOCIAL_MATCHING: 'Social/Matching',
  SAFETY_MODERATION: 'Safety/Moderation',
  VERIFICATION: 'Verification',
  MINI_GAMES: 'Mini-Games',
  PROGRESSION: 'Progression',
  LOCATION: 'Location Services',
  RATING: 'Rating System'
};

// Priority levels
const PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Extract RPC names from index.js
function extractRPCs() {
  const content = fs.readFileSync(INDEX_JS, 'utf8');
  const rpcRegex = /initializer\.registerRpc\(['"]([^'"]+)['"]/g;
  const rpcs = [];
  let match;
  
  while ((match = rpcRegex.exec(content)) !== null) {
    rpcs.push(match[1]);
  }
  
  return rpcs.sort();
}

// Extract tested RPCs from test-runner.js
function extractTestedRPCs() {
  const content = fs.readFileSync(TEST_RUNNER, 'utf8');
  const tested = new Set();
  
  // Pattern 1: callRpc(session, 'rpc_name', ...)
  const rpcRegex1 = /callRpc\([^,]+,\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = rpcRegex1.exec(content)) !== null) {
    tested.add(match[1]);
  }
  
  // Pattern 2: client.rpc(session, 'rpc_name', ...) - used in TestDataFactory
  const rpcRegex2 = /client\.rpc\([^,]+,\s*['"]([^'"]+)['"]/g;
  while ((match = rpcRegex2.exec(content)) !== null) {
    tested.add(match[1]);
  }
  
  return Array.from(tested).sort();
}

// Categorize RPC by feature
function categorizeRPC(rpcName) {
  const name = rpcName.toLowerCase();
  
  // Quest System
  if (name.includes('quest') || name.includes('scavenger') || name.includes('mystery') || 
      name.includes('single_task') || name.includes('step') || name.includes('rating')) {
    if (name.includes('rating')) return CATEGORIES.RATING;
    if (name.includes('step')) return CATEGORIES.QUEST_SYSTEM;
    return CATEGORIES.QUEST_SYSTEM;
  }
  
  // Party/Group
  if (name.includes('party') || name.includes('vote') || name.includes('subgroup') || 
      name.includes('group_pool') || name.includes('objective')) {
    return CATEGORIES.PARTY_GROUP;
  }
  
  // Achievement
  if (name.includes('achievement') || name.includes('badge') || name.includes('level')) {
    if (name.includes('level')) return CATEGORIES.PROGRESSION;
    return CATEGORIES.ACHIEVEMENT;
  }
  
  // Inventory/Items
  if (name.includes('inventory') || name.includes('item') || name.includes('collection') || 
      name.includes('discover')) {
    if (name.includes('trade')) return CATEGORIES.TRADING;
    return CATEGORIES.INVENTORY_ITEMS;
  }
  
  // Trading
  if (name.includes('trade')) {
    return CATEGORIES.TRADING;
  }
  
  // Events
  if (name.includes('event')) {
    return CATEGORIES.EVENTS;
  }
  
  // Audio
  if (name.includes('audio')) {
    return CATEGORIES.AUDIO;
  }
  
  // Social/Matching
  if (name.includes('match') || name.includes('preference') || name.includes('activity_pattern')) {
    return CATEGORIES.SOCIAL_MATCHING;
  }
  
  // Safety/Moderation
  if (name.includes('safety') || name.includes('report') || name.includes('feedback')) {
    return CATEGORIES.SAFETY_MODERATION;
  }
  
  // Verification
  if (name.includes('verification')) {
    return CATEGORIES.VERIFICATION;
  }
  
  // Mini-Games
  if (name.includes('quiz') || name.includes('observation') || name.includes('mini_game')) {
    return CATEGORIES.MINI_GAMES;
  }
  
  // Location
  if (name.includes('location') || name.includes('places_nearby')) {
    return CATEGORIES.LOCATION;
  }
  
  // Progression
  if (name.includes('leaderboard') || name.includes('xp')) {
    return CATEGORIES.PROGRESSION;
  }
  
  return 'Uncategorized';
}

// Determine priority
function determinePriority(rpcName, category, isTested) {
  const name = rpcName.toLowerCase();
  
  // Critical: Core quest flow, user progression, basic party features
  if (isTested) {
    return PRIORITY.CRITICAL; // Already tested = critical
  }
  
  if (name.includes('update_user_location') || 
      name.includes('get_available_quests') ||
      name.includes('start_quest') ||
      name.includes('complete_quest') ||
      name.includes('get_user_level') ||
      name.includes('create_party') ||
      name.includes('join_party')) {
    return PRIORITY.CRITICAL;
  }
  
  // High: Quest generation, step progression, party management
  if (name.includes('generate') || 
      name.includes('complete_step') ||
      name.includes('submit_step') ||
      name.includes('leave_party') ||
      name.includes('get_party_members') ||
      name.includes('get_user_quests') ||
      name.includes('get_quest_detail')) {
    return PRIORITY.HIGH;
  }
  
  // Medium: Advanced features, optional systems
  if (category === CATEGORIES.MINI_GAMES ||
      category === CATEGORIES.AUDIO ||
      category === CATEGORIES.TRADING ||
      category === CATEGORIES.SOCIAL_MATCHING) {
    return PRIORITY.MEDIUM;
  }
  
  // Low: Admin/analytics, optional features
  if (name.includes('analytics') ||
      name.includes('queue') ||
      name.includes('create_quiz_question') ||
      name.includes('create_observation_puzzle')) {
    return PRIORITY.LOW;
  }
  
  return PRIORITY.MEDIUM;
}

// Generate RPC inventory
function generateInventory() {
  const allRPCs = extractRPCs();
  const testedRPCs = extractTestedRPCs();
  const testedSet = new Set(testedRPCs);
  
  const inventory = allRPCs.map(rpc => {
    const category = categorizeRPC(rpc);
    const isTested = testedSet.has(rpc);
    const priority = determinePriority(rpc, category, isTested);
    
    return {
      name: rpc,
      category,
      priority,
      tested: isTested,
      testedIn: isTested ? 'test-runner.js' : null
    };
  });
  
  // Group by category
  const byCategory = {};
  inventory.forEach(rpc => {
    if (!byCategory[rpc.category]) {
      byCategory[rpc.category] = [];
    }
    byCategory[rpc.category].push(rpc);
  });
  
  // Group by priority
  const byPriority = {};
  inventory.forEach(rpc => {
    if (!byPriority[rpc.priority]) {
      byPriority[rpc.priority] = [];
    }
    byPriority[rpc.priority].push(rpc);
  });
  
  return {
    total: allRPCs.length,
    tested: testedRPCs.length,
    untested: allRPCs.length - testedRPCs.length,
    coverage: ((testedRPCs.length / allRPCs.length) * 100).toFixed(1),
    inventory,
    byCategory,
    byPriority,
    allRPCs,
    testedRPCs
  };
}

// Generate markdown report
function generateMarkdownReport(data) {
  let md = `# RPC Test Coverage Report\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `- **Total RPCs:** ${data.total}\n`;
  md += `- **Tested:** ${data.tested}\n`;
  md += `- **Untested:** ${data.untested}\n`;
  md += `- **Coverage:** ${data.coverage}%\n\n`;
  
  md += `## Coverage by Priority\n\n`;
  Object.keys(PRIORITY).forEach(priority => {
    const rpcs = data.byPriority[PRIORITY[priority]] || [];
    const tested = rpcs.filter(r => r.tested).length;
    const total = rpcs.length;
    md += `### ${priority.charAt(0) + priority.slice(1).toLowerCase()} Priority (${tested}/${total} tested)\n\n`;
    rpcs.forEach(rpc => {
      const status = rpc.tested ? '✅' : '❌';
      md += `- ${status} \`${rpc.name}\` (${rpc.category})\n`;
    });
    md += '\n';
  });
  
  md += `## Coverage by Category\n\n`;
  Object.keys(data.byCategory).sort().forEach(category => {
    const rpcs = data.byCategory[category];
    const tested = rpcs.filter(r => r.tested).length;
    const total = rpcs.length;
    md += `### ${category} (${tested}/${total} tested)\n\n`;
    rpcs.forEach(rpc => {
      const status = rpc.tested ? '✅' : '❌';
      md += `- ${status} \`${rpc.name}\` [${rpc.priority}]\n`;
    });
    md += '\n';
  });
  
  md += `## Complete RPC List\n\n`;
  md += `### Tested RPCs (${data.tested})\n\n`;
  data.testedRPCs.forEach(rpc => {
    md += `- \`${rpc}\`\n`;
  });
  
  md += `\n### Untested RPCs (${data.untested})\n\n`;
  data.inventory
    .filter(rpc => !rpc.tested)
    .forEach(rpc => {
      md += `- \`${rpc.name}\` [${rpc.category}, ${rpc.priority}]\n`;
    });
  
  return md;
}

// Generate JSON report
function generateJSONReport(data) {
  return JSON.stringify({
    generated: new Date().toISOString(),
    summary: {
      total: data.total,
      tested: data.tested,
      untested: data.untested,
      coverage: parseFloat(data.coverage)
    },
    rpcs: data.inventory,
    byCategory: Object.keys(data.byCategory).reduce((acc, cat) => {
      acc[cat] = data.byCategory[cat].map(r => ({
        name: r.name,
        priority: r.priority,
        tested: r.tested
      }));
      return acc;
    }, {}),
    byPriority: Object.keys(data.byPriority).reduce((acc, pri) => {
      acc[pri] = data.byPriority[pri].map(r => ({
        name: r.name,
        category: r.category,
        tested: r.tested
      }));
      return acc;
    }, {})
  }, null, 2);
}

// Main execution
function main() {
  console.log('🔍 Extracting RPC inventory...');
  const data = generateInventory();
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total RPCs: ${data.total}`);
  console.log(`   Tested: ${data.tested}`);
  console.log(`   Untested: ${data.untested}`);
  console.log(`   Coverage: ${data.coverage}%`);
  
  // Write reports
  const mdReport = generateMarkdownReport(data);
  const jsonReport = generateJSONReport(data);
  
  const mdPath = path.join(__dirname, 'RPC_COVERAGE_REPORT.md');
  const jsonPath = path.join(__dirname, 'rpc-inventory.json');
  
  fs.writeFileSync(mdPath, mdReport);
  fs.writeFileSync(jsonPath, jsonReport);
  
  console.log(`\n✅ Reports generated:`);
  console.log(`   ${mdPath}`);
  console.log(`   ${jsonPath}`);
  
  // Print untested critical/high priority RPCs
  const criticalUntested = data.inventory.filter(r => 
    !r.tested && (r.priority === PRIORITY.CRITICAL || r.priority === PRIORITY.HIGH)
  );
  
  if (criticalUntested.length > 0) {
    console.log(`\n⚠️  Untested Critical/High Priority RPCs (${criticalUntested.length}):`);
    criticalUntested.forEach(rpc => {
      console.log(`   - ${rpc.name} [${rpc.category}, ${rpc.priority}]`);
    });
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateInventory, extractRPCs, extractTestedRPCs };

