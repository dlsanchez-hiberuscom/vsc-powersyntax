import * as fs from 'node:fs';
import * as path from 'node:path';

export function loadFixture(relativePath: string): string {
  const fullPath = path.resolve(process.cwd(), 'test', 'fixtures', relativePath);
  return fs.readFileSync(fullPath, 'utf8');
}
