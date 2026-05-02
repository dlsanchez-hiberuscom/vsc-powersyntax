import * as fs from 'fs';
import * as path from 'path';

import { resolveRepoRoot } from './fixtureLoader';

function resolvePublicCorpusPath(folderName: string): string {
  return path.join(resolveRepoRoot(), 'fixtures-local', 'public', folderName);
}

export const legacyPblDumpPath = resolvePublicCorpusPath('legacy-pbl-dump');

export function getLegacyPblDumpPath(): string {
  return legacyPblDumpPath;
}

export function hasLegacyPblDump(): boolean {
  return fs.existsSync(legacyPblDumpPath);
}