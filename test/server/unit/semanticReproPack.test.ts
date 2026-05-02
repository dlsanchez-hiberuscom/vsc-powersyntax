import * as assert from 'assert/strict';
import * as path from 'path';

import {
  buildSemanticReproPackBundle,
  suggestSemanticReproDirectoryName,
} from '../../../src/client/repro/semanticReproPack';

suite('unit/semanticReproPack (B175)', () => {
  test('normaliza un nombre de carpeta estable para el repro pack', () => {
    assert.equal(suggestSemanticReproDirectoryName(' Sample.sru / of_answer '), 'sample-sru-of-answer');
    assert.equal(suggestSemanticReproDirectoryName('***'), 'semantic-repro-pack');
  });

  test('genera manifest, artefactos JSON y copia de archivos capturados', () => {
    const workspaceRootPath = path.join('C:', 'repo');
    const reproRootPath = path.join(workspaceRootPath, 'tools', 'semantic-repros', 'sample-repro');

    const bundle = buildSemanticReproPackBundle({
      workspaceRootPath,
      reproRootPath,
      focusUri: 'file:///repo/test/fixtures/basic/sample.sru',
      focusWorkspaceRelativePath: 'test/fixtures/basic/sample.sru',
      focusLine: 12,
      focusCharacter: 28,
      focusSymbolName: 'of_answer',
      focusObjectName: 'sample',
      focusSourceOrigin: 'workspace-ws_objects',
      currentObjectContext: { available: true, uri: 'file:///repo/test/fixtures/basic/sample.sru' },
      impactAnalysis: { available: true, safeReferences: [], probableImpactFiles: [], descendants: [], overrides: [], relatedEvents: [], relatedDataWindows: [], affectedSymbols: [], buildTargets: [] },
      safeEditPlan: { available: true, blocked: false, objects: [], files: [], risks: [], recommendedTests: [], docsToReview: [], blockedReasons: [] },
      workspaceManifest: {
        schemaVersion: '1.0.0',
        generatedAt: 1,
        limits: { maxObjects: 1, maxSymbols: 1, objectsTruncated: false, symbolsTruncated: false },
        projects: [],
        libraries: [],
        objects: [],
        inheritanceSummary: { totalTypes: 0, roots: 0, items: [] },
        exportedSymbols: [],
        sourceOriginSummary: {},
        readiness: { state: 'ready' }
      },
      serverStats: { health: { status: 'healthy', summary: 'ok', findings: [], counts: { info: 0, warning: 0, error: 0 }, checkedLayers: [] } },
      editorDiagnostics: [],
      capturedFiles: [
        {
          uri: 'file:///repo/test/fixtures/basic/sample.sru',
          workspaceRelativePath: 'test/fixtures/basic/sample.sru',
          sourceOrigin: 'workspace-ws_objects',
          reasons: ['active-document'],
          content: 'forward\r\nend forward\r\n'
        }
      ],
      missingFiles: [
        {
          uri: 'file:///repo/missing.sru',
          reasons: ['impact:reference-target'],
          detail: 'missing'
        }
      ],
      generatedAt: '2026-05-02T12:30:00.000Z'
    });

    assert.equal(bundle.reproWorkspaceRelativePath, 'tools/semantic-repros/sample-repro');
    assert.ok(bundle.files.some((file) => file.relativePath === 'manifest.json'));
    assert.ok(bundle.files.some((file) => file.relativePath === 'current-object-context.json'));
    assert.ok(bundle.files.some((file) => file.relativePath === 'files/workspace/test/fixtures/basic/sample.sru'));

    const manifest = JSON.parse(bundle.files.find((file) => file.relativePath === 'manifest.json')?.content ?? '{}');
    assert.equal(manifest.focus.workspaceRelativePath, 'test/fixtures/basic/sample.sru');
    assert.equal(manifest.focus.symbolName, 'of_answer');
    assert.equal(manifest.evidence.readinessState, 'ready');
    assert.equal(manifest.capturedFiles[0].exportedRelativePath, 'files/workspace/test/fixtures/basic/sample.sru');
    assert.equal(manifest.missingFiles[0].detail, 'missing');

    const readme = bundle.files.find((file) => file.relativePath === 'README.md')?.content ?? '';
    assert.match(readme, /reabrir un bug semantico/i);
    assert.match(readme, /files\/workspace\/test\/fixtures\/basic\/sample\.sru/);
  });
});