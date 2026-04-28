import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { getIndexingExcludeGlob, getIndexingExcludePatterns } from '../../core/config/extensionConfiguration';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import {
    PbBuildTargetKind,
    buildPbAutoBuildArgs,
    getPbBuildTargetKind,
    isPbBuildTargetUri,
} from '../build/buildTargetUtils';
import { buildDataWindowSqlSemantics } from '../datawindow/pbDataWindowSqlSemantics';
import {
    PbDataWindowNode,
    PbDataWindowParseResult,
    PbDataWindowParser,
} from '../datawindow/pbDataWindowParser';
import { resolveVerifiedDataWindowChildLinks } from '../datawindow/pbPowerScriptDataWindowChildren';
import {
    getSignatureCallContextAtPosition,
    getSymbolContextAtPosition,
    SignatureCallContext,
} from '../document/documentUtils';
import { SymbolIndex } from '../indexing/symbolIndex';
import { buildSystemSymbolConsistencyReport } from '../knowledge/validation/buildConsistencyReport';
import { buildSystemSymbolCoverageReport } from '../knowledge/validation/buildCoverageReport';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../knowledge/registry/registry';
import { PbSystemSymbolEntry, PbSystemSymbolRegistry, PbSystemSymbolSignature } from '../knowledge/types';
import { PbSymbol } from '../models/pbSymbol';
import {
    FindReferencesResult,
    ResolveDefinitionResult,
    ResolveReferencesResult,
    ResolveRenameTargetResult,
    ResolveSignatureAtPositionResult,
    ResolveSymbolAtPositionResult,
    SemanticQueryService,
} from '../semantic';
import { getInheritanceGraph } from '../semantic/inheritanceGraph';
import { SemanticHoverContent, SemanticHoverContentKind } from '../semantic/hover/contracts';
import {
    SemanticOccurrence,
    SemanticRenamePlan,
    SemanticRenameTarget,
} from '../semantic/occurrences/contracts';
import {
    PbAutoBuildProjectBuildResult,
    PowerBuilderAutoBuildService,
} from '../build/pbAutoBuildService';
import {
    buildPowerBuilderDiagnosticsSnapshot,
    comparePowerBuilderDiagnostics,
} from '../diagnostics/pbDiagnosticsSnapshot';
import {
    ActiveHierarchyInspectionResult,
    PowerBuilderActiveHierarchyInspectionService,
} from '../hierarchy/activeHierarchyInspectionService';
import {
    AncestorScriptInspectionResult,
    PowerBuilderAncestorScriptService,
} from '../hierarchy/ancestorScriptService';
import { WorkspaceIndexer } from '../workspace/workspaceIndexer';
import { PbBuildTargetParser } from '../workspace/pbBuildTargetParser';
import { PbProjectDefinition, normalizeWorkspaceUriPath } from '../workspace/pbProjectModel';
import { PowerBuilderProjectRegistry } from '../workspace/projectRegistry';
import {
    POWERBUILDER_EXTENSION_API_COMMANDS,
    POWERBUILDER_EXTENSION_API_METHODS,
    POWERBUILDER_EXTENSION_API_VERSION,
    POWERBUILDER_EXTENSION_ID,
} from '../../publicApiContract';
import {
    PublicContractSchemaDescriptor,
    getPublicContractSchemaDescriptors,
} from '../contracts/publicContractSchemas';
import { getPowerBuilderLanguageModelToolDescriptors } from '../contracts/languageModelTools';

type DataWindowChildLinkParentCandidate = Parameters<typeof resolveVerifiedDataWindowChildLinks>[1];

export interface PowerBuilderGeneratedJsonFile {
    uri: vscode.Uri;
    relativePath: string;
}

export type GenerateSemanticDocumentExportResult =
    | {
        kind: 'generated';
        file: PowerBuilderGeneratedJsonFile;
        project?: PbProjectDefinition;
        payload: SemanticDocumentExportPayload;
    }
    | {
        kind: 'unsupported';
        reason: string;
    };

export type GenerateSemanticProjectExportResult =
    | {
        kind: 'generated';
        file: PowerBuilderGeneratedJsonFile;
        project: PbProjectDefinition;
        payload: SemanticProjectExportPayload;
    }
    | {
        kind: 'no-project';
        reason: string;
    };

export type GenerateSemanticQueryExportResult =
    | {
        kind: 'generated';
        file: PowerBuilderGeneratedJsonFile;
        project?: PbProjectDefinition;
        payload: SemanticQueryExportPayload;
    }
    | {
        kind: 'no-query';
        reason: string;
    };

export type RunSemanticQueryResult =
    | {
        kind: 'generated';
        payload: SemanticQueryExportPayload;
    }
    | {
        kind: 'no-query';
        reason: string;
    };

export type GenerateOverloadResolutionExplanationExportResult =
    | {
        kind: 'generated';
        file: PowerBuilderGeneratedJsonFile;
        project?: PbProjectDefinition;
        payload: OverloadResolutionExplanationExportPayload;
    }
    | {
        kind: 'no-call';
        reason: string;
    };

export type RunOverloadResolutionExplanationResult =
    | {
        kind: 'generated';
        payload: OverloadResolutionExplanationExportPayload;
    }
    | {
        kind: 'no-call';
        reason: string;
    };

export interface GenerateVisibilityAuditExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: VisibilityAuditExportPayload;
}

export type GenerateInheritanceOwnerGraphExportResult =
    | {
        kind: 'generated';
        file: PowerBuilderGeneratedJsonFile;
        project: PbProjectDefinition;
        payload: InheritanceOwnerGraphExportPayload;
    }
    | {
        kind: 'no-project';
        reason: string;
    };

export type GenerateScriptDependencyGraphExportResult =
    | {
        kind: 'generated';
        file: PowerBuilderGeneratedJsonFile;
        project: PbProjectDefinition;
        payload: ScriptDependencyGraphExportPayload;
    }
    | {
        kind: 'no-project';
        reason: string;
    };

export interface GenerateRuntimeCatalogExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: RuntimeCatalogExportPayload;
}

export interface GenerateWorkspaceManifestExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: WorkspaceManifestExportPayload;
}

export interface GenerateAutomationSurfaceManifestExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: AutomationSurfaceManifestExportPayload;
}

export interface GenerateAutomationReplayExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: AutomationReplayExportPayload;
}

export interface GenerateBuildReportExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: BuildReportExportPayload;
}

export interface GenerateBuildSessionManifestExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: BuildSessionManifestExportPayload;
}

export interface GenerateWorkspaceBuildPreferenceExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: WorkspaceBuildPreferencePayload;
}

export interface GenerateWorkspaceDiagnosticsTreeExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: WorkspaceDiagnosticsTreeExportPayload;
}

export interface GenerateFeatureSupportSnapshotExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: FeatureSupportSnapshotExportPayload;
}

export interface GeneratePublicContractSchemasExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: PublicContractSchemasExportPayload;
    schemaFiles: PowerBuilderGeneratedJsonFile[];
}

export interface GeneratePublicContractCatalogExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: PublicContractCatalogExportPayload;
}

export interface GenerateBuildContractCatalogExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: BuildContractCatalogExportPayload;
}

export interface GenerateHostContributionInventoryExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: HostContributionInventoryExportPayload;
}

export interface GenerateAutomationCoverageAuditExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: AutomationCoverageAuditExportPayload;
}

export interface GenerateCacheInvalidationSnapshotExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: CacheInvalidationSnapshotExportPayload;
}

export interface GenerateWorkspaceArtifactBundleExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: WorkspaceArtifactBundleExportPayload;
}

export type GeneratePublicContractCatalogDiffExportResult =
    | {
        kind: 'generated';
        file: PowerBuilderGeneratedJsonFile;
        payload: PublicContractCatalogDiffExportPayload;
    }
    | {
        kind: 'invalid-input';
        reason: string;
    };

export type GenerateWorkspaceArtifactBundleDiffExportResult =
    | {
        kind: 'generated';
        file: PowerBuilderGeneratedJsonFile;
        payload: WorkspaceArtifactBundleDiffExportPayload;
    }
    | {
        kind: 'invalid-input';
        reason: string;
    };

export type GenerateWorkspaceManifestDiffExportResult =
    | {
        kind: 'generated';
        file: PowerBuilderGeneratedJsonFile;
        payload: WorkspaceManifestDiffExportPayload;
    }
    | {
        kind: 'invalid-input';
        reason: string;
    };

export interface RunSemanticQueryBatchResult {
    kind: 'generated';
    payload: SemanticQueryBatchExportPayload;
}

export type ActiveHierarchyInspectionRunResult =
    | {
        kind: 'generated';
        payload: ActiveHierarchyInspectionExportPayload;
    }
    | {
        kind: 'unsupported' | 'invalid-arguments' | 'no-active-editor' | 'document-not-open';
        reason: string;
    };

export type AncestorScriptInspectionRunResult =
    | {
        kind: 'generated';
        payload: AncestorScriptInspectionExportPayload;
    }
    | {
        kind: 'unsupported' | 'invalid-arguments' | 'no-active-editor' | 'document-not-open';
        reason: string;
    };

export interface RunBuildSessionManifestResult {
    kind: 'generated';
    payload: BuildSessionManifestExportPayload;
}

export interface RunWorkspaceBuildPreferenceResult {
    kind: 'generated';
    payload: WorkspaceBuildPreferencePayload;
}

export interface GenerateDataWindowManifestExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: DataWindowManifestExportPayload;
}

export interface GenerateDataWindowWorkspaceCatalogExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: DataWindowWorkspaceCatalogExportPayload;
}

export interface GenerateDataWindowChildGraphExportResult {
    file: PowerBuilderGeneratedJsonFile;
    payload: DataWindowChildGraphExportPayload;
}

export type GenerateSemanticSnapshotDiffExportResult =
    | {
        kind: 'generated';
        file: PowerBuilderGeneratedJsonFile;
        payload: SemanticSnapshotDiffExportPayload;
    }
    | {
        kind: 'invalid-input';
        reason: string;
    };

export interface ExportedRange {
    start: {
        line: number;
        character: number;
    };
    end: {
        line: number;
        character: number;
    };
}

export interface ExportedLocation {
    uri: string;
    relativePath: string;
    range: ExportedRange;
}

export interface ExportedProject {
    uri: string;
    relativePath: string;
    name: string;
    projectDirectoryPath: string;
    applicationName?: string;
    appEntry?: string;
    appEntryPath?: string;
    libraries: string[];
    libraryPaths: string[];
    effectiveRootPaths: string[];
}

export interface ExportedBuildableTargetProjectRelation {
    projectName: string;
    projectUri: string;
    projectRelativePath: string;
    precision: 'exact' | 'compatible';
    relation: 'self-project' | 'declared-build-member' | 'co-located-build-scope';
    reason: string;
}

export interface ExportedBuildableTarget {
    uri: string;
    relativePath: string;
    name: string;
    kind: PbBuildTargetKind;
    buildArgs: string[];
    relatedProjects: ExportedBuildableTargetProjectRelation[];
}

export interface WorkspaceManifestIndexingAudit {
    indexedFileCount: number;
    indexedSymbolCount: number;
    snapshotCacheEntryCount: number;
    artifactPayloadCacheEntryCount: number;
    unassignedIndexedFileCount: number;
    unassignedIndexedFiles: string[];
    staleIndexedFileCount: number;
    staleIndexedFiles: string[];
}

export interface ExportedWorkspaceImpactTarget {
    uri: string;
    relativePath: string;
    name: string;
    kind: PbBuildTargetKind;
    precision: 'exact' | 'compatible';
    relation: 'active-target' | 'self-project' | 'declared-build-member' | 'co-located-build-scope';
    reason: string;
}

export interface WorkspaceManifestIncrementalImpact {
    anchorUri: string;
    anchorRelativePath: string;
    impactedProjects: ExportedProject[];
    impactedBuildTargets: ExportedWorkspaceImpactTarget[];
}

export interface WorkspaceBuildTargetPreference {
    preferredBuildTarget?: ExportedWorkspaceImpactTarget;
    matchingBuildTargetsForAnchor: ExportedWorkspaceImpactTarget[];
}

export interface WorkspaceBuildPreferencePayload {
    kind: 'powerbuilder-workspace-build-preference';
    schemaVersion: 1;
    generatedAt: string;
    anchorUri?: string;
    anchorRelativePath?: string;
    preferredProject?: ExportedProject;
    matchingProjectsForAnchor: ExportedProject[];
    preferredBuildTarget?: ExportedWorkspaceImpactTarget;
    matchingBuildTargetsForAnchor: ExportedWorkspaceImpactTarget[];
    buildableTargetCount: number;
    reasons: string[];
}

export interface WorkspaceManifestGraphNode {
    id: string;
    kind: 'build-target' | 'project' | 'library-root' | 'source-file';
    label: string;
    uri?: string;
    relativePath?: string;
    projectName?: string;
    buildTargetKind?: PbBuildTargetKind;
}

export interface WorkspaceManifestGraphEdge {
    from: string;
    to: string;
    relation: 'builds-project' | 'may-build-project' | 'declares-library' | 'contains-source-file';
    precision: 'exact' | 'compatible';
    reason: string;
}

export interface WorkspaceManifestGraph {
    summary: {
        nodeCount: number;
        edgeCount: number;
        buildTargetProjectEdgeCount: number;
        projectLibraryEdgeCount: number;
        librarySourceEdgeCount: number;
    };
    nodes: WorkspaceManifestGraphNode[];
    edges: WorkspaceManifestGraphEdge[];
}

export interface ExportedPbSymbol {
    persistentId: string;
    name: string;
    kind: PbSymbol['kind'];
    uri: string;
    relativePath: string;
    range: ExportedRange;
    selectionRange: ExportedRange;
    detail?: string;
    parent?: string;
    returnType?: string;
    access?: string;
    containerName?: string;
    containerKind?: PbSymbol['containerKind'];
    containerSignature?: string;
    fileObjectName?: string;
    declarationScope?: PbSymbol['declarationScope'];
    baseTypeName?: string;
    signature?: string;
    parameterCount?: number;
    isPrototype?: boolean;
    implementationKind?: PbSymbol['implementationKind'];
    ownerName?: string;
    isExternal?: boolean;
    externalLibraryName?: string;
    externalName?: string;
}

interface ExportedSemanticScope {
    callable: ExportedPbSymbol;
    parameters: ExportedPbSymbol[];
    locals: ExportedPbSymbol[];
}

interface ExportedSemanticQueryBase {
    precision: string;
    reasons: readonly unknown[];
    evidence: readonly unknown[];
}

interface ExportedSemanticReferenceQuery {
    resolvedSymbols: ExportedPbSymbol[];
    occurrences: Array<{
        uri: string;
        relativePath: string;
        range: ExportedRange;
        isDeclaration: boolean;
        evidence: readonly unknown[];
    }>;
    currentProject?: ExportedProject;
    systemMember?: ExportedSystemSymbolEntry;
}

interface ExportedSemanticRenamePlan {
    target: ExportedPbSymbol;
    family: ExportedPbSymbol[];
    currentProject?: ExportedProject;
    occurrences: Array<{
        uri: string;
        relativePath: string;
        range: ExportedRange;
        isDeclaration: boolean;
        evidence: readonly unknown[];
    }>;
}

interface ExportedSemanticRenameTarget {
    canRename: boolean;
    precision: string;
    reasons: readonly unknown[];
    evidence: readonly unknown[];
    renameTarget?: {
        target: ExportedPbSymbol;
        family: ExportedPbSymbol[];
        currentProject?: ExportedProject;
    };
    plan?: ExportedSemanticRenamePlan;
}

interface ExportedHoverContent {
    kind: SemanticHoverContentKind;
    title: string;
    signatureMarkdown?: string;
    supplementMarkdown?: string;
    markdown: string;
}

interface ExportedSemanticSymbolResult extends ExportedSemanticQueryBase {
    primarySymbol?: ExportedPbSymbol;
    symbols: ExportedPbSymbol[];
}

interface ExportedSemanticNavigationResult extends ExportedSemanticQueryBase {
    primarySymbol?: ExportedPbSymbol;
    symbols: ExportedPbSymbol[];
    locations: ExportedLocation[];
}

interface ExportedSemanticHoverResult extends ExportedSemanticQueryBase {
    primarySymbol?: ExportedPbSymbol;
    systemEntry?: ExportedSystemSymbolEntry;
    content?: ExportedHoverContent;
}

interface ExportedOverloadResolutionCallContext {
    name: string;
    range: ExportedRange;
    activeParameter: number;
    providedArgumentCount: number;
    hasAnyArgumentText: boolean;
    currentParameterHasContent: boolean;
    qualifiedOwner?: string;
    qualifiedOwnerExpression?: string;
    qualifier?: '.' | '::';
    isDynamicDispatch: boolean;
    dynamicDispatchKind?: 'function' | 'event';
    isAncestorControlCall: boolean;
}

interface ExportedOverloadResolutionResult extends ExportedSemanticQueryBase {
    resolutionKind:
        | 'single-candidate'
        | 'compatible-overloads'
        | 'ambiguous-overloads'
        | 'blocked'
        | 'system-member';
    shouldProvideHelp: boolean;
    candidateCount: number;
    selectedCandidate?: ExportedPbSymbol;
    candidates: ExportedPbSymbol[];
    systemEntry?: ExportedSystemSymbolEntry;
}

export interface SemanticDocumentExportPayload {
    kind: 'powerbuilder-semantic-document';
    schemaVersion: 1;
    generatedAt: string;
    document: {
        uri: string;
        relativePath: string;
        languageId: string;
        objectName?: string;
    };
    project?: ExportedProject;
    symbols: ExportedPbSymbol[];
    callables: ExportedPbSymbol[];
    scopes: ExportedSemanticScope[];
    currentQuery?: SemanticQueryExportPayload['query'];
}

export interface SemanticProjectExportPayload {
    kind: 'powerbuilder-semantic-project';
    schemaVersion: 1;
    generatedAt: string;
    project: ExportedProject;
    summary: {
        fileCount: number;
        symbolCount: number;
        callableCount: number;
        typeCount: number;
    };
    files: Array<{
        uri: string;
        relativePath: string;
        objectName?: string;
        symbols: ExportedPbSymbol[];
        callables: ExportedPbSymbol[];
    }>;
}

export interface SemanticQueryExportPayload {
    kind: 'powerbuilder-semantic-query';
    schemaVersion: 1;
    generatedAt: string;
    document: {
        uri: string;
        relativePath: string;
        word: string;
        selectionRange: ExportedRange;
    };
    project?: ExportedProject;
    query: {
        symbol: ExportedSemanticSymbolResult;
        hover: ExportedSemanticHoverResult;
        definition: ExportedSemanticNavigationResult;
        declaration: ExportedSemanticNavigationResult;
        implementation: ExportedSemanticNavigationResult;
        references: ExportedSemanticQueryBase & {
            locations: ExportedLocation[];
            plan: ExportedSemanticReferenceQuery;
            query: ExportedSemanticReferenceQuery;
        };
        renameTarget: ExportedSemanticRenameTarget;
    };
}

export interface OverloadResolutionExplanationExportPayload {
    kind: 'powerbuilder-overload-resolution-explanation';
    schemaVersion: 1;
    generatedAt: string;
    document: {
        uri: string;
        relativePath: string;
    };
    project?: ExportedProject;
    call: ExportedOverloadResolutionCallContext;
    resolution: ExportedOverloadResolutionResult;
}

export interface VisibilityAuditExportPayload {
    kind: 'powerbuilder-visibility-audit';
    schemaVersion: 1;
    generatedAt: string;
    summary: {
        projectCount: number;
        candidateCount: number;
        auditedCount: number;
        unconsumedCount: number;
        degradeCandidateCount: number;
        unverifiableCount: number;
    };
    projects: Array<{
        name: string;
        project?: ExportedProject;
        candidateCount: number;
        auditedCount: number;
        unconsumedCount: number;
        degradeCandidateCount: number;
        unverifiableCount: number;
    }>;
    symbols: Array<{
        symbol: ExportedPbSymbol;
        project?: ExportedProject;
        normalizedAccess: 'public' | 'protected';
        referenceCount: number;
        sameTypeReferenceCount: number;
        hierarchyReferenceCount: number;
        externalReferenceCount: number;
        consumerTypeNames: string[];
        classification:
            | 'no-consumers'
            | 'same-type-only'
            | 'declaring-hierarchy-only'
            | 'retained'
            | 'unverifiable';
        suggestedAccess?: 'protected' | 'private';
    }>;
}

export interface RuntimeCatalogExportPayload {
    kind: 'powerbuilder-runtime-catalog';
    schemaVersion: 2;
    generatedAt: string;
    summary: {
        sliceCount: number;
        entryCount: number;
    };
    typing: RuntimeCatalogTypingSummary;
    coverage: ReturnType<typeof buildSystemSymbolCoverageReport>;
    consistency: ReturnType<typeof buildSystemSymbolConsistencyReport>;
    indexes: RuntimeCatalogIndexes;
    slices: Array<{
        dataset: string;
        domain: string;
        entryCount: number;
        allowedCategories?: readonly string[];
        allowedOwnerTypes?: readonly string[];
        requireSourceUrl?: boolean;
    }>;
    entries: ExportedSystemSymbolEntry[];
}

export interface RuntimeCatalogTypingSummary {
    overloadedEntryCount: number;
    entryCountWithParameterLabels: number;
    entryCountWithExplicitParameterMetadata: number;
    entryCountWithDerivedReturnType: number;
    obsoleteWithReplacementCount: number;
    ownerKinds: Record<string, number>;
    callableKinds: Record<string, number>;
}

export interface RuntimeCatalogIndexes {
    domains: RuntimeCatalogDomainIndexEntry[];
    ownerTypes: RuntimeCatalogOwnerTypeIndexEntry[];
    returnTypes: RuntimeCatalogReturnTypeIndexEntry[];
}

export interface RuntimeCatalogDomainIndexEntry {
    domain: string;
    entryCount: number;
    overloadedEntryCount: number;
    ownerTypeCount: number;
    entryCountWithDerivedReturnType: number;
    obsoleteCount: number;
    replacementCount: number;
}

export interface RuntimeCatalogOwnerTypeIndexEntry {
    ownerType: string;
    entryCount: number;
    callableCount: number;
    eventCount: number;
    domains: string[];
    sampleNames: string[];
}

export interface RuntimeCatalogReturnTypeIndexEntry {
    returnType: string;
    entryCount: number;
    sampleNames: string[];
}

export interface WorkspaceManifestExportPayload {
    kind: 'powerbuilder-workspace-manifest';
    schemaVersion: 1;
    generatedAt: string;
    workspace: {
        folders: Array<{
            uri: string;
            relativePath: string;
            name: string;
        }>;
        projectCount: number;
        indexingExcludePatterns: string[];
        retainedEffectiveRootKeys: string[];
        anchorUri?: string;
        anchorRelativePath?: string;
        preferredProject?: ExportedProject;
        matchingProjectsForAnchor: ExportedProject[];
        preferredBuildTarget?: ExportedWorkspaceImpactTarget;
        matchingBuildTargetsForAnchor: ExportedWorkspaceImpactTarget[];
        buildableTargetCount: number;
        buildableTargets: ExportedBuildableTarget[];
        indexingAudit: WorkspaceManifestIndexingAudit;
        incrementalImpact?: WorkspaceManifestIncrementalImpact;
    };
    projects: ExportedWorkspaceProjectManifestEntry[];
    graph: WorkspaceManifestGraph;
}

export interface DataWindowManifestExportPayload {
    kind: 'powerbuilder-datawindow-manifest';
    schemaVersion: 1;
    generatedAt: string;
    document: {
        uri: string;
        relativePath: string;
        objectName: string;
    };
    project?: ExportedProject;
    summary: {
        bandCount: number;
        tableColumnCount: number;
        textCount: number;
        displayColumnCount: number;
        retrieveColumnReferenceCount: number;
    };
    bands: Array<{
        name: string;
        range: ExportedRange;
        selectionRange: ExportedRange;
    }>;
    table: {
        range?: ExportedRange;
        selectionRange?: ExportedRange;
        columns: Array<{
            name: string;
            detail?: string;
            range: ExportedRange;
            selectionRange: ExportedRange;
            referencedInRetrieve: boolean;
        }>;
        retrieve?: {
            statement: string;
            range: ExportedRange;
            selectionRange: ExportedRange;
            selectColumns: Array<{
                rawText: string;
                columnName: string;
                qualifiedTableName?: string;
                range: ExportedRange;
                linkedTableColumnName?: string;
            }>;
        };
    };
    texts: Array<{
        name: string;
        detail?: string;
        range: ExportedRange;
        selectionRange: ExportedRange;
    }>;
    displayColumns: Array<{
        name: string;
        detail?: string;
        range: ExportedRange;
        selectionRange: ExportedRange;
    }>;
}

interface ExportedDataWindowProjectBinding {
    project: ExportedProject;
    verifiability: 'unique' | 'ambiguous';
    matchingObjectCount: number;
}

export interface DataWindowWorkspaceCatalogExportPayload {
    kind: 'powerbuilder-datawindow-workspace-catalog';
    schemaVersion: 1;
    generatedAt: string;
    summary: {
        projectCount: number;
        dataWindowCount: number;
        uniqueProjectBindingCount: number;
        ambiguousProjectBindingCount: number;
        childLinkCount: number;
    };
    entries: Array<{
        uri: string;
        relativePath: string;
        objectName: string;
        projectBindings: ExportedDataWindowProjectBinding[];
        summary: {
            bandCount: number;
            tableColumnCount: number;
            textCount: number;
            displayColumnCount: number;
            retrieveColumnReferenceCount: number;
            childLinkCount: number;
        };
        retrieve?: {
            statement: string;
            selectColumnCount: number;
        };
    }>;
}

export interface DataWindowChildGraphExportPayload {
    kind: 'powerbuilder-datawindow-child-graph';
    schemaVersion: 1;
    generatedAt: string;
    summary: {
        projectCount: number;
        parentCount: number;
        edgeCount: number;
    };
    nodes: Array<{
        objectName: string;
        uri: string;
        relativePath: string;
        projectBindings: ExportedDataWindowProjectBinding[];
    }>;
    edges: Array<{
        parentObjectName: string;
        parentUri: string;
        parentRelativePath: string;
        childName: string;
        kind: 'dropdown-datawindow' | 'report';
        dataObjectName: string;
        childObjectName: string;
        childUri: string;
        childRelativePath: string;
    }>;
}

interface WorkspaceDataWindowCatalogEntry {
    candidate: DataWindowChildLinkParentCandidate;
    parseResult: PbDataWindowParseResult;
    projectBindings: ExportedDataWindowProjectBinding[];
    retrieveColumnReferenceCount: number;
}

export interface ActiveHierarchyInspectionExportPayload {
    kind: 'powerbuilder-active-hierarchy-inspection';
    schemaVersion: 1;
    generatedAt: string;
    inspection: ActiveHierarchyInspectionResult;
}

export interface AncestorScriptInspectionExportPayload {
    kind: 'powerbuilder-ancestor-script-inspection';
    schemaVersion: 1;
    generatedAt: string;
    inspection: AncestorScriptInspectionResult;
}

export interface BuildSessionManifestExportPayload {
    kind: 'powerbuilder-build-session-manifest';
    schemaVersion: 1;
    generatedAt: string;
    summary: {
        hasLastTarget: boolean;
        hasLastBuild: boolean;
        lastTargetSource?: 'session' | 'workspace-state';
    };
    lastTarget?: {
        uri: string;
        relativePath: string;
        name: string;
        kind: PbBuildTargetKind;
        storedAt: string;
        source: 'session' | 'workspace-state';
    };
    lastBuild?: {
        project: ExportedProject;
        executablePath: string;
        args: string[];
        exitCode: number;
        summary: PbAutoBuildProjectBuildResult['summary'];
        issueCount: number;
        capturedAt?: string;
    };
}

export interface AutomationSurfaceManifestExportPayload {
    kind: 'powerbuilder-automation-surface';
    schemaVersion: 1;
    generatedAt: string;
    extensionApi: {
        extensionId: string;
        apiVersion: number;
        exportedFrom: 'activate';
        methods: Array<{
            name: string;
            command: string;
            payloadKind?: string;
            acceptsArguments: boolean;
        }>;
    };
    languageModelTools: Array<{
        name: string;
        description: string;
        tags: string[];
        inputSchema?: Record<string, unknown>;
        backedBy: {
            command: string;
            payloadKind?: string;
            acceptsArguments: boolean;
        };
    }>;
    commands: Array<{
        command: string;
        title: string;
        mode: 'returns-structured-result' | 'writes-json-file';
        payloadKind?: string;
        outputRelativePath?: string;
        acceptsArguments: boolean;
        arguments?: Array<{
            name: string;
            type: string;
            required: boolean;
            description: string;
        }>;
        notes: string[];
    }>;
}

export interface AutomationReplayStepRequest {
    kind: 'command' | 'language-model-tool';
    id: string;
    label?: string;
    args?: unknown;
}

export interface AutomationReplayExportPayload {
    kind: 'powerbuilder-automation-replay';
    schemaVersion: 1;
    generatedAt: string;
    summary: {
        stepCount: number;
        commandStepCount: number;
        languageModelToolStepCount: number;
        completedCount: number;
        failedCount: number;
        skippedCount: number;
        generatedFileCount: number;
        structuredResultCount: number;
        stoppedEarly: boolean;
    };
    manifest: {
        automationSurfaceRelativePath: string;
        automationSurfaceGeneratedAt: string;
    };
    steps: Array<{
        label?: string;
        stepKind: 'command' | 'language-model-tool';
        requestedId: string;
        resolvedCommand?: string;
        resolutionSource: 'command' | 'language-model-tool-backed-command' | 'unresolved';
        mode?: 'returns-structured-result' | 'writes-json-file';
        payloadKind?: string;
        status: 'completed' | 'failed' | 'invalid-target' | 'skipped';
        outputKind: 'structured-result' | 'generated-file' | 'no-result' | 'invalid-target';
        outputRelativePath?: string;
        result?: unknown;
        error?: string;
    }>;
}

export interface ReleaseValidationReportPayload {
    kind: 'powerbuilder-release-validation-report';
    schemaVersion: number;
    generatedAt: string;
    benchmarkEnabled: boolean;
    dryRun: boolean;
    reportFile: string;
    summary: {
        stepCount: number;
        passedCount: number;
        failedCount: number;
        skippedCount: number;
        finalStatus: string;
        failedStepLabel?: string;
    };
    steps: Array<{
        label: string;
        command: string;
        args: string[];
        envOverrides?: Record<string, string>;
        startedAt: string;
        finishedAt: string;
        durationMs: number;
        status: string;
        exitCode: number;
        error?: string;
    }>;
}

export interface SemanticQueryBatchExportPayload {
    kind: 'powerbuilder-semantic-query-batch';
    schemaVersion: 1;
    generatedAt: string;
    summary: {
        requestCount: number;
        generatedCount: number;
        nonGeneratedCount: number;
        stoppedEarly: boolean;
    };
    items: Array<{
        label?: string;
        request: {
            uri?: string;
            relativePath?: string;
            line?: number;
            character?: number;
        };
        resultKind: 'generated' | 'no-query' | 'unsupported' | 'invalid-arguments';
        reason?: string;
        payload?: SemanticQueryExportPayload;
    }>;
}

export interface PublicContractSchemasExportPayload {
    kind: 'powerbuilder-public-contract-schemas';
    schemaVersion: 1;
    generatedAt: string;
    summary: {
        schemaCount: number;
    };
    schemas: Array<{
        payloadKind: string;
        title: string;
        relativePath: string;
        schemaId: string;
    }>;
}

export interface PublicContractCatalogExportPayload {
    kind: 'powerbuilder-public-contract-catalog';
    schemaVersion: 1;
    generatedAt: string;
    extensionApi: AutomationSurfaceManifestExportPayload['extensionApi'];
    languageModelTools: AutomationSurfaceManifestExportPayload['languageModelTools'];
    commands: Array<AutomationSurfaceManifestExportPayload['commands'][number] & {
        schemaRelativePath?: string;
        schemaPublished: boolean;
    }>;
    schemas: PublicContractSchemasExportPayload['schemas'];
}

export interface BuildContractCatalogExportPayload {
    kind: 'powerbuilder-build-contract-catalog';
    schemaVersion: 1;
    generatedAt: string;
    summary: {
        commandCount: number;
        apiMethodCount: number;
        schemaCount: number;
        languageModelToolCount: number;
    };
    extensionApi: {
        extensionId: string;
        apiVersion: number;
        methods: AutomationSurfaceManifestExportPayload['extensionApi']['methods'];
    };
    commands: Array<PublicContractCatalogExportPayload['commands'][number]>;
    languageModelTools: AutomationSurfaceManifestExportPayload['languageModelTools'];
    schemas: PublicContractSchemasExportPayload['schemas'];
    sessionContracts: {
        lastTargetFields: string[];
        lastBuildFields: string[];
        persistedTargetSourceValues: Array<'session' | 'workspace-state'>;
    };
}

export interface HostContributionInventoryExportPayload {
    kind: 'powerbuilder-host-contribution-inventory';
    schemaVersion: 1;
    generatedAt: string;
    summary: {
        declaredCommandCount: number;
        registeredCommandCount: number;
        declaredLanguageModelToolCount: number;
        hostReflectedLanguageModelToolCount: number;
        viewCount: number;
        extensionApiMethodCount: number;
    };
    host: {
        vscodeVersion: string;
        languageModelToolsApiAvailable: boolean;
        reflectedLanguageModelToolsAvailable: boolean;
    };
    commands: Array<{
        command: string;
        title?: string;
        registered: boolean;
        structured: boolean;
        exportedByApi: boolean;
    }>;
    extensionApiMethods: Array<{
        name: string;
        command: string;
        payloadKind?: string;
        acceptsArguments: boolean;
        registered: boolean;
    }>;
    languageModelTools: Array<{
        name: string;
        backedByCommand?: string;
        hostReflected: boolean;
    }>;
    views: Array<{
        container: string;
        id: string;
        name: string;
        when?: string;
    }>;
}

export interface AutomationCoverageAuditExportPayload {
    kind: 'powerbuilder-automation-coverage-audit';
    schemaVersion: 1;
    generatedAt: string;
    summary: {
        packageCommandsMissingFromAutomationSurface: number;
        automationCommandsMissingFromPackageJson: number;
        publicCatalogCommandsMissingSchema: number;
        extensionApiMethodsMissingRegisteredCommand: number;
        languageModelToolsMissingBackedCommand: number;
        languageModelToolsMissingHostReflection: number;
    };
    coverage: {
        packageCommandsMissingFromAutomationSurface: string[];
        automationCommandsMissingFromPackageJson: string[];
        publicCatalogCommandsMissingSchema: string[];
        extensionApiMethodsMissingRegisteredCommand: string[];
        languageModelToolsMissingBackedCommand: string[];
        languageModelToolsMissingHostReflection: string[];
    };
    notes: string[];
}

export interface CacheInvalidationSnapshotExportPayload {
    kind: 'powerbuilder-cache-invalidation-snapshot';
    schemaVersion: 1;
    generatedAt: string;
    summary: {
        snapshotCacheEntryCount: number;
        artifactPayloadCacheEntryCount: number;
        indexedFileCount: number;
        staleIndexedFileCount: number;
        unassignedIndexedFileCount: number;
        retainedEffectiveRootCount: number;
        buildableTargetCount: number;
    };
    snapshotCache: {
        entries: Array<{
            uri: string;
            relativePath: string;
            mtime: number;
            size: number;
            lineCount: number;
        }>;
    };
    artifactPayloadCache: {
        entries: Array<{
            cacheKey: string;
            versionToken: string;
            payloadKind?: string;
        }>;
    };
    workspaceIndexingAudit: WorkspaceManifestIndexingAudit;
    workspaceSurface: {
        retainedEffectiveRootKeys: string[];
        preferredProjectUri?: string;
        preferredBuildTargetUri?: string;
        buildableTargets: Array<{
            uri: string;
            relativePath: string;
            name: string;
            kind: PbBuildTargetKind;
        }>;
    };
    invalidationSurface: {
        clearableCaches: Array<{
            name: 'snapshot-store' | 'artifact-payload-cache';
            entryCount: number;
        }>;
        likelyImpactedArtifacts: string[];
        reasons: string[];
    };
}

export interface PublicContractCatalogDiffExportPayload {
    kind: 'powerbuilder-public-contract-catalog-diff';
    schemaVersion: 1;
    generatedAt: string;
    snapshotKind: 'powerbuilder-public-contract-catalog';
    inputs: {
        left: {
            uri: string;
            relativePath: string;
            sourceKind: 'public-contract-catalog' | 'workspace-artifact-bundle';
            generatedAt?: string;
        };
        right: {
            uri: string;
            relativePath: string;
            sourceKind: 'public-contract-catalog' | 'workspace-artifact-bundle';
            generatedAt?: string;
        };
    };
    summary: {
        addedCommands: number;
        removedCommands: number;
        changedCommands: number;
        addedApiMethods: number;
        removedApiMethods: number;
        changedApiMethods: number;
        addedLanguageModelTools: number;
        removedLanguageModelTools: number;
        changedLanguageModelTools: number;
        addedSchemas: number;
        removedSchemas: number;
        changedSchemas: number;
    };
    commands: {
        added: string[];
        removed: string[];
        changed: Array<{
            command: string;
            changedFields: string[];
        }>;
    };
    extensionApi: {
        added: string[];
        removed: string[];
        changed: Array<{
            name: string;
            changedFields: string[];
        }>;
    };
    languageModelTools: {
        added: string[];
        removed: string[];
        changed: Array<{
            name: string;
            changedFields: string[];
        }>;
    };
    schemas: {
        added: string[];
        removed: string[];
        changed: Array<{
            payloadKind: string;
            changedFields: string[];
        }>;
    };
}

export interface WorkspaceArtifactBundleDiffExportPayload {
    kind: 'powerbuilder-workspace-artifact-bundle-diff';
    schemaVersion: 1;
    generatedAt: string;
    snapshotKind: 'powerbuilder-workspace-artifact-bundle';
    inputs: {
        left: {
            uri: string;
            relativePath: string;
            generatedAt?: string;
        };
        right: {
            uri: string;
            relativePath: string;
            generatedAt?: string;
        };
    };
    summary: {
        addedArtifactKinds: number;
        removedArtifactKinds: number;
        changedArtifactKinds: number;
        changedSections: number;
    };
    artifacts: {
        added: string[];
        removed: string[];
        changed: string[];
    };
    workspaceManifest: WorkspaceManifestDiffExportPayload;
    publicContractCatalog: PublicContractCatalogDiffExportPayload;
    automationSurface: {
        commands: {
            added: string[];
            removed: string[];
            changed: Array<{
                command: string;
                changedFields: string[];
            }>;
        };
        extensionApi: {
            added: string[];
            removed: string[];
            changed: Array<{
                name: string;
                changedFields: string[];
            }>;
        };
        languageModelTools: {
            added: string[];
            removed: string[];
            changed: Array<{
                name: string;
                changedFields: string[];
            }>;
        };
    };
    diagnostics: {
        summaryDelta: {
            projectCount: number;
            objectCount: number;
            diagnosticCount: number;
            errorCount: number;
            warningCount: number;
        };
        changedProjects: Array<{
            key: string;
            issueDelta: number;
        }>;
    };
    featureSupport: {
        featureCountDelta: number;
        noteCountDelta: number;
        powerScriptLevelDelta: Array<{
            level: string;
            delta: number;
        }>;
        dataWindowLevelDelta: Array<{
            level: string;
            delta: number;
        }>;
    };
    buildSession: {
        changed: boolean;
        changedFields: string[];
    };
    releaseValidationReport: {
        previousStatus: WorkspaceArtifactBundleExportPayload['releaseValidationReport']['status'];
        nextStatus: WorkspaceArtifactBundleExportPayload['releaseValidationReport']['status'];
        changed: boolean;
    };
}

export interface WorkspaceArtifactBundleExportPayload {
    kind: 'powerbuilder-workspace-artifact-bundle';
    schemaVersion: 1;
    generatedAt: string;
    summary: {
        artifactCount: number;
        includesReleaseValidationReport: boolean;
    };
    artifacts: Array<{
        artifactKind: string;
        payloadKind: string;
        relativePath: string;
        generatedAt?: string;
        schemaVersion?: number;
    }>;
    bundle: {
        workspaceManifest: WorkspaceManifestExportPayload;
        automationSurface: AutomationSurfaceManifestExportPayload;
        workspaceDiagnosticsTree: WorkspaceDiagnosticsTreeExportPayload;
        featureSupportSnapshot: FeatureSupportSnapshotExportPayload;
        buildSessionManifest: BuildSessionManifestExportPayload;
        publicContractCatalog: PublicContractCatalogExportPayload;
    };
    releaseValidationReport: {
        status: 'available' | 'missing' | 'invalid';
        relativePath: string;
        payload?: ReleaseValidationReportPayload;
        reason?: string;
    };
}

export interface WorkspaceManifestDiffExportPayload {
    kind: 'powerbuilder-workspace-manifest-diff';
    schemaVersion: 1;
    generatedAt: string;
    snapshotKind: 'powerbuilder-workspace-manifest';
    inputs: {
        left: {
            uri: string;
            relativePath: string;
            sourceKind: 'workspace-manifest' | 'workspace-artifact-bundle';
            generatedAt?: string;
            projectCount: number;
            buildableTargetCount: number;
            retainedEffectiveRootCount: number;
        };
        right: {
            uri: string;
            relativePath: string;
            sourceKind: 'workspace-manifest' | 'workspace-artifact-bundle';
            generatedAt?: string;
            projectCount: number;
            buildableTargetCount: number;
            retainedEffectiveRootCount: number;
        };
    };
    summary: {
        addedProjects: number;
        removedProjects: number;
        changedProjects: number;
        addedBuildTargets: number;
        removedBuildTargets: number;
        changedBuildTargets: number;
        addedRetainedRoots: number;
        removedRetainedRoots: number;
        preferredProjectChanged: boolean;
        preferredBuildTargetChanged: boolean;
        indexingAuditChanged: boolean;
        incrementalImpactChanged: boolean;
    };
    workspace: {
        retainedEffectiveRootKeys: {
            added: string[];
            removed: string[];
        };
        preferredProject: {
            changed: boolean;
            left?: ExportedProject;
            right?: ExportedProject;
        };
        preferredBuildTarget: {
            changed: boolean;
            left?: ExportedWorkspaceImpactTarget;
            right?: ExportedWorkspaceImpactTarget;
        };
        projects: {
            added: ExportedWorkspaceProjectManifestEntry[];
            removed: ExportedWorkspaceProjectManifestEntry[];
            changed: Array<{
                uri: string;
                relativePath: string;
                name: string;
                changedFields: string[];
            }>;
        };
        buildableTargets: {
            added: ExportedBuildableTarget[];
            removed: ExportedBuildableTarget[];
            changed: Array<{
                uri: string;
                relativePath: string;
                name: string;
                kind: PbBuildTargetKind;
                changedFields: string[];
            }>;
        };
        indexingAudit: {
            left: WorkspaceManifestIndexingAudit;
            right: WorkspaceManifestIndexingAudit;
            delta: {
                indexedFileCount: number;
                indexedSymbolCount: number;
                snapshotCacheEntryCount: number;
                artifactPayloadCacheEntryCount: number;
                unassignedIndexedFileCount: number;
                staleIndexedFileCount: number;
                addedUnassignedIndexedFiles: string[];
                removedUnassignedIndexedFiles: string[];
                addedStaleIndexedFiles: string[];
                removedStaleIndexedFiles: string[];
            };
        };
        incrementalImpact: {
            changed: boolean;
            left?: WorkspaceManifestIncrementalImpact;
            right?: WorkspaceManifestIncrementalImpact;
        };
    };
    invalidation: {
        rootsChanged: boolean;
        buildGraphChanged: boolean;
        cacheSurfaceChanged: boolean;
        likelyImpactedArtifacts: string[];
        reasons: string[];
    };
}

export interface BuildReportExportPayload {
    kind: 'powerbuilder-build-report';
    schemaVersion: 1;
    generatedAt: string;
    project: ExportedProject;
    executablePath: string;
    args: string[];
    exitCode: number;
    summary: PbAutoBuildProjectBuildResult['summary'];
    issues: Array<{
        severity: string;
        message: string;
        category: string;
        objectName?: string;
        libraryPath?: string;
        compilerCode?: string;
        nativeCode?: string;
        rawLine: string;
    }>;
    diagnostics: Array<{
        uri: string;
        relativePath: string;
        count: number;
    }>;
    output: string;
}

export interface WorkspaceDiagnosticsTreeExportPayload {
    kind: 'powerbuilder-workspace-diagnostics-tree';
    schemaVersion: 1;
    generatedAt: string;
    summary: {
        projectCount: number;
        objectCount: number;
        diagnosticCount: number;
        errorCount: number;
        warningCount: number;
    };
    projects: Array<{
        key: string;
        label: string;
        project?: ExportedProject;
        objectCount: number;
        issueCount: number;
        errorCount: number;
        warningCount: number;
        objects: Array<{
            label: string;
            uri: string;
            relativePath: string;
            issueCount: number;
            errorCount: number;
            warningCount: number;
            diagnostics: Array<{
                message: string;
                severity: 'error' | 'warning' | 'information' | 'hint';
                source?: string;
                code?: string;
                range: ExportedRange;
            }>;
        }>;
    }>;
}

export interface FeatureSupportSnapshotExportPayload {
    kind: 'powerbuilder-feature-support-snapshot';
    schemaVersion: 1;
    generatedAt: string;
    source: {
        uri: string;
        relativePath: string;
    };
    levels: Array<{
        level: string;
        description: string;
    }>;
    summary: {
        featureCount: number;
        noteCount: number;
        powerScriptLevels: Array<{
            level: string;
            count: number;
        }>;
        dataWindowLevels: Array<{
            level: string;
            count: number;
        }>;
    };
    entries: Array<{
        feature: string;
        powerScript: string;
        dataWindow: string;
        notes: string;
    }>;
    productNotes: string[];
}

export interface SemanticSnapshotDiffExportPayload {
    kind: 'powerbuilder-semantic-snapshot-diff';
    schemaVersion: 1;
    generatedAt: string;
    snapshotKind: 'powerbuilder-semantic-project';
    inputs: {
        left: {
            uri: string;
            relativePath: string;
            projectName: string;
            summary: SemanticProjectExportPayload['summary'];
        };
        right: {
            uri: string;
            relativePath: string;
            projectName: string;
            summary: SemanticProjectExportPayload['summary'];
        };
    };
    summary: {
        addedFiles: number;
        removedFiles: number;
        changedFiles: number;
        addedSymbols: number;
        removedSymbols: number;
        changedSymbols: number;
        addedCallables: number;
        removedCallables: number;
        changedCallables: number;
    };
    files: {
        added: Array<{
            relativePath: string;
            objectName?: string;
        }>;
        removed: Array<{
            relativePath: string;
            objectName?: string;
        }>;
        changed: Array<{
            relativePath: string;
            objectName?: string;
            addedSymbols: ExportedPbSymbol[];
            removedSymbols: ExportedPbSymbol[];
            changedSymbols: Array<{
                persistentId: string;
                left: ExportedPbSymbol;
                right: ExportedPbSymbol;
            }>;
            addedCallables: ExportedPbSymbol[];
            removedCallables: ExportedPbSymbol[];
            changedCallables: Array<{
                persistentId: string;
                left: ExportedPbSymbol;
                right: ExportedPbSymbol;
            }>;
        }>;
    };
}

export interface InheritanceOwnerGraphExportPayload {
    kind: 'powerbuilder-inheritance-owner-graph';
    schemaVersion: 1;
    generatedAt: string;
    project: ExportedProject;
    summary: {
        typeCount: number;
        inheritsEdgeCount: number;
        ownerMemberEdgeCount: number;
        callableFamilyCount: number;
    };
    types: ExportedPbSymbol[];
    inherits: Array<{
        typeName: string;
        typePersistentId: string;
        baseTypeName: string;
        baseTypePersistentId?: string;
    }>;
    ownerMembers: Array<{
        focusTypeName: string;
        focusTypePersistentId: string;
        member: ExportedPbSymbol;
        declaredOnTypeName?: string;
        declaredOnTypePersistentId?: string;
        relation: 'declared' | 'inherited';
        inheritanceDistance?: number;
    }>;
    callableFamilies: Array<{
        focusTypeName: string;
        focusTypePersistentId: string;
        callableName: string;
        ownerHierarchy: string[];
        members: ExportedPbSymbol[];
    }>;
}

export interface ScriptDependencyGraphExportPayload {
    kind: 'powerbuilder-script-dependency-graph';
    schemaVersion: 1;
    generatedAt: string;
    project: ExportedProject;
    summary: {
        callableCount: number;
        edgeCount: number;
        resolvedEdgeCount: number;
        unresolvedEdgeCount: number;
    };
    callables: ExportedPbSymbol[];
    edges: Array<{
        sourceCallable: ExportedPbSymbol;
        invocation: {
            name: string;
            range: ExportedRange;
            qualifiedOwner?: string;
            qualifiedOwnerExpression?: string;
            qualifier?: '.' | '::';
            providedArgumentCount?: number;
        };
        targetCallable?: ExportedPbSymbol;
        precision: string;
        reasons: readonly unknown[];
        evidence: readonly unknown[];
    }>;
}

export interface ExportedSystemSymbolEntry {
    id: string;
    name: string;
    normalizedName: string;
    kind: string;
    namespace: string;
    invocation: string;
    domain: string;
    category: string;
    summary: string;
    signatures: PbSystemSymbolEntry['signatures'];
    dataset: string;
    source: string;
    sourceUrl?: string;
    appliesTo?: readonly string[];
    ownerTypes?: readonly string[];
    lookupAliases?: readonly string[];
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
    provenance: PbSystemSymbolEntry['provenance'];
    typing: ExportedRuntimeTypingMetadata;
}

export interface ExportedRuntimeTypingMetadata {
    callableKind: 'global-function' | 'object-function' | 'datawindow-function' | 'system-event' | 'datawindow-event' | 'statement';
    ownerKind: 'global' | 'typed-owner' | 'untyped-owner';
    ownerTypeCount: number;
    signatureCount: number;
    overloaded: boolean;
    explicitParameterMetadata: boolean;
    derivedReturnType?: string;
    derivedReturnTypeSource: 'signature-prefix' | 'none';
    signatureShapes: ExportedRuntimeSignatureShape[];
}

export interface ExportedRuntimeSignatureShape {
    label: string;
    parameterLabels: string[];
    parameterLabelSource: 'explicit' | 'parsed-label' | 'none';
    parameterCount: number;
    optionalParameterCount: number;
    derivedReturnType?: string;
    derivedReturnTypeSource: 'signature-prefix' | 'none';
}

export interface ExportedWorkspaceProjectManifestEntry extends ExportedProject {
    sourceRootPaths: string[];
    sourceRootKeys: string[];
    excludedRootPaths: string[];
    excludedRootKeys: string[];
    matchScoreForAnchor?: number;
    isPreferredForAnchor: boolean;
}

interface CollectedCallableInvocation {
    name: string;
    position: vscode.Position;
    range: vscode.Range;
    qualifiedOwner?: string;
    qualifiedOwnerExpression?: string;
    qualifier?: '.' | '::';
    providedArgumentCount?: number;
}

interface WorkspaceBuildableTargetRelation {
    project: PbProjectDefinition;
    precision: 'exact' | 'compatible';
    relation: 'self-project' | 'declared-build-member' | 'co-located-build-scope';
    reason: string;
}

interface WorkspaceBuildableTargetDescriptor {
    uri: vscode.Uri;
    kind: PbBuildTargetKind;
    relatedProjects: WorkspaceBuildableTargetRelation[];
}

const EXPORT_ROOT_RELATIVE_DIR = 'docs/generated/powerbuilder/exports';
const RELEASE_VALIDATION_REPORT_RELATIVE_PATH_SEGMENTS = [
    'docs',
    'generated',
    'powerbuilder',
    'exports',
    'release',
    'release-validation-report.json',
] as const;

function splitRuntimeCatalogSignatureParameters(label: string): string[] {
    const openParen = label.indexOf('(');
    const closeParen = label.lastIndexOf(')');

    if (openParen < 0 || closeParen <= openParen) {
        return [];
    }

    const content = label.slice(openParen + 1, closeParen).trim();

    if (!content) {
        return [];
    }

    const parameters: string[] = [];
    let current = '';
    let depth = 0;
    let stringDelimiter: '"' | '\'' | undefined;

    for (let index = 0; index < content.length; index++) {
        const character = content[index];

        if (stringDelimiter) {
            current += character;

            if (character === '~') {
                current += content[index + 1] ?? '';
                index++;
                continue;
            }

            if (character === stringDelimiter) {
                stringDelimiter = undefined;
            }

            continue;
        }

        if (character === '"' || character === '\'') {
            stringDelimiter = character;
            current += character;
            continue;
        }

        if (character === '(') {
            depth++;
            current += character;
            continue;
        }

        if (character === ')') {
            depth = Math.max(0, depth - 1);
            current += character;
            continue;
        }

        if (character === ',' && depth === 0) {
            const parameter = current.trim();

            if (parameter) {
                parameters.push(parameter);
            }

            current = '';
            continue;
        }

        current += character;
    }

    const parameter = current.trim();

    if (parameter) {
        parameters.push(parameter);
    }

    return parameters;
}

function normalizeRuntimeCatalogParameterLabel(label: string): string {
    return label.replace(/[{}]/g, ' ').replace(/\s+/g, ' ').trim();
}

function deriveRuntimeCatalogReturnType(signature: PbSystemSymbolSignature): string | undefined {
    const openParen = signature.label.indexOf('(');

    if (openParen <= 0) {
        return undefined;
    }

    const prefix = signature.label.slice(0, openParen).trim();
    const segments = prefix.split(/\s+/).filter(Boolean);

    if (segments.length < 2) {
        return undefined;
    }

    const returnType = segments.slice(0, -1).join(' ').trim();

    return returnType || undefined;
}

export class PowerBuilderArtifactWorkspaceService {
    private readonly index = SymbolIndex.getInstance();
    private readonly workspaceIndexer = new WorkspaceIndexer(this.index);
    private readonly projectRegistry = PowerBuilderProjectRegistry.getInstance();
    private readonly snapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance();
    private readonly semanticQueries = new SemanticQueryService(this.index);
    private readonly artifactPayloadCache = new Map<string, { versionToken: string; payload: unknown }>();
    private readonly dataWindowParser = new PbDataWindowParser();
    private readonly buildTargetParser = new PbBuildTargetParser();
    private readonly activeHierarchyInspectionService = new PowerBuilderActiveHierarchyInspectionService();
    private readonly ancestorScriptService = new PowerBuilderAncestorScriptService();

    async generateSemanticDocumentExport(
        document: vscode.TextDocument,
        position?: vscode.Position,
    ): Promise<GenerateSemanticDocumentExportResult> {
        const project = await this.resolvePreferredProjectForDocument(document.uri);

        if (project) {
            await this.workspaceIndexer.indexProjectFile(project.uri);
        } else {
            this.workspaceIndexer.indexDocument(document);
        }

        const rootSymbol = this.index.getPrimaryFileObjectSymbol(document.uri);
        const symbols = this.index.getSymbolsForFile(document.uri);

        if (symbols.length === 0) {
            return {
                kind: 'unsupported',
                reason: 'No hay simbolos PowerBuilder indexados para exportar en el documento activo.',
            };
        }

        const callables = symbols.filter(isCallableSymbol);
        const payload = await this.getOrBuildCachedPayload(
            `semantic-document:${document.uri.toString()}:${position?.line ?? -1}:${position?.character ?? -1}`,
            await this.buildSemanticDocumentVersionToken(document, project, position),
            async (): Promise<SemanticDocumentExportPayload> => ({
                kind: 'powerbuilder-semantic-document',
                schemaVersion: 1,
                generatedAt: new Date().toISOString(),
                document: {
                    uri: document.uri.toString(),
                    relativePath: this.toRelativeWorkspacePath(document.uri),
                    languageId: document.languageId,
                    objectName: rootSymbol?.name,
                },
                project: project ? this.serializeProject(project) : undefined,
                symbols: symbols.map(symbol => this.serializeSymbol(symbol)),
                callables: callables.map(symbol => this.serializeSymbol(symbol)),
                scopes: callables.map(callable => this.serializeScope(callable, symbols)),
                currentQuery: position
                    ? (await this.buildSemanticQueryPayload(document, position, project))?.query
                    : undefined,
            }),
        );
        const output = this.buildExportTarget(
            document.uri,
            `documents/${sanitizeSegment(project?.name ?? '_workspace')}/${sanitizeSegment(rootSymbol?.name ?? path.parse(document.uri.fsPath || document.uri.path).name)}.semantic-document.json`,
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            kind: 'generated',
            file: output,
            project,
            payload,
        };
    }

    async generateSemanticProjectExport(
        document: vscode.TextDocument,
    ): Promise<GenerateSemanticProjectExportResult> {
        const project = await this.resolvePreferredProjectForDocument(document.uri);

        if (!project) {
            return {
                kind: 'no-project',
                reason: 'No se pudo resolver un proyecto preferido para exportar el snapshot semantico.',
            };
        }

        await this.workspaceIndexer.indexProjectFile(project.uri);

        const fileUris = this.index.getIndexedUris()
            .filter(uri => this.projectRegistry.isSourceFileInProject(uri, project))
            .sort((left, right) => this.toRelativeWorkspacePath(left).localeCompare(this.toRelativeWorkspacePath(right)));
        const fileEntries = fileUris.map(uri => {
            const symbols = this.index.getSymbolsForFile(uri);
            const rootSymbol = this.index.getPrimaryFileObjectSymbol(uri);

            return {
                uri: uri.toString(),
                relativePath: this.toRelativeWorkspacePath(uri),
                objectName: rootSymbol?.name,
                symbols: symbols.map(symbol => this.serializeSymbol(symbol)),
                callables: symbols.filter(isCallableSymbol).map(symbol => this.serializeSymbol(symbol)),
            };
        });
        const payload = await this.getOrBuildCachedPayload(
            `semantic-project:${project.uri.toString()}`,
            await this.buildProjectArtifactVersionToken(project),
            async (): Promise<SemanticProjectExportPayload> => ({
                kind: 'powerbuilder-semantic-project',
                schemaVersion: 1,
                generatedAt: new Date().toISOString(),
                project: this.serializeProject(project),
                summary: {
                    fileCount: fileEntries.length,
                    symbolCount: fileEntries.reduce((count, entry) => count + entry.symbols.length, 0),
                    callableCount: fileEntries.reduce((count, entry) => count + entry.callables.length, 0),
                    typeCount: fileEntries.reduce((count, entry) => count + entry.symbols.filter(symbol => symbol.kind === 'type' || symbol.kind === 'structure').length, 0),
                },
                files: fileEntries,
            }),
        );
        const output = this.buildExportTarget(
            document.uri,
            `projects/${sanitizeSegment(project.name)}.semantic-project.json`,
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            kind: 'generated',
            file: output,
            project,
            payload,
        };
    }

    async generateInheritanceOwnerGraphExport(
        document: vscode.TextDocument,
    ): Promise<GenerateInheritanceOwnerGraphExportResult> {
        const project = await this.resolvePreferredProjectForDocument(document.uri);

        if (!project) {
            return {
                kind: 'no-project',
                reason: 'No se pudo resolver un proyecto preferido para exportar el grafo de herencia y owners.',
            };
        }

        await this.workspaceIndexer.indexProjectFile(project.uri);

        const inheritanceGraph = getInheritanceGraph(this.index);
        const typeSymbols = this.collectProjectTypeSymbols(project);
        const typeSymbolByName = new Map(typeSymbols.map(symbol => [normalizeIdentifier(symbol.name), symbol] as const));
        const ownerMembers: InheritanceOwnerGraphExportPayload['ownerMembers'] = [];
        const callableFamilies: InheritanceOwnerGraphExportPayload['callableFamilies'] = [];

        for (const typeSymbol of typeSymbols) {
            const focusType = this.serializeSymbol(typeSymbol);
            const members = inheritanceGraph.getMembers(typeSymbol.name)
                .filter(symbol => this.projectRegistry.isSourceFileInProject(symbol.uri, project));
            const callableFamiliesByKey = new Map<string, PbSymbol[]>();

            for (const member of members) {
                const declaredOnTypeName = this.resolveGraphOwnerName(member);
                const declaredOnType = declaredOnTypeName
                    ? typeSymbolByName.get(normalizeIdentifier(declaredOnTypeName))
                    : undefined;
                const inheritanceDistance = declaredOnTypeName
                    ? inheritanceGraph.getTypeDistance(typeSymbol.name, declaredOnTypeName)
                    : Number.POSITIVE_INFINITY;

                ownerMembers.push({
                    focusTypeName: typeSymbol.name,
                    focusTypePersistentId: focusType.persistentId,
                    member: this.serializeSymbol(member),
                    declaredOnTypeName,
                    declaredOnTypePersistentId: declaredOnType ? this.serializeSymbol(declaredOnType).persistentId : undefined,
                    relation: declaredOnTypeName && normalizeIdentifier(declaredOnTypeName) !== normalizeIdentifier(typeSymbol.name)
                        ? 'inherited'
                        : 'declared',
                    inheritanceDistance: Number.isFinite(inheritanceDistance) ? inheritanceDistance : undefined,
                });

                if (isCallableSymbol(member)) {
                    const familyKey = `${normalizeIdentifier(member.name)}|${member.parameterCount ?? -1}`;
                    const existing = callableFamiliesByKey.get(familyKey) ?? [];

                    existing.push(member);
                    callableFamiliesByKey.set(familyKey, existing);
                }
            }

            for (const membersOfFamily of callableFamiliesByKey.values()) {
                const sortedMembers = membersOfFamily
                    .map(symbol => this.serializeSymbol(symbol))
                    .sort((left, right) => left.relativePath.localeCompare(right.relativePath) || left.range.start.line - right.range.start.line);

                callableFamilies.push({
                    focusTypeName: typeSymbol.name,
                    focusTypePersistentId: focusType.persistentId,
                    callableName: sortedMembers[0]?.name ?? '',
                    ownerHierarchy: inheritanceGraph.getTypeHierarchy(typeSymbol.name),
                    members: sortedMembers,
                });
            }
        }

        const inherits = typeSymbols
            .filter(symbol => !!symbol.baseTypeName)
            .map(symbol => {
                const baseType = typeSymbolByName.get(normalizeIdentifier(symbol.baseTypeName));
                const serializedType = this.serializeSymbol(symbol);

                return {
                    typeName: symbol.name,
                    typePersistentId: serializedType.persistentId,
                    baseTypeName: symbol.baseTypeName!,
                    baseTypePersistentId: baseType ? this.serializeSymbol(baseType).persistentId : undefined,
                };
            });
        const payload = await this.getOrBuildCachedPayload(
            `inheritance-owner-graph:${project.uri.toString()}`,
            await this.buildProjectArtifactVersionToken(project),
            async (): Promise<InheritanceOwnerGraphExportPayload> => ({
                kind: 'powerbuilder-inheritance-owner-graph',
                schemaVersion: 1,
                generatedAt: new Date().toISOString(),
                project: this.serializeProject(project),
                summary: {
                    typeCount: typeSymbols.length,
                    inheritsEdgeCount: inherits.length,
                    ownerMemberEdgeCount: ownerMembers.length,
                    callableFamilyCount: callableFamilies.length,
                },
                types: typeSymbols.map(symbol => this.serializeSymbol(symbol)),
                inherits,
                ownerMembers,
                callableFamilies,
            }),
        );
        const output = this.buildExportTarget(
            document.uri,
            `graphs/${sanitizeSegment(project.name)}.inheritance-owner-graph.json`,
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            kind: 'generated',
            file: output,
            project,
            payload,
        };
    }

    async generateScriptDependencyGraphExport(
        document: vscode.TextDocument,
    ): Promise<GenerateScriptDependencyGraphExportResult> {
        const project = await this.resolvePreferredProjectForDocument(document.uri);

        if (!project) {
            return {
                kind: 'no-project',
                reason: 'No se pudo resolver un proyecto preferido para exportar el grafo de dependencias de script.',
            };
        }

        await this.workspaceIndexer.indexProjectFile(project.uri);

        const callables = this.collectProjectImplementedCallables(project);
        const edges: ScriptDependencyGraphExportPayload['edges'] = [];

        for (const callable of callables) {
            const callableDocument = await vscode.workspace.openTextDocument(callable.uri);
            const invocationCandidates = this.collectCallableInvocations(callableDocument, callable);

            for (const invocation of invocationCandidates) {
                const symbolContext = getSymbolContextAtPosition(callableDocument, invocation.position);

                if (!symbolContext) {
                    continue;
                }

                const result = this.semanticQueries.resolveSymbolAtPosition({
                    document: callableDocument,
                    position: invocation.position,
                    context: symbolContext,
                });
                const targetCallable = result.primarySymbol && isCallableSymbol(result.primarySymbol)
                    ? this.serializeSymbol(result.primarySymbol)
                    : undefined;

                edges.push({
                    sourceCallable: this.serializeSymbol(callable),
                    invocation: {
                        name: invocation.name,
                        range: this.serializeRange(invocation.range),
                        qualifiedOwner: invocation.qualifiedOwner,
                        qualifiedOwnerExpression: invocation.qualifiedOwnerExpression,
                        qualifier: invocation.qualifier,
                        providedArgumentCount: invocation.providedArgumentCount,
                    },
                    targetCallable,
                    precision: result.precision,
                    reasons: result.reasons,
                    evidence: result.evidence,
                });
            }
        }

        const payload = await this.getOrBuildCachedPayload(
            `script-dependency-graph:${project.uri.toString()}`,
            await this.buildProjectArtifactVersionToken(project),
            async (): Promise<ScriptDependencyGraphExportPayload> => ({
                kind: 'powerbuilder-script-dependency-graph',
                schemaVersion: 1,
                generatedAt: new Date().toISOString(),
                project: this.serializeProject(project),
                summary: {
                    callableCount: callables.length,
                    edgeCount: edges.length,
                    resolvedEdgeCount: edges.filter(edge => !!edge.targetCallable).length,
                    unresolvedEdgeCount: edges.filter(edge => !edge.targetCallable).length,
                },
                callables: callables.map(callableSymbol => this.serializeSymbol(callableSymbol)),
                edges,
            }),
        );
        const output = this.buildExportTarget(
            document.uri,
            `graphs/${sanitizeSegment(project.name)}.script-dependency-graph.json`,
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            kind: 'generated',
            file: output,
            project,
            payload,
        };
    }

    async generateSemanticQueryExport(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): Promise<GenerateSemanticQueryExportResult> {
        const result = await this.runSemanticQuery(document, position);

        if (result.kind !== 'generated') {
            return {
                kind: 'no-query',
                reason: result.reason,
            };
        }

        const rootSymbol = this.index.getPrimaryFileObjectSymbol(document.uri);
        const output = this.buildExportTarget(
            document.uri,
            `queries/${sanitizeSegment(result.payload.project?.name ?? '_workspace')}/${sanitizeSegment(rootSymbol?.name ?? path.parse(document.uri.fsPath || document.uri.path).name)}.${sanitizeSegment(result.payload.document.word || 'cursor')}.semantic-query.json`,
        );
        const payload = result.payload;

        await this.writeJsonFile(output.uri, payload);

        return {
            kind: 'generated',
            file: output,
            project: this.projectRegistry.findProjectsForSourceFile(document.uri)[0],
            payload,
        };
    }

    async runSemanticQuery(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): Promise<RunSemanticQueryResult> {
        const project = await this.resolvePreferredProjectForDocument(document.uri);

        if (project) {
            await this.workspaceIndexer.indexProjectFile(project.uri);
        } else {
            this.workspaceIndexer.indexDocument(document);
        }

        const payload = await this.buildSemanticQueryPayload(document, position, project);

        if (!payload) {
            return {
                kind: 'no-query',
                reason: 'No hay un simbolo resoluble bajo el cursor para ejecutar la query semantica.',
            };
        }

        return {
            kind: 'generated',
            payload,
        };
    }

    async generateOverloadResolutionExplanationExport(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): Promise<GenerateOverloadResolutionExplanationExportResult> {
        const result = await this.runOverloadResolutionExplanation(document, position);

        if (result.kind !== 'generated') {
            return {
                kind: 'no-call',
                reason: result.reason,
            };
        }

        const rootSymbol = this.index.getPrimaryFileObjectSymbol(document.uri);
        const output = this.buildExportTarget(
            document.uri,
            `queries/${sanitizeSegment(result.payload.project?.name ?? '_workspace')}/${sanitizeSegment(rootSymbol?.name ?? path.parse(document.uri.fsPath || document.uri.path).name)}.${sanitizeSegment(result.payload.call.name)}.overload-resolution-explanation.json`,
        );
        const payload = result.payload;

        await this.writeJsonFile(output.uri, payload);

        return {
            kind: 'generated',
            file: output,
            project: this.projectRegistry.findProjectsForSourceFile(document.uri)[0],
            payload,
        };
    }

    async runOverloadResolutionExplanation(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): Promise<RunOverloadResolutionExplanationResult> {
        const project = await this.resolvePreferredProjectForDocument(document.uri);

        if (project) {
            await this.workspaceIndexer.indexProjectFile(project.uri);
        } else {
            this.workspaceIndexer.indexDocument(document);
        }

        const payload = this.buildOverloadResolutionExplanationPayload(document, position, project);

        if (!payload) {
            return {
                kind: 'no-call',
                reason: 'No se detecto una llamada activa para explicar la resolucion de overloads.',
            };
        }

        return {
            kind: 'generated',
            payload,
        };
    }

    async runActiveHierarchyInspection(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): Promise<ActiveHierarchyInspectionRunResult> {
        const result = await this.activeHierarchyInspectionService.explainForDocument(document, position);

        if (result.kind !== 'generated') {
            return result;
        }

        return {
            kind: 'generated',
            payload: {
                kind: 'powerbuilder-active-hierarchy-inspection',
                schemaVersion: 1,
                generatedAt: new Date().toISOString(),
                inspection: result.inspection,
            },
        };
    }

    async runAncestorScriptInspection(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): Promise<AncestorScriptInspectionRunResult> {
        const result = await this.ancestorScriptService.showForDocument(document, position);

        if (result.kind !== 'generated') {
            return result;
        }

        return {
            kind: 'generated',
            payload: {
                kind: 'powerbuilder-ancestor-script-inspection',
                schemaVersion: 1,
                generatedAt: new Date().toISOString(),
                inspection: result.inspection,
            },
        };
    }

    runBuildSessionManifest(
        autoBuildService: PowerBuilderAutoBuildService,
    ): RunBuildSessionManifestResult {
        return {
            kind: 'generated',
            payload: this.buildBuildSessionManifestPayload(autoBuildService),
        };
    }

    async runWorkspaceBuildPreference(
        anchorUri?: vscode.Uri,
    ): Promise<RunWorkspaceBuildPreferenceResult> {
        await this.workspaceIndexer.indexProjects({ indexSourceFiles: true });

        return {
            kind: 'generated',
            payload: await this.buildWorkspaceBuildPreferencePayload(anchorUri),
        };
    }

    async generateRuntimeCatalogExport(
        anchorUri?: vscode.Uri,
    ): Promise<GenerateRuntimeCatalogExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const payload: RuntimeCatalogExportPayload = {
            kind: 'powerbuilder-runtime-catalog',
            schemaVersion: 2,
            generatedAt: new Date().toISOString(),
            summary: {
                sliceCount: PB_SYSTEM_SYMBOL_REGISTRY.slices.length,
                entryCount: PB_SYSTEM_SYMBOL_REGISTRY.entries.length,
            },
            typing: this.buildRuntimeCatalogTypingSummary(PB_SYSTEM_SYMBOL_REGISTRY),
            coverage: buildSystemSymbolCoverageReport(PB_SYSTEM_SYMBOL_REGISTRY.slices),
            consistency: buildSystemSymbolConsistencyReport(PB_SYSTEM_SYMBOL_REGISTRY.slices),
            indexes: this.buildRuntimeCatalogIndexes(PB_SYSTEM_SYMBOL_REGISTRY),
            slices: PB_SYSTEM_SYMBOL_REGISTRY.slices.map(slice => ({
                dataset: slice.dataset,
                domain: slice.domain,
                entryCount: slice.entries.length,
                allowedCategories: slice.allowedCategories,
                allowedOwnerTypes: slice.allowedOwnerTypes,
                requireSourceUrl: slice.requireSourceUrl,
            })),
            entries: this.serializeSystemRegistry(PB_SYSTEM_SYMBOL_REGISTRY).entries,
        };
        const output = this.buildExportTarget(
            workspaceUri,
            'runtime/system-symbol-catalog.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateWorkspaceManifestExport(
        anchorUri?: vscode.Uri,
    ): Promise<GenerateWorkspaceManifestExportResult> {
        await this.workspaceIndexer.indexProjects({ indexSourceFiles: true });

        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const projects = this.projectRegistry.getProjects()
            .sort((left, right) => left.name.localeCompare(right.name));
        const matchingProjects = anchorUri
            ? this.projectRegistry.findProjectsForSourceFile(anchorUri)
            : [];
        const preferredProject = matchingProjects[0];
        const buildableTargets = await this.collectWorkspaceBuildableTargets(projects);
        const buildTargetPreference = this.buildWorkspaceBuildTargetPreference(anchorUri, matchingProjects, buildableTargets);
        const payload = await this.getOrBuildCachedPayload(
            `workspace-manifest:${anchorUri?.toString() ?? '_workspace'}`,
            await this.buildWorkspaceManifestVersionToken(
                projects,
                buildableTargets,
                anchorUri,
                preferredProject,
                matchingProjects,
            ),
            async (): Promise<WorkspaceManifestExportPayload> => ({
                kind: 'powerbuilder-workspace-manifest',
                schemaVersion: 1,
                generatedAt: new Date().toISOString(),
                workspace: {
                    folders: (vscode.workspace.workspaceFolders ?? []).map(folder => ({
                        uri: folder.uri.toString(),
                        relativePath: this.toRelativeWorkspacePath(folder.uri),
                        name: folder.name,
                    })),
                    projectCount: projects.length,
                    indexingExcludePatterns: getIndexingExcludePatterns(),
                    retainedEffectiveRootKeys: Array.from(this.projectRegistry.getRetainedProjectRootKeys()).sort(),
                    anchorUri: anchorUri?.toString(),
                    anchorRelativePath: anchorUri ? this.toRelativeWorkspacePath(anchorUri) : undefined,
                    preferredProject: preferredProject ? this.serializeProject(preferredProject) : undefined,
                    matchingProjectsForAnchor: matchingProjects.map(project => this.serializeProject(project)),
                    preferredBuildTarget: buildTargetPreference.preferredBuildTarget,
                    matchingBuildTargetsForAnchor: buildTargetPreference.matchingBuildTargetsForAnchor,
                    buildableTargetCount: buildableTargets.length,
                    buildableTargets: buildableTargets.map(target => this.serializeBuildableTarget(target)),
                    indexingAudit: this.buildWorkspaceIndexingAudit(projects),
                    incrementalImpact: this.buildWorkspaceIncrementalImpact(anchorUri, matchingProjects, buildableTargets),
                },
                projects: projects.map(project => this.serializeWorkspaceProjectManifestEntry(project, anchorUri, preferredProject)),
                graph: this.buildWorkspaceGraph(projects, buildableTargets),
            }),
        );
        const output = this.buildExportTarget(
            workspaceUri,
            'workspace/workspace-manifest.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateDataWindowManifestExport(
        document: vscode.TextDocument,
    ): Promise<GenerateDataWindowManifestExportResult> {
        const parseResult = this.dataWindowParser.parseDocument(document);
        const semantics = buildDataWindowSqlSemantics(document, this.dataWindowParser);
        const tableNode = (parseResult.root.children ?? []).find(node => node.kind === 'table');
        const tableColumns = (tableNode?.children ?? [])
            .filter((node): node is PbDataWindowNode => node.kind === 'table-column');
        const retrieveNode = tableNode?.children?.find((node): node is PbDataWindowNode => node.kind === 'retrieve');
        const retrieveColumnNames = new Set(
            semantics.selectColumnReferences.map(reference => reference.columnName.trim().toLowerCase()),
        );
        const payload: DataWindowManifestExportPayload = {
            kind: 'powerbuilder-datawindow-manifest',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            document: {
                uri: document.uri.toString(),
                relativePath: this.toRelativeWorkspacePath(document.uri),
                objectName: parseResult.metadata.objectName,
            },
            project: this.projectRegistry.findProjectsForSourceFile(document.uri)[0]
                ? this.serializeProject(this.projectRegistry.findProjectsForSourceFile(document.uri)[0])
                : undefined,
            summary: {
                bandCount: parseResult.metadata.bandNames.length,
                tableColumnCount: tableColumns.length,
                textCount: parseResult.metadata.textCount,
                displayColumnCount: parseResult.metadata.displayColumnCount,
                retrieveColumnReferenceCount: semantics.selectColumnReferences.length,
            },
            bands: (parseResult.root.children ?? [])
                .filter((node): node is PbDataWindowNode => node.kind === 'band')
                .map(node => this.serializeDataWindowNode(node)),
            table: {
                range: tableNode ? this.serializeRange(tableNode.range) : undefined,
                selectionRange: tableNode ? this.serializeRange(tableNode.selectionRange) : undefined,
                columns: tableColumns.map(node => ({
                    ...this.serializeDataWindowNode(node),
                    referencedInRetrieve: retrieveColumnNames.has(node.name.trim().toLowerCase()),
                })),
                retrieve: retrieveNode && parseResult.metadata.retrieveStatement
                    ? {
                        statement: parseResult.metadata.retrieveStatement,
                        range: this.serializeRange(retrieveNode.range),
                        selectionRange: this.serializeRange(retrieveNode.selectionRange),
                        selectColumns: semantics.selectColumnReferences.map(reference => ({
                            rawText: reference.rawText,
                            columnName: reference.columnName,
                            qualifiedTableName: reference.qualifiedTableName,
                            range: this.serializeRange(reference.range),
                            linkedTableColumnName: semantics.tableColumnsByName.get(reference.columnName.trim().toLowerCase())?.name,
                        })),
                    }
                    : undefined,
            },
            texts: (parseResult.root.children ?? [])
                .filter((node): node is PbDataWindowNode => node.kind === 'text')
                .map(node => this.serializeDataWindowNode(node)),
            displayColumns: (parseResult.root.children ?? [])
                .filter((node): node is PbDataWindowNode => node.kind === 'column-control')
                .map(node => this.serializeDataWindowNode(node)),
        };
        const output = this.buildExportTarget(
            document.uri,
            `datawindow/${sanitizeSegment(parseResult.metadata.objectName || path.parse(document.uri.fsPath || document.uri.path).name)}.datawindow-manifest.json`,
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateVisibilityAuditExport(
        anchorUri?: vscode.Uri,
    ): Promise<GenerateVisibilityAuditExportResult> {
        await this.workspaceIndexer.indexWorkspace();

        const preferredProject = anchorUri
            ? await this.resolvePreferredProjectForDocument(anchorUri)
            : undefined;
        const payload = await this.buildVisibilityAuditPayload(preferredProject);
        const output = this.buildExportTarget(
            anchorUri
                ?? vscode.workspace.workspaceFolders?.[0]?.uri
                ?? vscode.Uri.file(process.cwd()),
            'workspace/visibility-audit.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateDataWindowWorkspaceCatalogExport(
        anchorUri?: vscode.Uri,
    ): Promise<GenerateDataWindowWorkspaceCatalogExportResult> {
        const preferredProject = anchorUri
            ? await this.resolvePreferredProjectForDocument(anchorUri)
            : undefined;
        const entries = await this.collectWorkspaceDataWindowCatalogEntries(preferredProject);
        let uniqueProjectBindingCount = 0;
        let ambiguousProjectBindingCount = 0;
        let childLinkCount = 0;

        const payloadEntries: DataWindowWorkspaceCatalogExportPayload['entries'] = [];

        for (const entry of entries) {
            const childLinks = await resolveVerifiedDataWindowChildLinks(
                entry.candidate.uri,
                entry.candidate,
                this.dataWindowParser,
                this.snapshotStore,
            );

            childLinkCount += childLinks.length;
            uniqueProjectBindingCount += entry.projectBindings.filter(binding => binding.verifiability === 'unique').length;
            ambiguousProjectBindingCount += entry.projectBindings.filter(binding => binding.verifiability === 'ambiguous').length;

            payloadEntries.push({
                uri: entry.candidate.uri.toString(),
                relativePath: this.toRelativeWorkspacePath(entry.candidate.uri),
                objectName: this.getDataWindowObjectName(entry.parseResult, entry.candidate.uri),
                projectBindings: entry.projectBindings,
                summary: {
                    bandCount: entry.parseResult.metadata.bandNames.length,
                    tableColumnCount: entry.parseResult.metadata.tableColumnNames.length,
                    textCount: entry.parseResult.metadata.textCount,
                    displayColumnCount: entry.parseResult.metadata.displayColumnCount,
                    retrieveColumnReferenceCount: entry.retrieveColumnReferenceCount,
                    childLinkCount: childLinks.length,
                },
                retrieve: entry.parseResult.metadata.retrieveStatement
                    ? {
                        statement: entry.parseResult.metadata.retrieveStatement,
                        selectColumnCount: entry.retrieveColumnReferenceCount,
                    }
                    : undefined,
            });
        }

        payloadEntries.sort((left, right) => left.relativePath.localeCompare(right.relativePath));

        const payload: DataWindowWorkspaceCatalogExportPayload = {
            kind: 'powerbuilder-datawindow-workspace-catalog',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            summary: {
                projectCount: new Set(payloadEntries.flatMap(entry => entry.projectBindings.map(binding => binding.project.uri))).size,
                dataWindowCount: payloadEntries.length,
                uniqueProjectBindingCount,
                ambiguousProjectBindingCount,
                childLinkCount,
            },
            entries: payloadEntries,
        };
        const output = this.buildExportTarget(
            anchorUri
                ?? vscode.workspace.workspaceFolders?.[0]?.uri
                ?? vscode.Uri.file(process.cwd()),
            'datawindow/workspace-datawindow-catalog.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateDataWindowChildGraphExport(
        anchorUri?: vscode.Uri,
    ): Promise<GenerateDataWindowChildGraphExportResult> {
        const preferredProject = anchorUri
            ? await this.resolvePreferredProjectForDocument(anchorUri)
            : undefined;
        const entries = await this.collectWorkspaceDataWindowCatalogEntries(preferredProject);
        const nodes: DataWindowChildGraphExportPayload['nodes'] = entries
            .map(entry => ({
                objectName: this.getDataWindowObjectName(entry.parseResult, entry.candidate.uri),
                uri: entry.candidate.uri.toString(),
                relativePath: this.toRelativeWorkspacePath(entry.candidate.uri),
                projectBindings: entry.projectBindings,
            }))
            .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
        const edges: DataWindowChildGraphExportPayload['edges'] = [];

        for (const entry of entries) {
            const childLinks = await resolveVerifiedDataWindowChildLinks(
                entry.candidate.uri,
                entry.candidate,
                this.dataWindowParser,
                this.snapshotStore,
            );

            for (const childLink of childLinks) {
                edges.push({
                    parentObjectName: this.getDataWindowObjectName(entry.parseResult, entry.candidate.uri),
                    parentUri: entry.candidate.uri.toString(),
                    parentRelativePath: this.toRelativeWorkspacePath(entry.candidate.uri),
                    childName: childLink.childName,
                    kind: childLink.kind,
                    dataObjectName: childLink.dataObjectName,
                    childObjectName: this.getDataWindowObjectName(
                        childLink.childCandidate.parseResult,
                        childLink.childCandidate.uri,
                    ),
                    childUri: childLink.childCandidate.uri.toString(),
                    childRelativePath: this.toRelativeWorkspacePath(childLink.childCandidate.uri),
                });
            }
        }

        edges.sort((left, right) => left.parentRelativePath.localeCompare(right.parentRelativePath)
            || left.childName.localeCompare(right.childName));

        const payload: DataWindowChildGraphExportPayload = {
            kind: 'powerbuilder-datawindow-child-graph',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            summary: {
                projectCount: new Set(nodes.flatMap(node => node.projectBindings.map(binding => binding.project.uri))).size,
                parentCount: nodes.length,
                edgeCount: edges.length,
            },
            nodes,
            edges,
        };
        const output = this.buildExportTarget(
            anchorUri
                ?? vscode.workspace.workspaceFolders?.[0]?.uri
                ?? vscode.Uri.file(process.cwd()),
            'datawindow/datawindow-child-graph.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateAutomationSurfaceManifestExport(
        anchorUri?: vscode.Uri,
    ): Promise<GenerateAutomationSurfaceManifestExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const payload: AutomationSurfaceManifestExportPayload = {
            kind: 'powerbuilder-automation-surface',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            extensionApi: {
                extensionId: POWERBUILDER_EXTENSION_ID,
                apiVersion: POWERBUILDER_EXTENSION_API_VERSION,
                exportedFrom: 'activate',
                methods: POWERBUILDER_EXTENSION_API_METHODS.map(method => ({
                    name: method.name,
                    command: method.command,
                    payloadKind: method.payloadKind,
                    acceptsArguments: method.acceptsArguments,
                })),
            },
            languageModelTools: getPowerBuilderLanguageModelToolDescriptors().map(tool => ({
                name: tool.name,
                description: tool.description,
                tags: [...tool.tags],
                inputSchema: tool.inputSchema,
                backedBy: {
                    command: tool.command,
                    payloadKind: tool.payloadKind,
                    acceptsArguments: tool.acceptsArguments,
                },
            })),
            commands: [
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.runSemanticQuery,
                    title: 'PowerBuilder: Ejecutar query semántica puntual',
                    mode: 'returns-structured-result',
                    payloadKind: 'powerbuilder-semantic-query',
                    acceptsArguments: true,
                    arguments: [
                        { name: 'uri', type: 'string', required: false, description: 'URI del documento; si no se indica, usa el editor activo.' },
                        { name: 'line', type: 'number', required: false, description: 'Línea 0-based de la posición a consultar.' },
                        { name: 'character', type: 'number', required: false, description: 'Columna 0-based de la posición a consultar.' },
                    ],
                    notes: [
                        'Devuelve la misma query estructurada de exportSemanticQuery sin escribir archivo.',
                        'Publica precision, evidence, references plan y rename plan cuando la surface es auditable.',
                    ],
                },
                {
                    command: 'powerbuilder.runOverloadResolutionExplanation',
                    title: 'PowerBuilder: Ejecutar explicación estructurada de overloads',
                    mode: 'returns-structured-result',
                    payloadKind: 'powerbuilder-overload-resolution-explanation',
                    acceptsArguments: true,
                    arguments: [
                        { name: 'uri', type: 'string', required: false, description: 'URI del documento; si no se indica, usa el editor activo.' },
                        { name: 'line', type: 'number', required: false, description: 'Línea 0-based de la llamada a inspeccionar.' },
                        { name: 'character', type: 'number', required: false, description: 'Columna 0-based de la llamada a inspeccionar.' },
                    ],
                    notes: [
                        'Reutiliza resolveSignatureAtPosition y publica la explicación auditable de aridad, owner y precision sin renderizar UI.',
                        'Devuelve candidatos, candidato seleccionado, system entry y flags de ayuda de firma cuando el contexto de llamada es demostrable.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.runSemanticNavigate,
                    title: 'PowerBuilder: Ejecutar navegación semántica puntual',
                    mode: 'returns-structured-result',
                    acceptsArguments: true,
                    arguments: [
                        { name: 'uri', type: 'string', required: false, description: 'URI del documento; si no se indica, usa el editor activo.' },
                        { name: 'line', type: 'number', required: false, description: 'Línea 0-based de la posición a inspeccionar.' },
                        { name: 'character', type: 'number', required: false, description: 'Columna 0-based de la posición a inspeccionar.' },
                        { name: 'filters', type: 'string[]', required: false, description: 'Lista de filtros entre project, owner, hierarchy y target.' },
                    ],
                    notes: [
                        'Devuelve en memoria la lista filtrada y ordenada de semanticNavigate sin QuickPick.',
                        'Publica filtros disponibles, filtros aplicados y símbolos serializados listos para automatización.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.runSemanticQueryBatch,
                    title: 'PowerBuilder: Ejecutar query semántica batch',
                    mode: 'returns-structured-result',
                    payloadKind: 'powerbuilder-semantic-query-batch',
                    acceptsArguments: true,
                    arguments: [
                        { name: 'requests', type: 'SemanticQueryTarget[]', required: true, description: 'Lista de objetos con uri, line, character y label opcional.' },
                        { name: 'stopOnError', type: 'boolean', required: false, description: 'Si es true, corta el batch en el primer item no generado.' },
                    ],
                    notes: [
                        'Reutiliza runSemanticQuery item por item sin abrir un segundo runtime.',
                        'Devuelve un payload batch con requests, resultados generados y degradaciones por item.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.runActiveHierarchyInspection,
                    title: 'PowerBuilder: Ejecutar inspección estructurada de jerarquía activa',
                    mode: 'returns-structured-result',
                    payloadKind: 'powerbuilder-active-hierarchy-inspection',
                    acceptsArguments: true,
                    arguments: [
                        { name: 'uri', type: 'string', required: false, description: 'URI del documento; si no se indica, usa el editor activo.' },
                        { name: 'line', type: 'number', required: false, description: 'Línea 0-based de la posición a inspeccionar.' },
                        { name: 'character', type: 'number', required: false, description: 'Columna 0-based de la posición a inspeccionar.' },
                    ],
                    notes: [
                        'Reutiliza el mismo owner semántico que explainActiveHierarchy pero sin renderizar Markdown.',
                        'Publica proyecto preferido, roots efectivos, símbolo primario y degradaciones honestas en JSON versionable.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.runAncestorScriptInspection,
                    title: 'PowerBuilder: Ejecutar inspección estructurada de script ancestro',
                    mode: 'returns-structured-result',
                    payloadKind: 'powerbuilder-ancestor-script-inspection',
                    acceptsArguments: true,
                    arguments: [
                        { name: 'uri', type: 'string', required: false, description: 'URI del documento; si no se indica, usa el editor activo.' },
                        { name: 'line', type: 'number', required: false, description: 'Línea 0-based de la posición a inspeccionar.' },
                        { name: 'character', type: 'number', required: false, description: 'Columna 0-based de la posición a inspeccionar.' },
                    ],
                    notes: [
                        'Reutiliza el cálculo de findAncestorScript sin abrir documentos Markdown ni exigir navegación interactiva.',
                        'Publica callable actual, cadena heredada inspeccionada y razón de bloqueo cuando no existe script ancestro publicable.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.runBuildSessionManifest,
                    title: 'PowerBuilder: Ejecutar manifest estructurado de build',
                    mode: 'returns-structured-result',
                    payloadKind: 'powerbuilder-build-session-manifest',
                    acceptsArguments: false,
                    notes: [
                        'Publica el último target reutilizable y el último resultado de build disponible en la sesión.',
                        'Puede degradar solo a target persistido cuando no existe todavía un build report vivo en memoria.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.runWorkspaceBuildPreference,
                    title: 'PowerBuilder: Ejecutar preferencia estructurada de build/workspace',
                    mode: 'returns-structured-result',
                    payloadKind: 'powerbuilder-workspace-build-preference',
                    acceptsArguments: true,
                    arguments: [
                        { name: 'uri', type: 'string', required: false, description: 'URI del ancla que se quiere resolver como proyecto/target preferido.' },
                    ],
                    notes: [
                        'Si no se pasa uri, usa el editor activo o la primera carpeta del workspace como ancla contextual.',
                        'Reutiliza la misma preferencia de proyecto y build target ya publicada por el workspace manifest.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceBuildPreference,
                    title: 'PowerBuilder: Exportar preferencia build/workspace JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-workspace-build-preference',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/workspace/workspace-build-preference.json',
                    acceptsArguments: true,
                    arguments: [
                        { name: 'uri', type: 'string', required: false, description: 'URI del ancla que se quiere resolver como proyecto/target preferido.' },
                    ],
                    notes: [
                        'Serializa la misma preferencia estructurada publicada por runWorkspaceBuildPreference en un artefacto versionable.',
                        'No abre una heurística paralela: reutiliza el mismo cálculo del workspace manifest y su surface estructurada.',
                    ],
                },
                {
                    command: 'powerbuilder.exportSemanticDocument',
                    title: 'PowerBuilder: Exportar documento semántico JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-semantic-document',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/documents/<project-or-_workspace>/<object>.semantic-document.json',
                    acceptsArguments: false,
                    notes: [
                        'Requiere documento PowerBuilder ide-safe activo.',
                    ],
                },
                {
                    command: 'powerbuilder.exportSemanticProject',
                    title: 'PowerBuilder: Exportar proyecto semántico JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-semantic-project',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/projects/<project>.semantic-project.json',
                    acceptsArguments: false,
                    notes: [
                        'Requiere documento PowerBuilder ide-safe activo para resolver el proyecto preferido.',
                    ],
                },
                {
                    command: 'powerbuilder.exportSemanticQuery',
                    title: 'PowerBuilder: Exportar query semántica JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-semantic-query',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/queries/<project-or-_workspace>/<object>.<word>.semantic-query.json',
                    acceptsArguments: false,
                    notes: [
                        'Requiere documento PowerBuilder ide-safe activo y símbolo resoluble bajo cursor.',
                    ],
                },
                {
                    command: 'powerbuilder.exportOverloadResolutionExplanation',
                    title: 'PowerBuilder: Exportar explicación estructurada de overloads JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-overload-resolution-explanation',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/queries/<project-or-_workspace>/<object>.<call>.overload-resolution-explanation.json',
                    acceptsArguments: false,
                    notes: [
                        'Requiere documento PowerBuilder ide-safe activo y una llamada resoluble bajo cursor.',
                        'Serializa precision, reasons, evidence, candidato seleccionado y candidatos compatibles del mismo cálculo semántico de firmas.',
                    ],
                },
                {
                    command: 'powerbuilder.exportRuntimeCatalog',
                    title: 'PowerBuilder: Exportar catálogo runtime JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-runtime-catalog',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/runtime/system-symbol-catalog.json',
                    acceptsArguments: false,
                    notes: [
                        'No requiere editor activo; reutiliza el workspace actual como ancla de escritura.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceManifest,
                    title: 'PowerBuilder: Exportar manifest del workspace JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-workspace-manifest',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/workspace/workspace-manifest.json',
                    acceptsArguments: false,
                    notes: [
                        'No requiere editor PowerBuilder activo; si existe, usa el documento activo como ancla contextual.',
                    ],
                },
                {
                    command: 'powerbuilder.exportVisibilityAudit',
                    title: 'PowerBuilder: Exportar auditoría de visibilidad JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-visibility-audit',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/workspace/visibility-audit.json',
                    acceptsArguments: false,
                    notes: [
                        'Reindexa el workspace ide-safe y audita miembros public/protected con consumo demostrable por occurrences reales.',
                        'Sugiere degradación a protected o private cuando el consumo queda confinado al mismo tipo o a su jerarquía declarada.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceArtifactBundle,
                    title: 'PowerBuilder: Exportar bundle de artefactos del workspace JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-workspace-artifact-bundle',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/workspace/workspace-artifact-bundle.json',
                    acceptsArguments: false,
                    notes: [
                        'Empaqueta manifest, diagnostics, support snapshot, catálogo público y release report si existe.',
                        'Construye sobre exportes ya publicados en lugar de recomputar otro runtime workspace-wide.',
                    ],
                },
                {
                    command: 'powerbuilder.exportInheritanceOwnerGraph',
                    title: 'PowerBuilder: Exportar grafo de herencia y owners JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-inheritance-owner-graph',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/graphs/<project>.inheritance-owner-graph.json',
                    acceptsArguments: false,
                    notes: [
                        'Requiere documento PowerBuilder ide-safe activo.',
                    ],
                },
                {
                    command: 'powerbuilder.exportScriptDependencyGraph',
                    title: 'PowerBuilder: Exportar grafo de dependencias de script JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-script-dependency-graph',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/graphs/<project>.script-dependency-graph.json',
                    acceptsArguments: false,
                    notes: [
                        'Requiere documento PowerBuilder ide-safe activo.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceDiagnosticsTree,
                    title: 'PowerBuilder: Exportar árbol workspace-wide de diagnostics JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-workspace-diagnostics-tree',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/diagnostics/workspace-diagnostics-tree.json',
                    acceptsArguments: false,
                    notes: [
                        'No requiere editor activo; reutiliza el mismo agrupado proyecto/objeto/diagnóstico ya visible en el panel.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.exportFeatureSupportSnapshot,
                    title: 'PowerBuilder: Exportar snapshot del soporte real JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-feature-support-snapshot',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/support/feature-support-snapshot.json',
                    acceptsArguments: false,
                    notes: [
                        'No requiere editor activo; serializa la matriz canónica de soporte real sin abrir una segunda fuente de verdad.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.exportPublicContractSchemas,
                    title: 'PowerBuilder: Exportar schemas públicos JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-public-contract-schemas',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/contracts/public-contract-schemas.json',
                    acceptsArguments: false,
                    notes: [
                        'Escribe un índice versionado y los schemas JSON públicos por payload bajo contracts/schemas/.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.exportPublicContractCatalog,
                    title: 'PowerBuilder: Exportar catálogo público de contratos JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-public-contract-catalog',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/contracts/public-contract-catalog.json',
                    acceptsArguments: false,
                    notes: [
                        'Relaciona comandos, métodos API y schemas publicados sin depender de imports internos.',
                    ],
                },
                {
                    command: 'powerbuilder.exportBuildContractCatalog',
                    title: 'PowerBuilder: Exportar catálogo contractual del loop de build JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-build-contract-catalog',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/contracts/build-contract-catalog.json',
                    acceptsArguments: false,
                    notes: [
                        'Agrupa comandos, métodos API, tools y schemas visibles del loop de build sobre la surface pública estable.',
                        'No recompone un runtime paralelo: filtra automationSurface y publicContractSchemas ya publicados.',
                    ],
                },
                {
                    command: 'powerbuilder.exportHostContributionInventory',
                    title: 'PowerBuilder: Exportar inventario host-aware de contributions JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-host-contribution-inventory',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/automation/host-contribution-inventory.json',
                    acceptsArguments: false,
                    notes: [
                        'Cruza package.json, commands registrados, extensión exportada y LM tools reflejadas por el host.',
                        'La ausencia de reflexión host para tools no implica por sí sola una rotura contractual.',
                    ],
                },
                {
                    command: 'powerbuilder.exportAutomationCoverageAudit',
                    title: 'PowerBuilder: Exportar auditoría de cobertura automation JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-automation-coverage-audit',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/automation/automation-coverage-audit.json',
                    acceptsArguments: false,
                    notes: [
                        'Detecta drift entre package.json, automationSurface, publicContractCatalog, API exportada y tools reflejadas.',
                    ],
                },
                {
                    command: 'powerbuilder.exportAutomationReplay',
                    title: 'PowerBuilder: Exportar replay estructurado de automation JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-automation-replay',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/automation/replays/<name>.automation-replay.json',
                    acceptsArguments: true,
                    arguments: [
                        { name: 'steps', type: 'AutomationReplayStep[]', required: true, description: 'Lista ordenada de steps con kind, id, label opcional y args opcional.' },
                        { name: 'stopOnError', type: 'boolean', required: false, description: 'Si es true, detiene el replay cuando un step falla o no se puede resolver.' },
                        { name: 'name', type: 'string', required: false, description: 'Nombre estable del artefacto a escribir bajo automation/replays/.' },
                    ],
                    notes: [
                        'Resuelve commands públicos y languageModelTools contra la misma automation surface publicada por la extensión.',
                        'Captura resultados estructurados y artefactos generados sin abrir un segundo runtime semántico.',
                    ],
                },
                {
                    command: 'powerbuilder.exportPublicContractCatalogDiff',
                    title: 'PowerBuilder: Exportar diff de contratos públicos JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-public-contract-catalog-diff',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/diffs/<left>.vs.<right>.public-contract-catalog-diff.json',
                    acceptsArguments: true,
                    arguments: [
                        { name: 'leftUri', type: 'string', required: true, description: 'URI del catálogo o bundle base.' },
                        { name: 'rightUri', type: 'string', required: true, description: 'URI del catálogo o bundle objetivo.' },
                    ],
                    notes: [
                        'Acepta powerbuilder-public-contract-catalog o powerbuilder-workspace-artifact-bundle ya exportados.',
                        'Compara commands, métodos API, tools y schemas publicados sin depender de imports internos.',
                    ],
                },
                {
                    command: 'powerbuilder.exportWorkspaceArtifactBundleDiff',
                    title: 'PowerBuilder: Exportar diff de bundles workspace-wide JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-workspace-artifact-bundle-diff',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/diffs/<left>.vs.<right>.workspace-artifact-bundle-diff.json',
                    acceptsArguments: true,
                    arguments: [
                        { name: 'leftUri', type: 'string', required: true, description: 'URI del bundle base.' },
                        { name: 'rightUri', type: 'string', required: true, description: 'URI del bundle objetivo.' },
                    ],
                    notes: [
                        'Resume cambios en manifest, automation surface, diagnostics, soporte, build session, contratos públicos y release report.',
                    ],
                },
                {
                    command: 'powerbuilder.exportCacheInvalidationSnapshot',
                    title: 'PowerBuilder: Exportar snapshot de cache e invalidación JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-cache-invalidation-snapshot',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/workspace/cache-invalidation-snapshot.json',
                    acceptsArguments: false,
                    notes: [
                        'Expone snapshotStore, artifactPayloadCache y la auditoría de indexado vigente sin ampliar el runtime de la extensión.',
                        'Modela la superficie de invalidación con roots retenidas, build targets y caches limpiables.',
                    ],
                },
                {
                    command: 'powerbuilder.exportDataWindowManifest',
                    title: 'PowerBuilder: Exportar manifest DataWindow JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-datawindow-manifest',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/datawindow/<object>.datawindow-manifest.json',
                    acceptsArguments: false,
                    notes: [
                        'Requiere un editor .srd activo.',
                        'Serializa solo metadata local segura de DataWindow: bandas, columnas, retrieve y referencias simples de SELECT enlazables localmente.',
                    ],
                },
                {
                    command: 'powerbuilder.exportDataWindowWorkspaceCatalog',
                    title: 'PowerBuilder: Exportar catálogo workspace-wide de DataWindow JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-datawindow-workspace-catalog',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/datawindow/workspace-datawindow-catalog.json',
                    acceptsArguments: false,
                    notes: [
                        'Barre `.srd` ide-safe del proyecto ancla o del workspace y publica metadata básica, retrieve simple y verificabilidad por proyecto.',
                        'No reabre un runtime paralelo: reutiliza el parser DataWindow y los bindings por proyecto ya conocidos.',
                    ],
                },
                {
                    command: 'powerbuilder.exportDataWindowChildGraph',
                    title: 'PowerBuilder: Exportar grafo verificado parent-child DataWindow JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-datawindow-child-graph',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/datawindow/datawindow-child-graph.json',
                    acceptsArguments: false,
                    notes: [
                        'Resuelve relaciones seguras dropdown/report entre DataWindows del proyecto ancla o del workspace.',
                        'Selecciona el target preferido por proyecto con el mismo helper verificado usado por las features IDE de child links.',
                    ],
                },
                {
                    command: 'powerbuilder.exportSemanticSnapshotDiff',
                    title: 'PowerBuilder: Exportar diff semántico entre snapshots JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-semantic-snapshot-diff',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/diffs/<left>.vs.<right>.semantic-snapshot-diff.json',
                    acceptsArguments: true,
                    arguments: [
                        { name: 'leftUri', type: 'string', required: true, description: 'URI del snapshot semantic-project base.' },
                        { name: 'rightUri', type: 'string', required: true, description: 'URI del snapshot semantic-project objetivo.' },
                    ],
                    notes: [
                        'El corte v1 compara dos snapshots powerbuilder-semantic-project ya exportados y publica added/removed/changed por archivo, símbolo y callable.',
                    ],
                },
                {
                    command: 'powerbuilder.exportWorkspaceManifestDiff',
                    title: 'PowerBuilder: Exportar diff de manifests del workspace JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-workspace-manifest-diff',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/diffs/<left>.vs.<right>.workspace-manifest-diff.json',
                    acceptsArguments: true,
                    arguments: [
                        { name: 'leftUri', type: 'string', required: true, description: 'URI del manifest o bundle base.' },
                        { name: 'rightUri', type: 'string', required: true, description: 'URI del manifest o bundle objetivo.' },
                    ],
                    notes: [
                        'Acepta powerbuilder-workspace-manifest o powerbuilder-workspace-artifact-bundle ya exportados.',
                        'El diff v1 explica cambios en roots retenidas, targets buildables, preferencia de build, auditoría de indexado/cache e invalidación derivada.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.exportLastBuildReport,
                    title: 'PowerBuilder: Exportar último build report JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-build-report',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/build/<project>.last-build-report.json',
                    acceptsArguments: false,
                    notes: [
                        'Requiere una build previa en la sesión actual.',
                    ],
                },
                {
                    command: POWERBUILDER_EXTENSION_API_COMMANDS.exportBuildSessionManifest,
                    title: 'PowerBuilder: Exportar manifest de sesión de build JSON',
                    mode: 'writes-json-file',
                    payloadKind: 'powerbuilder-build-session-manifest',
                    outputRelativePath: 'docs/generated/powerbuilder/exports/build/build-session-manifest.json',
                    acceptsArguments: false,
                    notes: [
                        'Serializa el último target de build reutilizable aunque haya sido restaurado desde workspaceState.',
                        'Publica además el último build vivo cuando existe en memoria de la sesión actual.',
                    ],
                },
            ],
        };
        const output = this.buildExportTarget(
            workspaceUri,
            'automation/automation-surface.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateAutomationReplayExport(
        steps: AutomationReplayStepRequest[],
        options: {
            stopOnError?: boolean;
            name?: string;
        } = {},
        anchorUri?: vscode.Uri,
    ): Promise<GenerateAutomationReplayExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const automationSurface = await this.generateAutomationSurfaceManifestExport(anchorUri ?? workspaceUri);
        const commandById = new Map(
            automationSurface.payload.commands.map(command => [normalizeIdentifier(command.command), command]),
        );
        const toolById = new Map(
            automationSurface.payload.languageModelTools.map(tool => [normalizeIdentifier(tool.name), tool]),
        );
        const stepResults: AutomationReplayExportPayload['steps'] = [];
        let completedCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        let generatedFileCount = 0;
        let structuredResultCount = 0;
        let stoppedEarly = false;

        for (const step of steps) {
            if (stoppedEarly) {
                skippedCount += 1;
                stepResults.push({
                    label: step.label,
                    stepKind: step.kind,
                    requestedId: step.id,
                    resolutionSource: 'unresolved',
                    status: 'skipped',
                    outputKind: 'no-result',
                    error: 'Replay detenido por stopOnError tras un fallo previo.',
                });
                continue;
            }

            let resolvedCommand: string | undefined;
            let payloadKind: string | undefined;
            let mode: 'returns-structured-result' | 'writes-json-file' | undefined;
            let resolutionSource: 'command' | 'language-model-tool-backed-command' | 'unresolved' = 'unresolved';

            if (step.kind === 'language-model-tool') {
                const toolDescriptor = toolById.get(normalizeIdentifier(step.id));

                if (toolDescriptor) {
                    resolvedCommand = toolDescriptor.backedBy.command;
                    payloadKind = toolDescriptor.backedBy.payloadKind;
                    resolutionSource = 'language-model-tool-backed-command';

                    const backedCommandDescriptor = commandById.get(normalizeIdentifier(toolDescriptor.backedBy.command));
                    mode = backedCommandDescriptor?.mode ?? 'returns-structured-result';
                    payloadKind = backedCommandDescriptor?.payloadKind ?? payloadKind;
                }
            } else {
                const commandDescriptor = commandById.get(normalizeIdentifier(step.id));

                if (commandDescriptor) {
                    resolvedCommand = commandDescriptor.command;
                    payloadKind = commandDescriptor.payloadKind;
                    mode = commandDescriptor.mode;
                    resolutionSource = 'command';
                }
            }

            if (!resolvedCommand || !mode) {
                failedCount += 1;
                stepResults.push({
                    label: step.label,
                    stepKind: step.kind,
                    requestedId: step.id,
                    resolutionSource,
                    status: 'invalid-target',
                    outputKind: 'invalid-target',
                    error: `No se pudo resolver el step ${step.id} sobre la automation surface publicada.`,
                });

                if (options.stopOnError) {
                    stoppedEarly = true;
                }

                continue;
            }

            try {
                const rawResult = step.args === undefined
                    ? await vscode.commands.executeCommand(resolvedCommand)
                    : await vscode.commands.executeCommand(resolvedCommand, step.args);
                const describedResult = this.describeAutomationReplayResult(rawResult);

                if (describedResult.outputKind === 'generated-file') {
                    generatedFileCount += 1;
                }

                if (describedResult.outputKind === 'structured-result') {
                    structuredResultCount += 1;
                }

                completedCount += 1;
                stepResults.push({
                    label: step.label,
                    stepKind: step.kind,
                    requestedId: step.id,
                    resolvedCommand,
                    resolutionSource,
                    mode,
                    payloadKind,
                    status: 'completed',
                    outputKind: describedResult.outputKind,
                    outputRelativePath: describedResult.outputRelativePath,
                    result: describedResult.result,
                });
            } catch (error) {
                failedCount += 1;
                stepResults.push({
                    label: step.label,
                    stepKind: step.kind,
                    requestedId: step.id,
                    resolvedCommand,
                    resolutionSource,
                    mode,
                    payloadKind,
                    status: 'failed',
                    outputKind: 'no-result',
                    error: this.describeAutomationReplayError(error),
                });

                if (options.stopOnError) {
                    stoppedEarly = true;
                }
            }
        }

        const payload: AutomationReplayExportPayload = {
            kind: 'powerbuilder-automation-replay',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            summary: {
                stepCount: steps.length,
                commandStepCount: steps.filter(step => step.kind === 'command').length,
                languageModelToolStepCount: steps.filter(step => step.kind === 'language-model-tool').length,
                completedCount,
                failedCount,
                skippedCount,
                generatedFileCount,
                structuredResultCount,
                stoppedEarly,
            },
            manifest: {
                automationSurfaceRelativePath: automationSurface.file.relativePath,
                automationSurfaceGeneratedAt: automationSurface.payload.generatedAt,
            },
            steps: stepResults,
        };
        const output = this.buildExportTarget(
            workspaceUri,
            `automation/replays/${sanitizeSegment(options.name ?? 'automation-replay')}.automation-replay.json`,
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generatePublicContractSchemasExport(
        anchorUri?: vscode.Uri,
    ): Promise<GeneratePublicContractSchemasExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const descriptors: PublicContractSchemaDescriptor[] = getPublicContractSchemaDescriptors();
        const schemaFiles: PowerBuilderGeneratedJsonFile[] = [];

        for (const descriptor of descriptors) {
            const schemaFile = this.buildExportTarget(workspaceUri, descriptor.relativePath);

            await this.writeJsonFile(schemaFile.uri, descriptor.schema);
            schemaFiles.push(schemaFile);
        }

        const payload: PublicContractSchemasExportPayload = {
            kind: 'powerbuilder-public-contract-schemas',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            summary: {
                schemaCount: descriptors.length,
            },
            schemas: descriptors.map(descriptor => ({
                payloadKind: descriptor.payloadKind,
                title: descriptor.schema.title ?? descriptor.payloadKind,
                relativePath: descriptor.relativePath,
                schemaId: descriptor.schema.$id ?? descriptor.relativePath,
            })),
        };
        const output = this.buildExportTarget(
            workspaceUri,
            'contracts/public-contract-schemas.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
            schemaFiles,
        };
    }

    async generatePublicContractCatalogExport(
        anchorUri?: vscode.Uri,
    ): Promise<GeneratePublicContractCatalogExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const automationSurface = await this.generateAutomationSurfaceManifestExport(anchorUri);
        const schemaIndex = await this.generatePublicContractSchemasExport(anchorUri);
        const schemaByPayloadKind = new Map(
            schemaIndex.payload.schemas.map(schema => [schema.payloadKind, schema.relativePath]),
        );
        const payload: PublicContractCatalogExportPayload = {
            kind: 'powerbuilder-public-contract-catalog',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            extensionApi: automationSurface.payload.extensionApi,
            languageModelTools: automationSurface.payload.languageModelTools,
            commands: automationSurface.payload.commands.map(command => ({
                ...command,
                schemaRelativePath: command.payloadKind
                    ? schemaByPayloadKind.get(command.payloadKind)
                    : undefined,
                schemaPublished: command.payloadKind
                    ? schemaByPayloadKind.has(command.payloadKind)
                    : false,
            })),
            schemas: schemaIndex.payload.schemas,
        };
        const output = this.buildExportTarget(
            workspaceUri,
            'contracts/public-contract-catalog.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateBuildContractCatalogExport(
        anchorUri?: vscode.Uri,
    ): Promise<GenerateBuildContractCatalogExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const automationSurface = await this.generateAutomationSurfaceManifestExport(anchorUri);
        const schemaIndex = await this.generatePublicContractSchemasExport(anchorUri);
        const buildCommands = new Set<string>([
            'powerbuilder.buildCurrentProject',
            'powerbuilder.clearBuildProblems',
            'powerbuilder.rebuildLastProject',
            'powerbuilder.showLastBuildOutput',
            POWERBUILDER_EXTENSION_API_COMMANDS.runBuildSessionManifest,
            POWERBUILDER_EXTENSION_API_COMMANDS.runWorkspaceBuildPreference,
            POWERBUILDER_EXTENSION_API_COMMANDS.exportWorkspaceBuildPreference,
            POWERBUILDER_EXTENSION_API_COMMANDS.exportLastBuildReport,
            POWERBUILDER_EXTENSION_API_COMMANDS.exportBuildSessionManifest,
            'powerbuilder.exportWorkspaceManifestDiff',
            'powerbuilder.exportBuildContractCatalog',
        ]);
        const buildPayloadKinds = new Set<string>([
            'powerbuilder-build-report',
            'powerbuilder-build-session-manifest',
            'powerbuilder-workspace-build-preference',
            'powerbuilder-workspace-manifest-diff',
            'powerbuilder-workspace-manifest',
            'powerbuilder-build-contract-catalog',
        ]);
        const schemaByPayloadKind = new Map(
            schemaIndex.payload.schemas.map(schema => [schema.payloadKind, schema.relativePath]),
        );
        const commands = automationSurface.payload.commands
            .filter(command => buildCommands.has(command.command))
            .map(command => ({
                ...command,
                schemaRelativePath: command.payloadKind
                    ? schemaByPayloadKind.get(command.payloadKind)
                    : undefined,
                schemaPublished: command.payloadKind
                    ? schemaByPayloadKind.has(command.payloadKind)
                    : false,
            }));
        const methods = automationSurface.payload.extensionApi.methods
            .filter(method => buildCommands.has(method.command));
        const languageModelTools = automationSurface.payload.languageModelTools
            .filter(tool => buildCommands.has(tool.backedBy.command) || tool.name.includes('build'));
        const schemas = schemaIndex.payload.schemas
            .filter(schema => buildPayloadKinds.has(schema.payloadKind));
        const payload: BuildContractCatalogExportPayload = {
            kind: 'powerbuilder-build-contract-catalog',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            summary: {
                commandCount: commands.length,
                apiMethodCount: methods.length,
                schemaCount: schemas.length,
                languageModelToolCount: languageModelTools.length,
            },
            extensionApi: {
                extensionId: automationSurface.payload.extensionApi.extensionId,
                apiVersion: automationSurface.payload.extensionApi.apiVersion,
                methods,
            },
            commands,
            languageModelTools,
            schemas,
            sessionContracts: {
                lastTargetFields: ['uri', 'relativePath', 'name', 'kind', 'storedAt', 'source'],
                lastBuildFields: ['project', 'executablePath', 'args', 'exitCode', 'summary', 'issueCount', 'capturedAt'],
                persistedTargetSourceValues: ['session', 'workspace-state'],
            },
        };
        const output = this.buildExportTarget(
            workspaceUri,
            'contracts/build-contract-catalog.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateHostContributionInventoryExport(
        anchorUri?: vscode.Uri,
    ): Promise<GenerateHostContributionInventoryExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const payload = await this.buildHostContributionInventoryPayload(anchorUri);
        const output = this.buildExportTarget(
            workspaceUri,
            'automation/host-contribution-inventory.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateAutomationCoverageAuditExport(
        anchorUri?: vscode.Uri,
    ): Promise<GenerateAutomationCoverageAuditExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const automationSurface = await this.generateAutomationSurfaceManifestExport(anchorUri);
        const publicContractCatalog = await this.generatePublicContractCatalogExport(anchorUri);
        const hostInventory = await this.buildHostContributionInventoryPayload(anchorUri);
        const packageContributions = this.getExtensionPackageContributions();
        const packageCommandSet = new Set(packageContributions.commands.map(command => command.command));
        const automationCommandSet = new Set(automationSurface.payload.commands.map(command => command.command));
        const packageRunExportCommands = packageContributions.commands
            .map(command => command.command)
            .filter(command => command.startsWith('powerbuilder.run') || command.startsWith('powerbuilder.export'));
        const packageCommandsMissingFromAutomationSurface = packageRunExportCommands
            .filter(command => !automationCommandSet.has(command));
        const automationCommandsMissingFromPackageJson = [...automationCommandSet]
            .filter(command => !packageCommandSet.has(command));
        const publicCatalogCommandsMissingSchema = publicContractCatalog.payload.commands
            .filter(command => !command.schemaPublished)
            .map(command => command.command);
        const extensionApiMethodsMissingRegisteredCommand = hostInventory.extensionApiMethods
            .filter(method => !method.registered)
            .map(method => method.command);
        const registeredHostCommands = new Set(
            hostInventory.commands
                .filter(command => command.registered)
                .map(command => command.command),
        );
        const languageModelToolsMissingBackedCommand = hostInventory.languageModelTools
            .filter(tool => !tool.backedByCommand || !registeredHostCommands.has(tool.backedByCommand))
            .map(tool => tool.name);
        const languageModelToolsMissingHostReflection = hostInventory.host.reflectedLanguageModelToolsAvailable
            ? hostInventory.languageModelTools
                .filter(tool => !tool.hostReflected)
                .map(tool => tool.name)
            : [];
        const notes: string[] = [
            'La comparación package.json -> automationSurface se limita a comandos run/export porque el manifest estructurado no modela acciones puramente UI.',
        ];

        if (!hostInventory.host.reflectedLanguageModelToolsAvailable) {
            notes.push('El host actual no expone vscode.lm.tools como lista enumerable; la cobertura host-aware de tools queda informativa.');
        }

        const payload: AutomationCoverageAuditExportPayload = {
            kind: 'powerbuilder-automation-coverage-audit',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            summary: {
                packageCommandsMissingFromAutomationSurface: packageCommandsMissingFromAutomationSurface.length,
                automationCommandsMissingFromPackageJson: automationCommandsMissingFromPackageJson.length,
                publicCatalogCommandsMissingSchema: publicCatalogCommandsMissingSchema.length,
                extensionApiMethodsMissingRegisteredCommand: extensionApiMethodsMissingRegisteredCommand.length,
                languageModelToolsMissingBackedCommand: languageModelToolsMissingBackedCommand.length,
                languageModelToolsMissingHostReflection: languageModelToolsMissingHostReflection.length,
            },
            coverage: {
                packageCommandsMissingFromAutomationSurface,
                automationCommandsMissingFromPackageJson,
                publicCatalogCommandsMissingSchema,
                extensionApiMethodsMissingRegisteredCommand,
                languageModelToolsMissingBackedCommand,
                languageModelToolsMissingHostReflection,
            },
            notes,
        };
        const output = this.buildExportTarget(
            workspaceUri,
            'automation/automation-coverage-audit.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateCacheInvalidationSnapshotExport(
        anchorUri?: vscode.Uri,
    ): Promise<GenerateCacheInvalidationSnapshotExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const workspaceManifest = await this.generateWorkspaceManifestExport(anchorUri);
        const snapshotEntries = this.snapshotStore.getCacheEntries().map(entry => ({
            uri: entry.uri.toString(),
            relativePath: this.toRelativeWorkspacePath(entry.uri),
            mtime: entry.mtime,
            size: entry.size,
            lineCount: entry.lineCount,
        }));
        const artifactPayloadEntries = [...this.artifactPayloadCache.entries()]
            .map(([cacheKey, entry]) => ({
                cacheKey,
                versionToken: entry.versionToken,
                payloadKind: this.tryGetPayloadKind(entry.payload),
            }))
            .sort((left, right) => left.cacheKey.localeCompare(right.cacheKey));
        const payload: CacheInvalidationSnapshotExportPayload = {
            kind: 'powerbuilder-cache-invalidation-snapshot',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            summary: {
                snapshotCacheEntryCount: snapshotEntries.length,
                artifactPayloadCacheEntryCount: artifactPayloadEntries.length,
                indexedFileCount: workspaceManifest.payload.workspace.indexingAudit.indexedFileCount,
                staleIndexedFileCount: workspaceManifest.payload.workspace.indexingAudit.staleIndexedFileCount,
                unassignedIndexedFileCount: workspaceManifest.payload.workspace.indexingAudit.unassignedIndexedFileCount,
                retainedEffectiveRootCount: workspaceManifest.payload.workspace.retainedEffectiveRootKeys.length,
                buildableTargetCount: workspaceManifest.payload.workspace.buildableTargetCount,
            },
            snapshotCache: {
                entries: snapshotEntries,
            },
            artifactPayloadCache: {
                entries: artifactPayloadEntries,
            },
            workspaceIndexingAudit: workspaceManifest.payload.workspace.indexingAudit,
            workspaceSurface: {
                retainedEffectiveRootKeys: [...workspaceManifest.payload.workspace.retainedEffectiveRootKeys],
                preferredProjectUri: workspaceManifest.payload.workspace.preferredProject?.uri,
                preferredBuildTargetUri: workspaceManifest.payload.workspace.preferredBuildTarget?.uri,
                buildableTargets: workspaceManifest.payload.workspace.buildableTargets.map(target => ({
                    uri: target.uri,
                    relativePath: target.relativePath,
                    name: target.name,
                    kind: target.kind,
                })),
            },
            invalidationSurface: {
                clearableCaches: [
                    {
                        name: 'snapshot-store',
                        entryCount: snapshotEntries.length,
                    },
                    {
                        name: 'artifact-payload-cache',
                        entryCount: artifactPayloadEntries.length,
                    },
                ],
                likelyImpactedArtifacts: [
                    'powerbuilder-workspace-manifest',
                    'powerbuilder-workspace-manifest-diff',
                    'powerbuilder-workspace-artifact-bundle',
                    'powerbuilder-cache-invalidation-snapshot',
                ],
                reasons: [
                    'retained-effective-roots',
                    'buildable-targets',
                    'workspace-indexing-audit',
                    snapshotEntries.length > 0 ? 'snapshot-store-entries' : 'no-snapshot-store-entries',
                    artifactPayloadEntries.length > 0 ? 'artifact-payload-cache-entries' : 'no-artifact-payload-cache-entries',
                ],
            },
        };
        const output = this.buildExportTarget(
            workspaceUri,
            'workspace/cache-invalidation-snapshot.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateWorkspaceArtifactBundleExport(
        anchorUri?: vscode.Uri,
        autoBuildService?: PowerBuilderAutoBuildService,
    ): Promise<GenerateWorkspaceArtifactBundleExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const workspaceManifest = await this.generateWorkspaceManifestExport(anchorUri);
        const automationSurface = await this.generateAutomationSurfaceManifestExport(anchorUri);
        const diagnosticsTree = await this.generateWorkspaceDiagnosticsTreeExport(anchorUri);
        const featureSupportSnapshot = await this.generateFeatureSupportSnapshotExport(anchorUri);
        const buildSessionManifest = await this.generateBuildSessionManifestExport(autoBuildService, anchorUri);
        const publicContractCatalog = await this.generatePublicContractCatalogExport(anchorUri);
        const releaseValidationReport = await this.readReleaseValidationReport(anchorUri);
        const artifacts: WorkspaceArtifactBundleExportPayload['artifacts'] = [
            this.serializeWorkspaceBundleArtifact('workspace-manifest', workspaceManifest.file.relativePath, workspaceManifest.payload.kind, workspaceManifest.payload.generatedAt, workspaceManifest.payload.schemaVersion),
            this.serializeWorkspaceBundleArtifact('automation-surface', automationSurface.file.relativePath, automationSurface.payload.kind, automationSurface.payload.generatedAt, automationSurface.payload.schemaVersion),
            this.serializeWorkspaceBundleArtifact('workspace-diagnostics-tree', diagnosticsTree.file.relativePath, diagnosticsTree.payload.kind, diagnosticsTree.payload.generatedAt, diagnosticsTree.payload.schemaVersion),
            this.serializeWorkspaceBundleArtifact('feature-support-snapshot', featureSupportSnapshot.file.relativePath, featureSupportSnapshot.payload.kind, featureSupportSnapshot.payload.generatedAt, featureSupportSnapshot.payload.schemaVersion),
            this.serializeWorkspaceBundleArtifact('build-session-manifest', buildSessionManifest.file.relativePath, buildSessionManifest.payload.kind, buildSessionManifest.payload.generatedAt, buildSessionManifest.payload.schemaVersion),
            this.serializeWorkspaceBundleArtifact('public-contract-catalog', publicContractCatalog.file.relativePath, publicContractCatalog.payload.kind, publicContractCatalog.payload.generatedAt, publicContractCatalog.payload.schemaVersion),
        ];

        if (releaseValidationReport.status === 'available' && releaseValidationReport.payload) {
            artifacts.push(this.serializeWorkspaceBundleArtifact(
                'release-validation-report',
                releaseValidationReport.relativePath,
                releaseValidationReport.payload.kind,
                releaseValidationReport.payload.generatedAt,
                releaseValidationReport.payload.schemaVersion,
            ));
        }

        const payload: WorkspaceArtifactBundleExportPayload = {
            kind: 'powerbuilder-workspace-artifact-bundle',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            summary: {
                artifactCount: artifacts.length,
                includesReleaseValidationReport: releaseValidationReport.status === 'available',
            },
            artifacts,
            bundle: {
                workspaceManifest: workspaceManifest.payload,
                automationSurface: automationSurface.payload,
                workspaceDiagnosticsTree: diagnosticsTree.payload,
                featureSupportSnapshot: featureSupportSnapshot.payload,
                buildSessionManifest: buildSessionManifest.payload,
                publicContractCatalog: publicContractCatalog.payload,
            },
            releaseValidationReport,
        };
        const output = this.buildExportTarget(
            workspaceUri,
            'workspace/workspace-artifact-bundle.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateWorkspaceDiagnosticsTreeExport(
        anchorUri?: vscode.Uri,
    ): Promise<GenerateWorkspaceDiagnosticsTreeExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const snapshot = buildPowerBuilderDiagnosticsSnapshot();
        const payload: WorkspaceDiagnosticsTreeExportPayload = {
            kind: 'powerbuilder-workspace-diagnostics-tree',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            summary: {
                ...snapshot.summary,
            },
            projects: snapshot.projectEntries.map(projectEntry => ({
                key: projectEntry.key,
                label: projectEntry.label,
                project: projectEntry.project ? this.serializeProject(projectEntry.project) : undefined,
                objectCount: projectEntry.objectEntries.length,
                issueCount: projectEntry.issueCount,
                errorCount: projectEntry.errorCount,
                warningCount: projectEntry.warningCount,
                objects: projectEntry.objectEntries.map(objectEntry => ({
                    label: objectEntry.label,
                    uri: objectEntry.uri.toString(),
                    relativePath: objectEntry.relativePath,
                    issueCount: objectEntry.issueCount,
                    errorCount: objectEntry.errorCount,
                    warningCount: objectEntry.warningCount,
                    diagnostics: [...objectEntry.diagnostics]
                        .sort(comparePowerBuilderDiagnostics)
                        .map(diagnostic => ({
                            message: diagnostic.message,
                            severity: this.serializeDiagnosticSeverity(diagnostic.severity),
                            source: diagnostic.source,
                            code: this.serializeDiagnosticCode(diagnostic.code),
                            range: this.serializeRange(diagnostic.range),
                        })),
                })),
            })),
        };
        const output = this.buildExportTarget(
            workspaceUri,
            'diagnostics/workspace-diagnostics-tree.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateFeatureSupportSnapshotExport(
        anchorUri?: vscode.Uri,
    ): Promise<GenerateFeatureSupportSnapshotExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const sourceUri = this.resolveFeatureSupportMatrixSourceUri(anchorUri);
        const markdown = await fs.readFile(sourceUri.fsPath, 'utf8');
        const levels = this.parseFeatureSupportLevels(markdown);
        const entries = this.parseFeatureSupportEntries(markdown);
        const productNotes = this.parseMarkdownBulletSection(markdown, '## Notas de producto');
        const payload: FeatureSupportSnapshotExportPayload = {
            kind: 'powerbuilder-feature-support-snapshot',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            source: {
                uri: sourceUri.toString(),
                relativePath: 'docs/reference/feature-support-matrix.md',
            },
            levels,
            summary: {
                featureCount: entries.length,
                noteCount: productNotes.length,
                powerScriptLevels: this.countFeatureSupportLevels(entries.map(entry => entry.powerScript)),
                dataWindowLevels: this.countFeatureSupportLevels(entries.map(entry => entry.dataWindow)),
            },
            entries,
            productNotes,
        };
        const output = this.buildExportTarget(
            workspaceUri,
            'support/feature-support-snapshot.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateSemanticSnapshotDiffExport(
        leftSnapshotUri: vscode.Uri,
        rightSnapshotUri: vscode.Uri,
        anchorUri?: vscode.Uri,
    ): Promise<GenerateSemanticSnapshotDiffExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const leftSnapshot = await this.readJsonFile(leftSnapshotUri);
        const rightSnapshot = await this.readJsonFile(rightSnapshotUri);

        if (!this.isSemanticProjectExportPayload(leftSnapshot) || !this.isSemanticProjectExportPayload(rightSnapshot)) {
            return {
                kind: 'invalid-input',
                reason: 'PowerBuilder: el diff semántico v1 requiere dos snapshots powerbuilder-semantic-project.',
            };
        }

        const payload = this.buildSemanticProjectSnapshotDiffPayload(
            leftSnapshot,
            rightSnapshot,
            leftSnapshotUri,
            rightSnapshotUri,
        );
        const output = this.buildExportTarget(
            workspaceUri,
            `diffs/${sanitizeSegment(path.parse(leftSnapshotUri.fsPath || leftSnapshotUri.path).name)}.vs.${sanitizeSegment(path.parse(rightSnapshotUri.fsPath || rightSnapshotUri.path).name)}.semantic-snapshot-diff.json`,
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            kind: 'generated',
            file: output,
            payload,
        };
    }

    async generateWorkspaceManifestDiffExport(
        leftSnapshotUri: vscode.Uri,
        rightSnapshotUri: vscode.Uri,
        anchorUri?: vscode.Uri,
    ): Promise<GenerateWorkspaceManifestDiffExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const leftSnapshot = await this.readJsonFile(leftSnapshotUri);
        const rightSnapshot = await this.readJsonFile(rightSnapshotUri);
        const leftInput = this.resolveWorkspaceManifestDiffInput(leftSnapshot);
        const rightInput = this.resolveWorkspaceManifestDiffInput(rightSnapshot);

        if (!leftInput || !rightInput) {
            return {
                kind: 'invalid-input',
                reason: 'PowerBuilder: el diff workspace v1 requiere dos exports powerbuilder-workspace-manifest o powerbuilder-workspace-artifact-bundle.',
            };
        }

        const payload = this.buildWorkspaceManifestDiffPayload(
            leftInput.manifest,
            rightInput.manifest,
            leftSnapshotUri,
            rightSnapshotUri,
            leftInput.sourceKind,
            rightInput.sourceKind,
        );
        const output = this.buildExportTarget(
            workspaceUri,
            `diffs/${sanitizeSegment(path.parse(leftSnapshotUri.fsPath || leftSnapshotUri.path).name)}.vs.${sanitizeSegment(path.parse(rightSnapshotUri.fsPath || rightSnapshotUri.path).name)}.workspace-manifest-diff.json`,
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            kind: 'generated',
            file: output,
            payload,
        };
    }

    async generatePublicContractCatalogDiffExport(
        leftSnapshotUri: vscode.Uri,
        rightSnapshotUri: vscode.Uri,
        anchorUri?: vscode.Uri,
    ): Promise<GeneratePublicContractCatalogDiffExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const leftSnapshot = await this.readJsonFile(leftSnapshotUri);
        const rightSnapshot = await this.readJsonFile(rightSnapshotUri);
        const leftInput = this.resolvePublicContractCatalogDiffInput(leftSnapshot);
        const rightInput = this.resolvePublicContractCatalogDiffInput(rightSnapshot);

        if (!leftInput || !rightInput) {
            return {
                kind: 'invalid-input',
                reason: 'PowerBuilder: el diff contractual v1 requiere dos exports powerbuilder-public-contract-catalog o powerbuilder-workspace-artifact-bundle.',
            };
        }

        const payload = this.buildPublicContractCatalogDiffPayload(
            leftInput.catalog,
            rightInput.catalog,
            leftSnapshotUri,
            rightSnapshotUri,
            leftInput.sourceKind,
            rightInput.sourceKind,
        );
        const output = this.buildExportTarget(
            workspaceUri,
            `diffs/${sanitizeSegment(path.parse(leftSnapshotUri.fsPath || leftSnapshotUri.path).name)}.vs.${sanitizeSegment(path.parse(rightSnapshotUri.fsPath || rightSnapshotUri.path).name)}.public-contract-catalog-diff.json`,
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            kind: 'generated',
            file: output,
            payload,
        };
    }

    async generateWorkspaceArtifactBundleDiffExport(
        leftSnapshotUri: vscode.Uri,
        rightSnapshotUri: vscode.Uri,
        anchorUri?: vscode.Uri,
    ): Promise<GenerateWorkspaceArtifactBundleDiffExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const leftSnapshot = await this.readJsonFile(leftSnapshotUri);
        const rightSnapshot = await this.readJsonFile(rightSnapshotUri);

        if (!this.isWorkspaceArtifactBundleExportPayload(leftSnapshot) || !this.isWorkspaceArtifactBundleExportPayload(rightSnapshot)) {
            return {
                kind: 'invalid-input',
                reason: 'PowerBuilder: el diff de bundle v1 requiere dos exports powerbuilder-workspace-artifact-bundle.',
            };
        }

        const payload = this.buildWorkspaceArtifactBundleDiffPayload(
            leftSnapshot,
            rightSnapshot,
            leftSnapshotUri,
            rightSnapshotUri,
        );
        const output = this.buildExportTarget(
            workspaceUri,
            `diffs/${sanitizeSegment(path.parse(leftSnapshotUri.fsPath || leftSnapshotUri.path).name)}.vs.${sanitizeSegment(path.parse(rightSnapshotUri.fsPath || rightSnapshotUri.path).name)}.workspace-artifact-bundle-diff.json`,
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            kind: 'generated',
            file: output,
            payload,
        };
    }

    async generateBuildReportExport(
        result: PbAutoBuildProjectBuildResult,
        anchorUri?: vscode.Uri,
    ): Promise<GenerateBuildReportExportResult> {
        const output = this.buildExportTarget(
            anchorUri ?? result.project.uri,
            `build/${sanitizeSegment(result.project.name)}.last-build-report.json`,
        );
        const payload: BuildReportExportPayload = {
            kind: 'powerbuilder-build-report',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            project: this.serializeProject(result.project),
            executablePath: result.executablePath,
            args: [...result.args],
            exitCode: result.exitCode,
            summary: result.summary,
            issues: result.issues.map(issue => ({
                severity: issue.severity === vscode.DiagnosticSeverity.Error
                    ? 'error'
                    : issue.severity === vscode.DiagnosticSeverity.Warning
                        ? 'warning'
                        : issue.severity === vscode.DiagnosticSeverity.Information
                            ? 'information'
                            : 'hint',
                message: issue.message,
                category: issue.category,
                objectName: issue.objectName,
                libraryPath: issue.libraryPath,
                compilerCode: issue.compilerCode,
                nativeCode: issue.nativeCode,
                rawLine: issue.rawLine,
            })),
            diagnostics: Array.from(result.diagnostics.entries()).map(([uri, diagnostics]) => ({
                uri,
                relativePath: this.toRelativeWorkspacePath(vscode.Uri.parse(uri)),
                count: diagnostics.length,
            })),
            output: result.output,
        };

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateBuildSessionManifestExport(
        autoBuildService: PowerBuilderAutoBuildService | undefined,
        anchorUri?: vscode.Uri,
    ): Promise<GenerateBuildSessionManifestExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const payload = this.buildBuildSessionManifestPayload(autoBuildService);
        const output = this.buildExportTarget(
            workspaceUri,
            'build/build-session-manifest.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    async generateWorkspaceBuildPreferenceExport(
        anchorUri?: vscode.Uri,
    ): Promise<GenerateWorkspaceBuildPreferenceExportResult> {
        const workspaceUri = anchorUri ?? vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd());
        const payload = await this.buildWorkspaceBuildPreferencePayload(anchorUri);
        const output = this.buildExportTarget(
            workspaceUri,
            'workspace/workspace-build-preference.json',
        );

        await this.writeJsonFile(output.uri, payload);

        return {
            file: output,
            payload,
        };
    }

    private buildBuildSessionManifestPayload(
        autoBuildService?: PowerBuilderAutoBuildService,
    ): BuildSessionManifestExportPayload {
        if (!autoBuildService) {
            return {
                kind: 'powerbuilder-build-session-manifest',
                schemaVersion: 1,
                generatedAt: new Date().toISOString(),
                summary: {
                    hasLastTarget: false,
                    hasLastBuild: false,
                },
            };
        }

        const sessionSnapshot = autoBuildService.getSessionSnapshot();
        const lastBuildResult = autoBuildService.getLastBuildResult();
        const lastTarget = sessionSnapshot.lastTarget
            ? {
                uri: sessionSnapshot.lastTarget.uri,
                relativePath: this.toRelativeWorkspacePath(vscode.Uri.parse(sessionSnapshot.lastTarget.uri)),
                name: sessionSnapshot.lastTarget.name,
                kind: sessionSnapshot.lastTarget.kind,
                storedAt: sessionSnapshot.lastTarget.storedAt,
                source: sessionSnapshot.lastTarget.source,
            }
            : undefined;
        const lastBuild = lastBuildResult
            ? {
                project: this.serializeProject(lastBuildResult.project),
                executablePath: lastBuildResult.executablePath,
                args: [...lastBuildResult.args],
                exitCode: lastBuildResult.exitCode,
                summary: lastBuildResult.summary,
                issueCount: lastBuildResult.issues.length,
                capturedAt: lastBuildResult.capturedAt,
            }
            : undefined;

        return {
            kind: 'powerbuilder-build-session-manifest',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            summary: {
                hasLastTarget: !!lastTarget,
                hasLastBuild: !!lastBuild,
                lastTargetSource: lastTarget?.source,
            },
            lastTarget,
            lastBuild,
        };
    }

    private async buildSemanticQueryPayload(
        document: vscode.TextDocument,
        position: vscode.Position,
        project?: PbProjectDefinition,
    ): Promise<SemanticQueryExportPayload | undefined> {
        const symbolContext = getSymbolContextAtPosition(document, position);

        if (!symbolContext?.word?.trim()) {
            return undefined;
        }

        const symbol = this.semanticQueries.resolveSymbolAtPosition({
            document,
            position,
            context: symbolContext,
        });
        const hover = this.semanticQueries.resolveHoverAtPosition({
            uri: document.uri,
            document,
            position,
            context: symbolContext,
        });
        const definition = this.semanticQueries.resolveDefinition({
            word: symbolContext.word,
            uri: document.uri,
            symbolContext,
        });
        const declaration = this.semanticQueries.resolveDeclaration({
            word: symbolContext.word,
            uri: document.uri,
            symbolContext,
        });
        const implementation = this.semanticQueries.resolveImplementations({
            word: symbolContext.word,
            uri: document.uri,
            symbolContext,
        });
        const references = await this.semanticQueries.resolveReferences({
            word: symbolContext.word,
            uri: document.uri,
            includeDeclaration: true,
            symbolContext,
        });
        const renameTarget = this.semanticQueries.resolveRenameTargetAtPosition({
            word: symbolContext.word,
            uri: document.uri,
            symbolContext,
        });
        const renamePlan = await this.semanticQueries.planRename({
            word: symbolContext.word,
            uri: document.uri,
            symbolContext,
        });

        return {
            kind: 'powerbuilder-semantic-query',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            document: {
                uri: document.uri.toString(),
                relativePath: this.toRelativeWorkspacePath(document.uri),
                word: symbolContext.word,
                selectionRange: this.serializeRange(symbolContext.range),
            },
            project: project ? this.serializeProject(project) : undefined,
            query: {
                symbol: this.serializeSymbolQueryResult(symbol),
                hover: this.serializeHoverResult(hover),
                definition: this.serializeNavigationResult(definition),
                declaration: this.serializeNavigationResult(declaration),
                implementation: this.serializeNavigationResult(implementation),
                references: {
                    precision: references.precision,
                    reasons: references.reasons,
                    evidence: references.evidence,
                    locations: references.locations.map(location => this.serializeLocation(location)),
                    plan: this.serializeReferenceQuery(references.query),
                    query: this.serializeReferenceQuery(references.query),
                },
                renameTarget: this.serializeRenameTargetResult(renameTarget, renamePlan),
            },
        };
    }

    private buildOverloadResolutionExplanationPayload(
        document: vscode.TextDocument,
        position: vscode.Position,
        project?: PbProjectDefinition,
    ): OverloadResolutionExplanationExportPayload | undefined {
        const context = getSignatureCallContextAtPosition(document, position);

        if (!context) {
            return undefined;
        }

        const result = this.semanticQueries.resolveSignatureAtPosition({
            document,
            position,
            context,
        });

        return {
            kind: 'powerbuilder-overload-resolution-explanation',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            document: {
                uri: document.uri.toString(),
                relativePath: this.toRelativeWorkspacePath(document.uri),
            },
            project: project ? this.serializeProject(project) : undefined,
            call: this.serializeOverloadResolutionCallContext(context),
            resolution: this.serializeOverloadResolutionResult(result),
        };
    }

    private async buildVisibilityAuditPayload(
        preferredProject?: PbProjectDefinition,
    ): Promise<VisibilityAuditExportPayload> {
        const candidates = this.index.getAllSymbols()
            .filter(symbol => this.isVisibilityAuditCandidate(symbol))
            .filter(symbol => !preferredProject || this.projectRegistry.findProjectsForSourceFile(symbol.uri)
                .some(project => project.uri.toString() === preferredProject.uri.toString()));
        const symbols: VisibilityAuditExportPayload['symbols'] = [];

        for (const candidate of candidates) {
            symbols.push(await this.auditVisibilityCandidate(candidate));
        }

        symbols.sort((left, right) => {
            const leftPriority = left.suggestedAccess ? 0 : left.classification === 'unverifiable' ? 2 : 1;
            const rightPriority = right.suggestedAccess ? 0 : right.classification === 'unverifiable' ? 2 : 1;

            if (leftPriority !== rightPriority) {
                return leftPriority - rightPriority;
            }

            return left.symbol.relativePath.localeCompare(right.symbol.relativePath)
                || left.symbol.name.localeCompare(right.symbol.name)
                || left.normalizedAccess.localeCompare(right.normalizedAccess);
        });

        const projectBuckets = new Map<string, VisibilityAuditExportPayload['projects'][number]>();

        for (const item of symbols) {
            const key = item.project?.uri ?? '_workspace';
            const existing = projectBuckets.get(key) ?? {
                name: item.project?.name ?? '_workspace',
                project: item.project,
                candidateCount: 0,
                auditedCount: 0,
                unconsumedCount: 0,
                degradeCandidateCount: 0,
                unverifiableCount: 0,
            };

            existing.candidateCount += 1;
            existing.auditedCount += item.classification === 'unverifiable' ? 0 : 1;
            existing.unconsumedCount += item.classification === 'no-consumers' ? 1 : 0;
            existing.degradeCandidateCount += item.suggestedAccess ? 1 : 0;
            existing.unverifiableCount += item.classification === 'unverifiable' ? 1 : 0;

            projectBuckets.set(key, existing);
        }

        const projects = [...projectBuckets.values()].sort((left, right) => left.name.localeCompare(right.name));

        return {
            kind: 'powerbuilder-visibility-audit',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            summary: {
                projectCount: projects.length,
                candidateCount: symbols.length,
                auditedCount: symbols.filter(symbol => symbol.classification !== 'unverifiable').length,
                unconsumedCount: symbols.filter(symbol => symbol.classification === 'no-consumers').length,
                degradeCandidateCount: symbols.filter(symbol => !!symbol.suggestedAccess).length,
                unverifiableCount: symbols.filter(symbol => symbol.classification === 'unverifiable').length,
            },
            projects,
            symbols,
        };
    }

    private async auditVisibilityCandidate(
        symbol: PbSymbol,
    ): Promise<VisibilityAuditExportPayload['symbols'][number]> {
        const project = this.projectRegistry.findProjectsForSourceFile(symbol.uri)[0];
        const serializedProject = project ? this.serializeProject(project) : undefined;
        const normalizedAccess = this.normalizeVisibilityAuditAccess(symbol.access)!;
        const document = await this.snapshotStore.getSnapshot(symbol.uri);

        if (!document) {
            return {
                symbol: this.serializeSymbol(symbol),
                project: serializedProject,
                normalizedAccess,
                referenceCount: 0,
                sameTypeReferenceCount: 0,
                hierarchyReferenceCount: 0,
                externalReferenceCount: 0,
                consumerTypeNames: [],
                classification: 'unverifiable',
            };
        }

        const symbolContext = getSymbolContextAtPosition(document, symbol.selectionRange.start);

        if (!symbolContext?.word?.trim()) {
            return {
                symbol: this.serializeSymbol(symbol),
                project: serializedProject,
                normalizedAccess,
                referenceCount: 0,
                sameTypeReferenceCount: 0,
                hierarchyReferenceCount: 0,
                externalReferenceCount: 0,
                consumerTypeNames: [],
                classification: 'unverifiable',
            };
        }

        const renamePlan = await this.semanticQueries.planRename({
            word: symbol.name,
            uri: symbol.uri,
            symbolContext,
        });

        if (!renamePlan) {
            return {
                symbol: this.serializeSymbol(symbol),
                project: serializedProject,
                normalizedAccess,
                referenceCount: 0,
                sameTypeReferenceCount: 0,
                hierarchyReferenceCount: 0,
                externalReferenceCount: 0,
                consumerTypeNames: [],
                classification: 'unverifiable',
            };
        }

        const inheritanceGraph = getInheritanceGraph(this.index);
        const declaringTypeName = symbol.fileObjectName ?? symbol.parent ?? symbol.containerName;
        const occurrences = renamePlan.occurrences.filter(occurrence => !occurrence.isDeclaration);
        const consumerTypeNames = new Set<string>();
        let sameTypeReferenceCount = 0;
        let hierarchyReferenceCount = 0;
        let externalReferenceCount = 0;

        for (const occurrence of occurrences) {
            const consumerTypeName = this.index.findInnermostTypeAtPosition(
                occurrence.uri,
                occurrence.range.start,
            )?.name ?? this.index.getPrimaryFileObjectName(occurrence.uri);

            if (consumerTypeName) {
                consumerTypeNames.add(consumerTypeName);
            }

            if (!declaringTypeName || !consumerTypeName) {
                externalReferenceCount += 1;
                continue;
            }

            const distance = inheritanceGraph.getTypeDistance(
                consumerTypeName,
                declaringTypeName,
            );

            if (distance === 0) {
                sameTypeReferenceCount += 1;
                continue;
            }

            if (Number.isFinite(distance)) {
                hierarchyReferenceCount += 1;
                continue;
            }

            externalReferenceCount += 1;
        }

        const referenceCount = occurrences.length;
        const serializedSymbol = this.serializeSymbol(symbol);

        if (referenceCount === 0) {
            return {
                symbol: serializedSymbol,
                project: serializedProject,
                normalizedAccess,
                referenceCount,
                sameTypeReferenceCount,
                hierarchyReferenceCount,
                externalReferenceCount,
                consumerTypeNames: [...consumerTypeNames].sort((left, right) => left.localeCompare(right)),
                classification: 'no-consumers',
                suggestedAccess: 'private',
            };
        }

        if (sameTypeReferenceCount === referenceCount) {
            return {
                symbol: serializedSymbol,
                project: serializedProject,
                normalizedAccess,
                referenceCount,
                sameTypeReferenceCount,
                hierarchyReferenceCount,
                externalReferenceCount,
                consumerTypeNames: [...consumerTypeNames].sort((left, right) => left.localeCompare(right)),
                classification: 'same-type-only',
                suggestedAccess: 'private',
            };
        }

        if (
            normalizedAccess === 'public' &&
            sameTypeReferenceCount + hierarchyReferenceCount === referenceCount
        ) {
            return {
                symbol: serializedSymbol,
                project: serializedProject,
                normalizedAccess,
                referenceCount,
                sameTypeReferenceCount,
                hierarchyReferenceCount,
                externalReferenceCount,
                consumerTypeNames: [...consumerTypeNames].sort((left, right) => left.localeCompare(right)),
                classification: 'declaring-hierarchy-only',
                suggestedAccess: 'protected',
            };
        }

        return {
            symbol: serializedSymbol,
            project: serializedProject,
            normalizedAccess,
            referenceCount,
            sameTypeReferenceCount,
            hierarchyReferenceCount,
            externalReferenceCount,
            consumerTypeNames: [...consumerTypeNames].sort((left, right) => left.localeCompare(right)),
            classification: 'retained',
        };
    }

    private isVisibilityAuditCandidate(symbol: PbSymbol): boolean {
        if (symbol.isPrototype || symbol.isExternal) {
            return false;
        }

        if (
            symbol.kind !== 'function' &&
            symbol.kind !== 'subroutine' &&
            symbol.kind !== 'event' &&
            symbol.kind !== 'variable' &&
            symbol.kind !== 'constant'
        ) {
            return false;
        }

        return this.normalizeVisibilityAuditAccess(symbol.access) !== undefined;
    }

    private normalizeVisibilityAuditAccess(access: string | undefined): 'public' | 'protected' | undefined {
        const normalized = access?.trim().toLowerCase();

        if (!normalized) {
            return undefined;
        }

        if (normalized.startsWith('public')) {
            return 'public';
        }

        if (normalized.startsWith('protected')) {
            return 'protected';
        }

        return undefined;
    }

    private async collectWorkspaceDataWindowCatalogEntries(
        preferredProject?: PbProjectDefinition,
    ): Promise<WorkspaceDataWindowCatalogEntry[]> {
        await this.workspaceIndexer.indexProjects({ indexSourceFiles: false });

        const dataWindowUris = await vscode.workspace.findFiles(
            '**/*.srd',
            getIndexingExcludeGlob(),
        );
        const provisionalEntries: Array<{
            candidate: DataWindowChildLinkParentCandidate;
            parseResult: PbDataWindowParseResult;
            projects: PbProjectDefinition[];
            retrieveColumnReferenceCount: number;
        }> = [];

        for (const uri of dataWindowUris) {
            const document = await this.snapshotStore.getSnapshot(uri);

            if (!document) {
                continue;
            }

            const projects = this.projectRegistry.findProjectsForSourceFile(uri)
                .filter(project => !preferredProject || project.uri.toString() === preferredProject.uri.toString());

            if (preferredProject && projects.length === 0) {
                continue;
            }

            const parseResult = this.dataWindowParser.parseDocument(document);
            const semantics = buildDataWindowSqlSemantics(document, this.dataWindowParser);

            provisionalEntries.push({
                candidate: {
                    uri,
                    document,
                    parseResult,
                },
                parseResult,
                projects,
                retrieveColumnReferenceCount: semantics.selectColumnReferences.length,
            });
        }

        const projectObjectCounts = new Map<string, Map<string, number>>();

        for (const entry of provisionalEntries) {
            const objectNameKey = this.getDataWindowObjectName(entry.parseResult, entry.candidate.uri).trim().toLowerCase();

            for (const project of entry.projects) {
                const objectCounts = projectObjectCounts.get(project.uri.toString()) ?? new Map<string, number>();
                objectCounts.set(objectNameKey, (objectCounts.get(objectNameKey) ?? 0) + 1);
                projectObjectCounts.set(project.uri.toString(), objectCounts);
            }
        }

        return provisionalEntries
            .map(entry => ({
                candidate: entry.candidate,
                parseResult: entry.parseResult,
                retrieveColumnReferenceCount: entry.retrieveColumnReferenceCount,
                projectBindings: entry.projects.map(project => {
                    const objectNameKey = this.getDataWindowObjectName(entry.parseResult, entry.candidate.uri).trim().toLowerCase();
                    const matchingObjectCount = projectObjectCounts.get(project.uri.toString())?.get(objectNameKey) ?? 1;

                    return {
                        project: this.serializeProject(project),
                        verifiability: matchingObjectCount === 1 ? 'unique' as const : 'ambiguous' as const,
                        matchingObjectCount,
                    };
                }),
            }))
            .sort((left, right) => this.toRelativeWorkspacePath(left.candidate.uri)
                .localeCompare(this.toRelativeWorkspacePath(right.candidate.uri)));
    }

    private getDataWindowObjectName(
        parseResult: PbDataWindowParseResult,
        uri: vscode.Uri,
    ): string {
        return parseResult.metadata.objectName
            || path.parse(uri.fsPath || uri.path).name;
    }

    private serializeSymbolQueryResult(
        result: ResolveSymbolAtPositionResult,
    ): ExportedSemanticSymbolResult {
        return {
            precision: result.precision,
            reasons: result.reasons,
            evidence: result.evidence,
            primarySymbol: result.primarySymbol ? this.serializeSymbol(result.primarySymbol) : undefined,
            symbols: result.symbols.map(symbol => this.serializeSymbol(symbol)),
        };
    }

    private serializeHoverResult(result: ReturnType<SemanticQueryService['resolveHoverAtPosition']>): ExportedSemanticHoverResult {
        return {
            precision: result.precision,
            reasons: result.reasons,
            evidence: result.evidence,
            primarySymbol: result.primarySymbol ? this.serializeSymbol(result.primarySymbol) : undefined,
            systemEntry: result.systemEntry ? this.serializeSystemEntry(result.systemEntry) : undefined,
            content: result.content ? this.serializeHoverContent(result.content) : undefined,
        };
    }

    private serializeOverloadResolutionCallContext(
        context: SignatureCallContext,
    ): ExportedOverloadResolutionCallContext {
        return {
            name: context.name,
            range: this.serializeRange(context.range),
            activeParameter: context.activeParameter,
            providedArgumentCount: context.providedArgumentCount,
            hasAnyArgumentText: context.hasAnyArgumentText,
            currentParameterHasContent: context.currentParameterHasContent,
            isDynamicDispatch: context.isDynamicDispatch ?? false,
            isAncestorControlCall: context.isAncestorControlCall ?? false,
            ...(context.qualifiedOwner ? { qualifiedOwner: context.qualifiedOwner } : {}),
            ...(context.qualifiedOwnerExpression ? { qualifiedOwnerExpression: context.qualifiedOwnerExpression } : {}),
            ...(context.qualifier ? { qualifier: context.qualifier } : {}),
            ...(context.dynamicDispatchKind ? { dynamicDispatchKind: context.dynamicDispatchKind } : {}),
        };
    }

    private serializeOverloadResolutionResult(
        result: ResolveSignatureAtPositionResult,
    ): ExportedOverloadResolutionResult {
        const candidates = result.symbols.map(symbol => this.serializeSymbol(symbol));
        const selectedCandidate = result.systemEntry || result.symbols.length !== 1
            ? undefined
            : this.serializeSymbol(result.symbols[0]);

        return {
            precision: result.precision,
            reasons: result.reasons,
            evidence: result.evidence,
            resolutionKind: this.getOverloadResolutionKind(result),
            shouldProvideHelp: result.shouldProvideHelp,
            candidateCount: candidates.length,
            candidates,
            ...(selectedCandidate ? { selectedCandidate } : {}),
            ...(result.systemEntry ? { systemEntry: this.serializeSystemEntry(result.systemEntry) } : {}),
        };
    }

    private getOverloadResolutionKind(
        result: ResolveSignatureAtPositionResult,
    ): ExportedOverloadResolutionResult['resolutionKind'] {
        if (result.systemEntry) {
            return 'system-member';
        }

        if (result.precision === 'blocked') {
            return 'blocked';
        }

        if (result.precision === 'ambiguous') {
            return 'ambiguous-overloads';
        }

        if (result.symbols.length === 1) {
            return 'single-candidate';
        }

        return 'compatible-overloads';
    }

    private serializeNavigationResult(result: ResolveDefinitionResult): ExportedSemanticNavigationResult {
        return {
            precision: result.precision,
            reasons: result.reasons,
            evidence: result.evidence,
            primarySymbol: result.primarySymbol ? this.serializeSymbol(result.primarySymbol) : undefined,
            symbols: result.symbols.map(symbol => this.serializeSymbol(symbol)),
            locations: result.locations.map(location => this.serializeLocation(location)),
        };
    }

    private serializeReferenceQuery(query: FindReferencesResult): ExportedSemanticReferenceQuery {
        return {
            resolvedSymbols: query.resolvedSymbols.map(symbol => this.serializeSymbol(symbol)),
            occurrences: query.occurrences.map(occurrence => this.serializeOccurrence(occurrence)),
            currentProject: query.currentProject ? this.serializeProject(query.currentProject) : undefined,
            systemMember: query.systemMember ? this.serializeSystemEntry(query.systemMember) : undefined,
        };
    }

    private serializeRenameTargetResult(
        result: ResolveRenameTargetResult,
        renamePlan?: SemanticRenamePlan,
    ): ExportedSemanticRenameTarget {
        return {
            canRename: result.canRename,
            precision: result.precision,
            reasons: result.reasons,
            evidence: result.evidence,
            renameTarget: result.renameTarget
                ? this.serializeRenameTarget(result.renameTarget)
                : undefined,
            plan: renamePlan ? this.serializeRenamePlan(renamePlan) : undefined,
        };
    }

    private serializeRenameTarget(target: SemanticRenameTarget): ExportedSemanticRenameTarget['renameTarget'] {
        return {
            target: this.serializeSymbol(target.target),
            family: target.family.map(symbol => this.serializeSymbol(symbol)),
            currentProject: target.currentProject ? this.serializeProject(target.currentProject) : undefined,
        };
    }

    private serializeOccurrence(occurrence: SemanticOccurrence): ExportedSemanticReferenceQuery['occurrences'][number] {
        return {
            uri: occurrence.uri.toString(),
            relativePath: this.toRelativeWorkspacePath(occurrence.uri),
            range: this.serializeRange(occurrence.range),
            isDeclaration: occurrence.isDeclaration,
            evidence: occurrence.evidence,
        };
    }

    private serializeRenamePlan(renamePlan: SemanticRenamePlan): ExportedSemanticRenamePlan {
        return {
            target: this.serializeSymbol(renamePlan.target),
            family: renamePlan.family.map(symbol => this.serializeSymbol(symbol)),
            currentProject: renamePlan.currentProject ? this.serializeProject(renamePlan.currentProject) : undefined,
            occurrences: renamePlan.occurrences.map(occurrence => this.serializeOccurrence(occurrence)),
        };
    }

    private serializeHoverContent(content: SemanticHoverContent): ExportedHoverContent {
        return {
            kind: content.kind,
            title: content.title,
            signatureMarkdown: content.signatureMarkdown,
            supplementMarkdown: content.supplementMarkdown,
            markdown: content.markdown,
        };
    }

    private serializeScope(
        callable: PbSymbol,
        symbols: readonly PbSymbol[],
    ): ExportedSemanticScope {
        const scopedSymbols = symbols.filter(symbol =>
            symbol !== callable &&
            rangeContainsRange(callable.range, symbol.selectionRange) &&
            (symbol.declarationScope === 'parameter' || symbol.declarationScope === 'local'),
        );

        return {
            callable: this.serializeSymbol(callable),
            parameters: scopedSymbols
                .filter(symbol => symbol.declarationScope === 'parameter')
                .map(symbol => this.serializeSymbol(symbol)),
            locals: scopedSymbols
                .filter(symbol => symbol.declarationScope === 'local')
                .map(symbol => this.serializeSymbol(symbol)),
        };
    }

    private serializeProject(project: PbProjectDefinition): ExportedProject {
        return {
            uri: project.uri.toString(),
            relativePath: this.toRelativeWorkspacePath(project.uri),
            name: project.name,
            projectDirectoryPath: this.toRelativeWorkspacePath(project.projectDirectoryUri),
            applicationName: project.applicationName,
            appEntry: project.appEntry,
            appEntryPath: project.appEntryUri ? this.toRelativeWorkspacePath(project.appEntryUri) : undefined,
            libraries: [...project.libraries],
            libraryPaths: project.libraryUris.map(uri => this.toRelativeWorkspacePath(uri)),
            effectiveRootPaths: this.projectRegistry.getEffectiveProjectSourceRoots(project)
                .map(uri => this.toRelativeWorkspacePath(uri)),
        };
    }

    private serializeBuildableTarget(
        target: WorkspaceBuildableTargetDescriptor,
    ): ExportedBuildableTarget {
        const fileName = path.basename(target.uri.fsPath || target.uri.path);

        return {
            uri: target.uri.toString(),
            relativePath: this.toRelativeWorkspacePath(target.uri),
            name: path.parse(fileName).name,
            kind: target.kind,
            buildArgs: buildPbAutoBuildArgs(target.uri),
            relatedProjects: target.relatedProjects
                .map(relation => ({
                    projectName: relation.project.name,
                    projectUri: relation.project.uri.toString(),
                    projectRelativePath: this.toRelativeWorkspacePath(relation.project.uri),
                    precision: relation.precision,
                    relation: relation.relation,
                    reason: relation.reason,
                })),
        };
    }

    private serializeWorkspaceBundleArtifact(
        artifactKind: string,
        relativePath: string,
        payloadKind: string,
        generatedAt?: string,
        schemaVersion?: number,
    ): WorkspaceArtifactBundleExportPayload['artifacts'][number] {
        return {
            artifactKind,
            payloadKind,
            relativePath,
            generatedAt,
            schemaVersion,
        };
    }

    private async readReleaseValidationReport(
        anchorUri?: vscode.Uri,
    ): Promise<WorkspaceArtifactBundleExportPayload['releaseValidationReport']> {
        const workspaceRootUri = anchorUri
            ? (vscode.workspace.getWorkspaceFolder(anchorUri)?.uri
                ?? vscode.workspace.workspaceFolders?.[0]?.uri
                ?? vscode.Uri.file(process.cwd()))
            : (vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(process.cwd()));
        const releaseReportUri = vscode.Uri.joinPath(
            workspaceRootUri,
            ...RELEASE_VALIDATION_REPORT_RELATIVE_PATH_SEGMENTS,
        );
        const relativePath = this.toRelativeWorkspacePath(releaseReportUri);

        try {
            const rawContent = await fs.readFile(releaseReportUri.fsPath, 'utf8');
            const parsed = JSON.parse(rawContent) as ReleaseValidationReportPayload;

            if (parsed.kind !== 'powerbuilder-release-validation-report') {
                return {
                    status: 'invalid',
                    relativePath,
                    reason: 'El archivo existe pero no coincide con el kind esperado del release report.',
                };
            }

            return {
                status: 'available',
                relativePath,
                payload: parsed,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            if ((error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
                return {
                    status: 'missing',
                    relativePath,
                };
            }

            return {
                status: 'invalid',
                relativePath,
                reason: message,
            };
        }
    }

    private serializeDiagnosticSeverity(
        severity: vscode.DiagnosticSeverity,
    ): 'error' | 'warning' | 'information' | 'hint' {
        switch (severity) {
            case vscode.DiagnosticSeverity.Error:
                return 'error';
            case vscode.DiagnosticSeverity.Warning:
                return 'warning';
            case vscode.DiagnosticSeverity.Information:
                return 'information';
            case vscode.DiagnosticSeverity.Hint:
                return 'hint';
            default:
                return 'hint';
        }
    }

    private serializeDiagnosticCode(
        code: vscode.Diagnostic['code'],
    ): string | undefined {
        if (code === undefined) {
            return undefined;
        }

        if (typeof code === 'object') {
            return String(code.value);
        }

        return String(code);
    }

    private resolveFeatureSupportMatrixSourceUri(anchorUri?: vscode.Uri): vscode.Uri {
        const extensionRootPath = path.resolve(__dirname, '..', '..', '..');

        return vscode.Uri.file(path.join(extensionRootPath, 'docs', 'reference', 'feature-support-matrix.md'));
    }

    private parseFeatureSupportLevels(
        markdown: string,
    ): FeatureSupportSnapshotExportPayload['levels'] {
        return this.parseMarkdownBulletSection(markdown, '## Niveles')
            .map(line => {
                const match = /^`([^`]+)`:\s*(.+)$/.exec(line);

                if (!match) {
                    return undefined;
                }

                return {
                    level: match[1],
                    description: match[2],
                };
            })
            .filter((entry): entry is FeatureSupportSnapshotExportPayload['levels'][number] => !!entry);
    }

    private parseFeatureSupportEntries(
        markdown: string,
    ): FeatureSupportSnapshotExportPayload['entries'] {
        const lines = markdown.split(/\r?\n/);
        const tableHeaderIndex = lines.findIndex(line => line.trim() === '| Feature | PowerScript | `.srd` / DataWindow | Notas |');

        if (tableHeaderIndex < 0) {
            return [];
        }

        const entries: FeatureSupportSnapshotExportPayload['entries'] = [];

        for (let lineIndex = tableHeaderIndex + 2; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex].trim();

            if (!line.startsWith('|')) {
                break;
            }

            const cells = this.splitMarkdownTableRow(line);

            if (cells.length !== 4) {
                continue;
            }

            entries.push({
                feature: cells[0],
                powerScript: cells[1],
                dataWindow: cells[2],
                notes: cells[3],
            });
        }

        return entries;
    }

    private parseMarkdownBulletSection(markdown: string, sectionHeader: string): string[] {
        const lines = markdown.split(/\r?\n/);
        const sectionStartIndex = lines.findIndex(line => line.trim() === sectionHeader);

        if (sectionStartIndex < 0) {
            return [];
        }

        const entries: string[] = [];

        for (let lineIndex = sectionStartIndex + 1; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex].trim();

            if (line.startsWith('## ')) {
                break;
            }

            if (!line.startsWith('- ')) {
                continue;
            }

            entries.push(line.slice(2).trim());
        }

        return entries;
    }

    private splitMarkdownTableRow(line: string): string[] {
        return line
            .split('|')
            .slice(1, -1)
            .map(cell => cell.trim());
    }

    private countFeatureSupportLevels(levels: string[]): FeatureSupportSnapshotExportPayload['summary']['powerScriptLevels'] {
        const counts = new Map<string, number>();

        for (const level of levels) {
            counts.set(level, (counts.get(level) ?? 0) + 1);
        }

        return [...counts.entries()]
            .map(([level, count]) => ({
                level,
                count,
            }))
            .sort((left, right) => left.level.localeCompare(right.level));
    }

    private buildSemanticProjectSnapshotDiffPayload(
        leftSnapshot: SemanticProjectExportPayload,
        rightSnapshot: SemanticProjectExportPayload,
        leftSnapshotUri: vscode.Uri,
        rightSnapshotUri: vscode.Uri,
    ): SemanticSnapshotDiffExportPayload {
        const leftFiles = new Map(leftSnapshot.files.map(file => [file.relativePath, file]));
        const rightFiles = new Map(rightSnapshot.files.map(file => [file.relativePath, file]));
        const addedFiles: SemanticSnapshotDiffExportPayload['files']['added'] = [];
        const removedFiles: SemanticSnapshotDiffExportPayload['files']['removed'] = [];
        const changedFiles: SemanticSnapshotDiffExportPayload['files']['changed'] = [];

        for (const [relativePath, rightFile] of rightFiles) {
            const leftFile = leftFiles.get(relativePath);

            if (!leftFile) {
                addedFiles.push({
                    relativePath,
                    objectName: rightFile.objectName,
                });
                continue;
            }

            const symbolDiff = this.diffExportedSymbolArrays(leftFile.symbols, rightFile.symbols);
            const callableDiff = this.diffExportedSymbolArrays(leftFile.callables, rightFile.callables);

            if (symbolDiff.added.length === 0
                && symbolDiff.removed.length === 0
                && symbolDiff.changed.length === 0
                && callableDiff.added.length === 0
                && callableDiff.removed.length === 0
                && callableDiff.changed.length === 0) {
                continue;
            }

            changedFiles.push({
                relativePath,
                objectName: rightFile.objectName ?? leftFile.objectName,
                addedSymbols: symbolDiff.added,
                removedSymbols: symbolDiff.removed,
                changedSymbols: symbolDiff.changed,
                addedCallables: callableDiff.added,
                removedCallables: callableDiff.removed,
                changedCallables: callableDiff.changed,
            });
        }

        for (const [relativePath, leftFile] of leftFiles) {
            if (rightFiles.has(relativePath)) {
                continue;
            }

            removedFiles.push({
                relativePath,
                objectName: leftFile.objectName,
            });
        }

        return {
            kind: 'powerbuilder-semantic-snapshot-diff',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            snapshotKind: 'powerbuilder-semantic-project',
            inputs: {
                left: {
                    uri: leftSnapshotUri.toString(),
                    relativePath: this.toRelativeWorkspacePath(leftSnapshotUri),
                    projectName: leftSnapshot.project.name,
                    summary: leftSnapshot.summary,
                },
                right: {
                    uri: rightSnapshotUri.toString(),
                    relativePath: this.toRelativeWorkspacePath(rightSnapshotUri),
                    projectName: rightSnapshot.project.name,
                    summary: rightSnapshot.summary,
                },
            },
            summary: {
                addedFiles: addedFiles.length,
                removedFiles: removedFiles.length,
                changedFiles: changedFiles.length,
                addedSymbols: changedFiles.reduce((count, file) => count + file.addedSymbols.length, 0),
                removedSymbols: changedFiles.reduce((count, file) => count + file.removedSymbols.length, 0),
                changedSymbols: changedFiles.reduce((count, file) => count + file.changedSymbols.length, 0),
                addedCallables: changedFiles.reduce((count, file) => count + file.addedCallables.length, 0),
                removedCallables: changedFiles.reduce((count, file) => count + file.removedCallables.length, 0),
                changedCallables: changedFiles.reduce((count, file) => count + file.changedCallables.length, 0),
            },
            files: {
                added: addedFiles.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
                removed: removedFiles.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
                changed: changedFiles.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
            },
        };
    }

    private buildWorkspaceManifestDiffPayload(
        leftSnapshot: WorkspaceManifestExportPayload,
        rightSnapshot: WorkspaceManifestExportPayload,
        leftSnapshotUri: vscode.Uri,
        rightSnapshotUri: vscode.Uri,
        leftSourceKind: 'workspace-manifest' | 'workspace-artifact-bundle',
        rightSourceKind: 'workspace-manifest' | 'workspace-artifact-bundle',
    ): WorkspaceManifestDiffExportPayload {
        const leftProjects = new Map(leftSnapshot.projects.map(project => [project.uri, project]));
        const rightProjects = new Map(rightSnapshot.projects.map(project => [project.uri, project]));
        const leftTargets = new Map(leftSnapshot.workspace.buildableTargets.map(target => [target.uri, target]));
        const rightTargets = new Map(rightSnapshot.workspace.buildableTargets.map(target => [target.uri, target]));
        const addedProjects: ExportedWorkspaceProjectManifestEntry[] = [];
        const removedProjects: ExportedWorkspaceProjectManifestEntry[] = [];
        const changedProjects: WorkspaceManifestDiffExportPayload['workspace']['projects']['changed'] = [];
        const addedBuildTargets: ExportedBuildableTarget[] = [];
        const removedBuildTargets: ExportedBuildableTarget[] = [];
        const changedBuildTargets: WorkspaceManifestDiffExportPayload['workspace']['buildableTargets']['changed'] = [];
        const retainedRoots = this.diffStringArrays(
            leftSnapshot.workspace.retainedEffectiveRootKeys,
            rightSnapshot.workspace.retainedEffectiveRootKeys,
        );

        for (const [uri, rightProject] of rightProjects) {
            const leftProject = leftProjects.get(uri);

            if (!leftProject) {
                addedProjects.push(rightProject);
                continue;
            }

            const changedFields = this.diffWorkspaceProjectEntry(leftProject, rightProject);

            if (changedFields.length > 0) {
                changedProjects.push({
                    uri,
                    relativePath: rightProject.relativePath,
                    name: rightProject.name,
                    changedFields,
                });
            }
        }

        for (const [uri, leftProject] of leftProjects) {
            if (!rightProjects.has(uri)) {
                removedProjects.push(leftProject);
            }
        }

        for (const [uri, rightTarget] of rightTargets) {
            const leftTarget = leftTargets.get(uri);

            if (!leftTarget) {
                addedBuildTargets.push(rightTarget);
                continue;
            }

            const changedFields = this.diffWorkspaceBuildTarget(leftTarget, rightTarget);

            if (changedFields.length > 0) {
                changedBuildTargets.push({
                    uri,
                    relativePath: rightTarget.relativePath,
                    name: rightTarget.name,
                    kind: rightTarget.kind,
                    changedFields,
                });
            }
        }

        for (const [uri, leftTarget] of leftTargets) {
            if (!rightTargets.has(uri)) {
                removedBuildTargets.push(leftTarget);
            }
        }

        const leftPreferredProjectUri = leftSnapshot.workspace.preferredProject?.uri;
        const rightPreferredProjectUri = rightSnapshot.workspace.preferredProject?.uri;
        const leftPreferredBuildTargetUri = leftSnapshot.workspace.preferredBuildTarget?.uri;
        const rightPreferredBuildTargetUri = rightSnapshot.workspace.preferredBuildTarget?.uri;
        const incrementalImpactChanged = JSON.stringify(leftSnapshot.workspace.incrementalImpact ?? null)
            !== JSON.stringify(rightSnapshot.workspace.incrementalImpact ?? null);
        const indexingAuditChanged = JSON.stringify(leftSnapshot.workspace.indexingAudit)
            !== JSON.stringify(rightSnapshot.workspace.indexingAudit);
        const indexingAuditDelta = this.buildWorkspaceIndexingAuditDelta(
            leftSnapshot.workspace.indexingAudit,
            rightSnapshot.workspace.indexingAudit,
        );
        const rootsChanged = retainedRoots.added.length > 0 || retainedRoots.removed.length > 0;
        const buildGraphChanged = addedProjects.length > 0
            || removedProjects.length > 0
            || changedProjects.length > 0
            || addedBuildTargets.length > 0
            || removedBuildTargets.length > 0
            || changedBuildTargets.length > 0
            || leftPreferredProjectUri !== rightPreferredProjectUri
            || leftPreferredBuildTargetUri !== rightPreferredBuildTargetUri;
        const cacheSurfaceChanged = indexingAuditChanged || incrementalImpactChanged;
        const likelyImpactedArtifacts = new Set<string>();
        const reasons: string[] = [];

        if (rootsChanged) {
            likelyImpactedArtifacts.add('powerbuilder-workspace-manifest');
            likelyImpactedArtifacts.add('powerbuilder-workspace-artifact-bundle');
            reasons.push('Cambian roots efectivas retenidas del workspace.');
        }

        if (buildGraphChanged) {
            likelyImpactedArtifacts.add('powerbuilder-workspace-manifest');
            likelyImpactedArtifacts.add('powerbuilder-workspace-artifact-bundle');
            likelyImpactedArtifacts.add('powerbuilder-build-session-manifest');
            reasons.push('Cambian proyectos, targets buildables o la preferencia build/workspace publicada.');
        }

        if (cacheSurfaceChanged) {
            likelyImpactedArtifacts.add('powerbuilder-workspace-artifact-bundle');
            reasons.push('Cambia la auditoría de indexado/cache o el impacto incremental publicado.');
        }

        return {
            kind: 'powerbuilder-workspace-manifest-diff',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            snapshotKind: 'powerbuilder-workspace-manifest',
            inputs: {
                left: {
                    uri: leftSnapshotUri.toString(),
                    relativePath: this.toRelativeWorkspacePath(leftSnapshotUri),
                    sourceKind: leftSourceKind,
                    generatedAt: leftSnapshot.generatedAt,
                    projectCount: leftSnapshot.workspace.projectCount,
                    buildableTargetCount: leftSnapshot.workspace.buildableTargetCount,
                    retainedEffectiveRootCount: leftSnapshot.workspace.retainedEffectiveRootKeys.length,
                },
                right: {
                    uri: rightSnapshotUri.toString(),
                    relativePath: this.toRelativeWorkspacePath(rightSnapshotUri),
                    sourceKind: rightSourceKind,
                    generatedAt: rightSnapshot.generatedAt,
                    projectCount: rightSnapshot.workspace.projectCount,
                    buildableTargetCount: rightSnapshot.workspace.buildableTargetCount,
                    retainedEffectiveRootCount: rightSnapshot.workspace.retainedEffectiveRootKeys.length,
                },
            },
            summary: {
                addedProjects: addedProjects.length,
                removedProjects: removedProjects.length,
                changedProjects: changedProjects.length,
                addedBuildTargets: addedBuildTargets.length,
                removedBuildTargets: removedBuildTargets.length,
                changedBuildTargets: changedBuildTargets.length,
                addedRetainedRoots: retainedRoots.added.length,
                removedRetainedRoots: retainedRoots.removed.length,
                preferredProjectChanged: leftPreferredProjectUri !== rightPreferredProjectUri,
                preferredBuildTargetChanged: leftPreferredBuildTargetUri !== rightPreferredBuildTargetUri,
                indexingAuditChanged,
                incrementalImpactChanged,
            },
            workspace: {
                retainedEffectiveRootKeys: retainedRoots,
                preferredProject: {
                    changed: leftPreferredProjectUri !== rightPreferredProjectUri,
                    left: leftSnapshot.workspace.preferredProject,
                    right: rightSnapshot.workspace.preferredProject,
                },
                preferredBuildTarget: {
                    changed: leftPreferredBuildTargetUri !== rightPreferredBuildTargetUri,
                    left: leftSnapshot.workspace.preferredBuildTarget,
                    right: rightSnapshot.workspace.preferredBuildTarget,
                },
                projects: {
                    added: addedProjects.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
                    removed: removedProjects.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
                    changed: changedProjects.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
                },
                buildableTargets: {
                    added: addedBuildTargets.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
                    removed: removedBuildTargets.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
                    changed: changedBuildTargets.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
                },
                indexingAudit: {
                    left: leftSnapshot.workspace.indexingAudit,
                    right: rightSnapshot.workspace.indexingAudit,
                    delta: indexingAuditDelta,
                },
                incrementalImpact: {
                    changed: incrementalImpactChanged,
                    left: leftSnapshot.workspace.incrementalImpact,
                    right: rightSnapshot.workspace.incrementalImpact,
                },
            },
            invalidation: {
                rootsChanged,
                buildGraphChanged,
                cacheSurfaceChanged,
                likelyImpactedArtifacts: Array.from(likelyImpactedArtifacts).sort(),
                reasons,
            },
        };
    }

    private diffExportedSymbolArrays(
        leftSymbols: readonly ExportedPbSymbol[],
        rightSymbols: readonly ExportedPbSymbol[],
    ): {
        added: ExportedPbSymbol[];
        removed: ExportedPbSymbol[];
        changed: Array<{
            persistentId: string;
            left: ExportedPbSymbol;
            right: ExportedPbSymbol;
        }>;
    } {
        const leftMap = new Map(leftSymbols.map(symbol => [symbol.persistentId, symbol]));
        const rightMap = new Map(rightSymbols.map(symbol => [symbol.persistentId, symbol]));
        const added: ExportedPbSymbol[] = [];
        const removed: ExportedPbSymbol[] = [];
        const changed: Array<{
            persistentId: string;
            left: ExportedPbSymbol;
            right: ExportedPbSymbol;
        }> = [];

        for (const [persistentId, rightSymbol] of rightMap) {
            const leftSymbol = leftMap.get(persistentId);

            if (!leftSymbol) {
                added.push(rightSymbol);
                continue;
            }

            if (JSON.stringify(leftSymbol) !== JSON.stringify(rightSymbol)) {
                changed.push({
                    persistentId,
                    left: leftSymbol,
                    right: rightSymbol,
                });
            }
        }

        for (const [persistentId, leftSymbol] of leftMap) {
            if (!rightMap.has(persistentId)) {
                removed.push(leftSymbol);
            }
        }

        return {
            added: added.sort((left, right) => left.persistentId.localeCompare(right.persistentId)),
            removed: removed.sort((left, right) => left.persistentId.localeCompare(right.persistentId)),
            changed: changed.sort((left, right) => left.persistentId.localeCompare(right.persistentId)),
        };
    }

    private async readJsonFile(uri: vscode.Uri): Promise<unknown> {
        const content = await fs.readFile(uri.fsPath, 'utf8');

        return JSON.parse(content);
    }

    private tryGetPayloadKind(value: unknown): string | undefined {
        if (!value || typeof value !== 'object') {
            return undefined;
        }

        const candidateKind = (value as { kind?: unknown }).kind;

        return typeof candidateKind === 'string'
            ? candidateKind
            : undefined;
    }

    private async getOrBuildCachedPayload<T>(
        cacheKey: string,
        versionToken: string,
        builder: () => Promise<T>,
    ): Promise<T> {
        const cached = this.artifactPayloadCache.get(cacheKey);

        if (cached?.versionToken === versionToken) {
            return cached.payload as T;
        }

        const payload = await builder();

        this.artifactPayloadCache.set(cacheKey, {
            versionToken,
            payload,
        });

        return payload;
    }

    private async collectWorkspaceBuildableTargets(
        projects: readonly PbProjectDefinition[],
    ): Promise<WorkspaceBuildableTargetDescriptor[]> {
        const targets = new Map<string, WorkspaceBuildableTargetDescriptor>();
        const workspaceTargetUris = await this.findWorkspaceBuildTargetUris();
        const parsedTargetReferences = await this.buildWorkspaceBuildTargetReferenceIndex(workspaceTargetUris);
        const projectByUri = new Map(projects.map(project => [project.uri.toString(), project]));

        for (const project of projects) {
            targets.set(project.uri.toString(), {
                uri: project.uri,
                kind: 'project',
                relatedProjects: [{
                    project,
                    precision: 'exact',
                    relation: 'self-project',
                    reason: 'El target buildable corresponde exactamente al .pbproj indexado.',
                }],
            });
        }

        for (const uri of workspaceTargetUris) {
            const key = uri.toString();

            if (targets.has(key)) {
                continue;
            }

            const kind = getPbBuildTargetKind(uri);

            if (!kind || kind === 'project') {
                continue;
            }

            const declaredRelatedProjects = this.resolveDeclaredWorkspaceBuildTargetRelations(
                uri,
                projectByUri,
                parsedTargetReferences,
            );

            targets.set(key, {
                uri,
                kind,
                relatedProjects: declaredRelatedProjects.length > 0
                    ? declaredRelatedProjects
                    : projects
                        .filter(project => this.isUriWithinDirectoryScope(project.projectDirectoryUri, uri))
                        .map(project => ({
                            project,
                            precision: 'compatible',
                            relation: 'co-located-build-scope',
                            reason: 'El target buildable comparte directorio o ancestro con el proyecto; no hay membresía declarada parseable dentro de .pbw/.pbsln/.pbt.',
                        })),
            });
        }

        return Array.from(targets.values())
            .sort((left, right) => this.toRelativeWorkspacePath(left.uri).localeCompare(this.toRelativeWorkspacePath(right.uri)));
    }

    private async buildWorkspaceBuildTargetReferenceIndex(
        targetUris: readonly vscode.Uri[],
    ): Promise<Map<string, vscode.Uri[]>> {
        const entries = await Promise.all(targetUris.map(async uri => [
            uri.toString(),
            await this.readBuildTargetDeclaredReferences(uri),
        ] as const));

        return new Map(entries);
    }

    private async readBuildTargetDeclaredReferences(
        uri: vscode.Uri,
    ): Promise<vscode.Uri[]> {
        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            const text = Buffer.from(bytes).toString('utf8');
            return this.buildTargetParser.parseTargetText(uri, text)?.referencedUris ?? [];
        } catch {
            return [];
        }
    }

    private resolveDeclaredWorkspaceBuildTargetRelations(
        targetUri: vscode.Uri,
        projectByUri: ReadonlyMap<string, PbProjectDefinition>,
        parsedTargetReferences: ReadonlyMap<string, readonly vscode.Uri[]>,
        visited = new Set<string>(),
    ): WorkspaceBuildableTargetRelation[] {
        const key = targetUri.toString();

        if (visited.has(key)) {
            return [];
        }

        visited.add(key);

        const relatedProjects = new Map<string, WorkspaceBuildableTargetRelation>();

        for (const referencedUri of parsedTargetReferences.get(key) ?? []) {
            const referencedKind = getPbBuildTargetKind(referencedUri);

            if (!referencedKind) {
                continue;
            }

            if (referencedKind === 'project') {
                const project = projectByUri.get(referencedUri.toString());

                if (!project) {
                    continue;
                }

                relatedProjects.set(project.uri.toString(), {
                    project,
                    precision: 'exact',
                    relation: 'declared-build-member',
                    reason: 'El target buildable declara explícitamente este .pbproj dentro de su membresía parseada.',
                });
                continue;
            }

            for (const relation of this.resolveDeclaredWorkspaceBuildTargetRelations(
                referencedUri,
                projectByUri,
                parsedTargetReferences,
                visited,
            )) {
                relatedProjects.set(relation.project.uri.toString(), relation);
            }
        }

        return Array.from(relatedProjects.values());
    }

    private async findWorkspaceBuildTargetUris(): Promise<vscode.Uri[]> {
        const patterns = ['**/*.pbproj', '**/*.pbw', '**/*.pbsln', '**/*.pbt'];
        const groups = await Promise.all(patterns.map(pattern =>
            vscode.workspace.findFiles(pattern, getIndexingExcludeGlob()),
        ));

        return groups.flat();
    }

    private buildWorkspaceIndexingAudit(
        projects: readonly PbProjectDefinition[],
    ): WorkspaceManifestIndexingAudit {
        const indexedUris = this.index.getIndexedUris()
            .sort((left, right) => this.toRelativeWorkspacePath(left).localeCompare(this.toRelativeWorkspacePath(right)));
        const retainedRootKeys = this.projectRegistry.getRetainedProjectRootKeys();
        const staleIndexedFiles = indexedUris.filter(uri =>
            !vscode.workspace.getWorkspaceFolder(uri)
            && !this.projectRegistry.isUriWithinRootKeys(uri, retainedRootKeys)
            && !isPbBuildTargetUri(uri),
        );
        const unassignedIndexedFiles = indexedUris.filter(uri =>
            !isPbBuildTargetUri(uri)
            && !projects.some(project => this.projectRegistry.isSourceFileInProject(uri, project)),
        );

        return {
            indexedFileCount: this.index.fileCount,
            indexedSymbolCount: this.index.symbolCount,
            snapshotCacheEntryCount: this.snapshotStore.getCacheEntryCount(),
            artifactPayloadCacheEntryCount: this.artifactPayloadCache.size,
            unassignedIndexedFileCount: unassignedIndexedFiles.length,
            unassignedIndexedFiles: unassignedIndexedFiles.map(uri => this.toRelativeWorkspacePath(uri)),
            staleIndexedFileCount: staleIndexedFiles.length,
            staleIndexedFiles: staleIndexedFiles.map(uri => this.toRelativeWorkspacePath(uri)),
        };
    }

    private buildWorkspaceIncrementalImpact(
        anchorUri: vscode.Uri | undefined,
        matchingProjects: readonly PbProjectDefinition[],
        buildableTargets: readonly WorkspaceBuildableTargetDescriptor[],
    ): WorkspaceManifestIncrementalImpact | undefined {
        if (!anchorUri) {
            return undefined;
        }

        const impactedBuildTargets = this.collectWorkspaceImpactTargets(anchorUri, matchingProjects, buildableTargets);

        const impactedProjects = matchingProjects.length > 0
            ? [...matchingProjects]
            : (buildableTargets.find(target => target.uri.toString() === anchorUri.toString())?.relatedProjects ?? [])
                .map(relation => relation.project);

        return {
            anchorUri: anchorUri.toString(),
            anchorRelativePath: this.toRelativeWorkspacePath(anchorUri),
            impactedProjects: impactedProjects.map(project => this.serializeProject(project)),
            impactedBuildTargets,
        };
    }

    private buildWorkspaceBuildTargetPreference(
        anchorUri: vscode.Uri | undefined,
        matchingProjects: readonly PbProjectDefinition[],
        buildableTargets: readonly WorkspaceBuildableTargetDescriptor[],
    ): WorkspaceBuildTargetPreference {
        if (!anchorUri) {
            return {
                matchingBuildTargetsForAnchor: [],
            };
        }

        const matchingBuildTargetsForAnchor = this.collectWorkspaceImpactTargets(anchorUri, matchingProjects, buildableTargets);

        return {
            preferredBuildTarget: matchingBuildTargetsForAnchor[0],
            matchingBuildTargetsForAnchor,
        };
    }

    private async buildWorkspaceBuildPreferencePayload(
        anchorUri?: vscode.Uri,
    ): Promise<WorkspaceBuildPreferencePayload> {
        const resolvedAnchorUri = anchorUri
            ?? vscode.window.activeTextEditor?.document.uri
            ?? vscode.workspace.workspaceFolders?.[0]?.uri;
        const projects = this.projectRegistry.getProjects()
            .sort((left, right) => left.name.localeCompare(right.name));
        const matchingProjects = resolvedAnchorUri
            ? this.projectRegistry.findProjectsForSourceFile(resolvedAnchorUri)
            : [];
        const buildableTargets = await this.collectWorkspaceBuildableTargets(projects);
        const buildTargetPreference = this.buildWorkspaceBuildTargetPreference(
            resolvedAnchorUri,
            matchingProjects,
            buildableTargets,
        );
        const reasons: string[] = [];

        if (!resolvedAnchorUri) {
            reasons.push('No hay ancla activa; se publica solo el estado global actual del workspace.');
        } else if (matchingProjects[0]) {
            reasons.push('El proyecto preferido sale del mayor match de root efectiva para el ancla activa.');
        } else if (isPbBuildTargetUri(resolvedAnchorUri)) {
            reasons.push('El ancla activa ya es un target buildable directo y se evalúa como superficie de build.');
        } else {
            reasons.push('No hay proyecto exacto para el ancla y la preferencia build se resuelve por targets relacionados disponibles.');
        }

        if (buildTargetPreference.preferredBuildTarget?.reason) {
            reasons.push(buildTargetPreference.preferredBuildTarget.reason);
        }

        return {
            kind: 'powerbuilder-workspace-build-preference',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            anchorUri: resolvedAnchorUri?.toString(),
            anchorRelativePath: resolvedAnchorUri ? this.toRelativeWorkspacePath(resolvedAnchorUri) : undefined,
            preferredProject: matchingProjects[0] ? this.serializeProject(matchingProjects[0]) : undefined,
            matchingProjectsForAnchor: matchingProjects.map(project => this.serializeProject(project)),
            preferredBuildTarget: buildTargetPreference.preferredBuildTarget,
            matchingBuildTargetsForAnchor: buildTargetPreference.matchingBuildTargetsForAnchor,
            buildableTargetCount: buildableTargets.length,
            reasons,
        };
    }

    private collectWorkspaceImpactTargets(
        anchorUri: vscode.Uri,
        matchingProjects: readonly PbProjectDefinition[],
        buildableTargets: readonly WorkspaceBuildableTargetDescriptor[],
    ): ExportedWorkspaceImpactTarget[] {
        const impactedProjects = matchingProjects.length > 0
            ? [...matchingProjects]
            : (buildableTargets.find(target => target.uri.toString() === anchorUri.toString())?.relatedProjects ?? [])
                .map(relation => relation.project);
        const impactedTargetByUri = new Map<string, ExportedWorkspaceImpactTarget>();

        if (isPbBuildTargetUri(anchorUri)) {
            const kind = getPbBuildTargetKind(anchorUri);

            if (kind) {
                impactedTargetByUri.set(anchorUri.toString(), {
                    uri: anchorUri.toString(),
                    relativePath: this.toRelativeWorkspacePath(anchorUri),
                    name: path.parse(path.basename(anchorUri.fsPath || anchorUri.path)).name,
                    kind,
                    precision: 'exact',
                    relation: 'active-target',
                    reason: 'El artefacto ancla ya es un target buildable directo para PBAutoBuild.',
                });
            }
        }

        for (const target of buildableTargets) {
            for (const relation of target.relatedProjects) {
                if (!impactedProjects.some(project => project.uri.toString() === relation.project.uri.toString())) {
                    continue;
                }

                const existing = impactedTargetByUri.get(target.uri.toString());
                const candidate: ExportedWorkspaceImpactTarget = {
                    uri: target.uri.toString(),
                    relativePath: this.toRelativeWorkspacePath(target.uri),
                    name: path.parse(path.basename(target.uri.fsPath || target.uri.path)).name,
                    kind: target.kind,
                    precision: relation.precision,
                    relation: relation.relation,
                    reason: relation.reason,
                };

                if (!existing || this.compareWorkspaceImpactTargets(candidate, existing) < 0) {
                    impactedTargetByUri.set(target.uri.toString(), candidate);
                }
            }
        }

        return Array.from(impactedTargetByUri.values())
            .sort((left, right) => this.compareWorkspaceImpactTargets(left, right));
    }

    private compareWorkspaceImpactTargets(
        left: ExportedWorkspaceImpactTarget,
        right: ExportedWorkspaceImpactTarget,
    ): number {
        const precisionRank = (value: ExportedWorkspaceImpactTarget['precision']): number => value === 'exact' ? 0 : 1;
        const relationRank = (value: ExportedWorkspaceImpactTarget['relation']): number => {
            switch (value) {
            case 'active-target':
                return 0;
            case 'self-project':
                return 1;
            case 'declared-build-member':
                return 2;
            default:
                return 3;
            }
        };
        const kindRank = (value: ExportedWorkspaceImpactTarget['kind']): number => {
            switch (value) {
            case 'project':
                return 0;
            case 'target-file':
                return 1;
            case 'workspace':
                return 2;
            default:
                return 3;
            }
        };

        return precisionRank(left.precision) - precisionRank(right.precision)
            || relationRank(left.relation) - relationRank(right.relation)
            || kindRank(left.kind) - kindRank(right.kind)
            || left.relativePath.localeCompare(right.relativePath);
    }

    private buildWorkspaceGraph(
        projects: readonly PbProjectDefinition[],
        buildableTargets: readonly WorkspaceBuildableTargetDescriptor[],
    ): WorkspaceManifestGraph {
        const nodes = new Map<string, WorkspaceManifestGraphNode>();
        const edges: WorkspaceManifestGraphEdge[] = [];

        const addNode = (node: WorkspaceManifestGraphNode): void => {
            if (!nodes.has(node.id)) {
                nodes.set(node.id, node);
            }
        };

        for (const target of buildableTargets) {
            const targetId = `build-target:${target.uri.toString()}`;

            addNode({
                id: targetId,
                kind: 'build-target',
                label: path.basename(target.uri.fsPath || target.uri.path),
                uri: target.uri.toString(),
                relativePath: this.toRelativeWorkspacePath(target.uri),
                buildTargetKind: target.kind,
            });

            for (const relation of target.relatedProjects) {
                const projectId = `project:${relation.project.uri.toString()}`;

                addNode({
                    id: projectId,
                    kind: 'project',
                    label: relation.project.name,
                    uri: relation.project.uri.toString(),
                    relativePath: this.toRelativeWorkspacePath(relation.project.uri),
                    projectName: relation.project.name,
                });
                edges.push({
                    from: targetId,
                    to: projectId,
                    relation: relation.relation === 'self-project'
                        ? 'builds-project'
                        : 'may-build-project',
                    precision: relation.precision,
                    reason: relation.reason,
                });
            }
        }

        for (const project of projects) {
            const projectId = `project:${project.uri.toString()}`;

            addNode({
                id: projectId,
                kind: 'project',
                label: project.name,
                uri: project.uri.toString(),
                relativePath: this.toRelativeWorkspacePath(project.uri),
                projectName: project.name,
            });

            const effectiveRoots = this.projectRegistry.getEffectiveProjectSourceRoots(project);
            const projectSourceUris = this.index.getIndexedUris()
                .filter(uri => this.projectRegistry.isSourceFileInProject(uri, project))
                .sort((left, right) => this.toRelativeWorkspacePath(left).localeCompare(this.toRelativeWorkspacePath(right)));

            for (const rootUri of effectiveRoots) {
                const rootId = this.buildProjectRootNodeId(project, rootUri);

                addNode({
                    id: rootId,
                    kind: 'library-root',
                    label: path.basename(rootUri.fsPath || rootUri.path),
                    uri: rootUri.toString(),
                    relativePath: this.toRelativeWorkspacePath(rootUri),
                    projectName: project.name,
                });
                edges.push({
                    from: projectId,
                    to: rootId,
                    relation: 'declares-library',
                    precision: 'exact',
                    reason: 'La root efectiva se resolvió directamente desde el .pbproj parseado y sus exclusiones activas.',
                });
            }

            for (const sourceUri of projectSourceUris) {
                const ownerRoot = this.resolveOwningProjectRoot(project, sourceUri, effectiveRoots);

                if (!ownerRoot) {
                    continue;
                }

                const rootId = this.buildProjectRootNodeId(project, ownerRoot);
                const sourceId = `source-file:${sourceUri.toString()}`;

                addNode({
                    id: sourceId,
                    kind: 'source-file',
                    label: path.basename(sourceUri.fsPath || sourceUri.path),
                    uri: sourceUri.toString(),
                    relativePath: this.toRelativeWorkspacePath(sourceUri),
                    projectName: project.name,
                });
                edges.push({
                    from: rootId,
                    to: sourceId,
                    relation: 'contains-source-file',
                    precision: 'exact',
                    reason: 'El archivo fuente quedó indexado bajo una root efectiva y activa del proyecto.',
                });
            }
        }

        return {
            summary: {
                nodeCount: nodes.size,
                edgeCount: edges.length,
                buildTargetProjectEdgeCount: edges.filter(edge => edge.relation === 'builds-project' || edge.relation === 'may-build-project').length,
                projectLibraryEdgeCount: edges.filter(edge => edge.relation === 'declares-library').length,
                librarySourceEdgeCount: edges.filter(edge => edge.relation === 'contains-source-file').length,
            },
            nodes: Array.from(nodes.values())
                .sort((left, right) => left.id.localeCompare(right.id)),
            edges: edges.sort((left, right) => `${left.from}|${left.to}|${left.relation}`.localeCompare(`${right.from}|${right.to}|${right.relation}`)),
        };
    }

    private isUriWithinDirectoryScope(
        childUri: vscode.Uri,
        scopeTargetUri: vscode.Uri,
    ): boolean {
        const childPath = normalizeWorkspaceUriPath(childUri.fsPath || childUri.path);
        const scopeDirectoryPath = normalizeWorkspaceUriPath(path.dirname(scopeTargetUri.fsPath || scopeTargetUri.path));

        return childPath === scopeDirectoryPath || childPath.startsWith(`${scopeDirectoryPath}/`);
    }

    private buildProjectRootNodeId(
        project: PbProjectDefinition,
        rootUri: vscode.Uri,
    ): string {
        return `library-root:${project.uri.toString()}:${rootUri.toString()}`;
    }

    private resolveOwningProjectRoot(
        project: PbProjectDefinition,
        sourceUri: vscode.Uri,
        roots: readonly vscode.Uri[],
    ): vscode.Uri | undefined {
        return roots
            .filter(rootUri => this.projectRegistry.isUriWithinAnyRoot(sourceUri, [rootUri]))
            .sort((left, right) => normalizeWorkspaceUriPath(right).length - normalizeWorkspaceUriPath(left).length)[0];
    }

    private async buildSemanticDocumentVersionToken(
        document: vscode.TextDocument,
        project: PbProjectDefinition | undefined,
        position?: vscode.Position,
    ): Promise<string> {
        return JSON.stringify({
            documentUri: document.uri.toString(),
            documentVersion: await this.buildUriArtifactVersionToken(document.uri),
            projectVersion: project ? await this.buildProjectArtifactVersionToken(project) : undefined,
            queryPosition: position
                ? { line: position.line, character: position.character }
                : undefined,
        });
    }

    private async buildProjectArtifactVersionToken(project: PbProjectDefinition): Promise<string> {
        const sourceUris = this.index.getIndexedUris()
            .filter(uri => this.projectRegistry.isSourceFileInProject(uri, project))
            .sort((left, right) => this.toRelativeWorkspacePath(left).localeCompare(this.toRelativeWorkspacePath(right)));

        const sourceVersions = await Promise.all(sourceUris.map(async uri => ({
            uri: uri.toString(),
            relativePath: this.toRelativeWorkspacePath(uri),
            version: await this.buildUriArtifactVersionToken(uri),
        })));

        return JSON.stringify({
            projectUri: project.uri.toString(),
            projectVersion: await this.buildUriArtifactVersionToken(project.uri),
            sourceVersions,
        });
    }

    private async buildWorkspaceManifestVersionToken(
        projects: readonly PbProjectDefinition[],
        buildableTargets: readonly WorkspaceBuildableTargetDescriptor[],
        anchorUri?: vscode.Uri,
        preferredProject?: PbProjectDefinition,
        matchingProjects: readonly PbProjectDefinition[] = [],
    ): Promise<string> {
        const projectVersions = await Promise.all(projects.map(async project => ({
            uri: project.uri.toString(),
            name: project.name,
            version: await this.buildProjectArtifactVersionToken(project),
            libraryUris: project.libraryUris.map(uri => uri.toString()).sort(),
            appEntryUri: project.appEntryUri?.toString(),
        })));
        const indexedUriVersions = await Promise.all(this.index.getIndexedUris()
            .sort((left, right) => this.toRelativeWorkspacePath(left).localeCompare(this.toRelativeWorkspacePath(right)))
            .map(async uri => ({
            uri: uri.toString(),
            relativePath: this.toRelativeWorkspacePath(uri),
            version: await this.buildUriArtifactVersionToken(uri),
        })));

        return JSON.stringify({
            workspaceFolders: (vscode.workspace.workspaceFolders ?? []).map(folder => folder.uri.toString()).sort(),
            indexingExcludePatterns: getIndexingExcludePatterns(),
            retainedEffectiveRootKeys: Array.from(this.projectRegistry.getRetainedProjectRootKeys()).sort(),
            projectVersions,
            indexedUriVersions,
            buildableTargetVersions: await Promise.all(buildableTargets.map(async target => ({
                uri: target.uri.toString(),
                kind: target.kind,
                version: await this.buildUriArtifactVersionToken(target.uri),
                relatedProjectUris: target.relatedProjects.map(relation => relation.project.uri.toString()).sort(),
            }))),
            anchorUri: anchorUri?.toString(),
            anchorVersion: anchorUri ? await this.buildUriArtifactVersionToken(anchorUri) : undefined,
            preferredProjectUri: preferredProject?.uri.toString(),
            matchingProjectUris: matchingProjects.map(project => project.uri.toString()).sort(),
        });
    }

    private async buildUriArtifactVersionToken(uri: vscode.Uri): Promise<string> {
        const openDocument = vscode.workspace.textDocuments.find(document => document.uri.toString() === uri.toString());

        if (openDocument) {
            return `open:${openDocument.version}:${openDocument.isDirty ? 'dirty' : 'clean'}`;
        }

        const stat = await this.tryStatUri(uri);

        if (!stat) {
            return 'missing';
        }

        return `fs:${stat.mtime}:${stat.size}`;
    }

    private async tryStatUri(uri: vscode.Uri): Promise<vscode.FileStat | undefined> {
        try {
            return await vscode.workspace.fs.stat(uri);
        } catch {
            return undefined;
        }
    }

    private resolveWorkspaceManifestDiffInput(
        value: unknown,
    ): { manifest: WorkspaceManifestExportPayload; sourceKind: 'workspace-manifest' | 'workspace-artifact-bundle' } | undefined {
        if (this.isWorkspaceManifestExportPayload(value)) {
            return {
                manifest: value,
                sourceKind: 'workspace-manifest',
            };
        }

        if (this.isWorkspaceArtifactBundleExportPayload(value)) {
            return {
                manifest: value.bundle.workspaceManifest,
                sourceKind: 'workspace-artifact-bundle',
            };
        }

        return undefined;
    }

    private resolvePublicContractCatalogDiffInput(
        value: unknown,
    ): { catalog: PublicContractCatalogExportPayload; sourceKind: 'public-contract-catalog' | 'workspace-artifact-bundle' } | undefined {
        if (this.isPublicContractCatalogExportPayload(value)) {
            return {
                catalog: value,
                sourceKind: 'public-contract-catalog',
            };
        }

        if (this.isWorkspaceArtifactBundleExportPayload(value)) {
            return {
                catalog: value.bundle.publicContractCatalog,
                sourceKind: 'workspace-artifact-bundle',
            };
        }

        return undefined;
    }

    private buildPublicContractCatalogDiffPayload(
        leftCatalog: PublicContractCatalogExportPayload,
        rightCatalog: PublicContractCatalogExportPayload,
        leftSnapshotUri: vscode.Uri,
        rightSnapshotUri: vscode.Uri,
        leftSourceKind: 'public-contract-catalog' | 'workspace-artifact-bundle',
        rightSourceKind: 'public-contract-catalog' | 'workspace-artifact-bundle',
    ): PublicContractCatalogDiffExportPayload {
        const commandDiff = this.diffCollectionByKey(
            leftCatalog.commands,
            rightCatalog.commands,
            'command',
            ['title', 'payloadKind', 'acceptsArguments', 'schemaRelativePath', 'schemaPublished'],
        );
        const methodDiff = this.diffCollectionByKey(
            leftCatalog.extensionApi.methods,
            rightCatalog.extensionApi.methods,
            'name',
            ['command', 'payloadKind', 'acceptsArguments'],
        );
        const languageModelToolDiff = this.diffCollectionByKey(
            leftCatalog.languageModelTools,
            rightCatalog.languageModelTools,
            'name',
            ['description', 'tags', 'inputSchema', 'backedBy'],
        );
        const schemaDiff = this.diffCollectionByKey(
            leftCatalog.schemas,
            rightCatalog.schemas,
            'payloadKind',
            ['title', 'relativePath', 'schemaId'],
        );

        return {
            kind: 'powerbuilder-public-contract-catalog-diff',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            snapshotKind: 'powerbuilder-public-contract-catalog',
            inputs: {
                left: {
                    uri: leftSnapshotUri.toString(),
                    relativePath: this.toRelativeWorkspacePath(leftSnapshotUri),
                    sourceKind: leftSourceKind,
                    generatedAt: leftCatalog.generatedAt,
                },
                right: {
                    uri: rightSnapshotUri.toString(),
                    relativePath: this.toRelativeWorkspacePath(rightSnapshotUri),
                    sourceKind: rightSourceKind,
                    generatedAt: rightCatalog.generatedAt,
                },
            },
            summary: {
                addedCommands: commandDiff.added.length,
                removedCommands: commandDiff.removed.length,
                changedCommands: commandDiff.changed.length,
                addedApiMethods: methodDiff.added.length,
                removedApiMethods: methodDiff.removed.length,
                changedApiMethods: methodDiff.changed.length,
                addedLanguageModelTools: languageModelToolDiff.added.length,
                removedLanguageModelTools: languageModelToolDiff.removed.length,
                changedLanguageModelTools: languageModelToolDiff.changed.length,
                addedSchemas: schemaDiff.added.length,
                removedSchemas: schemaDiff.removed.length,
                changedSchemas: schemaDiff.changed.length,
            },
            commands: {
                added: commandDiff.added,
                removed: commandDiff.removed,
                changed: commandDiff.changed.map(entry => ({
                    command: entry.key,
                    changedFields: entry.changedFields,
                })),
            },
            extensionApi: {
                added: methodDiff.added,
                removed: methodDiff.removed,
                changed: methodDiff.changed.map(entry => ({
                    name: entry.key,
                    changedFields: entry.changedFields,
                })),
            },
            languageModelTools: {
                added: languageModelToolDiff.added,
                removed: languageModelToolDiff.removed,
                changed: languageModelToolDiff.changed.map(entry => ({
                    name: entry.key,
                    changedFields: entry.changedFields,
                })),
            },
            schemas: {
                added: schemaDiff.added,
                removed: schemaDiff.removed,
                changed: schemaDiff.changed.map(entry => ({
                    payloadKind: entry.key,
                    changedFields: entry.changedFields,
                })),
            },
        };
    }

    private buildWorkspaceArtifactBundleDiffPayload(
        leftBundle: WorkspaceArtifactBundleExportPayload,
        rightBundle: WorkspaceArtifactBundleExportPayload,
        leftSnapshotUri: vscode.Uri,
        rightSnapshotUri: vscode.Uri,
    ): WorkspaceArtifactBundleDiffExportPayload {
        const workspaceManifest = this.buildWorkspaceManifestDiffPayload(
            leftBundle.bundle.workspaceManifest,
            rightBundle.bundle.workspaceManifest,
            leftSnapshotUri,
            rightSnapshotUri,
            'workspace-artifact-bundle',
            'workspace-artifact-bundle',
        );
        const publicContractCatalog = this.buildPublicContractCatalogDiffPayload(
            leftBundle.bundle.publicContractCatalog,
            rightBundle.bundle.publicContractCatalog,
            leftSnapshotUri,
            rightSnapshotUri,
            'workspace-artifact-bundle',
            'workspace-artifact-bundle',
        );
        const automationCommandDiff = this.diffCollectionByKey(
            leftBundle.bundle.automationSurface.commands,
            rightBundle.bundle.automationSurface.commands,
            'command',
            ['title', 'mode', 'payloadKind', 'outputRelativePath', 'acceptsArguments', 'arguments', 'notes'],
        );
        const automationMethodDiff = this.diffCollectionByKey(
            leftBundle.bundle.automationSurface.extensionApi.methods,
            rightBundle.bundle.automationSurface.extensionApi.methods,
            'name',
            ['command', 'payloadKind', 'acceptsArguments'],
        );
        const automationToolDiff = this.diffCollectionByKey(
            leftBundle.bundle.automationSurface.languageModelTools,
            rightBundle.bundle.automationSurface.languageModelTools,
            'name',
            ['description', 'tags', 'inputSchema', 'backedBy'],
        );
        const artifactKinds = this.diffStringArrays(
            leftBundle.artifacts.map(artifact => artifact.artifactKind),
            rightBundle.artifacts.map(artifact => artifact.artifactKind),
        );
        const diagnosticsChangedProjects = rightBundle.bundle.workspaceDiagnosticsTree.projects
            .map(project => {
                const previous = leftBundle.bundle.workspaceDiagnosticsTree.projects.find(candidate => candidate.key === project.key);
                const previousIssueCount = previous?.issueCount ?? 0;

                return {
                    key: project.key,
                    issueDelta: project.issueCount - previousIssueCount,
                };
            })
            .filter(project => project.issueDelta !== 0)
            .sort((left, right) => left.key.localeCompare(right.key));
        const featureSupportPowerScriptDelta = this.buildSupportLevelDelta(
            leftBundle.bundle.featureSupportSnapshot.summary.powerScriptLevels,
            rightBundle.bundle.featureSupportSnapshot.summary.powerScriptLevels,
        );
        const featureSupportDataWindowDelta = this.buildSupportLevelDelta(
            leftBundle.bundle.featureSupportSnapshot.summary.dataWindowLevels,
            rightBundle.bundle.featureSupportSnapshot.summary.dataWindowLevels,
        );
        const buildSessionChangedFields: string[] = [];

        if (JSON.stringify(leftBundle.bundle.buildSessionManifest.summary) !== JSON.stringify(rightBundle.bundle.buildSessionManifest.summary)) {
            buildSessionChangedFields.push('summary');
        }

        if (JSON.stringify(leftBundle.bundle.buildSessionManifest.lastTarget) !== JSON.stringify(rightBundle.bundle.buildSessionManifest.lastTarget)) {
            buildSessionChangedFields.push('lastTarget');
        }

        if (JSON.stringify(leftBundle.bundle.buildSessionManifest.lastBuild) !== JSON.stringify(rightBundle.bundle.buildSessionManifest.lastBuild)) {
            buildSessionChangedFields.push('lastBuild');
        }

        const changedArtifactKinds = new Set<string>();

        if (this.hasWorkspaceManifestDiffChanges(workspaceManifest)) {
            changedArtifactKinds.add('workspace-manifest');
        }

        if (this.hasCollectionDiffChanges(automationCommandDiff)
            || this.hasCollectionDiffChanges(automationMethodDiff)
            || this.hasCollectionDiffChanges(automationToolDiff)) {
            changedArtifactKinds.add('automation-surface');
        }

        if (this.hasPublicContractCatalogDiffChanges(publicContractCatalog)) {
            changedArtifactKinds.add('public-contract-catalog');
        }

        if (rightBundle.bundle.workspaceDiagnosticsTree.summary.projectCount !== leftBundle.bundle.workspaceDiagnosticsTree.summary.projectCount
            || rightBundle.bundle.workspaceDiagnosticsTree.summary.objectCount !== leftBundle.bundle.workspaceDiagnosticsTree.summary.objectCount
            || rightBundle.bundle.workspaceDiagnosticsTree.summary.diagnosticCount !== leftBundle.bundle.workspaceDiagnosticsTree.summary.diagnosticCount
            || rightBundle.bundle.workspaceDiagnosticsTree.summary.errorCount !== leftBundle.bundle.workspaceDiagnosticsTree.summary.errorCount
            || rightBundle.bundle.workspaceDiagnosticsTree.summary.warningCount !== leftBundle.bundle.workspaceDiagnosticsTree.summary.warningCount) {
            changedArtifactKinds.add('workspace-diagnostics-tree');
        }

        if (rightBundle.bundle.featureSupportSnapshot.summary.featureCount !== leftBundle.bundle.featureSupportSnapshot.summary.featureCount
            || rightBundle.bundle.featureSupportSnapshot.summary.noteCount !== leftBundle.bundle.featureSupportSnapshot.summary.noteCount
            || featureSupportPowerScriptDelta.some(entry => entry.delta !== 0)
            || featureSupportDataWindowDelta.some(entry => entry.delta !== 0)) {
            changedArtifactKinds.add('feature-support-snapshot');
        }

        if (buildSessionChangedFields.length > 0) {
            changedArtifactKinds.add('build-session-manifest');
        }

        if (leftBundle.releaseValidationReport.status !== rightBundle.releaseValidationReport.status
            || JSON.stringify(leftBundle.releaseValidationReport.payload) !== JSON.stringify(rightBundle.releaseValidationReport.payload)) {
            changedArtifactKinds.add('release-validation-report');
        }

        const changedSections = new Set<string>([
            ...artifactKinds.added,
            ...artifactKinds.removed,
            ...changedArtifactKinds,
        ]);

        return {
            kind: 'powerbuilder-workspace-artifact-bundle-diff',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            snapshotKind: 'powerbuilder-workspace-artifact-bundle',
            inputs: {
                left: {
                    uri: leftSnapshotUri.toString(),
                    relativePath: this.toRelativeWorkspacePath(leftSnapshotUri),
                    generatedAt: leftBundle.generatedAt,
                },
                right: {
                    uri: rightSnapshotUri.toString(),
                    relativePath: this.toRelativeWorkspacePath(rightSnapshotUri),
                    generatedAt: rightBundle.generatedAt,
                },
            },
            summary: {
                addedArtifactKinds: artifactKinds.added.length,
                removedArtifactKinds: artifactKinds.removed.length,
                changedArtifactKinds: changedArtifactKinds.size,
                changedSections: changedSections.size,
            },
            artifacts: {
                added: artifactKinds.added,
                removed: artifactKinds.removed,
                changed: [...changedArtifactKinds].sort((left, right) => left.localeCompare(right)),
            },
            workspaceManifest,
            publicContractCatalog,
            automationSurface: {
                commands: {
                    added: automationCommandDiff.added,
                    removed: automationCommandDiff.removed,
                    changed: automationCommandDiff.changed.map(entry => ({
                        command: entry.key,
                        changedFields: entry.changedFields,
                    })),
                },
                extensionApi: {
                    added: automationMethodDiff.added,
                    removed: automationMethodDiff.removed,
                    changed: automationMethodDiff.changed.map(entry => ({
                        name: entry.key,
                        changedFields: entry.changedFields,
                    })),
                },
                languageModelTools: {
                    added: automationToolDiff.added,
                    removed: automationToolDiff.removed,
                    changed: automationToolDiff.changed.map(entry => ({
                        name: entry.key,
                        changedFields: entry.changedFields,
                    })),
                },
            },
            diagnostics: {
                summaryDelta: {
                    projectCount: rightBundle.bundle.workspaceDiagnosticsTree.summary.projectCount - leftBundle.bundle.workspaceDiagnosticsTree.summary.projectCount,
                    objectCount: rightBundle.bundle.workspaceDiagnosticsTree.summary.objectCount - leftBundle.bundle.workspaceDiagnosticsTree.summary.objectCount,
                    diagnosticCount: rightBundle.bundle.workspaceDiagnosticsTree.summary.diagnosticCount - leftBundle.bundle.workspaceDiagnosticsTree.summary.diagnosticCount,
                    errorCount: rightBundle.bundle.workspaceDiagnosticsTree.summary.errorCount - leftBundle.bundle.workspaceDiagnosticsTree.summary.errorCount,
                    warningCount: rightBundle.bundle.workspaceDiagnosticsTree.summary.warningCount - leftBundle.bundle.workspaceDiagnosticsTree.summary.warningCount,
                },
                changedProjects: diagnosticsChangedProjects,
            },
            featureSupport: {
                featureCountDelta: rightBundle.bundle.featureSupportSnapshot.summary.featureCount - leftBundle.bundle.featureSupportSnapshot.summary.featureCount,
                noteCountDelta: rightBundle.bundle.featureSupportSnapshot.summary.noteCount - leftBundle.bundle.featureSupportSnapshot.summary.noteCount,
                powerScriptLevelDelta: featureSupportPowerScriptDelta,
                dataWindowLevelDelta: featureSupportDataWindowDelta,
            },
            buildSession: {
                changed: buildSessionChangedFields.length > 0,
                changedFields: buildSessionChangedFields,
            },
            releaseValidationReport: {
                previousStatus: leftBundle.releaseValidationReport.status,
                nextStatus: rightBundle.releaseValidationReport.status,
                changed: leftBundle.releaseValidationReport.status !== rightBundle.releaseValidationReport.status
                    || JSON.stringify(leftBundle.releaseValidationReport.payload) !== JSON.stringify(rightBundle.releaseValidationReport.payload),
            },
        };
    }

    private diffCollectionByKey<T extends Record<string, unknown>, K extends keyof T & string>(
        left: readonly T[],
        right: readonly T[],
        key: K,
        fields: readonly (keyof T)[],
    ): { added: string[]; removed: string[]; changed: Array<{ key: string; changedFields: string[] }> } {
        const leftMap = new Map<string, T>(left.map(entry => [String(entry[key]), entry]));
        const rightMap = new Map<string, T>(right.map(entry => [String(entry[key]), entry]));
        const keyDiff = this.diffStringArrays([...leftMap.keys()], [...rightMap.keys()]);
        const changed: Array<{ key: string; changedFields: string[] }> = [];

        for (const entryKey of [...leftMap.keys()].filter(candidate => rightMap.has(candidate)).sort((a, b) => a.localeCompare(b))) {
            const leftEntry = leftMap.get(entryKey);
            const rightEntry = rightMap.get(entryKey);

            if (!leftEntry || !rightEntry) {
                continue;
            }

            const changedFields = fields
                .filter(field => JSON.stringify(leftEntry[field]) !== JSON.stringify(rightEntry[field]))
                .map(field => String(field))
                .sort((a, b) => a.localeCompare(b));

            if (changedFields.length > 0) {
                changed.push({
                    key: entryKey,
                    changedFields,
                });
            }
        }

        return {
            added: keyDiff.added,
            removed: keyDiff.removed,
            changed,
        };
    }

    private buildSupportLevelDelta(
        left: ReadonlyArray<{ level: string; count: number }>,
        right: ReadonlyArray<{ level: string; count: number }>,
    ): Array<{ level: string; delta: number }> {
        const leftMap = new Map(left.map(entry => [entry.level, entry.count]));
        const rightMap = new Map(right.map(entry => [entry.level, entry.count]));
        const levels = new Set<string>([
            ...left.map(entry => entry.level),
            ...right.map(entry => entry.level),
        ]);

        return [...levels]
            .map(level => ({
                level,
                delta: (rightMap.get(level) ?? 0) - (leftMap.get(level) ?? 0),
            }))
            .sort((leftEntry, rightEntry) => leftEntry.level.localeCompare(rightEntry.level));
    }

    private hasCollectionDiffChanges(
        diff: { added: string[]; removed: string[]; changed: Array<{ key: string; changedFields: string[] }> },
    ): boolean {
        return diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0;
    }

    private hasWorkspaceManifestDiffChanges(payload: WorkspaceManifestDiffExportPayload): boolean {
        return payload.summary.addedProjects > 0
            || payload.summary.removedProjects > 0
            || payload.summary.changedProjects > 0
            || payload.summary.addedBuildTargets > 0
            || payload.summary.removedBuildTargets > 0
            || payload.summary.changedBuildTargets > 0
            || payload.summary.addedRetainedRoots > 0
            || payload.summary.removedRetainedRoots > 0
            || payload.summary.preferredProjectChanged
            || payload.summary.preferredBuildTargetChanged
            || payload.summary.indexingAuditChanged
            || payload.summary.incrementalImpactChanged;
    }

    private hasPublicContractCatalogDiffChanges(payload: PublicContractCatalogDiffExportPayload): boolean {
        return payload.summary.addedCommands > 0
            || payload.summary.removedCommands > 0
            || payload.summary.changedCommands > 0
            || payload.summary.addedApiMethods > 0
            || payload.summary.removedApiMethods > 0
            || payload.summary.changedApiMethods > 0
            || payload.summary.addedLanguageModelTools > 0
            || payload.summary.removedLanguageModelTools > 0
            || payload.summary.changedLanguageModelTools > 0
            || payload.summary.addedSchemas > 0
            || payload.summary.removedSchemas > 0
            || payload.summary.changedSchemas > 0;
    }

    private diffStringArrays(
        left: readonly string[],
        right: readonly string[],
    ): { added: string[]; removed: string[] } {
        const leftSet = new Set(left);
        const rightSet = new Set(right);

        return {
            added: right.filter(value => !leftSet.has(value)).sort((a, b) => a.localeCompare(b)),
            removed: left.filter(value => !rightSet.has(value)).sort((a, b) => a.localeCompare(b)),
        };
    }

    private diffWorkspaceProjectEntry(
        left: ExportedWorkspaceProjectManifestEntry,
        right: ExportedWorkspaceProjectManifestEntry,
    ): string[] {
        const changedFields: string[] = [];
        const fields: Array<keyof ExportedWorkspaceProjectManifestEntry> = [
            'name',
            'projectDirectoryPath',
            'applicationName',
            'appEntry',
            'appEntryPath',
            'libraries',
            'libraryPaths',
            'effectiveRootPaths',
            'sourceRootPaths',
            'sourceRootKeys',
            'excludedRootPaths',
            'excludedRootKeys',
        ];

        for (const field of fields) {
            if (JSON.stringify(left[field]) !== JSON.stringify(right[field])) {
                changedFields.push(field);
            }
        }

        return changedFields.sort((a, b) => a.localeCompare(b));
    }

    private diffWorkspaceBuildTarget(
        left: ExportedBuildableTarget,
        right: ExportedBuildableTarget,
    ): string[] {
        const changedFields: string[] = [];

        if (left.kind !== right.kind) {
            changedFields.push('kind');
        }

        if (JSON.stringify(left.buildArgs) !== JSON.stringify(right.buildArgs)) {
            changedFields.push('buildArgs');
        }

        if (JSON.stringify(left.relatedProjects) !== JSON.stringify(right.relatedProjects)) {
            changedFields.push('relatedProjects');
        }

        return changedFields;
    }

    private buildWorkspaceIndexingAuditDelta(
        left: WorkspaceManifestIndexingAudit,
        right: WorkspaceManifestIndexingAudit,
    ): WorkspaceManifestDiffExportPayload['workspace']['indexingAudit']['delta'] {
        const unassigned = this.diffStringArrays(left.unassignedIndexedFiles, right.unassignedIndexedFiles);
        const stale = this.diffStringArrays(left.staleIndexedFiles, right.staleIndexedFiles);

        return {
            indexedFileCount: right.indexedFileCount - left.indexedFileCount,
            indexedSymbolCount: right.indexedSymbolCount - left.indexedSymbolCount,
            snapshotCacheEntryCount: right.snapshotCacheEntryCount - left.snapshotCacheEntryCount,
            artifactPayloadCacheEntryCount: right.artifactPayloadCacheEntryCount - left.artifactPayloadCacheEntryCount,
            unassignedIndexedFileCount: right.unassignedIndexedFileCount - left.unassignedIndexedFileCount,
            staleIndexedFileCount: right.staleIndexedFileCount - left.staleIndexedFileCount,
            addedUnassignedIndexedFiles: unassigned.added,
            removedUnassignedIndexedFiles: unassigned.removed,
            addedStaleIndexedFiles: stale.added,
            removedStaleIndexedFiles: stale.removed,
        };
    }

    private isSemanticProjectExportPayload(value: unknown): value is SemanticProjectExportPayload {
        return !!value
            && typeof value === 'object'
            && (value as { kind?: unknown }).kind === 'powerbuilder-semantic-project';
    }

    private isWorkspaceManifestExportPayload(value: unknown): value is WorkspaceManifestExportPayload {
        return !!value
            && typeof value === 'object'
            && (value as { kind?: unknown }).kind === 'powerbuilder-workspace-manifest';
    }

    private isPublicContractCatalogExportPayload(value: unknown): value is PublicContractCatalogExportPayload {
        return !!value
            && typeof value === 'object'
            && (value as { kind?: unknown }).kind === 'powerbuilder-public-contract-catalog';
    }

    private isWorkspaceArtifactBundleExportPayload(value: unknown): value is WorkspaceArtifactBundleExportPayload {
        return !!value
            && typeof value === 'object'
            && (value as { kind?: unknown }).kind === 'powerbuilder-workspace-artifact-bundle'
            && this.isWorkspaceManifestExportPayload((value as WorkspaceArtifactBundleExportPayload).bundle?.workspaceManifest);
    }

    private serializeWorkspaceProjectManifestEntry(
        project: PbProjectDefinition,
        anchorUri?: vscode.Uri,
        preferredProject?: PbProjectDefinition,
    ): ExportedWorkspaceProjectManifestEntry {
        const sourceRoots = this.projectRegistry.getProjectSourceRoots(project);
        const effectiveRootKeys = new Set(this.projectRegistry.getEffectiveProjectSourceRootKeys(project));
        const excludedRoots = sourceRoots.filter(rootUri => !effectiveRootKeys.has(normalizeWorkspaceUriPath(rootUri)));

        return {
            ...this.serializeProject(project),
            sourceRootPaths: sourceRoots.map(uri => this.toRelativeWorkspacePath(uri)),
            sourceRootKeys: this.projectRegistry.getProjectSourceRootKeys(project),
            excludedRootPaths: excludedRoots.map(uri => this.toRelativeWorkspacePath(uri)),
            excludedRootKeys: excludedRoots.map(uri => normalizeWorkspaceUriPath(uri)),
            matchScoreForAnchor: anchorUri
                ? this.projectRegistry.getProjectMatchScoreForSourceFile(anchorUri, project)
                : undefined,
            isPreferredForAnchor: preferredProject?.uri.toString() === project.uri.toString(),
        };
    }

    private collectProjectTypeSymbols(project: PbProjectDefinition): PbSymbol[] {
        return this.index.getIndexedUris()
            .filter(uri => this.projectRegistry.isSourceFileInProject(uri, project))
            .map(uri => this.index.getPrimaryFileObjectSymbol(uri))
            .filter((symbol): symbol is PbSymbol => !!symbol && (symbol.kind === 'type' || symbol.kind === 'structure'))
            .sort((left, right) => left.name.localeCompare(right.name) || left.uri.toString().localeCompare(right.uri.toString()));
    }

    private collectProjectImplementedCallables(project: PbProjectDefinition): PbSymbol[] {
        return this.index.getIndexedUris()
            .filter(uri => this.projectRegistry.isSourceFileInProject(uri, project))
            .flatMap(uri => this.index.getSymbolsForFile(uri))
            .filter(symbol => isCallableSymbol(symbol) && !symbol.isPrototype)
            .sort((left, right) => left.name.localeCompare(right.name) || left.uri.toString().localeCompare(right.uri.toString()));
    }

    private collectCallableInvocations(
        document: vscode.TextDocument,
        callable: PbSymbol,
    ): CollectedCallableInvocation[] {
        const invocations: CollectedCallableInvocation[] = [];
        const seen = new Set<string>();
        const invocationPattern = /([a-zA-Z_$#%][\w$#%`-]*)\s*\(/g;
        const excludedNames = new Set([
            'if',
            'elseif',
            'for',
            'while',
            'choose',
            'case',
            'return',
            'throw',
            'catch',
            'open',
            'close',
            'create',
            'destroy',
        ]);

        for (let line = callable.range.start.line; line <= callable.range.end.line; line++) {
            const lineText = document.lineAt(line).text;
            const lineOffset = line === callable.range.start.line
                ? callable.range.start.character
                : 0;
            const sliceEnd = line === callable.range.end.line
                ? callable.range.end.character
                : lineText.length;
            const scopedLineText = lineText.slice(lineOffset, sliceEnd);

            for (const match of scopedLineText.matchAll(invocationPattern)) {
                const name = match[1];

                if (!name || excludedNames.has(name.toLowerCase())) {
                    continue;
                }

                const startCharacter = lineOffset + match.index;
                const resolutionProbePosition = new vscode.Position(line, startCharacter + 1);

                if (callable.selectionRange.contains(resolutionProbePosition)) {
                    continue;
                }

                const openParenOffset = match[0].lastIndexOf('(');
                const callContextProbePosition = new vscode.Position(
                    line,
                    startCharacter + openParenOffset + 1,
                );
                const callContext = getSignatureCallContextAtPosition(document, callContextProbePosition);

                if (!callContext || callContext.name.toLowerCase() !== name.toLowerCase()) {
                    continue;
                }

                const key = [
                    line,
                    callContext.range.start.character,
                    callContext.range.end.character,
                    callContext.name.toLowerCase(),
                ].join('|');

                if (seen.has(key)) {
                    continue;
                }

                seen.add(key);
                const resolutionPosition = callContext.range.start.translate(
                    0,
                    Math.min(1, Math.max(0, callContext.range.end.character - callContext.range.start.character - 1)),
                );

                invocations.push({
                    name: callContext.name,
                    position: resolutionPosition,
                    range: callContext.range,
                    qualifiedOwner: callContext.qualifiedOwner,
                    qualifiedOwnerExpression: callContext.qualifiedOwnerExpression,
                    qualifier: callContext.qualifier,
                    providedArgumentCount: callContext.providedArgumentCount,
                });
            }
        }

        return invocations;
    }

    private resolveGraphOwnerName(symbol: PbSymbol): string | undefined {
        if (symbol.kind === 'type' || symbol.kind === 'structure') {
            return symbol.name;
        }

        return symbol.fileObjectName
            ?? symbol.ownerName
            ?? symbol.parent
            ?? symbol.containerName;
    }

    private serializeSymbol(symbol: PbSymbol): ExportedPbSymbol {
        return {
            persistentId: buildPersistentSymbolId(symbol, this.toRelativeWorkspacePath(symbol.uri)),
            name: symbol.name,
            kind: symbol.kind,
            uri: symbol.uri.toString(),
            relativePath: this.toRelativeWorkspacePath(symbol.uri),
            range: this.serializeRange(symbol.range),
            selectionRange: this.serializeRange(symbol.selectionRange),
            detail: symbol.detail,
            parent: symbol.parent,
            returnType: symbol.returnType,
            access: symbol.access,
            containerName: symbol.containerName,
            containerKind: symbol.containerKind,
            containerSignature: symbol.containerSignature,
            fileObjectName: symbol.fileObjectName,
            declarationScope: symbol.declarationScope,
            baseTypeName: symbol.baseTypeName,
            signature: symbol.signature,
            parameterCount: symbol.parameterCount,
            isPrototype: symbol.isPrototype,
            implementationKind: symbol.implementationKind,
            ownerName: symbol.ownerName,
            isExternal: symbol.isExternal,
            externalLibraryName: symbol.externalLibraryName,
            externalName: symbol.externalName,
        };
    }

    private serializeRange(range: vscode.Range): ExportedRange {
        return {
            start: {
                line: range.start.line,
                character: range.start.character,
            },
            end: {
                line: range.end.line,
                character: range.end.character,
            },
        };
    }

    private serializeLocation(location: vscode.Location): ExportedLocation {
        return {
            uri: location.uri.toString(),
            relativePath: this.toRelativeWorkspacePath(location.uri),
            range: this.serializeRange(location.range),
        };
    }

    private serializeDataWindowNode(node: PbDataWindowNode): {
        name: string;
        detail?: string;
        range: ExportedRange;
        selectionRange: ExportedRange;
    } {
        return {
            name: node.name,
            detail: node.detail,
            range: this.serializeRange(node.range),
            selectionRange: this.serializeRange(node.selectionRange),
        };
    }

    private serializeSystemRegistry(registry: PbSystemSymbolRegistry): Pick<RuntimeCatalogExportPayload, 'entries'> {
        return {
            entries: registry.entries.map(entry => this.serializeSystemEntry(entry)),
        };
    }

    private buildRuntimeCatalogTypingSummary(registry: PbSystemSymbolRegistry): RuntimeCatalogTypingSummary {
        const ownerKinds: Record<string, number> = {};
        const callableKinds: Record<string, number> = {};
        let overloadedEntryCount = 0;
        let entryCountWithParameterLabels = 0;
        let entryCountWithExplicitParameterMetadata = 0;
        let entryCountWithDerivedReturnType = 0;
        let obsoleteWithReplacementCount = 0;

        for (const entry of registry.entries) {
            const typing = this.buildRuntimeTypingMetadata(entry);
            ownerKinds[typing.ownerKind] = (ownerKinds[typing.ownerKind] ?? 0) + 1;
            callableKinds[typing.callableKind] = (callableKinds[typing.callableKind] ?? 0) + 1;

            if (typing.overloaded) {
                overloadedEntryCount += 1;
            }

            if (typing.signatureShapes.some(shape => shape.parameterCount > 0)) {
                entryCountWithParameterLabels += 1;
            }

            if (typing.explicitParameterMetadata) {
                entryCountWithExplicitParameterMetadata += 1;
            }

            if (typing.derivedReturnType) {
                entryCountWithDerivedReturnType += 1;
            }

            if (entry.obsolete && entry.replacement) {
                obsoleteWithReplacementCount += 1;
            }
        }

        return {
            overloadedEntryCount,
            entryCountWithParameterLabels,
            entryCountWithExplicitParameterMetadata,
            entryCountWithDerivedReturnType,
            obsoleteWithReplacementCount,
            ownerKinds,
            callableKinds,
        };
    }

    private buildRuntimeCatalogIndexes(registry: PbSystemSymbolRegistry): RuntimeCatalogIndexes {
        return {
            domains: this.buildRuntimeCatalogDomainIndex(registry),
            ownerTypes: this.buildRuntimeCatalogOwnerTypeIndex(registry),
            returnTypes: this.buildRuntimeCatalogReturnTypeIndex(registry),
        };
    }

    private buildRuntimeCatalogDomainIndex(registry: PbSystemSymbolRegistry): RuntimeCatalogDomainIndexEntry[] {
        return Array.from(registry.indexes.byDomain.entries())
            .map(([domain, entries]) => ({
                domain,
                entryCount: entries.length,
                overloadedEntryCount: entries.filter(entry => entry.signatures.length > 1).length,
                ownerTypeCount: new Set(entries.flatMap(entry => entry.normalizedOwnerTypes)).size,
                entryCountWithDerivedReturnType: entries.filter(entry => this.buildRuntimeTypingMetadata(entry).derivedReturnType).length,
                obsoleteCount: entries.filter(entry => entry.obsolete).length,
                replacementCount: entries.filter(entry => !!entry.replacement).length,
            }))
            .sort((left, right) => left.domain.localeCompare(right.domain));
    }

    private buildRuntimeCatalogOwnerTypeIndex(registry: PbSystemSymbolRegistry): RuntimeCatalogOwnerTypeIndexEntry[] {
        return Array.from(registry.indexes.byOwnerType.entries())
            .map(([ownerType, entries]) => ({
                ownerType,
                entryCount: entries.length,
                callableCount: entries.filter(entry => entry.kind === 'callable').length,
                eventCount: entries.filter(entry => entry.kind === 'event').length,
                domains: Array.from(new Set(entries.map(entry => entry.domain))).sort((left, right) => left.localeCompare(right)),
                sampleNames: Array.from(new Set(entries.map(entry => entry.name))).sort((left, right) => left.localeCompare(right)).slice(0, 5),
            }))
            .sort((left, right) => left.ownerType.localeCompare(right.ownerType));
    }

    private buildRuntimeCatalogReturnTypeIndex(registry: PbSystemSymbolRegistry): RuntimeCatalogReturnTypeIndexEntry[] {
        const returnTypes = new Map<string, { count: number; names: Set<string> }>();

        for (const entry of registry.entries) {
            const derivedReturnType = this.buildRuntimeTypingMetadata(entry).derivedReturnType;

            if (!derivedReturnType) {
                continue;
            }

            const bucket = returnTypes.get(derivedReturnType) ?? { count: 0, names: new Set<string>() };
            bucket.count += 1;
            bucket.names.add(entry.name);
            returnTypes.set(derivedReturnType, bucket);
        }

        return Array.from(returnTypes.entries())
            .map(([returnType, value]) => ({
                returnType,
                entryCount: value.count,
                sampleNames: Array.from(value.names).sort((left, right) => left.localeCompare(right)).slice(0, 5),
            }))
            .sort((left, right) => left.returnType.localeCompare(right.returnType));
    }

    private serializeSystemEntry(entry: PbSystemSymbolEntry): ExportedSystemSymbolEntry {
        return {
            id: entry.id,
            name: entry.name,
            normalizedName: entry.normalizedName,
            kind: entry.kind,
            namespace: entry.namespace,
            invocation: entry.invocation,
            domain: entry.domain,
            category: entry.category,
            summary: entry.summary,
            signatures: entry.signatures,
            dataset: entry.dataset,
            source: entry.source,
            sourceUrl: entry.sourceUrl,
            appliesTo: entry.appliesTo,
            ownerTypes: entry.ownerTypes,
            lookupAliases: entry.lookupAliases,
            obsolete: entry.obsolete,
            obsoleteMessage: entry.obsoleteMessage,
            replacement: entry.replacement,
            provenance: entry.provenance,
            typing: this.buildRuntimeTypingMetadata(entry),
        };
    }

    private buildRuntimeTypingMetadata(entry: PbSystemSymbolEntry): ExportedRuntimeTypingMetadata {
        const signatureShapes = entry.signatures.map(signature => this.buildRuntimeSignatureShape(signature));
        const derivedReturnTypes = Array.from(new Set(signatureShapes
            .map(shape => shape.derivedReturnType)
            .filter((value): value is string => typeof value === 'string' && value.length > 0)));

        return {
            callableKind: this.mapRuntimeCallableKind(entry),
            ownerKind: entry.invocation === 'global'
                ? 'global'
                : (entry.ownerTypes?.length ?? 0) > 0
                    ? 'typed-owner'
                    : 'untyped-owner',
            ownerTypeCount: entry.normalizedOwnerTypes.length,
            signatureCount: entry.signatures.length,
            overloaded: entry.signatures.length > 1,
            explicitParameterMetadata: entry.signatures.some(signature => (signature.parameters?.length ?? 0) > 0),
            derivedReturnType: derivedReturnTypes.length === 1 ? derivedReturnTypes[0] : undefined,
            derivedReturnTypeSource: derivedReturnTypes.length === 1 ? 'signature-prefix' : 'none',
            signatureShapes,
        };
    }

    private buildRuntimeSignatureShape(signature: PbSystemSymbolSignature): ExportedRuntimeSignatureShape {
        const rawParameterLabels = signature.parameters?.length
            ? signature.parameters.map(parameter => parameter.label)
            : splitRuntimeCatalogSignatureParameters(signature.label);
        const parameterLabels = rawParameterLabels
            .map(normalizeRuntimeCatalogParameterLabel)
            .filter((label): label is string => label.length > 0);
        const derivedReturnType = deriveRuntimeCatalogReturnType(signature);

        return {
            label: signature.label,
            parameterLabels,
            parameterLabelSource: signature.parameters?.length
                ? 'explicit'
                : parameterLabels.length > 0
                    ? 'parsed-label'
                    : 'none',
            parameterCount: parameterLabels.length,
            optionalParameterCount: rawParameterLabels.filter(label => /[{}?]/.test(label)).length,
            derivedReturnType,
            derivedReturnTypeSource: derivedReturnType ? 'signature-prefix' : 'none',
        };
    }

    private mapRuntimeCallableKind(entry: PbSystemSymbolEntry): ExportedRuntimeTypingMetadata['callableKind'] {
        if (entry.kind === 'statement') {
            return 'statement';
        }

        if (entry.domain === 'system-events') {
            return 'system-event';
        }

        if (entry.domain === 'datawindow-events') {
            return 'datawindow-event';
        }

        if (entry.domain === 'datawindow-functions') {
            return 'datawindow-function';
        }

        if (entry.domain === 'object-functions') {
            return 'object-function';
        }

        return 'global-function';
    }

    private async buildHostContributionInventoryPayload(
        anchorUri?: vscode.Uri,
    ): Promise<HostContributionInventoryExportPayload> {
        const automationSurface = await this.generateAutomationSurfaceManifestExport(anchorUri);
        const packageContributions = this.getExtensionPackageContributions();
        const registeredCommands = new Set(await vscode.commands.getCommands(true));
        const reflectedLanguageModelTools = this.getHostReflectedLanguageModelToolNames();
        const reflectedLanguageModelToolSet = new Set(reflectedLanguageModelTools ?? []);
        const automationCommands = new Set(automationSurface.payload.commands.map(command => command.command));
        const apiCommandSet = new Set(automationSurface.payload.extensionApi.methods.map(method => method.command));
        const toolBackedByCommand = new Map(
            automationSurface.payload.languageModelTools.map(tool => [tool.name, tool.backedBy.command]),
        );

        return {
            kind: 'powerbuilder-host-contribution-inventory',
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            summary: {
                declaredCommandCount: packageContributions.commands.length,
                registeredCommandCount: packageContributions.commands.filter(command => registeredCommands.has(command.command)).length,
                declaredLanguageModelToolCount: packageContributions.languageModelTools.length,
                hostReflectedLanguageModelToolCount: packageContributions.languageModelTools.filter(
                    tool => reflectedLanguageModelToolSet.has(tool.name),
                ).length,
                viewCount: packageContributions.views.length,
                extensionApiMethodCount: automationSurface.payload.extensionApi.methods.length,
            },
            host: {
                vscodeVersion: vscode.version,
                languageModelToolsApiAvailable: Boolean((vscode as unknown as { lm?: unknown }).lm),
                reflectedLanguageModelToolsAvailable: Array.isArray(reflectedLanguageModelTools),
            },
            commands: packageContributions.commands.map(command => ({
                command: command.command,
                title: command.title,
                registered: registeredCommands.has(command.command),
                structured: automationCommands.has(command.command),
                exportedByApi: apiCommandSet.has(command.command),
            })),
            extensionApiMethods: automationSurface.payload.extensionApi.methods.map(method => ({
                name: method.name,
                command: method.command,
                payloadKind: method.payloadKind,
                acceptsArguments: method.acceptsArguments,
                registered: registeredCommands.has(method.command),
            })),
            languageModelTools: packageContributions.languageModelTools.map(tool => ({
                name: tool.name,
                backedByCommand: toolBackedByCommand.get(tool.name),
                hostReflected: reflectedLanguageModelToolSet.has(tool.name),
            })),
            views: packageContributions.views,
        };
    }

    private getExtensionPackageContributions(): {
        commands: Array<{ command: string; title?: string }>;
        languageModelTools: Array<{ name: string }>;
        views: Array<{ container: string; id: string; name: string; when?: string }>;
    } {
        const extension = vscode.extensions.getExtension(POWERBUILDER_EXTENSION_ID);
        const packageJson = extension?.packageJSON as {
            contributes?: {
                commands?: Array<{ command?: string; title?: string }>;
                languageModelTools?: Array<{ name?: string }>;
                views?: Record<string, Array<{ id?: string; name?: string; when?: string }>>;
            };
        } | undefined;
        const commands = (packageJson?.contributes?.commands ?? [])
            .filter((command): command is { command: string; title?: string } => typeof command.command === 'string')
            .map(command => ({
                command: command.command,
                title: command.title,
            }));
        const languageModelTools = (packageJson?.contributes?.languageModelTools ?? [])
            .filter((tool): tool is { name: string } => typeof tool.name === 'string')
            .map(tool => ({ name: tool.name }));
        const views = Object.entries(packageJson?.contributes?.views ?? {}).flatMap(([container, entries]) =>
            (entries ?? [])
                .filter((entry): entry is { id: string; name: string; when?: string } =>
                    typeof entry.id === 'string' && typeof entry.name === 'string',
                )
                .map(entry => ({
                    container,
                    id: entry.id,
                    name: entry.name,
                    when: entry.when,
                })),
        );

        return {
            commands,
            languageModelTools,
            views,
        };
    }

    private getHostReflectedLanguageModelToolNames(): string[] | undefined {
        const languageModelHost = (vscode as unknown as {
            lm?: {
                tools?: Array<{ name?: string }>;
            };
        }).lm;
        const tools = languageModelHost?.tools;

        if (!Array.isArray(tools)) {
            return undefined;
        }

        return tools
            .map(tool => tool?.name)
            .filter((name): name is string => typeof name === 'string');
    }

    private describeAutomationReplayResult(result: unknown): {
        outputKind: 'structured-result' | 'generated-file' | 'no-result';
        outputRelativePath?: string;
        result?: unknown;
    } {
        if (result === undefined) {
            return {
                outputKind: 'no-result',
            };
        }

        const serializableResult = this.toSerializableAutomationReplayValue(result);

        if (serializableResult && typeof serializableResult === 'object' && !Array.isArray(serializableResult)) {
            const fileEntry = (serializableResult as {
                file?: {
                    relativePath?: unknown;
                };
            }).file;

            if (fileEntry && typeof fileEntry.relativePath === 'string') {
                return {
                    outputKind: 'generated-file',
                    outputRelativePath: fileEntry.relativePath,
                    result: serializableResult,
                };
            }
        }

        return {
            outputKind: 'structured-result',
            result: serializableResult,
        };
    }

    private toSerializableAutomationReplayValue(value: unknown): unknown {
        if (value === undefined) {
            return undefined;
        }

        try {
            return JSON.parse(JSON.stringify(value, (_key, currentValue) => {
                if (currentValue instanceof vscode.Uri) {
                    return currentValue.toString();
                }

                if (currentValue instanceof Error) {
                    return {
                        name: currentValue.name,
                        message: currentValue.message,
                    };
                }

                return currentValue;
            })) as unknown;
        } catch (error) {
            return {
                serializationError: this.describeAutomationReplayError(error),
            };
        }
    }

    private describeAutomationReplayError(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }

        if (typeof error === 'string') {
            return error;
        }

        try {
            return JSON.stringify(error);
        } catch {
            return 'Unknown automation replay error';
        }
    }

    private buildExportTarget(uri: vscode.Uri, relativePathSuffix: string): PowerBuilderGeneratedJsonFile {
        const workspaceFolder = this.getWorkspaceFolderForUri(uri);
        const relativePath = `${EXPORT_ROOT_RELATIVE_DIR}/${relativePathSuffix}`;
        const absolutePath = path.join(workspaceFolder.uri.fsPath, ...relativePath.split('/'));

        return {
            uri: vscode.Uri.file(absolutePath),
            relativePath,
        };
    }

    private async resolvePreferredProjectForDocument(uri: vscode.Uri): Promise<PbProjectDefinition | undefined> {
        await this.workspaceIndexer.indexProjects({ indexSourceFiles: false });
        return this.workspaceIndexer.getPreferredProjectForSourceFile(uri);
    }

    private async writeJsonFile(uri: vscode.Uri, payload: unknown): Promise<void> {
        await fs.mkdir(path.dirname(uri.fsPath), { recursive: true });
        await fs.writeFile(uri.fsPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    }

    private getWorkspaceFolderForUri(uri: vscode.Uri): vscode.WorkspaceFolder {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri) ?? vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            throw new Error('Expected an opened workspace folder to write generated JSON artifacts.');
        }

        return workspaceFolder;
    }

    private toRelativeWorkspacePath(uri: vscode.Uri): string {
        return (vscode.workspace.asRelativePath(uri, false) || uri.path).replace(/\\/g, '/');
    }
}

function isCallableSymbol(symbol: PbSymbol): boolean {
    return symbol.kind === 'function'
        || symbol.kind === 'global-function'
        || symbol.kind === 'subroutine'
        || symbol.kind === 'event';
}

function rangeContainsRange(outer: vscode.Range, inner: vscode.Range): boolean {
    return !inner.start.isBefore(outer.start) && !inner.end.isAfter(outer.end);
}

function sanitizeSegment(value: string): string {
    const sanitized = value
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return sanitized || '_';
}

function normalizeIdentifier(value?: string): string {
    return value?.trim().toLowerCase() ?? '';
}

export function buildPersistentSymbolId(symbol: PbSymbol, relativePath: string): string {
    const source = [
        relativePath.toLowerCase(),
        symbol.kind,
        symbol.fileObjectName?.toLowerCase() ?? '',
        symbol.containerName?.toLowerCase() ?? '',
        symbol.ownerName?.toLowerCase() ?? '',
        symbol.name.toLowerCase(),
        symbol.signature?.trim().toLowerCase() ?? '',
        symbol.returnType?.trim().toLowerCase() ?? '',
        symbol.baseTypeName?.trim().toLowerCase() ?? '',
        symbol.declarationScope ?? '',
        symbol.implementationKind ?? '',
        symbol.parameterCount ?? '',
        symbol.isPrototype ? 'prototype' : 'implementation',
        symbol.isExternal ? 'external' : 'internal',
    ].join('|');

    return createHash('sha1').update(source).digest('hex');
}