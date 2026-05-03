import * as assert from 'assert/strict';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { DIAGNOSTIC_CODES } from '../../../src/shared/diagnosticCodes';
import { buildDiagnosticsForDocument } from '../../../src/server/features/diagnostics';

suite('unit/diagnosticsObsoleteIntegration (B262)', () => {
  test('publica SD7 en el pipeline general para funciones obsoletas', () => {
    const document = TextDocument.create(
      'file:///obsolete-integration.sru',
      'powerbuilder',
      1,
      [
        'forward',
        'global type uo_demo from nonvisualobject',
        'end forward',
        '',
        'public function integer of_run()',
        '    RunFork("demo.exe")',
        '    return 0',
        'end function'
      ].join('\n')
    );

    const diagnostics = buildDiagnosticsForDocument(document);
    const obsolete = diagnostics.find((diagnostic) => diagnostic.code === DIAGNOSTIC_CODES.sd7ObsoleteFunction);

    assert.ok(obsolete, 'El pipeline general debería publicar SD7 para RunFork().');
    assert.match(obsolete?.message ?? '', /RunFork/);
  });
});