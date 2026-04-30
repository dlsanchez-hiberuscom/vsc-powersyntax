/**
 * Sprint 3 / Spec 132: corpus regression.
 *
 * Comprueba que un conjunto reducido de fragmentos PowerScript "típicos"
 * (window con eventos, userobject con función global, prototipos forward)
 * se analiza sin lanzar excepciones y produce facts no vacíos.
 */
import { ok, strictEqual } from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { suite, test } from 'mocha';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';

const fragments: { name: string; src: string; minFacts: number }[] = [
  {
    name: 'window con on create',
    src: [
      '$PBExportHeader$w_main.srw',
      'forward',
      'global type w_main from window',
      'end type',
      'end forward',
      'global type w_main from window',
      'end type',
      'global w_main w_main',
      'on w_main.create',
      'end on',
      'on w_main.destroy',
      'end on',
      'event open;',
      'string ls_test',
      'ls_test = "hola"',
      'end event'
    ].join('\n'),
    minFacts: 1
  },
  {
    name: 'userobject con función',
    src: [
      'forward',
      'global type n_cst_x from nonvisualobject',
      'end type',
      'end forward',
      'forward prototypes',
      'public function integer of_get(string as_x)',
      'end prototypes',
      'global type n_cst_x from nonvisualobject',
      'end type',
      'public function integer of_get(string as_x);',
      '  return 1',
      'end function'
    ].join('\n'),
    minFacts: 1
  },
  {
    name: 'archivo vacío seguro',
    src: '',
    minFacts: 0
  },
  {
    name: 'sólo comentarios',
    src: '// comentario único\n/* bloque */',
    minFacts: 0
  }
];

suite('Sprint 3 / corpus regression', () => {
  for (const f of fragments) {
    test(`fragment: ${f.name}`, () => {
      const doc = TextDocument.create('file:///regression.pbl', 'powerbuilder', 1, f.src);
      const r = analyzeDocument(doc);
      ok(Array.isArray(r.semanticFacts), 'semanticFacts es array');
      ok(r.semanticFacts.length >= f.minFacts,
        `${f.name}: esperaba >= ${f.minFacts} facts, obtuve ${r.semanticFacts.length}`);
    });
  }
});
