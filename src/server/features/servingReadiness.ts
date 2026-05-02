import type { QueryResolutionConfidence } from '../knowledge/resolution/semanticQueryService';
import {
  decideFeatureReadiness,
  type FeatureReadinessDecision,
  type FeatureReadinessFeature
} from './featureReadiness';
import type { ProgressReadinessSnapshot } from './progressReadiness';

export interface ServingReadinessContext {
  latencyOverloaded?: boolean;
  resolutionConfidence?: QueryResolutionConfidence;
}

export interface ServingReadinessInput<T> {
  feature: FeatureReadinessFeature;
  consumerLabel: string;
  snapshot: ProgressReadinessSnapshot;
  blockedResult: T;
  context?: ServingReadinessContext;
}

export type ServingReadinessResult<T> =
  | {
      decision: FeatureReadinessDecision;
      blocked: false;
    }
  | {
      decision: FeatureReadinessDecision;
      blocked: true;
      blockedResult: T;
      warningMessage: string;
    };

export function resolveServingReadiness<T>(input: ServingReadinessInput<T>): ServingReadinessResult<T> {
  const decision = decideFeatureReadiness(input.feature, input.snapshot, input.context);

  if (decision.action !== 'block') {
    return {
      decision,
      blocked: false
    };
  }

  return {
    decision,
    blocked: true,
    blockedResult: input.blockedResult,
    warningMessage: `[${input.consumerLabel}] bloqueado: ${decision.reason}`
  };
}