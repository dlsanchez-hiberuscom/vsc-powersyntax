import * as vscode from 'vscode';

import {
  formatPowerBuilderText,
  type PowerBuilderFormatterBlankLineMode,
  type PowerBuilderFormatterCaseMode,
  type PowerBuilderFormatterIndentStyle,
  type PowerBuilderFormatterOptions,
} from '../../shared/formatting/powerBuilderFormatter';

const SUPPORTED_FORMATTING_LANGUAGES = [
  'powerbuilder',
  'powerbuilder-window',
  'powerbuilder-userobject',
  'powerbuilder-function',
  'powerbuilder-menu',
  'powerbuilder-application',
  'powerbuilder-structure'
] as const;

const FORMATTING_SELECTOR = SUPPORTED_FORMATTING_LANGUAGES.flatMap((language) => ([
  { scheme: 'file', language },
  { scheme: 'untitled', language }
]));

interface RuntimeFormattingConfig {
  enabled: boolean;
  formatOnSave: boolean;
  options: PowerBuilderFormatterOptions;
}

function normalizeCaseMode(value: unknown, fallback: PowerBuilderFormatterCaseMode): PowerBuilderFormatterCaseMode {
  return value === 'upper' || value === 'lower' || value === 'preserve' ? value : fallback;
}

function normalizeIndentStyle(value: unknown): PowerBuilderFormatterIndentStyle {
  return value === 'tabs' ? 'tabs' : 'spaces';
}

function normalizeBlankLineMode(value: unknown): PowerBuilderFormatterBlankLineMode {
  return value === 'compact' ? 'compact' : 'preserve';
}

function normalizeIndentSize(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
}

function supportsFormatting(document: vscode.TextDocument): boolean {
  return SUPPORTED_FORMATTING_LANGUAGES.includes(document.languageId as typeof SUPPORTED_FORMATTING_LANGUAGES[number]);
}

function getFormattingConfig(document: vscode.TextDocument): RuntimeFormattingConfig {
  const config = vscode.workspace.getConfiguration('vscPowerSyntax', document);
  const keywordCase = normalizeCaseMode(config.get('formatting.keywordCase'), 'preserve');

  return {
    enabled: config.get<boolean>('formatting.enabled', true),
    formatOnSave: config.get<boolean>('formatting.formatOnSave', false),
    options: {
      keywordCase,
      statementCase: normalizeCaseMode(config.get('formatting.statementCase'), keywordCase),
      typeCase: normalizeCaseMode(config.get('formatting.typeCase'), keywordCase),
      eventKeywordCase: normalizeCaseMode(config.get('formatting.eventKeywordCase'), keywordCase),
      indentStyle: normalizeIndentStyle(config.get('formatting.indentStyle')),
      indentSize: normalizeIndentSize(config.get('formatting.indentSize'), 3),
      trimTrailingWhitespace: config.get<boolean>('formatting.trimTrailingWhitespace', true),
      spaceAfterComma: config.get<boolean>('formatting.spaceAfterComma', true),
      spaceAroundOperators: config.get<boolean>('formatting.spaceAroundOperators', true),
      normalizeBlankLines: normalizeBlankLineMode(config.get('formatting.normalizeBlankLines')),
    }
  };
}

function getDocumentLineEnding(document: vscode.TextDocument): string {
  return document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
}

function getFullDocumentRange(document: vscode.TextDocument): vscode.Range {
  const lastLine = Math.max(document.lineCount - 1, 0);
  const end = document.lineAt(lastLine).range.end;
  return new vscode.Range(new vscode.Position(0, 0), end);
}

function buildDocumentFormattingEdits(document: vscode.TextDocument, options: PowerBuilderFormatterOptions): vscode.TextEdit[] {
  const original = document.getText();
  const formatted = formatPowerBuilderText(original, options, getDocumentLineEnding(document));
  if (formatted === original) {
    return [];
  }
  return [vscode.TextEdit.replace(getFullDocumentRange(document), formatted)];
}

export function registerFormatting(): vscode.Disposable[] {
  const documentProvider = vscode.languages.registerDocumentFormattingEditProvider(FORMATTING_SELECTOR, {
    provideDocumentFormattingEdits(document): vscode.TextEdit[] {
      const config = getFormattingConfig(document);
      if (!supportsFormatting(document) || !config.enabled) {
        return [];
      }
      return buildDocumentFormattingEdits(document, config.options);
    }
  });

  const formatOnSave = vscode.workspace.onWillSaveTextDocument((event) => {
    const document = event.document;
    const config = getFormattingConfig(document);
    if (!supportsFormatting(document) || !config.enabled || !config.formatOnSave) {
      return;
    }
    event.waitUntil(Promise.resolve(buildDocumentFormattingEdits(document, config.options)));
  });

  return [documentProvider, formatOnSave];
}