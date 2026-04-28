import * as vscode from 'vscode';
import { minimatch } from 'minimatch';

const DEFAULT_INDEXING_EXCLUDE = ['**/node_modules/**'];

interface WorkspaceConfigurationInspectLike<T> {
    readonly globalValue?: T;
    readonly workspaceValue?: T;
    readonly workspaceFolderValue?: T;
    readonly globalLanguageValue?: T;
    readonly workspaceLanguageValue?: T;
    readonly workspaceFolderLanguageValue?: T;
}

export type PowerBuilderFormattingCaseMode = 'preserve' | 'upper' | 'lower';

export type PowerBuilderFormattingSystemFunctionCaseMode = 'preserve' | 'catalog';

export type PowerBuilderFormattingBlankLineMode = 'preserve' | 'compact';

export type PowerBuilderFormattingIndentStyle = 'spaces' | 'tabs';

export interface PowerBuilderFormatterConfig {
    enabled: boolean;
    formatOnSave: boolean;
    formatOnType: boolean;
    formatRange: boolean;
    keywordCase: PowerBuilderFormattingCaseMode;
    statementCase: PowerBuilderFormattingCaseMode;
    typeCase: PowerBuilderFormattingCaseMode;
    eventKeywordCase: PowerBuilderFormattingCaseMode;
    systemFunctionCase: PowerBuilderFormattingSystemFunctionCaseMode;
    sqlKeywordCase: PowerBuilderFormattingCaseMode;
    preserveUserIdentifierCase: boolean;
    spacesInsideParentheses: boolean;
    spaceAfterComma: boolean;
    spaceAroundOperators: boolean;
    oneStatementPerLine: boolean;
    indentStyle: PowerBuilderFormattingIndentStyle;
    indentSize: number;
    continuationIndentSize: number;
    blankLineBetweenSections: boolean;
    preserveComments: boolean;
    preserveStrings: boolean;
    preserveManualLineBreaksInSql: boolean;
    conservativeEmbeddedSqlFormatting: boolean;
    trimTrailingWhitespace: boolean;
    normalizeBlankLines: PowerBuilderFormattingBlankLineMode;
}

export interface PowerBuilderFormatterProjectProfileSettings {
    enabled?: boolean;
    formatOnSave?: boolean;
    formatOnType?: boolean;
    formatRange?: boolean;
    keywordCase?: PowerBuilderFormattingCaseMode;
    declarationKeywordCase?: PowerBuilderFormattingCaseMode;
    statementCase?: PowerBuilderFormattingCaseMode;
    typeCase?: PowerBuilderFormattingCaseMode;
    eventKeywordCase?: PowerBuilderFormattingCaseMode;
    systemFunctionCase?: PowerBuilderFormattingSystemFunctionCaseMode;
    sqlKeywordCase?: PowerBuilderFormattingCaseMode;
    preserveUserIdentifierCase?: boolean;
    spacesInsideParentheses?: boolean;
    spaceAfterComma?: boolean;
    spaceAroundOperators?: boolean;
    oneStatementPerLine?: boolean;
    indentStyle?: PowerBuilderFormattingIndentStyle;
    indentSize?: number;
    continuationIndentSize?: number;
    blankLineBetweenSections?: boolean;
    preserveComments?: boolean;
    preserveStrings?: boolean;
    preserveManualLineBreaksInSql?: boolean;
    conservativeEmbeddedSqlFormatting?: boolean;
    trimTrailingWhitespace?: boolean;
    normalizeBlankLines?: PowerBuilderFormattingBlankLineMode;
}

export interface PowerBuilderFormatterProjectProfile {
    name?: string;
    projectName?: string;
    projectPathGlob?: string;
    sourcePathGlob?: string;
    sourceRootGlob?: string;
    settings: PowerBuilderFormatterProjectProfileSettings;
}

export interface ExtensionConfig {
    diagnosticsEnabled: boolean;
    formatting: PowerBuilderFormatterConfig;
    formattingEnabled: boolean;
    formattingIndentSize: number;
    formattingUpperCaseKeywords: boolean;
    formattingKeywordCase: PowerBuilderFormattingCaseMode;
    formattingDeclarationKeywordCase: PowerBuilderFormattingCaseMode;
    formattingSystemFunctionCase: PowerBuilderFormattingSystemFunctionCaseMode;
    formattingUserCallableCase: 'preserve';
    formattingSqlKeywordCase: PowerBuilderFormattingCaseMode;
    formattingTrimTrailingWhitespace: boolean;
    formattingNormalizeBlankLines: PowerBuilderFormattingBlankLineMode;
    formattingExperimentalSpaceInsideParens: boolean;
    formattingExperimentalSplitCollapsedStatements: boolean;
    hoverEnabled: boolean;
    completionEnabled: boolean;
    signatureHelpEnabled: boolean;
    inlayHintsEnabled: boolean;
    dataWindowExperimentalIdeEnabled: boolean;
    indexingExclude: string[];
}

export function getConfig(): ExtensionConfig {
    const cfg = vscode.workspace.getConfiguration('powerbuilder');
    const formatting = getFormattingConfig(cfg);

    return {
        diagnosticsEnabled: cfg.get<boolean>('diagnostics.enabled', true),
        formatting,
        formattingEnabled: formatting.enabled,
        formattingIndentSize: formatting.indentSize,
        formattingUpperCaseKeywords: cfg.get<boolean>('formatting.upperCaseKeywords', false),
        formattingKeywordCase: formatting.keywordCase,
        formattingDeclarationKeywordCase: formatting.typeCase,
        formattingSystemFunctionCase: formatting.systemFunctionCase,
        formattingUserCallableCase: 'preserve',
        formattingSqlKeywordCase: formatting.sqlKeywordCase,
        formattingTrimTrailingWhitespace: formatting.trimTrailingWhitespace,
        formattingNormalizeBlankLines: formatting.normalizeBlankLines,
        formattingExperimentalSpaceInsideParens: formatting.spacesInsideParentheses,
        formattingExperimentalSplitCollapsedStatements: formatting.oneStatementPerLine,
        hoverEnabled: cfg.get<boolean>('hover.enabled', true),
        completionEnabled: cfg.get<boolean>('completion.enabled', true),
        signatureHelpEnabled: cfg.get<boolean>('signatureHelp.enabled', true),
        inlayHintsEnabled: cfg.get<boolean>('inlayHints.enabled', true),
        dataWindowExperimentalIdeEnabled: cfg.get<boolean>('datawindow.experimentalIde.enabled', false),
        indexingExclude: cfg.get<string[]>('indexing.exclude', []),
    };
}

export function getFormattingConfig(
    cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('powerbuilder'),
): PowerBuilderFormatterConfig {
    const keywordCase = resolveFormattingKeywordCase(cfg);
    const declarationKeywordCase = normalizeFormattingCaseMode(
        cfg.get<PowerBuilderFormattingCaseMode>('formatting.declarationKeywordCase', 'preserve'),
        'preserve',
    );
    const indentSize = normalizePositiveInteger(
        cfg.get<number>('formatting.indentSize', 3),
        3,
    );
    const trimTrailingWhitespace = cfg.get<boolean>('formatting.trimTrailingWhitespace', true);
    const normalizeBlankLines = normalizeBlankLineMode(
        cfg.get<PowerBuilderFormattingBlankLineMode>('formatting.normalizeBlankLines', 'preserve'),
        'preserve',
    );

    return {
        enabled: cfg.get<boolean>('formatting.enabled', true),
        formatOnSave: cfg.get<boolean>('formatting.formatOnSave', false),
        formatOnType: cfg.get<boolean>('formatting.formatOnType', false),
        formatRange: cfg.get<boolean>('formatting.formatRange', true),
        keywordCase,
        statementCase: resolveFormattingCaseOverride(
            cfg,
            'formatting.statementCase',
            keywordCase,
        ),
        typeCase: resolveFormattingCaseOverride(
            cfg,
            'formatting.typeCase',
            declarationKeywordCase,
        ),
        eventKeywordCase: resolveFormattingCaseOverride(
            cfg,
            'formatting.eventKeywordCase',
            declarationKeywordCase,
        ),
        systemFunctionCase: normalizeSystemFunctionCaseMode(
            cfg.get<PowerBuilderFormattingSystemFunctionCaseMode>('formatting.systemFunctionCase', 'catalog'),
            'catalog',
        ),
        sqlKeywordCase: normalizeFormattingCaseMode(
            cfg.get<PowerBuilderFormattingCaseMode>('formatting.sqlKeywordCase', 'upper'),
            'upper',
        ),
        preserveUserIdentifierCase: cfg.get<boolean>('formatting.preserveUserIdentifierCase', true),
        spacesInsideParentheses: resolveBooleanSettingWithLegacyFallback(
            cfg,
            'formatting.spacesInsideParentheses',
            'formatting.experimental.spaceInsideParens',
            false,
        ),
        spaceAfterComma: cfg.get<boolean>('formatting.spaceAfterComma', true),
        spaceAroundOperators: cfg.get<boolean>('formatting.spaceAroundOperators', true),
        oneStatementPerLine: resolveBooleanSettingWithLegacyFallback(
            cfg,
            'formatting.oneStatementPerLine',
            'formatting.experimental.splitCollapsedStatements',
            false,
        ),
        indentStyle: normalizeIndentStyle(
            cfg.get<string>('formatting.indentStyle', 'spaces'),
            'spaces',
        ),
        indentSize,
        continuationIndentSize: resolvePositiveIntegerOverride(
            cfg,
            'formatting.continuationIndentSize',
            indentSize,
        ),
        blankLineBetweenSections: cfg.get<boolean>('formatting.blankLineBetweenSections', false),
        preserveComments: cfg.get<boolean>('formatting.preserveComments', true),
        preserveStrings: cfg.get<boolean>('formatting.preserveStrings', true),
        preserveManualLineBreaksInSql: cfg.get<boolean>('formatting.preserveManualLineBreaksInSql', true),
        conservativeEmbeddedSqlFormatting: cfg.get<boolean>('formatting.conservativeEmbeddedSqlFormatting', true),
        trimTrailingWhitespace,
        normalizeBlankLines,
    };
}

export function getFormattingProjectProfiles(
    cfg: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('powerbuilder'),
): PowerBuilderFormatterProjectProfile[] {
    const rawProfiles = cfg.get<unknown>('formatting.projectProfiles', []);

    if (!Array.isArray(rawProfiles)) {
        return [];
    }

    return rawProfiles
        .map(profile => normalizeFormattingProjectProfile(profile))
        .filter((profile): profile is PowerBuilderFormatterProjectProfile => !!profile);
}

export function getIndexingExcludePatterns(): string[] {
    const configured = getConfig().indexingExclude
        .map(normalizeGlobPattern)
        .filter((pattern): pattern is string => !!pattern);

    return Array.from(
        new Set([
            ...DEFAULT_INDEXING_EXCLUDE,
            ...configured,
        ]),
    );
}

export function getIndexingExcludeGlob(): string | undefined {
    const patterns = getIndexingExcludePatterns();

    if (patterns.length === 0) {
        return undefined;
    }

    if (patterns.length === 1) {
        return patterns[0];
    }

    return `{${patterns.join(',')}}`;
}

export function isExcludedUri(uri: vscode.Uri): boolean {
    const patterns = getIndexingExcludePatterns();

    if (patterns.length === 0) {
        return false;
    }

    const normalizedCandidate = normalizeWorkspaceRelativePath(uri);

    if (!normalizedCandidate) {
        return false;
    }

    return matchesExcludedCandidate(normalizedCandidate, patterns);
}

export function isExcludedRootUri(uri: vscode.Uri): boolean {
    const patterns = getIndexingExcludePatterns();

    if (patterns.length === 0) {
        return false;
    }

    const normalizedCandidate = normalizeWorkspaceRelativePath(uri);

    if (!normalizedCandidate) {
        return false;
    }

    return matchesExcludedCandidate(normalizedCandidate, patterns, true);
}

function normalizeWorkspaceRelativePath(uri: vscode.Uri): string {
    const relativePath = vscode.workspace.asRelativePath(uri, false);
    const candidate = relativePath || uri.fsPath || uri.path;

    return normalizeGlobPattern(candidate)?.replace(/^\/+/, '') ?? '';
}

function normalizeGlobPattern(value: string): string | undefined {
    const trimmed = value.trim();

    if (!trimmed) {
        return undefined;
    }

    return trimmed.replace(/\\/g, '/');
}

function matchesExcludedCandidate(
    normalizedCandidate: string,
    patterns: readonly string[],
    includeDescendants: boolean = false,
): boolean {
    const descendantCandidate = includeDescendants
        ? `${normalizedCandidate.replace(/\/+$/, '')}/**`
        : undefined;

    return patterns.some(pattern =>
        minimatch(normalizedCandidate, pattern, {
            dot: true,
            nocase: true,
        }) || (
            !!descendantCandidate &&
            minimatch(descendantCandidate, pattern, {
                dot: true,
                nocase: true,
            })
        ),
    );
}

function resolveFormattingKeywordCase(
    cfg: vscode.WorkspaceConfiguration,
): PowerBuilderFormattingCaseMode {
    const keywordCaseInspection = cfg.inspect<PowerBuilderFormattingCaseMode>('formatting.keywordCase');

    if (hasExplicitConfigurationValue(keywordCaseInspection)) {
        return normalizeFormattingCaseMode(
            cfg.get<PowerBuilderFormattingCaseMode>('formatting.keywordCase', 'upper'),
            'upper',
        );
    }

    const legacyUpperCaseInspection = cfg.inspect<boolean>('formatting.upperCaseKeywords');

    if (hasExplicitConfigurationValue(legacyUpperCaseInspection)) {
        return cfg.get<boolean>('formatting.upperCaseKeywords', false)
            ? 'upper'
            : 'preserve';
    }

    return 'upper';
}

function hasExplicitConfigurationValue<T>(
    inspection: WorkspaceConfigurationInspectLike<T> | undefined,
): boolean {
    return !!inspection && (
        inspection.globalValue !== undefined ||
        inspection.workspaceValue !== undefined ||
        inspection.workspaceFolderValue !== undefined ||
        inspection.globalLanguageValue !== undefined ||
        inspection.workspaceLanguageValue !== undefined ||
        inspection.workspaceFolderLanguageValue !== undefined
    );
}

function normalizeFormattingCaseMode(
    value: string | undefined,
    fallback: PowerBuilderFormattingCaseMode,
): PowerBuilderFormattingCaseMode {
    return value === 'upper' || value === 'lower' || value === 'preserve'
        ? value
        : fallback;
}

function normalizeSystemFunctionCaseMode(
    value: string | undefined,
    fallback: PowerBuilderFormattingSystemFunctionCaseMode,
): PowerBuilderFormattingSystemFunctionCaseMode {
    return value === 'catalog' || value === 'preserve'
        ? value
        : fallback;
}

function normalizeBlankLineMode(
    value: string | undefined,
    fallback: PowerBuilderFormattingBlankLineMode,
): PowerBuilderFormattingBlankLineMode {
    return value === 'compact' || value === 'preserve'
        ? value
        : fallback;
}

function normalizeIndentStyle(
    value: string | undefined,
    fallback: PowerBuilderFormattingIndentStyle,
): PowerBuilderFormattingIndentStyle {
    return value === 'spaces' || value === 'tabs'
        ? value
        : fallback;
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
    if (value === undefined || !Number.isFinite(value)) {
        return fallback;
    }

    const normalized = Math.trunc(value);

    return normalized > 0
        ? normalized
        : fallback;
}

function resolveFormattingCaseOverride(
    cfg: vscode.WorkspaceConfiguration,
    key: string,
    fallback: PowerBuilderFormattingCaseMode,
): PowerBuilderFormattingCaseMode {
    const inspection = cfg.inspect<PowerBuilderFormattingCaseMode>(key);

    if (!hasExplicitConfigurationValue(inspection)) {
        return fallback;
    }

    return normalizeFormattingCaseMode(
        cfg.get<PowerBuilderFormattingCaseMode>(key, fallback),
        fallback,
    );
}

function resolveBooleanSettingWithLegacyFallback(
    cfg: vscode.WorkspaceConfiguration,
    key: string,
    legacyKey: string,
    fallback: boolean,
): boolean {
    const inspection = cfg.inspect<boolean>(key);

    if (hasExplicitConfigurationValue(inspection)) {
        return cfg.get<boolean>(key, fallback);
    }

    return cfg.get<boolean>(legacyKey, fallback);
}

function resolvePositiveIntegerOverride(
    cfg: vscode.WorkspaceConfiguration,
    key: string,
    fallback: number,
): number {
    const inspection = cfg.inspect<number>(key);

    if (!hasExplicitConfigurationValue(inspection)) {
        return fallback;
    }

    return normalizePositiveInteger(cfg.get<number>(key, fallback), fallback);
}

function normalizeFormattingProjectProfile(
    value: unknown,
): PowerBuilderFormatterProjectProfile | undefined {
    if (!isRecord(value)) {
        return undefined;
    }

    const projectName = normalizeProfileProjectName(value.projectName);
    const rawProjectPathGlob = asOptionalString(value.projectPathGlob);
    const projectPathGlob = rawProjectPathGlob
        ? normalizeGlobPattern(rawProjectPathGlob)
        : undefined;
    const rawSourcePathGlob = asOptionalString(value.sourcePathGlob);
    const sourcePathGlob = rawSourcePathGlob
        ? normalizeGlobPattern(rawSourcePathGlob)
        : undefined;
    const rawSourceRootGlob = asOptionalString(value.sourceRootGlob);
    const sourceRootGlob = rawSourceRootGlob
        ? normalizeGlobPattern(rawSourceRootGlob)
        : undefined;
    const settings = normalizeFormattingProjectProfileSettings(value.settings);

    if (!settings || (!projectName && !projectPathGlob && !sourcePathGlob && !sourceRootGlob)) {
        return undefined;
    }

    return {
        name: asOptionalString(value.name),
        projectName,
        projectPathGlob,
        sourcePathGlob,
        sourceRootGlob,
        settings,
    };
}

function normalizeFormattingProjectProfileSettings(
    value: unknown,
): PowerBuilderFormatterProjectProfileSettings | undefined {
    if (!isRecord(value)) {
        return undefined;
    }

    const settings: Record<string, unknown> = {};

    copyBooleanSetting(value, 'enabled', settings);
    copyBooleanSetting(value, 'formatOnSave', settings);
    copyBooleanSetting(value, 'formatOnType', settings);
    copyBooleanSetting(value, 'formatRange', settings);
    copyCaseSetting(value, 'keywordCase', settings);
    copyCaseSetting(value, 'declarationKeywordCase', settings);
    copyCaseSetting(value, 'statementCase', settings);
    copyCaseSetting(value, 'typeCase', settings);
    copyCaseSetting(value, 'eventKeywordCase', settings);
    copySystemFunctionCaseSetting(value, 'systemFunctionCase', settings);
    copyCaseSetting(value, 'sqlKeywordCase', settings);
    copyBooleanSetting(value, 'preserveUserIdentifierCase', settings);
    copyBooleanSetting(value, 'spacesInsideParentheses', settings);
    copyBooleanSetting(value, 'spaceAfterComma', settings);
    copyBooleanSetting(value, 'spaceAroundOperators', settings);
    copyBooleanSetting(value, 'oneStatementPerLine', settings);
    copyIndentStyleSetting(value, 'indentStyle', settings);
    copyPositiveIntegerSetting(value, 'indentSize', settings);
    copyPositiveIntegerSetting(value, 'continuationIndentSize', settings);
    copyBooleanSetting(value, 'blankLineBetweenSections', settings);
    copyBooleanSetting(value, 'preserveComments', settings);
    copyBooleanSetting(value, 'preserveStrings', settings);
    copyBooleanSetting(value, 'preserveManualLineBreaksInSql', settings);
    copyBooleanSetting(value, 'conservativeEmbeddedSqlFormatting', settings);
    copyBooleanSetting(value, 'trimTrailingWhitespace', settings);
    copyBlankLineSetting(value, 'normalizeBlankLines', settings);

    return Object.keys(settings).length > 0
        ? settings as PowerBuilderFormatterProjectProfileSettings
        : undefined;
}

function copyBooleanSetting(
    source: Record<string, unknown>,
    key: string,
    target: Record<string, unknown>,
): void {
    if (typeof source[key] === 'boolean') {
        target[key] = source[key];
    }
}

function copyCaseSetting(
    source: Record<string, unknown>,
    key: string,
    target: Record<string, unknown>,
): void {
    const normalized = normalizeFormattingCaseMode(asOptionalString(source[key]), undefined as never);

    if (normalized) {
        target[key] = normalized;
    }
}

function copySystemFunctionCaseSetting(
    source: Record<string, unknown>,
    key: string,
    target: Record<string, unknown>,
): void {
    const normalized = normalizeSystemFunctionCaseMode(asOptionalString(source[key]), undefined as never);

    if (normalized) {
        target[key] = normalized;
    }
}

function copyBlankLineSetting(
    source: Record<string, unknown>,
    key: string,
    target: Record<string, unknown>,
): void {
    const normalized = normalizeBlankLineMode(asOptionalString(source[key]), undefined as never);

    if (normalized) {
        target[key] = normalized;
    }
}

function copyIndentStyleSetting(
    source: Record<string, unknown>,
    key: string,
    target: Record<string, unknown>,
): void {
    const normalized = normalizeIndentStyle(asOptionalString(source[key]), undefined as never);

    if (normalized) {
        target[key] = normalized;
    }
}

function copyPositiveIntegerSetting(
    source: Record<string, unknown>,
    key: string,
    target: Record<string, unknown>,
): void {
    if (typeof source[key] !== 'number') {
        return;
    }

    const normalized = normalizePositiveInteger(source[key] as number, undefined as never);

    if (Number.isFinite(normalized)) {
        target[key] = normalized;
    }
}

function normalizeProfileProjectName(value: unknown): string | undefined {
    const text = asOptionalString(value)?.trim().toLowerCase();

    if (!text) {
        return undefined;
    }

    return text.endsWith('.pbproj')
        ? text.slice(0, -'.pbproj'.length)
        : text;
}

function asOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0
        ? value
        : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}