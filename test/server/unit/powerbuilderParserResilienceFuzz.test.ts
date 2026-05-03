import * as assert from 'assert/strict';

import type { Diagnostic } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument, analyzeDocumentStructural } from '../../../src/server/analysis/documentAnalysis';
import { buildDiagnosticsForDocument } from '../../../src/server/features/diagnostics';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import type { Scope } from '../../../src/server/knowledge/types';
import { maskDocument } from '../../../src/server/parsing/codeMasking';
import { splitStatements, type LogicalStatement } from '../../../src/server/parsing/statementSplitter';

type FuzzSeed = {
  name: string;
  extension: 'sru' | 'srw';
  source: string;
};

type FuzzVariant = {
  label: string;
  source: string;
};

const seeds: FuzzSeed[] = [
  {
    name: 'nested-comments',
    extension: 'sru',
    source: joinLines([
      'forward',
      'global type n_nested_fuzz from nonvisualobject',
      'end type',
      'end forward',
      'global type n_nested_fuzz from nonvisualobject',
      'end type',
      'public subroutine of_parse();',
      '  /* outer /* inner ; */ still &',
      '  continued */ integer li_value',
      '  li_value = 1',
      'end subroutine'
    ])
  },
  {
    name: 'weird-strings',
    extension: 'sru',
    source: joinLines([
      'forward',
      'global type n_string_fuzz from nonvisualobject',
      'end type',
      'end forward',
      'global type n_string_fuzz from nonvisualobject',
      'end type',
      'public function string of_weird();',
      '  string ls_value',
      '  ls_value = "semi; //~"quoted~""',
      '  ls_value = ls_value + "~r~n"',
      '  return ls_value',
      'end function'
    ])
  },
  {
    name: 'line-continuations',
    extension: 'sru',
    source: joinLines([
      'forward',
      'global type n_cont_fuzz from nonvisualobject',
      'end type',
      'end forward',
      'global type n_cont_fuzz from nonvisualobject',
      'end type',
      'public function integer of_sum();',
      '  integer li_total',
      '  li_total = 1 &',
      '    + 2 &',
      '    + 3',
      '  return li_total',
      'end function'
    ])
  },
  {
    name: 'embedded-sql',
    extension: 'sru',
    source: joinLines([
      'forward',
      'global type n_sql_fuzz from nonvisualobject',
      'end type',
      'end forward',
      'global type n_sql_fuzz from nonvisualobject',
      'end type',
      'public subroutine of_sql();',
      '  string ls_name',
      '  long ll_id',
      '  SELECT emp_name',
      '    INTO :ls_name',
      '    FROM employee',
      '   WHERE emp_id = :ll_id;',
      'end subroutine'
    ])
  },
  {
    name: 'external-functions',
    extension: 'sru',
    source: joinLines([
      'forward prototypes',
      'public function long of_external (string as_input) library "kernel32.dll" alias for "Beep";',
      'public function integer of_incomplete(string as_value',
      'end prototypes',
      'global type n_external_fuzz from nonvisualobject',
      'end type',
      'public subroutine of_test();',
      '  long ll_code',
      '  ll_code = of_external("abc")',
      'end subroutine'
    ])
  },
  {
    name: 'events-and-on',
    extension: 'srw',
    source: joinLines([
      'global type w_event_fuzz from window',
      'end type',
      '',
      'type cb_ok from commandbutton within w_event_fuzz',
      'end type',
      '',
      'on w_event_fuzz.cb_ok.clicked',
      '  cb_ok.PostEvent("clicked")',
      'end on',
      'event open();',
      '  trigger event clicked()',
      'end event'
    ])
  },
  {
    name: 'try-catch-finally',
    extension: 'sru',
    source: joinLines([
      'forward',
      'global type n_try_fuzz from nonvisualobject',
      'end type',
      'end forward',
      'global type n_try_fuzz from nonvisualobject',
      'end type',
      'public function integer of_try();',
      '  try',
      '    return 1',
      '  catch (runtimeerror re)',
      '    return -1',
      '  finally',
      '    integer li_cleanup',
      '  end try',
      'end function'
    ])
  },
  {
    name: 'labels',
    extension: 'sru',
    source: joinLines([
      'forward',
      'global type n_label_fuzz from nonvisualobject',
      'end type',
      'end forward',
      'global type n_label_fuzz from nonvisualobject',
      'end type',
      'public subroutine of_labels();',
      'start_label:',
      '  integer li_value',
      '  li_value = 1',
      '  goto finish_label',
      'finish_label:',
      'end subroutine'
    ])
  },
  {
    name: 'eof-incomplete',
    extension: 'srw',
    source: joinLines([
      'forward',
      'global type w_cut_fuzz from window',
      'end type',
      'end forward',
      'global type w_cut_fuzz from window',
      'public function integer of_cut()',
      '  integer li_value',
      '  li_value = 1'
    ])
  },
  {
    name: 'incomplete-prototypes',
    extension: 'sru',
    source: joinLines([
      'forward prototypes',
      'public function integer of_only_proto(string as_value',
      'public subroutine of_other(',
      'end prototypes',
      'global type n_proto_fuzz from nonvisualobject',
      'end type'
    ])
  }
];

suite('unit/powerbuilderParserResilienceFuzz (B272)', () => {
  for (const [seedIndex, seed] of seeds.entries()) {
    test(`resiste ${seed.name} sin crash ni corrupcion estructural`, () => {
      const variants = buildVariants(seed.source);
      for (const [variantIndex, variant] of variants.entries()) {
        exerciseVariant(seed, variant, seedIndex, variantIndex);
      }
    });
  }
});

function exerciseVariant(seed: FuzzSeed, variant: FuzzVariant, seedIndex: number, variantIndex: number): void {
  const label = `${seed.name}/${variant.label}`;
  const uri = `file:///fuzz/${seedIndex}-${variantIndex}.${seed.extension}`;
  const lineCount = variant.source.split(/\r?\n/).length;

  const defaultMasked = runStep(label, 'maskDocument(default)', () => maskDocument(variant.source));
  assert.equal(defaultMasked.length, variant.source.length, `${label}: maskDocument(default) cambio la longitud.`);

  const nestedMasked = runStep(label, 'maskDocument(nested)', () => maskDocument(variant.source, { nested: true }));
  assert.equal(nestedMasked.length, variant.source.length, `${label}: maskDocument(nested) cambio la longitud.`);

  const statements = runStep(label, 'splitStatements', () => splitStatements(variant.source));
  assertStatementsSane(statements, lineCount, label);

  const document = TextDocument.create(uri, 'powerbuilder', 1, variant.source);
  const analysis = runStep(label, 'analyzeDocument', () => analyzeDocument(document));
  const structural = runStep(label, 'analyzeDocumentStructural', () => analyzeDocumentStructural(document));

  assert.equal(analysis.lines.length, lineCount, `${label}: lines desalineadas.`);
  assert.equal(analysis.strippedLines.length, lineCount, `${label}: strippedLines desalineadas.`);
  assert.equal(analysis.masks.length, lineCount, `${label}: masks desalineadas.`);
  assert.equal(structural.snapshot.uri, document.uri, `${label}: structural snapshot sin uri estable.`);
  assert.equal(structural.snapshot.logicalStatements.length, 0, `${label}: structural snapshot no debe publicar logicalStatements.`);
  assert.deepEqual(summarizeStatements(analysis.logicalStatements), summarizeStatements(statements), `${label}: logicalStatements desincronizados.`);

  assertScopeTreeSane(analysis.scopes, lineCount, label);

  const kb = new KnowledgeBase();
  kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
  const graph = new InheritanceGraph(kb);
  const catalog = new SystemCatalog();
  const diagnostics = runStep(label, 'buildDiagnosticsForDocument', () =>
    buildDiagnosticsForDocument(document, kb, catalog, graph)
  );
  assertDiagnosticsSane(diagnostics, lineCount, label);
}

function buildVariants(source: string): FuzzVariant[] {
  const variants: FuzzVariant[] = [{ label: 'seed', source }];
  const lfOnly = source.replace(/\r\n/g, '\n');
  if (lfOnly !== source) {
    variants.push({ label: 'lf-only', source: lfOnly });
  }

  const prefixTruncated = source.slice(0, Math.max(1, Math.floor(source.length * 2 / 3)));
  if (prefixTruncated !== source) {
    variants.push({ label: 'prefix-truncated', source: prefixTruncated });
  }

  const holeStart = Math.max(1, Math.floor(source.length / 3));
  const holeEnd = Math.max(holeStart + 1, Math.floor(source.length / 2));
  const middleHole = source.slice(0, holeStart) + source.slice(holeEnd);
  if (middleHole !== source && middleHole.length > 0) {
    variants.push({ label: 'middle-hole', source: middleHole });
  }

  variants.push({
    label: 'dangling-comment-tail',
    source: `${source}\r\n/* fuzz tail ; &`
  });

  return variants;
}

function assertStatementsSane(statements: readonly LogicalStatement[], lineCount: number, label: string): void {
  for (const [index, statement] of statements.entries()) {
    assert.ok(statement.text.trim().length > 0, `${label}: statement ${index} quedo vacio.`);
    assert.ok(statement.startLine >= 0, `${label}: statement ${index} startLine negativo.`);
    assert.ok(statement.endLine >= statement.startLine, `${label}: statement ${index} endLine invalido.`);
    assert.ok(statement.startLine < lineCount, `${label}: statement ${index} startLine fuera de rango.`);
    assert.ok(statement.endLine < lineCount, `${label}: statement ${index} endLine fuera de rango.`);
    assert.ok(statement.rawLines.length > 0, `${label}: statement ${index} sin rawLines.`);
  }
}

function assertScopeTreeSane(scopes: readonly Scope[], lineCount: number, label: string, parent?: Scope): void {
  for (const [index, scope] of scopes.entries()) {
    assert.ok(scope.startLine >= 0, `${label}: scope ${scope.id || index} startLine negativo.`);
    assert.ok(scope.endLine >= scope.startLine, `${label}: scope ${scope.id || index} endLine invalido.`);
    assert.ok(scope.startLine < lineCount, `${label}: scope ${scope.id || index} startLine fuera de rango.`);
    assert.ok(scope.endLine < lineCount, `${label}: scope ${scope.id || index} endLine fuera de rango.`);

    if (parent) {
      assert.ok(scope.startLine >= parent.startLine, `${label}: scope ${scope.id || index} empieza fuera del padre.`);
      assert.ok(scope.endLine <= parent.endLine, `${label}: scope ${scope.id || index} termina fuera del padre.`);
    }

    assertScopeTreeSane(scope.children, lineCount, label, scope);
  }
}

function assertDiagnosticsSane(diagnostics: readonly Diagnostic[], lineCount: number, label: string): void {
  const maxReasonableDiagnostics = Math.max(8, lineCount * 6);
  assert.ok(
    diagnostics.length <= maxReasonableDiagnostics,
    `${label}: demasiados diagnosticos (${diagnostics.length}) para ${lineCount} lineas.`
  );

  for (const [index, diagnostic] of diagnostics.entries()) {
    assert.ok(diagnostic.range.start.line >= 0, `${label}: diagnostic ${index} start.line negativo.`);
    assert.ok(diagnostic.range.end.line >= diagnostic.range.start.line, `${label}: diagnostic ${index} end.line invalido.`);
    assert.ok(diagnostic.range.start.line < lineCount, `${label}: diagnostic ${index} start.line fuera de rango.`);
    assert.ok(diagnostic.range.end.line < lineCount, `${label}: diagnostic ${index} end.line fuera de rango.`);
    assert.ok(diagnostic.range.start.character >= 0, `${label}: diagnostic ${index} start.character negativo.`);
    assert.ok(diagnostic.range.end.character >= 0, `${label}: diagnostic ${index} end.character negativo.`);
  }
}

function summarizeStatements(statements: readonly LogicalStatement[]): Array<Pick<LogicalStatement, 'text' | 'startLine' | 'endLine'>> {
  return statements.map((statement) => ({
    text: statement.text,
    startLine: statement.startLine,
    endLine: statement.endLine
  }));
}

function joinLines(lines: string[]): string {
  return lines.join('\r\n');
}

function runStep<T>(label: string, step: string, fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    assert.fail(`${label}: ${step} lanzo ${formatError(error)}`);
  }
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}