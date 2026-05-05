import type { CancellationToken } from '../runtime/cancellation';
import type { InteractiveServingFeature } from '../runtime/interactiveServingStats';
import { normalizeUri } from '../system/uriUtils';

import type { SourceOrigin } from '../../shared/sourceOrigin';

export interface InteractiveServingRequestState {
  feature: InteractiveServingFeature;
  uri: string;
  documentVersion: string | number;
  kbVersion: number;
  semanticEpoch: number;
  sourceOrigin?: SourceOrigin | 'unknown';
  locale?: string;
  contextKey?: string;
}

export interface InteractiveServingRequestToken extends InteractiveServingRequestState {
  laneKey: string;
  sequence: number;
  documentVersion: string;
  sourceOrigin: SourceOrigin | 'unknown';
  locale: string;
  contextKey: string;
}

export type InteractiveServingStaleReason =
  | 'cancelled'
  | 'newer-request'
  | 'document-version'
  | 'locale'
  | 'kb-version'
  | 'semantic-epoch'
  | 'source-origin'
  | 'context-key';

export interface InteractiveServingStaleCheck {
  stale: boolean;
  reason?: InteractiveServingStaleReason;
}

function normalizeRequestState(state: InteractiveServingRequestState): InteractiveServingRequestToken {
  const normalizedUri = normalizeUri(state.uri);

  return {
    ...state,
    uri: normalizedUri,
    laneKey: `${state.feature}|${normalizedUri}`,
    sequence: 0,
    documentVersion: String(state.documentVersion),
    sourceOrigin: state.sourceOrigin ?? 'unknown',
    locale: state.locale ?? '',
    contextKey: state.contextKey ?? '',
  };
}

export class InteractiveServingStaleGuard {
  private readonly latestByLane = new Map<string, number>();

  begin(state: InteractiveServingRequestState): InteractiveServingRequestToken {
    const normalized = normalizeRequestState(state);
    const sequence = (this.latestByLane.get(normalized.laneKey) ?? 0) + 1;
    this.latestByLane.set(normalized.laneKey, sequence);

    return {
      ...normalized,
      sequence,
    };
  }

  check(
    token: InteractiveServingRequestToken,
    current: InteractiveServingRequestState,
    cancellationToken?: CancellationToken | null
  ): InteractiveServingStaleCheck {
    if (cancellationToken?.isCancelled) {
      return { stale: true, reason: 'cancelled' };
    }

    const normalized = normalizeRequestState(current);

    if ((this.latestByLane.get(token.laneKey) ?? 0) !== token.sequence) {
      return { stale: true, reason: 'newer-request' };
    }
    if (normalized.documentVersion !== token.documentVersion) {
      return { stale: true, reason: 'document-version' };
    }
    if (normalized.locale !== token.locale) {
      return { stale: true, reason: 'locale' };
    }
    if (normalized.kbVersion !== token.kbVersion) {
      return { stale: true, reason: 'kb-version' };
    }
    if (normalized.semanticEpoch !== token.semanticEpoch) {
      return { stale: true, reason: 'semantic-epoch' };
    }
    if (normalized.sourceOrigin !== token.sourceOrigin) {
      return { stale: true, reason: 'source-origin' };
    }
    if (normalized.contextKey !== token.contextKey) {
      return { stale: true, reason: 'context-key' };
    }

    return { stale: false };
  }
}