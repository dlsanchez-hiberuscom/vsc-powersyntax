import * as assert from 'assert/strict';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { EntityKind } from '../../../src/server/knowledge/types';
import { indexWorkspace } from '../../../src/server/indexer/workspaceIndexer';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { createCancellationSource } from '../../../src/server/runtime/cancellation';
import { NodeFileSystem } from '../../../src/server/system/fileSystem';
import { discoverWorkspace } from '../../../src/server/workspace/discovery';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { getOrderEntryPath, hasOrderEntry } from '../helpers/orderEntryPaths';

function toFileUri(fsPath: string): string {
  return pathToFileURL(fsPath).toString();
}

suite('performance/orderentry-semantic', () => {
  test('OrderEntry semantic: indexa objetos representativos, conserva routing/sourceOrigin e ignora ruido no fuente', async function () {
    if (!hasOrderEntry()) {
      this.skip();
      return;
    }

    this.timeout(60000);

    const root = getOrderEntryPath();
    const fs = new NodeFileSystem();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();

    await discoverWorkspace([toFileUri(root)], fs, state, cancelSource.token);
    await indexWorkspace(fs, cache, kb, state, cancelSource.token);

    const representativeObjects = [
      {
        uri: toFileUri(path.join(root, 'oes_main.pbl', 'nc_ac_orderentry.sru')),
        name: 'nc_ac_orderentry'
      },
      {
        uri: toFileUri(path.join(root, 'oes_dotnet_datastore.pbl', 'wn_dotnet_datastore_e.srw')),
        name: 'wn_dotnet_datastore_e'
      },
      {
        uri: toFileUri(path.join(root, 'oes_main.pbl', 'vc_oes_toolbar_e.sru')),
        name: 'vc_oes_toolbar_e'
      },
      {
        uri: toFileUri(path.join(root, 'Images', 'oes_images.pbl', 'ap_image_build.sra')),
        name: 'ap_image_build'
      }
    ];

    for (const objectEntry of representativeObjects) {
      assert.equal(state.hasSourceFile(objectEntry.uri), true, `${objectEntry.name} debería formar parte del inventario fuente de OrderEntry.`);
      assert.equal(state.getSourceOrigin(objectEntry.uri), 'pbl-folder-source', `${objectEntry.name} debería conservar sourceOrigin pbl-folder-source.`);
      assert.equal(state.getProjectContextForFile(objectEntry.uri), null, `${objectEntry.name} debería permanecer indexado aunque el routing del corpus siga siendo parcial.`);

      const snapshot = kb.getDocumentSnapshot(objectEntry.uri);

      assert.ok(
        snapshot?.symbols.some(
          (entity) => entity.kind === EntityKind.Type && entity.name.toLowerCase() === objectEntry.name
        ),
        `${objectEntry.name} debería publicar un type canónico en su snapshot documental dentro del corpus enterprise.`
      );
    }

    const ignoredNoise = [
      toFileUri(path.join(root, 'oes_system.pbl', 'pj_deploy_orderentry_pcode_64bit_exe.srj')),
      toFileUri(path.join(root, 'oes_main.pbl', 'oes_main.pblmeta')),
      toFileUri(path.join(root, 'Deploy', 'TakePicture_e.html'))
    ];

    for (const uri of ignoredNoise) {
      assert.equal(state.hasSourceFile(uri), false, `${path.basename(uri)} no debería tratarse como fuente semántica de OrderEntry.`);
    }

    assert.equal(state.getMode(), 'solution', 'OrderEntry debería seguir clasificado como solution-mode parcial.');
    assert.ok(
      state.getRoots().projects.some((uri) => uri.toLowerCase().endsWith('/images/oes_image_build.pbproj')),
      'OrderEntry debería conservar al menos el marker .pbproj parcial presente en Images.'
    );
  });
});