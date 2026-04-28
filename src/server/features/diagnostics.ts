import {
  Diagnostic,
  DiagnosticSeverity,
  Position,
  Range,
  type Connection
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { DIAGNOSTIC_SOURCE } from '../../shared/types';
import { getDocumentAnalysis } from '../analysis/analysisCache';
import { BlockKind } from '../model/types';
import { findEnclosingSection } from '../parsing/sections';
import {
  isTypeDefinitionHeader,
  matchEventImplementationHeader,
  matchFunctionImplementationHeader,
  matchOnImplementationHeader
} from '../parsing/matchers';

export function publishDiagnostics(
  connection: Connection,
  document: TextDocument
): void {
  connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: validateStructure(document)
  });
}

export function validateStructure(document: TextDocument): Diagnostic[] {
  const analysis = getDocumentAnalysis(document);
  const { lines, sections } = analysis;
  const diagnostics: Diagnostic[] = [];
  const stack: Array<{ kind: BlockKind; line: number; text: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line || line.startsWith('//')) {
      continue;
    }

    const closeKind = matchClosingBlock(line);
    if (closeKind) {
      const top = stack[stack.length - 1];

      if (!top || top.kind !== closeKind) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: Range.create(
            Position.create(i, 0),
            Position.create(i, raw.length)
          ),
          message: `Cierre de bloque '${closeKind}' sin apertura compatible.`,
          source: DIAGNOSTIC_SOURCE
        });
      } else {
        stack.pop();
      }

      continue;
    }

    if (/^forward\s+prototypes\b/i.test(line)) {
      stack.push({ kind: 'prototypes', line: i, text: raw });
      continue;
    }

    if (/^prototypes\b/i.test(line)) {
      stack.push({ kind: 'prototypes', line: i, text: raw });
      continue;
    }

    if (/^(?:global\s+variables|type\s+variables|variables)\b/i.test(line)) {
      stack.push({ kind: 'variables', line: i, text: raw });
      continue;
    }

    if (/^forward\b/i.test(line) && !/^forward\s+prototypes\b/i.test(line)) {
      stack.push({ kind: 'forward', line: i, text: raw });
      continue;
    }

    const enclosingSection = findEnclosingSection(i, sections);

    if (enclosingSection?.kind === 'prototypes') {
      continue;
    }

    if (enclosingSection?.kind === 'variables') {
      continue;
    }

    if (isTypeDefinitionHeader(raw)) {
      stack.push({ kind: 'type', line: i, text: raw });
      continue;
    }

    if (!enclosingSection) {
      const fn = matchFunctionImplementationHeader(raw);
      if (fn) {
        stack.push({ kind: fn.kind, line: i, text: raw });
        continue;
      }

      const ev =
        matchEventImplementationHeader(raw) ?? matchOnImplementationHeader(raw);

      if (ev) {
        stack.push({ kind: 'event', line: i, text: raw });
        continue;
      }

      // --- Bloques ejecutables (portado de plugin_old pbLanguageGrammar.ts) ---
      // Solo IF multi-línea (termina en THEN al final de línea, no IF inline)
      if (/^if\b.*\bthen\s*$/i.test(line)) {
        stack.push({ kind: 'if', line: i, text: raw });
        continue;
      }

      if (/^for\b/i.test(line)) {
        stack.push({ kind: 'for', line: i, text: raw });
        continue;
      }

      if (/^do\b/i.test(line)) {
        stack.push({ kind: 'do', line: i, text: raw });
        continue;
      }

      if (/^choose\s+case\b/i.test(line)) {
        stack.push({ kind: 'choose-case', line: i, text: raw });
        continue;
      }

      if (/^try\b/i.test(line)) {
        stack.push({ kind: 'try', line: i, text: raw });
        continue;
      }
    }
  }

  for (const open of stack) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: Range.create(
        Position.create(open.line, 0),
        Position.create(open.line, open.text.length)
      ),
      message: `Bloque '${open.kind}' abierto sin cierre.`,
      source: DIAGNOSTIC_SOURCE
    });
  }

  return diagnostics;
}

function matchClosingBlock(line: string): BlockKind | null {
  // --- Bloques estructurales ---
  if (/^end\s+forward\b/i.test(line)) return 'forward';
  if (/^end\s+prototypes\b/i.test(line)) return 'prototypes';
  if (/^end\s+variables\b/i.test(line)) return 'variables';
  if (/^end\s+type\b/i.test(line)) return 'type';
  if (/^end\s+function\b/i.test(line)) return 'function';
  if (/^end\s+subroutine\b/i.test(line)) return 'subroutine';
  if (/^end\s+event\b/i.test(line) || /^end\s+on\b/i.test(line)) return 'event';
  // --- Bloques ejecutables (portado de plugin_old pbLanguageGrammar.ts) ---
  if (/^end\s+if\b/i.test(line)) return 'if';
  if (/^next\b/i.test(line)) return 'for';
  if (/^loop\b/i.test(line)) return 'do';
  if (/^end\s+choose\b/i.test(line)) return 'choose-case';
  if (/^end\s+try\b/i.test(line)) return 'try';
  return null;
}
