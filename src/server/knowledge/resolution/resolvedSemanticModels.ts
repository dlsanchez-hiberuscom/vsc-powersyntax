import type { SourceOrigin } from '../../../shared/sourceOrigin';
import type { Entity, EntityKind } from '../types';
import { buildSymbolKey } from '../symbolKey';
import type {
  QueryAmbiguityKind,
  QueryReasonCode,
  QueryResolutionConfidence,
  ResolvedTargetInfo,
} from './semanticQueryService';

export type SemanticResolutionConfidence = QueryResolutionConfidence | 'unknown';

export interface CanonicalSymbolModel {
  identity: string;
  identityKey: string;
  name: string;
  normalizedName: string;
  kind: EntityKind;
  uri: string;
  line: number;
  character: number;
  owner?: string;
  fileObjectName?: string;
  containerSignature?: string;
  documentation?: string;
  scope?: Entity['scope'];
  declarationScope?: Entity['declarationScope'];
  implementationKind?: Entity['implementationKind'];
  datatype?: string;
  signature?: string;
  parameterCount?: number;
  returnType?: string;
  sourceOrigin?: SourceOrigin;
  confidence: SemanticResolutionConfidence;
  reasonCodes: QueryReasonCode[];
  ambiguityKind?: QueryAmbiguityKind;
}

export interface ResolvedSymbolModel extends CanonicalSymbolModel {}

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

export function toCanonicalSymbolModel(
  entity: Entity,
  resolution?: ResolvedTargetInfo | null,
): CanonicalSymbolModel {
  const parameterCount = typeof entity.parameterCount === 'number'
    ? entity.parameterCount
    : entity.parameters?.length;

  return {
    identity: entity.id,
    identityKey: buildSymbolKey(entity),
    name: entity.name,
    normalizedName: entity.id,
    kind: entity.kind,
    uri: entity.uri,
    line: entity.line,
    character: entity.character,
    ...(entity.containerName ?? entity.ownerName ? { owner: entity.containerName ?? entity.ownerName } : {}),
    ...(entity.fileObjectName ? { fileObjectName: entity.fileObjectName } : {}),
    ...(entity.containerSignature ? { containerSignature: entity.containerSignature } : {}),
    ...(entity.documentation ? { documentation: entity.documentation } : {}),
    ...(entity.scope ? { scope: entity.scope } : {}),
    ...(entity.declarationScope ? { declarationScope: entity.declarationScope } : {}),
    ...(entity.implementationKind ? { implementationKind: entity.implementationKind } : {}),
    ...(entity.datatype ? { datatype: entity.datatype } : {}),
    ...(entity.signature ?? entity.signatureLabel ? { signature: entity.signature ?? entity.signatureLabel } : {}),
    ...(parameterCount !== undefined ? { parameterCount } : {}),
    ...(entity.returnType ? { returnType: entity.returnType } : {}),
    ...(entity.lineage?.sourceOrigin ? { sourceOrigin: entity.lineage.sourceOrigin } : {}),
    confidence: resolution?.confidence ?? 'unknown',
    reasonCodes: resolution?.reasonCodes ?? [],
    ...(resolution?.ambiguityKind ? { ambiguityKind: resolution.ambiguityKind } : {}),
  };
}

export function toResolvedSymbolModel(
  entity: Entity,
  resolution?: ResolvedTargetInfo | null,
): ResolvedSymbolModel {
  return toCanonicalSymbolModel(entity, resolution);
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