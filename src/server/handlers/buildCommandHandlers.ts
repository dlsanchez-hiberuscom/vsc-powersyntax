import type { ExecuteCommandParams } from 'vscode-languageserver/node';

import type { PbAutoBuildRunResult } from '../../shared/pbAutoBuildProtocol';
import type { OrcaRunResult } from '../../shared/orcaProtocol';
import { formatDocument } from '../features/formatDocument';
import { selectPbAutoBuildBuildFile, type PbAutoBuildRunnerRequest, PbAutoBuildRunner } from '../build/pbAutoBuildRunner';
import { parsePbAutoBuildLog } from '../build/pbAutoBuildLogParser';
import { resolvePbAutoBuildProblems } from '../build/pbAutoBuildProblems';
import { OrcaRunner, type OrcaRunnerRequest } from '../build/orcaRunner';
import { prepareOrcaStagingExport } from '../build/orcaStagingExport';
import { runOrcaStagingImport, runOrcaWriteOperation } from '../build/orcaStagingImport';
import { BuildOrcaJournalStore } from '../runtime/buildOrcaJournalStore';
import { RuntimeJournal } from '../runtime/runtimeJournal';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { WorkspaceState } from '../workspace/workspaceState';
import { NodeFileSystem } from '../system/fileSystem';

export interface BuildCommandHandlerContext {
  workspaceState: WorkspaceState;
  knowledgeBase: KnowledgeBase;
  runtimeJournal: RuntimeJournal;
  buildOrcaJournal: BuildOrcaJournalStore;
  pbAutoBuildRunner: PbAutoBuildRunner;
  orcaRunner: OrcaRunner;
  fs: NodeFileSystem;
  getActiveDocumentUri(): string | null;
  getWorkspaceFolders(): string[];
  basenameFromPathOrUri(value: string): string;
  runPbAutoBuildWithBackpressure(request: PbAutoBuildRunnerRequest): Promise<PbAutoBuildRunResult>;
  runOrcaWithBackpressure(request: OrcaRunnerRequest): Promise<OrcaRunResult>;
}

export async function tryHandleBuildCommand(
  params: ExecuteCommandParams,
  context: BuildCommandHandlerContext,
): Promise<{ handled: boolean; result?: unknown }> {
  const {
    workspaceState,
    knowledgeBase,
    runtimeJournal,
    buildOrcaJournal,
    pbAutoBuildRunner,
    orcaRunner,
    fs,
    getActiveDocumentUri,
    getWorkspaceFolders,
    basenameFromPathOrUri,
    runPbAutoBuildWithBackpressure,
    runOrcaWithBackpressure,
  } = context;

  switch (params.command) {
    case 'powerbuilder.formatDocument': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        throw new Error('Solicitud de formato inválida.');
      }
      return { handled: true, result: formatDocument(request as Parameters<typeof formatDocument>[0]) };
    }
    case 'powerbuilder.runPbAutoBuild': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        throw new Error('Solicitud de build inválida.');
      }

      const executablePath = typeof (request as { executablePath?: unknown }).executablePath === 'string'
        ? (request as { executablePath: string }).executablePath
        : '';
      const buildFileUri = typeof (request as { buildFileUri?: unknown }).buildFileUri === 'string'
        ? (request as { buildFileUri: string }).buildFileUri
        : undefined;
      const timeoutMs = typeof (request as { timeoutMs?: unknown }).timeoutMs === 'number'
        ? (request as { timeoutMs: number }).timeoutMs
        : undefined;

      const activeProjectUri = workspaceState.getProjectContextForFile(getActiveDocumentUri())?.projectUri;
      const selection = selectPbAutoBuildBuildFile(workspaceState.getBuildFiles(), activeProjectUri, buildFileUri);
      if (!selection.buildFile) {
        throw new Error(selection.detail ?? 'No se pudo seleccionar un build file utilizable.');
      }

      const runResult = await runPbAutoBuildWithBackpressure({
        executablePath,
        buildFile: selection.buildFile,
        timeoutMs
      });

      const parsed = parsePbAutoBuildLog(runResult.output);
      const resolvedProblems = resolvePbAutoBuildProblems(
        parsed.issues,
        knowledgeBase,
        workspaceState,
        selection.buildFile.representedProjectUri
      );
      runtimeJournal.record({
        phase: 'build',
        kind: 'pbautobuild-problems',
        action: 'parsed',
        severity: resolvedProblems.summary.unresolved > 0 ? 'warning' : 'info',
        detail: {
          buildFileUri: selection.buildFile.uri,
          representedProjectUri: selection.buildFile.representedProjectUri,
          total: resolvedProblems.summary.total,
          published: resolvedProblems.summary.published,
          unresolved: resolvedProblems.summary.unresolved,
          parserSummary: parsed.summary,
        }
      });

      return {
        handled: true,
        result: {
          ...runResult,
          problems: resolvedProblems.problems,
          problemSummary: resolvedProblems.summary
        }
      };
    }
    case 'powerbuilder.listPbAutoBuildBuildFiles': {
      return {
        handled: true,
        result: workspaceState.getBuildFiles()
          .filter((buildFile) => buildFile.status === 'usable')
          .map((buildFile) => ({
            uri: buildFile.uri,
            label: basenameFromPathOrUri(buildFile.uri),
            ...(buildFile.detail ? { detail: buildFile.detail } : {}),
            ...(buildFile.representedProjectUri ? { representedProjectUri: buildFile.representedProjectUri } : {})
          }))
      };
    }
    case 'powerbuilder.listPbAutoBuildBuildInventory': {
      return {
        handled: true,
        result: workspaceState.getBuildFiles().map((buildFile) => ({
          uri: buildFile.uri,
          label: basenameFromPathOrUri(buildFile.uri),
          status: buildFile.status,
          ...(buildFile.reasonCode ? { reasonCode: buildFile.reasonCode } : {}),
          ...(buildFile.detail ? { detail: buildFile.detail } : {}),
          ...(buildFile.representedProjectUri ? { representedProjectUri: buildFile.representedProjectUri } : {}),
        }))
      };
    }
    case 'powerbuilder.cancelPbAutoBuild': {
      const snapshot = pbAutoBuildRunner.cancel();
      return {
        handled: true,
        result: {
          cancelled: snapshot !== null,
          snapshot: snapshot ?? pbAutoBuildRunner.getSnapshot()
        }
      };
    }
    case 'powerbuilder.runOrcaScript': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        throw new Error('Solicitud ORCA inválida.');
      }

      const executablePath = typeof (request as { executablePath?: unknown }).executablePath === 'string'
        ? (request as { executablePath: string }).executablePath
        : '';
      const scriptUri = typeof (request as { scriptUri?: unknown }).scriptUri === 'string'
        ? (request as { scriptUri: string }).scriptUri
        : '';
      const timeoutMs = typeof (request as { timeoutMs?: unknown }).timeoutMs === 'number'
        ? (request as { timeoutMs: number }).timeoutMs
        : undefined;

      return {
        handled: true,
        result: await runOrcaWithBackpressure({
          executablePath,
          scriptUri,
          timeoutMs
        })
      };
    }
    case 'powerbuilder.cancelOrcaScript': {
      const snapshot = orcaRunner.cancel();
      return {
        handled: true,
        result: {
          cancelled: snapshot !== null,
          snapshot: snapshot ?? orcaRunner.getSnapshot()
        }
      };
    }
    case 'powerbuilder.exportOrcaStaging': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        throw new Error('Solicitud de export ORCA inválida.');
      }

      const executablePath = typeof (request as { executablePath?: unknown }).executablePath === 'string'
        ? (request as { executablePath: string }).executablePath
        : '';
      const sessionLibrary = typeof (request as { sessionLibrary?: unknown }).sessionLibrary === 'string'
        ? (request as { sessionLibrary: string }).sessionLibrary
        : '';
      const focusUri = typeof (request as { focusUri?: unknown }).focusUri === 'string'
        ? (request as { focusUri: string }).focusUri
        : getActiveDocumentUri() ?? undefined;
      const timeoutMs = typeof (request as { timeoutMs?: unknown }).timeoutMs === 'number'
        ? (request as { timeoutMs: number }).timeoutMs
        : undefined;

      const prepared = await prepareOrcaStagingExport({
        executablePath,
        sessionLibrary,
        focusUri,
        timeoutMs
      }, {
        workspaceFolders: getWorkspaceFolders(),
        workspaceState,
        fs,
      });

      const result = await runOrcaWithBackpressure({
        executablePath,
        scriptUri: prepared.scriptUri,
        timeoutMs,
      });

      runtimeJournal.record({
        phase: 'legacy',
        kind: 'orca-export',
        action: result.snapshot.state === 'failed' || result.snapshot.state === 'timed-out' ? 'failed' : 'completed',
        severity: result.snapshot.state === 'failed' || result.snapshot.state === 'timed-out' ? 'warning' : 'info',
        detail: {
          stateUri: prepared.stateUri,
          scriptUri: prepared.scriptUri,
          stagingRootUri: prepared.stagingRootUri,
          sessionLibrary: prepared.sessionLibrary,
          ...(prepared.selectedProject ? { selectedProject: prepared.selectedProject } : {}),
          exportedLibraries: prepared.exportedLibraries.map((library) => ({
            libraryUri: library.libraryUri,
            stagingDirectoryUri: library.stagingDirectoryUri,
          })),
        }
      });

      return {
        handled: true,
        result: {
          ...result,
          stagingRootUri: prepared.stagingRootUri,
          scriptUri: prepared.scriptUri,
          stateUri: prepared.stateUri,
          exportedLibraries: prepared.exportedLibraries,
          sessionLibrary: prepared.sessionLibrary,
          ...(prepared.selectedProject ? { selectedProject: prepared.selectedProject } : {}),
        }
      };
    }
    case 'powerbuilder.importOrcaStaging': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        throw new Error('Solicitud de import ORCA inválida.');
      }

      const executablePath = typeof (request as { executablePath?: unknown }).executablePath === 'string'
        ? (request as { executablePath: string }).executablePath
        : '';
      const sessionLibrary = typeof (request as { sessionLibrary?: unknown }).sessionLibrary === 'string'
        ? (request as { sessionLibrary: string }).sessionLibrary
        : '';
      const focusUri = typeof (request as { focusUri?: unknown }).focusUri === 'string'
        ? (request as { focusUri: string }).focusUri
        : getActiveDocumentUri() ?? undefined;
      const timeoutMs = typeof (request as { timeoutMs?: unknown }).timeoutMs === 'number'
        ? (request as { timeoutMs: number }).timeoutMs
        : undefined;

      return {
        handled: true,
        result: await runOrcaStagingImport({
          executablePath,
          sessionLibrary,
          focusUri,
          timeoutMs,
        }, {
          workspaceFolders: getWorkspaceFolders(),
          workspaceState,
          fs,
          runOrca: (orcaRequest) => runOrcaWithBackpressure(orcaRequest),
          journal: runtimeJournal,
        })
      };
    }
    case 'powerbuilder.regenerateOrcaLibraries':
    case 'powerbuilder.rebuildOrcaProject': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        throw new Error('Solicitud ORCA legacy inválida.');
      }

      const executablePath = typeof (request as { executablePath?: unknown }).executablePath === 'string'
        ? (request as { executablePath: string }).executablePath
        : '';
      const sessionLibrary = typeof (request as { sessionLibrary?: unknown }).sessionLibrary === 'string'
        ? (request as { sessionLibrary: string }).sessionLibrary
        : '';
      const focusUri = typeof (request as { focusUri?: unknown }).focusUri === 'string'
        ? (request as { focusUri: string }).focusUri
        : getActiveDocumentUri() ?? undefined;
      const timeoutMs = typeof (request as { timeoutMs?: unknown }).timeoutMs === 'number'
        ? (request as { timeoutMs: number }).timeoutMs
        : undefined;

      return {
        handled: true,
        result: await runOrcaWriteOperation({
          executablePath,
          sessionLibrary,
          focusUri,
          timeoutMs,
          operation: params.command === 'powerbuilder.regenerateOrcaLibraries' ? 'regenerate' : 'rebuild',
        }, {
          workspaceFolders: getWorkspaceFolders(),
          workspaceState,
          fs,
          runOrca: (orcaRequest) => runOrcaWithBackpressure(orcaRequest),
          journal: runtimeJournal,
        })
      };
    }
    default:
      return { handled: false };
  }
}