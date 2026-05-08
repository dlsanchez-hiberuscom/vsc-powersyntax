import * as assert from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { setAnalysisBackends } from '../../../src/server/analysis/analysisCache';
import {
  getSemanticTokensLegend,
  POWERBUILDER_SEMANTIC_TOKEN_CONTRACT,
  provideSemanticTokens,
} from '../../../src/server/features/semanticTokens';
import { SemanticTokensResultState } from '../../../src/server/features/semanticTokensResultState';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { EntityKind } from '../../../src/server/knowledge/types';

interface DecodedToken {
  line: number;
  char: number;
  len: number;
  type: string;
  mods: number;
  text: string;
}

function decodeTokens(code: string, data: readonly number[], legend: ReturnType<typeof getSemanticTokensLegend>): DecodedToken[] {
  const decoded: DecodedToken[] = [];
  const lines = code.split(/\r?\n/);
  let currentLine = 0;
  let currentChar = 0;

  for (let i = 0; i < data.length; i += 5) {
    const deltaLine = data[i];
    const deltaChar = data[i + 1];
    const len = data[i + 2];
    const typeIdx = data[i + 3];
    const mods = data[i + 4];

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
      text: lines[currentLine]?.substring(currentChar, currentChar + len) ?? '',
    });
  }

  return decoded;
}

function modifierMask(legend: ReturnType<typeof getSemanticTokensLegend>, modifier: string): number {
  const modifierIndex = legend.tokenModifiers.indexOf(modifier);
  assert.ok(modifierIndex >= 0, `Modifier ${modifier} should exist in the legend.`);
  return 1 << modifierIndex;
}

function findTokensByText(tokens: readonly DecodedToken[], text: string): DecodedToken[] {
  return tokens.filter((token) => token.text.toLowerCase() === text.toLowerCase());
}

suite('Semantic Tokens', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;
  let docCache: DocumentCache;
  let systemCatalog: SystemCatalog;
  let resultState: SemanticTokensResultState;
  const legend = getSemanticTokensLegend();

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);
    docCache = new DocumentCache();
    systemCatalog = new SystemCatalog();
    resultState = new SemanticTokensResultState();
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

  test('Should publish standard token types and keep PowerBuilder-specific modifiers explicit', () => {
    assert.deepEqual(POWERBUILDER_SEMANTIC_TOKEN_CONTRACT.customTokenTypes, []);
    assert.deepEqual(POWERBUILDER_SEMANTIC_TOKEN_CONTRACT.customTokenModifiers, ['defaultLibrary', 'local', 'instance', 'global']);
    assert.equal(POWERBUILDER_SEMANTIC_TOKEN_CONTRACT.sharedVariableModifier, 'global');
    assert.equal(POWERBUILDER_SEMANTIC_TOKEN_CONTRACT.dynamicDataWindowBindingPolicy, 'skip');
  });

  test('Should map classes, native types, parameters and variable scopes to explicit token ranges and modifiers', () => {
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
  shared string is_shared
  global string gs_name
  string is_name
end variables

forward prototypes
  public function string of_test (string as_param)
end prototypes

public function string of_test (string as_param);
  DataStore ids_orders
  w_main lw_self
  String ls_local
  ls_local = as_param + is_name + is_shared + gs_name
  MessageBox("Hi", ls_local)
  return ls_local
end function
`;
    const document = TextDocument.create('file:///w_main.srw', 'powerbuilder', 1, code);
    
    // Al pedir semantic tokens, el análisis se ejecuta porque el cache lo delega
    const tokens = provideSemanticTokens(document, kb, graph, systemCatalog);

    assert.ok(tokens, 'Should return semantic tokens');
    assert.ok((tokens as any).data.length > 0, 'Should have token data');
    const decoded = decodeTokens(code, (tokens as any).data, legend);
    const declarationMask = modifierMask(legend, 'declaration');
    const defaultLibraryMask = modifierMask(legend, 'defaultLibrary');
    const localMask = modifierMask(legend, 'local');
    const instanceMask = modifierMask(legend, 'instance');
    const globalMask = modifierMask(legend, 'global');

    const objectDeclaration = findTokensByText(decoded, 'w_main').find((token) => (token.mods & declarationMask) !== 0);
    assert.ok(objectDeclaration, 'Should find the type declaration token for w_main.');
    assert.equal(objectDeclaration?.type, 'class');

    const systemBaseType = findTokensByText(decoded, 'window')[0];
    assert.ok(systemBaseType, 'Should find the base system type token for window.');
    assert.equal(systemBaseType.type, 'class');
    assert.ok((systemBaseType.mods & defaultLibraryMask) !== 0, 'window should be marked as defaultLibrary.');

    const dataStoreType = findTokensByText(decoded, 'DataStore')[0];
    assert.ok(dataStoreType, 'Should find the DataStore type token.');
    assert.equal(dataStoreType.type, 'class');
    assert.ok((dataStoreType.mods & defaultLibraryMask) !== 0, 'DataStore should be marked as defaultLibrary.');

    const stringTokens = findTokensByText(decoded, 'String');
    assert.ok(stringTokens.length >= 2, 'Should find String in the signature and local declaration.');
    assert.ok(stringTokens.every((token) => token.type === 'type'), 'Native String should stay mapped to the type token.');
    assert.ok(stringTokens.every((token) => (token.mods & defaultLibraryMask) !== 0), 'Native String should be marked as defaultLibrary.');

    const paramTokens = findTokensByText(decoded, 'as_param');
    assert.ok(paramTokens.length >= 2, 'Should find at least declaration and usage of as_param');
    assert.strictEqual(paramTokens[0].type, 'parameter', 'as_param should be a parameter');
    assert.strictEqual(paramTokens[1].type, 'parameter', 'as_param usage should be a parameter');
    assert.ok((paramTokens[0].mods & declarationMask) !== 0, 'Parameter declaration should keep declaration modifier.');
    assert.ok((paramTokens[0].mods & localMask) !== 0, 'Parameter declaration should keep local modifier.');

    const localTokens = findTokensByText(decoded, 'ls_local');
    assert.ok(localTokens.length >= 2, 'Should find at least declaration and usage of ls_local');
    assert.strictEqual(localTokens[0].type, 'variable', 'ls_local should be a variable');
    assert.ok((localTokens[0].mods & declarationMask) !== 0, 'Local declaration should keep declaration modifier.');
    assert.ok((localTokens[0].mods & localMask) !== 0, 'Local declaration should keep local modifier.');
    assert.ok((localTokens[1].mods & localMask) !== 0, 'Local usage should keep local modifier.');

    const instanceTokens = findTokensByText(decoded, 'is_name');
    assert.ok(instanceTokens.length >= 2, 'Should find the declaration and usage of is_name.');
    assert.equal(instanceTokens[0].type, 'variable');
    assert.ok((instanceTokens[0].mods & declarationMask) !== 0, 'Instance declaration should keep declaration modifier.');
    assert.ok((instanceTokens[0].mods & instanceMask) !== 0, 'Instance declaration should keep instance modifier.');
    assert.equal(instanceTokens[1].type, 'property', 'Instance usage should be projected as property.');
    assert.ok((instanceTokens[1].mods & instanceMask) !== 0, 'Instance usage should keep instance modifier.');

    const sharedTokens = findTokensByText(decoded, 'is_shared');
    assert.ok(sharedTokens.length >= 2, 'Should find the declaration and usage of is_shared.');
    assert.ok((sharedTokens[0].mods & globalMask) !== 0, 'Shared declaration should use the public global modifier contract.');
    assert.ok((sharedTokens[1].mods & globalMask) !== 0, 'Shared usage should use the public global modifier contract.');

    const globalTokens = findTokensByText(decoded, 'gs_name');
    assert.ok(globalTokens.length >= 2, 'Should find the declaration and usage of gs_name.');
    assert.ok((globalTokens[0].mods & globalMask) !== 0, 'Global declaration should keep global modifier.');
    assert.ok((globalTokens[1].mods & globalMask) !== 0, 'Global usage should keep global modifier.');

    const mbTokens = findTokensByText(decoded, 'MessageBox');
    assert.ok(mbTokens.length >= 1, 'MessageBox should be colored');
    assert.strictEqual(mbTokens[0].type, 'function', 'MessageBox is a function');
    assert.ok((mbTokens[0].mods & defaultLibraryMask) !== 0, 'MessageBox should be marked as defaultLibrary.');
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
    const decoded = decodeTokens(code, (tokens as any).data, legend);
    const defaultLibraryMask = modifierMask(legend, 'defaultLibrary');
    const enumTokens = decoded.filter((token) => token.text === 'FromBeginning!');

    assert.ok(enumTokens.length >= 1, 'FromBeginning! should be colored');
    assert.equal(enumTokens[0].type, 'enumMember');
    assert.ok((enumTokens[0].mods & defaultLibraryMask) !== 0, 'Enum values should be marked as defaultLibrary.');
  });

  test('Should fallback to full semantic tokens when previousResultId is unknown', () => {
    const code = 'global type n_tokens from nonvisualobject\nend type';
    const document = TextDocument.create('file:///n_tokens.sru', 'powerbuilder', 1, code);
    const result = provideSemanticTokens(document, kb, graph, systemCatalog, 'missing-result-id', resultState);

    assert.ok('data' in result, 'Unknown previousResultId should return full tokens.');
    assert.ok('resultId' in result && typeof result.resultId === 'string' && result.resultId.length > 0);
  });

  test('Should return empty delta edits when previousResultId is still compatible', () => {
    const code = 'global type n_tokens from nonvisualobject\nend type';
    const document = TextDocument.create('file:///n_tokens.sru', 'powerbuilder', 1, code);
    const full = provideSemanticTokens(document, kb, graph, systemCatalog, undefined, resultState);

    assert.ok('resultId' in full && typeof full.resultId === 'string');

    const delta = provideSemanticTokens(document, kb, graph, systemCatalog, full.resultId, resultState);
    assert.ok('edits' in delta, 'Compatible previousResultId should reuse state and return delta edits.');
    assert.deepEqual(delta.edits, []);
  });

  test('Should color catalog-driven keywords, globals, pronouns and functions without resolver pesado', () => {
    const code = [
      'global type n_catalog_tokens from nonvisualobject',
      'end type',
      '',
      'forward prototypes',
      'public function integer of_test ()',
      'end prototypes',
      '',
      'public function integer of_test ();',
      '  if IsValid(SQLCA) then',
      '    MessageBox("Hi", This)',
      '  end if',
      '  return 1',
      'end function',
    ].join('\n');

    const document = TextDocument.create('file:///n_catalog_tokens.sru', 'powerbuilder', 1, code);
    const tokens = provideSemanticTokens(document, kb, graph, systemCatalog);
    const decoded = decodeTokens(code, (tokens as any).data, legend);
    const defaultLibraryMask = modifierMask(legend, 'defaultLibrary');
    const globalMask = modifierMask(legend, 'global');

    const ifTokens = findTokensByText(decoded, 'if');
    assert.ok(ifTokens.length >= 1, 'if debe colorearse como keyword catalog-driven.');
    assert.equal(ifTokens[0].type, 'keyword');

    const isValidTokens = findTokensByText(decoded, 'IsValid');
    assert.ok(isValidTokens.length >= 1, 'IsValid debe colorearse como función del sistema.');
    assert.equal(isValidTokens[0].type, 'function');
    assert.ok((isValidTokens[0].mods & defaultLibraryMask) !== 0, 'IsValid debe marcarse como defaultLibrary.');

    const sqlcaTokens = findTokensByText(decoded, 'SQLCA');
    assert.ok(sqlcaTokens.length >= 1, 'SQLCA debe colorearse como system global.');
    assert.equal(sqlcaTokens[0].type, 'variable');
    assert.ok((sqlcaTokens[0].mods & defaultLibraryMask) !== 0, 'SQLCA debe marcarse como defaultLibrary.');
    assert.ok((sqlcaTokens[0].mods & globalMask) !== 0, 'SQLCA debe marcarse como global.');

    const thisTokens = findTokensByText(decoded, 'This');
    assert.ok(thisTokens.length >= 1, 'This debe colorearse como pronoun del sistema.');
    assert.equal(thisTokens[0].type, 'variable');
    assert.ok((thisTokens[0].mods & defaultLibraryMask) !== 0, 'This debe marcarse como defaultLibrary.');
    assert.ok((thisTokens[0].mods & globalMask) !== 0, 'This debe marcarse como global.');
  });
});
