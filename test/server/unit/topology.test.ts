import * as assert from 'assert/strict';
import { parseTopology } from '../../../src/server/workspace/topology';

suite('unit/topology', () => {
  test('parsea .pbw extrayendo .pbt y .pbproj', () => {
    const result = parseTopology(
      'file:///proj/app.pbw',
      `"main.pbt" "extra.pbproj"\n"sub/another.pbt"`
    );
    assert.equal(result?.kind, 'workspace');
    assert.equal(result?.data.name, 'app');
    if (result?.kind === 'workspace') {
      assert.deepEqual(result.data.targets, [
        'file:///proj/main.pbt',
        'file:///proj/extra.pbproj',
        'file:///proj/sub/another.pbt'
      ]);
    }
  });

  test('parsea .pbt extrayendo .pbl', () => {
    const r = parseTopology(
      'file:///proj/main.pbt',
      `LibList "lib1.pbl;lib2.pbl"\n  "lib3.pbl"`
    );
    assert.equal(r?.kind, 'target');
    if (r?.kind === 'target') {
      assert.equal(r.data.libraries.length, 3);
      assert.ok(r.data.libraries[0]!.endsWith('lib1.pbl'));
    }
  });

  test('parsea .pbsln extrayendo .pbproj', () => {
    const r = parseTopology(
      'file:///sln/app.pbsln',
      `Project "core.pbproj"\nProject "ui.pbproj"`
    );
    assert.equal(r?.kind, 'solution');
    if (r?.kind === 'solution') {
      assert.equal(r.data.projects.length, 2);
    }
  });

  test('parsea .pbproj extrayendo .pbl', () => {
    const r = parseTopology('file:///proj/core.pbproj', `<library>core.pbl</library>`);
    assert.equal(r?.kind, 'project');
    if (r?.kind === 'project') {
      assert.equal(r.data.name, 'core');
      assert.ok(r.data.libraries[0]!.endsWith('core.pbl'));
    }
  });

  test('extensiones desconocidas devuelven null', () => {
    assert.equal(parseTopology('file:///x.txt', 'foo'), null);
  });

  test('paths relativos con ../ se resuelven', () => {
    const r = parseTopology(
      'file:///proj/sub/main.pbt',
      `"../shared.pbl"`
    );
    if (r?.kind === 'target') {
      assert.equal(r.data.libraries[0], 'file:///proj/shared.pbl');
    }
  });
});
