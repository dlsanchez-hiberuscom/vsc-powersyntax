/**
 * Code actions (Spec 049 / B036).
 *
 * Quick-fix inicial: SD7 (función obsoleta) ofrece sustituir el
 * identificador por la sugerencia indicada en el diagnostic.
 *
 * @module features/codeActions
 */

import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  TextEdit,
  WorkspaceEdit
} from 'vscode-languageserver/node';

import { DIAGNOSTIC_CODES, getDiagnosticCode } from '../../shared/diagnosticCodes';
import type { SourceOrigin } from '../../shared/sourceOrigin';
import { PB_IDENTIFIER_SOURCE } from '../parsing/grammar';
import { hasBlockingDynamicStringReference } from './dynamicStringReferences';
import { validateRenameTarget } from './renamePreflight';

const SUGGESTION_RE = /Sugerencia:\s*([^.]+?)\./i;
const SAFE_REPLACEMENT_RE = new RegExp(`^${PB_IDENTIFIER_SOURCE}$`, 'i');
const CODE_ACTION_CATALOG_VERSION = '2.0.0';
const CANONICAL_SOURCE_ORIGINS = new Set<SourceOrigin>([
  'solution-source',
  'workspace-ws_objects',
  'pbl-folder-source'
]);

export interface CodeActionRequestContext {
  sourceOrigin?: SourceOrigin;
}

interface VersionedCodeActionData {
  actionId: 'obsolete-function-replacement';
  catalogVersion: typeof CODE_ACTION_CATALOG_VERSION;
  evidence: 'diagnostic:SD7';
  confidence: 'high';
  requiredConfidence: 'high';
  safeEdit: 'single-range-replacement';
  preview: {
    kind: 'single-range-replacement';
    original: string;
    replacement: string;
  };
  blockedReason?: string;
}

function isCanonicalSourceOrigin(sourceOrigin: SourceOrigin | undefined): boolean {
  return !sourceOrigin || CANONICAL_SOURCE_ORIGINS.has(sourceOrigin);
}

function buildObsoleteReplacementAction(
  uri: string,
  content: string,
  diagnostic: Diagnostic,
  lines: string[],
  context: CodeActionRequestContext,
): CodeAction | null {
  const match = SUGGESTION_RE.exec(diagnostic.message ?? '');
  if (!match) return null;

  const replacement = match[1].trim();
  if (!replacement || !SAFE_REPLACEMENT_RE.test(replacement)) return null;

  const lineText = lines[diagnostic.range.start.line] ?? '';
  const original = lineText.slice(diagnostic.range.start.character, diagnostic.range.end.character);
  if (!original) return null;

  const data: VersionedCodeActionData = {
    actionId: 'obsolete-function-replacement',
    catalogVersion: CODE_ACTION_CATALOG_VERSION,
    evidence: 'diagnostic:SD7',
    confidence: 'high',
    requiredConfidence: 'high',
    safeEdit: 'single-range-replacement',
    preview: {
      kind: 'single-range-replacement',
      original,
      replacement,
    },
  };

  const title = `Reemplazar '${original}' por '${replacement}'`;
  const preflight = validateRenameTarget(replacement);
  if (!preflight.ok) {
    return {
      title,
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      disabled: {
        reason: preflight.reason ?? 'El preflight rechazó el reemplazo sugerido.'
      },
      data: {
        ...data,
        blockedReason: 'rename-preflight-failed'
      },
    };
  }

  if (!isCanonicalSourceOrigin(context.sourceOrigin)) {
    return {
      title,
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      disabled: {
        reason: 'El sourceOrigin del documento no es canónico para aplicar quick fixes.'
      },
      data: {
        ...data,
        blockedReason: 'source-origin-non-canonical'
      },
    };
  }

  const blockingDynamicHit = hasBlockingDynamicStringReference(original, [{ uri, content }]);
  if (blockingDynamicHit) {
    return {
      title,
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      disabled: {
        reason: `Se detectó una referencia por string dinámica (${blockingDynamicHit.api ?? blockingDynamicHit.classification}) para este identificador.`
      },
      data: {
        ...data,
        blockedReason: 'dynamic-string-reference'
      },
    };
  }

  const edit: TextEdit = { range: diagnostic.range, newText: replacement };
  const workspaceEdit: WorkspaceEdit = { changes: { [uri]: [edit] } };
  return {
    title,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diagnostic],
    edit: workspaceEdit,
    isPreferred: true,
    data,
  };
}

const CODE_ACTION_CATALOG = [
  {
    id: 'obsolete-function-replacement',
    diagnosticCode: DIAGNOSTIC_CODES.sd7ObsoleteFunction,
    build: buildObsoleteReplacementAction,
  },
] as const;

export function provideCodeActions(
  uri: string,
  content: string,
  diagnostics: readonly Diagnostic[],
  context: CodeActionRequestContext = {}
): CodeAction[] {
  const out: CodeAction[] = [];
  const lines = content.split(/\r?\n/);

  for (const d of diagnostics) {
    const diagnosticCode = getDiagnosticCode(d)?.toUpperCase();
    if (!diagnosticCode) continue;

    for (const entry of CODE_ACTION_CATALOG) {
      if (diagnosticCode !== entry.diagnosticCode) continue;
      const action = entry.build(uri, content, d, lines, context);
      if (action) {
        out.push(action);
      }
    }
  }

  return out;
}
