const JSON_SCHEMA_DRAFT_URL = 'https://json-schema.org/draft/2020-12/schema';

type JsonSchemaPrimitiveType = 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';

type JsonSchemaConstValue = string | number | boolean | null;

export interface PublicContractJsonSchema {
    $schema?: string;
    $id?: string;
    title?: string;
    description?: string;
    type?: JsonSchemaPrimitiveType;
    const?: JsonSchemaConstValue;
    enum?: JsonSchemaConstValue[];
    properties?: Record<string, PublicContractJsonSchema>;
    required?: string[];
    items?: PublicContractJsonSchema;
    additionalProperties?: boolean | PublicContractJsonSchema;
}

export interface PublicContractSchemaDescriptor {
    payloadKind: string;
    relativePath: string;
    schema: PublicContractJsonSchema;
}

export interface PublicContractValidationIssue {
    path: string;
    message: string;
}

export interface PublicContractValidationResult {
    valid: boolean;
    issues: PublicContractValidationIssue[];
}

const anySchema: PublicContractJsonSchema = {};

function stringSchema(): PublicContractJsonSchema {
    return { type: 'string' };
}

function numberSchema(): PublicContractJsonSchema {
    return { type: 'number' };
}

function integerSchema(): PublicContractJsonSchema {
    return { type: 'integer' };
}

function booleanSchema(): PublicContractJsonSchema {
    return { type: 'boolean' };
}

function arraySchema(items: PublicContractJsonSchema): PublicContractJsonSchema {
    return {
        type: 'array',
        items,
    };
}

function objectSchema(
    required: string[],
    properties: Record<string, PublicContractJsonSchema>,
    additionalProperties: boolean | PublicContractJsonSchema = true,
): PublicContractJsonSchema {
    return {
        type: 'object',
        properties,
        required,
        additionalProperties,
    };
}

function constStringSchema(value: string): PublicContractJsonSchema {
    return {
        type: 'string',
        const: value,
    };
}

function generatedPayloadSchema(
    payloadKind: string,
    title: string,
    description: string,
    required: string[],
    properties: Record<string, PublicContractJsonSchema>,
): PublicContractJsonSchema {
    return {
        $schema: JSON_SCHEMA_DRAFT_URL,
        $id: `https://github.com/dlsanchez-hiberuscom/almunia-powersyntax/schemas/${payloadKind}.schema.json`,
        title,
        description,
        ...objectSchema(
            ['kind', 'schemaVersion', 'generatedAt', ...required],
            {
                kind: constStringSchema(payloadKind),
                schemaVersion: integerSchema(),
                generatedAt: stringSchema(),
                ...properties,
            },
            true,
        ),
    };
}

const exportedPositionSchema = objectSchema(
    ['line', 'character'],
    {
        line: integerSchema(),
        character: integerSchema(),
    },
);

const exportedRangeSchema = objectSchema(
    ['start', 'end'],
    {
        start: exportedPositionSchema,
        end: exportedPositionSchema,
    },
);

const exportedLocationSchema = objectSchema(
    ['uri', 'relativePath', 'range'],
    {
        uri: stringSchema(),
        relativePath: stringSchema(),
        range: exportedRangeSchema,
    },
    true,
);

const exportedProjectSchema = objectSchema(
    ['uri', 'relativePath', 'name', 'projectDirectoryPath', 'libraries', 'libraryPaths', 'effectiveRootPaths'],
    {
        uri: stringSchema(),
        relativePath: stringSchema(),
        name: stringSchema(),
        projectDirectoryPath: stringSchema(),
        applicationName: stringSchema(),
        appEntry: stringSchema(),
        appEntryPath: stringSchema(),
        libraries: arraySchema(stringSchema()),
        libraryPaths: arraySchema(stringSchema()),
        effectiveRootPaths: arraySchema(stringSchema()),
    },
    true,
);

const exportedSymbolSchema = objectSchema(
    ['persistentId', 'name', 'kind', 'uri', 'relativePath', 'range', 'selectionRange'],
    {
        persistentId: stringSchema(),
        name: stringSchema(),
        kind: stringSchema(),
        uri: stringSchema(),
        relativePath: stringSchema(),
        range: exportedRangeSchema,
        selectionRange: exportedRangeSchema,
    },
    true,
);

const publicContractSchemaEntrySchema = objectSchema(
    ['payloadKind', 'title', 'relativePath', 'schemaId'],
    {
        payloadKind: stringSchema(),
        title: stringSchema(),
        relativePath: stringSchema(),
        schemaId: stringSchema(),
    },
    true,
);

const automationSurfaceCommandSchema = objectSchema(
    ['command', 'title', 'mode', 'acceptsArguments', 'notes'],
    {
        command: stringSchema(),
        title: stringSchema(),
        mode: stringSchema(),
        payloadKind: stringSchema(),
        outputRelativePath: stringSchema(),
        acceptsArguments: booleanSchema(),
        arguments: arraySchema(objectSchema(
            ['name', 'type', 'required', 'description'],
            {
                name: stringSchema(),
                type: stringSchema(),
                required: booleanSchema(),
                description: stringSchema(),
            },
            true,
        )),
        notes: arraySchema(stringSchema()),
        schemaRelativePath: stringSchema(),
        schemaPublished: booleanSchema(),
    },
    true,
);

const languageModelToolSchema = objectSchema(
    ['name', 'description', 'tags', 'backedBy'],
    {
        name: stringSchema(),
        description: stringSchema(),
        tags: arraySchema(stringSchema()),
        inputSchema: anySchema,
        backedBy: objectSchema(
            ['command', 'acceptsArguments'],
            {
                command: stringSchema(),
                payloadKind: stringSchema(),
                acceptsArguments: booleanSchema(),
            },
            true,
        ),
    },
    true,
);

const automationSurfaceExtensionMethodSchema = objectSchema(
    ['name', 'command', 'acceptsArguments'],
    {
        name: stringSchema(),
        command: stringSchema(),
        payloadKind: stringSchema(),
        acceptsArguments: booleanSchema(),
    },
    true,
);

const semanticDocumentSchema = generatedPayloadSchema(
    'powerbuilder-semantic-document',
    'PowerBuilder Semantic Document',
    'Contrato público mínimo del export JSON de documento semántico.',
    ['document', 'symbols', 'callables', 'scopes'],
    {
        document: objectSchema(
            ['uri', 'relativePath', 'languageId'],
            {
                uri: stringSchema(),
                relativePath: stringSchema(),
                languageId: stringSchema(),
                objectName: stringSchema(),
            },
            true,
        ),
        project: exportedProjectSchema,
        symbols: arraySchema(exportedSymbolSchema),
        callables: arraySchema(exportedSymbolSchema),
        scopes: arraySchema(objectSchema(
            ['callable', 'parameters', 'locals'],
            {
                callable: exportedSymbolSchema,
                parameters: arraySchema(exportedSymbolSchema),
                locals: arraySchema(exportedSymbolSchema),
            },
            true,
        )),
        currentQuery: anySchema,
    },
);

const semanticProjectSchema = generatedPayloadSchema(
    'powerbuilder-semantic-project',
    'PowerBuilder Semantic Project',
    'Contrato público mínimo del snapshot JSON de proyecto semántico.',
    ['project', 'summary', 'files'],
    {
        project: exportedProjectSchema,
        summary: objectSchema(
            ['fileCount', 'symbolCount', 'callableCount', 'typeCount'],
            {
                fileCount: integerSchema(),
                symbolCount: integerSchema(),
                callableCount: integerSchema(),
                typeCount: integerSchema(),
            },
            true,
        ),
        files: arraySchema(objectSchema(
            ['uri', 'relativePath', 'symbols', 'callables'],
            {
                uri: stringSchema(),
                relativePath: stringSchema(),
                objectName: stringSchema(),
                symbols: arraySchema(exportedSymbolSchema),
                callables: arraySchema(exportedSymbolSchema),
            },
            true,
        )),
    },
);

const semanticQuerySchema = generatedPayloadSchema(
    'powerbuilder-semantic-query',
    'PowerBuilder Semantic Query',
    'Contrato público mínimo de la query semántica estructurada.',
    ['document', 'query'],
    {
        document: objectSchema(
            ['uri', 'relativePath', 'word', 'selectionRange'],
            {
                uri: stringSchema(),
                relativePath: stringSchema(),
                word: stringSchema(),
                selectionRange: exportedRangeSchema,
            },
            true,
        ),
        project: exportedProjectSchema,
        query: objectSchema(
            ['symbol', 'hover', 'definition', 'declaration', 'implementation', 'references', 'renameTarget'],
            {
                symbol: objectSchema(
                    ['precision', 'reasons', 'evidence', 'symbols'],
                    {
                        precision: stringSchema(),
                        reasons: arraySchema(anySchema),
                        evidence: arraySchema(anySchema),
                        primarySymbol: exportedSymbolSchema,
                        symbols: arraySchema(exportedSymbolSchema),
                    },
                    true,
                ),
                hover: objectSchema(
                    ['precision', 'reasons', 'evidence'],
                    {
                        precision: stringSchema(),
                        reasons: arraySchema(anySchema),
                        evidence: arraySchema(anySchema),
                    },
                    true,
                ),
                definition: objectSchema(
                    ['precision', 'reasons', 'evidence', 'symbols', 'locations'],
                    {
                        precision: stringSchema(),
                        reasons: arraySchema(anySchema),
                        evidence: arraySchema(anySchema),
                        symbols: arraySchema(exportedSymbolSchema),
                        locations: arraySchema(exportedLocationSchema),
                    },
                    true,
                ),
                declaration: objectSchema(
                    ['precision', 'reasons', 'evidence', 'symbols', 'locations'],
                    {
                        precision: stringSchema(),
                        reasons: arraySchema(anySchema),
                        evidence: arraySchema(anySchema),
                        symbols: arraySchema(exportedSymbolSchema),
                        locations: arraySchema(exportedLocationSchema),
                    },
                    true,
                ),
                implementation: objectSchema(
                    ['precision', 'reasons', 'evidence', 'symbols', 'locations'],
                    {
                        precision: stringSchema(),
                        reasons: arraySchema(anySchema),
                        evidence: arraySchema(anySchema),
                        symbols: arraySchema(exportedSymbolSchema),
                        locations: arraySchema(exportedLocationSchema),
                    },
                    true,
                ),
                references: objectSchema(
                    ['precision', 'reasons', 'evidence', 'locations', 'plan', 'query'],
                    {
                        precision: stringSchema(),
                        reasons: arraySchema(anySchema),
                        evidence: arraySchema(anySchema),
                        locations: arraySchema(exportedLocationSchema),
                        plan: anySchema,
                        query: anySchema,
                    },
                    true,
                ),
                renameTarget: objectSchema(
                    ['canRename', 'precision', 'reasons', 'evidence'],
                    {
                        canRename: booleanSchema(),
                        precision: stringSchema(),
                        reasons: arraySchema(anySchema),
                        evidence: arraySchema(anySchema),
                        renameTarget: anySchema,
                        plan: anySchema,
                    },
                    true,
                ),
            },
            true,
        ),
    },
);

const overloadResolutionExplanationSchema = generatedPayloadSchema(
    'powerbuilder-overload-resolution-explanation',
    'PowerBuilder Overload Resolution Explanation',
    'Contrato público mínimo de la explicación auditable de resolución de overloads.',
    ['document', 'call', 'resolution'],
    {
        document: objectSchema(
            ['uri', 'relativePath'],
            {
                uri: stringSchema(),
                relativePath: stringSchema(),
            },
            true,
        ),
        project: exportedProjectSchema,
        call: objectSchema(
            ['name', 'range', 'activeParameter', 'providedArgumentCount', 'hasAnyArgumentText', 'currentParameterHasContent', 'isDynamicDispatch', 'isAncestorControlCall'],
            {
                name: stringSchema(),
                range: exportedRangeSchema,
                activeParameter: integerSchema(),
                providedArgumentCount: integerSchema(),
                hasAnyArgumentText: booleanSchema(),
                currentParameterHasContent: booleanSchema(),
                qualifiedOwner: stringSchema(),
                qualifiedOwnerExpression: stringSchema(),
                qualifier: stringSchema(),
                isDynamicDispatch: booleanSchema(),
                dynamicDispatchKind: stringSchema(),
                isAncestorControlCall: booleanSchema(),
            },
            true,
        ),
        resolution: objectSchema(
            ['precision', 'reasons', 'evidence', 'resolutionKind', 'shouldProvideHelp', 'candidateCount', 'candidates'],
            {
                precision: stringSchema(),
                reasons: arraySchema(anySchema),
                evidence: arraySchema(anySchema),
                resolutionKind: stringSchema(),
                shouldProvideHelp: booleanSchema(),
                candidateCount: integerSchema(),
                selectedCandidate: exportedSymbolSchema,
                candidates: arraySchema(exportedSymbolSchema),
                systemEntry: anySchema,
            },
            true,
        ),
    },
);

const visibilityAuditSchema = generatedPayloadSchema(
    'powerbuilder-visibility-audit',
    'PowerBuilder Visibility Audit',
    'Contrato público mínimo de la auditoría de visibilidad y API sobrante.',
    ['summary', 'projects', 'symbols'],
    {
        summary: objectSchema(
            ['projectCount', 'candidateCount', 'auditedCount', 'unconsumedCount', 'degradeCandidateCount', 'unverifiableCount'],
            {
                projectCount: integerSchema(),
                candidateCount: integerSchema(),
                auditedCount: integerSchema(),
                unconsumedCount: integerSchema(),
                degradeCandidateCount: integerSchema(),
                unverifiableCount: integerSchema(),
            },
            true,
        ),
        projects: arraySchema(objectSchema(
            ['name', 'candidateCount', 'auditedCount', 'unconsumedCount', 'degradeCandidateCount', 'unverifiableCount'],
            {
                name: stringSchema(),
                project: exportedProjectSchema,
                candidateCount: integerSchema(),
                auditedCount: integerSchema(),
                unconsumedCount: integerSchema(),
                degradeCandidateCount: integerSchema(),
                unverifiableCount: integerSchema(),
            },
            true,
        )),
        symbols: arraySchema(objectSchema(
            ['symbol', 'normalizedAccess', 'referenceCount', 'sameTypeReferenceCount', 'hierarchyReferenceCount', 'externalReferenceCount', 'consumerTypeNames', 'classification'],
            {
                symbol: exportedSymbolSchema,
                project: exportedProjectSchema,
                normalizedAccess: stringSchema(),
                referenceCount: integerSchema(),
                sameTypeReferenceCount: integerSchema(),
                hierarchyReferenceCount: integerSchema(),
                externalReferenceCount: integerSchema(),
                consumerTypeNames: arraySchema(stringSchema()),
                classification: stringSchema(),
                suggestedAccess: stringSchema(),
            },
            true,
        )),
    },
);

const dataWindowWorkspaceCatalogSchema = generatedPayloadSchema(
    'powerbuilder-datawindow-workspace-catalog',
    'PowerBuilder DataWindow Workspace Catalog',
    'Contrato público mínimo del catálogo workspace-wide seguro de DataWindow.',
    ['summary', 'entries'],
    {
        summary: objectSchema(
            ['projectCount', 'dataWindowCount', 'uniqueProjectBindingCount', 'ambiguousProjectBindingCount', 'childLinkCount'],
            {
                projectCount: integerSchema(),
                dataWindowCount: integerSchema(),
                uniqueProjectBindingCount: integerSchema(),
                ambiguousProjectBindingCount: integerSchema(),
                childLinkCount: integerSchema(),
            },
            true,
        ),
        entries: arraySchema(objectSchema(
            ['uri', 'relativePath', 'objectName', 'projectBindings', 'summary'],
            {
                uri: stringSchema(),
                relativePath: stringSchema(),
                objectName: stringSchema(),
                projectBindings: arraySchema(anySchema),
                summary: objectSchema(
                    ['bandCount', 'tableColumnCount', 'textCount', 'displayColumnCount', 'retrieveColumnReferenceCount', 'childLinkCount'],
                    {
                        bandCount: integerSchema(),
                        tableColumnCount: integerSchema(),
                        textCount: integerSchema(),
                        displayColumnCount: integerSchema(),
                        retrieveColumnReferenceCount: integerSchema(),
                        childLinkCount: integerSchema(),
                    },
                    true,
                ),
                retrieve: objectSchema(
                    ['statement', 'selectColumnCount'],
                    {
                        statement: stringSchema(),
                        selectColumnCount: integerSchema(),
                    },
                    true,
                ),
            },
            true,
        )),
    },
);

const dataWindowChildGraphSchema = generatedPayloadSchema(
    'powerbuilder-datawindow-child-graph',
    'PowerBuilder DataWindow Child Graph',
    'Contrato público mínimo del grafo verificado parent-child de DataWindow.',
    ['summary', 'nodes', 'edges'],
    {
        summary: objectSchema(
            ['projectCount', 'parentCount', 'edgeCount'],
            {
                projectCount: integerSchema(),
                parentCount: integerSchema(),
                edgeCount: integerSchema(),
            },
            true,
        ),
        nodes: arraySchema(objectSchema(
            ['objectName', 'uri', 'relativePath', 'projectBindings'],
            {
                objectName: stringSchema(),
                uri: stringSchema(),
                relativePath: stringSchema(),
                projectBindings: arraySchema(anySchema),
            },
            true,
        )),
        edges: arraySchema(objectSchema(
            ['parentObjectName', 'parentUri', 'parentRelativePath', 'childName', 'kind', 'dataObjectName', 'childObjectName', 'childUri', 'childRelativePath'],
            {
                parentObjectName: stringSchema(),
                parentUri: stringSchema(),
                parentRelativePath: stringSchema(),
                childName: stringSchema(),
                kind: stringSchema(),
                dataObjectName: stringSchema(),
                childObjectName: stringSchema(),
                childUri: stringSchema(),
                childRelativePath: stringSchema(),
            },
            true,
        )),
    },
);

const runtimeCatalogSchema = generatedPayloadSchema(
    'powerbuilder-runtime-catalog',
    'PowerBuilder Runtime Catalog',
    'Contrato público mínimo del catálogo runtime exportable.',
    ['summary', 'typing', 'coverage', 'consistency', 'indexes', 'slices', 'entries'],
    {
        summary: objectSchema(
            ['sliceCount', 'entryCount'],
            {
                sliceCount: integerSchema(),
                entryCount: integerSchema(),
            },
            true,
        ),
        typing: objectSchema(
            ['overloadedEntryCount', 'entryCountWithParameterLabels', 'entryCountWithExplicitParameterMetadata', 'entryCountWithDerivedReturnType', 'obsoleteWithReplacementCount', 'ownerKinds', 'callableKinds'],
            {
                overloadedEntryCount: integerSchema(),
                entryCountWithParameterLabels: integerSchema(),
                entryCountWithExplicitParameterMetadata: integerSchema(),
                entryCountWithDerivedReturnType: integerSchema(),
                obsoleteWithReplacementCount: integerSchema(),
                ownerKinds: objectSchema([], {}, true),
                callableKinds: objectSchema([], {}, true),
            },
            true,
        ),
        coverage: objectSchema(
            ['totalEntries', 'families', 'metadata'],
            {
                totalEntries: integerSchema(),
                families: arraySchema(anySchema),
                metadata: objectSchema(
                    ['obsoleteCount', 'replacementCount', 'aliasCount', 'sourceUrlCount', 'provenanceVersionCount', 'generatedAtCount'],
                    {
                        obsoleteCount: integerSchema(),
                        replacementCount: integerSchema(),
                        aliasCount: integerSchema(),
                        sourceUrlCount: integerSchema(),
                        provenanceVersionCount: integerSchema(),
                        generatedAtCount: integerSchema(),
                    },
                    true,
                ),
            },
            true,
        ),
        consistency: objectSchema(
            ['validation', 'slices', 'provenance', 'overlaps'],
            {
                validation: objectSchema(
                    ['ok', 'issueCount', 'byCode'],
                    {
                        ok: booleanSchema(),
                        issueCount: integerSchema(),
                        byCode: objectSchema([], {}, true),
                    },
                    true,
                ),
                slices: arraySchema(anySchema),
                provenance: objectSchema(
                    ['byKind', 'byAuthority', 'withVersion', 'withGeneratedAt', 'missingGeneratedAt'],
                    {
                        byKind: objectSchema([], {}, true),
                        byAuthority: objectSchema([], {}, true),
                        withVersion: integerSchema(),
                        withGeneratedAt: integerSchema(),
                        missingGeneratedAt: integerSchema(),
                    },
                    true,
                ),
                overlaps: objectSchema(
                    ['exactIdentityAcrossDatasets', 'sharedNamesAcrossDatasets', 'sharedNamesByDomain'],
                    {
                        exactIdentityAcrossDatasets: integerSchema(),
                        sharedNamesAcrossDatasets: integerSchema(),
                        sharedNamesByDomain: objectSchema([], {}, true),
                    },
                    true,
                ),
            },
            true,
        ),
        indexes: objectSchema(
            ['domains', 'ownerTypes', 'returnTypes'],
            {
                domains: arraySchema(anySchema),
                ownerTypes: arraySchema(anySchema),
                returnTypes: arraySchema(anySchema),
            },
            true,
        ),
        slices: arraySchema(anySchema),
        entries: arraySchema(anySchema),
    },
);

const workspaceManifestSchema = generatedPayloadSchema(
    'powerbuilder-workspace-manifest',
    'PowerBuilder Workspace Manifest',
    'Contrato público mínimo del manifest multiproyecto del workspace.',
    ['workspace', 'projects', 'graph'],
    {
        workspace: objectSchema(
            ['folders', 'projectCount', 'indexingExcludePatterns', 'retainedEffectiveRootKeys', 'matchingProjectsForAnchor', 'buildableTargetCount', 'buildableTargets', 'indexingAudit'],
            {
                folders: arraySchema(objectSchema(
                    ['uri', 'relativePath', 'name'],
                    {
                        uri: stringSchema(),
                        relativePath: stringSchema(),
                        name: stringSchema(),
                    },
                    true,
                )),
                projectCount: integerSchema(),
                indexingExcludePatterns: arraySchema(stringSchema()),
                retainedEffectiveRootKeys: arraySchema(stringSchema()),
                anchorUri: stringSchema(),
                anchorRelativePath: stringSchema(),
                preferredProject: exportedProjectSchema,
                matchingProjectsForAnchor: arraySchema(exportedProjectSchema),
                buildableTargetCount: integerSchema(),
                buildableTargets: arraySchema(anySchema),
                indexingAudit: objectSchema(
                    ['indexedFileCount', 'indexedSymbolCount', 'snapshotCacheEntryCount', 'artifactPayloadCacheEntryCount', 'unassignedIndexedFileCount', 'unassignedIndexedFiles', 'staleIndexedFileCount', 'staleIndexedFiles'],
                    {
                        indexedFileCount: integerSchema(),
                        indexedSymbolCount: integerSchema(),
                        snapshotCacheEntryCount: integerSchema(),
                        artifactPayloadCacheEntryCount: integerSchema(),
                        unassignedIndexedFileCount: integerSchema(),
                        unassignedIndexedFiles: arraySchema(stringSchema()),
                        staleIndexedFileCount: integerSchema(),
                        staleIndexedFiles: arraySchema(stringSchema()),
                    },
                    true,
                ),
                incrementalImpact: anySchema,
            },
            true,
        ),
        projects: arraySchema(anySchema),
        graph: objectSchema(
            ['summary', 'nodes', 'edges'],
            {
                summary: objectSchema(
                    ['nodeCount', 'edgeCount', 'buildTargetProjectEdgeCount', 'projectLibraryEdgeCount', 'librarySourceEdgeCount'],
                    {
                        nodeCount: integerSchema(),
                        edgeCount: integerSchema(),
                        buildTargetProjectEdgeCount: integerSchema(),
                        projectLibraryEdgeCount: integerSchema(),
                        librarySourceEdgeCount: integerSchema(),
                    },
                    true,
                ),
                nodes: arraySchema(anySchema),
                edges: arraySchema(anySchema),
            },
            true,
        ),
    },
);

const dataWindowManifestSchema = generatedPayloadSchema(
    'powerbuilder-datawindow-manifest',
    'PowerBuilder DataWindow Manifest',
    'Contrato público mínimo del manifest seguro de DataWindow.',
    ['document', 'summary', 'bands', 'table', 'texts', 'displayColumns'],
    {
        document: objectSchema(
            ['uri', 'relativePath', 'objectName'],
            {
                uri: stringSchema(),
                relativePath: stringSchema(),
                objectName: stringSchema(),
            },
            true,
        ),
        project: exportedProjectSchema,
        summary: objectSchema(
            ['bandCount', 'tableColumnCount', 'textCount', 'displayColumnCount', 'retrieveColumnReferenceCount'],
            {
                bandCount: integerSchema(),
                tableColumnCount: integerSchema(),
                textCount: integerSchema(),
                displayColumnCount: integerSchema(),
                retrieveColumnReferenceCount: integerSchema(),
            },
            true,
        ),
        bands: arraySchema(anySchema),
        table: objectSchema(
            ['columns'],
            {
                range: exportedRangeSchema,
                selectionRange: exportedRangeSchema,
                columns: arraySchema(anySchema),
                retrieve: anySchema,
            },
            true,
        ),
        texts: arraySchema(anySchema),
        displayColumns: arraySchema(anySchema),
    },
);

const automationSurfaceSchema = generatedPayloadSchema(
    'powerbuilder-automation-surface',
    'PowerBuilder Automation Surface',
    'Contrato público mínimo de la surface estructurada de automatización.',
    ['extensionApi', 'languageModelTools', 'commands'],
    {
        extensionApi: objectSchema(
            ['extensionId', 'apiVersion', 'exportedFrom', 'methods'],
            {
                extensionId: stringSchema(),
                apiVersion: integerSchema(),
                exportedFrom: constStringSchema('activate'),
                methods: arraySchema(automationSurfaceExtensionMethodSchema),
            },
            true,
        ),
        languageModelTools: arraySchema(languageModelToolSchema),
        commands: arraySchema(automationSurfaceCommandSchema),
    },
);

const buildReportSchema = generatedPayloadSchema(
    'powerbuilder-build-report',
    'PowerBuilder Build Report',
    'Contrato público mínimo del build report exportado.',
    ['project', 'executablePath', 'args', 'exitCode', 'summary', 'issues', 'diagnostics', 'output'],
    {
        project: exportedProjectSchema,
        executablePath: stringSchema(),
        args: arraySchema(stringSchema()),
        exitCode: integerSchema(),
        summary: anySchema,
        issues: arraySchema(anySchema),
        diagnostics: arraySchema(objectSchema(
            ['uri', 'relativePath', 'count'],
            {
                uri: stringSchema(),
                relativePath: stringSchema(),
                count: integerSchema(),
            },
            true,
        )),
        output: stringSchema(),
    },
);

const activeHierarchyInspectionSchema = generatedPayloadSchema(
    'powerbuilder-active-hierarchy-inspection',
    'PowerBuilder Active Hierarchy Inspection',
    'Contrato público mínimo de la inspección estructurada de jerarquía activa.',
    ['inspection'],
    {
        inspection: objectSchema(
            ['scope', 'documentPath', 'precision', 'summary', 'projectMatches', 'currentObjectHierarchy', 'relevantOwnerHierarchy', 'candidateSymbols', 'reasons', 'evidence'],
            {
                scope: stringSchema(),
                requestedWord: stringSchema(),
                documentPath: stringSchema(),
                precision: stringSchema(),
                confidence: stringSchema(),
                summary: stringSchema(),
                preferredProject: anySchema,
                projectMatches: arraySchema(anySchema),
                currentObjectName: stringSchema(),
                currentObjectHierarchy: arraySchema(stringSchema()),
                effectiveDocumentRoot: anySchema,
                primarySymbol: anySchema,
                runtimeSymbol: anySchema,
                effectiveTargetRoot: anySchema,
                relevantOwnerName: stringSchema(),
                relevantOwnerHierarchy: arraySchema(stringSchema()),
                candidateSymbols: arraySchema(anySchema),
                reasons: arraySchema(anySchema),
                evidence: arraySchema(anySchema),
            },
            true,
        ),
    },
);

const ancestorScriptInspectionSchema = generatedPayloadSchema(
    'powerbuilder-ancestor-script-inspection',
    'PowerBuilder Ancestor Script Inspection',
    'Contrato público mínimo de la inspección estructurada de script ancestro.',
    ['inspection'],
    {
        inspection: objectSchema(
            ['documentPath', 'precision', 'currentObjectHierarchy', 'currentObjectHierarchyTypes', 'inspectedAncestorTypes', 'relationship', 'summary', 'reasons'],
            {
                documentPath: stringSchema(),
                precision: stringSchema(),
                currentObject: anySchema,
                directAncestor: anySchema,
                currentObjectHierarchy: arraySchema(stringSchema()),
                currentObjectHierarchyTypes: arraySchema(anySchema),
                inspectedAncestorTypes: arraySchema(anySchema),
                currentScript: anySchema,
                ancestorScript: anySchema,
                relationship: stringSchema(),
                summary: stringSchema(),
                reasons: arraySchema(anySchema),
            },
            true,
        ),
    },
);

const buildSessionManifestSchema = generatedPayloadSchema(
    'powerbuilder-build-session-manifest',
    'PowerBuilder Build Session Manifest',
    'Contrato público mínimo del manifiesto estructurado de sesión de build.',
    ['summary'],
    {
        summary: objectSchema(
            ['hasLastTarget', 'hasLastBuild'],
            {
                hasLastTarget: booleanSchema(),
                hasLastBuild: booleanSchema(),
                lastTargetSource: stringSchema(),
            },
            true,
        ),
        lastTarget: objectSchema(
            ['uri', 'relativePath', 'name', 'kind', 'storedAt', 'source'],
            {
                uri: stringSchema(),
                relativePath: stringSchema(),
                name: stringSchema(),
                kind: stringSchema(),
                storedAt: stringSchema(),
                source: stringSchema(),
            },
            true,
        ),
        lastBuild: objectSchema(
            ['project', 'executablePath', 'args', 'exitCode', 'summary', 'issueCount'],
            {
                project: exportedProjectSchema,
                executablePath: stringSchema(),
                args: arraySchema(stringSchema()),
                exitCode: integerSchema(),
                summary: anySchema,
                issueCount: integerSchema(),
                capturedAt: stringSchema(),
            },
            true,
        ),
    },
);

const workspaceDiagnosticsTreeSchema = generatedPayloadSchema(
    'powerbuilder-workspace-diagnostics-tree',
    'PowerBuilder Workspace Diagnostics Tree',
    'Contrato público mínimo del snapshot workspace-wide de diagnostics.',
    ['summary', 'projects'],
    {
        summary: objectSchema(
            ['projectCount', 'objectCount', 'diagnosticCount', 'errorCount', 'warningCount'],
            {
                projectCount: integerSchema(),
                objectCount: integerSchema(),
                diagnosticCount: integerSchema(),
                errorCount: integerSchema(),
                warningCount: integerSchema(),
            },
            true,
        ),
        projects: arraySchema(anySchema),
    },
);

const featureSupportSnapshotSchema = generatedPayloadSchema(
    'powerbuilder-feature-support-snapshot',
    'PowerBuilder Feature Support Snapshot',
    'Contrato público mínimo del snapshot JSON del soporte real.',
    ['source', 'levels', 'summary', 'entries', 'productNotes'],
    {
        source: objectSchema(
            ['uri', 'relativePath'],
            {
                uri: stringSchema(),
                relativePath: stringSchema(),
            },
            true,
        ),
        levels: arraySchema(anySchema),
        summary: objectSchema(
            ['featureCount', 'noteCount', 'powerScriptLevels', 'dataWindowLevels'],
            {
                featureCount: integerSchema(),
                noteCount: integerSchema(),
                powerScriptLevels: arraySchema(anySchema),
                dataWindowLevels: arraySchema(anySchema),
            },
            true,
        ),
        entries: arraySchema(anySchema),
        productNotes: arraySchema(stringSchema()),
    },
);

const semanticSnapshotDiffSchema = generatedPayloadSchema(
    'powerbuilder-semantic-snapshot-diff',
    'PowerBuilder Semantic Snapshot Diff',
    'Contrato público mínimo del diff JSON entre snapshots semánticos.',
    ['snapshotKind', 'inputs', 'summary', 'files'],
    {
        snapshotKind: constStringSchema('powerbuilder-semantic-project'),
        inputs: objectSchema(
            ['left', 'right'],
            {
                left: anySchema,
                right: anySchema,
            },
            true,
        ),
        summary: anySchema,
        files: objectSchema(
            ['added', 'removed', 'changed'],
            {
                added: arraySchema(anySchema),
                removed: arraySchema(anySchema),
                changed: arraySchema(anySchema),
            },
            true,
        ),
    },
);

const workspaceManifestDiffSchema = generatedPayloadSchema(
    'powerbuilder-workspace-manifest-diff',
    'PowerBuilder Workspace Manifest Diff',
    'Contrato público mínimo del diff orientado a build e invalidation entre manifests del workspace.',
    ['snapshotKind', 'inputs', 'summary', 'workspace', 'invalidation'],
    {
        snapshotKind: constStringSchema('powerbuilder-workspace-manifest'),
        inputs: objectSchema(
            ['left', 'right'],
            {
                left: anySchema,
                right: anySchema,
            },
            true,
        ),
        summary: anySchema,
        workspace: anySchema,
        invalidation: anySchema,
    },
);

const inheritanceOwnerGraphSchema = generatedPayloadSchema(
    'powerbuilder-inheritance-owner-graph',
    'PowerBuilder Inheritance Owner Graph',
    'Contrato público mínimo del grafo exportable de herencia y owners.',
    ['project', 'summary', 'types', 'inherits', 'ownerMembers', 'callableFamilies'],
    {
        project: exportedProjectSchema,
        summary: anySchema,
        types: arraySchema(exportedSymbolSchema),
        inherits: arraySchema(anySchema),
        ownerMembers: arraySchema(anySchema),
        callableFamilies: arraySchema(anySchema),
    },
);

const scriptDependencyGraphSchema = generatedPayloadSchema(
    'powerbuilder-script-dependency-graph',
    'PowerBuilder Script Dependency Graph',
    'Contrato público mínimo del grafo conservador de dependencias de script.',
    ['project', 'summary', 'callables', 'edges'],
    {
        project: exportedProjectSchema,
        summary: anySchema,
        callables: arraySchema(exportedSymbolSchema),
        edges: arraySchema(anySchema),
    },
);

const releaseValidationReportSchema = generatedPayloadSchema(
    'powerbuilder-release-validation-report',
    'PowerBuilder Release Validation Report',
    'Contrato público mínimo del reporte JSON estructurado de validate:release.',
    ['benchmarkEnabled', 'dryRun', 'reportFile', 'summary', 'steps'],
    {
        benchmarkEnabled: booleanSchema(),
        dryRun: booleanSchema(),
        reportFile: stringSchema(),
        summary: objectSchema(
            ['stepCount', 'passedCount', 'failedCount', 'skippedCount', 'finalStatus'],
            {
                stepCount: integerSchema(),
                passedCount: integerSchema(),
                failedCount: integerSchema(),
                skippedCount: integerSchema(),
                finalStatus: stringSchema(),
                failedStepLabel: stringSchema(),
            },
            true,
        ),
        steps: arraySchema(objectSchema(
            ['label', 'command', 'args', 'startedAt', 'finishedAt', 'durationMs', 'status', 'exitCode'],
            {
                label: stringSchema(),
                command: stringSchema(),
                args: arraySchema(stringSchema()),
                envOverrides: objectSchema([], {}, true),
                startedAt: stringSchema(),
                finishedAt: stringSchema(),
                durationMs: integerSchema(),
                status: stringSchema(),
                exitCode: integerSchema(),
                error: stringSchema(),
            },
            true,
        )),
    },
);

const semanticQueryBatchSchema = generatedPayloadSchema(
    'powerbuilder-semantic-query-batch',
    'PowerBuilder Semantic Query Batch',
    'Contrato público mínimo de la ejecución batch de queries semánticas.',
    ['summary', 'items'],
    {
        summary: objectSchema(
            ['requestCount', 'generatedCount', 'nonGeneratedCount', 'stoppedEarly'],
            {
                requestCount: integerSchema(),
                generatedCount: integerSchema(),
                nonGeneratedCount: integerSchema(),
                stoppedEarly: booleanSchema(),
            },
            true,
        ),
        items: arraySchema(objectSchema(
            ['request', 'resultKind'],
            {
                label: stringSchema(),
                request: objectSchema(
                    [],
                    {
                        uri: stringSchema(),
                        relativePath: stringSchema(),
                        line: integerSchema(),
                        character: integerSchema(),
                    },
                    true,
                ),
                resultKind: stringSchema(),
                reason: stringSchema(),
                payload: semanticQuerySchema,
            },
            true,
        )),
    },
);

const workspaceBuildPreferenceSchema = generatedPayloadSchema(
    'powerbuilder-workspace-build-preference',
    'PowerBuilder Workspace Build Preference',
    'Contrato público mínimo de la preferencia estructurada de proyecto y target buildable para un ancla del workspace.',
    ['matchingProjectsForAnchor', 'matchingBuildTargetsForAnchor', 'buildableTargetCount', 'reasons'],
    {
        anchorUri: stringSchema(),
        anchorRelativePath: stringSchema(),
        preferredProject: exportedProjectSchema,
        matchingProjectsForAnchor: arraySchema(exportedProjectSchema),
        preferredBuildTarget: anySchema,
        matchingBuildTargetsForAnchor: arraySchema(anySchema),
        buildableTargetCount: integerSchema(),
        reasons: arraySchema(stringSchema()),
    },
);

const publicContractSchemasIndexSchema = generatedPayloadSchema(
    'powerbuilder-public-contract-schemas',
    'PowerBuilder Public Contract Schemas',
    'Índice público de schemas JSON versionados para payloads estructurados.',
    ['summary', 'schemas'],
    {
        summary: objectSchema(
            ['schemaCount'],
            {
                schemaCount: integerSchema(),
            },
            true,
        ),
        schemas: arraySchema(publicContractSchemaEntrySchema),
    },
);

const publicContractCatalogSchema = generatedPayloadSchema(
    'powerbuilder-public-contract-catalog',
    'PowerBuilder Public Contract Catalog',
    'Índice público de comandos, métodos API y schemas publicados.',
    ['extensionApi', 'languageModelTools', 'commands', 'schemas'],
    {
        extensionApi: objectSchema(
            ['extensionId', 'apiVersion', 'methods'],
            {
                extensionId: stringSchema(),
                apiVersion: integerSchema(),
                methods: arraySchema(automationSurfaceExtensionMethodSchema),
            },
            true,
        ),
        languageModelTools: arraySchema(languageModelToolSchema),
        commands: arraySchema(automationSurfaceCommandSchema),
        schemas: arraySchema(publicContractSchemaEntrySchema),
    },
);

const buildContractCatalogSchema = generatedPayloadSchema(
    'powerbuilder-build-contract-catalog',
    'PowerBuilder Build Contract Catalog',
    'Catálogo contractual mínimo del loop de build y sus surfaces públicas visibles.',
    ['summary', 'extensionApi', 'commands', 'languageModelTools', 'schemas', 'sessionContracts'],
    {
        summary: objectSchema(
            ['commandCount', 'apiMethodCount', 'schemaCount', 'languageModelToolCount'],
            {
                commandCount: integerSchema(),
                apiMethodCount: integerSchema(),
                schemaCount: integerSchema(),
                languageModelToolCount: integerSchema(),
            },
            true,
        ),
        extensionApi: objectSchema(
            ['extensionId', 'apiVersion', 'methods'],
            {
                extensionId: stringSchema(),
                apiVersion: integerSchema(),
                methods: arraySchema(automationSurfaceExtensionMethodSchema),
            },
            true,
        ),
        commands: arraySchema(automationSurfaceCommandSchema),
        languageModelTools: arraySchema(languageModelToolSchema),
        schemas: arraySchema(publicContractSchemaEntrySchema),
        sessionContracts: anySchema,
    },
);

const hostContributionInventorySchema = generatedPayloadSchema(
    'powerbuilder-host-contribution-inventory',
    'PowerBuilder Host Contribution Inventory',
    'Inventario host-aware de contributions declaradas, commands registrados, API exportada y tools reflejadas.',
    ['summary', 'host', 'commands', 'extensionApiMethods', 'languageModelTools', 'views'],
    {
        summary: objectSchema(
            [
                'declaredCommandCount',
                'registeredCommandCount',
                'declaredLanguageModelToolCount',
                'hostReflectedLanguageModelToolCount',
                'viewCount',
                'extensionApiMethodCount',
            ],
            {
                declaredCommandCount: integerSchema(),
                registeredCommandCount: integerSchema(),
                declaredLanguageModelToolCount: integerSchema(),
                hostReflectedLanguageModelToolCount: integerSchema(),
                viewCount: integerSchema(),
                extensionApiMethodCount: integerSchema(),
            },
            true,
        ),
        host: anySchema,
        commands: anySchema,
        extensionApiMethods: anySchema,
        languageModelTools: anySchema,
        views: anySchema,
    },
);

const automationCoverageAuditSchema = generatedPayloadSchema(
    'powerbuilder-automation-coverage-audit',
    'PowerBuilder Automation Coverage Audit',
    'Auditoría de cobertura entre package.json, automationSurface, contratos públicos, API exportada y tools reflejadas por el host.',
    ['summary', 'coverage', 'notes'],
    {
        summary: objectSchema(
            [
                'packageCommandsMissingFromAutomationSurface',
                'automationCommandsMissingFromPackageJson',
                'publicCatalogCommandsMissingSchema',
                'extensionApiMethodsMissingRegisteredCommand',
                'languageModelToolsMissingBackedCommand',
                'languageModelToolsMissingHostReflection',
            ],
            {
                packageCommandsMissingFromAutomationSurface: integerSchema(),
                automationCommandsMissingFromPackageJson: integerSchema(),
                publicCatalogCommandsMissingSchema: integerSchema(),
                extensionApiMethodsMissingRegisteredCommand: integerSchema(),
                languageModelToolsMissingBackedCommand: integerSchema(),
                languageModelToolsMissingHostReflection: integerSchema(),
            },
            true,
        ),
        coverage: anySchema,
        notes: arraySchema(stringSchema()),
    },
);

const automationReplaySchema = generatedPayloadSchema(
    'powerbuilder-automation-replay',
    'PowerBuilder Automation Replay',
    'Replay versionado de comandos públicos y languageModelTools resueltos contra la automation surface estable.',
    ['summary', 'manifest', 'steps'],
    {
        summary: objectSchema(
            [
                'stepCount',
                'commandStepCount',
                'languageModelToolStepCount',
                'completedCount',
                'failedCount',
                'skippedCount',
                'generatedFileCount',
                'structuredResultCount',
                'stoppedEarly',
            ],
            {
                stepCount: integerSchema(),
                commandStepCount: integerSchema(),
                languageModelToolStepCount: integerSchema(),
                completedCount: integerSchema(),
                failedCount: integerSchema(),
                skippedCount: integerSchema(),
                generatedFileCount: integerSchema(),
                structuredResultCount: integerSchema(),
                stoppedEarly: booleanSchema(),
            },
            true,
        ),
        manifest: objectSchema(
            ['automationSurfaceRelativePath', 'automationSurfaceGeneratedAt'],
            {
                automationSurfaceRelativePath: stringSchema(),
                automationSurfaceGeneratedAt: stringSchema(),
            },
            true,
        ),
        steps: anySchema,
    },
);

const cacheInvalidationSnapshotSchema = generatedPayloadSchema(
    'powerbuilder-cache-invalidation-snapshot',
    'PowerBuilder Cache Invalidation Snapshot',
    'Snapshot exportable de snapshotStore, artifactPayloadCache y superficie de invalidación workspace-wide.',
    ['summary', 'snapshotCache', 'artifactPayloadCache', 'workspaceIndexingAudit', 'workspaceSurface', 'invalidationSurface'],
    {
        summary: anySchema,
        snapshotCache: anySchema,
        artifactPayloadCache: anySchema,
        workspaceIndexingAudit: anySchema,
        workspaceSurface: anySchema,
        invalidationSurface: anySchema,
    },
);

const publicContractCatalogDiffSchema = generatedPayloadSchema(
    'powerbuilder-public-contract-catalog-diff',
    'PowerBuilder Public Contract Catalog Diff',
    'Diff versionado entre dos catálogos públicos de contratos o bundles workspace-wide.',
    ['snapshotKind', 'inputs', 'summary', 'commands', 'extensionApi', 'languageModelTools', 'schemas'],
    {
        snapshotKind: constStringSchema('powerbuilder-public-contract-catalog'),
        inputs: anySchema,
        summary: anySchema,
        commands: anySchema,
        extensionApi: anySchema,
        languageModelTools: anySchema,
        schemas: anySchema,
    },
);

const workspaceArtifactBundleDiffSchema = generatedPayloadSchema(
    'powerbuilder-workspace-artifact-bundle-diff',
    'PowerBuilder Workspace Artifact Bundle Diff',
    'Diff workspace-wide entre dos bundles de artefactos exportados.',
    ['snapshotKind', 'inputs', 'summary', 'artifacts', 'workspaceManifest', 'publicContractCatalog', 'automationSurface', 'diagnostics', 'featureSupport', 'buildSession', 'releaseValidationReport'],
    {
        snapshotKind: constStringSchema('powerbuilder-workspace-artifact-bundle'),
        inputs: anySchema,
        summary: anySchema,
        artifacts: anySchema,
        workspaceManifest: anySchema,
        publicContractCatalog: anySchema,
        automationSurface: anySchema,
        diagnostics: anySchema,
        featureSupport: anySchema,
        buildSession: anySchema,
        releaseValidationReport: anySchema,
    },
);

const workspaceArtifactBundleSchema = generatedPayloadSchema(
    'powerbuilder-workspace-artifact-bundle',
    'PowerBuilder Workspace Artifact Bundle',
    'Bundle workspace-wide de artefactos estructurados y contratos públicos.',
    ['summary', 'artifacts', 'bundle', 'releaseValidationReport'],
    {
        summary: objectSchema(
            ['artifactCount', 'includesReleaseValidationReport'],
            {
                artifactCount: integerSchema(),
                includesReleaseValidationReport: booleanSchema(),
            },
            true,
        ),
        artifacts: arraySchema(objectSchema(
            ['artifactKind', 'payloadKind', 'relativePath'],
            {
                artifactKind: stringSchema(),
                payloadKind: stringSchema(),
                relativePath: stringSchema(),
                generatedAt: stringSchema(),
                schemaVersion: integerSchema(),
            },
            true,
        )),
        bundle: objectSchema(
            ['workspaceManifest', 'automationSurface', 'workspaceDiagnosticsTree', 'featureSupportSnapshot', 'buildSessionManifest', 'publicContractCatalog'],
            {
                workspaceManifest: workspaceManifestSchema,
                automationSurface: automationSurfaceSchema,
                workspaceDiagnosticsTree: workspaceDiagnosticsTreeSchema,
                featureSupportSnapshot: featureSupportSnapshotSchema,
                buildSessionManifest: buildSessionManifestSchema,
                publicContractCatalog: publicContractCatalogSchema,
            },
            true,
        ),
        releaseValidationReport: objectSchema(
            ['status', 'relativePath'],
            {
                status: stringSchema(),
                relativePath: stringSchema(),
                payload: releaseValidationReportSchema,
                reason: stringSchema(),
            },
            true,
        ),
    },
);

const PUBLIC_CONTRACT_SCHEMA_DESCRIPTORS: readonly PublicContractSchemaDescriptor[] = [
    semanticDocumentDescriptor(),
    semanticProjectDescriptor(),
    semanticQueryDescriptor(),
    overloadResolutionExplanationDescriptor(),
    visibilityAuditDescriptor(),
    dataWindowWorkspaceCatalogDescriptor(),
    dataWindowChildGraphDescriptor(),
    runtimeCatalogDescriptor(),
    workspaceManifestDescriptor(),
    dataWindowManifestDescriptor(),
    automationSurfaceDescriptor(),
    buildReportDescriptor(),
    activeHierarchyInspectionDescriptor(),
    ancestorScriptInspectionDescriptor(),
    buildSessionManifestDescriptor(),
    workspaceDiagnosticsTreeDescriptor(),
    featureSupportSnapshotDescriptor(),
    semanticSnapshotDiffDescriptor(),
    workspaceManifestDiffDescriptor(),
    inheritanceOwnerGraphDescriptor(),
    scriptDependencyGraphDescriptor(),
    releaseValidationReportDescriptor(),
    semanticQueryBatchDescriptor(),
    workspaceBuildPreferenceDescriptor(),
    publicContractSchemasDescriptor(),
    publicContractCatalogDescriptor(),
    buildContractCatalogDescriptor(),
    hostContributionInventoryDescriptor(),
    automationCoverageAuditDescriptor(),
    automationReplayDescriptor(),
    cacheInvalidationSnapshotDescriptor(),
    publicContractCatalogDiffDescriptor(),
    workspaceArtifactBundleDiffDescriptor(),
    workspaceArtifactBundleDescriptor(),
] as const;

function createSchemaDescriptor(
    payloadKind: string,
    schema: PublicContractJsonSchema,
): PublicContractSchemaDescriptor {
    return {
        payloadKind,
        relativePath: `contracts/schemas/${payloadKind}.schema.json`,
        schema,
    };
}

function semanticDocumentDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-semantic-document', semanticDocumentSchema);
}

function semanticProjectDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-semantic-project', semanticProjectSchema);
}

function semanticQueryDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-semantic-query', semanticQuerySchema);
}

function overloadResolutionExplanationDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-overload-resolution-explanation', overloadResolutionExplanationSchema);
}

function visibilityAuditDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-visibility-audit', visibilityAuditSchema);
}

function dataWindowWorkspaceCatalogDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-datawindow-workspace-catalog', dataWindowWorkspaceCatalogSchema);
}

function dataWindowChildGraphDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-datawindow-child-graph', dataWindowChildGraphSchema);
}

function runtimeCatalogDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-runtime-catalog', runtimeCatalogSchema);
}

function workspaceManifestDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-workspace-manifest', workspaceManifestSchema);
}

function dataWindowManifestDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-datawindow-manifest', dataWindowManifestSchema);
}

function automationSurfaceDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-automation-surface', automationSurfaceSchema);
}

function buildReportDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-build-report', buildReportSchema);
}

function activeHierarchyInspectionDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-active-hierarchy-inspection', activeHierarchyInspectionSchema);
}

function ancestorScriptInspectionDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-ancestor-script-inspection', ancestorScriptInspectionSchema);
}

function buildSessionManifestDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-build-session-manifest', buildSessionManifestSchema);
}

function workspaceDiagnosticsTreeDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-workspace-diagnostics-tree', workspaceDiagnosticsTreeSchema);
}

function featureSupportSnapshotDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-feature-support-snapshot', featureSupportSnapshotSchema);
}

function semanticSnapshotDiffDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-semantic-snapshot-diff', semanticSnapshotDiffSchema);
}

function workspaceManifestDiffDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-workspace-manifest-diff', workspaceManifestDiffSchema);
}

function inheritanceOwnerGraphDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-inheritance-owner-graph', inheritanceOwnerGraphSchema);
}

function scriptDependencyGraphDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-script-dependency-graph', scriptDependencyGraphSchema);
}

function releaseValidationReportDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-release-validation-report', releaseValidationReportSchema);
}

function semanticQueryBatchDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-semantic-query-batch', semanticQueryBatchSchema);
}

function workspaceBuildPreferenceDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-workspace-build-preference', workspaceBuildPreferenceSchema);
}

function publicContractSchemasDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-public-contract-schemas', publicContractSchemasIndexSchema);
}

function publicContractCatalogDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-public-contract-catalog', publicContractCatalogSchema);
}

function buildContractCatalogDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-build-contract-catalog', buildContractCatalogSchema);
}

function hostContributionInventoryDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-host-contribution-inventory', hostContributionInventorySchema);
}

function automationCoverageAuditDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-automation-coverage-audit', automationCoverageAuditSchema);
}

function automationReplayDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-automation-replay', automationReplaySchema);
}

function cacheInvalidationSnapshotDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-cache-invalidation-snapshot', cacheInvalidationSnapshotSchema);
}

function publicContractCatalogDiffDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-public-contract-catalog-diff', publicContractCatalogDiffSchema);
}

function workspaceArtifactBundleDiffDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-workspace-artifact-bundle-diff', workspaceArtifactBundleDiffSchema);
}

function workspaceArtifactBundleDescriptor(): PublicContractSchemaDescriptor {
    return createSchemaDescriptor('powerbuilder-workspace-artifact-bundle', workspaceArtifactBundleSchema);
}

export function getPublicContractSchemaDescriptors(): PublicContractSchemaDescriptor[] {
    return [...PUBLIC_CONTRACT_SCHEMA_DESCRIPTORS].sort((left, right) => left.payloadKind.localeCompare(right.payloadKind));
}

export function getPublicContractSchemaDescriptor(
    payloadKind: string,
): PublicContractSchemaDescriptor | undefined {
    return PUBLIC_CONTRACT_SCHEMA_DESCRIPTORS.find(descriptor => descriptor.payloadKind === payloadKind);
}

export function validatePublicContractPayload(
    schema: PublicContractJsonSchema,
    value: unknown,
): PublicContractValidationResult {
    const issues: PublicContractValidationIssue[] = [];

    validateSchemaNode(schema, value, '$', issues);

    return {
        valid: issues.length === 0,
        issues,
    };
}

function validateSchemaNode(
    schema: PublicContractJsonSchema,
    value: unknown,
    currentPath: string,
    issues: PublicContractValidationIssue[],
): void {
    if (schema.const !== undefined && value !== schema.const) {
        issues.push({
            path: currentPath,
            message: `Expected const value ${JSON.stringify(schema.const)}.`,
        });
        return;
    }

    if (schema.enum && !schema.enum.includes(value as JsonSchemaConstValue)) {
        issues.push({
            path: currentPath,
            message: `Expected one of ${schema.enum.map(item => JSON.stringify(item)).join(', ')}.`,
        });
        return;
    }

    if (schema.type === 'object') {
        validateObjectSchema(schema, value, currentPath, issues);
        return;
    }

    if (schema.type === 'array') {
        validateArraySchema(schema, value, currentPath, issues);
        return;
    }

    if (schema.type === 'string' && typeof value !== 'string') {
        issues.push({ path: currentPath, message: 'Expected string.' });
        return;
    }

    if (schema.type === 'number' && typeof value !== 'number') {
        issues.push({ path: currentPath, message: 'Expected number.' });
        return;
    }

    if (schema.type === 'integer' && (!Number.isInteger(value) || typeof value !== 'number')) {
        issues.push({ path: currentPath, message: 'Expected integer.' });
        return;
    }

    if (schema.type === 'boolean' && typeof value !== 'boolean') {
        issues.push({ path: currentPath, message: 'Expected boolean.' });
        return;
    }

    if (schema.type === 'null' && value !== null) {
        issues.push({ path: currentPath, message: 'Expected null.' });
    }
}

function validateObjectSchema(
    schema: PublicContractJsonSchema,
    value: unknown,
    currentPath: string,
    issues: PublicContractValidationIssue[],
): void {
    if (!isPlainObject(value)) {
        issues.push({ path: currentPath, message: 'Expected object.' });
        return;
    }

    const objectValue = value as Record<string, unknown>;
    const properties = schema.properties ?? {};
    const required = schema.required ?? [];

    for (const key of required) {
        if (!Object.prototype.hasOwnProperty.call(objectValue, key)) {
            issues.push({
                path: `${currentPath}.${key}`,
                message: 'Missing required property.',
            });
        }
    }

    for (const [key, propertySchema] of Object.entries(properties)) {
        if (!Object.prototype.hasOwnProperty.call(objectValue, key)) {
            continue;
        }

        validateSchemaNode(propertySchema, objectValue[key], `${currentPath}.${key}`, issues);
    }

    if (schema.additionalProperties === false) {
        for (const key of Object.keys(objectValue)) {
            if (!Object.prototype.hasOwnProperty.call(properties, key)) {
                issues.push({
                    path: `${currentPath}.${key}`,
                    message: 'Unexpected property.',
                });
            }
        }
        return;
    }

    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        for (const key of Object.keys(objectValue)) {
            if (Object.prototype.hasOwnProperty.call(properties, key)) {
                continue;
            }

            validateSchemaNode(schema.additionalProperties, objectValue[key], `${currentPath}.${key}`, issues);
        }
    }
}

function validateArraySchema(
    schema: PublicContractJsonSchema,
    value: unknown,
    currentPath: string,
    issues: PublicContractValidationIssue[],
): void {
    if (!Array.isArray(value)) {
        issues.push({ path: currentPath, message: 'Expected array.' });
        return;
    }

    if (!schema.items) {
        return;
    }

    value.forEach((item, index) => {
        validateSchemaNode(schema.items as PublicContractJsonSchema, item, `${currentPath}[${index}]`, issues);
    });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}