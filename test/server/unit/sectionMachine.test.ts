import * as assert from 'assert/strict';
import { scanSections } from '../../../src/server/parsing/sectionMachine';

suite('unit/sectionMachine (B055)', () => {
  test('forward / end forward', () => {
    const src = ['forward', 'global type w_main from window', 'end forward'];
    const sections = scanSections(src);
    assert.equal(sections.length, 1);
    assert.equal(sections[0].kind, 'forward');
    assert.equal(sections[0].startLine, 0);
    assert.equal(sections[0].endLine, 2);
  });

  test('forward prototypes / end prototypes', () => {
    const src = ['forward prototypes', 'public function integer of_test()', 'end prototypes'];
    const sections = scanSections(src);
    assert.equal(sections[0].kind, 'prototypes');
  });

  test('type variables / end variables', () => {
    const src = ['type variables', 'integer i', 'end variables'];
    const sections = scanSections(src);
    assert.equal(sections[0].kind, 'variables');
  });

  test('múltiples secciones', () => {
    const src = [
      'forward',
      'end forward',
      'type variables',
      'integer i',
      'end variables'
    ];
    const sections = scanSections(src);
    assert.equal(sections.length, 2);
    assert.deepEqual(sections.map((s) => s.kind), ['forward', 'variables']);
  });
});
