import * as assert from 'assert/strict';
import { DiagnosticSeverity, Range } from 'vscode-languageserver/node';

import { DIAGNOSTIC_CODES } from '../../../src/shared/diagnosticCodes';
import { provideCodeActions } from '../../../src/server/features/codeActions';

suite('unit/codeActions (B036)', () => {
  test('genera quick-fix para SD7 con sugerencia', () => {
    const content = 'Yield()\n';
    const d = {
      severity: DiagnosticSeverity.Warning,
      range: Range.create(0, 0, 0, 5),
      message: "'Yield' está marcada como obsoleta. Sugerencia: DoEvents.",
      source: 'PowerScript:SD7',
      code: DIAGNOSTIC_CODES.sd7ObsoleteFunction
    };
    const actions = provideCodeActions('file:///x', content, [d]);
    assert.equal(actions.length, 1);
    assert.match(actions[0].title, /DoEvents/);
    const edit = actions[0].edit?.changes?.['file:///x']?.[0];
    assert.equal(edit?.newText, 'DoEvents');
    assert.deepEqual(actions[0].data, {
      actionId: 'obsolete-function-replacement',
      catalogVersion: '2.0.0',
      evidence: 'diagnostic:SD7',
      confidence: 'high',
      requiredConfidence: 'high',
      safeEdit: 'single-range-replacement',
      preview: {
        kind: 'single-range-replacement',
        original: 'Yield',
        replacement: 'DoEvents'
      },
      invocationRisk: 'safe',
      riskReasons: []
    });
  });

  test('sin sugerencia → sin acción', () => {
    const d = {
      severity: DiagnosticSeverity.Warning,
      range: Range.create(0, 0, 0, 5),
      message: "obsoleto sin sugerencia",
      source: 'PowerScript:SD7',
      code: DIAGNOSTIC_CODES.sd7ObsoleteFunction
    };
    assert.equal(provideCodeActions('file:///x', 'X()\n', [d]).length, 0);
  });

  test('source distinto se ignora', () => {
    const d = {
      severity: DiagnosticSeverity.Warning,
      range: Range.create(0, 0, 0, 5),
      message: 'Sugerencia: A.',
      source: 'PowerScript:SD1',
      code: 'SD1'
    };
    assert.equal(provideCodeActions('file:///x', 'X()\n', [d]).length, 0);
  });

  test('rechaza sugerencias peligrosas fuera del identificador simple', () => {
    const d = {
      severity: DiagnosticSeverity.Warning,
      range: Range.create(0, 0, 0, 5),
      message: "'Yield' está marcada como obsoleta. Sugerencia: DoEvents(); MessageBox('x').",
      source: 'PowerScript:SD7',
      code: DIAGNOSTIC_CODES.sd7ObsoleteFunction
    };

    assert.equal(provideCodeActions('file:///x', 'Yield()\n', [d]).length, 0);
  });

  test('bloquea la acción cuando el preflight rechaza el reemplazo', () => {
    const d = {
      severity: DiagnosticSeverity.Warning,
      range: Range.create(0, 0, 0, 5),
      message: "'Yield' está marcada como obsoleta. Sugerencia: if.",
      source: 'PowerScript:SD7',
      code: DIAGNOSTIC_CODES.sd7ObsoleteFunction
    };

    const actions = provideCodeActions('file:///x', 'Yield()\n', [d], {
      sourceOrigin: 'solution-source'
    });

    assert.equal(actions.length, 1);
    assert.equal(actions[0].disabled?.reason, "'if' es una palabra reservada.");
    assert.equal(actions[0].edit, undefined);
  });

  test('bloquea la acción cuando el sourceOrigin es dudoso', () => {
    const d = {
      severity: DiagnosticSeverity.Warning,
      range: Range.create(0, 0, 0, 5),
      message: "'Yield' está marcada como obsoleta. Sugerencia: DoEvents.",
      source: 'PowerScript:SD7',
      code: DIAGNOSTIC_CODES.sd7ObsoleteFunction
    };

    const actions = provideCodeActions('file:///x', 'Yield()\n', [d], {
      sourceOrigin: 'orca-staging'
    });

    assert.equal(actions.length, 1);
    assert.equal(actions[0].disabled?.reason, 'El sourceOrigin del documento no es canónico para aplicar quick fixes.');
    assert.equal((actions[0].data as { invocationRisk?: string }).invocationRisk, 'dynamic');
    assert.deepEqual((actions[0].data as { riskReasons?: string[] }).riskReasons, ['source-origin:orca-staging']);
    assert.equal(actions[0].edit, undefined);
  });

  test('bloquea la acción cuando detecta strings dinámicos del mismo identificador', () => {
    const d = {
      severity: DiagnosticSeverity.Warning,
      range: Range.create(1, 0, 1, 5),
      message: "'Yield' está marcada como obsoleta. Sugerencia: DoEvents.",
      source: 'PowerScript:SD7',
      code: DIAGNOSTIC_CODES.sd7ObsoleteFunction
    };

    const actions = provideCodeActions('file:///x', 'PostEvent("Yield")\nYield()\n', [d], {
      sourceOrigin: 'pbl-folder-source'
    });

    assert.equal(actions.length, 1);
    assert.match(actions[0].disabled?.reason ?? '', /string dinámic/i);
    assert.equal((actions[0].data as { invocationRisk?: string }).invocationRisk, 'dynamic');
    assert.deepEqual((actions[0].data as { riskReasons?: string[] }).riskReasons, ['dynamic-strings:1']);
    assert.equal(actions[0].edit, undefined);
  });
});
