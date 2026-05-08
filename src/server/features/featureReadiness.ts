import type { SemanticReadinessLevel } from '../analysis/semanticSnapshot';
import type { QueryResolutionConfidence } from '../knowledge/resolution/semanticQueryService';
import type { ProgressReadinessSnapshot } from './progressReadiness';
import { getQueryConsumerPolicy, type QueryConsumerId } from './queryScopePolicy';

export type FeatureReadinessFeature = 'hover' | 'completion' | 'definition' | 'references' | 'rename' | 'signature-help';
export type FeatureReadinessAction = 'allow' | 'degrade' | 'block';

export interface FeatureReadinessDecision {
  feature: FeatureReadinessFeature;
  action: FeatureReadinessAction;
  currentLevel: SemanticReadinessLevel;
  requiredLevel: SemanticReadinessLevel;
  requiredResolutionConfidence: QueryResolutionConfidence;
  actualResolutionConfidence?: QueryResolutionConfidence;
  reason: string;
}

export interface FeatureReadinessContext {
  latencyOverloaded?: boolean;
  resolutionConfidence?: QueryResolutionConfidence;
}

const READINESS_ORDER: Record<SemanticReadinessLevel, number> = {
  'structural-only': 0,
  'nearby-semantic-ready': 1,
  'project-semantic-ready': 2,
  'workspace-semantic-ready': 3
};

const RESOLUTION_CONFIDENCE_ORDER: Record<QueryResolutionConfidence, number> = {
  unknown: -1,
  low: 0,
  medium: 1,
  high: 2
};

const FEATURE_CONSUMER_MAP: Record<FeatureReadinessFeature, QueryConsumerId> = {
  hover: 'hover',
  completion: 'completion',
  definition: 'definition',
  references: 'references',
  rename: 'rename',
  'signature-help': 'signature-help',
};

const FEATURE_POLICY: Record<FeatureReadinessFeature, {
  requiredLevel: SemanticReadinessLevel;
  fallbackAction: FeatureReadinessAction;
  latencyAction?: FeatureReadinessAction;
}> = {
  hover: toFeaturePolicy('hover'),
  completion: toFeaturePolicy('completion'),
  definition: toFeaturePolicy('definition'),
  references: toFeaturePolicy('references'),
  rename: toFeaturePolicy('rename'),
  'signature-help': toFeaturePolicy('signature-help'),
};

function toFeaturePolicy(feature: FeatureReadinessFeature): {
  requiredLevel: SemanticReadinessLevel;
  fallbackAction: FeatureReadinessAction;
  latencyAction?: FeatureReadinessAction;
} {
  const consumerPolicy = getQueryConsumerPolicy(FEATURE_CONSUMER_MAP[feature]);
  return {
    requiredLevel: consumerPolicy.requiredReadiness,
    fallbackAction: consumerPolicy.fallbackAction,
    ...(consumerPolicy.latencyAction ? { latencyAction: consumerPolicy.latencyAction } : {}),
  };
}

export function getSemanticReadinessLevel(snapshot: ProgressReadinessSnapshot): SemanticReadinessLevel {
  if (snapshot.readiness.levels.workspaceReady) {
    return 'workspace-semantic-ready';
  }
  if (snapshot.readiness.levels.projectReady) {
    return 'project-semantic-ready';
  }
  if (snapshot.readiness.levels.activeContextReady) {
    return 'nearby-semantic-ready';
  }
  return 'structural-only';
}

export function compareResolutionConfidence(
  left: QueryResolutionConfidence,
  right: QueryResolutionConfidence
): number {
  return RESOLUTION_CONFIDENCE_ORDER[left] - RESOLUTION_CONFIDENCE_ORDER[right];
}

export function getRequiredResolutionConfidence(
  feature: FeatureReadinessFeature
): QueryResolutionConfidence {
  return getQueryConsumerPolicy(FEATURE_CONSUMER_MAP[feature]).requiredResolutionConfidence;
}

export function isResolutionConfidenceSufficient(
  feature: FeatureReadinessFeature,
  confidence: QueryResolutionConfidence
): boolean {
  return compareResolutionConfidence(confidence, getRequiredResolutionConfidence(feature)) >= 0;
}

export function decideFeatureReadiness(
  feature: FeatureReadinessFeature,
  snapshot: ProgressReadinessSnapshot,
  context: FeatureReadinessContext = {}
): FeatureReadinessDecision {
  const currentLevel = getSemanticReadinessLevel(snapshot);
  const policy = FEATURE_POLICY[feature];
  const requiredResolutionConfidence = getRequiredResolutionConfidence(feature);
  const allowed = READINESS_ORDER[currentLevel] >= READINESS_ORDER[policy.requiredLevel];
  const confidenceInsufficient = context.resolutionConfidence
    ? !isResolutionConfidenceSufficient(feature, context.resolutionConfidence)
    : false;

  if (allowed && context.latencyOverloaded && policy.latencyAction && policy.latencyAction !== 'allow') {
    return {
      feature,
      action: policy.latencyAction,
      currentLevel,
      requiredLevel: policy.requiredLevel,
      requiredResolutionConfidence,
      actualResolutionConfidence: context.resolutionConfidence,
      reason: `${feature} ${policy.latencyAction === 'degrade' ? 'degradado' : 'bloqueado'} por presion de latencia`
    };
  }

  if (allowed && confidenceInsufficient) {
    return {
      feature,
      action: policy.fallbackAction,
      currentLevel,
      requiredLevel: policy.requiredLevel,
      requiredResolutionConfidence,
      actualResolutionConfidence: context.resolutionConfidence,
      reason: `${feature} ${policy.fallbackAction === 'degrade' ? 'degradado' : 'bloqueado'} por confidence insuficiente (${context.resolutionConfidence} < ${requiredResolutionConfidence})`
    };
  }

  return {
    feature,
    action: allowed ? 'allow' : policy.fallbackAction,
    currentLevel,
    requiredLevel: policy.requiredLevel,
    requiredResolutionConfidence,
    actualResolutionConfidence: context.resolutionConfidence,
    reason: allowed
      ? `${feature} disponible en ${currentLevel}`
      : `${feature} requiere ${policy.requiredLevel} y el runtime esta en ${currentLevel}`
  };
}