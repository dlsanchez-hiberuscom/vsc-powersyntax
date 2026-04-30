import { SemanticTokens, SemanticTokensBuilder, SemanticTokensLegend } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getDocumentAnalysis } from '../analysis/analysisCache';
import { DocumentAnalysis } from '../analysis/documentAnalysis';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { resolveTargetEntity } from '../knowledge/resolution/semanticQueryService';
import { EntityKind, Scope, ScopeKind } from '../knowledge/types';
import { PB_IDENTIFIER_SOURCE } from '../parsing/grammar';

// ---------------------------------------------------------------------------
// Legends
// ---------------------------------------------------------------------------

const TOKEN_TYPES = [
  'type',
  'class',
  'function',
  'method',
  'property',
  'variable',
  'parameter',
  'event'
] as const;

const TOKEN_MODIFIERS = [
  'declaration',
  'readonly',
  'defaultLibrary',
  'local',
  'instance',
  'global'
] as const;

export function getSemanticTokensLegend(): SemanticTokensLegend {
  return {
    tokenTypes: [...TOKEN_TYPES],
    tokenModifiers: [...TOKEN_MODIFIERS]
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
  event: 7
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

interface TokenEntry {
  line: number;
  char: number;
  length: number;
  type: number;
  mods: number;
}

export function provideSemanticTokens(
  document: TextDocument,
  kb: KnowledgeBase,
  inheritanceGraph: InheritanceGraph
): SemanticTokens {
  const analysis = getDocumentAnalysis(document);

  if (!analysis) {
    return { data: [] };
  }

  const tokens: TokenEntry[] = [];

  // Coloreamos las declaraciones extraídas
  emitDeclarations(analysis, tokens);

  // Coloreamos los usos
  emitUsages(document, analysis, kb, inheritanceGraph, tokens);

  // Ordenar tokens: por línea, luego por carácter
  tokens.sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    return a.char - b.char;
  });

  // Dedup: si hay dos tokens en la misma posición exacta, quedarnos con uno (ej: declaración y uso solapados)
  const deduped: TokenEntry[] = [];
  for (const token of tokens) {
    const last = deduped[deduped.length - 1];
    if (last && last.line === token.line && last.char === token.char) {
      // Priorizar el que tenga más info o simplemente ignorar el duplicado
      continue;
    }
    deduped.push(token);
  }

  const builder = new SemanticTokensBuilder();
  for (const token of deduped) {
    builder.push(token.line, token.char, token.length, token.type, token.mods);
  }

  return builder.build();
}

function emitDeclarations(analysis: DocumentAnalysis, tokens: TokenEntry[]): void {
  for (const fact of analysis.facts) {
    if (fact.kind === 'section') continue;

    let tokenType: number;
    let modifiers = MODIFIER_MASK.declaration;

    switch (fact.kind) {
      case 'variable':
        tokenType = TYPE_INDEX.variable;
        if (fact.scope === 'Local') modifiers |= MODIFIER_MASK.local;
        else if (fact.scope === 'Instancia') modifiers |= MODIFIER_MASK.instance;
        else if (fact.scope === 'Global' || fact.scope === 'Compartida') modifiers |= MODIFIER_MASK.global;
        break;
      case 'function':
      case 'subroutine':
        tokenType = TYPE_INDEX.function;
        break;
      case 'event':
        tokenType = TYPE_INDEX.event;
        break;
      case 'type':
        tokenType = TYPE_INDEX.type;
        break;
      default:
        continue;
    }

    if (fact.access && fact.access.includes('readonly')) {
      modifiers |= MODIFIER_MASK.readonly;
    }

    tokens.push({
      line: fact.line,
      char: fact.startCharacter,
      length: fact.endCharacter - fact.startCharacter,
      type: tokenType,
      mods: modifiers
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
          modifiers |= MODIFIER_MASK.local;
        } else if (symbol.scope === 'Local') {
          tokenType = TYPE_INDEX.variable;
          modifiers |= MODIFIER_MASK.local;
        }

        tokens.push({
          line: symbol.line,
          char: symbol.character,
          length: symbol.name.length,
          type: tokenType,
          mods: modifiers
        });
      }
    }
    for (const child of scope.children) {
      emitScopeSymbols(child);
    }
  };

  for (const scope of analysis.scopes) {
    emitScopeSymbols(scope);
  }
}

function emitUsages(
  document: TextDocument,
  analysis: DocumentAnalysis,
  kb: KnowledgeBase,
  inheritanceGraph: InheritanceGraph,
  tokens: TokenEntry[]
): void {
  // Aquí escanearemos strippedLines para encontrar usos
  const lines = analysis.strippedLines;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;

    IDENTIFIER_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = IDENTIFIER_PATTERN.exec(line)) !== null) {
      const identifier = match[0];
      const startChar = match.index;

      // Evitar procesar si la declaración ya se pintó, aunque SemanticTokensBuilder 
      // ordena automáticamente por línea/caracter, es mejor resolver.
      // Aquí validamos B051: ¿Es un tipo nativo?
      
      const lowerId = identifier.toLowerCase();

      // Resolver localmente rápido
      const scope = getScopeAtLine(analysis, i);
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
      
      // Si no hay cualificador, puede ser una variable de instancia, global, tipo, o función global.
      const targets = resolveTargetEntity(
        { identifier, qualifier },
        document.uri,
        kb,
        inheritanceGraph,
        i
      );

      if (targets.length > 0) {
        const target = targets[0];
        let tokenType = TYPE_INDEX.variable;
        let modifiers = 0;

        if (target.kind === EntityKind.Type) {
          tokenType = TYPE_INDEX.type;
        } else if (target.kind === EntityKind.Function || target.kind === EntityKind.Subroutine) {
          tokenType = TYPE_INDEX.function;
        } else if (target.kind === EntityKind.Event) {
          tokenType = TYPE_INDEX.event;
        } else if (target.kind === EntityKind.Variable) {
          if (target.scope === 'Instancia') {
            tokenType = TYPE_INDEX.property;
            modifiers |= MODIFIER_MASK.instance;
          } else if (target.scope === 'Global' || target.scope === 'Compartida') {
            modifiers |= MODIFIER_MASK.global;
          }
        }

        if (target.access?.includes('readonly')) {
          modifiers |= MODIFIER_MASK.readonly;
        }

        if (target.uri === '') {
          modifiers |= MODIFIER_MASK.defaultLibrary;
        }

        tokens.push({
          line: i,
          char: startChar,
          length: identifier.length,
          type: tokenType,
          mods: modifiers
        });
      }
    }
  }
}

function getScopeAtLine(analysis: DocumentAnalysis, line: number): Scope | undefined {
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

  return findDeepest(analysis.scopes);
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
