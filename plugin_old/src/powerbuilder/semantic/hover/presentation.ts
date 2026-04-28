import * as vscode from 'vscode';
import {
    PB_USER_MESSAGES,
    formatHoverDefinedInEs,
    getSymbolKindLabelEs,
} from '../../../core/i18n/pbUserMessages';
import {
    formatSystemSymbolSupplementMarkdown,
    getSystemSymbolHoverPayload,
} from '../../knowledge/services/presentation';
import { PbSystemSymbolEntry } from '../../knowledge/types';
import { PbSymbol } from '../../models/pbSymbol';
import {
    formatCallableSuggestionMarkdown,
    SemanticCallableSuggestion,
} from '../callableSuggestions';
import { SemanticHoverContent } from './contracts';

export function buildSystemHoverContent(
    entry: PbSystemSymbolEntry,
): SemanticHoverContent {
    const payload = getSystemSymbolHoverPayload(entry);

    return {
        kind: 'system-symbol',
        title: payload.title,
        signatureMarkdown: payload.signatureMarkdown,
        supplementMarkdown: payload.supplementMarkdown,
        markdown: payload.markdown,
    };
}

export function buildAncestorReturnValueHoverContent(): SemanticHoverContent {
    const title = '**(variable generada)** `AncestorReturnValue`';
    const supplementMarkdown = [
        'Disponible cuando un script descendiente usa `CALL` para ejecutar un evento del ancestro y necesita leer su valor de retorno.',
        'El motor la trata como contexto conservador: sin definition, references ni rename demostrables.',
    ].join('\n\n');

    return {
        kind: 'ancestor-return-value',
        title,
        supplementMarkdown,
        markdown: [title, supplementMarkdown].join('\n\n'),
    };
}

export function buildSymbolHoverContent(
    symbol: PbSymbol,
    options: {
        callableSuggestion?: SemanticCallableSuggestion;
        systemEntry?: PbSystemSymbolEntry;
    } = {},
): SemanticHoverContent {
    const sections: string[] = [];
    const kindLabel = symbol.declarationScope === 'parameter'
        ? 'parámetro'
        : getSymbolKindLabelEs(symbol.kind);
    let title = `\`${symbol.name}\``;
    let signatureMarkdown: string | undefined;

    switch (symbol.kind) {
        case 'type':
        case 'structure':
            title = `**(${kindLabel})** \`${symbol.name}\``;
            sections.push(title);

            if (symbol.detail) {
                sections.push(symbol.detail);
            }
            break;

        case 'function':
        case 'global-function': {
            const signature = symbol.signature?.trim()
                ? symbol.signature
                : `${symbol.returnType ?? 'any'} ${symbol.name}()`;

            title = `**(${kindLabel})** \`${signature}\``;
            signatureMarkdown = `\`${signature}\``;
            sections.push(title);

            if (symbol.parent) {
                sections.push(
                    `${PB_USER_MESSAGES.hover.inContainer} \`${symbol.parent}\``,
                );
            }

            break;
        }

        case 'subroutine': {
            const signature = symbol.signature?.trim()
                ? symbol.signature
                : `${symbol.name}()`;

            title = `**(${kindLabel})** \`${signature}\``;
            signatureMarkdown = `\`${signature}\``;
            sections.push(title);

            if (symbol.parent) {
                sections.push(
                    `${PB_USER_MESSAGES.hover.inContainer} \`${symbol.parent}\``,
                );
            }

            break;
        }

        case 'event': {
            const signature = symbol.signature?.trim()
                ? symbol.signature
                : `${symbol.name}()`;

            title = `**(${kindLabel})** \`${signature}\``;
            signatureMarkdown = `\`${signature}\``;
            sections.push(title);

            if (symbol.detail) {
                sections.push(symbol.detail);
            } else if (symbol.parent) {
                sections.push(
                    `${PB_USER_MESSAGES.hover.inContainer} \`${symbol.parent}\``,
                );
            }

            if (symbol.ownerName && symbol.ownerName !== symbol.parent) {
                sections.push(
                    `${PB_USER_MESSAGES.hover.inContainer} \`${symbol.ownerName}\``,
                );
            }

            break;
        }

        case 'constant':
        case 'variable': {
            const typeLabel = symbol.detail?.trim();

            if (typeLabel) {
                title = `**(${kindLabel})** \`${typeLabel} ${symbol.name}\``;
                sections.push(title);
            } else {
                title = `**(${kindLabel})** \`${symbol.name}\``;
                sections.push(title);
            }

            if (symbol.access) {
                sections.push(`(${symbol.access})`);
            }

            if (symbol.parent) {
                sections.push(
                    `${PB_USER_MESSAGES.hover.inContainer} \`${symbol.parent}\``,
                );
            }

            break;
        }

        default:
            title = `\`${symbol.name}\` (${symbol.kind})`;
            sections.push(title);
            break;
    }

    if (symbol.isPrototype) {
        sections.push(`*${PB_USER_MESSAGES.hover.forwardPrototype}*`);
    }

    if (symbol.implementationKind === 'on-handler') {
        sections.push('*Handler ON*');
    }

    if (symbol.implementationKind === 'qualified-event') {
        sections.push('*Evento calificado*');
    }

    if (symbol.isExternal) {
        sections.push('*Función externa*');

        if (symbol.externalLibraryName) {
            sections.push(`Biblioteca: \`${symbol.externalLibraryName}\``);
        }

        if (symbol.externalName) {
            sections.push(`Alias externo: \`${symbol.externalName}\``);
        }
    }

    let supplementMarkdown: string | undefined;

    if (options.systemEntry) {
        supplementMarkdown = formatSystemSymbolSupplementMarkdown(options.systemEntry);
        sections.push(supplementMarkdown);
    }

    if (options.callableSuggestion) {
        sections.push(formatCallableSuggestionMarkdown(options.callableSuggestion));
    }

    const filePath = vscode.workspace.asRelativePath(symbol.uri);

    sections.push(
        `*${formatHoverDefinedInEs(filePath, symbol.range.start.line + 1)}*`,
    );

    return {
        kind: 'symbol',
        title,
        signatureMarkdown,
        supplementMarkdown,
        markdown: sections.join('\n\n'),
    };
}