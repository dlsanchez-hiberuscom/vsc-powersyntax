import * as assert from 'assert/strict';

import {
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
});