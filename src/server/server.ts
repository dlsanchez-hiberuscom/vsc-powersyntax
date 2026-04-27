import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
  InitializeParams,
  InitializeResult,
  Hover,
  Diagnostic
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { SERVER_NAME } from '../shared/types';
import { invalidateDocumentAnalysis, clearDocumentAnalysisCache } from './analysis/analysisCache';
import {
  cancelScheduledDiagnostics,
  clearAllScheduledDiagnostics,
  publishDiagnosticsNow,
  scheduleDiagnostics
} from './analysis/diagnosticScheduler';
import { extractDocumentSymbols } from './features/documentSymbols';
import { provideHover } from './features/hover';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      documentSymbolProvider: true,
      hoverProvider: true
    }
  };
});

connection.onInitialized(() => {
  connection.console.log(`${SERVER_NAME} inicializado.`);
});

connection.onDocumentSymbol((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  return extractDocumentSymbols(document);
});

connection.onHover((params): Hover | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  return provideHover(document, params.position);
});

documents.onDidOpen((event) => {
  publishDiagnosticsNow(connection, event.document);
});

documents.onDidChangeContent((event) => {
  scheduleDiagnostics(connection, event.document);
});

documents.onDidClose((event) => {
  cancelScheduledDiagnostics(event.document.uri);
  invalidateDocumentAnalysis(event.document.uri);

  connection.sendDiagnostics({
    uri: event.document.uri,
    diagnostics: [] as Diagnostic[]
  });
});

connection.onShutdown(() => {
  clearAllScheduledDiagnostics();
  clearDocumentAnalysisCache();
});

documents.listen(connection);
connection.listen();
