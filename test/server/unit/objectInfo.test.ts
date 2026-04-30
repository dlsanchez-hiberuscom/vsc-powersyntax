import * as assert from 'assert/strict';
import { buildObjectInfo } from '../../../src/server/features/objectInfo';

suite('unit/objectInfo (B106)', () => {
  const sample = [
    'forward',
    'global type w_main from window',
    'end type',
    'end forward',
    '',
    'type variables',
    'integer i',
    'end variables'
  ].join('\n');

  test('extrae globalType y baseType', () => {
    const info = buildObjectInfo({ uri: 'file:///w_main.srw', content: sample });
    assert.equal(info.globalType, 'w_main');
    assert.equal(info.baseType, 'window');
  });

  test('detecta section por línea', () => {
    const info = buildObjectInfo({ uri: 'file:///w.srw', content: sample, line: 6 });
    assert.equal(info.sectionKind, 'variables');
  });

  test('propaga library y project', () => {
    const info = buildObjectInfo({ uri: 'x', content: '', library: 'app.pbl', project: 'app' });
    assert.equal(info.library, 'app.pbl');
    assert.equal(info.project, 'app');
  });
});
