import type { Position } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import {
  collectDataObjectBindings,
  type DataWindowBindingSummary,
} from '../features/dataWindowBindingModel';
import {
  createDocumentQueryContext,
  resolveDocumentQualifierType,
  type DocumentQueryContext,
} from '../features/queryContext';
import type { QueryConsumerId } from '../features/queryScopePolicy';
import type { DocumentCache } from '../knowledge/DocumentCache';
import type { HotContextCache } from '../knowledge/HotContextCache';
import type { KnowledgeBase } from '../knowledge/KnowledgeBase';
import type { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { DocumentationLocale } from '../knowledge/system/localization';
import type { SystemCatalog } from '../knowledge/system/SystemCatalog';
import type { Entity, Scope } from '../knowledge/types';
import { getDocumentLineText } from '../utils/documentLineText';
import { findPowerBuilderIdentifierSpan, type IdentifierSpan } from '../utils/pbIdentifier';
import type { WorkspaceState } from '../workspace/workspaceState';
import {
  buildInteractiveServingCacheKey,
  type InteractiveServingCacheFeature,
  type InteractiveServingCacheKeyDescriptor,
} from './cacheKeyContract';

import type { SourceOrigin } from '../../shared/sourceOrigin';

export interface ActiveDocumentServingSnapshotContext {
  document: TextDocument;
  knowledgeBase: KnowledgeBase;
  documentCache: Pick<DocumentCache, 'getSnapshot'>;
  hotContextCache?: HotContextCache;
  inheritanceGraph: InheritanceGraph;
  systemCatalog: SystemCatalog;
  workspaceState: Pick<WorkspaceState, 'getSourceOrigin' | 'inferSourceOriginForUri'>;
  locale?: DocumentationLocale;
}

export interface ActiveDocumentServingScopeView {
  id?: string;
  kind?: Scope['kind'];
  startLine?: number;
  endLine?: number;
}

export interface ActiveDocumentServingReceiverView {
  qualifier?: string;
  receiverType?: string;
}

export interface ActiveDocumentServingBindingView {
  state: DataWindowBindingSummary['state'] | 'unknown';
  targetName?: string;
  line?: number;
  dataObject?: string | null;
  targetUri?: string;
  retrieveArguments?: DataWindowBindingSummary['retrieveArguments'];
}

export interface ActiveDocumentServingHotMembersView {
  state: 'hot' | 'partial';
  members: Entity[];
}

function findInnermostScope(scopes: readonly Scope[], line: number): Scope | undefined {
  for (const scope of scopes) {
    if (line < scope.startLine || line > scope.endLine) {
      continue;
    }

    const child = findInnermostScope(scope.children, line);
    return child ?? scope;
  }

  return undefined;
}

export class ActiveDocumentServingSnapshot {
  readonly uri: string;
  readonly documentVersion: number;
  readonly kbVersion: number;
  /**
   * CACHE-P0-SERVING-KEY-DOCUMENT-EPOCH-01:
   * Per-document content fingerprint. Only changes when THIS document changes,
   * not when any other document is indexed. Replaces global semanticEpoch.
   */
  readonly documentFingerprint: number | string;
  readonly sourceOrigin: SourceOrigin | 'unknown';
  readonly locale: DocumentationLocale;

  private readonly semanticSnapshot: SemanticDocumentSnapshot | null;

  constructor(private readonly context: ActiveDocumentServingSnapshotContext) {
    this.uri = context.document.uri;
    this.documentVersion = context.document.version;
    this.kbVersion = context.knowledgeBase.version;
    this.sourceOrigin = context.workspaceState.getSourceOrigin(context.document.uri)
      ?? context.workspaceState.inferSourceOriginForUri(context.document.uri);
    this.locale = context.locale ?? 'en';
    this.semanticSnapshot = context.documentCache.getSnapshot(context.document.uri)
      ?? context.knowledgeBase.getDocumentSnapshot(context.document.uri)
      ?? null;
    // CACHE-P0-SERVING-KEY-DOCUMENT-EPOCH-01:
    // Use per-document fingerprint instead of global semanticEpoch.
    // Falls back to documentVersion if no semantic snapshot is available.
    this.documentFingerprint = this.semanticSnapshot?.fingerprint ?? this.documentVersion;
  }

  hasSemanticSnapshot(): boolean {
    return this.semanticSnapshot !== null;
  }

  getLineText(line: number): string {
    return getDocumentLineText(this.context.document, line);
  }

  getMaskedCharacterType(position: Position): number | undefined {
    return this.semanticSnapshot?.maskedText.masks[position.line]?.[position.character];
  }

  getTokenAt(position: Position): IdentifierSpan | null {
    const lineText = this.getLineText(position.line);
    return findPowerBuilderIdentifierSpan(lineText, position.character, { allowCursorAfterIdentifier: true });
  }

  getScopeAt(position: Position): ActiveDocumentServingScopeView {
    const scope = this.semanticSnapshot ? findInnermostScope(this.semanticSnapshot.scopes, position.line) : undefined;
    if (!scope) {
      return {};
    }

    return {
      id: scope.id,
      kind: scope.kind,
      startLine: scope.startLine,
      endLine: scope.endLine,
    };
  }

  getQueryContext(position: Position, traceLabel?: string, consumer?: QueryConsumerId): DocumentQueryContext {
    return createDocumentQueryContext(
      this.context.document,
      position,
      this.context.knowledgeBase,
      this.context.inheritanceGraph,
      this.context.hotContextCache,
      traceLabel,
      consumer,
    );
  }

  getSymbolAt(position: Position, traceLabel?: string, consumer?: QueryConsumerId): Entity | undefined {
    const queryContext = this.getQueryContext(position, traceLabel, consumer);
    return queryContext.resolvedTargets?.targets[0] ?? queryContext.currentMainObject;
  }

  getReceiverAt(position: Position): ActiveDocumentServingReceiverView {
    const queryContext = this.getQueryContext(position);
    const qualifier = queryContext.context?.qualifier;
    if (!qualifier) {
      return {};
    }

    return {
      qualifier,
      receiverType: resolveDocumentQualifierType(
        this.context.document,
        qualifier,
        position,
        this.context.knowledgeBase,
        this.context.hotContextCache,
      ),
    };
  }

  getBindingAt(position: Position): ActiveDocumentServingBindingView {
    if (!this.semanticSnapshot) {
      return { state: 'unknown' };
    }

    const bindings = collectDataObjectBindings(
      this.semanticSnapshot,
      this.context.knowledgeBase,
      Math.max(0, position.line - 50),
      position.line,
    );
    const binding = [...bindings].reverse().find((candidate) => candidate.line <= position.line);
    if (!binding) {
      return { state: 'unknown' };
    }

    return {
      state: binding.state,
      targetName: binding.targetName,
      line: binding.line,
      ...(binding.dataObject !== undefined ? { dataObject: binding.dataObject } : {}),
      ...(binding.targetUri ? { targetUri: binding.targetUri } : {}),
      retrieveArguments: [...binding.retrieveArguments],
    };
  }

  getHotMembers(typeName: string): ActiveDocumentServingHotMembersView {
    const members = this.context.hotContextCache?.getInheritedMembers(typeName);
    if (!members) {
      return { state: 'partial', members: [] };
    }

    return { state: 'hot', members };
  }

  getLanguageSymbol(identifier: string) {
    return this.context.systemCatalog.resolveLanguageSymbol(identifier);
  }

  buildCacheKey(
    feature: InteractiveServingCacheFeature,
    descriptor: Omit<
      InteractiveServingCacheKeyDescriptor,
      'cacheClass' | 'feature' | 'uri' | 'documentVersion' | 'kbVersion' | 'documentFingerprint' | 'sourceOrigin' | 'locale'
    > & { cacheClass: InteractiveServingCacheKeyDescriptor['cacheClass'] }
  ): string {
    return buildInteractiveServingCacheKey({
      ...descriptor,
      feature,
      uri: this.uri,
      documentVersion: this.documentVersion,
      kbVersion: this.kbVersion,
      documentFingerprint: this.documentFingerprint,
      sourceOrigin: this.sourceOrigin,
      locale: this.locale,
    });
  }
}