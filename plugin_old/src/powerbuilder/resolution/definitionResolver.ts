import * as vscode from 'vscode';
import { SymbolIndex } from '../indexing/symbolIndex';
import { SemanticQueryService } from '../semantic';
import { PbSymbolResolutionContext } from './symbolResolution';

export class DefinitionResolver {
    private readonly semanticQueries: SemanticQueryService;

    constructor(private readonly index: SymbolIndex) {
        this.semanticQueries = new SemanticQueryService(index);
    }

    resolve(
        word: string,
        uri: vscode.Uri,
        symbolContext?: PbSymbolResolutionContext,
    ): vscode.Location[] {
        return this.semanticQueries.resolveDefinition({
            word,
            uri,
            symbolContext,
        }).locations;
    }
}