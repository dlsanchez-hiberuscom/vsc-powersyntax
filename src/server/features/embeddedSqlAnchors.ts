import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';

import type {
  ApiEmbeddedSqlAnchor,
  ApiEmbeddedSqlAnchorConsumer,
  ApiEmbeddedSqlAnchorReceipt,
} from '../../shared/publicApi';
import { findSqlRegions } from '../parsing/sqlRegions';

const CONNECT_USING_REGEX = /\b(?:connect|disconnect)\s+using\s+([A-Za-z_$#%][\w$#%-]*)\b/gi;
const SQLCA_REGEX = /\bsqlca\b/i;
const DEFAULT_MAX_ANCHORS = 16;
const MAX_PREVIEW_LENGTH = 160;

const MAX_ANCHORS_BY_CONSUMER: Record<ApiEmbeddedSqlAnchorConsumer, number> = {
  default: DEFAULT_MAX_ANCHORS,
  'current-object-context': 12,
  'code-metrics': 4,
  'ai-bundle': 8,
  'support-bundle': 8,
  'debug/deep-report': 64,
};

export interface CollectEmbeddedSqlAnchorsOptions {
  consumer?: ApiEmbeddedSqlAnchorConsumer;
  maxAnchors?: number;
  allowUnbounded?: boolean;
}

export interface EmbeddedSqlAnchorCollection {
  anchors: ApiEmbeddedSqlAnchor[];
  receipt: ApiEmbeddedSqlAnchorReceipt;
}

function normalizeMaxAnchors(maxAnchors: number | undefined, fallback: number): number {
  if (typeof maxAnchors !== 'number' || !Number.isFinite(maxAnchors)) {
    return fallback;
  }

  return Math.max(0, Math.trunc(maxAnchors));
}

function resolveEmbeddedSqlAnchorPolicy(
  optionsOrMaxAnchors: number | CollectEmbeddedSqlAnchorsOptions | undefined,
): { consumer: ApiEmbeddedSqlAnchorConsumer; maxAnchors?: number; unbounded: boolean } {
  if (typeof optionsOrMaxAnchors === 'number') {
    return {
      consumer: 'default',
      maxAnchors: normalizeMaxAnchors(optionsOrMaxAnchors, DEFAULT_MAX_ANCHORS),
      unbounded: false,
    };
  }

  const consumer = optionsOrMaxAnchors?.consumer ?? 'default';
  const requestedUnbounded = optionsOrMaxAnchors?.allowUnbounded === true;
  const unbounded = requestedUnbounded && consumer === 'debug/deep-report';

  if (unbounded) {
    return {
      consumer,
      unbounded: true,
    };
  }

  return {
    consumer,
    maxAnchors: normalizeMaxAnchors(
      optionsOrMaxAnchors?.maxAnchors,
      MAX_ANCHORS_BY_CONSUMER[consumer],
    ),
    unbounded: false,
  };
}

function buildPreview(lines: readonly string[], startLine: number, endLine: number): string {
  const preview = lines.slice(startLine, endLine + 1).join(' ').replace(/\s+/g, ' ').trim();
  return preview.length > MAX_PREVIEW_LENGTH
    ? `${preview.slice(0, MAX_PREVIEW_LENGTH - 3)}...`
    : preview;
}

function inferTransactionAnchor(content: string): { transactionTarget?: string; confidence: ApiEmbeddedSqlAnchor['confidence'] } {
  const targets = [...content.matchAll(CONNECT_USING_REGEX)].map((match) => match[1]);
  const uniqueTargets = [...new Set(targets.map((target) => target.toUpperCase()))];
  if (uniqueTargets.length === 1) {
    return {
      transactionTarget: uniqueTargets[0],
      confidence: 'high',
    };
  }
  if (uniqueTargets.length > 1) {
    return { confidence: 'low' };
  }
  if (SQLCA_REGEX.test(content)) {
    return {
      transactionTarget: 'SQLCA',
      confidence: 'medium',
    };
  }
  return { confidence: 'low' };
}

export function collectEmbeddedSqlAnchors(
  snapshot: SemanticDocumentSnapshot | null | undefined,
  optionsOrMaxAnchors?: number | CollectEmbeddedSqlAnchorsOptions,
): ApiEmbeddedSqlAnchor[] {
  return collectEmbeddedSqlAnchorsProjection(snapshot, optionsOrMaxAnchors).anchors;
}

export function collectEmbeddedSqlAnchorsProjection(
  snapshot: SemanticDocumentSnapshot | null | undefined,
  optionsOrMaxAnchors?: number | CollectEmbeddedSqlAnchorsOptions,
): EmbeddedSqlAnchorCollection {
  const policy = resolveEmbeddedSqlAnchorPolicy(optionsOrMaxAnchors);
  if (!snapshot) {
    return {
      anchors: [],
      receipt: {
        consumer: policy.consumer,
        totalAnchors: 0,
        emittedAnchors: 0,
        ...(typeof policy.maxAnchors === 'number' ? { maxAnchors: policy.maxAnchors } : {}),
        ...(policy.unbounded ? { unbounded: true } : {}),
        truncated: false,
      },
    };
  }

  const lines = snapshot.maskedText.lines;
  const content = lines.join('\n');
  const transactionAnchor = inferTransactionAnchor(content);
  const regions = findSqlRegions(content);
  const anchors = regions
    .slice(0, policy.unbounded ? regions.length : policy.maxAnchors)
    .map((region) => ({
      startLine: region.startLine,
      endLine: region.endLine,
      keyword: region.keyword,
      preview: buildPreview(lines, region.startLine, region.endLine),
      confidence: transactionAnchor.confidence,
      ...(transactionAnchor.transactionTarget ? { transactionTarget: transactionAnchor.transactionTarget } : {}),
    }));

  return {
    anchors,
    receipt: {
      consumer: policy.consumer,
      totalAnchors: regions.length,
      emittedAnchors: anchors.length,
      ...(typeof policy.maxAnchors === 'number' ? { maxAnchors: policy.maxAnchors } : {}),
      ...(policy.unbounded ? { unbounded: true } : {}),
      truncated: regions.length > anchors.length,
      ...(regions.length > anchors.length
        ? { truncatedReason: `sql-anchor-cap:${policy.consumer}` }
        : {}),
    },
  };
}