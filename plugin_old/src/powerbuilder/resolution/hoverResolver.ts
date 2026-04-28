import * as vscode from 'vscode';
import { SymbolContext } from '../document/documentUtils';
import { SymbolIndex } from '../indexing/symbolIndex';
import { SemanticQueryService } from '../semantic';

export class HoverResolver {
    private readonly semanticQueries: SemanticQueryService;

    constructor(private readonly index: SymbolIndex) {
        this.semanticQueries = new SemanticQueryService(index);
    }

    resolve(
        word: string,
        uri: vscode.Uri,
        position?: vscode.Position,
        symbolContext?: Pick<SymbolContext, 'qualifiedOwner' | 'qualifiedOwnerExpression' | 'qualifier' | 'range' | 'statement' | 'providedArgumentCount' | 'isDynamicDispatch' | 'dynamicDispatchKind' | 'isAncestorControlCall' | 'isAncestorReturnValue'>,
    ): string | undefined {
        return this.semanticQueries.resolveHoverAtPosition({
            uri,
            word,
            position,
            context: symbolContext,
        }).content?.markdown;
    }
}