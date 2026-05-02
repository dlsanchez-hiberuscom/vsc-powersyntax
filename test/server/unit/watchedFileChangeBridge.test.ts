import * as assert from 'assert/strict';
import { FileChangeType } from 'vscode-languageserver/node';

import { toWatchedFsEvent } from '../../../src/server/workspace/watchedFileChangeBridge';

suite('unit/watchedFileChangeBridge (B224)', () => {
  test('acepta sources y markers topológicos', () => {
    assert.deepEqual(
      toWatchedFsEvent({ uri: 'file:///proj/u_demo.sru', type: FileChangeType.Created }),
      { uri: 'file:///proj/u_demo.sru', kind: 'create' }
    );

    assert.deepEqual(
      toWatchedFsEvent({ uri: 'file:///proj/app.pbt', type: FileChangeType.Changed }),
      { uri: 'file:///proj/app.pbt', kind: 'change' }
    );

    assert.deepEqual(
      toWatchedFsEvent({ uri: 'file:///proj/app.pbsln', type: FileChangeType.Deleted }),
      { uri: 'file:///proj/app.pbsln', kind: 'delete' }
    );
  });

  test('ignora archivos ajenos al dominio PowerBuilder', () => {
    assert.equal(
      toWatchedFsEvent({ uri: 'file:///proj/readme.md', type: FileChangeType.Created }),
      null
    );
  });
});