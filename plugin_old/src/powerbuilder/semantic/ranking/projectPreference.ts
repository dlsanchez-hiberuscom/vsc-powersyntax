import * as vscode from 'vscode';
import { PbSymbol } from '../../models/pbSymbol';
import { PbLibraryGraph } from '../../workspace/pbLibraryGraph';
import { PbProjectDefinition } from '../../workspace/pbProjectModel';
import { SemanticProjectPreferenceResult } from './contracts';
import { compareSymbolsByPosition } from './shared';

export function resolveProjectPreference(
    symbols: PbSymbol[],
    libraryGraph: PbLibraryGraph,
    uri: vscode.Uri,
): SemanticProjectPreferenceResult {
    const currentProject = libraryGraph.getPreferredProjectForSourceFile(uri);

    if (!currentProject) {
        return {
            currentProject: undefined,
            preferredSymbols: symbols,
        };
    }

    const projectSymbols = symbols.filter(symbol =>
        isSymbolInProject(symbol, libraryGraph, currentProject),
    );

    return {
        currentProject,
        preferredSymbols: projectSymbols.length > 0
            ? projectSymbols
            : symbols,
    };
}

export function filterSymbolsToPreferredProject(
    symbols: PbSymbol[],
    libraryGraph: PbLibraryGraph,
    uri: vscode.Uri,
): PbSymbol[] {
    return resolveProjectPreference(symbols, libraryGraph, uri).preferredSymbols;
}

export function isSymbolInProject(
    symbol: PbSymbol,
    libraryGraph: PbLibraryGraph,
    project: PbProjectDefinition,
): boolean {
    return libraryGraph.isSourceFileInProject(symbol.uri, project);
}

export function getProjectPreferenceScore(
    symbol: PbSymbol,
    libraryGraph: PbLibraryGraph,
    project: PbProjectDefinition,
): number {
    return libraryGraph.getProjectMatchScoreForSourceFile(symbol.uri, project);
}

export function sortSymbolsByProjectPreference(
    symbols: PbSymbol[],
    libraryGraph: PbLibraryGraph,
    project: PbProjectDefinition,
): PbSymbol[] {
    return [...symbols].sort((left, right) => {
        const leftScore = getProjectPreferenceScore(left, libraryGraph, project);
        const rightScore = getProjectPreferenceScore(right, libraryGraph, project);

        if (rightScore !== leftScore) {
            return rightScore - leftScore;
        }

        return compareSymbolsByPosition(left, right);
    });
}