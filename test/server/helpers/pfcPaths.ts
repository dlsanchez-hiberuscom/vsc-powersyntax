import * as fs from 'fs';
import * as path from 'path';
import { resolveRepoRoot } from './fixtureLoader';

function resolvePfcPath(folderName: string): string {
  return path.join(resolveRepoRoot(), 'fixtures-local', 'pfc', folderName);
}

export const pfcWorkspacePath = resolvePfcPath('2025-Workspace');
export const pfcSolutionPath = resolvePfcPath('2025-Solution');

export const PFC_WORKSPACE_PATH = pfcWorkspacePath;
export const PFC_SOLUTION_PATH = pfcSolutionPath;

export function getPfcWorkspacePath(): string {
  return pfcWorkspacePath;
}

export function getPfcSolutionPath(): string {
  return pfcSolutionPath;
}

export function hasPfcWorkspace(): boolean {
  return fs.existsSync(pfcWorkspacePath);
}

export function hasPfcSolution(): boolean {
  return fs.existsSync(pfcSolutionPath);
}

export function listFilesRecursive(rootPath: string, extensions?: string[]): string[] {
  if (!fs.existsSync(rootPath)) {
    return [];
  }

  const normalizedExtensions = extensions?.map(ext =>
    ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`
  );

  const results: string[] = [];

  function walk(currentPath: string): void {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (!normalizedExtensions || normalizedExtensions.length === 0) {
        results.push(fullPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (normalizedExtensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }

  walk(rootPath);
  return results;
}