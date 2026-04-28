import * as vscode from 'vscode';
import { SymbolIndex } from '../indexing/symbolIndex';
import { SemanticQueryService } from '../semantic';
import { PbSymbolResolutionContext } from './symbolResolution';

export class RenameResolver {
    private readonly semanticQueries: SemanticQueryService;

    constructor(private readonly index: SymbolIndex) {
        this.semanticQueries = new SemanticQueryService(index);
    }

    prepareRename(
        word: string,
        uri: vscode.Uri,
        symbolContext?: PbSymbolResolutionContext,
    ) {
        return this.semanticQueries.resolveRenameTargetAtPosition({
            word,
            uri,
            symbolContext,
        });
    }

    canRename(
        word: string,
        uri: vscode.Uri,
        symbolContext?: PbSymbolResolutionContext,
    ): boolean {
        return this.prepareRename(
            word,
            uri,
            symbolContext,
        ).canRename;
    }

    async computeEdits(
        oldName: string,
        newName: string,
        uri: vscode.Uri,
        symbolContext?: PbSymbolResolutionContext,
    ): Promise<vscode.WorkspaceEdit | undefined> {
        const rename = await this.semanticQueries.resolveRenameEdits({
            word: oldName,
            newName,
            uri,
            symbolContext,
        });

        return rename.edit;
    }

}