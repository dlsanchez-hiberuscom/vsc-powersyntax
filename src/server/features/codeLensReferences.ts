/**
 * CodeLens "N referencias" (Spec 050 / B066).
 *
 * @module features/codeLensReferences
 */

import { CodeLens, Range } from 'vscode-languageserver/node';

export interface CodeLensSymbol {
  key: string;
  name: string;
  range: Range;
  relation?: 'override';
  overrideCount?: number;
  unavailableReason?: string;
}

export function formatReferenceTitle(count: number): string {
  if (count <= 0) return 'sin referencias';
  if (count === 1) return '1 referencia';
  return `${count} referencias`;
}

export function formatHierarchyTitle(symbol: CodeLensSymbol): string | null {
  if (symbol.relation === 'override') {
    return 'override';
  }

  const overrideCount = symbol.overrideCount ?? 0;
  if (overrideCount <= 0) {
    return null;
  }

  return overrideCount === 1 ? '1 override' : `${overrideCount} overrides`;
}

export function formatCodeLensTitle(symbol: CodeLensSymbol, referenceCount: number): string {
  if (symbol.unavailableReason) {
    return symbol.unavailableReason;
  }

  const parts = [formatReferenceTitle(referenceCount)];
  const hierarchy = formatHierarchyTitle(symbol);
  if (hierarchy) {
    parts.push(hierarchy);
  }
  return parts.join(' · ');
}

export function provideReferenceCodeLenses(
  symbols: readonly CodeLensSymbol[],
  countByKey: ReadonlyMap<string, number>
): CodeLens[] {
  const out: CodeLens[] = [];
  for (const s of symbols) {
    const c = countByKey.get(s.key) ?? 0;
    const title = formatCodeLensTitle(s, c);
    out.push({
      range: s.range,
      ...(s.unavailableReason
        ? {}
        : {
          command: {
            title,
            command: 'powerbuilder.showReferences',
            arguments: [s.name]
          }
        }),
      ...(s.unavailableReason ? { data: { title } } : {})
    });
  }
  return out;
}
