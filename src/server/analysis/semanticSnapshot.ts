import type { SectionRange } from '../model/types';
import type { ControlBlockRange } from '../parsing/controlBlocks';
import type { LogicalStatement } from '../parsing/statementSplitter';
import { normalizeUri } from '../system/uriUtils';
import type { Fact, Scope } from '../knowledge/types';

export type SnapshotPass = 'structural' | 'enriched';

export type LocalSemanticReadiness = 'structural-only' | 'nearby-semantic-ready';

export interface DocumentContainerModel {
  sections: SectionRange[];
  typeBlocks: Array<{ name: string; container?: string; startLine: number; endLine: number }>;
}

export interface MaskedTextModel {
  lines: string[];
  masks: Uint8Array[];
}

export interface SemanticDocumentSnapshot {
  uri: string;
  version: number;
  fingerprint: number;
  identity: string;
  pass: SnapshotPass;
  readiness: LocalSemanticReadiness;
  containerModel: DocumentContainerModel;
  symbols: Fact[];
  scopes: Scope[];
  logicalStatements: LogicalStatement[];
  maskedText: MaskedTextModel;
  controlBlocks: ControlBlockRange[];
}

export interface CreateSemanticSnapshotInput {
  uri: string;
  version: number;
  fingerprint: number;
  sections: SectionRange[];
  typeBlocks: Array<{ name: string; container?: string; startLine: number; endLine: number }>;
  strippedLines: string[];
  masks: Uint8Array[];
  semanticFacts: Fact[];
  scopes: Scope[];
  logicalStatements: LogicalStatement[];
  controlBlocks: ControlBlockRange[];
  pass?: SnapshotPass;
  readiness?: LocalSemanticReadiness;
}

const READINESS_ORDER: Record<LocalSemanticReadiness, number> = {
  'structural-only': 0,
  'nearby-semantic-ready': 1
};

export function snapshotIdentityOf(uri: string, fingerprint: number): string {
  return `${normalizeUri(uri)}@${fingerprint}`;
}

export function createSemanticSnapshot(input: CreateSemanticSnapshotInput): SemanticDocumentSnapshot {
  return {
    uri: input.uri,
    version: input.version,
    fingerprint: input.fingerprint,
    identity: snapshotIdentityOf(input.uri, input.fingerprint),
    pass: input.pass ?? 'enriched',
    readiness: input.readiness ?? 'nearby-semantic-ready',
    containerModel: {
      sections: input.sections,
      typeBlocks: input.typeBlocks
    },
    symbols: input.semanticFacts,
    scopes: input.scopes,
    logicalStatements: input.logicalStatements,
    maskedText: {
      lines: input.strippedLines,
      masks: input.masks
    },
    controlBlocks: input.controlBlocks
  };
}

export function mergeOrReplaceSnapshot(
  previous: SemanticDocumentSnapshot | undefined,
  next: SemanticDocumentSnapshot
): SemanticDocumentSnapshot {
  if (!previous || previous.identity !== next.identity) {
    return next;
  }

  return {
    ...next,
    readiness: READINESS_ORDER[previous.readiness] > READINESS_ORDER[next.readiness]
      ? previous.readiness
      : next.readiness,
    pass: previous.pass === 'enriched' ? previous.pass : next.pass
  };
}