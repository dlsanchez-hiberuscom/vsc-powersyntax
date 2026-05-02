import {
  type ApiImpactAnalysis,
  type ApiSafeEditPlan,
  type ApiSafeEditPlanFile,
  type ApiSafeEditPlanRequest,
} from '../../shared/publicApi';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { HotContextCache } from '../knowledge/HotContextCache';
import type { WorkspaceState } from '../workspace/workspaceState';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { buildImpactAnalysis } from './impactAnalysis';

interface SafeEditPlanOptions {
  workspaceState?: WorkspaceState;
  hotContext?: HotContextCache;
}

type SourceLoader = Parameters<typeof buildImpactAnalysis>[5];

function classifyFileRisk(role: ApiImpactAnalysis['probableImpactFiles'][number]['role']): ApiSafeEditPlanFile['risk'] {
  switch (role) {
    case 'override':
    case 'datawindow':
    case 'descendant':
      return 'high';
    case 'active-document':
    case 'ancestor':
    case 'reference-target':
      return 'medium';
    case 'project':
    case 'library':
    default:
      return 'low';
  }
}

function describeFileReason(role: ApiImpactAnalysis['probableImpactFiles'][number]['role']): string {
  switch (role) {
    case 'active-document':
      return 'Contiene el símbolo u objeto foco del cambio.';
    case 'ancestor':
      return 'Declara la jerarquía base del símbolo impactado.';
    case 'datawindow':
      return 'Está enlazado por DataObject y puede verse afectado por cambios semánticos o de aridad.';
    case 'descendant':
      return 'Hereda del tipo impactado y puede recibir propagación del cambio.';
    case 'library':
      return 'Pertenece a la librería activa asociada al área impactada.';
    case 'override':
      return 'Sobrescribe el miembro impactado y requiere revisión coordinada.';
    case 'project':
      return 'Es un build target asociado al conjunto de archivos impactados.';
    case 'reference-target':
      return 'Define o consume una referencia segura del símbolo afectado.';
    default:
      return 'Forma parte del conjunto de impacto detectado.';
  }
}

function collectRisks(impact: ApiImpactAnalysis): string[] {
  const risks: string[] = [];
  if (impact.descendants.length > 0) {
    risks.push('Hay descendientes del tipo impactado; un cambio puede propagarse por herencia.');
  }
  if (impact.overrides.length > 0) {
    risks.push('Existen overrides del miembro impactado; la semántica puede divergir entre descendants.');
  }
  if (impact.relatedDataWindows.length > 0) {
    risks.push('Hay DataWindows vinculadas por DataObject/Retrieve que requieren revisión coordinada.');
  }
  if (impact.safeReferences.length > 8) {
    risks.push('El símbolo tiene varias referencias seguras; conviene validar alcance antes de editar.');
  }
  if (impact.buildTargets.length > 0) {
    risks.push('Hay build targets conocidos asociados al impacto detectado.');
  }
  return risks;
}

function collectRecommendedTests(impact: ApiImpactAnalysis): string[] {
  const tests = new Set<string>();
  tests.add('npm run test:unit -- --grep "unit/(impactAnalysis|safeEditPlan|currentObjectContext)"');

  if (impact.safeReferences.length > 0) {
    tests.add('npm run test:unit -- --grep "unit/references"');
  }
  if (impact.descendants.length > 0 || impact.overrides.length > 0) {
    tests.add('npm run test:unit -- --grep "unit/(hierarchyInspection|powerbuilderSemanticGolden)"');
  }
  if (impact.relatedDataWindows.length > 0) {
    tests.add('npm run test:unit -- --grep "unit/(diagnostics|signatureHelp|currentObjectContext|impactAnalysis|powerbuilderSemanticGolden)"');
  }

  return [...tests];
}

function collectDocsToReview(impact: ApiImpactAnalysis): string[] {
  const docs = new Set<string>();
  docs.add('docs/testing.md');
  docs.add('docs/architecture.md');

  if (impact.relatedDataWindows.length > 0) {
    docs.add('docs/powerbuilder-2025-vscode-plugin-technical-guide.md');
    docs.add('docs/rules-catalog.md');
  }

  return [...docs];
}

function collectBlockedReasons(impact: ApiImpactAnalysis): string[] {
  const blockedReasons: string[] = [];
  if (!impact.available) {
    blockedReasons.push(impact.reason ?? 'No hay impacto resoluble para planificar una edición segura.');
    return blockedReasons;
  }

  if (impact.confidence === 'low') {
    blockedReasons.push('La confidence del impacto es baja; conviene revisar el símbolo raíz antes de editar.');
  }
  if ((impact.evidenceKinds ?? []).includes('distance-ambiguity')) {
    blockedReasons.push('La resolución base es ambigua por distancia; no hay plan seguro todavía.');
  }
  if (!impact.rootSymbol) {
    blockedReasons.push('No se pudo determinar un símbolo raíz defendible para el plan.');
  }

  return blockedReasons;
}

export async function buildSafeEditPlan(
  document: TextDocument,
  request: ApiSafeEditPlanRequest | undefined,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  systemCatalog: SystemCatalog,
  loadSource: SourceLoader,
  options: SafeEditPlanOptions = {}
): Promise<ApiSafeEditPlan> {
  const impact = await buildImpactAnalysis(document, request, kb, graph, systemCatalog, loadSource, options);
  return buildSafeEditPlanFromImpact(impact);
}

export function buildSafeEditPlanFromImpact(impact: ApiImpactAnalysis): ApiSafeEditPlan {
  const blockedReasons = collectBlockedReasons(impact);
  const files = impact.probableImpactFiles.map((file) => ({
    uri: file.uri,
    reason: describeFileReason(file.role),
    risk: classifyFileRisk(file.role),
  } satisfies ApiSafeEditPlanFile));

  return {
    available: impact.available,
    blocked: blockedReasons.length > 0,
    ...(impact.reason ? { reason: impact.reason } : {}),
    ...(impact.confidence ? { confidence: impact.confidence } : {}),
    ...(impact.rootSymbol ? { targetSymbol: impact.rootSymbol } : {}),
    objects: [...impact.affectedSymbols],
    files,
    risks: collectRisks(impact),
    recommendedTests: collectRecommendedTests(impact),
    docsToReview: collectDocsToReview(impact),
    blockedReasons,
  };
}