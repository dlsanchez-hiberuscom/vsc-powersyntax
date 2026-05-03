import type { QueryResolutionConfidence } from '../knowledge/resolution/semanticQueryService';
import {
  decideFeatureReadiness,
  type FeatureReadinessAction,
  type FeatureReadinessFeature,
} from './featureReadiness';
import type { ProgressReadinessSnapshot } from './progressReadiness';

const ACTION_STRICTNESS: Record<FeatureReadinessAction, number> = {
  allow: 0,
  degrade: 1,
  block: 2,
};

const CALIBRATED_FEATURES: readonly FeatureReadinessFeature[] = [
  'hover',
  'completion',
  'definition',
  'references',
  'rename',
  'signature-help',
];

export interface ConfidenceCalibrationExpectation {
  feature: FeatureReadinessFeature;
  expectedAction: FeatureReadinessAction;
}

export interface ConfidenceCalibrationScenario {
  corpus: string;
  label: string;
  readinessSnapshot: ProgressReadinessSnapshot;
  resolutionConfidence: QueryResolutionConfidence;
  expectations: readonly ConfidenceCalibrationExpectation[];
  uri?: string;
  line?: number;
  reasonCode?: string;
}

export interface ConfidenceCalibrationFeatureSummary {
  feature: FeatureReadinessFeature;
  total: number;
  matches: number;
  falsePositives: number;
  falseNegatives: number;
}

export interface ConfidenceCalibrationFinding {
  corpus: string;
  label: string;
  feature: FeatureReadinessFeature;
  expectedAction: FeatureReadinessAction;
  actualAction: FeatureReadinessAction;
  classification: 'false-positive' | 'false-negative';
  resolutionConfidence: QueryResolutionConfidence;
  reason: string;
  uri?: string;
  line?: number;
  reasonCode?: string;
}

export interface ConfidenceCalibrationReport {
  totalExpectations: number;
  matches: number;
  falsePositives: number;
  falseNegatives: number;
  byFeature: Record<FeatureReadinessFeature, ConfidenceCalibrationFeatureSummary>;
  findings: readonly ConfidenceCalibrationFinding[];
}

function classifyCalibration(
  expectedAction: FeatureReadinessAction,
  actualAction: FeatureReadinessAction,
): 'match' | 'false-positive' | 'false-negative' {
  if (expectedAction === actualAction) {
    return 'match';
  }

  return ACTION_STRICTNESS[actualAction] < ACTION_STRICTNESS[expectedAction]
    ? 'false-positive'
    : 'false-negative';
}

function createEmptyFeatureSummary(
  feature: FeatureReadinessFeature,
): ConfidenceCalibrationFeatureSummary {
  return {
    feature,
    total: 0,
    matches: 0,
    falsePositives: 0,
    falseNegatives: 0,
  };
}

export function buildConfidenceCalibrationReport(
  scenarios: readonly ConfidenceCalibrationScenario[],
): ConfidenceCalibrationReport {
  const byFeature = Object.fromEntries(
    CALIBRATED_FEATURES.map((feature) => [feature, createEmptyFeatureSummary(feature)]),
  ) as Record<FeatureReadinessFeature, ConfidenceCalibrationFeatureSummary>;
  const findings: ConfidenceCalibrationFinding[] = [];
  let matches = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  for (const scenario of scenarios) {
    for (const expectation of scenario.expectations) {
      const decision = decideFeatureReadiness(expectation.feature, scenario.readinessSnapshot, {
        resolutionConfidence: scenario.resolutionConfidence,
      });
      const featureSummary = byFeature[expectation.feature];
      featureSummary.total += 1;

      const classification = classifyCalibration(expectation.expectedAction, decision.action);
      if (classification === 'match') {
        matches += 1;
        featureSummary.matches += 1;
        continue;
      }

      if (classification === 'false-positive') {
        falsePositives += 1;
        featureSummary.falsePositives += 1;
      } else {
        falseNegatives += 1;
        featureSummary.falseNegatives += 1;
      }

      findings.push({
        corpus: scenario.corpus,
        label: scenario.label,
        feature: expectation.feature,
        expectedAction: expectation.expectedAction,
        actualAction: decision.action,
        classification,
        resolutionConfidence: scenario.resolutionConfidence,
        reason: decision.reason,
        ...(scenario.uri ? { uri: scenario.uri } : {}),
        ...(scenario.line !== undefined ? { line: scenario.line } : {}),
        ...(scenario.reasonCode ? { reasonCode: scenario.reasonCode } : {}),
      });
    }
  }

  return {
    totalExpectations: matches + falsePositives + falseNegatives,
    matches,
    falsePositives,
    falseNegatives,
    byFeature,
    findings,
  };
}