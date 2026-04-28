import { PbSymbol } from '../models/pbSymbol';
import { PbSemanticPrecision } from './contracts';
import { getCallableParameterCount, isCallableSymbol, normalizeIdentifier } from './ranking/shared';

export type SemanticCallableSuggestionPrecision = 'exact' | 'compatible';

export interface SemanticCallableSuggestion {
    precision: SemanticCallableSuggestionPrecision;
    source: 'indexed-callable';
    callableName: string;
    signatureLabel?: string;
    returnType?: string;
    parameterCount: number;
}

export function canPublishCallableSuggestion(
    precision: PbSemanticPrecision,
): precision is SemanticCallableSuggestionPrecision {
    return precision === 'exact' || precision === 'compatible';
}

export function buildCallableSuggestion(
    symbol: PbSymbol | undefined,
    precision: PbSemanticPrecision,
): SemanticCallableSuggestion | undefined {
    if (!symbol || !isCallableSymbol(symbol) || !canPublishCallableSuggestion(precision)) {
        return undefined;
    }

    const signatureLabel = getCallableSuggestionSignature(symbol);
    const returnType = getCallableSuggestionReturnType(symbol);

    if (!signatureLabel && !returnType) {
        return undefined;
    }

    return {
        precision,
        source: 'indexed-callable',
        callableName: symbol.name,
        signatureLabel,
        returnType,
        parameterCount: getCallableParameterCount(symbol),
    };
}

export function formatCallableSuggestionMarkdown(
    suggestion: SemanticCallableSuggestion,
): string {
    const precisionLabel = suggestion.precision === 'exact'
        ? 'exacta'
        : 'compatible';
    const sections: string[] = [];

    if (suggestion.signatureLabel) {
        sections.push(`Sugerencia ${precisionLabel} de firma: \`${suggestion.signatureLabel}\``);
    }

    if (suggestion.returnType) {
        sections.push(`Sugerencia ${precisionLabel} de retorno: \`${suggestion.returnType}\``);
    }

    sections.push(suggestion.precision === 'exact'
        ? 'Basada en firma indexada y binding semántico fuerte del contexto actual.'
        : 'Basada en firma indexada y binding compatible del contexto actual.');

    return sections.join('\n\n');
}

export function formatCallableSuggestionPlainText(
    suggestion: SemanticCallableSuggestion,
): string {
    const precisionLabel = suggestion.precision === 'exact'
        ? 'exacta'
        : 'compatible';
    const sections: string[] = [];

    if (suggestion.signatureLabel) {
        sections.push(`Sugerencia ${precisionLabel} de firma: ${suggestion.signatureLabel}`);
    }

    if (suggestion.returnType) {
        sections.push(`Sugerencia ${precisionLabel} de retorno: ${suggestion.returnType}`);
    }

    sections.push(suggestion.precision === 'exact'
        ? 'Basada en firma indexada y binding semántico fuerte del contexto actual.'
        : 'Basada en firma indexada y binding compatible del contexto actual.');

    return sections.join('\n\n');
}

function getCallableSuggestionSignature(symbol: PbSymbol): string | undefined {
    const signature = symbol.signature?.trim();

    if (signature) {
        return signature;
    }

    if (symbol.kind === 'function' || symbol.kind === 'global-function') {
        return `${normalizeWhitespace(symbol.returnType) ?? 'any'} ${symbol.name}()`;
    }

    if (symbol.kind === 'subroutine' || symbol.kind === 'event') {
        return `${symbol.name}()`;
    }

    return undefined;
}

function getCallableSuggestionReturnType(symbol: PbSymbol): string | undefined {
    if (symbol.kind !== 'function' && symbol.kind !== 'global-function') {
        return undefined;
    }

    const normalizedReturnType = normalizeWhitespace(symbol.returnType);

    if (!normalizedReturnType) {
        return undefined;
    }

    const withoutArrays = normalizedReturnType.replace(/\[\s*\]/g, '').trim();

    return normalizeIdentifier(withoutArrays) === 'any'
        ? undefined
        : normalizedReturnType;
}

function normalizeWhitespace(value?: string): string | undefined {
    const trimmed = value?.replace(/\s+/g, ' ').trim();
    return trimmed ? trimmed : undefined;
}