import fs from 'node:fs';
import path from 'node:path';
import { registerAllTests, framework } from './core/testRegistry.js';

// Register all test suites
registerAllTests();

// Parse CLI arguments
const args = process.argv.slice(2);
let targetSuite = null;
let targetCase = null;
let filterQuery = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--suite' && args[i + 1]) {
    targetSuite = args[i + 1];
    i++;
  } else if (args[i] === '--case' && args[i + 1]) {
    targetCase = args[i + 1];
    i++;
  } else if (args[i] === '--filter' && args[i + 1]) {
    filterQuery = args[i + 1].toLowerCase();
    i++;
  }
}

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bgBlue: "\x1b[44m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m"
};

async function run() {
  console.log(`\n${colors.cyan}${colors.bright}========================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}           💰 MoneyMate Vault - Automated Test Suite Runner            ${colors.reset}`);
  console.log(`${colors.cyan}${colors.bright}========================================================================${colors.reset}\n`);

  let casesToRun = [];

  if (targetCase) {
    console.log(`${colors.yellow}🎯 Target Case:${colors.reset} ${targetCase}`);
    const match = framework.getCaseById(targetCase);
    if (!match) {
      console.error(`${colors.red}❌ Error: Test case "${targetCase}" not found.${colors.reset}`);
      process.exit(1);
    }
    casesToRun = [match.testCase];
  } else if (targetSuite) {
    console.log(`${colors.yellow}🎯 Target Suite:${colors.reset} ${targetSuite}`);
    const suite = framework.suites.find(s => s.name.toLowerCase() === targetSuite.toLowerCase());
    if (!suite) {
      console.error(`${colors.red}❌ Error: Test suite "${targetSuite}" not found.${colors.reset}`);
      console.log(`Available suites: ${framework.suites.map(s => s.name).join(', ')}`);
      process.exit(1);
    }
    casesToRun = suite.cases.map(c => ({ ...c, suiteName: suite.name }));
  } else if (filterQuery) {
    console.log(`${colors.yellow}🔍 Filter Query:${colors.reset} "${filterQuery}"`);
    casesToRun = framework.getAllCases().filter(c => 
      c.id.toLowerCase().includes(filterQuery) ||
      c.name.toLowerCase().includes(filterQuery) ||
      c.description.toLowerCase().includes(filterQuery) ||
      c.suiteName.toLowerCase().includes(filterQuery)
    );
  } else {
    console.log(`${colors.yellow}🚀 Execution Mode:${colors.reset} Running all test cases across all modules\n`);
    casesToRun = framework.getAllCases();
  }

  console.log(`${colors.gray}Total test cases scheduled: ${casesToRun.length}${colors.reset}\n`);
  console.log(`${'STATUS'.padEnd(8)} | ${'ID'.padEnd(12)} | ${'SUITE'.padEnd(16)} | ${'NAME'.padEnd(45)} | ${'DURATION'}`);
  console.log('-'.repeat(95));

  let passed = 0;
  let failed = 0;
  const startTime = Date.now();
  const resultsMatrix = [];

  for (const c of casesToRun) {
    const executedCase = await framework.runCase(c);
    const suiteName = c.suiteName || c.category || 'General';
    const durationStr = `${executedCase.duration}ms`;

    if (executedCase.status === 'passed') {
      passed++;
      console.log(`${colors.green}✅ PASS${colors.reset}  | ${colors.cyan}${executedCase.id.padEnd(12)}${colors.reset} | ${suiteName.padEnd(16)} | ${executedCase.name.padEnd(45).substring(0, 45)} | ${colors.gray}${durationStr}${colors.reset}`);
    } else {
      failed++;
      console.log(`${colors.red}❌ FAIL${colors.reset}  | ${colors.red}${executedCase.id.padEnd(12)}${colors.reset} | ${suiteName.padEnd(16)} | ${executedCase.name.padEnd(45).substring(0, 45)} | ${colors.red}${durationStr}${colors.reset}`);
      if (executedCase.error) {
        console.log(`${colors.red}   └─ Error: ${executedCase.error.message}${colors.reset}`);
      }
    }

    resultsMatrix.push({
      id: executedCase.id,
      suite: suiteName,
      name: executedCase.name,
      description: executedCase.description,
      status: executedCase.status,
      duration: executedCase.duration,
      expectedResult: executedCase.expectedResult,
      error: executedCase.error ? executedCase.error.message : null
    });
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const successRate = casesToRun.length > 0 ? ((passed / casesToRun.length) * 100).toFixed(1) : '0';

  console.log('-'.repeat(95));
  console.log(`\n${colors.bright}Test Run Summary:${colors.reset}`);
  console.log(`  Total Cases:   ${casesToRun.length}`);
  console.log(`  ${colors.green}Passed:        ${passed}${colors.reset}`);
  console.log(`  ${failed > 0 ? colors.red : colors.gray}Failed:        ${failed}${colors.reset}`);
  console.log(`  Success Rate:  ${failed === 0 ? colors.green : colors.yellow}${successRate}%${colors.reset}`);
  console.log(`  Duration:      ${totalTime}s\n`);

  // Write results JSON file
  const resultsJsonPath = path.join(process.cwd(), 'Test', 'latest_results.json');
  fs.writeFileSync(resultsJsonPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: casesToRun.length,
    passed,
    failed,
    successRate: `${successRate}%`,
    durationSeconds: totalTime,
    cases: resultsMatrix
  }, null, 2), 'utf8');

  // Update RESULT_SHEET.md
  generateMarkdownResultSheet(resultsMatrix, passed, failed, successRate, totalTime);

  if (failed > 0) {
    process.exit(1);
  }
}

function generateMarkdownResultSheet(results, passed, failed, successRate, totalTime) {
  const mdPath = path.join(process.cwd(), 'Test', 'RESULT_SHEET.md');
  
  let md = `# 📊 MoneyMate Vault - Automated Test Execution Result Sheet\n\n`;
  md += `**Execution Date**: ${new Date().toLocaleString()}  \n`;
  md += `**Environment**: Node.js ${process.version} / Windows  \n`;
  md += `**Overall Status**: ${failed === 0 ? '🟢 ALL TESTS PASSED' : '🔴 TESTS FAILED'}  \n\n`;
  
  md += `## 📈 Executive Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Total Test Cases** | **${results.length}** |\n`;
  md += `| **Passed Cases** | **${passed}** (${successRate}%) |\n`;
  md += `| **Failed Cases** | **${failed}** |\n`;
  md += `| **Total Execution Duration** | **${totalTime}s** |\n\n`;

  md += `## 📋 Test Case Execution Matrix\n\n`;
  md += `| Case ID | Module / Page | Test Case Name | Expected Result | Status | Duration |\n`;
  md += `| :--- | :--- | :--- | :--- | :---: | :---: |\n`;

  results.forEach(r => {
    const statusBadge = r.status === 'passed' ? '✅ PASS' : '❌ FAIL';
    md += `| \`${r.id}\` | **${r.suite}** | ${r.name} | ${r.expectedResult} | ${statusBadge} | ${r.duration}ms |\n`;
  });

  md += `\n---\n*Report auto-generated by MoneyMate Automated Test Suite Engine.*\n`;

  fs.writeFileSync(mdPath, md, 'utf8');
}

run().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
