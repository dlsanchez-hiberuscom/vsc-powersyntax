export type PbAutoBuildRunState = 'idle' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'timed-out';

export interface PbAutoBuildRunSnapshot {
  state: PbAutoBuildRunState;
  buildFileUri?: string;
  representedProjectUri?: string;
  executablePath?: string;
  startedAt?: number;
  finishedAt?: number;
  durationMs?: number;
  exitCode?: number | null;
  detail?: string;
  outputExcerpt?: string;
}

export interface PbAutoBuildRunRequest {
  executablePath: string;
  buildFileUri?: string;
  timeoutMs?: number;
}

export interface PbAutoBuildBuildFileOption {
  uri: string;
  label: string;
  detail?: string;
  representedProjectUri?: string;
}

export type PbAutoBuildProblemSeverity = 'error' | 'warning';

export interface PbAutoBuildProblem {
  uri: string;
  line: number;
  character: number;
  severity: PbAutoBuildProblemSeverity;
  message: string;
  code?: string;
  source: 'PBAutoBuild';
}

export interface PbAutoBuildProblemSummary {
  total: number;
  published: number;
  unresolved: number;
}

export interface PbAutoBuildRunResult {
  snapshot: PbAutoBuildRunSnapshot;
  output: string;
  problems?: PbAutoBuildProblem[];
  problemSummary?: PbAutoBuildProblemSummary;
}

export interface PbAutoBuildCancelResult {
  cancelled: boolean;
  snapshot: PbAutoBuildRunSnapshot;
}

export function clonePbAutoBuildRunSnapshot(snapshot: PbAutoBuildRunSnapshot): PbAutoBuildRunSnapshot {
  return {
    state: snapshot.state,
    ...(snapshot.buildFileUri ? { buildFileUri: snapshot.buildFileUri } : {}),
    ...(snapshot.representedProjectUri ? { representedProjectUri: snapshot.representedProjectUri } : {}),
    ...(snapshot.executablePath ? { executablePath: snapshot.executablePath } : {}),
    ...(typeof snapshot.startedAt === 'number' ? { startedAt: snapshot.startedAt } : {}),
    ...(typeof snapshot.finishedAt === 'number' ? { finishedAt: snapshot.finishedAt } : {}),
    ...(typeof snapshot.durationMs === 'number' ? { durationMs: snapshot.durationMs } : {}),
    ...(snapshot.exitCode !== undefined ? { exitCode: snapshot.exitCode } : {}),
    ...(snapshot.detail ? { detail: snapshot.detail } : {}),
    ...(snapshot.outputExcerpt ? { outputExcerpt: snapshot.outputExcerpt } : {})
  };
}

export function clonePbAutoBuildBuildFileOption(option: PbAutoBuildBuildFileOption): PbAutoBuildBuildFileOption {
  return {
    uri: option.uri,
    label: option.label,
    ...(option.detail ? { detail: option.detail } : {}),
    ...(option.representedProjectUri ? { representedProjectUri: option.representedProjectUri } : {})
  };
}

export function clonePbAutoBuildRunResult(result: PbAutoBuildRunResult): PbAutoBuildRunResult {
  return {
    snapshot: clonePbAutoBuildRunSnapshot(result.snapshot),
    output: result.output,
    ...(result.problems ? {
      problems: result.problems.map((problem) => ({
        uri: problem.uri,
        line: problem.line,
        character: problem.character,
        severity: problem.severity,
        message: problem.message,
        ...(problem.code ? { code: problem.code } : {}),
        source: problem.source
      }))
    } : {}),
    ...(result.problemSummary ? {
      problemSummary: {
        total: result.problemSummary.total,
        published: result.problemSummary.published,
        unresolved: result.problemSummary.unresolved
      }
    } : {})
  };
}