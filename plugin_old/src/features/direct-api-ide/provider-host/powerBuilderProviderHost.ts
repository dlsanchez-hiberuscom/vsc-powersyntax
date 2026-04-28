import * as vscode from 'vscode';
import {
    ExtensionConfig,
    getConfig,
} from '../../../core/config/extensionConfiguration';
import { isIdeSafePowerBuilderDocument } from '../../../core/utils/powerBuilderFileUtils';
import { SymbolIndex } from '../../../powerbuilder/indexing/symbolIndex';
import {
    SemanticEngine,
    SemanticQueryService,
} from '../../../powerbuilder/semantic';

export interface ProviderHostRunOptions<T> {
    emptyValue: T;
    isFeatureEnabled?: (config: ExtensionConfig) => boolean;
}

export interface PreparedPowerBuilderDocument {
    config: ExtensionConfig;
    document: vscode.TextDocument;
    index: SymbolIndex;
    semanticEngine: SemanticEngine;
    semanticQueries: SemanticQueryService;
}

export interface PreparedPowerBuilderPositionContext<TContext>
    extends PreparedPowerBuilderDocument {
    position: vscode.Position;
    context: TContext;
}

type PositionContextFactory<TContext> = (
    document: vscode.TextDocument,
    position: vscode.Position,
) => TContext | undefined;

export class PowerBuilderProviderHost {
    readonly index: SymbolIndex;
    readonly semanticEngine: SemanticEngine;
    readonly semanticQueries: SemanticQueryService;

    constructor(index: SymbolIndex = SymbolIndex.getInstance()) {
        this.index = index;
        this.semanticEngine = new SemanticEngine(index);
        this.semanticQueries = new SemanticQueryService(index, this.semanticEngine);
    }

    runWithDocument<T>(
        document: vscode.TextDocument,
        options: ProviderHostRunOptions<T>,
        work: (prepared: PreparedPowerBuilderDocument) => T,
    ): T {
        const prepared = this.prepareDocument(
            document,
            options.isFeatureEnabled,
        );

        return prepared ? work(prepared) : options.emptyValue;
    }

    async runWithDocumentAsync<T>(
        document: vscode.TextDocument,
        options: ProviderHostRunOptions<T>,
        work: (prepared: PreparedPowerBuilderDocument) => Promise<T>,
    ): Promise<T> {
        const prepared = this.prepareDocument(
            document,
            options.isFeatureEnabled,
        );

        return prepared ? work(prepared) : options.emptyValue;
    }

    runWithPositionContext<TContext, T>(
        document: vscode.TextDocument,
        position: vscode.Position,
        contextFactory: PositionContextFactory<TContext>,
        options: ProviderHostRunOptions<T>,
        work: (prepared: PreparedPowerBuilderPositionContext<TContext>) => T,
    ): T {
        const prepared = this.preparePositionContext(
            document,
            position,
            contextFactory,
            options.isFeatureEnabled,
        );

        return prepared ? work(prepared) : options.emptyValue;
    }

    async runWithPositionContextAsync<TContext, T>(
        document: vscode.TextDocument,
        position: vscode.Position,
        contextFactory: PositionContextFactory<TContext>,
        options: ProviderHostRunOptions<T>,
        work: (prepared: PreparedPowerBuilderPositionContext<TContext>) => Promise<T>,
    ): Promise<T> {
        const prepared = this.preparePositionContext(
            document,
            position,
            contextFactory,
            options.isFeatureEnabled,
        );

        return prepared ? work(prepared) : options.emptyValue;
    }

    private preparePositionContext<TContext>(
        document: vscode.TextDocument,
        position: vscode.Position,
        contextFactory: PositionContextFactory<TContext>,
        isFeatureEnabled?: (config: ExtensionConfig) => boolean,
    ): PreparedPowerBuilderPositionContext<TContext> | undefined {
        const prepared = this.prepareDocument(document, isFeatureEnabled);

        if (!prepared) {
            return undefined;
        }

        const context = contextFactory(document, position);

        if (!context) {
            return undefined;
        }

        return {
            ...prepared,
            position,
            context,
        };
    }

    private prepareDocument(
        document: vscode.TextDocument,
        isFeatureEnabled?: (config: ExtensionConfig) => boolean,
    ): PreparedPowerBuilderDocument | undefined {
        const config = getConfig();

        if (isFeatureEnabled && !isFeatureEnabled(config)) {
            return undefined;
        }

        if (!isIdeSafePowerBuilderDocument(document, config.dataWindowExperimentalIdeEnabled)) {
            return undefined;
        }

        this.index.indexDocument(document, { silent: true });

        return {
            config,
            document,
            index: this.index,
            semanticEngine: this.semanticEngine,
            semanticQueries: this.semanticQueries,
        };
    }
}