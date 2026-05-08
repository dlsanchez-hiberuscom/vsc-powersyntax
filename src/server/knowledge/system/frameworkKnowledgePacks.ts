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

function dedupeStrings(values: readonly string[] | undefined): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values ?? []) {
    const candidate = value.trim();
    if (candidate.length === 0) {
      continue;
    }

    const normalized = candidate.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(candidate);
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

function buildAdvisorySymbolSamples(
  members: readonly string[],
  events: readonly string[],
  spotlightSymbols: readonly string[] | undefined,
): string[] {
  const entries = dedupeStrings([...events, ...members]);
  const byNormalizedName = new Map(entries.map((entry) => [entry.toLowerCase(), entry]));
  const samples: string[] = [];
  const seen = new Set<string>();

  for (const symbolName of spotlightSymbols ?? []) {
    const entry = byNormalizedName.get(symbolName.trim().toLowerCase());
    if (!entry || seen.has(entry)) {
      continue;
    }

    seen.add(entry);
    samples.push(entry);
  }

  for (const entry of [...entries].sort((left, right) => left.localeCompare(right))) {
    if (samples.length >= 6) {
      break;
    }
    if (seen.has(entry)) {
      continue;
    }

    seen.add(entry);
    samples.push(entry);
  }

  return samples;
}

function resolvePackStructuralSymbols(
  systemCatalog: SystemCatalog,
  ownerTypes: readonly string[],
): { members: string[]; events: string[]; all: string[] } {
  const normalizedOwnerTypes = dedupeStrings(ownerTypes).map((ownerType) => ownerType.toLowerCase());
  const members: string[] = [];
  const events: string[] = [];

  for (const ownerType of normalizedOwnerTypes) {
    const typeEntries = systemCatalog.findSystemSymbol(ownerType).filter((entry) =>
      entry.kind === 'system-type'
      && entry.normalizedName === ownerType,
    );

    for (const entry of typeEntries) {
      members.push(...(entry.functions ?? []));
      events.push(...(entry.events ?? []));
    }
  }

  const dedupedMembers = dedupeStrings(members);
  const dedupedEvents = dedupeStrings(events);
  return {
    members: dedupedMembers,
    events: dedupedEvents,
    all: dedupeStrings([...dedupedEvents, ...dedupedMembers]),
  };
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
  const structuralSymbols = resolvePackStructuralSymbols(systemCatalog, definition.ownerTypes);
  const advisoryMembers = dedupeStrings(definition.advisoryMembers);
  const advisoryEvents = dedupeStrings(definition.advisoryEvents);
  const fallbackMembers = dedupeStrings([...structuralSymbols.members, ...advisoryMembers]);
  const fallbackEvents = dedupeStrings([...structuralSymbols.events, ...advisoryEvents]);
  const fallbackSymbols = dedupeStrings([...fallbackEvents, ...fallbackMembers]);
  const hasCatalogEntries = entries.all.length > 0;

  return {
    id: definition.id,
    version: definition.version,
    title: definition.title,
    summary: definition.summary,
    ownerTypes: [...definition.ownerTypes],
    symbolCount: hasCatalogEntries ? entries.all.length : fallbackSymbols.length,
    memberCount: hasCatalogEntries ? entries.members.length : fallbackMembers.length,
    eventCount: hasCatalogEntries ? entries.events.length : fallbackEvents.length,
    symbolSamples: hasCatalogEntries
      ? buildSymbolSamples(entries.all, definition.spotlightSymbols)
      : buildAdvisorySymbolSamples(fallbackMembers, fallbackEvents, definition.spotlightSymbols),
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