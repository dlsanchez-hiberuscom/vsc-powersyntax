import * as assert from 'assert/strict';

import {
  buildDryRunReportItem,
  buildTaskExecutionBatchValidationReceipt,
  buildTaskExecutionDryRunReport,
  buildTaskExecutionValidationReceipt,
  buildTaskReplayBundleReport,
} from '../../../src/client/taskExecutionAutomation';
import { loadFixture } from '../helpers/fixtureLoader';

suite('unit/taskExecutionAutomation (B299, B300, B303)', () => {
  test('compone un dry-run contractual con plan, impacto, archivos, tests, docs y bloqueos', () => {
    const report = buildTaskExecutionDryRunReport({
      request: {
        contractId: 'spec-driven-pbl-update',
        uri: 'file:///repo/w_main.sru',
        validationCommands: ['npm run build:test'],
        docsTouched: ['docs/spec-driven-development.md'],
        specsAffected: ['specs/394-agent-execution-dry-run-contract/spec.md'],
        nextFocus: 'B300 — Agent validation receipt',
      },
      items: [
        buildDryRunReportItem({
          uri: 'file:///repo/w_main.sru',
          safeEditPlan: {
            available: true,
            blocked: false,
            confidence: 'high',
            objects: [],
            files: [
              { uri: 'file:///repo/w_main.sru', reason: 'focus', risk: 'low', sourceOrigin: 'workspace-ws_objects' },
            ],
            risks: ['transaction-binding-dynamic'],
            recommendedTests: ['npm run build:test'],
            docsToReview: ['docs/ai-orchestrator.md'],
            blockedReasons: [],
          },
          impactAnalysis: {
            available: true,
            rootSymbol: { name: 'of_apply', kind: 'Function', uri: 'file:///repo/w_main.sru', line: 1, character: 1 },
            safeReferences: [],
            probableImpactFiles: [],
            descendants: [],
            overrides: [],
            relatedEvents: [],
            relatedDataWindows: [],
            affectedSymbols: [],
            buildTargets: [],
          },
        }),
      ],
    });

    assert.equal(report.schemaVersion, '1.0.0');
    assert.equal(report.contractId, 'spec-driven-pbl-update');
    assert.equal(report.available, true);
    assert.equal(report.blocked, false);
    assert.ok(report.summary.files.some((file) => file.uri === 'file:///repo/w_main.sru'));
    assert.ok(report.summary.recommendedTests.includes('npm run build:test'));
    assert.ok(report.summary.docsToReview.includes('docs/ai-orchestrator.md'));
    assert.ok(report.docsPending.includes('docs/ai-orchestrator.md'));
    assert.deepEqual(report.specsAffected, ['specs/394-agent-execution-dry-run-contract/spec.md']);
    assert.equal(report.nextFocus, 'B300 — Agent validation receipt');
  });

  test('genera un validation receipt con comandos, resultados, docs pendientes y next focus', () => {
    const receipt = buildTaskExecutionValidationReceipt({
      contractId: 'spec-driven-pbl-update',
      request: {
        uri: 'file:///repo/w_main.sru',
        executablePath: 'C:/Tools/orca.exe',
        sessionLibrary: 'app.pbl',
        edits: [{ uri: 'file:///repo/w_main.sru', content: 'content' }],
        validationCommands: ['npm run build:test', 'npm test'],
        docsTouched: ['docs/ai-orchestrator.md'],
        specsAffected: ['specs/395-agent-validation-receipt/spec.md'],
        nextFocus: 'B302 — Agent-safe documentation updater policy',
      },
      result: {
        available: true,
        blocked: false,
        blockedReasons: [],
        safeEditPlan: {
          available: true,
          blocked: false,
          objects: [],
          files: [{ uri: 'file:///repo/w_main.sru', reason: 'focus', risk: 'low' }],
          risks: ['transaction-binding-dynamic'],
          recommendedTests: ['npm run build:test'],
          docsToReview: ['docs/ai-orchestrator.md'],
          blockedReasons: [],
        },
        appliedEdits: [{ sourceUri: 'file:///repo/w_main.sru', stagingUri: 'file:///repo/orca/w_main.sru' }],
        importResult: {
          operationId: 'op-1',
          blocked: false,
          preflight: { ok: true, issues: [] },
          compileResult: { status: 'passed', summary: 'Compile OK', steps: [] },
          ledgerUri: 'file:///repo/.vsc-powersyntax/ledger.json',
        } as never,
        journalUri: 'file:///repo/.vsc-powersyntax/journal.json',
      },
    });

    assert.equal(receipt.status, 'completed');
    assert.ok(receipt.commands.includes('powerbuilder.applySpecDrivenPblUpdate'));
    assert.ok(receipt.commands.includes('npm test'));
    assert.ok(receipt.results.some((result) => result.includes('Compile OK')));
    assert.ok(receipt.docsPending.includes('docs/spec-driven-development.md'));
    assert.deepEqual(receipt.specsAffected, ['specs/395-agent-validation-receipt/spec.md']);
    assert.equal(receipt.nextFocus, 'B302 — Agent-safe documentation updater policy');
    assert.ok(receipt.artifacts.some((artifact) => artifact.name === 'journalUri' && artifact.status === 'present'));
  });

  test('agrega receipts batch sin perder journal, bloqueos ni riesgos por item', () => {
    const batchReceipt = buildTaskExecutionBatchValidationReceipt({
      request: {
        requests: [],
        validationCommands: ['npm run build:test'],
        docsTouched: ['docs/spec-driven-development.md'],
        specsAffected: ['specs/397-agent-task-replay-from-bundle/spec.md'],
      },
      result: {
        blocked: true,
        stoppedEarly: true,
        total: 2,
        succeeded: 1,
        blockedCount: 1,
        items: [
          {
            uri: 'file:///repo/w_main.sru',
            blocked: false,
            result: {
              available: true,
              blocked: false,
              blockedReasons: [],
              safeEditPlan: {
                available: true,
                blocked: false,
                objects: [],
                files: [{ uri: 'file:///repo/w_main.sru', reason: 'focus', risk: 'low' }],
                risks: ['transaction-binding-dynamic'],
                recommendedTests: ['npm run build:test'],
                docsToReview: ['docs/ai-orchestrator.md'],
                blockedReasons: [],
              },
              appliedEdits: [],
              journalUri: 'file:///repo/.vsc-powersyntax/item-1-journal.json',
              importResult: {
                operationId: 'op-1',
                blocked: false,
                preflight: { ok: true, issues: [] },
                compileResult: { status: 'passed', summary: 'Compile OK', steps: [] },
                ledgerUri: 'file:///repo/.vsc-powersyntax/item-1-ledger.json',
              } as never,
              validationReceipt: buildTaskExecutionValidationReceipt({
                contractId: 'spec-driven-pbl-update',
                request: {
                  uri: 'file:///repo/w_main.sru',
                  executablePath: 'orca.exe',
                  sessionLibrary: 'app.pbl',
                  edits: [{ uri: 'file:///repo/w_main.sru', content: 'content' }],
                },
                result: {
                  available: true,
                  blocked: false,
                  blockedReasons: [],
                  safeEditPlan: {
                    available: true,
                    blocked: false,
                    objects: [],
                    files: [{ uri: 'file:///repo/w_main.sru', reason: 'focus', risk: 'low' }],
                    risks: ['transaction-binding-dynamic'],
                    recommendedTests: ['npm run build:test'],
                    docsToReview: ['docs/ai-orchestrator.md'],
                    blockedReasons: [],
                  },
                  appliedEdits: [],
                  journalUri: 'file:///repo/.vsc-powersyntax/item-1-journal.json',
                  importResult: {
                    operationId: 'op-1',
                    blocked: false,
                    preflight: { ok: true, issues: [] },
                    compileResult: { status: 'passed', summary: 'Compile OK', steps: [] },
                    ledgerUri: 'file:///repo/.vsc-powersyntax/item-1-ledger.json',
                  } as never,
                },
              }),
            },
          },
          {
            uri: 'file:///repo/w_other.sru',
            blocked: true,
            reason: 'Bloqueado por validación previa.',
          },
        ],
        journalUri: 'file:///repo/.vsc-powersyntax/batch-journal.json',
      },
    });

    assert.equal(batchReceipt.status, 'blocked');
    assert.ok(batchReceipt.commands.includes('powerbuilder.applySpecDrivenPblUpdateBatch'));
    assert.ok(batchReceipt.results.some((result) => result.includes('processed: 2/2')));
    assert.ok(batchReceipt.artifacts.some((artifact) => artifact.name === 'items[].reason' && artifact.status === 'present'));
    assert.ok(batchReceipt.artifacts.some((artifact) => artifact.name === 'items[].result.importResult.ledgerUri'));
  });

  test('reconstruye un replay read-only desde un semantic repro pack sample', () => {
    const manifestJson = loadFixture('agent-task-replay/semantic-repro-pack', 'manifest.json');
    const report = buildTaskReplayBundleReport({
      sourceUri: 'file:///tmp/semantic-repro-pack/manifest.json',
      manifestJson,
      files: {
        'README.md': loadFixture('agent-task-replay/semantic-repro-pack', 'README.md'),
        'current-object-context.json': '{"available":true}',
        'impact-analysis.json': '{"available":true}',
        'safe-edit-plan.json': '{"available":true}',
      },
    });

    assert.equal(report.available, true);
    assert.equal(report.bundleKind, 'semantic-repro-pack');
    assert.equal(report.recommendedContractId, 'spec-driven-pbl-update');
    assert.ok(report.referencedFiles.includes('safe-edit-plan.json'));
    assert.ok(report.suggestedCommands.some((command) => command.commandId === 'powerbuilder.safeEditPlan'));
  });

  test('reconstruye un replay read-only desde un support bundle sample', () => {
    const manifestJson = loadFixture('agent-task-replay/support-bundle', 'manifest.json');
    const report = buildTaskReplayBundleReport({
      sourceUri: 'file:///tmp/support-bundle/manifest.json',
      manifestJson,
    });

    assert.equal(report.available, true);
    assert.equal(report.bundleKind, 'support-bundle');
    assert.ok(report.referencedFiles.includes('public-contract.json'));
    assert.ok(report.suggestedCommands.some((command) => command.commandId === 'powerbuilder.checkWorkspace'));
  });
});