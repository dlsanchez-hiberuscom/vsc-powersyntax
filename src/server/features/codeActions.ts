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

const SUGGESTION_RE = /Sugerencia:\s*([^.]+?)\./i;

export function provideCodeActions(
  uri: string,
  content: string,
  diagnostics: readonly Diagnostic[]
): CodeAction[] {
  const out: CodeAction[] = [];
  const lines = content.split(/\r?\n/);

  for (const d of diagnostics) {
    if (d.source !== 'PowerScript:SD7') continue;
    const m = SUGGESTION_RE.exec(d.message ?? '');
    if (!m) continue;
    const replacement = m[1].trim();
    if (!replacement) continue;
    const lineText = lines[d.range.start.line] ?? '';
    const original = lineText.slice(d.range.start.character, d.range.end.character);
    if (!original) continue;

    const edit: TextEdit = { range: d.range, newText: replacement };
    const workspaceEdit: WorkspaceEdit = { changes: { [uri]: [edit] } };
    out.push({
      title: `Reemplazar '${original}' por '${replacement}'`,
      kind: CodeActionKind.QuickFix,
      diagnostics: [d],
      edit: workspaceEdit,
      isPreferred: true
    });
  }

  return out;
}
