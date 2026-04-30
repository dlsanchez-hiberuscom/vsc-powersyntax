import * as assert from 'assert/strict';
import { DiagnosticSeverity, Range } from 'vscode-languageserver/node';
import { provideCodeActions } from '../../../src/server/features/codeActions';

suite('unit/codeActions (B036)', () => {
  test('genera quick-fix para SD7 con sugerencia', () => {
    const content = 'Yield()\n';
    const d = {
      severity: DiagnosticSeverity.Warning,
      range: Range.create(0, 0, 0, 5),
      message: "'Yield' está marcada como obsoleta. Sugerencia: DoEvents.",
      source: 'PowerScript:SD7'
    };
    const actions = provideCodeActions('file:///x', content, [d]);
    assert.equal(actions.length, 1);
    assert.match(actions[0].title, /DoEvents/);
    const edit = actions[0].edit?.changes?.['file:///x']?.[0];
    assert.equal(edit?.newText, 'DoEvents');
  });

  test('sin sugerencia → sin acción', () => {
    const d = {
      severity: DiagnosticSeverity.Warning,
      range: Range.create(0, 0, 0, 5),
      message: "obsoleto sin sugerencia",
      source: 'PowerScript:SD7'
    };
    assert.equal(provideCodeActions('file:///x', 'X()\n', [d]).length, 0);
  });

  test('source distinto se ignora', () => {
    const d = {
      severity: DiagnosticSeverity.Warning,
      range: Range.create(0, 0, 0, 5),
      message: 'Sugerencia: A.',
      source: 'PowerScript:SD1'
    };
    assert.equal(provideCodeActions('file:///x', 'X()\n', [d]).length, 0);
  });
});
