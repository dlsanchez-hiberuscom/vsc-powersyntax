import * as fs from 'node:fs';
import * as path from 'node:path';

export function getPfcWorkspacePath(): string {
  return path.resolve(process.cwd(), 'fixtures-local', 'pfc', '2025-Workspace');
}

export function getPfcSolutionPath(): string {
  return path.resolve(process.cwd(), 'fixtures-local', 'pfc', '2025-Solution');
}

export function hasPfcWorkspace(): boolean {
  return fs.existsSync(getPfcWorkspacePath());
}

export function hasPfcSolution(): boolean {
  return fs.existsSync(getPfcSolutionPath());
}

export function listFilesRecursive(root: string, extensions: string[]): string[] {
  const result: string[] = [];

  function visit(current: string): void {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (extensions.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
        result.push(fullPath);
      }
    }
  }

  visit(root);
  return result;
}
