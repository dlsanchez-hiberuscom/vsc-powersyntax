import * as assert from 'assert/strict';
import * as fs from 'fs';
import * as path from 'path';

suite.skip('unit/aiContextDocs (B378)', () => {
  const workspaceRoot = path.resolve(__dirname, '../../../..');
  const aiContextRelativePath = 'docs/ai-context/powerbuilder-plugin-context.md';
  const aiContextPath = path.join(workspaceRoot, aiContextRelativePath);

  test('context pack existe, sigue compacto y expone headings minimos', () => {
    assert.ok(fs.existsSync(aiContextPath));

    const source = fs.readFileSync(aiContextPath, 'utf8');
    const requiredHeadings = [
      '## 1. Propósito',
      '## 2. Producto',
      '## 3. Arquitectura mental',
      '## 4. PowerBuilder no es lenguaje genérico',
      '## 5. Hot paths críticos',
      '## 6. Reglas de DataWindow',
      '## 7. Reglas de integración externa',
      '## 8. Reglas documentales para agentes',
      '## 9. Reglas de implementación para agentes',
      '## 10. Documentos grandes a evitar salvo necesidad',
    ];

    for (const heading of requiredHeadings) {
      assert.match(source, new RegExp(heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }

    assert.match(source, /arquitectura completa/);
    assert.match(source, /Documentos grandes a evitar/);
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