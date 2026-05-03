import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';

import {
  buildDataWindowModelFromSnapshot,
  type DataWindowRetrieveArgument,
} from './dataWindowModel';

export interface DataWindowSafeModeColumn {
  name: string;
  type: string;
  dbName?: string;
  update?: boolean;
}

export interface DataWindowSafeModeSummary {
  retrieve?: string;
  retrieveArguments: DataWindowRetrieveArgument[];
  columns: DataWindowSafeModeColumn[];
  bands: string[];
}

export function summarizeDataWindowSafeMode(
  snapshot: SemanticDocumentSnapshot | null
): DataWindowSafeModeSummary | null {
  const model = buildDataWindowModelFromSnapshot(snapshot);
  if (!model) {
    return null;
  }

  const retrieve = model.retrieve?.statement;
  const columns = model.tableColumns.map((column) => ({
    name: column.name,
    type: column.type ?? 'unknown',
    ...(column.dbName ? { dbName: column.dbName } : {}),
    ...(column.update ? { update: column.update.toLowerCase() === 'yes' } : {}),
  }));
  const bands = model.bands.map((band) => band.name);
  const retrieveArguments = model.retrieveArguments.map((argument) => ({ ...argument }));

  if (!retrieve && columns.length === 0 && bands.length === 0 && retrieveArguments.length === 0) {
    return null;
  }

  return {
    ...(retrieve ? { retrieve } : {}),
    retrieveArguments,
    columns,
    bands,
  };
}
