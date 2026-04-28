import { formatSystemSymbolMarkdown } from '../systemSymbols/markdown';
import {
    listSystemGlobalFunctions,
    resolveSystemGlobalFunction,
} from '../systemSymbols/resolvers';

export interface PbBuiltinFunctionInfo {
    name: string;
    signature: string;
    description: string;
    category: string;
}

const BUILTIN_FUNCTION_INFOS: readonly PbBuiltinFunctionInfo[] = listSystemGlobalFunctions()
    .map(entry => ({
        name: entry.name,
        signature: entry.signatures[0]?.label ?? `${entry.name}()`,
        description: entry.summary,
        category: entry.category,
    }));

const BUILTIN_INFO_BY_NAME = new Map(
    BUILTIN_FUNCTION_INFOS.map(info => [
        info.name.toLowerCase(),
        info,
    ]),
);

/**
 * Adaptador backward compatibility para el catálogo heredado de built-ins.
 * Solo expone funciones globales del sistema, nunca statements ni eventos.
 */
export const PB_BUILTIN_FUNCTIONS: Record<string, string> = Object.fromEntries(
    listSystemGlobalFunctions().map(entry => [
        entry.name.toLowerCase(),
        formatSystemSymbolMarkdown(entry),
    ]),
);

export function getBuiltinFunctionInfo(
    name: string,
): PbBuiltinFunctionInfo | undefined {
    const normalizedName = name.trim().toLowerCase();
    const legacyInfo = BUILTIN_INFO_BY_NAME.get(normalizedName);

    if (legacyInfo) {
        return legacyInfo;
    }

    const entry = resolveSystemGlobalFunction(name);

    if (!entry) {
        return undefined;
    }

    return {
        name: entry.name,
        signature: entry.signatures[0]?.label ?? `${entry.name}()`,
        description: entry.summary,
        category: entry.category,
    };
}