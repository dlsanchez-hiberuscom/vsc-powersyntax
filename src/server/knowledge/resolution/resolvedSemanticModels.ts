import type { SourceOrigin } from '../../../shared/sourceOrigin';
import type { Entity, EntityKind } from '../types';
import type {
  QueryAmbiguityKind,
  QueryReasonCode,
  QueryResolutionConfidence,
  ResolvedTargetInfo,
} from './semanticQueryService';

export type SemanticResolutionConfidence = QueryResolutionConfidence | 'unknown';

export interface ResolvedSymbolModel {
  identity: string;
  name: string;
  kind: EntityKind;
  uri: string;
  line: number;
  character: number;
  owner?: string;
  sourceOrigin?: SourceOrigin;
  confidence: SemanticResolutionConfidence;
  reasonCodes: QueryReasonCode[];
  ambiguityKind?: QueryAmbiguityKind;
}

export interface ResolvedSymbolSet {
  symbols: ResolvedSymbolModel[];
  confidence: SemanticResolutionConfidence;
  reasonCodes: QueryReasonCode[];
  ambiguityKind?: QueryAmbiguityKind;
  targetCount: number;
}

export interface ResolvedReceiverModel {
  expression: string;
  ownerType: string | null;
  confidence: SemanticResolutionConfidence;
  reasonCodes: QueryReasonCode[];
}

export interface ResolvedCallableModel {
  symbol: ResolvedSymbolModel;
  signature?: string;
  parameterLabels: string[];
  returnType?: string;
}

export interface ResolvedEnumContextModel {
  enumTypeName: string;
  dataWindowContext: boolean;
  confidence: SemanticResolutionConfidence;
  reasonCodes: QueryReasonCode[];
}

export function toResolvedSymbolModel(
  entity: Entity,
  resolution?: ResolvedTargetInfo | null,
): ResolvedSymbolModel {
  return {
    identity: entity.id,
    name: entity.name,
    kind: entity.kind,
    uri: entity.uri,
    line: entity.line,
    character: entity.character,
    ...(entity.containerName ?? entity.ownerName ? { owner: entity.containerName ?? entity.ownerName } : {}),
    ...(entity.lineage?.sourceOrigin ? { sourceOrigin: entity.lineage.sourceOrigin } : {}),
    confidence: resolution?.confidence ?? 'unknown',
    reasonCodes: resolution?.reasonCodes ?? [],
    ...(resolution?.ambiguityKind ? { ambiguityKind: resolution.ambiguityKind } : {}),
  };
}

export function toResolvedSymbolSet(resolution: ResolvedTargetInfo | null): ResolvedSymbolSet {
  return {
    symbols: resolution?.targets.map((target) => toResolvedSymbolModel(target, resolution)) ?? [],
    confidence: resolution?.confidence ?? 'unknown',
    reasonCodes: resolution?.reasonCodes ?? [],
    ...(resolution?.ambiguityKind ? { ambiguityKind: resolution.ambiguityKind } : {}),
    targetCount: resolution?.targets.length ?? 0,
  };
}