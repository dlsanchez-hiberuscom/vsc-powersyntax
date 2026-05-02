import * as vscode from 'vscode';

import {
  type PowerBuilderFormatterBlankLineMode,
  type PowerBuilderFormatterCaseMode,
  type PowerBuilderFormatterIndentStyle,
  type PowerBuilderFormatterOptions,
} from '../../shared/formatting/powerBuilderFormatter';
import {
  type PowerBuilderFormatDocumentRequest,
  type PowerBuilderFormatDocumentResult,
} from '../../shared/formatting/formatDocumentProtocol';

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
  maxDocumentChars?: number;
  maxDocumentLines?: number;
  options: PowerBuilderFormatterOptions;
}

type FormattingTrigger = 'manual' | 'save';

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

function normalizeBudget(value: unknown, fallback: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  if (value <= 0) {
    return undefined;
  }
  return Math.trunc(value);
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
    maxDocumentChars: normalizeBudget(config.get('formatting.maxDocumentChars'), 120_000),
    maxDocumentLines: normalizeBudget(config.get('formatting.maxDocumentLines'), 4_000),
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

function showSkipNotice(result: PowerBuilderFormatDocumentResult, trigger: FormattingTrigger): void {
  if (!result.detail) {
    return;
  }

  if (trigger === 'manual') {
    void vscode.window.showWarningMessage(result.detail);
    return;
  }

  vscode.window.setStatusBarMessage(result.detail, 5000);
}

async function buildDocumentFormattingEdits(
  document: vscode.TextDocument,
  config: RuntimeFormattingConfig,
  formatDocument: (request: PowerBuilderFormatDocumentRequest) => Promise<PowerBuilderFormatDocumentResult>,
  trigger: FormattingTrigger,
): Promise<vscode.TextEdit[]> {
  const request: PowerBuilderFormatDocumentRequest = {
    text: document.getText(),
    lineEnding: getDocumentLineEnding(document),
    options: config.options,
    maxDocumentChars: config.maxDocumentChars,
    maxDocumentLines: config.maxDocumentLines,
  };

  const result = await formatDocument(request);
  if (result.status === 'skipped') {
    showSkipNotice(result, trigger);
    return [];
  }

  if (result.status !== 'formatted' || result.formattedText === request.text) {
    return [];
  }

  if (typeof result.formattedText !== 'string') {
    return [];
  }

  return [vscode.TextEdit.replace(getFullDocumentRange(document), result.formattedText)];
}

export function registerFormatting(
  formatDocument: (request: PowerBuilderFormatDocumentRequest) => Promise<PowerBuilderFormatDocumentResult>,
): vscode.Disposable[] {
  const documentProvider = vscode.languages.registerDocumentFormattingEditProvider(FORMATTING_SELECTOR, {
    async provideDocumentFormattingEdits(document): Promise<vscode.TextEdit[]> {
      const config = getFormattingConfig(document);
      if (!supportsFormatting(document) || !config.enabled) {
        return [];
      }
      try {
        return await buildDocumentFormattingEdits(document, config, formatDocument, 'manual');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`No se pudo formatear el documento: ${message}`);
        return [];
      }
    }
  });

  const formatOnSave = vscode.workspace.onWillSaveTextDocument((event) => {
    const document = event.document;
    const config = getFormattingConfig(document);
    if (!supportsFormatting(document) || !config.enabled || !config.formatOnSave) {
      return;
    }
    event.waitUntil(buildDocumentFormattingEdits(document, config, formatDocument, 'save'));
  });

  return [documentProvider, formatOnSave];
}