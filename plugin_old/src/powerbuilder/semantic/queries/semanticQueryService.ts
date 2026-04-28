import * as vscode from 'vscode';
import {
    createCodeMask,
    isCodeRange,
} from '../../../core/utils/powerScriptLexingUtils';
import {
    getCompletionContextAtPosition,
    SymbolContext,
} from '../../document/documentUtils';
import { IDENTIFIER_SOURCE } from '../../grammar/pbLanguageGrammar';
import {
    isPbIdentifierChar,
    isValidPbIdentifierName,
} from '../../grammar/pbIdentifier';
import { SymbolIndex } from '../../indexing/symbolIndex';
import {
    listSystemEventsForOwner,
    listSystemGlobalFunctions,
    listSystemMemberFunctionsForOwner,
    resolveSystemEvent,
    resolveSystemEventForOwner,
    resolveSystemGlobalFunction,
    resolveSystemStatement,
} from '../../knowledge/services/queryService';
import { PbSystemSymbolEntry } from '../../knowledge/types';
import { PbSymbol } from '../../models/pbSymbol';
import { mapPositionToStatementOffset } from '../../document/powerScriptDocumentModel';
import {
    resolveOwnerTypeNamesAtPosition,
    resolveSystemCallAtPosition,
    resolveSystemMemberAtPosition,
} from '../binding/systemMemberBinding';
import { PbSemanticEvidence } from '../contracts';
import {
    buildAncestorReturnValueHoverContent,
    buildSymbolHoverContent,
    buildSystemHoverContent,
} from '../hover/presentation';
import { buildCallableSuggestion } from '../callableSuggestions';
import { SemanticEngine } from '../semanticEngine';
import { PbSemanticResolutionContext } from '../semanticContext';
import {
    buildEmptyResolveSymbolResult,
    resolveSignatureQueryContext,
    resolveSymbolQueryContext,
    toSemanticResolutionContext,
} from './queryContext';
import {
    buildSemanticEvidence,
    buildSemanticQueryEvidence,
    buildSemanticQueryReasons,
    getSemanticQueryPrecision,
} from './queryPrecision';
import {
    ExplainAmbiguityArgs,
    ExplainAmbiguityResult,
    FindReferencesArgs,
    FindReferencesResult,
    PlanRenameArgs,
    PlanRenameResult,
    ResolveDefinitionArgs,
    ResolveDefinitionResult,
    ResolveLinkedEditingRangesArgs,
    ResolveLinkedEditingRangesResult,
    ResolveHoverAtPositionArgs,
    ResolveHoverAtPositionResult,
    ResolveCallAtPositionArgs,
    ResolveCallAtPositionResult,
    ResolveCompletionAtPositionArgs,
    ResolveCompletionAtPositionResult,
    ResolveReferencesResult,
    ResolveRenameEditsArgs,
    ResolveRenameEditsResult,
    ResolveRenameTargetArgs,
    ResolveRenameTargetResult,
    ResolveSignatureAtPositionArgs,
    ResolveSignatureAtPositionResult,
    ResolveSymbolAtPositionArgs,
    ResolveSymbolAtPositionResult,
} from './contracts';
import { getLogicalSymbolKey } from '../occurrences/occurrenceMatching';
import {
    getNormalizedOwnerNames,
    getOwnerTypingAssessmentAtPosition,
    OwnerTypingAssessment,
} from '../owners/ownerResolution';
import { getInheritanceGraph } from '../inheritanceGraph';

const DECLARATION_TYPE_SOURCE = '[a-zA-Z_$#%][\\w$#%`-]*(?:\\s*\\[\\s*\\])?';
const VARIABLE_DECLARATION_TYPE_PATTERN = new RegExp(
    '^(\\s*(?:(?:public|private|protected|global|shared|privateread|privatewrite|protectedread|protectedwrite)\\s+)?(?:(?:readonly|constant)\\s+)?)(' +
        DECLARATION_TYPE_SOURCE +
        ')(\\s+' +
        IDENTIFIER_SOURCE +
        '\\s*(?:\\[[^\\]]*\\])?)',
    'i',
);

type OwnerTypingCapableContext = {
    qualifiedOwner?: string;
    qualifiedOwnerExpression?: string;
    qualifier?: '.' | '::';
    isDynamicDispatch?: boolean;
    dynamicDispatchKind?: PbSemanticResolutionContext['dynamicDispatchKind'];
    isAncestorControlCall?: boolean;
    isAncestorReturnValue?: boolean;
    providedArgumentCount?: number;
    range?: vscode.Range;
};

type ContextWithOwnerTyping<T extends OwnerTypingCapableContext> = T & {
    ownerTyping?: OwnerTypingAssessment;
};

type OwnerTypingAwareCompletionContext = ContextWithOwnerTyping<
    NonNullable<ResolveCompletionAtPositionResult['context']>
>;

type OwnerTypingAwareSignatureContext = ContextWithOwnerTyping<
    NonNullable<ResolveSignatureAtPositionResult['context']>
>;

export class SemanticQueryService {
    constructor(
        private readonly index: SymbolIndex,
        private readonly semanticEngine: SemanticEngine = new SemanticEngine(index),
    ) {}

    private attachOwnerTyping<T extends OwnerTypingCapableContext>(
        uri: vscode.Uri,
        position: vscode.Position | undefined,
        context: T | undefined,
        primarySymbol?: PbSymbol,
    ): ContextWithOwnerTyping<T> | undefined {
        if (!context || !position || (!context.qualifiedOwner && !context.qualifiedOwnerExpression)) {
            return context;
        }

        return {
            ...context,
            ownerTyping: getOwnerTypingAssessmentAtPosition(
                context,
                this.index,
                uri,
                position,
                primarySymbol,
            ),
        };
    }

    resolvePreferredSymbols(
        word: string,
        uri: vscode.Uri,
        symbolContext?: PbSemanticResolutionContext,
    ): PbSymbol[] {
        return this.semanticEngine.resolvePreferredSymbols(
            word,
            uri,
            symbolContext,
        );
    }

    resolveRenameTarget(
        word: string,
        uri: vscode.Uri,
        symbolContext?: PbSemanticResolutionContext,
    ) {
        return this.semanticEngine.resolveRenameTarget(
            word,
            uri,
            symbolContext,
        );
    }

    resolveSystemMemberForPosition(
        word: string,
        uri: vscode.Uri,
        position: vscode.Position,
        symbolContext?: PbSemanticResolutionContext,
    ): PbSystemSymbolEntry | undefined {
        return this.semanticEngine.resolveSystemMemberForPosition(
            word,
            uri,
            position,
            symbolContext,
        );
    }

    resolveDefinition(
        args: ResolveDefinitionArgs,
    ): ResolveDefinitionResult {
        return this.resolveNavigationQuery(args, 'definition');
    }

    resolveDeclaration(
        args: ResolveDefinitionArgs,
    ): ResolveDefinitionResult {
        return this.resolveNavigationQuery(args, 'declaration');
    }

    resolveImplementations(
        args: ResolveDefinitionArgs,
    ): ResolveDefinitionResult {
        return this.resolveNavigationQuery(args, 'implementation');
    }

    private resolveNavigationQuery(
        args: ResolveDefinitionArgs,
        mode: 'definition' | 'declaration' | 'implementation',
    ): ResolveDefinitionResult {
        const word = args.word.trim();

        if (!word) {
            return {
                symbols: [],
                primarySymbol: undefined,
                locations: [],
                precision: 'blocked',
                reasons: [{
                    code: 'no-context',
                    detail: 'No hay palabra resoluble para buscar la definición.',
                }],
                evidence: [],
            };
        }

        const symbols = this.semanticEngine.resolvePreferredSymbols(
            word,
            args.uri,
            args.symbolContext,
        );
        const primarySymbol = this.semanticEngine.resolveSafePrimarySymbol(
            word,
            args.uri,
            args.symbolContext,
        );
        const precisionContext = this.attachOwnerTyping(
            args.uri,
            args.symbolContext?.range?.start,
            args.symbolContext,
            primarySymbol,
        );
        const navigationSymbols = this.selectNavigationSymbols(symbols, mode);
        const navigationPrimarySymbol = this.selectNavigationPrimarySymbol(
            navigationSymbols,
            primarySymbol,
        );
        const rawLocations = this.toUniqueLocations(navigationSymbols);
        const precision = rawLocations.length > 0
            ? this.getNavigationPrecision(mode, navigationSymbols, navigationPrimarySymbol, precisionContext)
            : 'blocked';
        const locations = this.shouldPublishNavigationLocations(precision)
            ? rawLocations
            : [];

        return {
            symbols: navigationSymbols,
            primarySymbol: navigationPrimarySymbol,
            locations,
            precision,
            reasons: rawLocations.length > 0
                ? this.buildNavigationReasons(mode, navigationSymbols, navigationPrimarySymbol, precisionContext)
                : [{
                    code: 'no-candidates',
                    detail: this.getNavigationEmptyDetail(mode),
                }],
            evidence: rawLocations.length > 0
                ? this.buildNavigationEvidence(mode, navigationSymbols, navigationPrimarySymbol, precisionContext)
                : [],
        };
    }

    resolveHoverAtPosition(
        args: ResolveHoverAtPositionArgs,
    ): ResolveHoverAtPositionResult {
        const context = args.context ?? (
            args.document && args.position
                ? resolveSymbolQueryContext(args.document, args.position, args.context)
                : undefined
        );
        const word = (context?.word ?? args.word ?? '').trim();
        const position = args.position ?? context?.range.start;

        if (context?.isDynamicDispatch || context?.isAncestorControlCall) {
            return {
                context,
                primarySymbol: undefined,
                systemEntry: undefined,
                content: undefined,
                precision: 'blocked',
                reasons: buildSemanticQueryReasons([], undefined, context),
                evidence: buildSemanticQueryEvidence([], undefined, context),
            };
        }

        if (context?.isAncestorReturnValue) {
            return {
                context,
                primarySymbol: undefined,
                systemEntry: undefined,
                content: buildAncestorReturnValueHoverContent(),
                precision: 'heuristic',
                reasons: buildSemanticQueryReasons([], undefined, context),
                evidence: [buildSemanticEvidence(
                    'runtime-special',
                    'heuristic',
                    'AncestorReturnValue produce solo hover explicativo y degradado.',
                )],
            };
        }

        if (!word) {
            return {
                context,
                primarySymbol: undefined,
                systemEntry: undefined,
                content: undefined,
                precision: 'blocked',
                reasons: [{
                    code: 'no-context',
                    detail: 'No hay palabra resoluble bajo el cursor para construir hover.',
                }],
                evidence: [],
            };
        }

        const symbolContext = context
            ? toSemanticResolutionContext(context)
            : undefined;
        const isQualifiedLookup = !!context?.qualifiedOwner;
        const symbols = this.semanticEngine.resolvePreferredSymbols(
            word,
            args.uri,
            symbolContext,
        );
        const primarySymbol = this.semanticEngine.resolveSafePrimarySymbol(
            word,
            args.uri,
            symbolContext,
        );
        const precisionContext = position
            ? this.attachOwnerTyping(args.uri, position, context, primarySymbol)
            : context;

        if (primarySymbol?.kind === 'event') {
            const precision = getSemanticQueryPrecision(symbols, primarySymbol, precisionContext);
            const reasons = buildSemanticQueryReasons(symbols, primarySymbol, precisionContext);
            const evidence = buildSemanticQueryEvidence(symbols, primarySymbol, precisionContext);
            const callableSuggestion = buildCallableSuggestion(primarySymbol, precision);

            return {
                context,
                primarySymbol,
                systemEntry: undefined,
                content: buildSymbolHoverContent(primarySymbol, {
                    callableSuggestion,
                    systemEntry: this.resolveSystemHoverSupplement(primarySymbol),
                }),
                precision,
                reasons,
                evidence,
            };
        }

        if (!isQualifiedLookup && !isVariableDeclarationTypeContext(context)) {
            const systemGlobal = resolveSystemGlobalFunction(word);

            if (systemGlobal) {
                return this.buildSystemHoverResult(
                    context,
                    systemGlobal,
                    'system-global',
                    `El hover se resolvió contra la función global integrada ${systemGlobal.name}.`,
                );
            }
        }
        const precision = getSemanticQueryPrecision(symbols, primarySymbol, precisionContext);
        const reasons = buildSemanticQueryReasons(symbols, primarySymbol, precisionContext);
        const evidence = buildSemanticQueryEvidence(symbols, primarySymbol, precisionContext);

        if (primarySymbol) {
            const callableSuggestion = buildCallableSuggestion(primarySymbol, precision);

            return {
                context,
                primarySymbol,
                systemEntry: undefined,
                content: buildSymbolHoverContent(primarySymbol, {
                    callableSuggestion,
                    systemEntry: this.resolveSystemHoverSupplement(primarySymbol),
                }),
                precision,
                reasons,
                evidence,
            };
        }

        if (isQualifiedLookup && position && context) {
            const systemMember = resolveSystemMemberAtPosition({
                index: this.index,
                word,
                uri: args.uri,
                position,
                context,
            });

            if (systemMember) {
                return this.buildSystemHoverResult(
                    context,
                    systemMember,
                    'system-member',
                    `El hover se resolvió owner-aware contra ${systemMember.name}.`,
                );
            }
        }

        if (!isQualifiedLookup) {
            const systemStatement = resolveSystemStatement(word);

            if (systemStatement) {
                return this.buildSystemHoverResult(
                    context,
                    systemStatement,
                    'statement',
                    `El hover se resolvió contra la sentencia integrada ${systemStatement.name}.`,
                );
            }
        }

        return {
            context,
            primarySymbol,
            systemEntry: undefined,
            content: undefined,
            precision,
            reasons,
            evidence,
        };
    }

    resolveSymbolAtPosition(
        args: ResolveSymbolAtPositionArgs,
    ): ResolveSymbolAtPositionResult {
        const context = resolveSymbolQueryContext(
            args.document,
            args.position,
            args.context,
        );

        if (!context) {
            return buildEmptyResolveSymbolResult('blocked', [{
                code: 'no-context',
                detail: 'No se pudo construir contexto documental en la posición pedida.',
            }]);
        }

        const symbolContext = toSemanticResolutionContext(context);
        const symbols = this.semanticEngine.resolvePreferredSymbols(
            context.word,
            args.document.uri,
            symbolContext,
        );
        const primarySymbol = this.semanticEngine.resolveSafePrimarySymbol(
            context.word,
            args.document.uri,
            symbolContext,
        );
        const precisionContext = this.attachOwnerTyping(
            args.document.uri,
            args.position,
            context,
            primarySymbol,
        );

        return {
            context,
            symbols,
            primarySymbol,
            precision: getSemanticQueryPrecision(symbols, primarySymbol, precisionContext),
            reasons: buildSemanticQueryReasons(symbols, primarySymbol, precisionContext),
            evidence: buildSemanticQueryEvidence(symbols, primarySymbol, precisionContext),
        };
    }

    resolveCallAtPosition(
        args: ResolveCallAtPositionArgs,
    ): ResolveCallAtPositionResult {
        const symbolResult = this.resolveSymbolAtPosition(args);
        const context = symbolResult.context;

        if (!context) {
            return {
                ...symbolResult,
                systemEntry: undefined,
            };
        }

        const systemEntry = context.range.start
            ? resolveSystemMemberAtPosition({
                index: this.index,
                word: context.word,
                uri: args.document.uri,
                position: args.position,
                context,
            })
            : undefined;

        return {
            ...symbolResult,
            precision: systemEntry
                ? 'exact'
                : symbolResult.precision,
            reasons: systemEntry
                ? []
                : symbolResult.reasons,
            evidence: systemEntry
                ? [buildSemanticEvidence(
                    'system-member',
                    'exact',
                    `La llamada se resolvió contra el miembro integrado ${systemEntry.name}.`,
                )]
                : symbolResult.evidence,
            systemEntry,
        };
    }

    resolveCompletionAtPosition(
        args: ResolveCompletionAtPositionArgs,
    ): ResolveCompletionAtPositionResult {
        const completion = this.semanticEngine.resolveCompletionAtPosition(
            args.document,
            args.position,
        );
        const context = args.context ?? completion.context;
        const precisionContext = context
            ? this.attachOwnerTyping(args.document.uri, args.position, context)
            : undefined;
        const ownerTypeNames = context?.isQualifiedAccess
            ? resolveOwnerTypeNamesAtPosition({
                index: this.index,
                uri: args.document.uri,
                position: args.position,
                context,
            })
            : [];
        const systemEntries = this.getCompletionSystemEntries(
            args.document.uri,
            args.position,
            context,
            ownerTypeNames,
            context?.word ?? '',
        );
        const precision = this.getCompletionPrecision(
            precisionContext,
            completion.symbols,
            systemEntries,
            ownerTypeNames,
        );

        return {
            context,
            symbols: completion.symbols,
            systemEntries,
            ownerTypeNames,
            isIncomplete: this.isCompletionIncomplete(
                precision,
                completion.symbols,
                systemEntries,
            ),
            precision,
            reasons: this.buildCompletionReasons(
                precisionContext,
                completion.symbols,
                systemEntries,
                ownerTypeNames,
            ),
            evidence: this.buildCompletionEvidence(
                precisionContext,
                completion.symbols,
                systemEntries,
                ownerTypeNames,
                precision,
            ),
        };
    }

    resolveSignatureAtPosition(
        args: ResolveSignatureAtPositionArgs,
    ): ResolveSignatureAtPositionResult {
        const context = resolveSignatureQueryContext(
            args.document,
            args.position,
            args.context,
        );

        if (!context) {
            return {
                context: undefined,
                symbols: [],
                systemEntry: undefined,
                shouldProvideHelp: false,
                precision: 'blocked',
                reasons: [{
                    code: 'no-context',
                    detail: 'No se detectó una llamada activa para calcular la firma.',
                }],
                evidence: [],
            };
        }

        if (context.isDynamicDispatch) {
            return {
                context,
                symbols: [],
                systemEntry: undefined,
                shouldProvideHelp: false,
                precision: 'blocked',
                reasons: [{
                    code: 'dynamic-dispatch',
                    detail: 'Las llamadas DYNAMIC no tienen una firma segura en P0.',
                }],
                evidence: [buildSemanticEvidence(
                    'runtime-special',
                    'blocked',
                    'Signature help se bloquea en llamadas DYNAMIC.',
                )],
            };
        }

        if (context.isAncestorControlCall) {
            return {
                context,
                symbols: [],
                systemEntry: undefined,
                shouldProvideHelp: false,
                precision: 'blocked',
                reasons: [{
                    code: 'ancestor-control',
                    detail: 'Las llamadas CALL al ancestro degradan la firma por seguridad.',
                }],
                evidence: [buildSemanticEvidence(
                    'runtime-special',
                    'blocked',
                    'Signature help se bloquea en llamadas CALL al ancestro.',
                )],
            };
        }

        const systemEntry = resolveSystemCallAtPosition({
            index: this.index,
            context,
            uri: args.document.uri,
            position: args.position,
        });

        if (systemEntry) {
            return {
                context,
                symbols: [],
                systemEntry,
                shouldProvideHelp: true,
                precision: 'exact',
                reasons: [],
                evidence: [buildSemanticEvidence(
                    'system-member',
                    'exact',
                    `La firma se resolvió contra el símbolo integrado ${systemEntry.name}.`,
                )],
            };
        }

        const symbols = this.semanticEngine.resolvePreferredSymbols(
            context.name,
            args.document.uri,
            {
                qualifiedOwner: context.qualifiedOwner,
                qualifiedOwnerExpression: context.qualifiedOwnerExpression,
                qualifier: context.qualifier,
                isDynamicDispatch: context.isDynamicDispatch,
                dynamicDispatchKind: context.dynamicDispatchKind,
                isAncestorControlCall: context.isAncestorControlCall,
                range: context.range,
                providedArgumentCount: context.providedArgumentCount,
            },
        )
            .filter(symbol => this.isSignatureHelpSymbol(symbol));
        const dedupedSymbols = this.dedupeSignatureHelpSymbols(symbols);
        const precisionContext = this.attachOwnerTyping(
            args.document.uri,
            args.position,
            context,
            dedupedSymbols[0],
        );
        const signaturePrecision = this.getSignaturePrecision(
            dedupedSymbols,
            precisionContext,
        );

        return {
            context,
            symbols: dedupedSymbols,
            systemEntry: undefined,
            shouldProvideHelp: (
                signaturePrecision !== 'ambiguous'
                && signaturePrecision !== 'blocked'
            ),
            precision: signaturePrecision,
            reasons: this.buildSignatureReasons(dedupedSymbols, precisionContext),
            evidence: this.buildSignatureEvidence(
                dedupedSymbols,
                precisionContext,
                signaturePrecision,
            ),
        };
    }

    async resolveReferences(
        args: FindReferencesArgs,
    ): Promise<ResolveReferencesResult> {
        const word = args.word.trim();

        if (!word) {
            return {
                query: {
                    resolvedSymbols: [],
                    occurrences: [],
                },
                locations: [],
                precision: 'blocked',
                reasons: [{
                    code: 'no-context',
                    detail: 'No hay palabra resoluble para buscar referencias.',
                }],
                evidence: [],
            };
        }

        const query = await this.findReferences({
            ...args,
            word,
        });
        const rawLocations = query.occurrences.map(occurrence =>
            new vscode.Location(occurrence.uri, occurrence.range),
        );
        const precision = this.getReferencePrecision(query, args.symbolContext);
        const locations = this.shouldPublishNavigationLocations(precision)
            ? rawLocations
            : [];

        return {
            query,
            locations,
            precision,
            reasons: this.buildReferenceReasons(query, args.symbolContext),
            evidence: this.buildReferenceEvidence(query, precision),
        };
    }

    async findReferences(
        args: FindReferencesArgs,
    ): Promise<FindReferencesResult> {
        return this.semanticEngine.findReferences(
            args.word,
            args.uri,
            args.includeDeclaration,
            args.symbolContext,
        );
    }

    async planRename(
        args: PlanRenameArgs,
    ): Promise<PlanRenameResult> {
        return this.semanticEngine.planRename(
            args.word,
            args.uri,
            args.symbolContext,
        );
    }

    resolveRenameTargetAtPosition(
        args: ResolveRenameTargetArgs,
    ): ResolveRenameTargetResult {
        const word = args.word.trim();

        if (!word) {
            return {
                canRename: false,
                renameTarget: undefined,
                precision: 'blocked',
                reasons: [{
                    code: 'no-context',
                    detail: 'No hay palabra resoluble para preparar rename.',
                }],
                evidence: [],
            };
        }

        if (args.symbolContext?.range?.start) {
            const systemMember = this.resolveSystemMemberForPosition(
                word,
                args.uri,
                args.symbolContext.range.start,
                args.symbolContext,
            );

            if (systemMember) {
                return {
                    canRename: false,
                    renameTarget: undefined,
                    precision: 'blocked',
                    reasons: [{
                        code: 'system-member',
                        detail: `No se permite rename sobre el miembro integrado ${systemMember.name}.`,
                    }],
                    evidence: [buildSemanticEvidence(
                        'system-member',
                        'blocked',
                        `Rename se bloqueó porque ${systemMember.name} es un símbolo integrado.`,
                    )],
                };
            }
        }

        const renameTarget = this.resolveRenameTarget(
            word,
            args.uri,
            args.symbolContext,
        );

        if (renameTarget) {
            return {
                canRename: true,
                renameTarget,
                precision: 'exact',
                reasons: [],
                evidence: this.buildRenameTargetEvidence(renameTarget, 'exact'),
            };
        }

        const symbols = this.semanticEngine.resolvePreferredSymbols(
            word,
            args.uri,
            args.symbolContext,
        );

        if (symbols.some(symbol => symbol.isExternal)) {
            return {
                canRename: false,
                renameTarget: undefined,
                precision: 'blocked',
                reasons: [{
                    code: 'external-symbol',
                    detail: 'No se permite rename sobre símbolos externos o heredados fuera del workspace activo.',
                }],
                evidence: [buildSemanticEvidence(
                    'project-scope',
                    'blocked',
                    'Rename se bloqueó porque el símbolo resuelto pertenece a una superficie externa.',
                )],
            };
        }

        return {
            canRename: false,
            renameTarget: undefined,
            precision: getSemanticQueryPrecision(
                symbols,
                undefined,
                this.attachOwnerTyping(
                    args.uri,
                    args.symbolContext?.range?.start,
                    args.symbolContext,
                ),
            ),
            reasons: buildSemanticQueryReasons(
                symbols,
                undefined,
                this.attachOwnerTyping(
                    args.uri,
                    args.symbolContext?.range?.start,
                    args.symbolContext,
                ),
            ),
            evidence: buildSemanticQueryEvidence(
                symbols,
                undefined,
                this.attachOwnerTyping(
                    args.uri,
                    args.symbolContext?.range?.start,
                    args.symbolContext,
                ),
            ),
        };
    }

    async resolveLinkedEditingRangesAtPosition(
        args: ResolveLinkedEditingRangesArgs,
    ): Promise<ResolveLinkedEditingRangesResult> {
        if (!args.document) {
            return {
                ranges: [],
                precision: 'blocked',
                reasons: [{
                    code: 'no-context',
                    detail: 'No hay documento activo para calcular linked editing.',
                }],
                evidence: [],
            };
        }

        const renameTargetResult = this.resolveRenameTargetAtPosition(args);

        if (!renameTargetResult.canRename || !renameTargetResult.renameTarget) {
            return {
                ranges: [],
                precision: renameTargetResult.precision,
                reasons: renameTargetResult.reasons,
                evidence: renameTargetResult.evidence,
            };
        }

        const target = renameTargetResult.renameTarget.target;

        if (target.declarationScope !== 'local' && target.declarationScope !== 'parameter') {
            return {
                ranges: [],
                precision: 'blocked',
                reasons: [{
                    code: 'no-candidates',
                    detail: 'Linked editing solo se publica para parametros y locales con target seguro.',
                }],
                evidence: [buildSemanticEvidence(
                    'callable-scope',
                    'blocked',
                    'Linked editing se retiró porque el target no pertenece al scope local del callable.',
                )],
            };
        }

        const callable = this.index.findInnermostCallableAtPosition(
            args.uri,
            args.symbolContext?.range?.start ?? target.selectionRange.start,
        );

        if (!callable) {
            return {
                ranges: [],
                precision: 'blocked',
                reasons: [{
                    code: 'no-context',
                    detail: 'No se pudo acotar el callable activo para calcular linked editing.',
                }],
                evidence: renameTargetResult.evidence,
            };
        }

        const ranges = this.collectLinkedEditingRanges(
            args.document,
            callable.range,
            args.word,
            renameTargetResult.renameTarget.family,
        );

        if (ranges.length < 2) {
            return {
                ranges: [],
                precision: 'blocked',
                reasons: [{
                    code: 'no-occurrences',
                    detail: 'Linked editing requiere al menos dos ocurrencias editables en el callable activo.',
                }],
                evidence: renameTargetResult.evidence,
            };
        }

        return {
            ranges,
            precision: 'exact',
            reasons: [],
            evidence: [buildSemanticEvidence(
                'callable-scope',
                'exact',
                `Linked editing publicó ${ranges.length} rango(s) editables para ${target.name}.`,
            )],
        };
    }

    async resolveRenameEdits(
        args: ResolveRenameEditsArgs,
    ): Promise<ResolveRenameEditsResult> {
        const newName = args.newName.trim();

        if (!newName) {
            return {
                renamePlan: undefined,
                edit: undefined,
                precision: 'blocked',
                reasons: [{
                    code: 'invalid-name',
                    detail: 'El nuevo identificador no puede estar vacío.',
                }],
                evidence: [],
            };
        }

        if (!isValidPbIdentifierName(newName)) {
            return {
                renamePlan: undefined,
                edit: undefined,
                precision: 'blocked',
                reasons: [{
                    code: 'invalid-name',
                    detail: `El identificador ${newName} no es válido en PowerBuilder.`,
                }],
                evidence: [],
            };
        }

        const renameTarget = this.resolveRenameTargetAtPosition(args);

        if (!renameTarget.canRename || !renameTarget.renameTarget) {
            return {
                renamePlan: undefined,
                edit: undefined,
                precision: renameTarget.precision,
                reasons: renameTarget.reasons,
                evidence: renameTarget.evidence,
            };
        }

        const renamePlan = await this.planRename({
            word: args.word.trim(),
            uri: args.uri,
            symbolContext: args.symbolContext,
        });

        if (!renamePlan || renamePlan.occurrences.length === 0) {
            return {
                renamePlan: undefined,
                edit: undefined,
                precision: 'blocked',
                reasons: [{
                    code: 'no-occurrences',
                    detail: 'No se pudo construir un plan de rename con ocurrencias editables.',
                }],
                evidence: renameTarget.evidence,
            };
        }

        const precision = renamePlan.occurrences.some(occurrence =>
            occurrence.evidence.some(evidence => evidence.precision === 'heuristic'),
        )
            ? 'compatible'
            : 'exact';

        return {
            renamePlan,
            edit: this.buildRenameWorkspaceEdit(renamePlan, newName),
            precision,
            reasons: [],
            evidence: this.buildRenamePlanEvidence(renamePlan, precision),
        };
    }

    explainAmbiguity(
        args: ExplainAmbiguityArgs,
    ): ExplainAmbiguityResult {
        const symbols = this.semanticEngine.resolvePreferredSymbols(
            args.word,
            args.uri,
            args.symbolContext,
        );
        const primarySymbol = this.semanticEngine.resolveSafePrimarySymbol(
            args.word,
            args.uri,
            args.symbolContext,
        );
        const precisionContext = this.attachOwnerTyping(
            args.uri,
            args.symbolContext?.range?.start,
            args.symbolContext,
            primarySymbol,
        );

        return {
            symbols,
            primarySymbol,
            precision: getSemanticQueryPrecision(symbols, primarySymbol, precisionContext),
            reasons: buildSemanticQueryReasons(symbols, primarySymbol, precisionContext),
            evidence: buildSemanticQueryEvidence(symbols, primarySymbol, precisionContext),
        };
    }

    private buildSystemHoverResult(
        context: ResolveHoverAtPositionResult['context'],
        systemEntry: PbSystemSymbolEntry,
        evidenceKind: PbSemanticEvidence['kind'],
        evidenceDetail: string,
    ): ResolveHoverAtPositionResult {
        return {
            context,
            primarySymbol: undefined,
            systemEntry,
            content: buildSystemHoverContent(systemEntry),
            precision: 'exact',
            reasons: [],
            evidence: [buildSemanticEvidence(
                evidenceKind,
                'exact',
                evidenceDetail,
            )],
        };
    }

    private resolveSystemHoverSupplement(
        symbol: PbSymbol,
    ): PbSystemSymbolEntry | undefined {
        if (symbol.kind !== 'event') {
            return undefined;
        }

        if (!symbol.ownerName) {
            return resolveSystemEvent(symbol.name);
        }

        const ownerTypeNames = resolveOwnerTypeNamesAtPosition({
            index: this.index,
            uri: symbol.uri,
            position: symbol.selectionRange.start,
            context: {
                qualifiedOwner: symbol.ownerName,
                qualifier: '::',
            },
        });

        return ownerTypeNames.length > 0
            ? resolveSystemEventForOwner(symbol.name, ownerTypeNames) ?? resolveSystemEvent(symbol.name)
            : resolveSystemEvent(symbol.name);
    }

    private isSignatureHelpSymbol(symbol: PbSymbol): boolean {
        return (
            symbol.kind === 'function' ||
            symbol.kind === 'global-function' ||
            symbol.kind === 'subroutine' ||
            symbol.kind === 'event'
        ) && !!symbol.signature?.trim();
    }

    private getCompletionSystemEntries(
        uri: vscode.Uri,
        position: vscode.Position,
        context: ResolveCompletionAtPositionResult['context'],
        ownerTypeNames: string[],
        prefix: string,
    ): PbSystemSymbolEntry[] {
        if (context?.isDynamicDispatch || context?.isAncestorControlCall) {
            return [];
        }

        if (context?.isQualifiedAccess) {
            const effectiveOwnerTypeNames = ownerTypeNames.length > 0
                ? ownerTypeNames
                : resolveOwnerTypeNamesAtPosition({
                    index: this.index,
                    uri,
                    position,
                    context,
                });

            if (effectiveOwnerTypeNames.length === 0) {
                return [];
            }

            const entries = context.qualifier === '::'
                ? listSystemEventsForOwner(effectiveOwnerTypeNames)
                : listSystemMemberFunctionsForOwner(effectiveOwnerTypeNames);

            return this.filterCompletionSystemEntries(entries, prefix);
        }

        return this.filterCompletionSystemEntries(listSystemGlobalFunctions(), prefix);
    }

    private filterCompletionSystemEntries(
        entries: readonly PbSystemSymbolEntry[],
        prefix: string,
    ): PbSystemSymbolEntry[] {
        const seenNames = new Set<string>();
        const filtered: PbSystemSymbolEntry[] = [];

        for (const entry of entries) {
            const normalizedName = entry.name.toLowerCase();

            if (seenNames.has(normalizedName) || !this.matchesCompletionPrefix(entry.name, prefix)) {
                continue;
            }

            seenNames.add(normalizedName);
            filtered.push(entry);
        }

        return filtered;
    }

    private getCompletionPrecision(
        context: OwnerTypingAwareCompletionContext | undefined,
        symbols: PbSymbol[],
        systemEntries: PbSystemSymbolEntry[],
        ownerTypeNames: string[],
    ): ResolveCompletionAtPositionResult['precision'] {
        const relevantIndexedOwnerTypeNames = this.getQualifiedCompletionIndexedOwnerTypeNames(
            symbols,
            ownerTypeNames,
        );
        const relevantSystemOwnerTypeNames = ownerTypeNames.filter(ownerTypeName =>
            systemEntries.some(entry => entry.normalizedOwnerTypes.includes(ownerTypeName)),
        );

        if (context?.isDynamicDispatch || context?.isAncestorControlCall) {
            return 'blocked';
        }

        if (context?.ownerTyping?.precision === 'blocked') {
            return 'blocked';
        }

        if (context?.isQualifiedAccess) {
            if (symbols.length === 0 && systemEntries.length === 0) {
                return 'blocked';
            }

            if (context.ownerTyping?.precision) {
                return context.ownerTyping.precision;
            }

            if (relevantIndexedOwnerTypeNames.length > 1) {
                return 'ambiguous';
            }

            return systemEntries.length > 0 && relevantSystemOwnerTypeNames.length > 1
                ? 'ambiguous'
                : 'exact';
        }

        return symbols.length > 0 || systemEntries.length > 0
            ? 'compatible'
            : 'blocked';
    }

    private isCompletionIncomplete(
        precision: ResolveCompletionAtPositionResult['precision'],
        symbols: PbSymbol[],
        systemEntries: PbSystemSymbolEntry[],
    ): boolean {
        if (symbols.length === 0 && systemEntries.length === 0) {
            return false;
        }

        return precision !== 'exact';
    }

    private buildCompletionReasons(
        context: OwnerTypingAwareCompletionContext | undefined,
        symbols: PbSymbol[],
        systemEntries: PbSystemSymbolEntry[],
        ownerTypeNames: string[],
    ): ResolveCompletionAtPositionResult['reasons'] {
        const relevantIndexedOwnerTypeNames = this.getQualifiedCompletionIndexedOwnerTypeNames(
            symbols,
            ownerTypeNames,
        );
        const relevantSystemOwnerTypeNames = ownerTypeNames.filter(ownerTypeName =>
            systemEntries.some(entry => entry.normalizedOwnerTypes.includes(ownerTypeName)),
        );

        if (!context && symbols.length === 0 && systemEntries.length === 0) {
            return [{
                code: 'no-context',
                detail: 'No se pudo construir contexto documental para completion.',
            }];
        }

        if (context?.isDynamicDispatch) {
            return [{
                code: 'dynamic-dispatch',
                detail: 'Completion fuerte se bloquea en llamadas DYNAMIC.',
            }];
        }

        if (context?.isAncestorControlCall) {
            return [{
                code: 'ancestor-control',
                detail: 'Completion fuerte se bloquea en llamadas CALL al ancestro.',
            }];
        }

        if (context?.ownerTyping?.precision === 'blocked') {
            return context.ownerTyping.reasons;
        }

        if (symbols.length === 0 && systemEntries.length === 0) {
            return [{
                code: 'no-candidates',
                detail: 'No se encontraron candidatos de completion en el contexto actual.',
            }];
        }

        if (context?.ownerTyping?.precision) {
            return [];
        }

        if (
            context?.isQualifiedAccess
            && (
                (relevantIndexedOwnerTypeNames.length > 1)
                || (systemEntries.length > 0 && relevantSystemOwnerTypeNames.length > 1)
            )
        ) {
            return [{
                code: 'multiple-candidates',
                detail: 'El owner calificado resuelve a múltiples tipos y el conjunto de completion queda ambiguo.',
            }];
        }

        return [];
    }

    private getQualifiedCompletionIndexedOwnerTypeNames(
        symbols: readonly PbSymbol[],
        ownerTypeNames: readonly string[],
    ): string[] {
        const resolvedOwnerTypeNames = new Set(ownerTypeNames);
        const indexedOwnerTypeNames = new Set<string>();

        for (const symbol of symbols) {
            if (symbol.kind === 'type' || symbol.kind === 'structure') {
                continue;
            }

            for (const ownerTypeName of getNormalizedOwnerNames(symbol)) {
                if (resolvedOwnerTypeNames.has(ownerTypeName)) {
                    indexedOwnerTypeNames.add(ownerTypeName);
                }
            }
        }

        return Array.from(indexedOwnerTypeNames);
    }

    private buildCompletionEvidence(
        context: OwnerTypingAwareCompletionContext | undefined,
        symbols: PbSymbol[],
        systemEntries: PbSystemSymbolEntry[],
        ownerTypeNames: string[],
        precision: ResolveCompletionAtPositionResult['precision'],
    ): PbSemanticEvidence[] {
        if (context?.isDynamicDispatch) {
            return [buildSemanticEvidence(
                'runtime-special',
                'blocked',
                'Completion se bloqueó porque el acceso usa DYNAMIC.',
            )];
        }

        if (context?.isAncestorControlCall) {
            return [buildSemanticEvidence(
                'runtime-special',
                'blocked',
                'Completion se bloqueó porque el acceso usa CALL al ancestro.',
            )];
        }

        if (context?.ownerTyping?.precision === 'blocked') {
            return context.ownerTyping.evidence;
        }

        const evidence: PbSemanticEvidence[] = [
            ...(context?.ownerTyping?.evidence ?? []),
        ];

        if (
            context?.isQualifiedAccess
            && ownerTypeNames.length > 0
            && !context.ownerTyping
        ) {
            evidence.push(buildSemanticEvidence(
                'owner-match',
                precision === 'ambiguous' ? 'compatible' : 'exact',
                `Completion se acotó con ${ownerTypeNames.length} owner type(s) resueltos.`,
            ));
        }

        if (symbols.length > 0) {
            evidence.push(buildSemanticEvidence(
                'candidate-ranking',
                precision,
                `Completion devolvió ${symbols.length} candidato(s) indexados.`,
            ));
        }

        if (systemEntries.length > 0) {
            evidence.push(buildSemanticEvidence(
                context?.isQualifiedAccess ? 'system-member' : 'system-global',
                context?.isQualifiedAccess ? precision : 'compatible',
                `Completion incorporó ${systemEntries.length} símbolo(s) integrados filtrados por contexto.`,
            ));
        }

        return evidence;
    }

    private getSignaturePrecision(
        symbols: PbSymbol[],
        context: OwnerTypingAwareSignatureContext | undefined,
    ): ResolveSignatureAtPositionResult['precision'] {
        if (context?.ownerTyping?.precision === 'blocked') {
            return 'blocked';
        }

        if (symbols.length === 0) {
            return 'blocked';
        }

        const familyKeys = new Set(symbols.map(symbol => this.getSignatureFamilyKey(symbol)));

        if (familyKeys.size > 1) {
            return 'ambiguous';
        }

        if (context?.ownerTyping?.precision === 'compatible') {
            return 'compatible';
        }

        return symbols.length > 1
            ? 'compatible'
            : 'exact';
    }

    private shouldPublishNavigationLocations(
        precision: ResolveDefinitionResult['precision'] | ResolveReferencesResult['precision'],
    ): boolean {
        return precision === 'exact' || precision === 'compatible';
    }

    private buildSignatureReasons(
        symbols: PbSymbol[],
        context: OwnerTypingAwareSignatureContext | undefined,
    ): ResolveSignatureAtPositionResult['reasons'] {
        if (context?.ownerTyping?.precision === 'blocked') {
            return context.ownerTyping.reasons;
        }

        if (symbols.length === 0) {
            return [{
                code: 'no-candidates',
                detail: 'No se encontró una firma indexada ni integrada para la llamada actual.',
            }];
        }

        if (new Set(symbols.map(symbol => this.getSignatureFamilyKey(symbol))).size > 1) {
            return [{
                code: 'multiple-candidates',
                detail: 'Persisten varias familias de firma compatibles y no existe una selección única segura.',
            }];
        }

        if (symbols.length > 1 && typeof context?.providedArgumentCount === 'number') {
            return [{
                code: 'no-primary-candidate',
                detail: 'La llamada conserva varias sobrecargas compatibles; signature help se mantiene degradado.',
            }];
        }

        return [];
    }

    private buildSignatureEvidence(
        symbols: PbSymbol[],
        context: OwnerTypingAwareSignatureContext | undefined,
        precision: ResolveSignatureAtPositionResult['precision'],
    ): PbSemanticEvidence[] {
        if (context?.ownerTyping?.precision === 'blocked') {
            return context.ownerTyping.evidence;
        }

        if (symbols.length === 0) {
            return [];
        }

        const evidence: PbSemanticEvidence[] = [
            ...(context?.ownerTyping?.evidence ?? (context?.qualifiedOwner
                ? [buildSemanticEvidence(
                    'owner-match',
                    precision === 'ambiguous' ? 'compatible' : 'exact',
                    `La firma se acotó con owner explícito ${context.qualifiedOwner}.`,
                )]
                : [])),
            buildSemanticEvidence(
                'symbol-family',
                precision,
                `La firma se resolvió contra ${symbols.length} candidato(s) indexados tras deduplicar familias lógicas.`,
            ),
        ];

        if (typeof context?.providedArgumentCount === 'number') {
            evidence.push(buildSemanticEvidence(
                'arity-match',
                precision === 'exact' ? 'exact' : 'compatible',
                `La firma tuvo en cuenta ${context.providedArgumentCount} argumento(s) suministrados.`,
            ));
        }

        return evidence;
    }

    private getReferencePrecision(
        query: FindReferencesResult,
        context?: PbSemanticResolutionContext,
    ): ResolveReferencesResult['precision'] {
        if (context?.isDynamicDispatch || context?.isAncestorControlCall) {
            return 'blocked';
        }

        if (query.occurrences.length === 0) {
            return 'blocked';
        }

        if (query.systemMember) {
            return this.hasHeuristicOccurrences(query.occurrences)
                ? 'compatible'
                : 'exact';
        }

        const logicalFamilyCount = this.getLogicalFamilyCount(query.resolvedSymbols);

        if (logicalFamilyCount > 1) {
            return 'ambiguous';
        }

        return this.hasHeuristicOccurrences(query.occurrences)
            ? 'compatible'
            : 'exact';
    }

    private buildReferenceReasons(
        query: FindReferencesResult,
        context?: PbSemanticResolutionContext,
    ): ResolveReferencesResult['reasons'] {
        if (context?.isDynamicDispatch) {
            return [{
                code: 'dynamic-dispatch',
                detail: 'References fuertes se bloquean en llamadas DYNAMIC.',
            }];
        }

        if (context?.isAncestorControlCall) {
            return [{
                code: 'ancestor-control',
                detail: 'References fuertes se bloquean en llamadas CALL al ancestro.',
            }];
        }

        if (query.occurrences.length === 0) {
            return [{
                code: 'no-occurrences',
                detail: 'No se encontraron ocurrencias editables ni referencias consumibles para el símbolo.',
            }];
        }

        if (!query.systemMember && this.getLogicalFamilyCount(query.resolvedSymbols) > 1) {
            return [{
                code: 'multiple-candidates',
                detail: 'Persisten varias familias lógicas de símbolo y el resultado de references queda ambiguo.',
            }];
        }

        return [];
    }

    private buildReferenceEvidence(
        query: FindReferencesResult,
        precision: ResolveReferencesResult['precision'],
    ): PbSemanticEvidence[] {
        const evidence: PbSemanticEvidence[] = [];

        if (query.systemMember) {
            evidence.push(buildSemanticEvidence(
                'system-member',
                precision === 'ambiguous' ? 'compatible' : precision,
                `References se resolvió contra el miembro integrado ${query.systemMember.name}.`,
            ));
        } else if (query.resolvedSymbols.length > 0) {
            evidence.push(buildSemanticEvidence(
                this.getLogicalFamilyCount(query.resolvedSymbols) > 1
                    ? 'candidate-ranking'
                    : 'symbol-family',
                precision,
                `References conservó ${query.resolvedSymbols.length} símbolo(s) resueltos tras preferencia de proyecto.`,
            ));
        }

        if (this.hasHeuristicOccurrences(query.occurrences)) {
            evidence.push(buildSemanticEvidence(
                'text-prefilter',
                'compatible',
                'El barrido de references combinó binding semántico con búsqueda textual IDE-safe.',
            ));
        }

        if (query.currentProject) {
            evidence.push(buildSemanticEvidence(
                'project-scope',
                'compatible',
                `References priorizó el proyecto ${query.currentProject.name}.`,
            ));
        }

        return evidence;
    }

    private buildRenameTargetEvidence(
        renameTarget: NonNullable<ResolveRenameTargetResult['renameTarget']>,
        precision: ResolveRenameTargetResult['precision'],
    ): PbSemanticEvidence[] {
        const evidence = [buildSemanticEvidence(
            'symbol-family',
            precision,
            `Rename se preparó sobre la familia lógica de ${renameTarget.target.name}.`,
        )];

        if (renameTarget.currentProject) {
            evidence.push(buildSemanticEvidence(
                'project-scope',
                'compatible',
                `Rename quedó acotado al proyecto ${renameTarget.currentProject.name}.`,
            ));
        }

        return evidence;
    }

    private buildRenamePlanEvidence(
        renamePlan: NonNullable<ResolveRenameEditsResult['renamePlan']>,
        precision: ResolveRenameEditsResult['precision'],
    ): PbSemanticEvidence[] {
        const evidence = this.buildRenameTargetEvidence(renamePlan, precision);

        if (this.hasHeuristicOccurrences(renamePlan.occurrences)) {
            evidence.push(buildSemanticEvidence(
                'text-prefilter',
                'compatible',
                'El plan de rename incluye ocurrencias localizadas con apoyo de búsqueda textual.',
            ));
        }

        return evidence;
    }

    private buildRenameWorkspaceEdit(
        renamePlan: NonNullable<ResolveRenameEditsResult['renamePlan']>,
        newName: string,
    ): vscode.WorkspaceEdit {
        const edit = new vscode.WorkspaceEdit();

        for (const occurrence of renamePlan.occurrences) {
            edit.replace(occurrence.uri, occurrence.range, newName);
        }

        return edit;
    }

    private dedupeSignatureHelpSymbols(
        symbols: PbSymbol[],
    ): PbSymbol[] {
        const map = new Map<string, PbSymbol>();

        for (const symbol of symbols) {
            const key = getLogicalSymbolKey(symbol);
            const current = map.get(key);

            if (!current) {
                map.set(key, symbol);
                continue;
            }

            if (current.isPrototype && !symbol.isPrototype) {
                map.set(key, symbol);
                continue;
            }

            if (
                current.implementationKind !== 'implementation' &&
                symbol.implementationKind === 'implementation'
            ) {
                map.set(key, symbol);
            }
        }

        return Array.from(map.values());
    }

    private getSignatureFamilyKey(symbol: PbSymbol): string {
        return [
            symbol.name.toLowerCase(),
            symbol.kind,
            symbol.ownerName?.toLowerCase() ?? '',
            symbol.parent?.toLowerCase() ?? '',
        ].join('|');
    }

    private collapseLogicalFamilies(symbols: PbSymbol[]): PbSymbol[] {
        const families = new Map<string, PbSymbol>();

        for (const symbol of symbols) {
            const key = [
                symbol.uri.toString(),
                getLogicalSymbolKey(symbol),
            ].join('|');
            const current = families.get(key);

            if (!current) {
                families.set(key, symbol);
                continue;
            }

            if (current.isPrototype && !symbol.isPrototype) {
                families.set(key, symbol);
                continue;
            }

            if (
                current.implementationKind !== 'implementation' &&
                symbol.implementationKind === 'implementation'
            ) {
                families.set(key, symbol);
            }
        }

        return Array.from(families.values());
    }

    private selectNavigationSymbols(
        symbols: PbSymbol[],
        mode: 'definition' | 'declaration' | 'implementation',
    ): PbSymbol[] {
        switch (mode) {
            case 'declaration':
                return this.collapseDeclarationFamilies(symbols);
            case 'implementation':
                return this.collapseImplementationFamilies(symbols);
            case 'definition':
            default:
                return this.collapseLogicalFamilies(symbols);
        }
    }

    private selectNavigationPrimarySymbol(
        symbols: PbSymbol[],
        currentPrimarySymbol: PbSymbol | undefined,
    ): PbSymbol | undefined {
        if (!currentPrimarySymbol) {
            return symbols.length === 1
                ? symbols[0]
                : undefined;
        }

        return symbols.find(symbol =>
            this.getLocationKey(new vscode.Location(symbol.uri, symbol.selectionRange)) ===
            this.getLocationKey(new vscode.Location(currentPrimarySymbol.uri, currentPrimarySymbol.selectionRange)),
        ) ?? (symbols.length === 1 ? symbols[0] : undefined);
    }

    private collapseDeclarationFamilies(symbols: PbSymbol[]): PbSymbol[] {
        const families = new Map<string, PbSymbol>();

        for (const symbol of symbols) {
            const key = [
                symbol.uri.toString(),
                getLogicalSymbolKey(symbol),
            ].join('|');
            const current = families.get(key);

            if (!current) {
                families.set(key, symbol);
                continue;
            }

            if (!current.isPrototype && symbol.isPrototype) {
                families.set(key, symbol);
            }
        }

        return Array.from(families.values());
    }

    private collapseImplementationFamilies(symbols: PbSymbol[]): PbSymbol[] {
        const families: PbSymbol[] = [];

        for (const symbol of this.collapseDeclarationFamilies(symbols)) {
            families.push(...this.expandImplementationFamily(symbol));
        }

        return this.collapseLogicalFamilies(families);
    }

    private isNavigableImplementationSymbol(symbol: PbSymbol): boolean {
        if (symbol.isPrototype || symbol.isExternal) {
            return false;
        }

        return symbol.kind === 'function'
            || symbol.kind === 'global-function'
            || symbol.kind === 'subroutine'
            || symbol.kind === 'event';
    }

    private expandImplementationFamily(symbol: PbSymbol): PbSymbol[] {
        if (!this.isCallableIdentitySymbol(symbol)) {
            return [];
        }

        const family: PbSymbol[] = [];
        const ownerTypeName = this.getCallableOwnerTypeName(symbol);
        const localImplementation = ownerTypeName
            ? this.findImplementationInOwner(ownerTypeName, symbol)
            : undefined;

        if (localImplementation) {
            family.push(localImplementation);
        } else if (this.isNavigableImplementationSymbol(symbol)) {
            family.push(symbol);
        }

        if (!ownerTypeName) {
            return family;
        }

        for (const derivedTypeName of this.getAllDerivedTypeNames(ownerTypeName)) {
            const derivedImplementation = this.findImplementationInOwner(derivedTypeName, symbol);

            if (derivedImplementation) {
                family.push(derivedImplementation);
            }
        }

        return family;
    }

    private getAllDerivedTypeNames(typeName: string): string[] {
        const graph = getInheritanceGraph(this.index);
        const queue = graph.getDirectDerivedTypes(typeName).map(symbol => symbol.name);
        const seen = new Set<string>();
        const derivedTypeNames: string[] = [];

        while (queue.length > 0) {
            const current = queue.shift();
            const normalizedCurrent = current?.trim().toLowerCase();

            if (!normalizedCurrent || seen.has(normalizedCurrent)) {
                continue;
            }

            seen.add(normalizedCurrent);
            derivedTypeNames.push(current!);

            for (const derivedType of graph.getDirectDerivedTypes(current!)) {
                queue.push(derivedType.name);
            }
        }

        return derivedTypeNames;
    }

    private findImplementationInOwner(
        ownerTypeName: string,
        target: PbSymbol,
    ): PbSymbol | undefined {
        const ownerKey = ownerTypeName.trim().toLowerCase();

        if (!ownerKey) {
            return undefined;
        }

        const matches = this.collapseLogicalFamilies(this.index.findSymbolByName(target.name).filter(candidate =>
            this.isNavigableImplementationSymbol(candidate) &&
            this.getCallableOwnerTypeName(candidate)?.toLowerCase() === ownerKey &&
            this.hasMatchingCallableIdentity(candidate, target),
        ));

        return matches[0];
    }

    private getCallableOwnerTypeName(symbol: PbSymbol): string | undefined {
        return symbol.fileObjectName ?? symbol.parent ?? symbol.containerName ?? symbol.ownerName;
    }

    private hasMatchingCallableIdentity(left: PbSymbol, right: PbSymbol): boolean {
        if (left.kind !== right.kind) {
            return false;
        }

        const leftSignature = left.signature?.trim().toLowerCase();
        const rightSignature = right.signature?.trim().toLowerCase();

        if (leftSignature && rightSignature) {
            return leftSignature === rightSignature;
        }

        if (
            left.parameterCount !== undefined &&
            right.parameterCount !== undefined
        ) {
            return left.parameterCount === right.parameterCount;
        }

        return left.name.toLowerCase() === right.name.toLowerCase();
    }

    private isCallableIdentitySymbol(symbol: PbSymbol): boolean {
        return symbol.kind === 'function'
            || symbol.kind === 'global-function'
            || symbol.kind === 'subroutine'
            || symbol.kind === 'event';
    }

    private getNavigationPrecision(
        mode: 'definition' | 'declaration' | 'implementation',
        symbols: PbSymbol[],
        primarySymbol: PbSymbol | undefined,
        precisionContext: ResolveDefinitionResult['reasons'] extends never ? never : Pick<
            PbSemanticResolutionContext,
            'isDynamicDispatch' | 'isAncestorControlCall' | 'isAncestorReturnValue' | 'qualifiedOwner' | 'providedArgumentCount'
        > & { ownerTyping?: OwnerTypingAssessment } | undefined,
    ): ResolveDefinitionResult['precision'] {
        if (mode !== 'implementation') {
            return getSemanticQueryPrecision(symbols, primarySymbol, precisionContext);
        }

        if (
            precisionContext?.isDynamicDispatch ||
            precisionContext?.isAncestorControlCall ||
            precisionContext?.isAncestorReturnValue ||
            precisionContext?.ownerTyping?.precision === 'blocked'
        ) {
            return 'blocked';
        }

        if (symbols.length === 0) {
            return 'blocked';
        }

        if (this.getImplementationIdentityCount(symbols) > 1) {
            return 'ambiguous';
        }

        return symbols.length === 1
            ? 'exact'
            : 'compatible';
    }

    private buildNavigationReasons(
        mode: 'definition' | 'declaration' | 'implementation',
        symbols: PbSymbol[],
        primarySymbol: PbSymbol | undefined,
        precisionContext: Pick<
            PbSemanticResolutionContext,
            'isDynamicDispatch' | 'isAncestorControlCall' | 'isAncestorReturnValue' | 'qualifiedOwner' | 'providedArgumentCount'
        > & { ownerTyping?: OwnerTypingAssessment } | undefined,
    ): ResolveDefinitionResult['reasons'] {
        if (mode !== 'implementation') {
            return buildSemanticQueryReasons(symbols, primarySymbol, precisionContext);
        }

        if (symbols.length > 1 && this.getImplementationIdentityCount(symbols) === 1) {
            return [];
        }

        return buildSemanticQueryReasons(symbols, primarySymbol, precisionContext);
    }

    private buildNavigationEvidence(
        mode: 'definition' | 'declaration' | 'implementation',
        symbols: PbSymbol[],
        primarySymbol: PbSymbol | undefined,
        precisionContext: Pick<
            PbSemanticResolutionContext,
            'isDynamicDispatch' | 'isAncestorControlCall' | 'isAncestorReturnValue' | 'qualifiedOwner' | 'providedArgumentCount'
        > & { ownerTyping?: OwnerTypingAssessment } | undefined,
    ): PbSemanticEvidence[] {
        if (mode !== 'implementation') {
            return buildSemanticQueryEvidence(symbols, primarySymbol, precisionContext);
        }

        if (symbols.length > 1 && this.getImplementationIdentityCount(symbols) === 1) {
            const evidence: PbSemanticEvidence[] = [buildSemanticEvidence(
                'symbol-family',
                'compatible',
                `Implementation expandió ${symbols.length} bodies publicables para la misma familia callable heredada.`,
            )];

            if (precisionContext?.ownerTyping?.evidence?.length) {
                evidence.unshift(...precisionContext.ownerTyping.evidence);
            }

            return evidence;
        }

        return buildSemanticQueryEvidence(symbols, primarySymbol, precisionContext);
    }

    private getImplementationIdentityCount(symbols: PbSymbol[]): number {
        return new Set(symbols.map(symbol => [
            symbol.kind,
            symbol.name.toLowerCase(),
            symbol.signature?.trim().toLowerCase() ?? '',
            symbol.parameterCount ?? '',
        ].join('|'))).size;
    }

    private collectLinkedEditingRanges(
        document: vscode.TextDocument,
        scope: vscode.Range,
        word: string,
        targetSymbols: PbSymbol[],
    ): vscode.Range[] {
        const text = document.getText();
        const codeMask = createCodeMask(text);
        const startOffset = document.offsetAt(scope.start);
        const endOffset = document.offsetAt(scope.end);
        const regex = new RegExp(this.escapeRegex(word), 'gi');
        const seen = new Set<string>();
        const ranges: vscode.Range[] = [];
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
            const matchStart = match.index;
            const matchLength = match[0].length;

            if (matchStart < startOffset || matchStart + matchLength > endOffset) {
                continue;
            }

            if (!isCodeRange(codeMask, matchStart, matchLength)) {
                continue;
            }

            if (!this.isIdentifierBoundary(text, matchStart - 1, matchStart + matchLength)) {
                continue;
            }

            const start = document.positionAt(matchStart);

            if (!this.semanticEngine.matchesTargetSymbolsAt(document, start, targetSymbols)) {
                continue;
            }

            const end = document.positionAt(matchStart + matchLength);
            const range = new vscode.Range(start, end);
            const key = [
                range.start.line,
                range.start.character,
                range.end.line,
                range.end.character,
            ].join(':');

            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            ranges.push(range);
        }

        return ranges;
    }

    private isIdentifierBoundary(
        text: string,
        beforeIndex: number,
        afterIndex: number,
    ): boolean {
        const before = beforeIndex >= 0 ? text[beforeIndex] : undefined;
        const after = afterIndex < text.length ? text[afterIndex] : undefined;

        return (!before || !isPbIdentifierChar(before)) &&
            (!after || !isPbIdentifierChar(after));
    }

    private escapeRegex(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private getNavigationEmptyDetail(
        mode: 'definition' | 'declaration' | 'implementation',
    ): string {
        switch (mode) {
            case 'declaration':
                return 'No se encontraron declaraciones publicables para el símbolo pedido.';
            case 'implementation':
                return 'No se encontraron implementaciones publicables para el símbolo pedido.';
            case 'definition':
            default:
                return 'No se encontraron definiciones semánticas para el símbolo pedido.';
        }
    }

    private toUniqueLocations(symbols: Array<{
        uri: vscode.Uri;
        selectionRange: vscode.Range;
    }>): vscode.Location[] {
        const seen = new Set<string>();
        const locations: vscode.Location[] = [];

        for (const symbol of symbols) {
            const location = new vscode.Location(symbol.uri, symbol.selectionRange);
            const key = this.getLocationKey(location);

            if (!seen.has(key)) {
                seen.add(key);
                locations.push(location);
            }
        }

        return locations;
    }

    private getLocationKey(location: vscode.Location): string {
        return [
            location.uri.toString(),
            location.range.start.line,
            location.range.start.character,
            location.range.end.line,
            location.range.end.character,
        ].join(':');
    }

    private getLogicalFamilyCount(symbols: PbSymbol[]): number {
        return new Set(symbols.map(symbol => getLogicalSymbolKey(symbol))).size;
    }

    private hasHeuristicOccurrences(
        occurrences: FindReferencesResult['occurrences'],
    ): boolean {
        return occurrences.some(occurrence =>
            occurrence.evidence.some(evidence => evidence.precision === 'heuristic'),
        );
    }

    private matchesCompletionPrefix(label: string, prefix: string): boolean {
        if (!prefix) {
            return true;
        }

        return label.toLowerCase().includes(prefix.toLowerCase());
    }
}

function isVariableDeclarationTypeContext(
    symbolContext?: Pick<SymbolContext, 'range' | 'statement'>,
): boolean {
    if (!symbolContext?.statement) {
        return false;
    }

    const typeSpan = getVariableDeclarationTypeSpan(symbolContext.statement.text);

    if (!typeSpan) {
        return false;
    }

    const statementOffset = mapPositionToStatementOffset(
        symbolContext.statement,
        symbolContext.range.start,
    );

    if (statementOffset === undefined) {
        return false;
    }

    return statementOffset >= typeSpan.start && statementOffset < typeSpan.end;
}

function getVariableDeclarationTypeSpan(
    statementText: string,
): { start: number; end: number } | undefined {
    const match = statementText.match(VARIABLE_DECLARATION_TYPE_PATTERN);
    const prefix = match?.[1];
    const typeName = match?.[2];

    if (prefix === undefined || !typeName) {
        return undefined;
    }

    const start = prefix.length;
    return {
        start,
        end: start + typeName.length,
    };
}