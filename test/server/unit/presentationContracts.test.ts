import * as assert from 'assert/strict';

import { CompletionItemKind, DiagnosticSeverity, Location, Position, Range, SignatureInformation } from 'vscode-languageserver/node';

import { EntityKind, type Entity } from '../../../src/server/knowledge/types';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import {
  buildAiContextViewModel,
  buildCompletionListViewModel,
  buildDefinitionViewModel,
  buildDiagnosticMessageViewModel,
  buildSymbolHoverViewModel,
  buildSymbolSignatureViewModel,
  buildEntityCompletionItemViewModel,
  buildEntityCompletionResolveViewModel,
  buildSemanticTokensViewModel,
  buildSystemCompletionItemViewModel,
  buildSystemCompletionResolveViewModel,
  formatAiContextViewModel,
  formatCompletionItemViewModel,
  formatCompletionListViewModel,
  formatCompletionResolveViewModel,
  formatDefinitionViewModel,
  formatDiagnosticMessageViewModel,
  formatSymbolHoverMarkdown,
  formatSymbolSignatureViewModel,
  formatSemanticTokensViewModel,
} from '../../../src/server/presentation';

suite('unit/presentationContracts (Bloque 7)', () => {
  test('CompletionListViewModel y CompletionResolveViewModel separan lista inicial de detalle caro', () => {
    const entity: Entity = {
      id: 'of_test',
      name: 'of_Test',
      kind: EntityKind.Function,
      uri: 'file:///w_main.sru',
      line: 4,
      character: 2,
      signature: 'public function integer of_Test(string as_value) returns integer',
      documentation: 'Carga el valor de prueba.',
    };
    const entityViewModel = buildEntityCompletionItemViewModel(entity, '0_local_of_test', { source: 'entity' });
    const list = buildCompletionListViewModel([entityViewModel]);
    const formatted = formatCompletionListViewModel(list);

    assert.equal(list.payloadPolicy.compact, true);
    assert.deepEqual(list.payloadPolicy.forbiddenBlocks, ['json-dump', 'internal-paths', 'long-evidence', 'workspace-scan-results']);
    assert.equal(formatted[0].label, 'of_Test');
    assert.equal(formatted[0].kind, CompletionItemKind.Method);
    assert.equal(formatted[0].documentation, undefined);

    const resolved = formatCompletionResolveViewModel(
      formatted[0],
      buildEntityCompletionResolveViewModel(formatted[0], entity),
    );
    assert.equal(resolved.detail, entity.signature);
    assert.equal(resolved.documentation, 'Carga el valor de prueba.');
  });

  test('completion system overlay localiza texto visible sin cambiar identidad del simbolo', () => {
    const catalog = new SystemCatalog();
    const messageBox = catalog.findSystemSymbol('MessageBox').find((entry) => entry.kind === 'callable');
    assert.ok(messageBox);

    const initialViewModel = buildSystemCompletionItemViewModel(messageBox, '2_global_messagebox', 'es', { source: 'system' });
    const initialItem = formatCompletionItemViewModel(initialViewModel);
    const resolved = formatCompletionResolveViewModel(
      initialItem,
      buildSystemCompletionResolveViewModel(initialItem, messageBox, 'es'),
    );

    assert.equal(initialViewModel.label, 'MessageBox');
    assert.equal(initialItem.label, 'MessageBox');
    assert.equal(initialItem.kind, CompletionItemKind.Function);
    assert.ok(typeof resolved.documentation === 'string' && resolved.documentation.length > 0);
  });

  test('DiagnosticMessageViewModel conserva code, reason, confidence y mensaje estable', () => {
    const diagnostic = {
      severity: DiagnosticSeverity.Warning,
      range: Range.create(Position.create(1, 2), Position.create(1, 8)),
      message: 'El tipo base no se encuentra.',
      source: 'PowerScript',
      code: 'SD3',
      data: { reasonCodes: ['missing-base-type'], confidence: 'medium' },
    };

    const viewModel = buildDiagnosticMessageViewModel(diagnostic);
    const formatted = formatDiagnosticMessageViewModel(viewModel);

    assert.equal(viewModel.primaryMessage, diagnostic.message);
    assert.deepEqual(viewModel.reasonCodes, ['missing-base-type']);
    assert.equal(viewModel.confidence, 'medium');
    assert.deepEqual(formatted, diagnostic);
  });

  test('SemanticTokensViewModel ordena, deduplica y formatea payload LSP compacto', () => {
    const viewModel = buildSemanticTokensViewModel([
      { line: 2, char: 4, length: 5, tokenType: 5, tokenModifiers: 0, source: 'usage' },
      { line: 1, char: 2, length: 3, tokenType: 2, tokenModifiers: 1, source: 'declaration' },
      { line: 1, char: 2, length: 3, tokenType: 2, tokenModifiers: 1, source: 'declaration' },
    ]);
    const formatted = formatSemanticTokensViewModel(viewModel);

    assert.equal(viewModel.tokens.length, 2);
    assert.deepEqual(viewModel.tokens.map((token) => `${token.line}:${token.char}`), ['1:2', '2:4']);
    assert.equal((formatted as any).data.length, 10);
  });

  test('DefinitionViewModel devuelve null, Location o Location[] sin exponer internals', () => {
    assert.equal(formatDefinitionViewModel(buildDefinitionViewModel([], 'unknown')), null);

    const one = Location.create('file:///a.sru', Range.create(Position.create(1, 1), Position.create(1, 4)));
    const two = Location.create('file:///b.sru', Range.create(Position.create(2, 1), Position.create(2, 4)));

    const single = formatDefinitionViewModel(buildDefinitionViewModel([one], 'workspace'));
    assert.deepEqual(single, one);

    const many = formatDefinitionViewModel(buildDefinitionViewModel([one, two], 'workspace'));
    assert.ok(Array.isArray(many));
    assert.equal(many.length, 2);
  });

  test('AiContextViewModel copia bloques read-only y aplica policy compacta', () => {
    const blocks = [{ kind: 'summary' as const, lines: ['Objeto actual w_main'] }];
    const viewModel = buildAiContextViewModel({
      title: 'Contexto actual',
      sourceOrigin: 'workspace-ws_objects',
      confidence: 'high',
      sections: [{ title: 'Resumen', blocks }],
    });
    blocks[0].lines.push('mutacion externa');

    const formatted = formatAiContextViewModel(viewModel);
    assert.equal(viewModel.payloadPolicy.compact, true);
    assert.deepEqual(viewModel.sections[0].blocks[0].lines, ['Objeto actual w_main']);
    assert.equal(formatted.sourceOrigin, 'workspace-ws_objects');
  });

  test('SymbolHoverViewModel se construye en presentation y conserva payload policy compacta', () => {
    const viewModel = buildSymbolHoverViewModel({
      kind: 'built-in',
      title: '**Function** `Abs`',
      signature: 'Abs ( number )',
      summary: 'Devuelve el valor absoluto.',
      blocks: [{ kind: 'documentation', lines: ['Numero del que quieres obtener el valor absoluto.'] }],
      confidence: 'high',
      locale: 'es',
    });

    const markdown = formatSymbolHoverMarkdown(viewModel);

    assert.equal(viewModel.feature, 'hover');
    assert.equal(viewModel.payloadPolicy.feature, 'hover');
    assert.equal(viewModel.payloadPolicy.budgetBytes, 4 * 1024);
    assert.match(markdown, /Abs \( number \)/);
    assert.match(markdown, /Numero del que quieres obtener el valor absoluto/i);
  });

  test('SymbolSignatureViewModel se construye en presentation sin recomponer firmas', () => {
    const signature = SignatureInformation.create('Abs ( n )', 'doc');
    const viewModel = buildSymbolSignatureViewModel({
      signatures: [signature],
      activeParameter: 0,
      source: 'system-catalog',
      reason: 'unit-test',
      locale: 'es',
    });
    const formatted = formatSymbolSignatureViewModel(viewModel);

    assert.equal(viewModel.feature, 'signatureHelp');
    assert.equal(viewModel.payloadPolicy.feature, 'signatureHelp');
    assert.equal(viewModel.payloadPolicy.budgetBytes, 12 * 1024);
    assert.strictEqual(formatted.signatures[0], signature);
    assert.equal(formatted.activeSignature, 0);
    assert.equal(formatted.activeParameter, 0);
  });
});