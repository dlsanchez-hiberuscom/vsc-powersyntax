import * as assert from 'assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');

suite('unit/catalogGeneratorScript', () => {
  test('official catalog generator apunta al layout actual del servidor', async () => {
    const scriptPath = path.join(REPO_ROOT, 'script', 'generate_official_function_catalog.cjs');
    const content = await fs.readFile(scriptPath, 'utf8');

    assert.match(content, /out\/server\/knowledge\/system\/services\/queryService/);
    assert.match(content, /out\/server\/knowledge\/system\/normalization/);
    assert.match(content, /src\/server\/knowledge\/system\/generated\/generated\.generated\.ts/);
    assert.match(content, /src\/server\/knowledge\/system\/generated\/enumeratedTypes\.generated\.ts/);
    assert.match(content, /src\/server\/knowledge\/system\/generated\/enumeratedValues\.generated\.ts/);
    assert.match(content, /src\/server\/knowledge\/system\/generated\/enumeratedCoverage\.generated\.ts/);
    assert.match(content, /src\/server\/knowledge\/system\/generated\/enumeratedProvenance\.generated\.ts/);
    assert.match(content, /src\/server\/knowledge\/system\/generated\/officialCoverage\.generated\.ts/);
    assert.match(content, /src\/server\/parsing\/generatedKeywordLexemes\.generated\.ts/);
    assert.doesNotMatch(content, /out\/powerbuilder\/knowledge/);
    assert.doesNotMatch(content, /src\/powerbuilder\/knowledge\/generated/);
  });

  test('ruta plural scripts mantiene compatibilidad con documentación externa', async () => {
    const wrapperPath = path.join(REPO_ROOT, 'scripts', 'generate_official_function_catalog.cjs');
    const content = await fs.readFile(wrapperPath, 'utf8');

    assert.match(content, /script\/generate_official_function_catalog\.cjs/);
  });

  test('officialCoverage generado publica dominios oficiales relevantes además de events/statements', async () => {
    const coveragePath = path.join(REPO_ROOT, 'src', 'server', 'knowledge', 'system', 'generated', 'officialCoverage.generated.ts');
    const content = await fs.readFile(coveragePath, 'utf8');

    assert.match(content, /"global-functions"/);
    assert.match(content, /"object-functions"/);
    assert.match(content, /"datawindow-functions"/);
    assert.match(content, /"keywords"/);
    assert.match(content, /"reserved-words"/);
    assert.match(content, /"datatypes"/);
    assert.match(content, /"system-object-datatypes"/);
    assert.match(content, /"system-events"/);
    assert.match(content, /"statements"/);
  });

  test('keyword lexemes generated reflejan reserved words oficiales relevantes', async () => {
    const lexemesPath = path.join(REPO_ROOT, 'src', 'server', 'parsing', 'generatedKeywordLexemes.generated.ts');
    const content = await fs.readFile(lexemesPath, 'utf8');

    assert.match(content, /"commit"/);
    assert.match(content, /"namespace"/);
    assert.match(content, /"with"/);
  });

  test('enumerated coverage generated publica dominios oficiales de tipos y valores', async () => {
    const coveragePath = path.join(REPO_ROOT, 'src', 'server', 'knowledge', 'system', 'generated', 'enumeratedCoverage.generated.ts');
    const content = await fs.readFile(coveragePath, 'utf8');

    assert.match(content, /"enumerated-types"/);
    assert.match(content, /"enumerated-values"/);
    assert.match(content, /measurement: "lookup-key"/);
    assert.match(content, /measurement: "type-name-value"/);
  });
});