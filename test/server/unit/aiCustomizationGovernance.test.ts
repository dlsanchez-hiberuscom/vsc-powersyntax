import * as assert from 'assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');

function readWorkspaceFile(relativePath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

suite.skip('unit/aiCustomizationGovernance (Bloque 10)', () => {
  test('docs/ai-orchestration.md es el mapa canonico de customizations AI', () => {
    const source = readWorkspaceFile('docs/ai-orchestration.md');

    for (const heading of [
      '## AI Customization Map',
      '## Instructions Policy',
      '## Prompt Files Contract',
      '## Agents And Skills',
      '## Public Read-Only AI Contracts',
      '## Context Bundles',
      '## Tools, MCP And Chat Policy',
      '## Safe Edit And Write-Enabled Policy',
      '## Agent Validation Checklist',
      '## Token Budget And Maintenance',
      '## Security And Data Exposure',
    ]) {
      assert.match(source, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }

    for (const requiredPath of [
      'AGENTS.md',
      '.github/copilot-instructions.md',
      '.github/instructions',
      '.github/prompts',
      '.github/agents',
      '.github/skills',
      'docs/ai/README.md',
      'docs/ai-context/powerbuilder-plugin-context.md',
    ]) {
      assert.ok(source.includes(requiredPath), `${requiredPath} debe aparecer en el mapa AI`);
    }
  });

  test('documenta contratos read-only, context bundles y safe-edit antes de writes', () => {
    const source = readWorkspaceFile('docs/ai-orchestration.md');

    for (const contract of [
      'ApiAiTaskContextBundle',
      'ApiReadOnlyToolBridgeDescriptor',
      'ApiServerStats',
      'DataWindowFastContext',
      'safe-edit-plan',
      'impact analysis',
      'validation receipt',
      'rollback strategy',
    ]) {
      assert.ok(source.includes(contract), `${contract} debe estar documentado`);
    }

    assert.match(source, /does not enable a new MCP server by default/i);
    assert.match(source, /historical `plugin_old` language model tooling/i);
    assert.match(source, /Do not expose secrets/i);
  });

  test('todos los prompt files ejecutables usan extension .prompt.md', () => {
    const promptsRoot = path.join(REPO_ROOT, '.github', 'prompts');
    const invalid = fs.readdirSync(promptsRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => !name.endsWith('.prompt.md'));

    assert.deepEqual(invalid, []);
  });
});