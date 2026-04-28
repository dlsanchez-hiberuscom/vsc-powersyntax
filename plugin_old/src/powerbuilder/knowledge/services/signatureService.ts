import {
    PbSystemSymbolEntry,
    PbSystemSymbolSignature,
    PbSystemSymbolSignaturePayload,
} from '../types';

function splitSignatureParameters(label: string): string[] {
    const openParen = label.indexOf('(');
    const closeParen = label.lastIndexOf(')');

    if (openParen < 0 || closeParen <= openParen) {
        return [];
    }

    const content = label.slice(openParen + 1, closeParen).trim();

    if (!content) {
        return [];
    }

    const parameters: string[] = [];
    let current = '';
    let depth = 0;
    let stringDelimiter: '"' | '\'' | undefined;

    for (let index = 0; index < content.length; index++) {
        const character = content[index];

        if (stringDelimiter) {
            current += character;

            if (character === '~') {
                current += content[index + 1] ?? '';
                index++;
                continue;
            }

            if (character === stringDelimiter) {
                stringDelimiter = undefined;
            }

            continue;
        }

        if (character === '"' || character === '\'') {
            stringDelimiter = character;
            current += character;
            continue;
        }

        if (character === '(') {
            depth++;
            current += character;
            continue;
        }

        if (character === ')') {
            depth = Math.max(0, depth - 1);
            current += character;
            continue;
        }

        if (character === ',' && depth === 0) {
            const parameter = current.trim();

            if (parameter) {
                parameters.push(parameter);
            }

            current = '';
            continue;
        }

        current += character;
    }

    const parameter = current.trim();

    if (parameter) {
        parameters.push(parameter);
    }

    return parameters;
}

export function getSystemSignatureParameterLabels(
    signature: PbSystemSymbolSignature,
): string[] {
    if (signature.parameters?.length) {
        return signature.parameters.map(parameter => parameter.label);
    }

    return splitSignatureParameters(signature.label);
}

export function getSystemSignatureParameterCount(
    signature: PbSystemSymbolSignature,
): number {
    return getSystemSignatureParameterLabels(signature).length;
}

export function selectPreferredSystemSignatureIndex(
    entry: Pick<PbSystemSymbolEntry, 'signatures'>,
    providedArgumentCount: number,
    hasAnyArgumentText: boolean,
): number {
    if (entry.signatures.length <= 1) {
        return 0;
    }

    const compatibleIndices = entry.signatures
        .map((signature, index) => ({
            index,
            parameterCount: getSystemSignatureParameterCount(signature),
        }))
        .filter(signature => {
            if (!hasAnyArgumentText) {
                return signature.parameterCount === 0 || signature.parameterCount >= 1;
            }

            return signature.parameterCount >= providedArgumentCount;
        })
        .sort((left, right) => left.parameterCount - right.parameterCount);

    if (compatibleIndices.length > 0) {
        return compatibleIndices[0].index;
    }

    return entry.signatures.length - 1;
}

export function getSystemSignaturePayload(
    entry: Pick<PbSystemSymbolEntry, 'signatures'>,
    providedArgumentCount: number,
    hasAnyArgumentText: boolean,
): PbSystemSymbolSignaturePayload {
    return {
        signatures: entry.signatures,
        activeSignatureIndex: selectPreferredSystemSignatureIndex(
            entry,
            providedArgumentCount,
            hasAnyArgumentText,
        ),
    };
}
