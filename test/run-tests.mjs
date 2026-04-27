import { readdir, access } from 'fs/promises';
import { join } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(res);
    } else if (entry.isFile() && (res.endsWith('.ts') || res.endsWith('.js'))) {
      yield res;
    }
  }
}

(async () => {
  // If compiled JS tests exist in ../out/test, prefer importing them (.js)
  const compiledRoot = new URL('../out/test', import.meta.url);
  try {
    await access(fileURLToPath(compiledRoot));
    const compiledDir = fileURLToPath(compiledRoot);
    for await (const file of walk(compiledDir)) {
      if (!file.endsWith('.js')) continue;
      const url = pathToFileURL(file).href;
      await import(url);
    }
    return;
  } catch {
    // no compiled tests, import TypeScript tests directly
  }

  const root = new URL('./server', import.meta.url);
  const dirPath = fileURLToPath(root);
  for await (const file of walk(dirPath)) {
    if (!file.endsWith('.ts')) continue;
    const url = pathToFileURL(file).href;
    await import(url);
  }
})();
