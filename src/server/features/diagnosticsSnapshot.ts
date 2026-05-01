/**
 * Diagnostics snapshot (Spec 053 / B063).
 *
 * @module features/diagnosticsSnapshot
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';

const UNASSIGNED_PROJECT_KEY = '__workspace__';
const UNASSIGNED_PROJECT_LABEL = 'workspace';

export interface DiagnosticsSnapshotInputEntry {
  diagnostics: readonly Diagnostic[];
  projectKey?: string;
  projectLabel?: string;
  objectKey?: string;
  objectLabel?: string;
  documentVersion?: number;
  snapshotVersion?: number;
  snapshotIdentity?: string;
}

export interface DiagnosticsSnapshotDocumentNode {
  uri: string;
  total: number;
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
  projectKey: string;
  projectLabel: string;
  objectKey: string;
  objectLabel: string;
  documentVersion?: number;
  snapshotVersion?: number;
  snapshotIdentity?: string;
}

export interface DiagnosticsSnapshotObjectNode {
  key: string;
  label: string;
  total: number;
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
  documents: DiagnosticsSnapshotDocumentNode[];
}

export interface DiagnosticsSnapshotProjectNode {
  key: string;
  label: string;
  total: number;
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
  objects: DiagnosticsSnapshotObjectNode[];
}

export interface DiagnosticsSnapshot {
  totals: { error: number; warning: number; info: number; hint: number };
  byFile: Record<string, number>;
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
  documents: DiagnosticsSnapshotDocumentNode[];
  projects: DiagnosticsSnapshotProjectNode[];
}

type DiagnosticsSnapshotEntryValue = readonly Diagnostic[] | DiagnosticsSnapshotInputEntry;

function isDiagnosticsSnapshotInputEntry(value: DiagnosticsSnapshotEntryValue): value is DiagnosticsSnapshotInputEntry {
  return !Array.isArray(value);
}

function severityKey(severity: DiagnosticSeverity | undefined): 'error' | 'warning' | 'info' | 'hint' {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return 'error';
    case DiagnosticSeverity.Warning:
      return 'warning';
    case DiagnosticSeverity.Hint:
      return 'hint';
    case DiagnosticSeverity.Information:
    default:
      return 'info';
  }
}

function accumulateCounts(target: Record<string, number>, source: Record<string, number>): void {
  for (const [key, count] of Object.entries(source)) {
    target[key] = (target[key] ?? 0) + count;
  }
}

function summarizeDiagnostics(diagnostics: readonly Diagnostic[]): {
  totals: DiagnosticsSnapshot['totals'];
  byCode: Record<string, number>;
  bySeverity: Record<string, number>;
} {
  const totals = { error: 0, warning: 0, info: 0, hint: 0 };
  const byCode: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const diagnostic of diagnostics) {
    const severity = severityKey(diagnostic.severity);
    totals[severity]++;
    bySeverity[severity] = (bySeverity[severity] ?? 0) + 1;

    const codeKey = `${diagnostic.source ?? 'unknown'}:${diagnostic.code ?? 'n/a'}`;
    byCode[codeKey] = (byCode[codeKey] ?? 0) + 1;
  }

  return { totals, byCode, bySeverity };
}

function deriveFallbackObjectLabel(uri: string): string {
  const normalized = uri.replace(/[?#].*$/, '').replace(/\/+$/, '');
  const fileName = normalized.slice(normalized.lastIndexOf('/') + 1);
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName || uri;
}

function normalizeEntry(uri: string, value: DiagnosticsSnapshotEntryValue): DiagnosticsSnapshotInputEntry {
  if (!isDiagnosticsSnapshotInputEntry(value)) {
    const objectLabel = deriveFallbackObjectLabel(uri);
    return {
      diagnostics: value,
      projectKey: UNASSIGNED_PROJECT_KEY,
      projectLabel: UNASSIGNED_PROJECT_LABEL,
      objectKey: objectLabel.toLowerCase(),
      objectLabel,
    };
  }

  const objectLabel = value.objectLabel ?? deriveFallbackObjectLabel(uri);
  return {
    diagnostics: value.diagnostics,
    projectKey: value.projectKey ?? UNASSIGNED_PROJECT_KEY,
    projectLabel: value.projectLabel ?? UNASSIGNED_PROJECT_LABEL,
    objectKey: value.objectKey ?? objectLabel.toLowerCase(),
    objectLabel,
    ...(value.documentVersion !== undefined ? { documentVersion: value.documentVersion } : {}),
    ...(value.snapshotVersion !== undefined ? { snapshotVersion: value.snapshotVersion } : {}),
    ...(value.snapshotIdentity ? { snapshotIdentity: value.snapshotIdentity } : {}),
  };
}

function compareLabels(left: { label: string; total: number }, right: { label: string; total: number }): number {
  if (left.total !== right.total) {
    return right.total - left.total;
  }

  return left.label.localeCompare(right.label);
}

export function buildDiagnosticsSnapshot(
  byUri: ReadonlyMap<string, DiagnosticsSnapshotEntryValue>
): DiagnosticsSnapshot {
  const totals = { error: 0, warning: 0, info: 0, hint: 0 };
  const byFile: Record<string, number> = {};
  const byCode: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  const documents: DiagnosticsSnapshotDocumentNode[] = [];
  const projectRecords = new Map<string, {
    node: DiagnosticsSnapshotProjectNode;
    objects: Map<string, DiagnosticsSnapshotObjectNode>;
  }>();

  for (const [uri, rawEntry] of byUri) {
    const entry = normalizeEntry(uri, rawEntry);
    if (entry.diagnostics.length === 0) {
      continue;
    }

    const summary = summarizeDiagnostics(entry.diagnostics);
    byFile[uri] = entry.diagnostics.length;
    totals.error += summary.totals.error;
    totals.warning += summary.totals.warning;
    totals.info += summary.totals.info;
    totals.hint += summary.totals.hint;
    accumulateCounts(byCode, summary.byCode);
    accumulateCounts(bySeverity, summary.bySeverity);

    const documentNode: DiagnosticsSnapshotDocumentNode = {
      uri,
      total: entry.diagnostics.length,
      byCode: { ...summary.byCode },
      bySeverity: { ...summary.bySeverity },
      projectKey: entry.projectKey ?? UNASSIGNED_PROJECT_KEY,
      projectLabel: entry.projectLabel ?? UNASSIGNED_PROJECT_LABEL,
      objectKey: entry.objectKey ?? deriveFallbackObjectLabel(uri).toLowerCase(),
      objectLabel: entry.objectLabel ?? deriveFallbackObjectLabel(uri),
      ...(entry.documentVersion !== undefined ? { documentVersion: entry.documentVersion } : {}),
      ...(entry.snapshotVersion !== undefined ? { snapshotVersion: entry.snapshotVersion } : {}),
      ...(entry.snapshotIdentity ? { snapshotIdentity: entry.snapshotIdentity } : {}),
    };

    documents.push(documentNode);

    let projectRecord = projectRecords.get(documentNode.projectKey);
    if (!projectRecord) {
      projectRecord = {
        node: {
          key: documentNode.projectKey,
          label: documentNode.projectLabel,
          total: 0,
          byCode: {},
          bySeverity: {},
          objects: [],
        },
        objects: new Map<string, DiagnosticsSnapshotObjectNode>(),
      };
      projectRecords.set(documentNode.projectKey, projectRecord);
    }

    let objectNode = projectRecord.objects.get(documentNode.objectKey);
    if (!objectNode) {
      objectNode = {
        key: documentNode.objectKey,
        label: documentNode.objectLabel,
        total: 0,
        byCode: {},
        bySeverity: {},
        documents: [],
      };
      projectRecord.objects.set(documentNode.objectKey, objectNode);
    }

    objectNode.documents.push(documentNode);
    objectNode.total += documentNode.total;
    accumulateCounts(objectNode.byCode, documentNode.byCode);
    accumulateCounts(objectNode.bySeverity, documentNode.bySeverity);

    projectRecord.node.total += documentNode.total;
    accumulateCounts(projectRecord.node.byCode, documentNode.byCode);
    accumulateCounts(projectRecord.node.bySeverity, documentNode.bySeverity);
  }

  const projects = Array.from(projectRecords.values())
    .map(({ node, objects }) => ({
      ...node,
      objects: Array.from(objects.values())
        .map((objectNode) => ({
          ...objectNode,
          documents: [...objectNode.documents].sort((left, right) => {
            if (left.total !== right.total) {
              return right.total - left.total;
            }
            return left.uri.localeCompare(right.uri);
          }),
        }))
        .sort(compareLabels),
    }))
    .sort(compareLabels);

  return {
    totals,
    byFile,
    byCode,
    bySeverity,
    documents: documents.sort((left, right) => {
      if (left.total !== right.total) {
        return right.total - left.total;
      }
      return left.uri.localeCompare(right.uri);
    }),
    projects,
  };
}
