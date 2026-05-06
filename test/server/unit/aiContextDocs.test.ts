import * as assert from 'assert/strict';
import * as fs from 'fs';
import * as path from 'path';

suite('unit/aiContextDocs (B378)', () => {
  const workspaceRoot = path.resolve(__dirname, '../../../..');
  const aiContextRelativePath = 'docs/ai-context/powerbuilder-plugin-context.md';
  const aiContextPath = path.join(workspaceRoot, aiContextRelativePath);

  test('context pack existe, sigue compacto y expone headings minimos', () => {
    assert.ok(fs.existsSync(aiContextPath));

    const source = fs.readFileSync(aiContextPath, 'utf8');
    const requiredHeadings = [
      '## Mission',
      '## Architecture boundaries',
      '## PowerBuilder coding rules',
      '## SQL formatting rules',
      '## DataWindow rules',
      '## Catalog/generated/manual/localization rules',
      '## Validation commands and tools',
      '## Recommended AI workflow',
      '## Do not do',
      '## Active focus',
      '## Documentation ownership',
    ];

    for (const heading of requiredHeadings) {
      assert.match(source, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }

    assert.match(source, /workspace-check/);
    assert.match(source, /object-check/);
    assert.match(source, /No pegar datasets `generated\/manual\/localization` completos/i);
    assert.ok(source.length < 9000, 'el context pack debe caber en un prompt pequeno');
  });

  test('context pack sigue referenciado desde la documentacion canonica', () => {
    const ownerDocs = [
      'AGENTS.md',
      'docs/ai-orchestration.md',
      'docs/ai-strategy.md',
      'docs/developer-workflows.md',
      'docs/spec-driven-development.md',
    ];

    for (const relativePath of ownerDocs) {
      const source = fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
      assert.match(
        source,
        /docs\/ai-context\/powerbuilder-plugin-context\.md/,
        `${relativePath} debe seguir referenciando el context pack`,
      );
    }
  });
});