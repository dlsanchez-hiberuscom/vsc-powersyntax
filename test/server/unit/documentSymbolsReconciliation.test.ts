import * as assert from 'assert/strict';

import type { SemanticDocumentSnapshot } from '../../../src/server/analysis/semanticSnapshot';
import {
  extractDocumentSymbolsFromSnapshotWithReconciliation,
  formatDocumentSymbolReconciliationReport,
} from '../../../src/server/features/documentSymbols';
import { EntityKind, ScopeKind, type Scope } from '../../../src/server/knowledge/types';

suite('unit/documentSymbolsReconciliation (B162)', () => {
  test('reporta inconsistencias entre parser, symbol model y salida LSP', () => {
    const snapshot: SemanticDocumentSnapshot = {
      uri: 'file:///snapshot-reconcile-broken.sru',
      version: 1,
      fingerprint: 11,
      identity: 'file:///snapshot-reconcile-broken.sru@11',
      pass: 'enriched',
      readiness: 'nearby-semantic-ready',
      containerModel: {
        sections: [],
        typeBlocks: [{ name: 'uo_demo', startLine: 1, endLine: 2 }],
      },
      symbols: [
        {
          id: 'uo_other',
          name: 'uo_other',
          kind: EntityKind.Type,
          uri: 'file:///snapshot-reconcile-broken.sru',
          line: 5,
          character: 5,
          baseTypeName: 'nonvisualobject',
        },
        {
          id: 'of_run',
          name: 'of_run',
          kind: EntityKind.Function,
          uri: 'file:///snapshot-reconcile-broken.sru',
          line: 3,
          character: 24,
          containerName: 'uo_missing',
          signature: 'function : integer',
        },
      ],
      scopes: [],
      logicalStatements: [],
      maskedText: {
        lines: [
          'type uo_demo from nonvisualobject',
          'end type',
          'public function integer of_run()',
          'end function',
          'type uo_other from nonvisualobject',
          'end type',
        ],
        masks: Array.from({ length: 6 }, () => new Uint8Array()),
      },
      controlBlocks: [],
    };

    const result = extractDocumentSymbolsFromSnapshotWithReconciliation(snapshot);
    const report = result.reconciliation;

    assert.equal(report.status, 'error');
    assert.ok(report.findings.some((finding) => finding.code === 'type-block-missing-fact'));
    assert.ok(report.findings.some((finding) => finding.code === 'type-fact-missing-block'));
    assert.ok(report.findings.some((finding) => finding.code === 'callable-fact-missing-scope'));
    assert.ok(report.findings.some((finding) => finding.code === 'callable-fact-orphan-container'));
    assert.equal(result.symbols.length, 2);
    assert.match(formatDocumentSymbolReconciliationReport(report), /documentSymbols\/reconcile/);
    assert.match(formatDocumentSymbolReconciliationReport(report), /callable-fact-orphan-container/);
  });

  test('permanece healthy cuando snapshot y salida quedan reconciliados', () => {
    const typeScope: Scope = {
      id: 'uo_demo',
      kind: ScopeKind.Type,
      uri: 'file:///snapshot-reconcile-healthy.sru',
      startLine: 2,
      endLine: 5,
      children: [],
      symbols: []
    };
    const functionScope: Scope = {
      id: 'uo_demo.of_run',
      kind: ScopeKind.Function,
      uri: 'file:///snapshot-reconcile-healthy.sru',
      startLine: 4,
      endLine: 5,
      parent: typeScope,
      children: [],
      symbols: []
    };
    typeScope.children.push(functionScope);

    const snapshot: SemanticDocumentSnapshot = {
      uri: 'file:///snapshot-reconcile-healthy.sru',
      version: 1,
      fingerprint: 12,
      identity: 'file:///snapshot-reconcile-healthy.sru@12',
      pass: 'enriched',
      readiness: 'nearby-semantic-ready',
      containerModel: {
        sections: [],
        typeBlocks: [{ name: 'uo_demo', startLine: 2, endLine: 3 }]
      },
      symbols: [
        {
          id: 'uo_demo',
          name: 'uo_demo',
          kind: EntityKind.Type,
          uri: 'file:///snapshot-reconcile-healthy.sru',
          line: 2,
          character: 5,
          baseTypeName: 'nonvisualobject',
          signature: 'type from nonvisualobject'
        },
        {
          id: 'of_run',
          name: 'of_run',
          kind: EntityKind.Function,
          uri: 'file:///snapshot-reconcile-healthy.sru',
          line: 4,
          character: 24,
          containerName: 'uo_demo',
          signature: 'function : integer'
        }
      ],
      scopes: [typeScope],
      logicalStatements: [],
      maskedText: {
        lines: [
          'forward',
          'end forward',
          'type uo_demo from nonvisualobject',
          'end type',
          'public function integer of_run()',
          'end function'
        ],
        masks: Array.from({ length: 6 }, () => new Uint8Array())
      },
      controlBlocks: []
    };

    const result = extractDocumentSymbolsFromSnapshotWithReconciliation(snapshot);

    assert.equal(result.reconciliation.status, 'healthy');
    assert.equal(result.reconciliation.findings.length, 0);
    assert.equal(result.reconciliation.counts.typeBlocks, 1);
    assert.equal(result.reconciliation.counts.callableFacts, 1);
    assert.equal(result.reconciliation.counts.outputSymbols, 2);
    assert.match(formatDocumentSymbolReconciliationReport(result.reconciliation), /reconciliados/);
  });
});