/**
 * CodeLens "N referencias" (Spec 050 / B066).
 *
 * @module features/codeLensReferences
 */

import { CodeLens, Range } from 'vscode-languageserver/node';

export interface CodeLensSymbol {
  name: string;
  range: Range;
}

export function formatReferenceTitle(count: number): string {
  if (count <= 0) return 'sin referencias';
  if (count === 1) return '1 referencia';
  return `${count} referencias`;
}

export function provideReferenceCodeLenses(
  symbols: readonly CodeLensSymbol[],
  countByName: ReadonlyMap<string, number>
): CodeLens[] {
  const out: CodeLens[] = [];
  for (const s of symbols) {
    const c = countByName.get(s.name.toLowerCase()) ?? 0;
    out.push({
      range: s.range,
      command: {
        title: formatReferenceTitle(c),
        command: 'powerbuilder.showReferences',
        arguments: [s.name]
      }
    });
  }
  return out;
}
