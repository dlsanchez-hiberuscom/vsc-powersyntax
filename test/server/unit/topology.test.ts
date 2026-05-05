import * as assert from 'assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

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

  test('parsea .pbsln preservando project paths con espacios', () => {
    const r = parseTopology(
      'file:///sln/pfc.pbsln',
      `<Project Path="generic_pfc_app.pbproj"/>\n<Project Path="security administrator.pbproj"/>`
    );
    assert.equal(r?.kind, 'solution');
    if (r?.kind === 'solution') {
      assert.deepEqual(r.data.projects, [
        'file:///sln/generic_pfc_app.pbproj',
        'file:///sln/security administrator.pbproj'
      ]);
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

  test('parsea .pbproj preservando library paths con espacios', () => {
    const r = parseTopology(
      'file:///proj/generic_pfc_app.pbproj',
      [
        '<Libraries AppEntry="pfc libs\\pfcapp.pbl">',
        '  <Library Path="pfc libs\\pfcmain.pbl"/>',
        '  <Library Path="pfc libs\\pfemain.pbl"/>',
        '</Libraries>'
      ].join('\n')
    );
    assert.equal(r?.kind, 'project');
    if (r?.kind === 'project') {
      assert.deepEqual(r.data.libraries, [
        'file:///proj/pfc libs/pfcapp.pbl',
        'file:///proj/pfc libs/pfcmain.pbl',
        'file:///proj/pfc libs/pfemain.pbl'
      ]);
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

  test('los fixtures de lsp-guards usan markers plausibles consumibles por topology', () => {
    const fixtureDir = path.join(process.cwd(), 'test', 'fixtures', 'lsp-guards');
    const pbw = fs.readFileSync(path.join(fixtureDir, 'guard.pbw'), 'utf8');
    const pbt = fs.readFileSync(path.join(fixtureDir, 'guard.pbt'), 'utf8');
    const pbproj = fs.readFileSync(path.join(fixtureDir, 'guard.pbproj'), 'utf8');
    const pbsln = fs.readFileSync(path.join(fixtureDir, 'guard.pbsln'), 'utf8');
    const pbl = fs.readFileSync(path.join(fixtureDir, 'guard.pbl'), 'utf8');

    assert.ok(!/global\s+type/i.test(pbw));
    assert.ok(!/global\s+type/i.test(pbt));
    assert.ok(!/global\s+type/i.test(pbproj));
    assert.ok(!/global\s+type/i.test(pbsln));
    assert.ok(!/global\s+type/i.test(pbl));

    const workspace = parseTopology('file:///workspace/guard.pbw', pbw);
    assert.equal(workspace?.kind, 'workspace');
    if (workspace?.kind === 'workspace') {
      assert.deepEqual(workspace.data.targets, [
        'file:///workspace/guard.pbt',
        'file:///workspace/guard.pbproj',
      ]);
    }

    const target = parseTopology('file:///workspace/guard.pbt', pbt);
    assert.equal(target?.kind, 'target');
    if (target?.kind === 'target') {
      assert.deepEqual(target.data.libraries, [
        'file:///workspace/guard_app.pbl',
        'file:///workspace/shared/guard_common.pbl',
      ]);
    }

    const project = parseTopology('file:///workspace/guard.pbproj', pbproj);
    assert.equal(project?.kind, 'project');
    if (project?.kind === 'project') {
      assert.deepEqual(project.data.libraries, [
        'file:///workspace/guard_app.pbl',
        'file:///workspace/shared/guard_common.pbl',
      ]);
    }

    const solution = parseTopology('file:///workspace/guard.pbsln', pbsln);
    assert.equal(solution?.kind, 'solution');
    if (solution?.kind === 'solution') {
      assert.deepEqual(solution.data.projects, ['file:///workspace/guard.pbproj']);
    }

    assert.equal(parseTopology('file:///workspace/guard.pbl', pbl), null);
  });
});
