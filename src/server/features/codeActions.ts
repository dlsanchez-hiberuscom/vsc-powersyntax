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
import type { ApiInvocationRisk } from '../../shared/publicApi';
import type { SourceOrigin } from '../../shared/sourceOrigin';
import { buildObsoleteIndex } from '../knowledge/obsoleteCatalog';
import { PB_IDENTIFIER_SOURCE } from '../parsing/grammar';
import { hasBlockingDynamicStringReference } from './dynamicStringReferences';
import { buildInvocationRiskSummary } from './invocationRiskModel';
import { validateRenameTarget } from './renamePreflight';

const SUGGESTION_RE = /Sugerencia:\s*([^.]+?)\./i;
const SAFE_REPLACEMENT_RE = new RegExp(`^${PB_IDENTIFIER_SOURCE}$`, 'i');
const CODE_ACTION_CATALOG_VERSION = '2.0.0';
const OBSOLETE_FUNCTION_INDEX = buildObsoleteIndex();
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
  invocationRisk: ApiInvocationRisk;
  riskReasons: string[];
}

function isCanonicalSourceOrigin(sourceOrigin: SourceOrigin | undefined): boolean {
  return !sourceOrigin || CANONICAL_SOURCE_ORIGINS.has(sourceOrigin);
}

function matchesObsoleteFunctionDiagnostic(diagnostic: Diagnostic): boolean {
  const diagnosticCode = getDiagnosticCode(diagnostic)?.toUpperCase();
  if (diagnosticCode === DIAGNOSTIC_CODES.sd7ObsoleteFunction) {
    return true;
  }

  if (typeof diagnostic.source === 'string' && diagnostic.source.toUpperCase().endsWith(`:${DIAGNOSTIC_CODES.sd7ObsoleteFunction}`)) {
    return true;
  }

  return /obsolet/i.test(diagnostic.message ?? '') && /runfork|yield|halt/i.test(diagnostic.message ?? '');
}

function resolveObsoleteReplacement(original: string, diagnostic: Diagnostic): string | undefined {
  const catalogReplacement = OBSOLETE_FUNCTION_INDEX.get(original.toLowerCase())?.replacement?.trim();
  if (catalogReplacement && SAFE_REPLACEMENT_RE.test(catalogReplacement)) {
    return catalogReplacement;
  }

  const suggestionMatch = SUGGESTION_RE.exec(diagnostic.message ?? '');
  const suggestedReplacement = suggestionMatch?.[1]?.trim();
  if (suggestedReplacement && SAFE_REPLACEMENT_RE.test(suggestedReplacement)) {
    return suggestedReplacement;
  }

  return undefined;
}

function buildObsoleteReplacementAction(
  uri: string,
  content: string,
  diagnostic: Diagnostic,
  lines: string[],
  context: CodeActionRequestContext,
): CodeAction | null {
  const lineText = lines[diagnostic.range.start.line] ?? '';
  const original = lineText.slice(diagnostic.range.start.character, diagnostic.range.end.character);
  if (!original) return null;

  const replacement = resolveObsoleteReplacement(original, diagnostic);
  if (!replacement) return null;

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
    invocationRisk: 'safe',
    riskReasons: [],
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
    const risk = buildInvocationRiskSummary({ sourceOrigin: context.sourceOrigin });
    return {
      title,
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      disabled: {
        reason: 'El sourceOrigin del documento no es canónico para aplicar quick fixes.'
      },
      data: {
        ...data,
        blockedReason: 'source-origin-non-canonical',
        invocationRisk: risk.risk,
        riskReasons: risk.reasons,
      },
    };
  }

  const blockingDynamicHit = hasBlockingDynamicStringReference(original, [{ uri, content }]);
  if (blockingDynamicHit) {
    const risk = buildInvocationRiskSummary({ dynamicStringHits: [blockingDynamicHit] });
    return {
      title,
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      disabled: {
        reason: `Se detectó una referencia por string dinámica (${blockingDynamicHit.api ?? blockingDynamicHit.classification}) para este identificador.`
      },
      data: {
        ...data,
        blockedReason: 'dynamic-string-reference',
        invocationRisk: risk.risk,
        riskReasons: risk.reasons,
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

    for (const entry of CODE_ACTION_CATALOG) {
      const matchesEntry = diagnosticCode === entry.diagnosticCode
        || (entry.diagnosticCode === DIAGNOSTIC_CODES.sd7ObsoleteFunction && matchesObsoleteFunctionDiagnostic(d));
      if (!matchesEntry) continue;
      const action = entry.build(uri, content, d, lines, context);
      if (action) {
        out.push(action);
      }
    }
  }

  return out;
}
