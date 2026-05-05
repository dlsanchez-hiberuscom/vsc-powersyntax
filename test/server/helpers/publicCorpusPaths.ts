import * as fs from 'fs';
import * as path from 'path';

import { resolveRepoRoot } from './fixtureLoader';

function resolvePublicCorpusPath(folderName: string): string {
  return path.join(resolveRepoRoot(), 'fixtures-local', 'public', folderName);
}

const MATERIALIZED_PUBLIC_CORPUS_SLOTS = [
  'legacy-pbl-dump'
] as const;

export type MaterializedPublicCorpusSlot = typeof MATERIALIZED_PUBLIC_CORPUS_SLOTS[number];

export const legacyPblDumpPath = resolvePublicCorpusPath('legacy-pbl-dump');

export function getMaterializedPublicCorpusSlots(): readonly MaterializedPublicCorpusSlot[] {
  return [...MATERIALIZED_PUBLIC_CORPUS_SLOTS];
}

export function getLegacyPblDumpPath(): string {
  return legacyPblDumpPath;
}

export function hasLegacyPblDump(): boolean {
  return fs.existsSync(legacyPblDumpPath);
}