import { Position, SemanticTokens, SemanticTokensBuilder, SemanticTokensDelta, SemanticTokensLegend } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getDocumentAnalysis } from '../analysis/analysisCache';
import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import type { PbSystemSymbolEntry } from '../knowledge/system/types';
import { EntityKind, Fact, Scope, ScopeKind } from '../knowledge/types';
import { PB_IDENTIFIER_SOURCE } from '../parsing/grammar';
import { execMemoized } from './regexMemoizer';
import { createSemanticQueryFacade } from './semanticQueryFacade';
import {
  buildSemanticTokensViewModel,
  formatSemanticTokensViewModel,
} from '../presentation/semanticTokenPresentation';
import type { SemanticTokenViewModelEntry } from '../presentation/viewModels';

// ---------------------------------------------------------------------------
// Legends
// ---------------------------------------------------------------------------

export const POWERBUILDER_SEMANTIC_TOKEN_TYPES = [
  'type',
  'class',
  'function',
  'method',
  'property',
  'variable',
  'parameter',
  'event',
  'enumMember',
  'keyword'
] as const;

export const POWERBUILDER_SEMANTIC_TOKEN_MODIFIERS = [
  'declaration',
  'readonly',
  'defaultLibrary',
  'local',
  'instance',
  'global'
] as const;

export const POWERBUILDER_SEMANTIC_TOKEN_CONTRACT = {
  customTokenTypes: [] as const,
  customTokenModifiers: ['defaultLibrary', 'local', 'instance', 'global'] as const,
  sharedVariableModifier: 'global' as const,
  dynamicDataWindowBindingPolicy: 'skip' as const,
} as const;

export function getSemanticTokensLegend(): SemanticTokensLegend {
  return {
    tokenTypes: [...POWERBUILDER_SEMANTIC_TOKEN_TYPES],
    tokenModifiers: [...POWERBUILDER_SEMANTIC_TOKEN_MODIFIERS]
  };
}

const TYPE_INDEX = {
  type: 0,
  class: 1,
  function: 2,
  method: 3,
  property: 4,
  variable: 5,
  parameter: 6,
  event: 7,
  enumMember: 8,
  keyword: 9
};

const MODIFIER_MASK = {
  declaration: 1 << 0,
  readonly: 1 << 1,
  defaultLibrary: 1 << 2,
  local: 1 << 3,
  instance: 1 << 4,
  global: 1 << 5
};

const IDENTIFIER_PATTERN = new RegExp(PB_IDENTIFIER_SOURCE, 'gi');
const ENUMERATED_VALUE_PATTERN = new RegExp(`${PB_IDENTIFIER_SOURCE}!`, 'gi');

interface TokenEntry {
  line: number;
  char: number;
  length: number;
  type: number;
  mods: number;
  source?: SemanticTokenViewModelEntry['source'];
  confidence?: 'high' | 'medium' | 'low' | 'unknown';
  origin?: 'structural' | 'semantic';
}

export function provideSemanticTokens(
  document: TextDocument,
  kb: KnowledgeBase,
  inheritanceGraph: InheritanceGraph,
  systemCatalog: SystemCatalog,
  builder?: SemanticTokensBuilder,
  previousResultId?: string
): SemanticTokens | SemanticTokensDelta {
  const snapshot = getDocumentAnalysis(document).snapshot;

  const tokens: TokenEntry[] = [];

  // Coloreamos las declaraciones extraídas
  emitDeclarations(snapshot, tokens);

  // Coloreamos los usos
  emitUsages(document, snapshot, kb, inheritanceGraph, systemCatalog, tokens);

  return formatSemanticTokensViewModel(buildSemanticTokensViewModel(tokens.map(toSemanticTokenViewModelEntry)), builder, previousResultId);
}

function toSemanticTokenViewModelEntry(token: TokenEntry): SemanticTokenViewModelEntry {
  return {
    line: token.line,
    char: token.char,
    length: token.length,
    tokenType: token.type,
    tokenModifiers: token.mods,
    source: token.source ?? 'usage',
    confidence: (token.confidence === 'unknown' ? 'low' : token.confidence) ?? (token.origin === 'structural' ? 'high' : 'low'),
  };
}

function getVariableScopeModifier(scope: 'Local' | 'Instancia' | 'Global' | 'Compartida' | 'Argumento' | undefined): number {
  if (scope === 'Local' || scope === 'Argumento') {
    return MODIFIER_MASK.local;
  }

  if (scope === 'Instancia') {
    return MODIFIER_MASK.instance;
  }

  if (scope === 'Global' || scope === 'Compartida') {
    return MODIFIER_MASK.global;
  }

  return 0;
}

function getDeclarationTokenType(kind: EntityKind): number | undefined {
  switch (kind) {
    case EntityKind.Variable:
      return TYPE_INDEX.variable;
    case EntityKind.Function:
    case EntityKind.Subroutine:
      return TYPE_INDEX.function;
    case EntityKind.Event:
      return TYPE_INDEX.event;
    case EntityKind.Type:
      return TYPE_INDEX.class;
    default:
      return undefined;
  }
}

function getCatalogTypeToken(entry: PbSystemSymbolEntry): Pick<TokenEntry, 'type' | 'mods'> {
  return {
    type: entry.kind === 'system-type' ? TYPE_INDEX.class : TYPE_INDEX.type,
    mods: MODIFIER_MASK.defaultLibrary,
  };
}

function emitDeclarations(snapshot: SemanticDocumentSnapshot, tokens: TokenEntry[]): void {
  for (const fact of snapshot.symbols) {
    const tokenType = getDeclarationTokenType(fact.kind);
    if (tokenType === undefined) {
      continue;
    }

    let modifiers = MODIFIER_MASK.declaration;

    if (fact.kind === EntityKind.Variable) {
      modifiers |= getVariableScopeModifier(fact.scope);
    }

    if (fact.access && fact.access.includes('readonly')) {
      modifiers |= MODIFIER_MASK.readonly;
    }

    tokens.push({
      line: fact.line,
      char: fact.character,
      length: fact.name.length,
      type: tokenType,
      mods: modifiers,
      origin: 'structural',
      confidence: 'high'
    });
  }

  // Iterar por scope arguments/locals para colorear sus declaraciones
  const emitScopeSymbols = (scope: Scope): void => {
    if (scope.kind === ScopeKind.Function || scope.kind === ScopeKind.Event) {
      for (const symbol of scope.symbols) {
        let tokenType = TYPE_INDEX.variable;
        let modifiers = MODIFIER_MASK.declaration;

        if (symbol.scope === 'Argumento') {
          tokenType = TYPE_INDEX.parameter;
          modifiers |= getVariableScopeModifier(symbol.scope);
        } else if (symbol.scope === 'Local') {
          tokenType = TYPE_INDEX.variable;
          modifiers |= getVariableScopeModifier(symbol.scope);
        }

        tokens.push({
          line: symbol.line,
          char: symbol.character,
          length: symbol.name.length,
          type: tokenType,
          mods: modifiers,
          origin: 'structural',
          confidence: 'high'
        });
      }
    }
    for (const child of scope.children) {
      emitScopeSymbols(child);
    }
  };

  for (const scope of snapshot.scopes) {
    emitScopeSymbols(scope);
  }
}

function emitUsages(
  document: TextDocument,
  snapshot: SemanticDocumentSnapshot,
  kb: KnowledgeBase,
  inheritanceGraph: InheritanceGraph,
  systemCatalog: SystemCatalog,
  tokens: TokenEntry[]
): void {
  // Aquí escanearemos strippedLines para encontrar usos
  const lines = snapshot.maskedText.lines;
  // 1. Resolver unificado
  const facade = createSemanticQueryFacade({ kb, graph: inheritanceGraph, systemCatalog });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;

    const enumMatches = execMemoized(snapshot, ENUMERATED_VALUE_PATTERN, line);
    for (const enumMatch of enumMatches) {
      const enumValue = enumMatch[0];
      if (!systemCatalog.resolveEnumeratedValue(enumValue)) {
        continue;
      }

      tokens.push({
        line: i,
        char: enumMatch.index,
        length: enumValue.length,
        type: TYPE_INDEX.enumMember,
        mods: MODIFIER_MASK.defaultLibrary,
      });
    }

    const matches = execMemoized(snapshot, IDENTIFIER_PATTERN, line);
    for (const match of matches) {
      const identifier = match[0];
      const startChar = match.index;
      if (line[startChar + identifier.length] === '!') {
        continue;
      }

      // Evitar procesar si la declaración ya se pintó, aunque SemanticTokensBuilder 
      // ordena automáticamente por línea/caracter, es mejor resolver.
      // Aquí validamos B051: ¿Es un tipo nativo?
      
      const lowerId = identifier.toLowerCase();

      // Resolver localmente rápido
      const scope = getScopeAtLine(snapshot, i);
      if (scope) {
        const local = scope.symbols.find(s => s.name.toLowerCase() === lowerId);
        if (local) {
          const type = local.scope === 'Argumento' ? TYPE_INDEX.parameter : TYPE_INDEX.variable;
          tokens.push({ line: i, char: startChar, length: identifier.length, type, mods: MODIFIER_MASK.local });
          continue;
        }
      }

      // Check for qualifier to resolve member access
      const qualifier = extractQualifier(line, startChar);

      const catalogToken = resolveCatalogToken(identifier, qualifier, systemCatalog);
      if (catalogToken) {
        tokens.push({
          line: i,
          char: startChar,
          length: identifier.length,
          ...catalogToken,
        });
        continue;
      }
      
      // Si no hay cualificador, puede ser una variable de instancia, global, tipo, o función global.
      const result = facade.resolveTarget(
        document,
        Position.create(i, startChar),
        { consumer: 'semantic-tokens', traceLabel: 'semantic-tokens' }
      );
      
      if (result.target) {
        let tokenType = TYPE_INDEX.variable;
        let modifiers = 0;

        if (result.target.kind === EntityKind.Type) {
          tokenType = TYPE_INDEX.class;
        } else if (result.target.kind === EntityKind.Function || result.target.kind === EntityKind.Subroutine) {
          tokenType = TYPE_INDEX.function;
        } else if (result.target.kind === EntityKind.Event) {
          tokenType = TYPE_INDEX.event;
        } else if (result.target.kind === EntityKind.Variable) {
          if (result.target.scope === 'Instancia') {
            tokenType = TYPE_INDEX.property;
          }
          modifiers |= getVariableScopeModifier(result.target.scope);
        }

        if (result.target.access?.includes('readonly')) {
          modifiers |= MODIFIER_MASK.readonly;
        }

        if (result.kind === 'system-symbol') {
          modifiers |= MODIFIER_MASK.defaultLibrary;
        }

        tokens.push({
          line: i,
          char: startChar,
          length: identifier.length,
          type: tokenType,
          mods: modifiers,
          confidence: result.confidence.level,
          origin: 'semantic'
        });
      }
    }
  }
}

function resolveCatalogToken(
  identifier: string,
  qualifier: string | undefined,
  systemCatalog: SystemCatalog,
): Pick<TokenEntry, 'type' | 'mods'> | undefined {
  if (qualifier) {
    return undefined;
  }

  if (systemCatalog.resolveKeyword(identifier) || systemCatalog.resolveReservedWord(identifier)) {
    return {
      type: TYPE_INDEX.keyword,
      mods: 0,
    };
  }

  const datatypeEntry = systemCatalog.resolveDatatype(identifier);
  if (datatypeEntry) {
    return getCatalogTypeToken(datatypeEntry);
  }

  const enumeratedTypeEntry = systemCatalog.resolveEnumeratedType(identifier);
  if (enumeratedTypeEntry) {
    return getCatalogTypeToken(enumeratedTypeEntry);
  }

  if (systemCatalog.resolveSystemGlobal(identifier) || systemCatalog.resolvePronoun(identifier)) {
    return {
      type: TYPE_INDEX.variable,
      mods: MODIFIER_MASK.defaultLibrary | MODIFIER_MASK.global,
    };
  }

  if (systemCatalog.resolveGlobalFunction(identifier)) {
    return {
      type: TYPE_INDEX.function,
      mods: MODIFIER_MASK.defaultLibrary,
    };
  }

  return undefined;
}

function getScopeAtLine(snapshot: SemanticDocumentSnapshot, line: number): Scope | undefined {
  const findDeepest = (scopes: Scope[]): Scope | undefined => {
    let bestMatch: Scope | undefined;
    for (const scope of scopes) {
      if (line >= scope.startLine && line <= scope.endLine) {
        bestMatch = scope;
        const deeper = findDeepest(scope.children);
        if (deeper) bestMatch = deeper;
      }
    }
    return bestMatch;
  };

  return findDeepest(snapshot.scopes);
}

function extractQualifier(line: string, identifierStart: number): string | undefined {
  // Regresa hacia atrás buscando "cualificador." o "cualificador::"
  let i = identifierStart - 1;
  while (i >= 0 && (line[i] === ' ' || line[i] === '\t')) {
    i--;
  }
  let hasSeparator = false;
  if (i >= 0 && line[i] === '.') {
    hasSeparator = true;
    i--;
  } else if (i >= 1 && line[i] === ':' && line[i - 1] === ':') {
    hasSeparator = true;
    i -= 2;
  }
  if (!hasSeparator) {
    return undefined;
  }
  while (i >= 0 && (line[i] === ' ' || line[i] === '\t')) {
    i--;
  }
  // Now extract the identifier before the separator
  const qualifierEnd = i;
  while (i >= 0 && /[a-zA-Z0-9_$#%]/.test(line[i])) {
    i--;
  }
  const qualifier = line.substring(i + 1, qualifierEnd + 1);
  return qualifier.length > 0 ? qualifier : undefined;
}
