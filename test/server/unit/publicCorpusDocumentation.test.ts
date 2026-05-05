import * as assert from 'assert/strict';
import * as fs from 'fs';
import * as path from 'path';

import { resolveRepoRoot } from '../helpers/fixtureLoader';
import { getMaterializedPublicCorpusSlots } from '../helpers/publicCorpusPaths';

function extractSection(content: string, heading: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`## ${escapedHeading}\\n\\n([\\s\\S]*?)(?:\\n## |$)`));
  return match?.[1] ?? '';
}

suite('unit/publicCorpusDocumentation', () => {
  test('documenta como materializados solo los slots publicos reales del checkout', () => {
    const readmePath = path.join(resolveRepoRoot(), 'test', 'corpora', 'README.md');
    const content = fs.readFileSync(readmePath, 'utf8');
    const materializedSection = extractSection(content, 'Slots públicos materializados actualmente');
    const optionalSection = extractSection(content, 'Slots públicos opcionales no materializados por defecto');

    assert.ok(materializedSection.length > 0, 'Debe existir una sección de slots materializados.');
    assert.ok(optionalSection.length > 0, 'Debe existir una sección de slots opcionales no materializados.');

    for (const slot of getMaterializedPublicCorpusSlots()) {
      assert.match(materializedSection, new RegExp(`fixtures-local/public/${slot}`));
    }

    for (const optionalSlot of ['datawindow-examples', 'orca-build-examples', 'native-pbni-examples', 'modern-integrations']) {
      assert.doesNotMatch(materializedSection, new RegExp(`fixtures-local/public/${optionalSlot}`));
      assert.match(optionalSection, new RegExp(`fixtures-local/public/${optionalSlot}`));
    }
  });
});