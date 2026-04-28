import * as vscode from 'vscode';
import {
    ActiveHierarchyInspectionRunResult,
    AncestorScriptInspectionRunResult,
    GenerateAutomationSurfaceManifestExportResult,
    GenerateBuildReportExportResult,
    GenerateBuildSessionManifestExportResult,
    GenerateFeatureSupportSnapshotExportResult,
    GeneratePublicContractCatalogExportResult,
    GeneratePublicContractSchemasExportResult,
    GenerateWorkspaceArtifactBundleExportResult,
    GenerateWorkspaceBuildPreferenceExportResult,
    GenerateWorkspaceManifestDiffExportResult,
    GenerateWorkspaceDiagnosticsTreeExportResult,
    GenerateWorkspaceManifestExportResult,
    RunBuildSessionManifestResult,
    RunSemanticQueryBatchResult,
    RunSemanticQueryResult,
    RunWorkspaceBuildPreferenceResult,
} from './powerbuilder/exports/powerBuilderArtifactWorkspaceService';
import {
    POWERBUILDER_EXTENSION_API_COMMANDS,
    POWERBUILDER_EXTENSION_API_VERSION,
    POWERBUILDER_EXTENSION_ID,
} from './publicApiContract';

export interface PowerBuilderExtensionApi {
    apiVersion: typeof POWERBUILDER_EXTENSION_API_VERSION;
    extensionId: typeof POWERBUILDER_EXTENSION_ID;
    commands: typeof POWERBUILDER_EXTENSION_API_COMMANDS;
    runSemanticQuery(args?: unknown): Thenable<RunSemanticQueryResult | undefined>;
    runSemanticNavigate(args?: unknown): Thenable<unknown>;
    runSemanticQueryBatch(args?: unknown): Thenable<RunSemanticQueryBatchResult | undefined>;
    runActiveHierarchyInspection(args?: unknown): Thenable<ActiveHierarchyInspectionRunResult | undefined>;
    runAncestorScriptInspection(args?: unknown): Thenable<AncestorScriptInspectionRunResult | undefined>;
    runBuildSessionManifest(): Thenable<RunBuildSessionManifestResult | undefined>;
    runWorkspaceBuildPreference(args?: unknown): Thenable<RunWorkspaceBuildPreferenceResult | undefined>;
    exportWorkspaceBuildPreference(args?: unknown): Thenable<GenerateWorkspaceBuildPreferenceExportResult | undefined>;
    exportWorkspaceManifest(): Thenable<GenerateWorkspaceManifestExportResult | undefined>;
    exportWorkspaceArtifactBundle(): Thenable<GenerateWorkspaceArtifactBundleExportResult | undefined>;
    exportAutomationSurface(): Thenable<GenerateAutomationSurfaceManifestExportResult | undefined>;
    exportWorkspaceDiagnosticsTree(): Thenable<GenerateWorkspaceDiagnosticsTreeExportResult | undefined>;
    exportFeatureSupportSnapshot(): Thenable<GenerateFeatureSupportSnapshotExportResult | undefined>;
    exportWorkspaceManifestDiff(args?: unknown): Thenable<GenerateWorkspaceManifestDiffExportResult | undefined>;
    exportPublicContractSchemas(): Thenable<GeneratePublicContractSchemasExportResult | undefined>;
    exportPublicContractCatalog(): Thenable<GeneratePublicContractCatalogExportResult | undefined>;
    exportBuildSessionManifest(): Thenable<GenerateBuildSessionManifestExportResult | undefined>;
    exportLastBuildReport(): Thenable<GenerateBuildReportExportResult | undefined>;
}

export function createPowerBuilderExtensionApi(): PowerBuilderExtensionApi {
    return {
        apiVersion: POWERBUILDER_EXTENSION_API_VERSION,
        extensionId: POWERBUILDER_EXTENSION_ID,
        commands: POWERBUILDER_EXTENSION_API_COMMANDS,
        runSemanticQuery: args => vscode.commands.executeCommand<RunSemanticQueryResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.runSemanticQuery,
            args,
        ),
        runSemanticNavigate: args => vscode.commands.executeCommand(
            POWERBUILDER_EXTENSION_API_COMMANDS.runSemanticNavigate,
            args,
        ),
        runSemanticQueryBatch: args => vscode.commands.executeCommand<RunSemanticQueryBatchResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.runSemanticQueryBatch,
            args,
        ),
        runActiveHierarchyInspection: args => vscode.commands.executeCommand<ActiveHierarchyInspectionRunResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.runActiveHierarchyInspection,
            args,
        ),
        runAncestorScriptInspection: args => vscode.commands.executeCommand<AncestorScriptInspectionRunResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.runAncestorScriptInspection,
            args,
        ),
        runBuildSessionManifest: () => vscode.commands.executeCommand<RunBuildSessionManifestResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.runBuildSessionManifest,
        ),
        runWorkspaceBuildPreference: args => vscode.commands.executeCommand<RunWorkspaceBuildPreferenceResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.runWorkspaceBuildPreference,
            args,
        ),
        exportWorkspaceBuildPreference: args => vscode.commands.executeCommand<GenerateWorkspaceBuildPreferenceExportResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceBuildPreference,
            args,
        ),
        exportWorkspaceManifest: () => vscode.commands.executeCommand<GenerateWorkspaceManifestExportResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceManifest,
        ),
        exportWorkspaceArtifactBundle: () => vscode.commands.executeCommand<GenerateWorkspaceArtifactBundleExportResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceArtifactBundle,
        ),
        exportAutomationSurface: () => vscode.commands.executeCommand<GenerateAutomationSurfaceManifestExportResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.exportAutomationSurface,
        ),
        exportWorkspaceDiagnosticsTree: () => vscode.commands.executeCommand<GenerateWorkspaceDiagnosticsTreeExportResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceDiagnosticsTree,
        ),
        exportFeatureSupportSnapshot: () => vscode.commands.executeCommand<GenerateFeatureSupportSnapshotExportResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.exportFeatureSupportSnapshot,
        ),
        exportWorkspaceManifestDiff: args => vscode.commands.executeCommand<GenerateWorkspaceManifestDiffExportResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceManifestDiff,
            args,
        ),
        exportPublicContractSchemas: () => vscode.commands.executeCommand<GeneratePublicContractSchemasExportResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.exportPublicContractSchemas,
        ),
        exportPublicContractCatalog: () => vscode.commands.executeCommand<GeneratePublicContractCatalogExportResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.exportPublicContractCatalog,
        ),
        exportBuildSessionManifest: () => vscode.commands.executeCommand<GenerateBuildSessionManifestExportResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.exportBuildSessionManifest,
        ),
        exportLastBuildReport: () => vscode.commands.executeCommand<GenerateBuildReportExportResult>(
            POWERBUILDER_EXTENSION_API_COMMANDS.exportLastBuildReport,
        ),
    };
}