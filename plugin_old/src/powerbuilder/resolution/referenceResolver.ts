import * as vscode from 'vscode';
import { SymbolIndex } from '../indexing/symbolIndex';
import { SemanticQueryService } from '../semantic';
import {
    PbSymbolResolutionContext,
} from './symbolResolution';

export class ReferenceResolver {
    private readonly semanticQueries: SemanticQueryService;

    constructor(private readonly index: SymbolIndex) {
        this.semanticQueries = new SemanticQueryService(index);
    }

    resolve(
        word: string,
        uri: vscode.Uri,
        includeDeclaration: boolean,
        symbolContext?: PbSymbolResolutionContext,
    ): vscode.Location[] {
        if (!includeDeclaration) {
            return [];
        }

        return this.semanticQueries.resolveDefinition({
            word,
            uri,
            symbolContext,
        }).locations;
    }

    async resolveInWorkspace(
        word: string,
        uri: vscode.Uri,
        includeDeclaration: boolean,
        symbolContext?: PbSymbolResolutionContext,
    ): Promise<vscode.Location[]> {
        const query = await this.semanticQueries.resolveReferences({
            word,
            uri,
            includeDeclaration,
            symbolContext,
        });

        return query.locations;
    }

}