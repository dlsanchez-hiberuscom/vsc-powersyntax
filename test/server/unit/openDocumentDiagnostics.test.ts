import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { publishDiagnosticsNow } from '../../../src/server/analysis/diagnosticScheduler';
import { republishOpenDiagnosticsForDocuments } from '../../../src/server/analysis/openDocumentDiagnostics';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { EntityKind } from '../../../src/server/knowledge/types';
import { TaskScheduler } from '../../../src/server/runtime/scheduler';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';

class FakeConnection {
  public calls: Array<{ uri: string; diagnostics: Array<{ code?: string | number; message: string }> }> = [];

  sendDiagnostics(payload: { uri: string; diagnostics: Array<{ code?: string | number; message: string }> }): void {
    this.calls.push(payload);
  }
}

suite('unit/openDocumentDiagnostics', () => {
  test('republica diagnósticos abiertos tras indexar un ancestro y limpia un SD3 obsoleto', async () => {
    const connection = new FakeConnection();
    const scheduler = new TaskScheduler();
    const knowledgeBase = new KnowledgeBase();
    const systemCatalog = new SystemCatalog();
    const inheritanceGraph = new InheritanceGraph(knowledgeBase);
    const workspaceState = new WorkspaceState();
    const childDocument = TextDocument.create(
      'file:///proj/lib_app.pbl/u_child.sru',
      'powerbuilder',
      1,
      [
        'forward',
        'global type u_child from pfc_n_base',
        'end type',
        'end forward',
        '',
        'global type u_child from pfc_n_base',
        'end type'
      ].join('\r\n')
    );

    publishDiagnosticsNow(
      connection as never,
      childDocument,
      scheduler,
      knowledgeBase,
      systemCatalog,
      inheritanceGraph,
      workspaceState
    );

    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(connection.calls.length, 1);
    assert.ok(
      connection.calls[0].diagnostics.some((diagnostic) => String(diagnostic.code) === 'SD3'),
      'El primer publish debe reflejar el SD3 cuando el ancestro aún no está indexado.'
    );

    knowledgeBase.upsertDocument(
      'file:///proj/pfc libs.pbl/pfc_n_base.sru',
      [{
        id: 'pfc_n_base',
        name: 'pfc_n_base',
        kind: EntityKind.Type,
        uri: 'file:///proj/pfc libs.pbl/pfc_n_base.sru',
        line: 0,
        character: 0
      }],
      []
    );

    republishOpenDiagnosticsForDocuments({
      connection: connection as never,
      documents: [childDocument],
      scheduler,
      knowledgeBase,
      systemCatalog,
      inheritanceGraph,
      workspaceState,
      isSemanticallyServedDocument: () => true,
      uris: [childDocument.uri]
    });

    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(connection.calls.length, 2);
    assert.equal(connection.calls[1].uri, childDocument.uri);
    assert.ok(
      !connection.calls[1].diagnostics.some((diagnostic) => String(diagnostic.code) === 'SD3'),
      'La republicación debe limpiar el SD3 una vez que el ancestro ya está en KB.'
    );
  });
});