import * as fs from 'fs';
import * as path from 'path';

import { resolveRepoRoot } from './fixtureLoader';

function resolveOrderEntryPath(): string {
  return path.join(resolveRepoRoot(), 'fixtures-local', 'STD_FC_OrderEntry');
}

export const orderEntryPath = resolveOrderEntryPath();

export function getOrderEntryPath(): string {
  return orderEntryPath;
}

export function hasOrderEntry(): boolean {
  return fs.existsSync(orderEntryPath);
}