import type { ApiFrameworkKnowledgePackSummary } from '../../../shared/publicApi';

import { SystemCatalog } from './SystemCatalog';
import type { PbSystemSymbolEntry } from './types';

interface PowerBuilderFrameworkKnowledgePackDefinition {
  id: string;
  version: string;
  title: string;
  summary: string;
  ownerTypes: readonly string[];
  source: string;
  sourceUrl?: string;
  spotlightSymbols?: readonly string[];
}

const CURATED_FRAMEWORK_KNOWLEDGE_PACKS: readonly PowerBuilderFrameworkKnowledgePackDefinition[] = [
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
];

function dedupeEntries(entries: readonly PbSystemSymbolEntry[]): PbSystemSymbolEntry[] {
  const result: PbSystemSymbolEntry[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (seen.has(entry.id)) {
      continue;
    }
    seen.add(entry.id);
    result.push(entry);
  }

  return result;
}

function buildSymbolSamples(
  entries: readonly PbSystemSymbolEntry[],
  spotlightSymbols: readonly string[] | undefined,
): string[] {
  const byNormalizedName = new Map(entries.map((entry) => [entry.normalizedName, entry]));
  const samples: string[] = [];
  const seen = new Set<string>();

  for (const symbolName of spotlightSymbols ?? []) {
    const entry = byNormalizedName.get(symbolName.trim().toLowerCase());
    if (!entry || seen.has(entry.name)) {
      continue;
    }
    seen.add(entry.name);
    samples.push(entry.name);
  }

  for (const entry of [...entries].sort((left, right) => left.name.localeCompare(right.name))) {
    if (samples.length >= 6) {
      break;
    }
    if (seen.has(entry.name)) {
      continue;
    }
    seen.add(entry.name);
    samples.push(entry.name);
  }

  return samples;
}

function resolvePackEntries(
  systemCatalog: SystemCatalog,
  ownerTypes: readonly string[],
): { all: PbSystemSymbolEntry[]; members: PbSystemSymbolEntry[]; events: PbSystemSymbolEntry[] } {
  const members = dedupeEntries(systemCatalog.listMembersForOwner(ownerTypes));
  const events = dedupeEntries(systemCatalog.listEventsForOwner(ownerTypes));
  const all = dedupeEntries([...members, ...events]);

  return { all, members, events };
}

function resolvePackSummary(
  systemCatalog: SystemCatalog,
  definition: PowerBuilderFrameworkKnowledgePackDefinition,
): ApiFrameworkKnowledgePackSummary {
  const entries = resolvePackEntries(systemCatalog, definition.ownerTypes);

  return {
    id: definition.id,
    version: definition.version,
    title: definition.title,
    summary: definition.summary,
    ownerTypes: [...definition.ownerTypes],
    symbolCount: entries.all.length,
    memberCount: entries.members.length,
    eventCount: entries.events.length,
    symbolSamples: buildSymbolSamples(entries.all, definition.spotlightSymbols),
    source: definition.source,
    ...(definition.sourceUrl ? { sourceUrl: definition.sourceUrl } : {}),
  };
}

export function listPowerBuilderFrameworkKnowledgePacks(systemCatalog: SystemCatalog): ApiFrameworkKnowledgePackSummary[] {
  return CURATED_FRAMEWORK_KNOWLEDGE_PACKS.map((definition) => resolvePackSummary(systemCatalog, definition));
}

export function findPowerBuilderFrameworkKnowledgePacksForOwnerTypes(
  systemCatalog: SystemCatalog,
  ownerTypes: readonly string[],
): ApiFrameworkKnowledgePackSummary[] {
  const normalizedOwnerTypes = ownerTypes.map((ownerType) => ownerType.trim().toLowerCase()).filter((ownerType) => ownerType.length > 0);

  return listPowerBuilderFrameworkKnowledgePacks(systemCatalog)
    .filter((pack) => pack.ownerTypes.some((ownerType: string) => normalizedOwnerTypes.includes(ownerType.toLowerCase())));
}