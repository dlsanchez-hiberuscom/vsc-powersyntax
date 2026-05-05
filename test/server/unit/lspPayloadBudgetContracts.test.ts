import * as assert from 'assert/strict';

import { DocumentSymbol, Location, Position, Range, SymbolKind } from 'vscode-languageserver/node';

import { estimateLspPayloadBytes } from '../../../src/server/runtime/interactiveServingStats';
import {
  evaluateInteractivePayloadBudget,
  type InteractivePayloadBudgetFeature,
  INTERACTIVE_PAYLOAD_BUDGETS,
} from '../../../src/server/serving/payloadBudget';

function createRange(line: number, start = 0, end = 8): Range {
  return Range.create(Position.create(line, start), Position.create(line, end));
}

function createLocations(count: number): Location[] {
  return Array.from({ length: count }, (_, index) => Location.create(
    `file:///workspace/w_main_${index}.sru`,
    createRange(index % 20, 2, 12),
  ));
}

const REPRESENTATIVE_PAYLOADS: Record<InteractivePayloadBudgetFeature, unknown> = {
  hover: {
    contents: {
      kind: 'markdown',
      value: '**MessageBox**\n\nSistema PowerBuilder.\n\nConfidence: high',
    },
  },
  completion: Array.from({ length: 25 }, (_, index) => ({
    label: `of_Action${index}`,
    kind: 2,
    sortText: `${String(index).padStart(2, '0')}_of_action${index}`,
    data: { source: 'entity', entityId: `of_action_${index}` },
  })),
  'completion-resolve': {
    label: 'MessageBox',
    kind: 3,
    detail: 'integer MessageBox(string title, string text)',
    documentation: 'Muestra un mensaje modal localizado con documentación diferida por item.',
    data: { source: 'system', symbolId: 'system.callable.messagebox' },
  },
  signatureHelp: {
    signatures: [{
      label: 'MessageBox(string title, string text)',
      documentation: 'Firma activa servida desde el catalogo del sistema.',
      parameters: [
        { label: 'title', documentation: 'Titulo visible.' },
        { label: 'text', documentation: 'Texto visible.' },
      ],
    }],
    activeSignature: 0,
    activeParameter: 1,
  },
  definition: Location.create('file:///workspace/w_main.sru', createRange(14, 4, 12)),
  references: createLocations(32),
  documentSymbols: [DocumentSymbol.create(
    'w_main',
    'window',
    SymbolKind.Class,
    createRange(0, 0, 12),
    createRange(0, 0, 6),
    [DocumentSymbol.create('of_test', 'function', SymbolKind.Method, createRange(5), createRange(5, 0, 7))],
  )],
  semanticTokens: {
    data: Array.from({ length: 40 }, (_, index) => [index === 0 ? 0 : 1, 0, 6, index % 8, 0]).flat(),
  },
};

suite('unit/lspPayloadBudgetContracts (Bloque 9)', () => {
  test('cada feature interactiva tiene payload representativo dentro de su budget', () => {
    for (const feature of Object.keys(INTERACTIVE_PAYLOAD_BUDGETS) as InteractivePayloadBudgetFeature[]) {
      const payloadBytes = estimateLspPayloadBytes(REPRESENTATIVE_PAYLOADS[feature]);
      const evaluation = evaluateInteractivePayloadBudget(feature, payloadBytes);

      assert.equal(
        evaluation.withinBudget,
        true,
        `${feature} payload=${evaluation.payloadBytes} budget=${evaluation.budgetBytes} overflow=${evaluation.overflowBytes}`,
      );
    }
  });

  test('completion inicial y completion resolve mantienen budgets separados', () => {
    const initialBudget = INTERACTIVE_PAYLOAD_BUDGETS.completion.budgetBytes;
    const resolveBudget = INTERACTIVE_PAYLOAD_BUDGETS['completion-resolve'].budgetBytes;

    assert.ok(initialBudget > resolveBudget);
    assert.equal(evaluateInteractivePayloadBudget('completion', estimateLspPayloadBytes(REPRESENTATIVE_PAYLOADS.completion)).withinBudget, true);
    assert.equal(evaluateInteractivePayloadBudget('completion-resolve', estimateLspPayloadBytes(REPRESENTATIVE_PAYLOADS['completion-resolve'])).withinBudget, true);
  });
});