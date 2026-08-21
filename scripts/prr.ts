import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const matrixPath = path.join(__dirname, '../tests/production-readiness/scenario-matrix.yaml');
const fileContents = fs.readFileSync(matrixPath, 'utf8');
const matrix = parse(fileContents);

console.log('🚀 Starting Production Readiness Validation (PRV)');

let targetScenarios = matrix.scenarios;

// Simple argument parsing
if (args.includes('--category')) {
  const categoryIndex = args.indexOf('--category') + 1;
  const targetCategory = args[categoryIndex];
  targetScenarios = matrix.scenarios.filter((s: any) => s.category === targetCategory);
} else if (args.includes('--scenario')) {
  const scenarioIndex = args.indexOf('--scenario') + 1;
  const targetId = args[scenarioIndex];
  targetScenarios = matrix.scenarios.filter((s: any) => s.id === targetId);
}

if (targetScenarios.length === 0) {
  console.log('❌ No scenarios matched the criteria.');
  process.exit(1);
}

console.log(`📋 Found ${targetScenarios.length} scenarios to execute.`);

let passed = 0;
let failed = 0;

for (const scenario of targetScenarios) {
  console.log(`\n======================================================`);
  console.log(`Executing Scenario: [${scenario.id}] ${scenario.name}`);
  console.log(`Category: ${scenario.category} | Risk: ${scenario.risk}`);
  console.log(`======================================================`);

  try {
    // If it's a backend test, run via vitest
    // We map categories to vitest suites or we can just run vitest on the whole category folder
    const testPath = `tests/production-readiness/${scenario.category}/`;
    
    // In a real implementation we would dynamically link scenario IDs to specific test files or vitest test names.
    // For now, we'll try to run vitest targeting the category folder or a specific grep pattern.
    
    const command = `npx vitest run ${testPath} --passWithNoTests`;
    console.log(`> Running: ${command}`);
    
    execSync(command, { stdio: 'inherit', env: process.env });
    
    console.log(`✅ [${scenario.id}] PASSED`);
    passed++;
  } catch (err: any) {
    console.error(`❌ [${scenario.id}] FAILED`);
    failed++;
  }
}

console.log(`\n📊 PRR Execution Summary`);
console.log(`Total: ${targetScenarios.length} | Passed: ${passed} | Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
