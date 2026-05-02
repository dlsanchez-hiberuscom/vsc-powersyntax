import type { PowerBuilderFormatterOptions } from './powerBuilderFormatter';

export type PowerBuilderFormatDocumentStatus = 'formatted' | 'unchanged' | 'skipped';
export type PowerBuilderFormatDocumentSkipReason = 'max-document-chars' | 'max-document-lines';

export interface PowerBuilderFormatDocumentRequest {
  text: string;
  lineEnding?: string;
  options: PowerBuilderFormatterOptions;
  maxDocumentChars?: number;
  maxDocumentLines?: number;
}

export interface PowerBuilderFormatDocumentResult {
  status: PowerBuilderFormatDocumentStatus;
  formattedText?: string;
  elapsedMs: number;
  metrics: {
    inputChars: number;
    inputLines: number;
  };
  skipReason?: PowerBuilderFormatDocumentSkipReason;
  detail?: string;
}