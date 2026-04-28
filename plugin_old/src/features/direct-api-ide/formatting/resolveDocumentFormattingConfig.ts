import * as vscode from 'vscode';
import { minimatch } from 'minimatch';
import {
    PowerBuilderFormatterConfig,
    PowerBuilderFormatterProjectProfile,
    PowerBuilderFormatterProjectProfileSettings,
    getFormattingConfig,
    getFormattingProjectProfiles,
} from '../../../core/config/extensionConfiguration';
import { SymbolIndex } from '../../../powerbuilder/indexing/symbolIndex';
import { WorkspaceIndexer } from '../../../powerbuilder/indexing/workspaceIndexer';
import { normalizeWorkspaceUriPath, PbProjectDefinition } from '../../../powerbuilder/workspace/pbProjectModel';
import { PowerBuilderProjectRegistry } from '../../../powerbuilder/workspace/projectRegistry';

const formattingProjectRegistry = PowerBuilderProjectRegistry.getInstance();
const formattingProjectIndexer = new WorkspaceIndexer(SymbolIndex.getInstance());

let cachedWorkspaceKey: string | undefined;
let projectProfilesPrimed = false;

export async function getDocumentFormattingConfig(
    document: vscode.TextDocument,
): Promise<PowerBuilderFormatterConfig> {
    const cfg = vscode.workspace.getConfiguration('powerbuilder', document.uri);
    const baseConfig = getFormattingConfig(cfg);
    const profiles = getFormattingProjectProfiles(cfg);

    if (profiles.length === 0) {
        return baseConfig;
    }

    const project = await resolvePreferredProject(document.uri);

    if (!project) {
        return baseConfig;
    }

    return applyProjectProfiles(baseConfig, project, document.uri, profiles);
}

async function resolvePreferredProject(uri: vscode.Uri): Promise<PbProjectDefinition | undefined> {
    refreshWorkspaceCacheIfNeeded();

    const cachedProject = formattingProjectRegistry.getPreferredProjectForSourceFile(uri);

    if (cachedProject) {
        return cachedProject;
    }

    if (!projectProfilesPrimed || formattingProjectRegistry.getProjects().length === 0) {
        await formattingProjectIndexer.indexProjects({ indexSourceFiles: false });
        projectProfilesPrimed = true;
    }

    return formattingProjectRegistry.getPreferredProjectForSourceFile(uri);
}

function refreshWorkspaceCacheIfNeeded(): void {
    const nextWorkspaceKey = getWorkspaceKey();

    if (nextWorkspaceKey !== cachedWorkspaceKey) {
        cachedWorkspaceKey = nextWorkspaceKey;
        projectProfilesPrimed = false;
    }
}

function getWorkspaceKey(): string {
    return (vscode.workspace.workspaceFolders ?? [])
        .map(folder => normalizeWorkspaceUriPath(folder.uri))
        .join('|');
}

function applyProjectProfiles(
    baseConfig: PowerBuilderFormatterConfig,
    project: PbProjectDefinition,
    documentUri: vscode.Uri,
    profiles: readonly PowerBuilderFormatterProjectProfile[],
): PowerBuilderFormatterConfig {
    let current = baseConfig;

    for (const profile of profiles) {
        if (!matchesProjectProfile(project, documentUri, profile)) {
            continue;
        }

        current = applyProjectProfileSettings(current, profile.settings);
    }

    return current;
}

function matchesProjectProfile(
    project: PbProjectDefinition,
    documentUri: vscode.Uri,
    profile: PowerBuilderFormatterProjectProfile,
): boolean {
    if (profile.projectName) {
        const normalizedProjectName = project.name.trim().toLowerCase();
        const normalizedApplicationName = project.applicationName?.trim().toLowerCase();

        if (
            normalizedProjectName !== profile.projectName &&
            normalizedApplicationName !== profile.projectName
        ) {
            return false;
        }
    }

    if (profile.projectPathGlob) {
        const projectPathCandidates = new Set<string>([
            normalizeWorkspaceUriPath(project.uri),
            vscode.workspace.asRelativePath(project.uri, false).replace(/\\/g, '/').toLowerCase(),
        ]);

        const matched = Array.from(projectPathCandidates).some(candidate =>
            !!candidate && minimatch(candidate, profile.projectPathGlob!, {
                dot: true,
                nocase: true,
            }),
        );

        if (!matched) {
            return false;
        }
    }

    if (profile.sourcePathGlob) {
        const sourcePathCandidates = new Set<string>([
            normalizeWorkspaceUriPath(documentUri),
            vscode.workspace.asRelativePath(documentUri, false).replace(/\\/g, '/').toLowerCase(),
        ]);

        const matched = Array.from(sourcePathCandidates).some(candidate =>
            !!candidate && minimatch(candidate, profile.sourcePathGlob!, {
                dot: true,
                nocase: true,
            }),
        );

        if (!matched) {
            return false;
        }
    }

    if (profile.sourceRootGlob) {
        const sourceRoot = resolveEffectiveProjectRoot(project, documentUri);

        if (!sourceRoot) {
            return false;
        }

        const sourceRootCandidates = new Set<string>([
            normalizeWorkspaceUriPath(sourceRoot),
            vscode.workspace.asRelativePath(sourceRoot, false).replace(/\\/g, '/').toLowerCase(),
        ]);

        const matched = Array.from(sourceRootCandidates).some(candidate =>
            !!candidate && minimatch(candidate, profile.sourceRootGlob!, {
                dot: true,
                nocase: true,
            }),
        );

        if (!matched) {
            return false;
        }
    }

    return true;
}

function resolveEffectiveProjectRoot(
    project: PbProjectDefinition,
    documentUri: vscode.Uri,
): vscode.Uri | undefined {
    const sourcePath = normalizeWorkspaceUriPath(documentUri);
    const roots = formattingProjectRegistry.getEffectiveProjectSourceRoots(project)
        .map(rootUri => ({
            rootUri,
            normalizedPath: normalizeWorkspaceUriPath(rootUri),
        }))
        .filter(root => sourcePath === root.normalizedPath || sourcePath.startsWith(`${root.normalizedPath}/`))
        .sort((left, right) => right.normalizedPath.length - left.normalizedPath.length);

    return roots[0]?.rootUri;
}

function applyProjectProfileSettings(
    baseConfig: PowerBuilderFormatterConfig,
    settings: PowerBuilderFormatterProjectProfileSettings,
): PowerBuilderFormatterConfig {
    const keywordCase = settings.keywordCase ?? baseConfig.keywordCase;
    const declarationKeywordCase = settings.declarationKeywordCase ?? baseConfig.typeCase;
    const indentSize = settings.indentSize ?? baseConfig.indentSize;

    return {
        enabled: settings.enabled ?? baseConfig.enabled,
        formatOnSave: settings.formatOnSave ?? baseConfig.formatOnSave,
        formatOnType: settings.formatOnType ?? baseConfig.formatOnType,
        formatRange: settings.formatRange ?? baseConfig.formatRange,
        keywordCase,
        statementCase: settings.statementCase ?? (settings.keywordCase ? keywordCase : baseConfig.statementCase),
        typeCase: settings.typeCase ?? (settings.declarationKeywordCase ? declarationKeywordCase : baseConfig.typeCase),
        eventKeywordCase: settings.eventKeywordCase ?? (settings.declarationKeywordCase ? declarationKeywordCase : baseConfig.eventKeywordCase),
        systemFunctionCase: settings.systemFunctionCase ?? baseConfig.systemFunctionCase,
        sqlKeywordCase: settings.sqlKeywordCase ?? baseConfig.sqlKeywordCase,
        preserveUserIdentifierCase: settings.preserveUserIdentifierCase ?? baseConfig.preserveUserIdentifierCase,
        spacesInsideParentheses: settings.spacesInsideParentheses ?? baseConfig.spacesInsideParentheses,
        spaceAfterComma: settings.spaceAfterComma ?? baseConfig.spaceAfterComma,
        spaceAroundOperators: settings.spaceAroundOperators ?? baseConfig.spaceAroundOperators,
        oneStatementPerLine: settings.oneStatementPerLine ?? baseConfig.oneStatementPerLine,
        indentStyle: settings.indentStyle ?? baseConfig.indentStyle,
        indentSize,
        continuationIndentSize: settings.continuationIndentSize ?? (settings.indentSize ? indentSize : baseConfig.continuationIndentSize),
        blankLineBetweenSections: settings.blankLineBetweenSections ?? baseConfig.blankLineBetweenSections,
        preserveComments: settings.preserveComments ?? baseConfig.preserveComments,
        preserveStrings: settings.preserveStrings ?? baseConfig.preserveStrings,
        preserveManualLineBreaksInSql: settings.preserveManualLineBreaksInSql ?? baseConfig.preserveManualLineBreaksInSql,
        conservativeEmbeddedSqlFormatting: settings.conservativeEmbeddedSqlFormatting ?? baseConfig.conservativeEmbeddedSqlFormatting,
        trimTrailingWhitespace: settings.trimTrailingWhitespace ?? baseConfig.trimTrailingWhitespace,
        normalizeBlankLines: settings.normalizeBlankLines ?? baseConfig.normalizeBlankLines,
    };
}