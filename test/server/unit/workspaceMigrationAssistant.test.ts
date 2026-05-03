import * as assert from 'assert/strict';

import {
  buildWorkspaceMigrationAssistant,
} from '../../../src/server/features/workspaceMigrationAssistant';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';

suite('unit/workspaceMigrationAssistant (B256)', () => {
  let workspaceState: WorkspaceState;

  setup(() => {
    workspaceState = new WorkspaceState();
  });

  test('propone una migración guiada para layouts legacy pbl-only', () => {
    workspaceState.addRoot('libraries', 'file:///legacy/lib_legacy.pbl');
    workspaceState.addSourceFile('file:///legacy/lib_legacy.pbl/w_legacy.srw', 'pbl-folder-source');
    workspaceState.refreshProjectRouting();

    const assistant = buildWorkspaceMigrationAssistant(undefined, workspaceState);

    assert.equal(assistant.available, true);
    assert.equal(assistant.currentMode, 'pbl-only');
    assert.equal(assistant.targetMode, 'solution');
    assert.equal(assistant.summary.hasLegacyLibraries, true);
    assert.ok(assistant.recommendations.some((recommendation) =>
      recommendation.category === 'topology'
      && recommendation.priority === 'high'
      && recommendation.actions.some((action) => /\.pbsln|\.pbproj|\.pbw|\.pbt/i.test(action))
    ));
  });

  test('prioriza consolidar mixed mode y build files ambiguos antes de migrar', () => {
    workspaceState.addRoot('workspaces', 'file:///legacy/legacy.pbw');
    workspaceState.addRoot('targets', 'file:///legacy/app.pbt');
    workspaceState.addRoot('solutions', 'file:///modern/modern.pbsln');
    workspaceState.addRoot('projects', 'file:///modern/app.pbproj');
    workspaceState.addSourceFile('file:///legacy/lib_app.pbl/w_legacy.srw', 'workspace-ws_objects');
    workspaceState.addSourceFile('file:///modern/lib_app.pbl/w_modern.srw', 'solution-source');
    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///legacy/app.pbt',
        name: 'app',
        libraries: ['file:///legacy/lib_app.pbl'],
      },
    });
    workspaceState.addTopologyEntry({
      kind: 'project',
      data: {
        uri: 'file:///modern/app.pbproj',
        name: 'app',
        libraries: ['file:///modern/lib_app.pbl'],
      },
    });
    workspaceState.addBuildFileCandidate({
      uri: 'file:///builds/mixed-build.json',
      hasBuildPlan: true,
      referencedProjectUris: ['file:///legacy/app.pbt', 'file:///modern/app.pbproj'],
    });
    workspaceState.refreshProjectRouting();

    const assistant = buildWorkspaceMigrationAssistant(undefined, workspaceState);

    assert.equal(assistant.available, true);
    assert.equal(assistant.currentMode, 'mixed');
    assert.equal(assistant.targetMode, 'solution');
    assert.equal(assistant.summary.hasMixedMarkers, true);
    assert.ok(assistant.recommendations.some((recommendation) =>
      recommendation.category === 'topology'
      && /mixed/i.test(recommendation.detail)
    ));
    assert.ok(assistant.recommendations.some((recommendation) =>
      recommendation.category === 'build'
      && recommendation.evidence.some((entry) => /ambiguous/i.test(entry))
    ));
  });
});
