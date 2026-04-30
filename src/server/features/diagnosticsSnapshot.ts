/**
 * Diagnostics snapshot (Spec 053 / B063).
 *
 * @module features/diagnosticsSnapshot
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';

export interface DiagnosticsSnapshot {
  totals: { error: number; warning: number; info: number; hint: number };
  byFile: Record<string, number>;
  byCode: Record<string, number>;
}

export function buildDiagnosticsSnapshot(
  byUri: ReadonlyMap<string, readonly Diagnostic[]>
): DiagnosticsSnapshot {
  const totals = { error: 0, warning: 0, info: 0, hint: 0 };
  const byFile: Record<string, number> = {};
  const byCode: Record<string, number> = {};

  for (const [uri, diags] of byUri) {
    byFile[uri] = diags.length;
    for (const d of diags) {
      switch (d.severity) {
        case DiagnosticSeverity.Error: totals.error++; break;
        case DiagnosticSeverity.Warning: totals.warning++; break;
        case DiagnosticSeverity.Information: totals.info++; break;
        case DiagnosticSeverity.Hint: totals.hint++; break;
        default: totals.info++; break;
      }
      const key = `${d.source ?? 'unknown'}:${d.code ?? 'n/a'}`;
      byCode[key] = (byCode[key] ?? 0) + 1;
    }
  }

  return { totals, byFile, byCode };
}
