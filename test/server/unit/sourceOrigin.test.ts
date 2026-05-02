import * as assert from 'assert/strict';

import {
  compareSourceOriginPriority,
  inferSourceOrigin,
  pickPreferredSourceOrigin,
  summarizeSourceOrigins,
} from '../../../src/shared/sourceOrigin';

suite('unit/sourceOrigin (B204)', () => {
  test('prioriza source real frente a staging y generated', () => {
    assert.ok(compareSourceOriginPriority('solution-source', 'orca-staging') < 0);
    assert.equal(pickPreferredSourceOrigin('generated', 'workspace-ws_objects'), 'workspace-ws_objects');
  });

  test('infiere ws_objects, pbl-folder, solution y staging desde la uri', () => {
    assert.equal(inferSourceOrigin('file:///proj/ws_objects/w_main.srw'), 'workspace-ws_objects');
    assert.equal(inferSourceOrigin('file:///proj/lib_app.pbl/n_demo.sru'), 'pbl-folder-source');
    assert.equal(inferSourceOrigin('file:///proj/src/w_main.srw', { hasSolutionRoots: true }), 'solution-source');
    assert.equal(inferSourceOrigin('file:///proj/orca-staging/w_main.srw'), 'orca-staging');
  });

  test('resume source origins por conteo', () => {
    assert.deepEqual(
      summarizeSourceOrigins(['solution-source', 'solution-source', 'generated', 'unknown']),
      {
        'solution-source': 2,
        generated: 1,
        unknown: 1
      }
    );
  });
});