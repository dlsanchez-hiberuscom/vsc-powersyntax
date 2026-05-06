import type {
  ApiFrameworkKnowledgeConflict,
  ApiFrameworkKnowledgePackReference,
} from '../../../shared/publicApi';
import type { SourceOrigin } from '../../../shared/sourceOrigin';

export type FrameworkKnowledgePolicyConfidence = NonNullable<ApiFrameworkKnowledgeConflict['confidence']>;

export interface CuratedFrameworkKnowledgePackDefinition {
  id: string;
  version: string;
  title: string;
  summary: string;
  ownerTypes: readonly string[];
  source: string;
  sourceUrl?: string;
  spotlightSymbols?: readonly string[];
  advisoryMembers?: readonly string[];
  advisoryEvents?: readonly string[];
}

export const CURATED_FRAMEWORK_KNOWLEDGE_PACKS: readonly CuratedFrameworkKnowledgePackDefinition[] = [
  {
    id: 'appeon-webbrowser-webview2',
    version: '1.0.0',
    title: 'WebBrowser / WebView2',
    summary: 'Pack curado para navegación, mensajería web y ciclo de eventos del control WebBrowser moderno.',
    ownerTypes: ['webbrowser'],
    source: 'VSC PowerSyntax curated framework pack',
    sourceUrl: 'https://docs.appeon.com/pb2025/powerscript_reference/index.html',
    spotlightSymbols: ['EvaluateJavascriptFinished', 'NavigationCompleted', 'NavigationStart', 'PostWebMessageAsJson'],
  },
  {
    id: 'appeon-mobilink-sync',
    version: '1.0.0',
    title: 'MobiLink Sync',
    summary: 'Pack curado para sincronización MLSync/MLSynchronization, incluyendo eventos de lifecycle y progreso.',
    ownerTypes: ['mlsync', 'mlsynchronization'],
    source: 'VSC PowerSyntax curated framework pack',
    sourceUrl: 'https://docs.appeon.com/pb2025/powerscript_reference/index.html',
    spotlightSymbols: ['BeginSync', 'EndSync', 'BeginDownload', 'EndDownload'],
  },
  {
    id: 'appeon-ribbonbar-ui',
    version: '1.0.0',
    title: 'RibbonBar UI',
    summary: 'Pack curado para la superficie RibbonBar y sus eventos de selección, categorías y controles relacionados.',
    ownerTypes: ['ribbonbar', 'ribboncomboboxitem'],
    source: 'VSC PowerSyntax curated framework pack',
    sourceUrl: 'https://docs.appeon.com/pb2025/powerscript_reference/index.html',
    spotlightSymbols: ['CategoryExpanded', 'CategoryCollapsed', 'CategorySelectionChanged', 'MenuChanged'],
  },
  {
    id: 'pfc-response-dwsrv',
    version: '1.0.0',
    title: 'PFC Response / DW services',
    summary: 'Pack advisory para ancestros PFC w_response y n_cst_dwsrv detectados en corpus local, con hooks de respuesta y servicios DataWindow frecuentes.',
    ownerTypes: ['w_response', 'pfc_w_response', 'n_cst_dwsrv', 'pfc_n_cst_dwsrv', 'n_cst_dwsrv_property', 'pfc_n_cst_dwsrv_property'],
    source: 'VSC PowerSyntax curated framework pack (fixtures-local/pfc advisory evidence)',
    spotlightSymbols: ['pfc_FilterDlg', 'of_SetFilter', 'of_Filter', 'pfc_PostOpen'],
    advisoryMembers: ['of_Filter', 'of_GetFilter', 'of_SetFilter', 'of_SetVisibleOnly'],
    advisoryEvents: ['pfc_FilterDlg', 'pfc_PostOpen'],
  },
  {
    id: 'std-controller-shells',
    version: '1.0.0',
    title: 'STD Controller shells',
    summary: 'Pack advisory para shells STD wn_controller_master, mu_controller_master y dialogs oe_* detectados en OrderEntry.',
    ownerTypes: ['wn_controller_master', 'mu_controller_master', 'wn_messagebox_master'],
    source: 'VSC PowerSyntax curated framework pack (fixtures-local/STD_FC_OrderEntry advisory evidence)',
    spotlightSymbols: ['oe_PostOpen', 'oe_Documentation', 'mi_Retrieve', 'mi_Toolbar'],
    advisoryMembers: ['mi_Retrieve', 'mi_Print', 'mi_Toolbar'],
    advisoryEvents: ['oe_PostOpen', 'oe_Documentation', 'oe_PostConstructor', 'oe_Resize'],
  },
];

const AUTHORITATIVE_WORKSPACE_SOURCE_ORIGINS = new Set<SourceOrigin>([
  'solution-source',
  'workspace-ws_objects',
  'pbl-folder-source',
  'manual-export-source',
]);

function normalizeOwnerTypes(ownerTypes: readonly (string | null | undefined)[]): string[] {
  const normalized = new Set<string>();

  for (const ownerType of ownerTypes) {
    if (typeof ownerType !== 'string') {
      continue;
    }
    const candidate = ownerType.trim().toLowerCase();
    if (candidate.length === 0) {
      continue;
    }
    normalized.add(candidate);
  }

  return [...normalized];
}

function toPackReference(definition: CuratedFrameworkKnowledgePackDefinition): ApiFrameworkKnowledgePackReference {
  return {
    id: definition.id,
    version: definition.version,
    title: definition.title,
    ownerTypes: [...definition.ownerTypes],
    source: definition.source,
    ...(definition.sourceUrl ? { sourceUrl: definition.sourceUrl } : {}),
  };
}

function formatPackList(packs: readonly ApiFrameworkKnowledgePackReference[]): string {
  return packs.map((pack) => pack.title).join(', ');
}

export function listCuratedFrameworkKnowledgePackReferences(): ApiFrameworkKnowledgePackReference[] {
  return CURATED_FRAMEWORK_KNOWLEDGE_PACKS.map((definition) => toPackReference(definition));
}

export function findCuratedFrameworkKnowledgePackReferencesForOwnerTypes(
  ownerTypes: readonly (string | null | undefined)[],
): ApiFrameworkKnowledgePackReference[] {
  const normalizedOwnerTypes = normalizeOwnerTypes(ownerTypes);

  return listCuratedFrameworkKnowledgePackReferences()
    .filter((pack) => pack.ownerTypes.some((ownerType) => normalizedOwnerTypes.includes(ownerType.toLowerCase())));
}

export function buildFrameworkKnowledgeConflictPolicy(input: {
  ownerTypes: readonly (string | null | undefined)[];
  sourceOrigin?: SourceOrigin;
  confidence?: FrameworkKnowledgePolicyConfidence;
}): ApiFrameworkKnowledgeConflict | undefined {
  const matchedOwnerTypes = normalizeOwnerTypes(input.ownerTypes);
  const packs = findCuratedFrameworkKnowledgePackReferencesForOwnerTypes(matchedOwnerTypes);

  if (packs.length === 0) {
    return undefined;
  }

  const authoritativeWorkspaceSource = Boolean(input.sourceOrigin && AUTHORITATIVE_WORKSPACE_SOURCE_ORIGINS.has(input.sourceOrigin));
  if (authoritativeWorkspaceSource) {
    return {
      state: 'workspace-wins',
      reasonCode: 'workspace-source-overrides-framework-pack',
      summary: `El símbolo del workspace (${input.sourceOrigin}) prevalece; los knowledge packs ${formatPackList(packs)} quedan degradados a contexto advisory.`,
      matchedOwnerTypes,
      packs,
      ...(input.sourceOrigin ? { sourceOrigin: input.sourceOrigin } : {}),
      ...(input.confidence ? { confidence: input.confidence } : {}),
    };
  }

  return {
    state: 'pack-advisory',
    reasonCode: 'framework-pack-advisory',
    summary: `Hay knowledge packs aplicables (${formatPackList(packs)}), pero sin una source origin autoritativa del workspace solo se exponen como contexto advisory.`,
    matchedOwnerTypes,
    packs,
    ...(input.sourceOrigin ? { sourceOrigin: input.sourceOrigin } : {}),
    ...(input.confidence ? { confidence: input.confidence } : {}),
  };
}