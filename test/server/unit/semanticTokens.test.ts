import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { setAnalysisBackends } from '../../../src/server/analysis/analysisCache';
import { provideSemanticTokens, getSemanticTokensLegend } from '../../../src/server/features/semanticTokens';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('Semantic Tokens', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;
  let docCache: DocumentCache;
  let systemCatalog: SystemCatalog;
  const legend = getSemanticTokensLegend();

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);
    docCache = new DocumentCache();
    systemCatalog = new SystemCatalog();
    setAnalysisBackends(docCache, kb);

    kb.upsertDocument('file:///sys.pbl', [
      {
        id: 'string',
        name: 'String',
        kind: EntityKind.Type,
        uri: '',
        line: 0,
        character: 0
      },
      {
        id: 'messagebox',
        name: 'MessageBox',
        kind: EntityKind.Function,
        uri: '',
        line: 0,
        character: 0
      }
    ]);
  });

  test('Should color local variables, parameters and distinguish from native types (B051)', () => {
    const code = `
forward
global type w_main from window
end type
end forward

global type w_main from window
integer width = 400
end type

on w_main.create
end on

on w_main.destroy
end on

type variables
  string is_name
end variables

forward prototypes
  public function string of_test (string as_param)
end prototypes

public function string of_test (string as_param);
  String ls_local
  ls_local = as_param + is_name
  MessageBox("Hi", ls_local)
  return ls_local
end function
`;
    const document = TextDocument.create('file:///w_main.srw', 'powerbuilder', 1, code);
    
    // Al pedir semantic tokens, el análisis se ejecuta porque el cache lo delega
    const tokens = provideSemanticTokens(document, kb, graph, systemCatalog);

    assert.ok(tokens, 'Should return semantic tokens');
    assert.ok(tokens.data.length > 0, 'Should have token data');

    // Mapearemos los tokens a algo legible para el test
    const decoded: { line: number, char: number, len: number, type: string, mods: number }[] = [];
    let currentLine = 0;
    let currentChar = 0;

    for (let i = 0; i < tokens.data.length; i += 5) {
      const deltaLine = tokens.data[i];
      const deltaChar = tokens.data[i + 1];
      const len = tokens.data[i + 2];
      const typeIdx = tokens.data[i + 3];
      const mods = tokens.data[i + 4];

      if (deltaLine > 0) {
        currentLine += deltaLine;
        currentChar = deltaChar;
      } else {
        currentChar += deltaChar;
      }

      decoded.push({
        line: currentLine,
        char: currentChar,
        len,
        type: legend.tokenTypes[typeIdx],
        mods
      });
    }

    const lines = code.split(/\r?\n/);

    // Comprobamos la declaración y uso de as_param
    const paramTokens = decoded.filter(t => t.line < lines.length && lines[t.line].substring(t.char, t.char + t.len).toLowerCase() === 'as_param');
    assert.ok(paramTokens.length >= 2, 'Should find at least declaration and usage of as_param');
    assert.strictEqual(paramTokens[0].type, 'parameter', 'as_param should be a parameter');
    assert.strictEqual(paramTokens[1].type, 'parameter', 'as_param usage should be a parameter');

    // Comprobamos ls_local
    const localTokens = decoded.filter(t => t.line < lines.length && lines[t.line].substring(t.char, t.char + t.len).toLowerCase() === 'ls_local');
    assert.ok(localTokens.length >= 2, 'Should find at least declaration and usage of ls_local');
    assert.strictEqual(localTokens[0].type, 'variable', 'ls_local should be a variable');

    // Comprobamos B051 (tipo String como type, no function)
    const stringTokens = decoded.filter(t => t.line < lines.length && lines[t.line].substring(t.char, t.char + t.len).toLowerCase() === 'string');
    for (const t of stringTokens) {
      assert.strictEqual(t.type, 'type', 'String native type should be colored as a type (B051 fix)');
    }

    // Comprobamos MessageBox
    const mbTokens = decoded.filter(t => t.line < lines.length && lines[t.line].substring(t.char, t.char + t.len).toLowerCase() === 'messagebox');
    assert.ok(mbTokens.length >= 1, 'MessageBox should be colored');
    assert.strictEqual(mbTokens[0].type, 'function', 'MessageBox is a function');
  });

  test('Should color enumerated values with bang suffix as enumMember', () => {
    const code = [
      'global type n_enum_tokens from nonvisualobject',
      'end type',
      '',
      'forward prototypes',
      'public subroutine of_test()',
      'end prototypes',
      '',
      'public subroutine of_test();',
      '  integer li_file',
      '  FileSeek(li_file, 0, FromBeginning!)',
      'end subroutine'
    ].join('\n');

    const document = TextDocument.create('file:///n_enum_tokens.sru', 'powerbuilder', 1, code);
    const tokens = provideSemanticTokens(document, kb, graph, systemCatalog);

    const decoded: { line: number, char: number, len: number, type: string, mods: number }[] = [];
    let currentLine = 0;
    let currentChar = 0;

    for (let i = 0; i < tokens.data.length; i += 5) {
      const deltaLine = tokens.data[i];
      const deltaChar = tokens.data[i + 1];
      const len = tokens.data[i + 2];
      const typeIdx = tokens.data[i + 3];
      const mods = tokens.data[i + 4];

      if (deltaLine > 0) {
        currentLine += deltaLine;
        currentChar = deltaChar;
      } else {
        currentChar += deltaChar;
      }

      decoded.push({
        line: currentLine,
        char: currentChar,
        len,
        type: legend.tokenTypes[typeIdx],
        mods,
      });
    }

    const lines = code.split(/\r?\n/);
    const enumTokens = decoded.filter((token) =>
      token.line < lines.length && lines[token.line].substring(token.char, token.char + token.len) === 'FromBeginning!'
    );

    assert.ok(enumTokens.length >= 1, 'FromBeginning! should be colored');
    assert.equal(enumTokens[0].type, 'enumMember');
  });
});
