import {
  type PowerBuilderFormatDocumentRequest,
  type PowerBuilderFormatDocumentResult,
} from '../../shared/formatting/formatDocumentProtocol';
import { formatPowerBuilderText } from '../../shared/formatting/powerBuilderFormatter';

export function formatDocument(request: PowerBuilderFormatDocumentRequest): PowerBuilderFormatDocumentResult {
  const inputChars = request.text.length;
  const inputLines = request.text.length === 0 ? 0 : request.text.split(/\r?\n/).length;

  if (typeof request.maxDocumentChars === 'number' && request.maxDocumentChars > 0 && inputChars > request.maxDocumentChars) {
    return {
      status: 'skipped',
      elapsedMs: 0,
      metrics: { inputChars, inputLines },
      skipReason: 'max-document-chars',
      detail: `Formato omitido: ${inputChars} caracteres exceden el presupuesto de ${request.maxDocumentChars}.`,
    };
  }

  if (typeof request.maxDocumentLines === 'number' && request.maxDocumentLines > 0 && inputLines > request.maxDocumentLines) {
    return {
      status: 'skipped',
      elapsedMs: 0,
      metrics: { inputChars, inputLines },
      skipReason: 'max-document-lines',
      detail: `Formato omitido: ${inputLines} líneas exceden el presupuesto de ${request.maxDocumentLines}.`,
    };
  }

  const start = performance.now();
  const formattedText = formatPowerBuilderText(request.text, request.options, request.lineEnding ?? '\n');
  const elapsedMs = performance.now() - start;

  if (formattedText === request.text) {
    return {
      status: 'unchanged',
      elapsedMs,
      metrics: { inputChars, inputLines },
    };
  }

  return {
    status: 'formatted',
    formattedText,
    elapsedMs,
    metrics: { inputChars, inputLines },
  };
}