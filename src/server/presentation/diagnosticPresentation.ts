import type { Diagnostic } from 'vscode-languageserver/node';

import { getDiagnosticCode } from '../../shared/diagnosticCodes';
import { buildCompactPayloadPolicy, type DiagnosticMessageViewModel } from './viewModels';

function extractReasonCodes(diagnostic: Diagnostic): string[] {
  const data = diagnostic.data;
  if (!data || typeof data !== 'object') {
    const code = getDiagnosticCode(diagnostic);
    return code ? [code] : [];
  }

  const record = data as Record<string, unknown>;
  const explicit = record.reasonCodes;
  if (Array.isArray(explicit)) {
    return explicit.filter((entry): entry is string => typeof entry === 'string');
  }

  if (typeof record.reasonCode === 'string') {
    return [record.reasonCode];
  }

  const code = getDiagnosticCode(diagnostic);
  return code ? [code] : [];
}

function extractConfidence(diagnostic: Diagnostic): DiagnosticMessageViewModel['confidence'] {
  const data = diagnostic.data;
  if (!data || typeof data !== 'object') {
    return undefined;
  }

  const confidence = (data as Record<string, unknown>).confidence;
  return confidence === 'high' || confidence === 'medium' || confidence === 'low' || confidence === 'unknown'
    ? confidence
    : undefined;
}

export function buildDiagnosticMessageViewModel(diagnostic: Diagnostic): DiagnosticMessageViewModel {
  const confidence = extractConfidence(diagnostic);
  return {
    feature: 'diagnostics',
    range: diagnostic.range,
    primaryMessage: diagnostic.message,
    ...(diagnostic.severity !== undefined ? { severity: diagnostic.severity } : {}),
    ...(diagnostic.code !== undefined ? { code: diagnostic.code } : {}),
    ...(diagnostic.source ? { source: diagnostic.source } : {}),
    reasonCodes: extractReasonCodes(diagnostic),
    ...(confidence ? { confidence } : {}),
    ...(diagnostic.data !== undefined ? { data: diagnostic.data } : {}),
  };
}

export function buildDiagnosticMessageViewModels(diagnostics: readonly Diagnostic[]): DiagnosticMessageViewModel[] {
  return diagnostics.map(buildDiagnosticMessageViewModel);
}

export function formatDiagnosticMessageViewModel(viewModel: DiagnosticMessageViewModel): Diagnostic {
  return {
    range: viewModel.range,
    message: viewModel.primaryMessage,
    ...(viewModel.severity !== undefined ? { severity: viewModel.severity } : {}),
    ...(viewModel.code !== undefined ? { code: viewModel.code } : {}),
    ...(viewModel.source ? { source: viewModel.source } : {}),
    ...(viewModel.data !== undefined ? { data: viewModel.data } : {}),
  };
}

export function formatDiagnosticMessageViewModels(viewModels: readonly DiagnosticMessageViewModel[]): Diagnostic[] {
  return viewModels.map(formatDiagnosticMessageViewModel);
}

export const DIAGNOSTIC_PRESENTATION_PAYLOAD_POLICY = buildCompactPayloadPolicy('diagnostics', 48 * 1024);