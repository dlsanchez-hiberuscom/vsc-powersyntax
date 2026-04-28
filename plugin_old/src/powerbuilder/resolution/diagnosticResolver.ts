import * as vscode from 'vscode';
import { PbDiagnosticInfo } from '../models/pbDiagnostic';
import {
    PB_DIAGNOSTIC_CODES,
    PbDiagnosticCode,
    getDiagnosticMessageEs,
    getStrayCloseCode,
    getUnclosedBlockCode,
} from '../constants/pbDiagnosticMessages';
import {
    createPowerScriptStatementScanState,
    splitPowerBuilderStatements,
} from '../../core/utils/powerScriptStatementUtils';
import { isLikelySqlStarter } from '../../core/utils/powerScriptSqlUtils';
import {
    createCodeMask,
    endsWithPowerScriptContinuation,
    stripCommentsFromLines,
    stripPowerScriptContinuation,
} from '../../core/utils/powerScriptLexingUtils';
import { getSignatureCallContextAtPosition } from '../document/documentUtils';
import { isPbIdentifierChar } from '../grammar/pbIdentifier';
import {
    PbExecutableBlockKind,
    getExecutableBlockCloseKind,
    getExecutableBlockOpenKind,
    isCatchStatement,
    isElseIfStatement,
    isElseStatement,
    isFinallyStatement,
} from '../grammar/pbLanguageGrammar';
import { SymbolIndex } from '../indexing/symbolIndex';
import { PbSymbol } from '../models/pbSymbol';
import {
    isObsoleteSymbol,
    resolveReplacement,
} from '../systemSymbols/resolvers';
import { SemanticQueryService } from '../semantic/queries/semanticQueryService';

interface LogicalLine {
    text: string;
    firstPhysicalLine: number;
    lastPhysicalLine: number;
}

interface BlockFrame {
    kind: PbExecutableBlockKind;
    openLine: number;
    hasCatch?: boolean;
    hasFinally?: boolean;
    termination?: LinearTerminationState;
    branchTermination?: BranchTerminationSummary;
}

interface LinearTerminationState {
    keyword: 'return' | 'throw' | 'halt' | 'all-branches';
    reported: boolean;
}

interface BranchTerminationSummary {
    allBranchesTerminate: boolean;
    hasFallbackBranch: boolean;
    hasActiveBranch: boolean;
}

type IdentifierUsageKind = 'none' | 'write-only' | 'indirect' | 'direct' | 'blocked';
type IdentifierOccurrenceKind = 'write-only' | 'indirect' | 'direct' | 'blocked';

interface EventDispatchUsageContext {
    argIndex: number;
    isMethodCall: boolean;
}

type ShadowedMemberKind = 'instance' | 'shared' | 'global';

interface ScopedVariableAnalysisCandidate {
    symbol: PbSymbol;
    callable: PbSymbol;
    usageKind: IdentifierUsageKind;
    hasDemonstrableAssignment: boolean;
}

interface PrivateMemberAnalysisCandidate {
    symbol: PbSymbol;
    usageKind: IdentifierUsageKind;
}

const CALLABLE_DECLARATION_PATTERN =
    /^\s*(?:(?:public|private|protected|global|shared|forward|static|external)\s+)*(?:function|subroutine|event)\b/i;
const CALLABLE_CLOSE_PATTERN = /^\s*end\s+(?:function|subroutine|event)\b/i;
const CHOOSE_CASE_TRANSITION_PATTERN = /^\s*case(?:\s+else)?\b/i;
const CHOOSE_CASE_ELSE_PATTERN = /^\s*case\s+else\b/i;
const UNCONDITIONAL_TERMINATOR_PATTERN = /^\s*(return|throw|halt)\b/i;

export class DiagnosticResolver {
    analyze(document: vscode.TextDocument): PbDiagnosticInfo[] {
        const diagnostics: PbDiagnosticInfo[] = [];
        const physicalLines = document.getText().split(/\r?\n/);

        const strippedLines = stripCommentsFromLines(physicalLines);

        const sqlLineFlags = this.analyzeSql(
            strippedLines,
            physicalLines,
            diagnostics,
        );

        const logicalLines = this.joinContinuationLines(strippedLines);

        this.analyzeBlocks(
            logicalLines,
            physicalLines,
            sqlLineFlags,
            diagnostics,
        );

        const index = SymbolIndex.getInstance();
        const symbols = index.indexDocument(document, { silent: true });
        const variableCandidates = this.collectScopedVariableAnalysisCandidates(
            document,
            sqlLineFlags,
            symbols,
            index,
        );

        this.analyzeUnusedVariables(
            diagnostics,
            variableCandidates,
        );

        this.analyzeVariableShadowing(
            diagnostics,
            variableCandidates,
            symbols,
        );

        const privateMemberCandidates = this.collectPrivateMemberAnalysisCandidates(
            document,
            sqlLineFlags,
            symbols,
        );

        this.analyzeUnusedPrivateMembers(
            diagnostics,
            privateMemberCandidates,
        );

        this.analyzeAmbiguousCalls(
            document,
            strippedLines,
            diagnostics,
            index,
        );

        this.analyzeModernization(
            physicalLines,
            sqlLineFlags,
            diagnostics,
            index,
        );

        return diagnostics;
    }

    private collectScopedVariableAnalysisCandidates(
        document: vscode.TextDocument,
        sqlLineFlags: boolean[],
        symbols: PbSymbol[],
        index: SymbolIndex,
    ): ScopedVariableAnalysisCandidate[] {
        const candidates: ScopedVariableAnalysisCandidate[] = [];

        for (const symbol of symbols) {
            if (
                symbol.kind !== 'variable' ||
                (symbol.declarationScope !== 'local' && symbol.declarationScope !== 'parameter')
            ) {
                continue;
            }

            if (sqlLineFlags[symbol.selectionRange.start.line]) {
                continue;
            }

            const callable = index.findInnermostCallableAtPosition(
                document.uri,
                symbol.selectionRange.start,
            );

            if (!callable) {
                continue;
            }

            candidates.push({
                symbol,
                callable,
                usageKind: this.classifyIdentifierUsage(
                    document,
                    symbol,
                    callable.range,
                ),
                hasDemonstrableAssignment: this.hasDemonstrableAssignment(
                    document,
                    sqlLineFlags,
                    symbol,
                    callable.range,
                ),
            });
        }

        return candidates;
    }

    private analyzeUnusedVariables(
        diagnostics: PbDiagnosticInfo[],
        candidates: ScopedVariableAnalysisCandidate[],
    ): void {
        for (const { symbol, usageKind, hasDemonstrableAssignment } of candidates) {

            if (
                symbol.declarationScope === 'local' &&
                usageKind === 'direct' &&
                !hasDemonstrableAssignment
            ) {
                this.pushExactDiagnostic(
                    diagnostics,
                    symbol.selectionRange,
                    PB_DIAGNOSTIC_CODES.UNASSIGNED_LOCAL_VARIABLE,
                    vscode.DiagnosticSeverity.Information,
                );
                continue;
            }

            if (usageKind === 'direct' || usageKind === 'blocked') {
                continue;
            }

            this.pushExactDiagnostic(
                diagnostics,
                symbol.selectionRange,
                usageKind === 'indirect'
                    ? PB_DIAGNOSTIC_CODES.POTENTIALLY_INDIRECT_VARIABLE_USAGE
                    : usageKind === 'write-only' && symbol.declarationScope === 'local'
                        ? PB_DIAGNOSTIC_CODES.WRITE_ONLY_LOCAL_VARIABLE
                    : symbol.declarationScope === 'parameter'
                        ? PB_DIAGNOSTIC_CODES.UNUSED_PARAMETER
                        : PB_DIAGNOSTIC_CODES.UNUSED_LOCAL_VARIABLE,
                usageKind === 'indirect'
                    ? vscode.DiagnosticSeverity.Hint
                    : vscode.DiagnosticSeverity.Information,
            );
        }
    }

    private analyzeVariableShadowing(
        diagnostics: PbDiagnosticInfo[],
        candidates: ScopedVariableAnalysisCandidate[],
        symbols: PbSymbol[],
    ): void {
        for (const candidate of candidates) {
            if (candidate.usageKind !== 'direct') {
                continue;
            }

            const shadowedMember = this.findClearShadowedMember(
                candidate.symbol,
                symbols,
            );

            if (!shadowedMember) {
                continue;
            }

            const memberKind = this.getShadowedMemberKind(shadowedMember);

            this.pushExactDiagnostic(
                diagnostics,
                candidate.symbol.selectionRange,
                candidate.symbol.declarationScope === 'parameter'
                    ? PB_DIAGNOSTIC_CODES.PARAMETER_SHADOWS_MEMBER
                    : PB_DIAGNOSTIC_CODES.LOCAL_VARIABLE_SHADOWS_MEMBER,
                vscode.DiagnosticSeverity.Hint,
                this.buildShadowingMessage(
                    candidate.symbol.declarationScope === 'parameter'
                        ? 'parameter'
                        : 'local',
                    memberKind,
                ),
            );
        }
    }

    private collectPrivateMemberAnalysisCandidates(
        document: vscode.TextDocument,
        sqlLineFlags: boolean[],
        symbols: PbSymbol[],
    ): PrivateMemberAnalysisCandidate[] {
        const candidates: PrivateMemberAnalysisCandidate[] = [];
        const documentRange = this.getDocumentRange(document);

        for (const symbol of symbols) {
            if (!this.isPrivateMemberVariable(symbol)) {
                continue;
            }

            if (sqlLineFlags[symbol.selectionRange.start.line]) {
                continue;
            }

            if (this.hasPrivateMemberUsageAmbiguity(symbol, symbols)) {
                continue;
            }

            candidates.push({
                symbol,
                usageKind: this.classifyIdentifierUsage(
                    document,
                    symbol,
                    documentRange,
                ),
            });
        }

        return candidates;
    }

    private analyzeUnusedPrivateMembers(
        diagnostics: PbDiagnosticInfo[],
        candidates: PrivateMemberAnalysisCandidate[],
    ): void {
        for (const { symbol, usageKind } of candidates) {
            if (usageKind === 'direct' || usageKind === 'indirect' || usageKind === 'blocked') {
                continue;
            }

            this.pushExactDiagnostic(
                diagnostics,
                symbol.selectionRange,
                usageKind === 'write-only'
                    ? PB_DIAGNOSTIC_CODES.WRITE_ONLY_PRIVATE_MEMBER_VARIABLE
                    : PB_DIAGNOSTIC_CODES.UNUSED_PRIVATE_MEMBER_VARIABLE,
                vscode.DiagnosticSeverity.Hint,
            );
        }
    }

    private analyzeAmbiguousCalls(
        document: vscode.TextDocument,
        strippedLines: string[],
        diagnostics: PbDiagnosticInfo[],
        index: SymbolIndex,
    ): void {
        const semanticQueries = new SemanticQueryService(index);
        const seenCalls = new Set<string>();

        for (let lineNumber = 0; lineNumber < strippedLines.length; lineNumber++) {
            const line = strippedLines[lineNumber] ?? '';

            if (!line.includes('(')) {
                continue;
            }

            const codeMask = createCodeMask(line);

            for (let character = 0; character < line.length; character++) {
                if (line[character] !== '(' || codeMask[character] !== 1) {
                    continue;
                }

                const position = new vscode.Position(
                    lineNumber,
                    Math.min(character + 1, line.length),
                );
                const callContext = getSignatureCallContextAtPosition(document, position);

                if (
                    !callContext ||
                    callContext.isDynamicDispatch ||
                    callContext.isAncestorControlCall
                ) {
                    continue;
                }

                const key = `${callContext.range.start.line}:${callContext.range.start.character}:${callContext.range.end.character}`;

                if (seenCalls.has(key)) {
                    continue;
                }

                seenCalls.add(key);

                const signatureResult = semanticQueries.resolveSignatureAtPosition({
                    document,
                    position,
                    context: callContext,
                });
                const ambiguityReason = signatureResult.reasons.find(reason => reason.code === 'multiple-candidates');

                if (signatureResult.precision !== 'ambiguous' || !ambiguityReason) {
                    continue;
                }

                this.pushExactDiagnostic(
                    diagnostics,
                    callContext.range,
                    PB_DIAGNOSTIC_CODES.AMBIGUOUS_CALL,
                    vscode.DiagnosticSeverity.Information,
                    this.buildAmbiguousCallMessage(
                        callContext.name,
                        signatureResult.symbols.length,
                    ),
                );
            }
        }
    }

    private analyzeModernization(
        physicalLines: string[],
        sqlLineFlags: boolean[],
        diagnostics: PbDiagnosticInfo[],
        index: SymbolIndex,
    ): void {
        const statementState = createPowerScriptStatementScanState();
        const callableConflictCache = new Map<string, boolean>();

        for (let lineNumber = 0; lineNumber < physicalLines.length; lineNumber++) {
            const line = physicalLines[lineNumber];
            const statements = splitPowerBuilderStatements(line, lineNumber, statementState);

            if (sqlLineFlags[lineNumber]) {
                continue;
            }

            const codeMask = createCodeMask(line);

            for (const statement of statements) {
                this.analyzeLegacyStatementKeyword(
                    line,
                    lineNumber,
                    codeMask,
                    statement.startColumn,
                    statement.text,
                    diagnostics,
                );

                if (this.isCallableDeclarationStatement(statement.text)) {
                    continue;
                }

                this.analyzeObsoleteRuntimeFunctions(
                    line,
                    lineNumber,
                    codeMask,
                    statement,
                    diagnostics,
                    index,
                    callableConflictCache,
                );
            }
        }
    }

    private analyzeLegacyStatementKeyword(
        line: string,
        lineNumber: number,
        codeMask: ArrayLike<number>,
        statementStartColumn: number,
        statementText: string,
        diagnostics: PbDiagnosticInfo[],
    ): void {
        const normalizedStatement = statementText.trim().toLowerCase();

        if (/^goto\b/.test(normalizedStatement)) {
            const range = this.findIdentifierRangeOnLine(
                line,
                codeMask,
                lineNumber,
                'goto',
                statementStartColumn,
            );

            if (range) {
                this.pushExactDiagnostic(
                    diagnostics,
                    range,
                    PB_DIAGNOSTIC_CODES.LEGACY_GOTO,
                    vscode.DiagnosticSeverity.Warning,
                );
            }
        }

        if (/^halt\b/.test(normalizedStatement)) {
            const range = this.findIdentifierRangeOnLine(
                line,
                codeMask,
                lineNumber,
                'halt',
                statementStartColumn,
            );

            if (range) {
                this.pushExactDiagnostic(
                    diagnostics,
                    range,
                    PB_DIAGNOSTIC_CODES.LEGACY_HALT,
                    vscode.DiagnosticSeverity.Information,
                );
            }
        }
    }

    private analyzeObsoleteRuntimeFunctions(
        line: string,
        lineNumber: number,
        codeMask: ArrayLike<number>,
        statement: {
            startColumn: number;
            endColumn: number;
        },
        diagnostics: PbDiagnosticInfo[],
        index: SymbolIndex,
        callableConflictCache: Map<string, boolean>,
    ): void {
        for (let character = statement.startColumn; character < statement.endColumn;) {
            if (
                codeMask[character] !== 1 ||
                !this.isPbIdentifierStartChar(line[character]) ||
                (character > statement.startColumn && isPbIdentifierChar(line[character - 1]))
            ) {
                character++;
                continue;
            }

            let end = character + 1;

            while (end < line.length && isPbIdentifierChar(line[end])) {
                end++;
            }

            const candidateName = line.slice(character, end);

            if (
                this.shouldReportObsoleteRuntimeFunction(
                    line,
                    codeMask,
                    character,
                    end,
                    candidateName,
                    index,
                    callableConflictCache,
                )
            ) {
                const replacement = resolveReplacement(candidateName);

                this.pushExactDiagnostic(
                    diagnostics,
                    new vscode.Range(lineNumber, character, lineNumber, end),
                    PB_DIAGNOSTIC_CODES.OBSOLETE_RUNTIME_FUNCTION,
                    vscode.DiagnosticSeverity.Hint,
                    this.buildObsoleteRuntimeFunctionMessage(candidateName, replacement),
                );
            }

            character = end;
        }
    }

    private shouldReportObsoleteRuntimeFunction(
        line: string,
        codeMask: ArrayLike<number>,
        start: number,
        end: number,
        candidateName: string,
        index: SymbolIndex,
        callableConflictCache: Map<string, boolean>,
    ): boolean {
        if (!isObsoleteSymbol(candidateName)) {
            return false;
        }

        const nextCodeIndex = this.findNextCodeIndex(line, codeMask, end);

        if (nextCodeIndex < 0 || line[nextCodeIndex] !== '(') {
            return false;
        }

        const previousCodeIndex = this.findPreviousCodeIndex(line, codeMask, start - 1);

        if (
            previousCodeIndex >= 0 &&
            (line[previousCodeIndex] === '.' || line[previousCodeIndex] === ':')
        ) {
            return false;
        }

        return !this.hasCallableConflict(candidateName, index, callableConflictCache);
    }

    private hasCallableConflict(
        candidateName: string,
        index: SymbolIndex,
        callableConflictCache: Map<string, boolean>,
    ): boolean {
        const normalizedName = candidateName.trim().toLowerCase();
        const cached = callableConflictCache.get(normalizedName);

        if (cached !== undefined) {
            return cached;
        }

        const hasConflict = index.findSymbolByName(candidateName).some(symbol =>
            symbol.kind === 'function' ||
            symbol.kind === 'global-function' ||
            symbol.kind === 'subroutine' ||
            symbol.kind === 'event',
        );

        callableConflictCache.set(normalizedName, hasConflict);
        return hasConflict;
    }

    private buildObsoleteRuntimeFunctionMessage(
        candidateName: string,
        replacement: string | undefined,
    ): string {
        return replacement
            ? `La función global obsoleta '${candidateName}' puede sustituirse por '${replacement}'.`
            : `La función global obsoleta '${candidateName}' sigue usándose.`;
    }

    private isCallableDeclarationStatement(statementText: string): boolean {
        return CALLABLE_DECLARATION_PATTERN.test(statementText);
    }

    private isPbIdentifierStartChar(value: string): boolean {
        return /[a-zA-Z_$#%]/.test(value);
    }

    private analyzeBlocks(
        logicalLines: LogicalLine[],
        physicalLines: string[],
        sqlLineFlags: boolean[],
        diagnostics: PbDiagnosticInfo[],
    ): void {
        const stack: BlockFrame[] = [];
        const statementScanState = createPowerScriptStatementScanState();
        let callableTermination: LinearTerminationState | undefined;

        for (const logicalLine of logicalLines) {
            if (this.logicalLineTouchesSql(logicalLine, sqlLineFlags)) {
                continue;
            }

            const statements = splitPowerBuilderStatements(
                logicalLine.text,
                logicalLine.firstPhysicalLine,
                statementScanState,
            );

            for (const statement of statements) {
                const text = statement.text.trim();

                if (!text) {
                    continue;
                }

                const lineNumber = statement.line;

                if (this.isCallableBoundaryStatement(text)) {
                    callableTermination = undefined;
                    continue;
                }

                if (isCatchStatement(text)) {
                    const top = stack[stack.length - 1];

                    if (!top || top.kind !== 'TRY') {
                        this.pushDiagnostic(
                            diagnostics,
                            physicalLines,
                            lineNumber,
                            PB_DIAGNOSTIC_CODES.UNEXPECTED_BLOCK_CLOSE,
                            vscode.DiagnosticSeverity.Warning,
                        );
                    } else {
                        top.hasCatch = true;
                        top.termination = undefined;
                    }

                    continue;
                }

                if (isFinallyStatement(text)) {
                    const top = stack[stack.length - 1];

                    if (!top || top.kind !== 'TRY') {
                        this.pushDiagnostic(
                            diagnostics,
                            physicalLines,
                            lineNumber,
                            PB_DIAGNOSTIC_CODES.UNEXPECTED_BLOCK_CLOSE,
                            vscode.DiagnosticSeverity.Warning,
                        );
                    } else {
                        top.hasFinally = true;
                        top.termination = undefined;
                    }

                    continue;
                }

                if (isElseIfStatement(text) || isElseStatement(text) || this.isChooseCaseTransitionStatement(text)) {
                    const top = stack[stack.length - 1];

                    const isChooseCaseTransition = this.isChooseCaseTransitionStatement(text);
                    const expectedKind = isChooseCaseTransition
                        ? 'CHOOSE CASE'
                        : 'IF';

                    if (!top || top.kind !== expectedKind) {
                        this.pushDiagnostic(
                            diagnostics,
                            physicalLines,
                            lineNumber,
                            PB_DIAGNOSTIC_CODES.UNEXPECTED_BLOCK_CLOSE,
                            vscode.DiagnosticSeverity.Warning,
                        );
                    } else {
                        this.finalizeCurrentBranch(top);
                        if (this.isFallbackBranchTransition(text, expectedKind)) {
                            top.branchTermination!.hasFallbackBranch = true;
                        }
                        top.branchTermination!.hasActiveBranch = true;
                        top.termination = undefined;
                    }

                    continue;
                }

                const closeKind = getExecutableBlockCloseKind(text);

                if (closeKind) {
                    const blockTermination = this.closeBlock(
                        closeKind,
                        lineNumber,
                        physicalLines,
                        stack,
                        diagnostics,
                    );

                    if (blockTermination) {
                        if (stack.length > 0) {
                            stack[stack.length - 1].termination = blockTermination;
                        } else {
                            callableTermination = blockTermination;
                        }
                    }

                    continue;
                }

                const activeTermination = this.getActiveTermination(stack, callableTermination);

                if (activeTermination && !activeTermination.reported) {
                    this.pushExactDiagnostic(
                        diagnostics,
                        new vscode.Range(
                            lineNumber,
                            statement.startColumn,
                            lineNumber,
                            statement.endColumn,
                        ),
                        PB_DIAGNOSTIC_CODES.UNREACHABLE_STATEMENT,
                        vscode.DiagnosticSeverity.Hint,
                        this.buildUnreachableStatementMessage(activeTermination.keyword),
                    );
                    activeTermination.reported = true;
                }

                const openKind = getExecutableBlockOpenKind(text);

                if (openKind) {
                    stack.push({
                        kind: openKind,
                        openLine: lineNumber,
                        hasCatch: openKind === 'TRY' ? false : undefined,
                        hasFinally: openKind === 'TRY' ? false : undefined,
                        branchTermination: this.createBranchTerminationSummary(openKind),
                    });
                }

                const terminator = this.parseUnconditionalTerminator(text);

                if (terminator) {
                    const state: LinearTerminationState = {
                        keyword: terminator,
                        reported: false,
                    };

                    if (stack.length > 0) {
                        stack[stack.length - 1].termination = state;
                    } else {
                        callableTermination = state;
                    }
                }
            }
        }

        for (const frame of stack) {
            this.pushDiagnostic(
                diagnostics,
                physicalLines,
                frame.openLine,
                getUnclosedBlockCode(frame.kind),
                vscode.DiagnosticSeverity.Warning,
            );
        }
    }

    private closeBlock(
        expectedKind: PbExecutableBlockKind,
        lineNumber: number,
        physicalLines: string[],
        stack: BlockFrame[],
        diagnostics: PbDiagnosticInfo[],
    ): LinearTerminationState | undefined {
        const top = stack[stack.length - 1];

        if (!top) {
            this.pushDiagnostic(
                diagnostics,
                physicalLines,
                lineNumber,
                getStrayCloseCode(expectedKind),
                vscode.DiagnosticSeverity.Warning,
            );
            return undefined;
        }

        if (top.kind !== expectedKind) {
            this.pushDiagnostic(
                diagnostics,
                physicalLines,
                lineNumber,
                PB_DIAGNOSTIC_CODES.UNEXPECTED_BLOCK_CLOSE,
                vscode.DiagnosticSeverity.Warning,
            );
            return undefined;
        }

        if (expectedKind === 'TRY' && !top.hasCatch && !top.hasFinally) {
            this.pushDiagnostic(
                diagnostics,
                physicalLines,
                lineNumber,
                PB_DIAGNOSTIC_CODES.TRY_MISSING_CATCH_OR_FINALLY,
                vscode.DiagnosticSeverity.Warning,
            );
        }

        this.finalizeCurrentBranch(top);
        const propagatedTermination = this.buildClosedBlockTermination(top);

        stack.pop();
        return propagatedTermination;
    }

    private isCallableBoundaryStatement(statementText: string): boolean {
        return this.isCallableDeclarationStatement(statementText) || CALLABLE_CLOSE_PATTERN.test(statementText);
    }

    private isChooseCaseTransitionStatement(statementText: string): boolean {
        return CHOOSE_CASE_TRANSITION_PATTERN.test(statementText);
    }

    private parseUnconditionalTerminator(
        statementText: string,
    ): LinearTerminationState['keyword'] | undefined {
        const match = statementText.match(UNCONDITIONAL_TERMINATOR_PATTERN);
        const keyword = match?.[1]?.toLowerCase();

        return keyword === 'return' || keyword === 'throw' || keyword === 'halt'
            ? keyword
            : undefined;
    }

    private getActiveTermination(
        stack: readonly BlockFrame[],
        callableTermination: LinearTerminationState | undefined,
    ): LinearTerminationState | undefined {
        for (let index = stack.length - 1; index >= 0; index--) {
            if (stack[index].termination) {
                return stack[index].termination;
            }
        }

        return callableTermination;
    }

    private buildUnreachableStatementMessage(
        keyword: LinearTerminationState['keyword'],
    ): string {
        if (keyword === 'all-branches') {
            return 'La sentencia no es alcanzable porque todas las ramas demostrables del bloque anterior ya terminan la ejecución.';
        }

        return `La sentencia no es alcanzable porque la ruta lineal actual ya termina con ${keyword.toUpperCase()}.`;
    }

    private createBranchTerminationSummary(
        kind: PbExecutableBlockKind,
    ): BranchTerminationSummary | undefined {
        if (kind === 'IF') {
            return {
                allBranchesTerminate: true,
                hasFallbackBranch: false,
                hasActiveBranch: true,
            };
        }

        if (kind === 'CHOOSE CASE') {
            return {
                allBranchesTerminate: true,
                hasFallbackBranch: false,
                hasActiveBranch: false,
            };
        }

        return undefined;
    }

    private finalizeCurrentBranch(frame: BlockFrame): void {
        if (!frame.branchTermination?.hasActiveBranch) {
            return;
        }

        frame.branchTermination.allBranchesTerminate =
            frame.branchTermination.allBranchesTerminate && !!frame.termination;
    }

    private isFallbackBranchTransition(
        statementText: string,
        blockKind: Extract<PbExecutableBlockKind, 'IF' | 'CHOOSE CASE'>,
    ): boolean {
        return blockKind === 'IF'
            ? isElseStatement(statementText)
            : CHOOSE_CASE_ELSE_PATTERN.test(statementText);
    }

    private buildClosedBlockTermination(
        frame: BlockFrame,
    ): LinearTerminationState | undefined {
        if (
            frame.branchTermination?.hasFallbackBranch &&
            frame.branchTermination.allBranchesTerminate
        ) {
            return {
                keyword: 'all-branches',
                reported: false,
            };
        }

        return undefined;
    }

    private analyzeSql(
        strippedLines: string[],
        physicalLines: string[],
        diagnostics: PbDiagnosticInfo[],
    ): boolean[] {
        const sqlLineFlags = new Array<boolean>(strippedLines.length).fill(false);

        let inSql = false;
        let sqlStartLine = -1;

        for (let index = 0; index < strippedLines.length; index++) {
            const line = strippedLines[index];
            const trimmed = line.trim();

            if (!inSql) {
                if (!trimmed) {
                    continue;
                }

                if (isLikelySqlStarter(trimmed)) {
                    inSql = true;
                    sqlStartLine = index;
                }
            }

            if (inSql) {
                sqlLineFlags[index] = true;

                if (this.hasRealSemicolon(line)) {
                    inSql = false;
                    sqlStartLine = -1;
                }
            }
        }

        if (inSql && sqlStartLine >= 0) {
            this.pushDiagnostic(
                diagnostics,
                physicalLines,
                sqlStartLine,
                PB_DIAGNOSTIC_CODES.SQL_MISSING_SEMICOLON,
                vscode.DiagnosticSeverity.Information,
            );
        }

        return sqlLineFlags;
    }

    private logicalLineTouchesSql(
        logicalLine: LogicalLine,
        sqlLineFlags: boolean[],
    ): boolean {
        for (
            let index = logicalLine.firstPhysicalLine;
            index <= logicalLine.lastPhysicalLine;
            index++
        ) {
            if (sqlLineFlags[index]) {
                return true;
            }
        }

        return false;
    }

    private joinContinuationLines(lines: string[]): LogicalLine[] {
        const result: LogicalLine[] = [];
        let index = 0;

        while (index < lines.length) {
            const firstLine = index;
            let lastLine = index;
            let joined = lines[index];

            while (
                endsWithPowerScriptContinuation(joined) &&
                index + 1 < lines.length &&
                !isLikelySqlStarter(joined)
            ) {
                joined = stripPowerScriptContinuation(joined) + lines[index + 1];

                index++;
                lastLine = index;
            }

            result.push({
                text: joined,
                firstPhysicalLine: firstLine,
                lastPhysicalLine: lastLine,
            });

            index++;
        }

        return result;
    }
    private hasRealSemicolon(line: string): boolean {
        const codeMask = createCodeMask(line);

        for (let index = 0; index < line.length; index++) {
            if (line[index] === ';' && codeMask[index] === 1) {
                return true;
            }
        }

        return false;
    }

    private classifyIdentifierUsage(
        document: vscode.TextDocument,
        symbol: PbSymbol,
        scope: vscode.Range,
    ): IdentifierUsageKind {
        const target = symbol.name.toLowerCase();
        let sawBlockedUsage = false;
        let sawWriteOnlyUsage = false;
        let sawIndirectUsage = false;

        for (let lineNumber = scope.start.line; lineNumber <= scope.end.line; lineNumber++) {
            const line = document.lineAt(lineNumber).text;
            const codeMask = createCodeMask(line);
            const startCharacter = lineNumber === scope.start.line
                ? scope.start.character
                : 0;
            const endCharacter = lineNumber === scope.end.line
                ? Math.min(scope.end.character, line.length)
                : line.length;

            for (let character = startCharacter; character <= endCharacter - symbol.name.length; character++) {
                if (codeMask[character] !== 1) {
                    continue;
                }

                if (!this.matchesIdentifierAt(line, character, target)) {
                    continue;
                }

                const matchRange = new vscode.Range(
                    lineNumber,
                    character,
                    lineNumber,
                    character + symbol.name.length,
                );

                if (matchRange.isEqual(symbol.selectionRange)) {
                    character += symbol.name.length - 1;
                    continue;
                }

                const occurrenceKind = this.classifyIdentifierOccurrence(
                    line,
                    codeMask,
                    character,
                    symbol.name.length,
                );

                if (occurrenceKind === 'write-only') {
                    sawWriteOnlyUsage = true;
                    character += symbol.name.length - 1;
                    continue;
                }

                if (occurrenceKind === 'blocked') {
                    sawBlockedUsage = true;
                    character += symbol.name.length - 1;
                    continue;
                }

                if (occurrenceKind === 'direct') {
                    return 'direct';
                }

                sawIndirectUsage = true;
                character += symbol.name.length - 1;
            }
        }

        if (sawBlockedUsage && !sawIndirectUsage && !sawWriteOnlyUsage) {
            return 'blocked';
        }

        return sawIndirectUsage
            ? 'indirect'
            : sawWriteOnlyUsage
                ? 'write-only'
            : 'none';
    }

    private hasDemonstrableAssignment(
        document: vscode.TextDocument,
        sqlLineFlags: boolean[],
        symbol: PbSymbol,
        scope: vscode.Range,
    ): boolean {
        const target = symbol.name.toLowerCase();

        for (let lineNumber = scope.start.line; lineNumber <= scope.end.line; lineNumber++) {
            const line = document.lineAt(lineNumber).text;
            const codeMask = createCodeMask(line);
            const startCharacter = lineNumber === scope.start.line
                ? scope.start.character
                : 0;
            const endCharacter = lineNumber === scope.end.line
                ? Math.min(scope.end.character, line.length)
                : line.length;

            for (let character = startCharacter; character <= endCharacter - symbol.name.length; character++) {
                if (codeMask[character] !== 1) {
                    continue;
                }

                if (!this.matchesIdentifierAt(line, character, target)) {
                    continue;
                }

                const matchRange = new vscode.Range(
                    lineNumber,
                    character,
                    lineNumber,
                    character + symbol.name.length,
                );

                if (matchRange.isEqual(symbol.selectionRange)) {
                    if (this.isInitializedDeclarationOccurrence(line, codeMask, character, symbol.name.length)) {
                        return true;
                    }

                    character += symbol.name.length - 1;
                    continue;
                }

                if (
                    sqlLineFlags[lineNumber] &&
                    this.isSqlIntoAssignmentUsage(line, codeMask, character)
                ) {
                    return true;
                }

                if (this.classifyIdentifierOccurrence(line, codeMask, character, symbol.name.length) === 'write-only') {
                    return true;
                }

                character += symbol.name.length - 1;
            }
        }

        return false;
    }

    private getDocumentRange(document: vscode.TextDocument): vscode.Range {
        const lastLine = Math.max(document.lineCount - 1, 0);
        const lastLineText = document.lineAt(lastLine).text;

        return new vscode.Range(0, 0, lastLine, lastLineText.length);
    }

    private classifyIdentifierOccurrence(
        line: string,
        codeMask: ArrayLike<number>,
        start: number,
        length: number,
    ): IdentifierOccurrenceKind {
        if (this.isWriteOnlyAssignmentTarget(line, codeMask, start, length)) {
            return 'write-only';
        }

        if (this.isMessageCarrierWriteUsage(line, codeMask, start)) {
            return 'indirect';
        }

        if (this.isEventDispatchArgumentUsage(line, codeMask, start)) {
            return 'indirect';
        }

        if (this.isDynamicSelectorUsage(line, start)) {
            return 'blocked';
        }

        return 'direct';
    }

    private isWriteOnlyAssignmentTarget(
        line: string,
        codeMask: ArrayLike<number>,
        start: number,
        length: number,
    ): boolean {
        if (!/^\s*$/.test(line.slice(0, start))) {
            return false;
        }

        const nextCodeIndex = this.findNextCodeIndex(line, codeMask, start + length);

        return nextCodeIndex >= 0 && line[nextCodeIndex] === '=';
    }

    private isInitializedDeclarationOccurrence(
        line: string,
        codeMask: ArrayLike<number>,
        start: number,
        length: number,
    ): boolean {
        let scanFrom = start + length;

        while (scanFrom < line.length) {
            const nextCodeIndex = this.findNextCodeIndex(line, codeMask, scanFrom);

            if (nextCodeIndex < 0) {
                return false;
            }

            if (line[nextCodeIndex] === '[') {
                const closeBracketIndex = line.indexOf(']', nextCodeIndex + 1);

                if (closeBracketIndex < 0) {
                    return false;
                }

                scanFrom = closeBracketIndex + 1;
                continue;
            }

            return line[nextCodeIndex] === '=';
        }

        return false;
    }

    private isSqlIntoAssignmentUsage(
        line: string,
        codeMask: ArrayLike<number>,
        start: number,
    ): boolean {
        const previousCodeIndex = this.findPreviousCodeIndex(line, codeMask, start - 1);

        if (previousCodeIndex < 0 || line[previousCodeIndex] !== ':') {
            return false;
        }

        return /\binto\b[^;]*$/i.test(line.slice(0, previousCodeIndex));
    }

    private isMessageCarrierWriteUsage(
        line: string,
        codeMask: ArrayLike<number>,
        start: number,
    ): boolean {
        const assignmentIndex = this.findFirstCodeCharacter(line, codeMask, '=');

        if (assignmentIndex < 0 || start <= assignmentIndex) {
            return false;
        }

        const leftSide = line
            .slice(0, assignmentIndex)
            .trim()
            .toLowerCase();

        return /^message\.(powerobjectparm|wordparm|longparm|stringparm|doubleparm)$/.test(leftSide);
    }

    private isEventDispatchArgumentUsage(
        line: string,
        codeMask: ArrayLike<number>,
        start: number,
    ): boolean {
        const context = this.findEventDispatchUsageContext(line, codeMask, start);

        if (!context) {
            return false;
        }

        if (context.isMethodCall) {
            return true;
        }

        return context.argIndex >= 1;
    }

    private findEventDispatchUsageContext(
        line: string,
        codeMask: ArrayLike<number>,
        occurrenceStart: number,
    ): EventDispatchUsageContext | undefined {
        const lowerLine = line.toLowerCase();
        const tokenPattern = /\b(postevent|triggerevent)\b/gi;
        let result: EventDispatchUsageContext | undefined;

        for (const match of lowerLine.matchAll(tokenPattern)) {
            const callStart = match.index;

            if (callStart === undefined || codeMask[callStart] !== 1) {
                continue;
            }

            let openParen = callStart + match[0].length;

            while (openParen < line.length && /\s/.test(line[openParen])) {
                openParen++;
            }

            if (line[openParen] !== '(' || codeMask[openParen] !== 1) {
                continue;
            }

            const closeParen = this.findMatchingParenOnLine(line, codeMask, openParen);

            if (
                closeParen < 0 ||
                occurrenceStart <= openParen ||
                occurrenceStart >= closeParen
            ) {
                continue;
            }

            result = {
                argIndex: this.countTopLevelArgumentIndex(
                    line,
                    codeMask,
                    openParen,
                    occurrenceStart,
                ),
                isMethodCall: this.isMethodCall(line, codeMask, callStart),
            };
        }

        return result;
    }

    private findMatchingParenOnLine(
        line: string,
        codeMask: ArrayLike<number>,
        openParen: number,
    ): number {
        let depth = 0;

        for (let index = openParen + 1; index < line.length; index++) {
            if (codeMask[index] !== 1) {
                continue;
            }

            if (line[index] === '(') {
                depth++;
                continue;
            }

            if (line[index] !== ')') {
                continue;
            }

            if (depth === 0) {
                return index;
            }

            depth--;
        }

        return -1;
    }

    private countTopLevelArgumentIndex(
        line: string,
        codeMask: ArrayLike<number>,
        openParen: number,
        occurrenceStart: number,
    ): number {
        let depth = 0;
        let argIndex = 0;

        for (let index = openParen + 1; index < occurrenceStart; index++) {
            if (codeMask[index] !== 1) {
                continue;
            }

            if (line[index] === '(') {
                depth++;
                continue;
            }

            if (line[index] === ')') {
                if (depth > 0) {
                    depth--;
                }
                continue;
            }

            if (line[index] === ',' && depth === 0) {
                argIndex++;
            }
        }

        return argIndex;
    }

    private isMethodCall(
        line: string,
        codeMask: ArrayLike<number>,
        callStart: number,
    ): boolean {
        for (let index = callStart - 1; index >= 0; index--) {
            if (/\s/.test(line[index])) {
                continue;
            }

            return codeMask[index] === 1 && line[index] === '.';
        }

        return false;
    }

    private isDynamicSelectorUsage(
        line: string,
        start: number,
    ): boolean {
        return /\b(?:post\s+)?(?:event\s+)?dynamic\s*$/i.test(line.slice(0, start));
    }

    private findFirstCodeCharacter(
        line: string,
        codeMask: ArrayLike<number>,
        target: string,
    ): number {
        for (let index = 0; index < line.length; index++) {
            if (codeMask[index] === 1 && line[index] === target) {
                return index;
            }
        }

        return -1;
    }

    private findIdentifierRangeOnLine(
        line: string,
        codeMask: ArrayLike<number>,
        lineNumber: number,
        identifier: string,
        fromIndex: number,
    ): vscode.Range | undefined {
        const target = identifier.toLowerCase();

        for (let index = Math.max(0, fromIndex); index <= line.length - target.length; index++) {
            if (codeMask[index] !== 1) {
                continue;
            }

            if (!this.matchesIdentifierAt(line, index, target)) {
                continue;
            }

            return new vscode.Range(lineNumber, index, lineNumber, index + target.length);
        }

        return undefined;
    }

    private findNextCodeIndex(
        line: string,
        codeMask: ArrayLike<number>,
        start: number,
    ): number {
        for (let index = start; index < line.length; index++) {
            if (codeMask[index] === 1 && !/\s/.test(line[index])) {
                return index;
            }
        }

        return -1;
    }

    private findPreviousCodeIndex(
        line: string,
        codeMask: ArrayLike<number>,
        start: number,
    ): number {
        for (let index = start; index >= 0; index--) {
            if (codeMask[index] === 1 && !/\s/.test(line[index])) {
                return index;
            }
        }

        return -1;
    }

    private findClearShadowedMember(
        symbol: PbSymbol,
        symbols: PbSymbol[],
    ): PbSymbol | undefined {
        const targetObjectName = this.normalizeValue(symbol.fileObjectName);
        const targetName = this.normalizeValue(symbol.name);

        if (!targetObjectName || !targetName) {
            return undefined;
        }

        const memberMatches = symbols.filter(candidate =>
            candidate.kind === 'variable' &&
            candidate.declarationScope === 'member' &&
            this.normalizeValue(candidate.fileObjectName) === targetObjectName &&
            this.normalizeValue(candidate.name) === targetName,
        );

        if (memberMatches.length !== 1) {
            return undefined;
        }

        return memberMatches[0];
    }

    private getShadowedMemberKind(symbol: PbSymbol): ShadowedMemberKind {
        const access = this.normalizeValue(symbol.access);

        if (access === 'shared') {
            return 'shared';
        }

        if (access === 'global') {
            return 'global';
        }

        return 'instance';
    }

    private buildShadowingMessage(
        declarationScope: 'local' | 'parameter',
        memberKind: ShadowedMemberKind,
    ): string {
        const prefix = declarationScope === 'parameter'
            ? 'El parametro'
            : 'La variable local';

        const memberLabel = memberKind === 'instance'
            ? 'de instancia'
            : memberKind;

        return `${prefix} oculta una variable ${memberLabel} del objeto actual.`;
    }

    private isPrivateMemberVariable(symbol: PbSymbol): boolean {
        return symbol.kind === 'variable' &&
            symbol.declarationScope === 'member' &&
            this.isPrivateAccess(symbol.access);
    }

    private hasPrivateMemberUsageAmbiguity(
        symbol: PbSymbol,
        symbols: PbSymbol[],
    ): boolean {
        const normalizedName = this.normalizeValue(symbol.name);

        return symbols.some(candidate =>
            candidate.uri.toString() === symbol.uri.toString() &&
            !candidate.selectionRange.isEqual(symbol.selectionRange) &&
            this.normalizeValue(candidate.name) === normalizedName,
        );
    }

    private isPrivateAccess(access: string | undefined): boolean {
        const normalizedAccess = this.normalizeValue(access);
        return normalizedAccess === 'private' ||
            normalizedAccess === 'privateread' ||
            normalizedAccess === 'privatewrite';
    }

    private normalizeValue(value: string | undefined): string {
        return value?.trim().toLowerCase() ?? '';
    }

    private buildAmbiguousCallMessage(
        callName: string,
        candidateCount: number,
    ): string {
        const normalizedCount = Math.max(candidateCount, 2);
        const label = normalizedCount === 1 ? 'candidata compatible' : 'candidatas compatibles';

        return `La llamada a ${callName} sigue siendo ambigua entre ${normalizedCount} ${label}.`;
    }

    private matchesIdentifierAt(
        line: string,
        start: number,
        target: string,
    ): boolean {
        const candidate = line.slice(start, start + target.length).toLowerCase();

        if (candidate !== target) {
            return false;
        }

        const previous = start > 0
            ? line[start - 1]
            : '';
        const next = start + target.length < line.length
            ? line[start + target.length]
            : '';

        return !isPbIdentifierChar(previous) && !isPbIdentifierChar(next);
    }

    private pushDiagnostic(
        diagnostics: PbDiagnosticInfo[],
        physicalLines: string[],
        lineNumber: number,
        code: PbDiagnosticCode,
        severity: vscode.DiagnosticSeverity,
    ): void {
        diagnostics.push({
            message: getDiagnosticMessageEs(code),
            range: new vscode.Range(
                lineNumber,
                0,
                lineNumber,
                physicalLines[lineNumber]?.length ?? 1,
            ),
            severity,
            code,
        });
    }

    private pushExactDiagnostic(
        diagnostics: PbDiagnosticInfo[],
        range: vscode.Range,
        code: PbDiagnosticCode,
        severity: vscode.DiagnosticSeverity,
        messageOverride?: string,
    ): void {
        diagnostics.push({
            message: messageOverride ?? getDiagnosticMessageEs(code),
            range,
            severity,
            code,
        });
    }
}