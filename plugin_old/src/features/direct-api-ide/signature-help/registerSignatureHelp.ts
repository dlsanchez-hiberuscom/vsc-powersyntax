import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import {
    SignatureCallContext,
    getSignatureCallContextAtPosition,
} from '../../../powerbuilder/document/documentUtils';
import { formatSystemSymbolSupplementMarkdown } from '../../../powerbuilder/knowledge/services/presentation';
import {
    getSystemSignatureParameterLabels,
    selectPreferredSystemSignatureIndex,
} from '../../../powerbuilder/knowledge/services/signatureService';
import {
    PbSystemSymbolEntry,
    PbSystemSymbolSignature,
} from '../../../powerbuilder/knowledge/types';
import { PbSymbol } from '../../../powerbuilder/models/pbSymbol';
import {
    buildCallableSuggestion,
    formatCallableSuggestionPlainText,
} from '../../../powerbuilder/semantic';
import { PowerBuilderProviderHost } from '../provider-host/powerBuilderProviderHost';

export function registerSignatureHelp(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const host = new PowerBuilderProviderHost();

    const provider = vscode.languages.registerSignatureHelpProvider(
        PB_SELECTOR,
        {
            provideSignatureHelp(
                document,
                position,
                _token,
                _context,
            ): vscode.SignatureHelp | undefined {
                return host.runWithPositionContext(
                    document,
                    position,
                    getSignatureCallContextAtPosition,
                    {
                        emptyValue: undefined,
                        isFeatureEnabled: config => config.signatureHelpEnabled,
                    },
                    ({ context: callContext }) => {
                        const signatureQuery = host.semanticQueries.resolveSignatureAtPosition({
                            document,
                            position,
                            context: callContext,
                        });

                        if (signatureQuery.systemEntry) {
                            return buildSystemSignatureHelp(signatureQuery.systemEntry, callContext);
                        }

                        if (!signatureQuery.shouldProvideHelp) {
                            return undefined;
                        }

                        const symbols = signatureQuery.symbols;

                        if (symbols.length === 0) {
                            return undefined;
                        }

                        return buildIndexedSymbolSignatureHelp(symbols, callContext, signatureQuery.precision);
                    },
                );
            },
        },
        '(',
        ',',
    );

    return [provider];
}

function buildSystemSignatureHelp(
    entry: PbSystemSymbolEntry,
    callContext: SignatureCallContext,
): vscode.SignatureHelp | undefined {
    if (entry.signatures.length === 0) {
        return undefined;
    }

    const activeSignature = selectPreferredSystemSignatureIndex(
        entry,
        callContext.providedArgumentCount,
        callContext.hasAnyArgumentText,
    );
    const signatures = entry.signatures.map(signature =>
        buildSystemSignatureInformation(entry, signature),
    );
    const activeParameterCount = signatures[activeSignature]?.parameters.length ?? 0;
    const help = new vscode.SignatureHelp();

    help.signatures = signatures;
    help.activeSignature = activeSignature;
    help.activeParameter = activeParameterCount > 0
        ? Math.min(callContext.activeParameter, activeParameterCount - 1)
        : 0;

    return help;
}

function buildSystemSignatureInformation(
    entry: PbSystemSymbolEntry,
    signature: PbSystemSymbolSignature,
): vscode.SignatureInformation {
    const information = new vscode.SignatureInformation(
        signature.label,
        buildSystemSignatureDocumentation(entry, signature),
    );
    const parameterLabels = signature.parameters?.length
        ? signature.parameters.map(parameter => parameter.label)
        : getSystemSignatureParameterLabels(signature);

    information.parameters = parameterLabels.map((label, index) =>
        new vscode.ParameterInformation(
            label,
            signature.parameters?.[index]?.documentation,
        ),
    );

    return information;
}

function buildSystemSignatureDocumentation(
    entry: PbSystemSymbolEntry,
    signature: PbSystemSymbolSignature,
): string {
    const sections = [entry.summary];

    if (signature.documentation) {
        sections.push(signature.documentation);
    }

    sections.push(formatSystemSymbolSupplementMarkdown(entry));

    return sections.join('\n\n');
}

function buildIndexedSymbolSignatureHelp(
    symbols: PbSymbol[],
    callContext: Pick<
        SignatureCallContext,
        'activeParameter' | 'providedArgumentCount' | 'hasAnyArgumentText'
    >,
    precision: 'exact' | 'compatible' | 'ambiguous' | 'blocked' | 'heuristic',
): vscode.SignatureHelp | undefined {
    const signaturePayloads = symbols
        .map(symbol => buildIndexedSignaturePayload(symbol, symbols.length, precision))
        .filter((payload): payload is IndexedSignaturePayload => !!payload);

    if (signaturePayloads.length === 0) {
        return undefined;
    }

    const activeSignature = selectPreferredIndexedSignatureIndex(
        signaturePayloads,
        callContext.providedArgumentCount,
        callContext.hasAnyArgumentText,
    );
    const help = new vscode.SignatureHelp();
    help.signatures = signaturePayloads.map(payload => payload.information);
    help.activeSignature = activeSignature;
    help.activeParameter = signaturePayloads[activeSignature].parameterCount > 0
        ? Math.min(callContext.activeParameter, signaturePayloads[activeSignature].parameterCount - 1)
        : 0;

    return help;
}

interface IndexedSignaturePayload {
    information: vscode.SignatureInformation;
    parameterCount: number;
}

function buildIndexedSignaturePayload(
    symbol: PbSymbol,
    overloadCount: number,
    precision: 'exact' | 'compatible' | 'ambiguous' | 'blocked' | 'heuristic',
): IndexedSignaturePayload | undefined {
    const signatureLabel = symbol.signature?.trim();

    if (!signatureLabel) {
        return undefined;
    }

    const parameterLabels = extractSignatureParameters(signatureLabel);
    const information = new vscode.SignatureInformation(
        signatureLabel,
        buildIndexedSymbolDocumentation(symbol, overloadCount, parameterLabels.length, precision),
    );

    information.parameters = parameterLabels.map(label =>
        new vscode.ParameterInformation(label),
    );

    return {
        information,
        parameterCount: symbol.parameterCount ?? parameterLabels.length,
    };
}

function buildIndexedSymbolDocumentation(
    symbol: PbSymbol,
    overloadCount: number,
    parameterCount: number,
    precision: 'exact' | 'compatible' | 'ambiguous' | 'blocked' | 'heuristic',
): string {
    const sections = [
        symbol.kind === 'event'
            ? 'Evento indexado del workspace'
            : 'Símbolo indexado del workspace',
    ];
    const callableSuggestion = buildCallableSuggestion(symbol, precision);

    if (overloadCount > 1) {
        sections.push(`Sobrecarga compatible de ${parameterCount} parámetro(s).`);
    }

    if (symbol.parent) {
        sections.push(`Contenedor: ${symbol.parent}`);
    }

    if (symbol.returnType) {
        sections.push(`Retorno: ${symbol.returnType}`);
    }

    if (callableSuggestion) {
        sections.push(formatCallableSuggestionPlainText(callableSuggestion));
    }

    if (symbol.detail) {
        sections.push(symbol.detail);
    }

    if (symbol.isExternal && symbol.externalLibraryName) {
        sections.push(`Externa: ${symbol.externalLibraryName}`);
    }

    return sections.join('\n\n');
}

function selectPreferredIndexedSignatureIndex(
    payloads: readonly IndexedSignaturePayload[],
    providedArgumentCount: number,
    hasAnyArgumentText: boolean,
): number {
    if (payloads.length <= 1) {
        return 0;
    }

    const compatibleIndices = payloads
        .map((payload, index) => ({
            index,
            parameterCount: payload.parameterCount,
        }))
        .filter(payload => {
            if (!hasAnyArgumentText) {
                return payload.parameterCount === 0 || payload.parameterCount >= 1;
            }

            return payload.parameterCount >= providedArgumentCount;
        })
        .sort((left, right) => left.parameterCount - right.parameterCount);

    if (compatibleIndices.length > 0) {
        return compatibleIndices[0].index;
    }

    return payloads.length - 1;
}

function extractSignatureParameters(signatureLabel: string): string[] {
    const openParen = signatureLabel.indexOf('(');
    const closeParen = signatureLabel.lastIndexOf(')');

    if (openParen < 0 || closeParen <= openParen) {
        return [];
    }

    const content = signatureLabel.slice(openParen + 1, closeParen).trim();

    if (!content) {
        return [];
    }

    return content
        .split(',')
        .map(parameter => parameter.trim())
        .filter(Boolean);
}