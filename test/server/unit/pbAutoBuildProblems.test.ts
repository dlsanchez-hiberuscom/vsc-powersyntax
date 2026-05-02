import * as assert from 'assert/strict';

import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { EntityKind, type Fact } from '../../../src/server/knowledge/types';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { resolvePbAutoBuildProblems } from '../../../src/server/build/pbAutoBuildProblems';
import type { PbAutoBuildLogIssue } from '../../../src/server/build/pbAutoBuildLogParser';

suite('unit/pbAutoBuildProblems (B184)', () => {
  test('resuelve un issue de build a una entidad tipo única del workspace', () => {
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    knowledgeBase.upsertDocument('file:///c:/workspace/w_demo.srw', [typeFact('w_demo', 'file:///c:/workspace/w_demo.srw', 12, 4)]);

    const resolved = resolvePbAutoBuildProblems([
      issue('error', 'C0001: Illegal data type: u_dwstandard', 'w_demo')
    ], knowledgeBase, workspaceState);

    assert.equal(resolved.problems.length, 1);
    assert.equal(resolved.problems[0]?.uri, 'file:///c:/workspace/w_demo.srw');
    assert.equal(resolved.problems[0]?.line, 12);
    assert.equal(resolved.summary.published, 1);
    assert.equal(resolved.summary.unresolved, 0);
  });

  test('no publica problemas cuando el objeto es ambiguo en la knowledge base', () => {
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    knowledgeBase.upsertDocument('file:///c:/workspace/a/w_demo.srw', [typeFact('w_demo', 'file:///c:/workspace/a/w_demo.srw', 1, 0)]);
    knowledgeBase.upsertDocument('file:///c:/workspace/b/w_demo.srw', [typeFact('w_demo', 'file:///c:/workspace/b/w_demo.srw', 2, 0)]);

    const resolved = resolvePbAutoBuildProblems([
      issue('error', 'C0001: Illegal data type: u_dwstandard', 'w_demo')
    ], knowledgeBase, workspaceState);

    assert.equal(resolved.problems.length, 0);
    assert.equal(resolved.summary.published, 0);
    assert.equal(resolved.summary.unresolved, 1);
  });
});

function issue(
  severity: PbAutoBuildLogIssue['severity'],
  message: string,
  objectName: string
): PbAutoBuildLogIssue {
  return {
    severity,
    category: severity === 'warning' ? 'Warning' : 'Error',
    message,
    objectName,
    rawLine: message
  };
}

function typeFact(name: string, uri: string, line: number, character: number): Fact {
  return {
    id: name.toLowerCase(),
    name,
    kind: EntityKind.Type,
    uri,
    line,
    character,
    signature: undefined,
    documentation: undefined
  };
}