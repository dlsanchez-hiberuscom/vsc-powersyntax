import type { PbAutoBuildProblem, PbAutoBuildProblemSummary } from '../../shared/pbAutoBuildProtocol';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { EntityKind } from '../knowledge/types';
import type { WorkspaceState } from '../workspace/workspaceState';
import type { PbAutoBuildLogIssue } from './pbAutoBuildLogParser';

export interface ResolvePbAutoBuildProblemsResult {
  problems: PbAutoBuildProblem[];
  summary: PbAutoBuildProblemSummary;
}

export function resolvePbAutoBuildProblems(
  issues: readonly PbAutoBuildLogIssue[],
  knowledgeBase: KnowledgeBase,
  workspaceState: WorkspaceState,
  representedProjectUri?: string
): ResolvePbAutoBuildProblemsResult {
  const problems: PbAutoBuildProblem[] = [];

  for (const issue of issues) {
    const target = resolveProblemTarget(issue, knowledgeBase, workspaceState, representedProjectUri);
    if (!target) {
      continue;
    }

    problems.push({
      uri: target.uri,
      line: target.line,
      character: target.character,
      severity: issue.severity,
      message: issue.message,
      ...(buildProblemCode(issue) ? { code: buildProblemCode(issue) } : {}),
      source: 'PBAutoBuild'
    });
  }

  return {
    problems,
    summary: {
      total: issues.length,
      published: problems.length,
      unresolved: Math.max(0, issues.length - problems.length)
    }
  };
}

function resolveProblemTarget(
  issue: PbAutoBuildLogIssue,
  knowledgeBase: KnowledgeBase,
  workspaceState: WorkspaceState,
  representedProjectUri?: string
): { uri: string; line: number; character: number } | null {
  const objectName = issue.objectName?.trim();
  if (!objectName) {
    return null;
  }

  let candidates = knowledgeBase.findAllDefinitions(objectName).filter((entity) => entity.kind === EntityKind.Type);
  if (representedProjectUri) {
    const scopedCandidates = candidates.filter(
      (entity) => workspaceState.getProjectContextForFile(entity.uri)?.projectUri === representedProjectUri
    );
    if (scopedCandidates.length > 0) {
      candidates = scopedCandidates;
    }
  }

  const uniqueCandidates = new Map<string, { uri: string; line: number; character: number }>();
  for (const candidate of candidates) {
    uniqueCandidates.set(candidate.uri, {
      uri: candidate.uri,
      line: candidate.line,
      character: candidate.character
    });
  }

  if (uniqueCandidates.size !== 1) {
    return null;
  }

  return [...uniqueCandidates.values()][0] ?? null;
}

function buildProblemCode(issue: PbAutoBuildLogIssue): string | undefined {
  const parts = [issue.compilerCode, issue.nativeCode].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join('/') : undefined;
}