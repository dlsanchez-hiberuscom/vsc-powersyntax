import { FileChangeType } from 'vscode-languageserver/node';

import { isPowerBuilderProjectMarkerUri, isPowerBuilderSourceUri } from '../../shared/powerbuilderFiles';
import type { FsEvent } from '../system/fileWatcherDebouncer';

export function toWatchedFsEvent(change: { uri: string; type: FileChangeType }): FsEvent | null {
  if (!isPowerBuilderSourceUri(change.uri) && !isPowerBuilderProjectMarkerUri(change.uri)) {
    return null;
  }

  return {
    uri: change.uri,
    kind:
      change.type === FileChangeType.Created ? 'create'
      : change.type === FileChangeType.Deleted ? 'delete'
      : 'change'
  };
}