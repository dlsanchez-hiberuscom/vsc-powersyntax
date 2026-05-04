import * as assert from 'assert/strict';
import * as fs from 'fs';
import * as path from 'path';

import { resolveRepoRoot } from '../helpers/fixtureLoader';

suite('unit/agentDocsPolicy (B302)', () => {
  test('docs-updater y docs-auditor aplican ownership y no permiten updates ciegos', () => {
    const repoRoot = resolveRepoRoot();
    const docsUpdater = fs.readFileSync(path.join(repoRoot, '.github', 'agents', 'docs-updater.agent.md'), 'utf8');
    const docsAuditor = fs.readFileSync(path.join(repoRoot, '.github', 'agents', 'docs-auditor.agent.md'), 'utf8');

    assert.match(docsUpdater, /Actualiza solo los documentos realmente afectados\./);
    assert.match(docsUpdater, /No inventes capacidades que no existen en el código\./);
    assert.match(docsAuditor, /No marques como implementado algo que solo está planificado\./);
    assert.match(docsAuditor, /Documentos potencialmente afectados/);
  });

  test('el context pack IA mantiene ownership documental y delega el foco vivo a docs/current-focus.md', () => {
    const repoRoot = resolveRepoRoot();
    const aiContext = fs.readFileSync(path.join(repoRoot, 'docs', 'ai-context', 'powerbuilder-plugin-context.md'), 'utf8');

    assert.match(aiContext, /Documentation ownership/);
    assert.match(aiContext, /docs\/current-focus\.md/);
    assert.doesNotMatch(aiContext, /B320 — DataWindow expression\/property official catalog/);
  });
});