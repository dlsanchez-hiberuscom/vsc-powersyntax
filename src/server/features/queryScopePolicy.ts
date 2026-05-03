import type { SemanticReadinessLevel } from '../analysis/semanticSnapshot';
import type { QueryResolutionConfidence } from '../knowledge/resolution/semanticQueryService';
import type { SourceOrigin } from '../../shared/sourceOrigin';

export type QueryConsumerScope =
  | 'document'
  | 'active-object'
  | 'library'
  | 'project'
  | 'dependency-neighborhood'
  | 'workspace'
  | 'staging'
  | 'generated'
  | 'external';

export type QueryConsumerFallbackAction = 'allow' | 'degrade' | 'block';

export type QueryConsumerId =
  | 'hover'
  | 'definition'
  | 'signature-help'
  | 'completion'
  | 'references'
  | 'code-lens-references'
  | 'rename-prepare'
  | 'rename'
  | 'diagnostics-unresolved-callable'
  | 'current-object-context'
  | 'impact-analysis'
  | 'safe-edit-plan'
  | 'safe-batch-refactor-plan';

export interface QueryConsumerPolicy {
  consumer: QueryConsumerId;
  label: string;
  maxScope: QueryConsumerScope;
  budgetMs: number;
  resultCap: number;
  requiredReadiness: SemanticReadinessLevel;
  requiredResolutionConfidence: QueryResolutionConfidence;
  fallbackAction: QueryConsumerFallbackAction;
  latencyAction?: QueryConsumerFallbackAction;
  allowStaging: boolean;
  allowGenerated: boolean;
  allowExternal: boolean;
}

const QUERY_CONSUMER_POLICIES: Record<QueryConsumerId, QueryConsumerPolicy> = {
  hover: {
    consumer: 'hover',
    label: 'hover',
    maxScope: 'active-object',
    budgetMs: 50,
    resultCap: 8,
    requiredReadiness: 'nearby-semantic-ready',
    requiredResolutionConfidence: 'low',
    fallbackAction: 'degrade',
    latencyAction: 'degrade',
    allowStaging: false,
    allowGenerated: false,
    allowExternal: true,
  },
  definition: {
    consumer: 'definition',
    label: 'definition',
    maxScope: 'project',
    budgetMs: 50,
    resultCap: 8,
    requiredReadiness: 'nearby-semantic-ready',
    requiredResolutionConfidence: 'medium',
    fallbackAction: 'block',
    allowStaging: false,
    allowGenerated: false,
    allowExternal: true,
  },
  'signature-help': {
    consumer: 'signature-help',
    label: 'signatureHelp',
    maxScope: 'project',
    budgetMs: 50,
    resultCap: 8,
    requiredReadiness: 'nearby-semantic-ready',
    requiredResolutionConfidence: 'low',
    fallbackAction: 'block',
    latencyAction: 'block',
    allowStaging: false,
    allowGenerated: false,
    allowExternal: true,
  },
  completion: {
    consumer: 'completion',
    label: 'completion',
    maxScope: 'project',
    budgetMs: 50,
    resultCap: 200,
    requiredReadiness: 'nearby-semantic-ready',
    requiredResolutionConfidence: 'low',
    fallbackAction: 'degrade',
    latencyAction: 'degrade',
    allowStaging: false,
    allowGenerated: false,
    allowExternal: false,
  },
  references: {
    consumer: 'references',
    label: 'references',
    maxScope: 'project',
    budgetMs: 150,
    resultCap: 512,
    requiredReadiness: 'project-semantic-ready',
    requiredResolutionConfidence: 'high',
    fallbackAction: 'block',
    latencyAction: 'block',
    allowStaging: false,
    allowGenerated: false,
    allowExternal: false,
  },
  'code-lens-references': {
    consumer: 'code-lens-references',
    label: 'codeLensReferences',
    maxScope: 'project',
    budgetMs: 150,
    resultCap: 128,
    requiredReadiness: 'project-semantic-ready',
    requiredResolutionConfidence: 'high',
    fallbackAction: 'block',
    latencyAction: 'block',
    allowStaging: false,
    allowGenerated: false,
    allowExternal: false,
  },
  'rename-prepare': {
    consumer: 'rename-prepare',
    label: 'renamePrepare',
    maxScope: 'active-object',
    budgetMs: 25,
    resultCap: 1,
    requiredReadiness: 'nearby-semantic-ready',
    requiredResolutionConfidence: 'high',
    fallbackAction: 'block',
    allowStaging: false,
    allowGenerated: false,
    allowExternal: false,
  },
  rename: {
    consumer: 'rename',
    label: 'rename',
    maxScope: 'project',
    budgetMs: 200,
    resultCap: 512,
    requiredReadiness: 'nearby-semantic-ready',
    requiredResolutionConfidence: 'high',
    fallbackAction: 'block',
    allowStaging: false,
    allowGenerated: false,
    allowExternal: false,
  },
  'diagnostics-unresolved-callable': {
    consumer: 'diagnostics-unresolved-callable',
    label: 'diagnostics',
    maxScope: 'project',
    budgetMs: 100,
    resultCap: 32,
    requiredReadiness: 'nearby-semantic-ready',
    requiredResolutionConfidence: 'medium',
    fallbackAction: 'degrade',
    allowStaging: false,
    allowGenerated: false,
    allowExternal: true,
  },
  'current-object-context': {
    consumer: 'current-object-context',
    label: 'currentObjectContext',
    maxScope: 'dependency-neighborhood',
    budgetMs: 100,
    resultCap: 24,
    requiredReadiness: 'nearby-semantic-ready',
    requiredResolutionConfidence: 'low',
    fallbackAction: 'degrade',
    allowStaging: false,
    allowGenerated: false,
    allowExternal: true,
  },
  'impact-analysis': {
    consumer: 'impact-analysis',
    label: 'impactAnalysis',
    maxScope: 'project',
    budgetMs: 150,
    resultCap: 64,
    requiredReadiness: 'project-semantic-ready',
    requiredResolutionConfidence: 'medium',
    fallbackAction: 'degrade',
    allowStaging: false,
    allowGenerated: false,
    allowExternal: false,
  },
  'safe-edit-plan': {
    consumer: 'safe-edit-plan',
    label: 'safeEditPlan',
    maxScope: 'project',
    budgetMs: 150,
    resultCap: 64,
    requiredReadiness: 'project-semantic-ready',
    requiredResolutionConfidence: 'medium',
    fallbackAction: 'block',
    allowStaging: false,
    allowGenerated: false,
    allowExternal: false,
  },
  'safe-batch-refactor-plan': {
    consumer: 'safe-batch-refactor-plan',
    label: 'safeBatchRefactorPlan',
    maxScope: 'project',
    budgetMs: 250,
    resultCap: 128,
    requiredReadiness: 'project-semantic-ready',
    requiredResolutionConfidence: 'medium',
    fallbackAction: 'block',
    allowStaging: false,
    allowGenerated: false,
    allowExternal: false,
  },
};

const QUERY_CONSUMER_IDS = Object.freeze(Object.keys(QUERY_CONSUMER_POLICIES) as QueryConsumerId[]);

export function getQueryConsumerPolicy(consumer: QueryConsumerId): QueryConsumerPolicy {
  return QUERY_CONSUMER_POLICIES[consumer];
}

export function listQueryConsumerPolicies(): QueryConsumerPolicy[] {
  return QUERY_CONSUMER_IDS.map((consumer) => QUERY_CONSUMER_POLICIES[consumer]);
}

export function isSourceOriginAllowedForConsumer(
  consumer: QueryConsumerId,
  sourceOrigin: SourceOrigin | undefined
): boolean {
  if (!sourceOrigin) {
    return true;
  }

  const policy = getQueryConsumerPolicy(consumer);
  if (sourceOrigin === 'orca-staging') {
    return policy.allowStaging;
  }
  if (sourceOrigin === 'generated') {
    return policy.allowGenerated;
  }

  return true;
}