/**
 * Detector de llamadas a funciones obsoletas (Spec 036 / B074).
 *
 * Recorre el documento enmascarado y produce diagnósticos de Warning.
 *
 * @module features/obsoleteDetector
 */

import { Diagnostic, DiagnosticSeverity, Position, Range } from 'vscode-languageserver/node';

import { DIAGNOSTIC_CODES, withDiagnosticCode } from '../../shared/diagnosticCodes';
import { maskDocument } from '../parsing/codeMasking';
import { buildObsoleteIndex, type ObsoleteEntry } from '../knowledge/obsoleteCatalog';

const SOURCE = 'PowerScript:SD7';

export function findObsoleteCalls(
  content: string,
  catalog: ObsoleteEntry[] | Map<string, ObsoleteEntry> = buildObsoleteIndex()
): Diagnostic[] {
  const index = catalog instanceof Map ? catalog : buildObsoleteIndex(catalog);
  if (index.size === 0) return [];

  const masked = maskDocument(content).split(/\r?\n/);
  const out: Diagnostic[] = [];
  // Regex `\bname\s*\(`
  const pattern = new RegExp(`\\b(${[...index.keys()].map(escape).join('|')})\\s*\\(`, 'gi');
  for (let line = 0; line < masked.length; line++) {
    const text = masked[line];
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const entry = index.get(m[1].toLowerCase());
      if (!entry) continue;
      const start = Position.create(line, m.index);
      const end = Position.create(line, m.index + m[1].length);
      out.push(withDiagnosticCode({
        severity: DiagnosticSeverity.Warning,
        range: Range.create(start, end),
        message: entry.replacement
          ? `'${entry.name}' está marcada como obsoleta. Sugerencia: ${entry.replacement}.`
          : `'${entry.name}' está marcada como obsoleta.`,
        source: SOURCE
      }, DIAGNOSTIC_CODES.sd7ObsoleteFunction));
    }
  }
  return out;
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
