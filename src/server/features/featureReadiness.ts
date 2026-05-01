import type { SemanticReadinessLevel } from '../analysis/semanticSnapshot';
import type { ProgressReadinessSnapshot } from './progressReadiness';

export type FeatureReadinessFeature = 'hover' | 'completion' | 'definition' | 'references' | 'rename';
export type FeatureReadinessAction = 'allow' | 'degrade' | 'block';

export interface FeatureReadinessDecision {
  feature: FeatureReadinessFeature;
  action: FeatureReadinessAction;
  currentLevel: SemanticReadinessLevel;
  requiredLevel: SemanticReadinessLevel;
  reason: string;
}

export interface FeatureReadinessContext {
  latencyOverloaded?: boolean;
}

const READINESS_ORDER: Record<SemanticReadinessLevel, number> = {
  'structural-only': 0,
  'nearby-semantic-ready': 1,
  'project-semantic-ready': 2,
  'workspace-semantic-ready': 3
};

const FEATURE_POLICY: Record<FeatureReadinessFeature, {
  requiredLevel: SemanticReadinessLevel;
  fallbackAction: FeatureReadinessAction;
  latencyAction?: FeatureReadinessAction;
}> = {
  hover: {
    requiredLevel: 'nearby-semantic-ready',
    fallbackAction: 'degrade',
    latencyAction: 'degrade'
  },
  completion: {
    requiredLevel: 'nearby-semantic-ready',
    fallbackAction: 'degrade',
    latencyAction: 'degrade'
  },
  definition: {
    requiredLevel: 'nearby-semantic-ready',
    fallbackAction: 'block'
  },
  references: {
    requiredLevel: 'project-semantic-ready',
    fallbackAction: 'block',
    latencyAction: 'block'
  },
  rename: {
    requiredLevel: 'nearby-semantic-ready',
    fallbackAction: 'block'
  }
};

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

export function decideFeatureReadiness(
  feature: FeatureReadinessFeature,
  snapshot: ProgressReadinessSnapshot,
  context: FeatureReadinessContext = {}
): FeatureReadinessDecision {
  const currentLevel = getSemanticReadinessLevel(snapshot);
  const policy = FEATURE_POLICY[feature];
  const allowed = READINESS_ORDER[currentLevel] >= READINESS_ORDER[policy.requiredLevel];

  if (allowed && context.latencyOverloaded && policy.latencyAction && policy.latencyAction !== 'allow') {
    return {
      feature,
      action: policy.latencyAction,
      currentLevel,
      requiredLevel: policy.requiredLevel,
      reason: `${feature} ${policy.latencyAction === 'degrade' ? 'degradado' : 'bloqueado'} por presion de latencia`
    };
  }

  return {
    feature,
    action: allowed ? 'allow' : policy.fallbackAction,
    currentLevel,
    requiredLevel: policy.requiredLevel,
    reason: allowed
      ? `${feature} disponible en ${currentLevel}`
      : `${feature} requiere ${policy.requiredLevel} y el runtime esta en ${currentLevel}`
  };
}