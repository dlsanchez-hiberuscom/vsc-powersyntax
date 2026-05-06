import * as assert from 'assert/strict';
import { SymbolKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { provideWorkspaceSymbols, queryApiSymbols } from '../../../src/server/features/workspaceSymbols';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/workspaceSymbols', () => {
  let kb: KnowledgeBase;

  setup(() => {
    kb = new KnowledgeBase();
    kb.upsertDocument('file:///w_main.sru', [
      { id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, uri: 'file:///w_main.sru', line: 10, character: 4 },
      { id: 'u_my_button', name: 'u_my_button', kind: EntityKind.Type, uri: 'file:///w_main.sru', line: 20, character: 4 }
    ]);
    kb.upsertDocument('file:///n_cst_string.sru', [
      { id: 'of_replace', name: 'of_Replace', kind: EntityKind.Function, uri: 'file:///n_cst_string.sru', line: 5, character: 4 },
      { id: 'is_name', name: 'is_name', kind: EntityKind.Variable, uri: 'file:///n_cst_string.sru', line: 2, character: 4 }
    ]);
  });

  test('provideWorkspaceSymbols returns all entities on empty query', () => {
    const symbols = provideWorkspaceSymbols('', kb);
    assert.equal(symbols.length, 4);
  });

  test('provideWorkspaceSymbols filters by query (case insensitive)', () => {
    const symbols = provideWorkspaceSymbols('Of_', kb);
    assert.equal(symbols.length, 2);
    assert.ok(symbols.some(s => s.name === 'of_SetData'));
    assert.ok(symbols.some(s => s.name === 'of_Replace'));
  });

  test('provideWorkspaceSymbols maps EntityKind to SymbolKind correctly', () => {
    const symbols = provideWorkspaceSymbols('u_my_button', kb);
    assert.equal(symbols.length, 1);
    assert.equal(symbols[0].kind, SymbolKind.Class); // Type -> Class
    assert.equal(symbols[0].location.uri, 'file:///w_main.sru');
  });

  test('provideWorkspaceSymbols returns empty array if no match', () => {
    const symbols = provideWorkspaceSymbols('non_existent', kb);
    assert.equal(symbols.length, 0);
  });

  test('queryApiSymbols preserva lineage rico para la API pública', () => {
    kb.upsertDocument('file:///ws_objects/w_api.srw', [
      {
        id: 'of_api',
        name: 'of_Api',
        kind: EntityKind.Function,
        uri: 'file:///ws_objects/w_api.srw',
        line: 4,
        character: 2,
        lineage: {
          sourceKind: 'document',
          sourceOrigin: 'workspace-ws_objects',
          authority: 'derived',
          phase: 'implementation',
          confidence: 'direct'
        }
      }
    ]);

    const symbols = queryApiSymbols('of_api', kb, 5);

    assert.equal(symbols.length, 1);
    assert.deepEqual(symbols[0].lineage, {
      sourceKind: 'document',
      sourceOrigin: 'workspace-ws_objects',
      authority: 'derived',
      phase: 'implementation',
      confidence: 'direct'
    });
  });

  test('queryApiSymbols anota knowledge packs aplicables cuando un type custom hereda de un owner curado', () => {
    kb.upsertDocument('file:///proj/lib_app.pbl/w_browser_host.srw', [
      {
        id: 'w_browser_host',
        name: 'w_browser_host',
        kind: EntityKind.Type,
        uri: 'file:///proj/lib_app.pbl/w_browser_host.srw',
        line: 1,
        character: 0,
        baseTypeName: 'webbrowser',
        lineage: {
          sourceOrigin: 'pbl-folder-source',
          confidence: 'direct'
        }
      }
    ]);

    const symbols = queryApiSymbols('browser_host', kb, 5);

    assert.equal(symbols.length, 1);
    assert.equal(symbols[0].frameworkKnowledgeConflict?.state, 'workspace-wins');
    assert.equal(symbols[0].frameworkKnowledgeConflict?.confidence, 'high');
    assert.ok(symbols[0].frameworkKnowledgeConflict?.packs.some((pack) => pack.id === 'appeon-webbrowser-webview2'));
  });

  test('queryApiSymbols anota packs advisory PFC y STD cuando el type hereda de ancestros framework-specific', () => {
    kb.upsertDocument('file:///proj/pfc libs/w_security_login.srw', [
      {
        id: 'w_security_login',
        name: 'w_security_login',
        kind: EntityKind.Type,
        uri: 'file:///proj/pfc libs/w_security_login.srw',
        line: 1,
        character: 0,
        baseTypeName: 'w_response',
        lineage: {
          sourceOrigin: 'pbl-folder-source',
          confidence: 'direct'
        }
      }
    ]);
    kb.upsertDocument('file:///proj/std_fc_pb_base_e.pbl/wn_controller_orderentry_e.srw', [
      {
        id: 'wn_controller_orderentry_e',
        name: 'wn_controller_orderentry_e',
        kind: EntityKind.Type,
        uri: 'file:///proj/std_fc_pb_base_e.pbl/wn_controller_orderentry_e.srw',
        line: 1,
        character: 0,
        baseTypeName: 'wn_controller_master',
        lineage: {
          sourceOrigin: 'pbl-folder-source',
          confidence: 'direct'
        }
      }
    ]);

    const pfcSymbols = queryApiSymbols('security_login', kb, 5);
    const stdSymbols = queryApiSymbols('controller_orderentry', kb, 5);

    assert.equal(pfcSymbols[0].frameworkKnowledgeConflict?.state, 'workspace-wins');
    assert.ok(pfcSymbols[0].frameworkKnowledgeConflict?.packs.some((pack) => pack.id === 'pfc-response-dwsrv'));
    assert.equal(stdSymbols[0].frameworkKnowledgeConflict?.state, 'workspace-wins');
    assert.ok(stdSymbols[0].frameworkKnowledgeConflict?.packs.some((pack) => pack.id === 'std-controller-shells'));
  });

  test('workspace/api symbols incluyen el stub type publicado por un .srd', () => {
    const document = TextDocument.create(
      'file:///d_customer.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$d_customer.srd',
        'release 39;',
        'datawindow(units=0)'
      ].join('\r\n')
    );
    const analysis = analyzeDocument(document);
    kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);

    const workspaceSymbols = provideWorkspaceSymbols('d_customer', kb);
    const apiSymbols = queryApiSymbols('d_customer', kb, 5);

    assert.ok(workspaceSymbols.some((entry) => entry.name === 'd_customer' && entry.kind === SymbolKind.Class));
    assert.ok(apiSymbols.some((entry) => entry.name === 'd_customer' && entry.kind === 'Type'));
  });

  test('workspace symbols indexa descendants custom de DataWindow como types navegables', () => {
    const document = TextDocument.create(
      'file:///u_dw_workspace.sru',
      'powerbuilder',
      1,
      [
        'global type u_dw_workspace from datawindow',
        'end type'
      ].join('\r\n')
    );

    const analysis = analyzeDocument(document);
    kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);

    const workspaceSymbols = provideWorkspaceSymbols('u_dw_workspace', kb);
    const apiSymbols = queryApiSymbols('u_dw_workspace', kb, 5);

    assert.ok(workspaceSymbols.some((entry) => entry.name === 'u_dw_workspace' && entry.kind === SymbolKind.Class));
    assert.ok(apiSymbols.some((entry) => entry.name === 'u_dw_workspace' && entry.kind === 'Type'));
  });
});
