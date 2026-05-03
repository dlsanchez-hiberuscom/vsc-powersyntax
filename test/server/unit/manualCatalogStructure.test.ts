import * as assert from 'assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import {
  PB_MANUAL_CORE_DATASET_SLICES,
  PB_MANUAL_CORE_OWNER_TYPE_GROUPS,
} from '../../../src/server/knowledge/system/manual';
import { PB_SYSTEM_SYMBOL_DATASET_SLICES } from '../../../src/server/knowledge/system/registry/datasets';

suite('unit/manualCatalogStructure (B357)', () => {
  test('registry cubre exactamente los slices manuales estables', () => {
    const manualDomains = PB_MANUAL_CORE_DATASET_SLICES.map((slice) => slice.domain);
    const registryManualDomains = PB_SYSTEM_SYMBOL_DATASET_SLICES
      .filter((slice) => slice.dataset === 'manual-core')
      .map((slice) => slice.domain);

    assert.deepEqual(registryManualDomains, manualDomains);
  });

  test('common queda helper-only y registry usa agregadores estables', () => {
    const workspaceRoot = path.resolve(__dirname, '../../../..');
    const commonSource = fs.readFileSync(
      path.join(workspaceRoot, 'src/server/knowledge/system/manual/common.ts'),
      'utf8',
    );
    const registrySource = fs.readFileSync(
      path.join(workspaceRoot, 'src/server/knowledge/system/registry/datasets.ts'),
      'utf8',
    );

    assert.ok(PB_MANUAL_CORE_OWNER_TYPE_GROUPS.object.length > 0);
    assert.ok(PB_MANUAL_CORE_OWNER_TYPE_GROUPS.dataWindowFunction.length > 0);
    assert.doesNotMatch(commonSource, /export const PB_MANUAL_CORE_.*OWNER_TYPES/);
    assert.match(registrySource, /PB_MANUAL_CORE_DATASET_SLICES/);
    assert.match(registrySource, /PB_MANUAL_CORE_OWNER_TYPE_GROUPS/);
    assert.doesNotMatch(registrySource, /from '\.\.\/manual\/common'/);
  });
});