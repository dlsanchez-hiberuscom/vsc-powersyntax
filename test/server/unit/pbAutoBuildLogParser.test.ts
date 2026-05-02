import * as assert from 'assert/strict';

import {
  parsePbAutoBuildLog,
  summarizePbAutoBuildLogIssues,
} from '../../../src/server/build/pbAutoBuildLogParser';

suite('unit/pbAutoBuildLogParser (B184)', () => {
  test('parsea errores PBC con objeto y códigos reales de PBAutoBuild', () => {
    const parsed = parsePbAutoBuildLog([
      '07:49:32 [Normal]  Library: c:\\temp\\demo\\app.pbl',
      '07:49:32 [Normal]      Object: w_demo',
      '07:49:32 [Error]          (0004): Error       C0001: Illegal data type: u_dwstandard',
      "07:49:32 [Error] 'Application' failed to compile",
      'Bye (-_-)',
    ].join('\n'));

    assert.equal(parsed.issues.length, 1);
    assert.equal(parsed.issues[0]?.objectName, 'w_demo');
    assert.equal(parsed.issues[0]?.libraryPath, 'c:\\temp\\demo\\app.pbl');
    assert.equal(parsed.issues[0]?.compilerCode, 'C0001');
    assert.equal(parsed.issues[0]?.nativeCode, '0004');
    assert.equal(parsed.issues[0]?.message, 'C0001: Illegal data type: u_dwstandard');
  });

  test('conserva warnings simples sin patrón de código del compilador', () => {
    const parsed = parsePbAutoBuildLog([
      '07:49:32 [Normal]  Library: c:\\temp\\demo\\app.pbl',
      '07:49:32 [Normal]      Object: d_customer',
      '07:49:32 [Warning]          This object uses an unsupported feature',
    ].join('\n'));

    assert.equal(parsed.issues.length, 1);
    assert.equal(parsed.issues[0]?.objectName, 'd_customer');
    assert.equal(parsed.issues[0]?.category, 'Warning');
    assert.equal(parsed.issues[0]?.message, 'This object uses an unsupported feature');
  });

  test('resume categorías y bibliotecas de forma estructurada', () => {
    const parsed = parsePbAutoBuildLog([
      '07:49:32 [Normal]  Library: c:\\temp\\demo\\app.pbl',
      '07:49:32 [Normal]      Object: w_demo',
      '07:49:32 [Error]          (0004): Error       C0001: Illegal data type: u_dwstandard',
      '07:49:33 [Normal]      Object: d_customer',
      '07:49:33 [Warning]          This object uses an unsupported feature',
      '07:49:34 [Normal]  Library: c:\\temp\\demo\\shared.pbl',
      '07:49:34 [Normal]      Object: n_service',
      '07:49:34 [Error]          (0101): Fatal       C9999: Internal compiler failure',
    ].join('\n'));
    const summary = summarizePbAutoBuildLogIssues(parsed.issues);

    assert.equal(summary.errorCount, 1);
    assert.equal(summary.warningCount, 1);
    assert.equal(summary.fatalCount, 1);
    assert.deepEqual(
      summary.categories.map((category) => [category.category, category.issueCount]),
      [
        ['Fatal', 1],
        ['Error', 1],
        ['Warning', 1],
      ]
    );
    assert.equal(summary.libraries.length, 2);
    assert.equal(summary.libraries[0]?.libraryPath, 'c:\\temp\\demo\\app.pbl');
    assert.deepEqual(summary.libraries[0]?.objectNames, ['d_customer', 'w_demo']);
    assert.equal(summary.libraries[1]?.libraryPath, 'c:\\temp\\demo\\shared.pbl');
  });
});