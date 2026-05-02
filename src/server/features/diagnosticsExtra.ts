/**
 * Diagnósticos adicionales (Specs 113-115).
 *
 * Aporta tres comprobaciones lexicales independientes que recorren los
 * scopes Function/Event ya construidos por el análisis del documento:
 *
 * - SD11: código inalcanzable tras un `return` en el mismo bloque.
 * - SD12: paréntesis manifiestamente desbalanceados en una sentencia lógica.
 * - SD13: función con tipo de retorno declarado que no contiene `return`.
 *
 * Las heurísticas son deliberadamente conservadoras para evitar falsos
 * positivos: solo se emite cuando la evidencia es lexicalmente clara.
 *
 * @module features/diagnosticsExtra
 */

import { Diagnostic, DiagnosticSeverity, Position, Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { DIAGNOSTIC_SOURCE } from '../../shared/types';
import { getDocumentAnalysis } from '../analysis/analysisCache';
import { ScopeKind, type Scope } from '../knowledge/types';
import {
  END_EVENT_PATTERN,
  END_FUNCTION_PATTERN,
  FUNCTION_PATTERN
} from '../parsing/grammar';

const RETURN_STATEMENT_RE = /^\s*return(\s|;|$)/i;

/** SD11: código inalcanzable tras `return` dentro del mismo nivel. */
export function checkUnreachableAfterReturn(
  scope: Scope,
  strippedLines: string[]
): Diagnostic[] {
  const out: Diagnostic[] = [];
  if (scope.kind !== ScopeKind.Function && scope.kind !== ScopeKind.Event) {
    return out;
  }
  let sawReturn = false;
  let returnLine = -1;
  for (let i = scope.startLine + 1; i < scope.endLine; i++) {
    const line = strippedLines[i] ?? '';
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Cualquier control de flujo nuevo resetea la heurística (pequeña pero
    // útil: salir de bloque o entrar en uno).
    if (/^\s*(if|else|elseif|for|do|while|loop|next|case|choose|try|catch|finally)\b/i.test(trimmed)) {
      sawReturn = false;
      continue;
    }
    if (END_FUNCTION_PATTERN.test(trimmed) || END_EVENT_PATTERN.test(trimmed)) break;
    if (sawReturn) {
      // Línea ejecutiva detrás de un return, mismo nivel: marcar.
      out.push({
        severity: DiagnosticSeverity.Hint,
        range: Range.create(Position.create(i, 0), Position.create(i, line.length)),
        message: `Código inalcanzable: precedido por 'return' en la línea ${returnLine + 1}.`,
        source: `${DIAGNOSTIC_SOURCE}:SD11`
      });
      // Solo reportar la primera línea inalcanzable por bloque.
      sawReturn = false;
      continue;
    }
    if (RETURN_STATEMENT_RE.test(trimmed)) {
      sawReturn = true;
      returnLine = i;
    }
  }
  return out;
}

/** SD12: paréntesis desbalanceados en una sola línea ejecutiva. */
export function checkUnbalancedParens(
  scope: Scope,
  strippedLines: string[]
): Diagnostic[] {
  const out: Diagnostic[] = [];
  if (scope.kind !== ScopeKind.Function && scope.kind !== ScopeKind.Event) {
    return out;
  }
  for (let i = scope.startLine + 1; i < scope.endLine; i++) {
    const line = strippedLines[i] ?? '';
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Saltamos líneas con continuación; el chequeo solo aplica a líneas
    // lógicas completas (sin `&` final).
    if (/&\s*$/.test(trimmed)) continue;
    let depth = 0;
    let bad = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth < 0) { bad = true; break; }
      }
    }
    if (bad || depth !== 0) {
      out.push({
        severity: DiagnosticSeverity.Information,
        range: Range.create(Position.create(i, 0), Position.create(i, line.length)),
        message: `Paréntesis desbalanceados en la sentencia.`,
        source: `${DIAGNOSTIC_SOURCE}:SD12`
      });
    }
  }
  return out;
}

/**
 * SD13: una función con tipo de retorno declarado debe contener al menos un
 * `return`. La detección de la firma se hace mirando la primera línea del
 * scope. Subroutines y eventos quedan fuera.
 */
export function checkMissingReturn(
  scope: Scope,
  strippedLines: string[]
): Diagnostic[] {
  const out: Diagnostic[] = [];
  if (scope.kind !== ScopeKind.Function) return out;
  const headerLine = strippedLines[scope.startLine] ?? '';
  const m = FUNCTION_PATTERN.exec(headerLine);
  if (!m) return out;
  const returnType = m[1].toLowerCase();
  // Una función PowerScript con returnType `none` no necesita `return`.
  if (returnType === 'none' || returnType === 'subroutine') return out;
  for (let i = scope.startLine + 1; i < scope.endLine; i++) {
    const line = strippedLines[i] ?? '';
    if (RETURN_STATEMENT_RE.test(line)) return out;
  }
  out.push({
    severity: DiagnosticSeverity.Warning,
    range: Range.create(
      Position.create(scope.startLine, 0),
      Position.create(scope.startLine, headerLine.length)
    ),
    message: `La función '${m[2]}' declara retorno '${m[1]}' pero no contiene 'return'.`,
    source: `${DIAGNOSTIC_SOURCE}:SD13`
  });
  return out;
}

/**
 * Aplica las tres comprobaciones SD11/SD12/SD13 a un documento completo.
 */
export function runExtraDiagnostics(document: TextDocument): Diagnostic[] {
  const snapshot = getDocumentAnalysis(document).snapshot;
  const out: Diagnostic[] = [];
  const strippedLines = snapshot.maskedText.lines;
  walkScopes(snapshot.scopes, (scope) => {
    out.push(...checkUnreachableAfterReturn(scope, strippedLines));
    out.push(...checkUnbalancedParens(scope, strippedLines));
    out.push(...checkMissingReturn(scope, strippedLines));
  });
  return out;
}

function walkScopes(scopes: readonly Scope[], visit: (s: Scope) => void): void {
  for (const s of scopes) {
    visit(s);
    if (s.children?.length) walkScopes(s.children, visit);
  }
}
