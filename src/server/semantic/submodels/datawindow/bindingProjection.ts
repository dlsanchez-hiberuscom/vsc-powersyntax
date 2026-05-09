import type {
  ApiDataWindowBindingConsumer,
  ApiDataWindowBindingReceipt,
} from '../../../../shared/publicApi';
import type { SemanticDocumentSnapshot } from '../../../analysis/semanticSnapshot';
import { KnowledgeBase } from '../../../knowledge/KnowledgeBase';
import {
  collectDataObjectBindings,
  type DataWindowBindingSummary,
} from '../../../features/dataWindowBindingModel';

const DEFAULT_MAX_BINDINGS = 16;

const MAX_BINDINGS_BY_CONSUMER: Record<ApiDataWindowBindingConsumer, number> = {
  default: DEFAULT_MAX_BINDINGS,
  'current-object-context': 12,
  'code-metrics': 8,
  'ai-bundle': 8,
  'support-bundle': 8,
  'debug/deep-report': 64,
};

export interface CollectDataWindowBindingsOptions {
  consumer?: ApiDataWindowBindingConsumer;
  maxBindings?: number;
  allowUnbounded?: boolean;
  startLine?: number;
  endLine?: number;
}

export interface DataWindowBindingCollection {
  bindings: DataWindowBindingSummary[];
  receipt: ApiDataWindowBindingReceipt;
}

function normalizeMaxBindings(maxBindings: number | undefined, fallback: number): number {
  if (typeof maxBindings !== 'number' || !Number.isFinite(maxBindings)) {
    return fallback;
  }

  return Math.max(0, Math.trunc(maxBindings));
}

function resolveBindingPolicy(
  options: CollectDataWindowBindingsOptions | undefined,
): { consumer: ApiDataWindowBindingConsumer; maxBindings?: number; unbounded: boolean } {
  const consumer = options?.consumer ?? 'default';
  const requestedUnbounded = options?.allowUnbounded === true;
  const unbounded = requestedUnbounded && consumer === 'debug/deep-report';

  if (unbounded) {
    return {
      consumer,
      unbounded: true,
    };
  }

  return {
    consumer,
    maxBindings: normalizeMaxBindings(options?.maxBindings, MAX_BINDINGS_BY_CONSUMER[consumer]),
    unbounded: false,
  };
}

export function collectDataObjectBindingsProjection(
  snapshot: SemanticDocumentSnapshot | null | undefined,
  kb: KnowledgeBase,
  options?: CollectDataWindowBindingsOptions,
): DataWindowBindingCollection {
  const policy = resolveBindingPolicy(options);

  if (!snapshot) {
    return {
      bindings: [],
      receipt: {
        consumer: policy.consumer,
        totalBindings: 0,
        emittedBindings: 0,
        ...(typeof policy.maxBindings === 'number' ? { maxBindings: policy.maxBindings } : {}),
        ...(policy.unbounded ? { unbounded: true } : {}),
        truncated: false,
      },
    };
  }

  const startLine = Math.max(0, options?.startLine ?? 0);
  const endLine = Math.min(
    snapshot.maskedText.lines.length - 1,
    options?.endLine ?? (snapshot.maskedText.lines.length - 1),
  );
  const allBindings = collectDataObjectBindings(snapshot, kb, startLine, endLine);
  const bindings = policy.unbounded
    ? allBindings
    : allBindings.slice(0, policy.maxBindings);

  return {
    bindings,
    receipt: {
      consumer: policy.consumer,
      totalBindings: allBindings.length,
      emittedBindings: bindings.length,
      ...(typeof policy.maxBindings === 'number' ? { maxBindings: policy.maxBindings } : {}),
      ...(policy.unbounded ? { unbounded: true } : {}),
      truncated: allBindings.length > bindings.length,
      ...(allBindings.length > bindings.length
        ? { truncatedReason: `datawindow-binding-cap:${policy.consumer}` }
        : {}),
    },
  };
}