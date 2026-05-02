import test from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

import { createCancellationSource } from '../../../src/server/runtime/cancellation';
import { NodeFileSystem } from '../../../src/server/system/fileSystem';
import { discoverWorkspace } from '../../../src/server/workspace/discovery';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { listFilesRecursive } from '../helpers/pfcPaths';
import { getOrderEntryPath, hasOrderEntry } from '../helpers/orderEntryPaths';

function toFileUri(fsPath: string): string {
  return pathToFileURL(fsPath).toString();
}

function buildVariantFamilies(rootPath: string): Map<string, Map<string, string>> {
  const candidates = listFilesRecursive(rootPath, ['.sru', '.srw', '.srm', '.srd', '.srf', '.sra', '.srs', '.srp', '.srq']);
  const families = new Map<string, Map<string, string>>();

  for (const filePath of candidates) {
    const fileName = path.basename(filePath);
    const match = fileName.match(/^(.*)_([efis])(\.[^.]+)$/i);
    if (!match) {
      continue;
    }

    const familyKey = `${match[1].toLowerCase()}${match[3].toLowerCase()}`;
    const language = match[2].toLowerCase();
    const family = families.get(familyKey) ?? new Map<string, string>();
    family.set(language, filePath);
    families.set(familyKey, family);
  }

  return families;
}

test('OrderEntry smoke: discovery mantiene solution parcial, ignora backups y conserva variantes multiidioma', { skip: !hasOrderEntry() }, async () => {
  const root = getOrderEntryPath();
  const fs = new NodeFileSystem();
  const state = new WorkspaceState();
  const cancelSource = createCancellationSource();

  await discoverWorkspace([toFileUri(root)], fs, state, cancelSource.token);

  const roots = state.getRoots();
  const sourceFiles = state.getAllSourceFiles();

  assert.ok(roots.projects.length >= 1, 'OrderEntry debería descubrir al menos un .pbproj real.');
  assert.equal(roots.solutions.length, 0, 'El fixture actual de OrderEntry debería seguir siendo un solution parcial sin .pbsln top-level.');
  assert.equal(state.getMode(), 'solution', 'OrderEntry debería degradar a solution-mode por su .pbproj aislado.');
  assert.ok(
    sourceFiles.every((uri) => !uri.toLowerCase().includes('/_backupfiles/')),
    'Discovery no debería indexar fuentes dentro de _BackupFiles.'
  );

  const family = [...buildVariantFamilies(root).values()].find((entry) => ['e', 'f', 'i', 's'].every((language) => entry.has(language)));
  assert.ok(family, 'OrderEntry debería aportar al menos una familia multiidioma _e/_f/_i/_s para regresión.');

  for (const filePath of family!.values()) {
    assert.ok(
      state.hasSourceFile(toFileUri(filePath)),
      `Discovery debería conservar la variante multiidioma real ${path.basename(filePath)} como fuente independiente.`
    );
  }
});