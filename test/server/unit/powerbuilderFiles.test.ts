import * as assert from 'assert/strict';

import {
  getPowerBuilderArtifactKind,
  isPowerBuilderProjectMarkerUri,
  isPowerBuilderSemanticUri,
  isPowerBuilderSourceUri,
} from '../../../src/shared/powerbuilderFiles';

suite('unit/powerbuilderFiles', () => {
  test('distingue fuentes semanticas de markers y PBL binario', () => {
    assert.equal(isPowerBuilderSourceUri('file:///demo/app.pbw'), false);
    assert.equal(isPowerBuilderSourceUri('file:///demo/target.pbt'), false);
    assert.equal(isPowerBuilderSourceUri('file:///demo/project.pbproj'), false);
    assert.equal(isPowerBuilderSourceUri('file:///demo/solution.pbsln'), false);
    assert.equal(isPowerBuilderSourceUri('file:///demo/library.pbl'), false);

    assert.equal(isPowerBuilderSemanticUri('file:///demo/window.srw'), true);
    assert.equal(isPowerBuilderSemanticUri('file:///demo/query.srq'), true);
    assert.equal(isPowerBuilderSemanticUri('file:///demo/deploy.srj'), true);
    assert.equal(isPowerBuilderSemanticUri('file:///demo/library.pbl'), false);
    assert.equal(isPowerBuilderSemanticUri('file:///demo/app.pbw?version=1#fragment'), false);
  });

  test('clasifica pbg, pbr y psr como artifacts no servibles', () => {
    assert.equal(getPowerBuilderArtifactKind('file:///demo/workspace.pbg'), 'build-support');
    assert.equal(getPowerBuilderArtifactKind('file:///demo/resources.pbr'), 'resource');
    assert.equal(getPowerBuilderArtifactKind('file:///demo/report.psr'), 'report');

    assert.equal(isPowerBuilderSourceUri('file:///demo/workspace.pbg'), false);
    assert.equal(isPowerBuilderSourceUri('file:///demo/resources.pbr'), false);
    assert.equal(isPowerBuilderSourceUri('file:///demo/report.psr'), false);
    assert.equal(isPowerBuilderSemanticUri('file:///demo/workspace.pbg'), false);
    assert.equal(isPowerBuilderSemanticUri('file:///demo/resources.pbr'), false);
    assert.equal(isPowerBuilderSemanticUri('file:///demo/report.psr'), false);
    assert.equal(isPowerBuilderProjectMarkerUri('file:///demo/workspace.pbg'), false);
    assert.equal(isPowerBuilderProjectMarkerUri('file:///demo/resources.pbr'), false);
    assert.equal(isPowerBuilderProjectMarkerUri('file:///demo/report.psr'), false);
  });
});