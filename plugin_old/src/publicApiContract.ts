export const POWERBUILDER_EXTENSION_ID = 'lopez.almunia-powersyntax';
export const POWERBUILDER_EXTENSION_API_VERSION = 1 as const;

export const POWERBUILDER_EXTENSION_API_COMMANDS = {
    runSemanticQuery: 'powerbuilder.runSemanticQuery',
    runSemanticNavigate: 'powerbuilder.runSemanticNavigate',
    runSemanticQueryBatch: 'powerbuilder.runSemanticQueryBatch',
    runActiveHierarchyInspection: 'powerbuilder.runActiveHierarchyInspection',
    runAncestorScriptInspection: 'powerbuilder.runAncestorScriptInspection',
    runBuildSessionManifest: 'powerbuilder.runBuildSessionManifest',
    runWorkspaceBuildPreference: 'powerbuilder.runWorkspaceBuildPreference',
    exportWorkspaceBuildPreference: 'powerbuilder.exportWorkspaceBuildPreference',
    exportWorkspaceManifest: 'powerbuilder.exportWorkspaceManifest',
    exportWorkspaceArtifactBundle: 'powerbuilder.exportWorkspaceArtifactBundle',
    exportAutomationSurface: 'powerbuilder.exportAutomationSurface',
    exportWorkspaceDiagnosticsTree: 'powerbuilder.exportWorkspaceDiagnosticsTree',
    exportFeatureSupportSnapshot: 'powerbuilder.exportFeatureSupportSnapshot',
    exportWorkspaceManifestDiff: 'powerbuilder.exportWorkspaceManifestDiff',
    exportPublicContractSchemas: 'powerbuilder.exportPublicContractSchemas',
    exportPublicContractCatalog: 'powerbuilder.exportPublicContractCatalog',
    exportBuildSessionManifest: 'powerbuilder.exportBuildSessionManifest',
    exportLastBuildReport: 'powerbuilder.exportLastBuildReport',
} as const;

export interface PowerBuilderExtensionApiMethodDescriptor {
    name: keyof typeof POWERBUILDER_EXTENSION_API_COMMANDS;
    command: typeof POWERBUILDER_EXTENSION_API_COMMANDS[keyof typeof POWERBUILDER_EXTENSION_API_COMMANDS];
    payloadKind?: string;
    acceptsArguments: boolean;
}

export const POWERBUILDER_EXTENSION_API_METHODS: readonly PowerBuilderExtensionApiMethodDescriptor[] = [
    {
        name: 'runSemanticQuery',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.runSemanticQuery,
        payloadKind: 'powerbuilder-semantic-query',
        acceptsArguments: true,
    },
    {
        name: 'runSemanticNavigate',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.runSemanticNavigate,
        payloadKind: 'powerbuilder-semantic-navigation',
        acceptsArguments: true,
    },
    {
        name: 'runSemanticQueryBatch',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.runSemanticQueryBatch,
        payloadKind: 'powerbuilder-semantic-query-batch',
        acceptsArguments: true,
    },
    {
        name: 'runActiveHierarchyInspection',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.runActiveHierarchyInspection,
        payloadKind: 'powerbuilder-active-hierarchy-inspection',
        acceptsArguments: true,
    },
    {
        name: 'runAncestorScriptInspection',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.runAncestorScriptInspection,
        payloadKind: 'powerbuilder-ancestor-script-inspection',
        acceptsArguments: true,
    },
    {
        name: 'runBuildSessionManifest',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.runBuildSessionManifest,
        payloadKind: 'powerbuilder-build-session-manifest',
        acceptsArguments: false,
    },
    {
        name: 'runWorkspaceBuildPreference',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.runWorkspaceBuildPreference,
        payloadKind: 'powerbuilder-workspace-build-preference',
        acceptsArguments: true,
    },
    {
        name: 'exportWorkspaceBuildPreference',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceBuildPreference,
        payloadKind: 'powerbuilder-workspace-build-preference',
        acceptsArguments: true,
    },
    {
        name: 'exportWorkspaceManifest',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceManifest,
        payloadKind: 'powerbuilder-workspace-manifest',
        acceptsArguments: false,
    },
    {
        name: 'exportWorkspaceArtifactBundle',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceArtifactBundle,
        payloadKind: 'powerbuilder-workspace-artifact-bundle',
        acceptsArguments: false,
    },
    {
        name: 'exportAutomationSurface',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.exportAutomationSurface,
        payloadKind: 'powerbuilder-automation-surface',
        acceptsArguments: false,
    },
    {
        name: 'exportWorkspaceDiagnosticsTree',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceDiagnosticsTree,
        payloadKind: 'powerbuilder-workspace-diagnostics-tree',
        acceptsArguments: false,
    },
    {
        name: 'exportFeatureSupportSnapshot',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.exportFeatureSupportSnapshot,
        payloadKind: 'powerbuilder-feature-support-snapshot',
        acceptsArguments: false,
    },
    {
        name: 'exportWorkspaceManifestDiff',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceManifestDiff,
        payloadKind: 'powerbuilder-workspace-manifest-diff',
        acceptsArguments: true,
    },
    {
        name: 'exportPublicContractSchemas',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.exportPublicContractSchemas,
        payloadKind: 'powerbuilder-public-contract-schemas',
        acceptsArguments: false,
    },
    {
        name: 'exportPublicContractCatalog',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.exportPublicContractCatalog,
        payloadKind: 'powerbuilder-public-contract-catalog',
        acceptsArguments: false,
    },
    {
        name: 'exportBuildSessionManifest',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.exportBuildSessionManifest,
        payloadKind: 'powerbuilder-build-session-manifest',
        acceptsArguments: false,
    },
    {
        name: 'exportLastBuildReport',
        command: POWERBUILDER_EXTENSION_API_COMMANDS.exportLastBuildReport,
        payloadKind: 'powerbuilder-build-report',
        acceptsArguments: false,
    },
] as const;