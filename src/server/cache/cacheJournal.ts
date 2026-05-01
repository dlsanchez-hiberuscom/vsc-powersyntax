import {
  CACHE_SCHEMA_VERSION,
  type CacheMutationKind,
  type SemanticCacheDocumentRecord,
  type SemanticCacheJournalEntry
} from './cacheSchema';

export interface CacheJournalAppendInput {
  semanticEpoch: number;
  kind: CacheMutationKind;
  uris: string[];
  documents?: SemanticCacheDocumentRecord[];
}

export interface CacheJournal {
  append(entry: CacheJournalAppendInput): SemanticCacheJournalEntry;
  list(): SemanticCacheJournalEntry[];
  truncate(maxEntries: number): void;
  clear(): void;
  getStats(): { entries: number; lastSequence: number };
}

export function createCacheJournal(maxEntries = 1024): CacheJournal {
  const entries: SemanticCacheJournalEntry[] = [];
  let sequence = 0;

  return {
    append(entry: CacheJournalAppendInput): SemanticCacheJournalEntry {
      const next: SemanticCacheJournalEntry = {
        schemaVersion: CACHE_SCHEMA_VERSION,
        sequence: ++sequence,
        semanticEpoch: entry.semanticEpoch,
        createdAt: Date.now(),
        kind: entry.kind,
        uris: [...entry.uris],
        documents: entry.documents ? [...entry.documents] : undefined
      };
      entries.push(next);
      if (entries.length > maxEntries) {
        entries.splice(0, entries.length - maxEntries);
      }
      return next;
    },
    list(): SemanticCacheJournalEntry[] {
      return [...entries];
    },
    truncate(nextMaxEntries: number): void {
      if (entries.length > nextMaxEntries) {
        entries.splice(0, entries.length - nextMaxEntries);
      }
    },
    clear(): void {
      entries.length = 0;
    },
    getStats(): { entries: number; lastSequence: number } {
      return {
        entries: entries.length,
        lastSequence: sequence
      };
    }
  };
}