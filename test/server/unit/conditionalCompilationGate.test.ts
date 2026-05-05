import * as assert from 'assert/strict';

import { findConditionalCompilationMarkers } from '../../../src/server/parsing/conditionalCompilationGate';

suite('unit/conditionalCompilationGate (BL-06)', () => {
  test('detecta directivas activas hash y dollar fuera de comentarios', () => {
    const source = [
      '#IF DEFINED DEBUG THEN',
      '  MessageBox("Debug", "on")',
      '#ELSEIF DEFINED PBNATIVE THEN',
      '  MessageBox("Native", "on")',
      '#ELSE',
      '  MessageBox("Prod", "on")',
      '#END IF',
      '$define FEATURE_X 1',
      '$if defined FEATURE_X then',
      '$end if',
    ].join('\r\n');

    const markers = findConditionalCompilationMarkers(source);

    assert.deepEqual(
      markers.map((marker) => ({ line: marker.line, directive: marker.directive })),
      [
        { line: 0, directive: 'if' },
        { line: 2, directive: 'elseif' },
        { line: 4, directive: 'else' },
        { line: 6, directive: 'end-if' },
        { line: 7, directive: 'define' },
        { line: 8, directive: 'if' },
        { line: 9, directive: 'end-if' },
      ]
    );
  });

  test('ignora histórico comentado, texto y strings con pseudo-marcadores', () => {
    const source = [
      '/*',
      '1.4 Removed old #IF WebService code',
      '#ELSE',
      '*/',
      '// #define FIONBIO  _IOW(\'f\', 126, u_long)',
      'string ls_text',
      'ls_text = "#IF DEFINED DEBUG THEN"',
      'messagebox("Info", ls_text)',
    ].join('\r\n');

    const markers = findConditionalCompilationMarkers(source);

    assert.deepEqual(markers, []);
  });
});