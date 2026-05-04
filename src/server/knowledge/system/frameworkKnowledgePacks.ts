import type { ApiFrameworkKnowledgePackSummary } from '../../../shared/publicApi';

import { SystemCatalog } from './SystemCatalog';
import {
  CURATED_FRAMEWORK_KNOWLEDGE_PACKS,
  type CuratedFrameworkKnowledgePackDefinition,
} from './frameworkKnowledgePackPolicy';
import type { PbSystemSymbolEntry } from './types';

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
  definition: CuratedFrameworkKnowledgePackDefinition,
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