import * as fs from 'fs';
import * as path from 'path';

function looksLikeRepoRoot(candidate: string): boolean {
  return fs.existsSync(path.join(candidate, 'package.json'))
    && fs.existsSync(path.join(candidate, 'test'));
}

export function resolveRepoRoot(): string {
  const candidates = [
    // Compilado: out/test/server/helpers -> repo root
    path.resolve(__dirname, '../../../..'),
    // Source: test/server/helpers -> repo root
    path.resolve(__dirname, '../../..')
  ];

  for (const candidate of candidates) {
    if (looksLikeRepoRoot(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `No se pudo resolver la raíz del repo desde ${__dirname}. Se esperaban package.json y carpeta test/.`
  );
}

export function fixturePath(pathOrFolder: string, maybeFileName?: string): string {
  const repoRoot = resolveRepoRoot();
  const relative = maybeFileName
    ? path.join(pathOrFolder, maybeFileName)
    : pathOrFolder;

  return path.join(repoRoot, 'test', 'fixtures', relative);
}

export function loadFixture(pathOrFolder: string, maybeFileName?: string): string {
  return fs.readFileSync(fixturePath(pathOrFolder, maybeFileName), 'utf8');
}

export function loadFixtureBuffer(pathOrFolder: string, maybeFileName?: string): Buffer {
  return fs.readFileSync(fixturePath(pathOrFolder, maybeFileName));
}

export function fixtureExists(pathOrFolder: string, maybeFileName?: string): boolean {
  return fs.existsSync(fixturePath(pathOrFolder, maybeFileName));
}