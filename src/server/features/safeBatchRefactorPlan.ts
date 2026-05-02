import { TextDocument } from 'vscode-languageserver-textdocument';

import type {
  ApiImpactAnalysis,
  ApiSafeBatchRefactorPlan,
  ApiSafeBatchRefactorPlanItemResult,
  ApiSafeBatchRefactorPlanRequest,
} from '../../shared/publicApi';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { HotContextCache } from '../knowledge/HotContextCache';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import type { WorkspaceState } from '../workspace/workspaceState';
import { buildImpactAnalysis } from './impactAnalysis';
import { validateRenameTarget } from './renamePreflight';
import { buildSafeEditPlanFromImpact } from './safeEditPlan';

interface SafeBatchRefactorPlanOptions {
  workspaceState?: WorkspaceState;
  hotContext?: HotContextCache;
  extraReserved?: ReadonlySet<string>;
}

type SourceLoader = Parameters<typeof buildImpactAnalysis>[5];
type DocumentLoader = (uri: string) => Promise<TextDocument | null>;

function createEmptyResult(reason: string): ApiSafeBatchRefactorPlan {
  return {
    available: false,
    blocked: true,
    stoppedEarly: false,
    reason,
    total: 0,
    planned: 0,
    blockedCount: 0,
    skippedCount: 0,
    items: [],
    aggregatedRisks: [],
    recommendedTests: [],
    docsToReview: [],
  };
}

function createSkippedItem(
  item: ApiSafeBatchRefactorPlanRequest['items'][number],
  reason: string,
): ApiSafeBatchRefactorPlanItemResult {
  return {
    ...(item.label ? { label: item.label } : {}),
    ...(item.uri ? { uri: item.uri } : {}),
    ...(item.newName ? { newName: item.newName } : {}),
    status: 'skipped',
    blockedReasons: [reason],
  };
}

function createBlockedItem(
  item: ApiSafeBatchRefactorPlanRequest['items'][number],
  reason: string,
): ApiSafeBatchRefactorPlanItemResult {
  return {
    ...(item.label ? { label: item.label } : {}),
    ...(item.uri ? { uri: item.uri } : {}),
    ...(item.newName ? { newName: item.newName } : {}),
    status: 'blocked',
    blockedReasons: [reason],
  };
}

function appendUnique(target: Set<string>, items: readonly string[]): void {
  for (const item of items) {
    target.add(item);
  }
}

export async function buildSafeBatchRefactorPlan(
  request: ApiSafeBatchRefactorPlanRequest | undefined,
  loadDocument: DocumentLoader,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  systemCatalog: SystemCatalog,
  loadSource: SourceLoader,
  options: SafeBatchRefactorPlanOptions = {},
): Promise<ApiSafeBatchRefactorPlan> {
  const items = request?.items ?? [];
  if (items.length === 0) {
    return createEmptyResult('No se recibieron items para planificar el batch read-only.');
  }

  const results: ApiSafeBatchRefactorPlanItemResult[] = [];
  const aggregatedRisks = new Set<string>();
  const recommendedTests = new Set<string>();
  const docsToReview = new Set<string>();
  let stoppedEarly = false;

  for (const item of items) {
    if (stoppedEarly) {
      results.push(createSkippedItem(item, 'stopOnBlocked detuvo el batch tras un item bloqueado anterior.'));
      continue;
    }

    if (!item.uri) {
      results.push(createBlockedItem(item, 'Cada item del batch requiere una URI válida.'));
      if (request?.stopOnBlocked) {
        stoppedEarly = true;
      }
      continue;
    }

    const document = await loadDocument(item.uri);
    if (!document) {
      results.push(createBlockedItem(item, 'No se pudo cargar el documento solicitado para planificar el batch.'));
      if (request?.stopOnBlocked) {
        stoppedEarly = true;
      }
      continue;
    }

    const renamePreflight = typeof item.newName === 'string'
      ? validateRenameTarget(item.newName, { systemCatalog, extraReserved: options.extraReserved })
      : undefined;
    const impactAnalysis = await buildImpactAnalysis(
      document,
      item,
      kb,
      graph,
      systemCatalog,
      loadSource,
      {
        workspaceState: options.workspaceState,
        hotContext: options.hotContext,
      },
    );
    const safeEditPlan = buildSafeEditPlanFromImpact(impactAnalysis);
    const blockedReasons = [
      ...(renamePreflight && !renamePreflight.ok && renamePreflight.reason ? [renamePreflight.reason] : []),
      ...safeEditPlan.blockedReasons,
    ];
    const status: ApiSafeBatchRefactorPlanItemResult['status'] = blockedReasons.length > 0 ? 'blocked' : 'planned';

    appendUnique(aggregatedRisks, safeEditPlan.risks);
    appendUnique(recommendedTests, safeEditPlan.recommendedTests);
    appendUnique(docsToReview, safeEditPlan.docsToReview);

    results.push({
      ...(item.label ? { label: item.label } : {}),
      uri: item.uri,
      ...(item.newName ? { newName: item.newName } : {}),
      status,
      ...(renamePreflight ? { renamePreflight } : {}),
      impactAnalysis,
      safeEditPlan,
      blockedReasons,
    });

    if (status === 'blocked' && request?.stopOnBlocked) {
      stoppedEarly = true;
    }
  }

  const planned = results.filter((item) => item.status === 'planned').length;
  const blockedCount = results.filter((item) => item.status === 'blocked').length;
  const skippedCount = results.filter((item) => item.status === 'skipped').length;

  return {
    available: results.some((item) => item.status !== 'skipped'),
    blocked: blockedCount > 0,
    stoppedEarly,
    ...(planned === 0 && blockedCount > 0 ? { reason: 'El batch quedó bloqueado por al menos un item no planificable.' } : {}),
    total: results.length,
    planned,
    blockedCount,
    skippedCount,
    items: results,
    aggregatedRisks: [...aggregatedRisks],
    recommendedTests: [...recommendedTests],
    docsToReview: [...docsToReview],
  };
}