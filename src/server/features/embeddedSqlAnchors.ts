import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';

import type { ApiEmbeddedSqlAnchor } from '../../shared/publicApi';
import { findSqlRegions } from '../parsing/sqlRegions';

const CONNECT_USING_REGEX = /\b(?:connect|disconnect)\s+using\s+([A-Za-z_$#%][\w$#%-]*)\b/gi;
const SQLCA_REGEX = /\bsqlca\b/i;
const DEFAULT_MAX_ANCHORS = Number.MAX_SAFE_INTEGER;
const MAX_PREVIEW_LENGTH = 160;

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
  maxAnchors = DEFAULT_MAX_ANCHORS,
): ApiEmbeddedSqlAnchor[] {
  if (!snapshot) {
    return [];
  }

  const lines = snapshot.maskedText.lines;
  const content = lines.join('\n');
  const transactionAnchor = inferTransactionAnchor(content);
  const limit = Number.isFinite(maxAnchors)
    ? Math.max(0, Math.trunc(maxAnchors))
    : DEFAULT_MAX_ANCHORS;

  return findSqlRegions(content)
    .slice(0, limit)
    .map((region) => ({
      startLine: region.startLine,
      endLine: region.endLine,
      keyword: region.keyword,
      preview: buildPreview(lines, region.startLine, region.endLine),
      confidence: transactionAnchor.confidence,
      ...(transactionAnchor.transactionTarget ? { transactionTarget: transactionAnchor.transactionTarget } : {}),
    }));
}