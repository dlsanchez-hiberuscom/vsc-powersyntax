export type SemanticHoverContentKind =
    | 'symbol'
    | 'system-symbol'
    | 'ancestor-return-value';

export interface SemanticHoverContent {
    kind: SemanticHoverContentKind;
    title: string;
    signatureMarkdown?: string;
    supplementMarkdown?: string;
    markdown: string;
}