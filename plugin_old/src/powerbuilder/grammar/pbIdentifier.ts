export const PB_IDENTIFIER_START_SOURCE = '[a-zA-Z_$#%]';
export const PB_IDENTIFIER_BODY_SOURCE = '[\\w$#%-]*';
export const PB_IDENTIFIER_SOURCE =
    `${PB_IDENTIFIER_START_SOURCE}${PB_IDENTIFIER_BODY_SOURCE}`;

export const PB_IDENTIFIER_CHAR_SOURCE = '[a-zA-Z0-9_$#%-]';

const PB_IDENTIFIER_CHAR_REGEX = /^[a-zA-Z0-9_$#%-]$/;
const PB_IDENTIFIER_NAME_REGEX = new RegExp(
    `^${PB_IDENTIFIER_SOURCE}$`,
    'i',
);

export function isPbIdentifierChar(value: string): boolean {
    return !!value && PB_IDENTIFIER_CHAR_REGEX.test(value);
}

export function isValidPbIdentifierName(value: string): boolean {
    return PB_IDENTIFIER_NAME_REGEX.test(value.trim());
}

export function normalizePbIdentifier(value?: string): string | undefined {
    const trimmed = value?.trim().toLowerCase();
    return trimmed ? trimmed : undefined;
}