
import { describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const yamlPath = path.join(__dirname, '../scenario-matrix.yaml');
const parsed = yaml.parse(fs.readFileSync(yamlPath, 'utf8'));
// Filter for scenarios that are auto-generated
const myScenarios = parsed.scenarios.filter((s: any) => s.category === 'promo' && s.actor.includes('system_generator'));

if (myScenarios.length > 0) {
  describe('Generated Permutations: PROMO', () => {
    for (const scenario of myScenarios) {
      it.todo(`${scenario.id}: ${scenario.name}`);
    }
  });
}
