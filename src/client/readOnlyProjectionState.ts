import type {
  ApiReadOnlyProjectionEnvelope,
  ApiReadOnlyProjectionState,
} from '../shared/publicApi';

interface ReadOnlyProjectionStateMessageOptions {
  projection?: ApiReadOnlyProjectionEnvelope;
  state?: ApiReadOnlyProjectionState;
  detail?: string;
}

function resolveProjectionDetail(
  state: ApiReadOnlyProjectionState,
  options: ReadOnlyProjectionStateMessageOptions,
): string | undefined {
  if (options.detail) {
    return options.detail;
  }

  const projection = options.projection;
  if (!projection) {
    return undefined;
  }

  switch (state) {
    case 'degraded':
      return projection.degradedReason ?? projection.refreshHint?.detail ?? projection.readiness;
    case 'stale':
      return projection.staleReason ?? projection.refreshHint?.detail;
    case 'paged':
      return projection.refreshHint?.detail
        ?? (projection.pageInfo?.hasMore ? `pagina ${projection.pageInfo.page ?? 1}; solicita la siguiente pagina bajo demanda.` : undefined)
        ?? projection.truncatedReason;
    case 'ready':
      return projection.truncatedReason;
    case 'error':
      return projection.refreshHint?.detail ?? projection.readiness;
    default:
      return undefined;
  }
}

export function buildReadOnlyProjectionStateMessage(
  surfaceLabel: string,
  options: ReadOnlyProjectionStateMessageOptions,
): string | undefined {
  const state = options.state ?? options.projection?.state;
  if (!state) {
    return undefined;
  }

  const stateLabel: Record<ApiReadOnlyProjectionState, string> = {
    loading: 'cargando',
    degraded: 'degradado',
    stale: 'stale',
    ready: 'listo',
    paged: 'paginado',
    error: 'error',
  };
  const detail = resolveProjectionDetail(state, options);
  return detail
    ? `${surfaceLabel}: ${stateLabel[state]} · ${detail}`
    : `${surfaceLabel}: ${stateLabel[state]}`;
}

export function mergeReadOnlySurfaceMessages(
  primaryMessage: string | undefined,
  secondaryMessage: string | undefined,
): string | undefined {
  if (primaryMessage && secondaryMessage && primaryMessage !== secondaryMessage) {
    return `${primaryMessage} ${secondaryMessage}`;
  }

  return primaryMessage ?? secondaryMessage;
}