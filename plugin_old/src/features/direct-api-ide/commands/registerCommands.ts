import * as vscode from 'vscode';
import { getConfig } from '../../../core/config/extensionConfiguration';
import {
    isDataWindowUri,
    isIdeSafePowerBuilderDocument,
} from '../../../core/utils/powerBuilderFileUtils';
import { Logger } from '../../../core/logging/logger';
import { PbDataWindowParser } from '../../../powerbuilder/datawindow/pbDataWindowParser';
import { SymbolIndex } from '../../../powerbuilder/indexing/symbolIndex';
import { WorkspaceIndexer } from '../../../powerbuilder/indexing/workspaceIndexer';
import {
    PB_USER_MESSAGES,
    formatDataWindowObjectInfoEs,
    formatIndexedSummaryEs,
    formatObjectInfoEs,
    getSymbolKindLabelEs,
} from '../../../core/i18n/pbUserMessages';
import {
    ActiveHierarchyInspectionResult,
    PowerBuilderActiveHierarchyInspectionService,
} from '../../../powerbuilder/hierarchy/activeHierarchyInspectionService';
import { PowerBuilderAncestorScriptService } from '../../../powerbuilder/hierarchy/ancestorScriptService';
import { PowerBuilderInheritanceHierarchyService } from '../../../powerbuilder/hierarchy/inheritanceHierarchyService';
import { PowerBuilderDocumentationWorkspaceService } from '../../../powerbuilder/documentation/powerBuilderDocumentationWorkspaceService';
import {
    GeneratePublicContractCatalogDiffExportResult,
    GenerateWorkspaceBuildPreferenceExportResult,
    GenerateWorkspaceArtifactBundleDiffExportResult,
    GenerateWorkspaceManifestDiffExportResult,
    PowerBuilderArtifactWorkspaceService,
    RunWorkspaceBuildPreferenceResult,
    SemanticQueryBatchExportPayload,
} from '../../../powerbuilder/exports/powerBuilderArtifactWorkspaceService';
import { PbSymbol } from '../../../powerbuilder/models/pbSymbol';
import { PbProjectDefinition } from '../../../powerbuilder/workspace/pbProjectModel';
import { PowerBuilderProjectRegistry } from '../../../powerbuilder/workspace/projectRegistry';
import {
    formatPbAutoBuildOutputDocument,
    PbAutoBuildProjectBuildResult,
    PowerBuilderAutoBuildService,
    summarizePbAutoBuildIssues,
} from '../../../powerbuilder/build/pbAutoBuildService';
import { isPbBuildTargetUri } from '../../../powerbuilder/build/buildTargetUtils';
import { registerPowerBuilderLanguageModelTools } from './registerLanguageModelTools';

export function registerCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
    const index = SymbolIndex.getInstance();
    const indexer = new WorkspaceIndexer(index);
    const dataWindowParser = new PbDataWindowParser();
    const hierarchyInspectionService = new PowerBuilderActiveHierarchyInspectionService();
    const ancestorScriptService = new PowerBuilderAncestorScriptService();
    const inheritanceHierarchyService = new PowerBuilderInheritanceHierarchyService();
    const documentationService = new PowerBuilderDocumentationWorkspaceService();
    const artifactService = new PowerBuilderArtifactWorkspaceService();
    const autoBuildService = new PowerBuilderAutoBuildService(context.workspaceState);

    const reindex = vscode.commands.registerCommand('powerbuilder.reindexWorkspace', async () => {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: PB_USER_MESSAGES.commands.reindexingWorkspace,
            },
            async () => {
                await indexer.reindex();
            },
        );

        vscode.window.showInformationMessage(
            formatIndexedSummaryEs(index.symbolCount, index.fileCount),
        );
    });

    const goToSymbol = vscode.commands.registerCommand('powerbuilder.goToSymbol', async () => {
        const symbols = index.getAllSymbols();
        const items = symbols.map(s => ({
            label: `$(symbol-${mapKindToIcon(s.kind)}) ${s.name}`,
            description: getSymbolKindLabelEs(s.kind),
            detail: getFileName(s.uri),
            symbol: s,
        }));

        const picked = await vscode.window.showQuickPick(items, {
            placeHolder: PB_USER_MESSAGES.commands.goToSymbolPlaceholder,
        });

        if (picked) {
            await revealSymbolInEditor(picked.symbol);
        }
    });

    const semanticNavigate = vscode.commands.registerCommand('powerbuilder.semanticNavigate', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder') {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor);
            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            void vscode.window.showWarningMessage(
                PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            );
            return;
        }

        const inspectionResult = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: PB_USER_MESSAGES.commands.semanticNavigateInspecting,
            },
            async () => {
                await indexer.indexProjects();
                return hierarchyInspectionService.explainForDocument(
                    editor.document,
                    editor.selection.active,
                );
            },
        );

        if (inspectionResult.kind !== 'generated') {
            void vscode.window.showWarningMessage(inspectionResult.reason);
            return;
        }

        const projectRegistry = PowerBuilderProjectRegistry.getInstance();
        const preferredProject = projectRegistry.findProjectsForSourceFile(editor.document.uri)[0];
        const filterItems = buildSemanticNavigationFilterItems(
            inspectionResult.inspection,
            preferredProject,
            projectRegistry,
        );
        const selectedFilters = await vscode.window.showQuickPick<SemanticNavigationFilterQuickPickItem>(filterItems, {
            canPickMany: true,
            ignoreFocusOut: true,
            placeHolder: PB_USER_MESSAGES.commands.semanticNavigateFilterPlaceholder,
        });

        if (!selectedFilters) {
            return;
        }

        const filteredSymbols = applySemanticNavigationFilters(index.getAllSymbols(), selectedFilters)
            .sort((left, right) => compareSemanticNavigationSymbols(left, right, inspectionResult.inspection));

        if (filteredSymbols.length === 0) {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.semanticNavigateNoMatches);
            return;
        }

        const pickedSymbol = await vscode.window.showQuickPick(
            buildSemanticNavigationSymbolItems(filteredSymbols, inspectionResult.inspection),
            {
                matchOnDescription: true,
                matchOnDetail: true,
                placeHolder: buildSemanticNavigationSymbolPlaceholder(filteredSymbols.length, selectedFilters.length),
            },
        );

        if (pickedSymbol) {
            await revealSymbolInEditor(pickedSymbol.symbol);
        }
    });

    const runSemanticNavigate = vscode.commands.registerCommand('powerbuilder.runSemanticNavigate', async (args?: unknown) => {
        const target = await resolveSemanticQueryCommandTarget(args);

        if (target.kind !== 'resolved') {
            return target;
        }

        if (target.document.languageId !== 'powerbuilder') {
            return {
                kind: 'unsupported' as const,
                reason: PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor,
            };
        }

        if (!isIdeSafePowerBuilderDocument(target.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            return {
                kind: 'unsupported' as const,
                reason: PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            };
        }

        const requestedFilterIds = parseSemanticNavigationFilterIds(args);

        if (requestedFilterIds.kind !== 'valid') {
            return requestedFilterIds;
        }

        await indexer.indexProjects();

        const inspectionResult = await hierarchyInspectionService.explainForDocument(
            target.document,
            target.position,
        );

        if (inspectionResult.kind !== 'generated') {
            return {
                kind: 'unsupported' as const,
                reason: inspectionResult.reason,
            };
        }

        const projectRegistry = PowerBuilderProjectRegistry.getInstance();
        const preferredProject = projectRegistry.findProjectsForSourceFile(target.document.uri)[0];
        const filterItems = buildSemanticNavigationFilterItems(
            inspectionResult.inspection,
            preferredProject,
            projectRegistry,
        );
        const selectedFilters = filterItems.filter(item => requestedFilterIds.filterIds.includes(item.filterId));
        const filteredSymbols = applySemanticNavigationFilters(index.getAllSymbols(), selectedFilters)
            .sort((left, right) => compareSemanticNavigationSymbols(left, right, inspectionResult.inspection));

        if (filteredSymbols.length === 0) {
            return {
                kind: 'no-matches' as const,
                reason: PB_USER_MESSAGES.commands.semanticNavigateNoMatches,
                availableFilters: filterItems.map(item => serializeSemanticNavigationFilter(item, selectedFilters)),
                appliedFilters: selectedFilters.map(filter => filter.filterId),
                symbols: [],
            };
        }

        const items = buildSemanticNavigationSymbolItems(filteredSymbols, inspectionResult.inspection, projectRegistry);

        return {
            kind: 'generated' as const,
            document: {
                uri: target.document.uri.toString(),
                relativePath: vscode.workspace.asRelativePath(target.document.uri, false),
                position: {
                    line: target.position.line,
                    character: target.position.character,
                },
            },
            inspection: {
                requestedWord: inspectionResult.inspection.requestedWord,
                currentObjectName: inspectionResult.inspection.currentObjectName,
                relevantOwnerName: inspectionResult.inspection.relevantOwnerName,
                preferredProjectName: preferredProject?.name,
            },
            availableFilters: filterItems.map(item => serializeSemanticNavigationFilter(item, selectedFilters)),
            appliedFilters: selectedFilters.map(filter => filter.filterId),
            symbols: items.map(item => serializeSemanticNavigationSymbolItem(item)),
        };
    });

    const showInfo = vscode.commands.registerCommand('powerbuilder.showObjectInfo', () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder') {
            return;
        }

        if (isDataWindowUri(editor.document.uri)) {
            const result = dataWindowParser.parseDocument(editor.document);

            void vscode.window.showInformationMessage(
                formatDataWindowObjectInfoEs({
                    fileName: getFileName(editor.document.uri),
                    objectName: result.metadata.objectName,
                    bandNames: result.metadata.bandNames,
                    tableColumnCount: result.metadata.tableColumnNames.length,
                    textCount: result.metadata.textCount,
                    displayColumnCount: result.metadata.displayColumnCount,
                    retrieveStatement: result.metadata.retrieveStatement,
                }),
            );

            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            void vscode.window.showWarningMessage(
                PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            );
            return;
        }

        const symbols = index.getSymbolsForFile(editor.document.uri);
        const types = symbols.filter(s => s.kind === 'type' || s.kind === 'structure');
        const funcs = symbols.filter(s => s.kind === 'function' || s.kind === 'subroutine');
        const events = symbols.filter(s => s.kind === 'event');
        const vars = symbols.filter(s => s.kind === 'variable' || s.kind === 'constant');

        const message = formatObjectInfoEs({
            fileName: getFileName(editor.document.uri),
            typeCount: types.length,
            functionCount: funcs.length,
            eventCount: events.length,
            variableCount: vars.length,
        });

        vscode.window.showInformationMessage(message);
    });

    const generateCurrentObjectDocumentation = vscode.commands.registerCommand('powerbuilder.generateDocumentationCurrentObject', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder') {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor);
            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            void vscode.window.showWarningMessage(
                PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            );
            return;
        }

        const result = await documentationService.generateDocumentationForCurrentObject(editor.document);

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return;
        }

        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: documentación Markdown generada para ${result.model.objectName} en ${result.file.relativePath}`,
        );
    });

    const generateCurrentProjectDocumentation = vscode.commands.registerCommand('powerbuilder.generateDocumentationCurrentProject', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder') {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor);
            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            void vscode.window.showWarningMessage(
                PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            );
            return;
        }

        const result = await documentationService.generateDocumentationForCurrentProject(editor.document);

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return;
        }

        const projectIndex = result.indexFiles.find(file => file.relativePath.endsWith('/project-index.md'));

        if (projectIndex) {
            const generatedDocument = await vscode.workspace.openTextDocument(projectIndex.uri);
            await vscode.window.showTextDocument(generatedDocument, { preview: false });
        }

        void vscode.window.showInformationMessage(
            `PowerBuilder: documentación Markdown del proyecto ${result.project.name} generada con ${result.objectFiles.length} objeto(s) y ${result.indexFiles.length} índice(s).`,
        );
    });

    const regenerateDocumentationIndexes = vscode.commands.registerCommand('powerbuilder.regenerateDocumentationIndexes', async () => {
        const result = await documentationService.regenerateDocumentationIndexes();

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return;
        }

        const indexFileCount = result.projects.reduce((count, projectResult) => count + projectResult.indexFiles.length, 0);

        void vscode.window.showInformationMessage(
            `PowerBuilder: índices de documentación regenerados para ${result.projects.length} proyecto(s) con ${indexFileCount} archivo(s) Markdown.`,
        );
    });

    const exportSemanticDocument = vscode.commands.registerCommand('powerbuilder.exportSemanticDocument', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder') {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor);
            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            void vscode.window.showWarningMessage(
                PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            );
            return;
        }

        const result = await artifactService.generateSemanticDocumentExport(
            editor.document,
            editor.selection.active,
        );

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return;
        }

        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: export semántico JSON del documento generado en ${result.file.relativePath}.`,
        );
    });

    const exportSemanticProject = vscode.commands.registerCommand('powerbuilder.exportSemanticProject', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder') {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor);
            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            void vscode.window.showWarningMessage(
                PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            );
            return;
        }

        const result = await artifactService.generateSemanticProjectExport(editor.document);

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return;
        }

        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: export semántico JSON del proyecto ${result.project.name} generado en ${result.file.relativePath}.`,
        );
    });

    const exportSemanticQuery = vscode.commands.registerCommand('powerbuilder.exportSemanticQuery', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder') {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor);
            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            void vscode.window.showWarningMessage(
                PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            );
            return;
        }

        const result = await artifactService.generateSemanticQueryExport(
            editor.document,
            editor.selection.active,
        );

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return;
        }

        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: export de query semántica generado en ${result.file.relativePath}.`,
        );
    });

    const exportOverloadResolutionExplanation = vscode.commands.registerCommand('powerbuilder.exportOverloadResolutionExplanation', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder') {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor);
            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            void vscode.window.showWarningMessage(
                PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            );
            return;
        }

        const result = await artifactService.generateOverloadResolutionExplanationExport(
            editor.document,
            editor.selection.active,
        );

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return;
        }

        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: export de explicación de overloads generado en ${result.file.relativePath}.`,
        );
    });

    const runSemanticQuery = vscode.commands.registerCommand('powerbuilder.runSemanticQuery', async (args?: unknown) => {
        const target = await resolveSemanticQueryCommandTarget(args);

        if (target.kind !== 'resolved') {
            if (args === undefined) {
                void vscode.window.showWarningMessage(target.reason);
            }

            return target;
        }

        if (target.document.languageId !== 'powerbuilder') {
            const result = {
                kind: 'unsupported' as const,
                reason: PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor,
            };

            if (args === undefined) {
                void vscode.window.showWarningMessage(result.reason);
            }

            return result;
        }

        if (!isIdeSafePowerBuilderDocument(target.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            const result = {
                kind: 'unsupported' as const,
                reason: PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            };

            if (args === undefined) {
                void vscode.window.showWarningMessage(result.reason);
            }

            return result;
        }

        return artifactService.runSemanticQuery(target.document, target.position);
    });

    const runOverloadResolutionExplanation = vscode.commands.registerCommand('powerbuilder.runOverloadResolutionExplanation', async (args?: unknown) => {
        const target = await resolveSemanticQueryCommandTarget(args);

        if (target.kind !== 'resolved') {
            if (args === undefined) {
                void vscode.window.showWarningMessage(target.reason);
            }

            return target;
        }

        if (target.document.languageId !== 'powerbuilder') {
            const result = {
                kind: 'unsupported' as const,
                reason: PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor,
            };

            if (args === undefined) {
                void vscode.window.showWarningMessage(result.reason);
            }

            return result;
        }

        if (!isIdeSafePowerBuilderDocument(target.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            const result = {
                kind: 'unsupported' as const,
                reason: PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            };

            if (args === undefined) {
                void vscode.window.showWarningMessage(result.reason);
            }

            return result;
        }

        const result = await artifactService.runOverloadResolutionExplanation(target.document, target.position);

        if (result.kind !== 'generated' && args === undefined) {
            void vscode.window.showWarningMessage(result.reason);
        }

        return result;
    });

    const runSemanticQueryBatch = vscode.commands.registerCommand('powerbuilder.runSemanticQueryBatch', async (args?: unknown) => {
        const parsedArgs = parseSemanticQueryBatchCommandArgs(args);

        if (parsedArgs.kind !== 'valid') {
            return parsedArgs;
        }

        const items: SemanticQueryBatchExportPayload['items'] = [];
        let stoppedEarly = false;

        for (const request of parsedArgs.requests) {
            const target = await resolveSemanticQueryCommandTarget(request);

            if (target.kind !== 'resolved') {
                items.push(buildSemanticQueryBatchItem(request, target.kind, undefined, target.reason));

                if (parsedArgs.stopOnError) {
                    stoppedEarly = true;
                    break;
                }

                continue;
            }

            if (target.document.languageId !== 'powerbuilder') {
                items.push(buildSemanticQueryBatchItem(
                    request,
                    'unsupported',
                    target.document.uri,
                    PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor,
                    undefined,
                    target.position,
                ));

                if (parsedArgs.stopOnError) {
                    stoppedEarly = true;
                    break;
                }

                continue;
            }

            if (!isIdeSafePowerBuilderDocument(target.document, getConfig().dataWindowExperimentalIdeEnabled)) {
                items.push(buildSemanticQueryBatchItem(
                    request,
                    'unsupported',
                    target.document.uri,
                    PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
                    undefined,
                    target.position,
                ));

                if (parsedArgs.stopOnError) {
                    stoppedEarly = true;
                    break;
                }

                continue;
            }

            const result = await artifactService.runSemanticQuery(target.document, target.position);

            items.push(buildSemanticQueryBatchItem(
                request,
                result.kind,
                target.document.uri,
                result.kind === 'generated' ? undefined : result.reason,
                result.kind === 'generated' ? result.payload : undefined,
                target.position,
            ));

            if (parsedArgs.stopOnError && result.kind !== 'generated') {
                stoppedEarly = true;
                break;
            }
        }

        const generatedCount = items.filter(item => item.resultKind === 'generated').length;

        return {
            kind: 'generated' as const,
            payload: {
                kind: 'powerbuilder-semantic-query-batch',
                schemaVersion: 1,
                generatedAt: new Date().toISOString(),
                summary: {
                    requestCount: parsedArgs.requests.length,
                    generatedCount,
                    nonGeneratedCount: items.length - generatedCount,
                    stoppedEarly,
                },
                items,
            },
        };
    });

    const runActiveHierarchyInspection = vscode.commands.registerCommand('powerbuilder.runActiveHierarchyInspection', async (args?: unknown) => {
        const target = await resolveSemanticQueryCommandTarget(args);

        if (target.kind !== 'resolved') {
            if (args === undefined) {
                void vscode.window.showWarningMessage(target.reason);
            }

            return target;
        }

        if (target.document.languageId !== 'powerbuilder') {
            const result = {
                kind: 'unsupported' as const,
                reason: PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor,
            };

            if (args === undefined) {
                void vscode.window.showWarningMessage(result.reason);
            }

            return result;
        }

        if (!isIdeSafePowerBuilderDocument(target.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            const result = {
                kind: 'unsupported' as const,
                reason: PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            };

            if (args === undefined) {
                void vscode.window.showWarningMessage(result.reason);
            }

            return result;
        }

        return artifactService.runActiveHierarchyInspection(target.document, target.position);
    });

    const runAncestorScriptInspection = vscode.commands.registerCommand('powerbuilder.runAncestorScriptInspection', async (args?: unknown) => {
        const target = await resolveSemanticQueryCommandTarget(args);

        if (target.kind !== 'resolved') {
            if (args === undefined) {
                void vscode.window.showWarningMessage(target.reason);
            }

            return target;
        }

        if (target.document.languageId !== 'powerbuilder') {
            const result = {
                kind: 'unsupported' as const,
                reason: PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor,
            };

            if (args === undefined) {
                void vscode.window.showWarningMessage(result.reason);
            }

            return result;
        }

        if (!isIdeSafePowerBuilderDocument(target.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            const result = {
                kind: 'unsupported' as const,
                reason: PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            };

            if (args === undefined) {
                void vscode.window.showWarningMessage(result.reason);
            }

            return result;
        }

        return artifactService.runAncestorScriptInspection(target.document, target.position);
    });

    const exportRuntimeCatalog = vscode.commands.registerCommand('powerbuilder.exportRuntimeCatalog', async () => {
        const result = await artifactService.generateRuntimeCatalogExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: catálogo runtime estructurado generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportWorkspaceManifest = vscode.commands.registerCommand('powerbuilder.exportWorkspaceManifest', async () => {
        const result = await artifactService.generateWorkspaceManifestExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: manifest multiproyecto generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportVisibilityAudit = vscode.commands.registerCommand('powerbuilder.exportVisibilityAudit', async () => {
        const result = await artifactService.generateVisibilityAuditExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: auditoría de visibilidad generada en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportInheritanceOwnerGraph = vscode.commands.registerCommand('powerbuilder.exportInheritanceOwnerGraph', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder') {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor);
            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            void vscode.window.showWarningMessage(
                PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            );
            return;
        }

        const result = await artifactService.generateInheritanceOwnerGraphExport(editor.document);

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return;
        }

        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: grafo de herencia y owners generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportScriptDependencyGraph = vscode.commands.registerCommand('powerbuilder.exportScriptDependencyGraph', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder') {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor);
            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            void vscode.window.showWarningMessage(
                PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            );
            return;
        }

        const result = await artifactService.generateScriptDependencyGraphExport(editor.document);

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return;
        }

        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: grafo de dependencias de script generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportAutomationSurface = vscode.commands.registerCommand('powerbuilder.exportAutomationSurface', async () => {
        const result = await artifactService.generateAutomationSurfaceManifestExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: manifest de automatización generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportPublicContractSchemas = vscode.commands.registerCommand('powerbuilder.exportPublicContractSchemas', async () => {
        const result = await artifactService.generatePublicContractSchemasExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: schemas públicos generados en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportPublicContractCatalog = vscode.commands.registerCommand('powerbuilder.exportPublicContractCatalog', async () => {
        const result = await artifactService.generatePublicContractCatalogExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: catálogo público de contratos generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportBuildContractCatalog = vscode.commands.registerCommand('powerbuilder.exportBuildContractCatalog', async () => {
        const result = await artifactService.generateBuildContractCatalogExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: catálogo contractual del loop de build generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportHostContributionInventory = vscode.commands.registerCommand('powerbuilder.exportHostContributionInventory', async () => {
        const result = await artifactService.generateHostContributionInventoryExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: inventario host-aware de contributions generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportAutomationCoverageAudit = vscode.commands.registerCommand('powerbuilder.exportAutomationCoverageAudit', async () => {
        const result = await artifactService.generateAutomationCoverageAuditExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: auditoría de cobertura automation generada en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportAutomationReplay = vscode.commands.registerCommand('powerbuilder.exportAutomationReplay', async (args?: unknown) => {
        const parsedArgs = parseAutomationReplayCommandArgs(args);

        if (parsedArgs.kind !== 'valid') {
            void vscode.window.showWarningMessage(parsedArgs.reason);
            return parsedArgs;
        }

        const result = await artifactService.generateAutomationReplayExport(
            parsedArgs.steps,
            {
                stopOnError: parsedArgs.stopOnError,
                name: parsedArgs.name,
            },
            vscode.window.activeTextEditor?.document.uri,
        );
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: replay automation exportado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportWorkspaceDiagnosticsTree = vscode.commands.registerCommand('powerbuilder.exportWorkspaceDiagnosticsTree', async () => {
        const result = await artifactService.generateWorkspaceDiagnosticsTreeExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: árbol workspace-wide de diagnostics generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportFeatureSupportSnapshot = vscode.commands.registerCommand('powerbuilder.exportFeatureSupportSnapshot', async () => {
        const result = await artifactService.generateFeatureSupportSnapshotExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: snapshot del soporte real generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportWorkspaceArtifactBundle = vscode.commands.registerCommand('powerbuilder.exportWorkspaceArtifactBundle', async () => {
        const result = await artifactService.generateWorkspaceArtifactBundleExport(
            vscode.window.activeTextEditor?.document.uri,
            autoBuildService,
        );
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: bundle de artefactos del workspace generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportDataWindowManifest = vscode.commands.registerCommand('powerbuilder.exportDataWindowManifest', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder' || !isDataWindowUri(editor.document.uri)) {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.exportDataWindowManifestNoActiveEditor);
            return;
        }

        const result = await artifactService.generateDataWindowManifestExport(editor.document);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: manifest DataWindow generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportDataWindowWorkspaceCatalog = vscode.commands.registerCommand('powerbuilder.exportDataWindowWorkspaceCatalog', async () => {
        const result = await artifactService.generateDataWindowWorkspaceCatalogExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: catálogo workspace-wide de DataWindow generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportDataWindowChildGraph = vscode.commands.registerCommand('powerbuilder.exportDataWindowChildGraph', async () => {
        const result = await artifactService.generateDataWindowChildGraphExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: grafo parent-child de DataWindow generado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportSemanticSnapshotDiff = vscode.commands.registerCommand('powerbuilder.exportSemanticSnapshotDiff', async (args?: unknown) => {
        const parsedArgs = parseSemanticSnapshotDiffCommandArgs(args);

        if (parsedArgs.kind !== 'valid') {
            void vscode.window.showWarningMessage(parsedArgs.reason);
            return parsedArgs;
        }

        const result = await artifactService.generateSemanticSnapshotDiffExport(
            parsedArgs.leftUri,
            parsedArgs.rightUri,
            vscode.window.activeTextEditor?.document.uri,
        );

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return result;
        }

        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: diff semántico exportado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportWorkspaceManifestDiff = vscode.commands.registerCommand('powerbuilder.exportWorkspaceManifestDiff', async (args?: unknown): Promise<GenerateWorkspaceManifestDiffExportResult | { kind: 'invalid-arguments'; reason: string } | undefined> => {
        const parsedArgs = parseWorkspaceManifestDiffCommandArgs(args);

        if (parsedArgs.kind !== 'valid') {
            void vscode.window.showWarningMessage(parsedArgs.reason);
            return parsedArgs;
        }

        const result = await artifactService.generateWorkspaceManifestDiffExport(
            parsedArgs.leftUri,
            parsedArgs.rightUri,
            vscode.window.activeTextEditor?.document.uri,
        );

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return result;
        }

        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: diff de manifest del workspace exportado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportPublicContractCatalogDiff = vscode.commands.registerCommand('powerbuilder.exportPublicContractCatalogDiff', async (args?: unknown): Promise<GeneratePublicContractCatalogDiffExportResult | { kind: 'invalid-arguments'; reason: string } | undefined> => {
        const parsedArgs = parseArtifactDiffCommandArgs(args, 'exportPublicContractCatalogDiff');

        if (parsedArgs.kind !== 'valid') {
            void vscode.window.showWarningMessage(parsedArgs.reason);
            return parsedArgs;
        }

        const result = await artifactService.generatePublicContractCatalogDiffExport(
            parsedArgs.leftUri,
            parsedArgs.rightUri,
            vscode.window.activeTextEditor?.document.uri,
        );

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return result;
        }

        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: diff contractual exportado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportWorkspaceArtifactBundleDiff = vscode.commands.registerCommand('powerbuilder.exportWorkspaceArtifactBundleDiff', async (args?: unknown): Promise<GenerateWorkspaceArtifactBundleDiffExportResult | { kind: 'invalid-arguments'; reason: string } | undefined> => {
        const parsedArgs = parseArtifactDiffCommandArgs(args, 'exportWorkspaceArtifactBundleDiff');

        if (parsedArgs.kind !== 'valid') {
            void vscode.window.showWarningMessage(parsedArgs.reason);
            return parsedArgs;
        }

        const result = await artifactService.generateWorkspaceArtifactBundleDiffExport(
            parsedArgs.leftUri,
            parsedArgs.rightUri,
            vscode.window.activeTextEditor?.document.uri,
        );

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return result;
        }

        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: diff de bundle workspace-wide exportado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const exportCacheInvalidationSnapshot = vscode.commands.registerCommand('powerbuilder.exportCacheInvalidationSnapshot', async () => {
        const result = await artifactService.generateCacheInvalidationSnapshotExport(vscode.window.activeTextEditor?.document.uri);
        const generatedDocument = await vscode.workspace.openTextDocument(result.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: snapshot de cache e invalidación exportado en ${result.file.relativePath}.`,
        );

        return result;
    });

    const buildCurrentProject = vscode.commands.registerCommand('powerbuilder.buildCurrentProject', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || !isBuildCommandDocument(editor.document)) {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.buildCurrentProjectNoActiveEditor);
            return;
        }

        await runBuildCommand(
            PB_USER_MESSAGES.commands.buildCurrentProjectInspecting,
            () => autoBuildService.buildCurrentProject(editor.document),
            'PBAutoBuild: no se pudo compilar el proyecto actual.',
            'PowerBuilder: no se pudo compilar el proyecto actual con PBAutoBuild.',
        );
    });

    const rebuildLastProject = vscode.commands.registerCommand('powerbuilder.rebuildLastProject', async () => {
        await runBuildCommand(
            PB_USER_MESSAGES.commands.rebuildLastProjectInspecting,
            () => autoBuildService.rebuildLastProject(),
            'PBAutoBuild: no se pudo recompilar el último proyecto.',
            'PowerBuilder: no se pudo recompilar el último proyecto con PBAutoBuild.',
        );
    });

    const showLastBuildOutput = vscode.commands.registerCommand('powerbuilder.showLastBuildOutput', async () => {
        const result = autoBuildService.getLastBuildResult();

        if (!result) {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.buildNoPreviousSession);
            return;
        }

        const outputDocument = await vscode.workspace.openTextDocument({
            language: 'plaintext',
            content: formatPbAutoBuildOutputDocument(result),
        });
        await vscode.window.showTextDocument(outputDocument, { preview: false });
    });

    const exportLastBuildReport = vscode.commands.registerCommand('powerbuilder.exportLastBuildReport', async () => {
        const result = autoBuildService.getLastBuildResult();

        if (!result) {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.buildNoPreviousSession);
            return;
        }

        const exportResult = await artifactService.generateBuildReportExport(
            result,
            vscode.window.activeTextEditor?.document.uri,
        );
        const generatedDocument = await vscode.workspace.openTextDocument(exportResult.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: build report JSON generado en ${exportResult.file.relativePath}.`,
        );

        return exportResult;
    });

    const runBuildSessionManifest = vscode.commands.registerCommand('powerbuilder.runBuildSessionManifest', async () => {
        return artifactService.runBuildSessionManifest(autoBuildService);
    });

    const runWorkspaceBuildPreference = vscode.commands.registerCommand('powerbuilder.runWorkspaceBuildPreference', async (args?: unknown): Promise<RunWorkspaceBuildPreferenceResult | { kind: 'invalid-arguments'; reason: string }> => {
        const parsedArgs = parseWorkspaceBuildPreferenceCommandArgs(args);

        if (parsedArgs.kind !== 'valid') {
            return parsedArgs;
        }

        return artifactService.runWorkspaceBuildPreference(parsedArgs.anchorUri);
    });

    const exportWorkspaceBuildPreference = vscode.commands.registerCommand('powerbuilder.exportWorkspaceBuildPreference', async (args?: unknown): Promise<GenerateWorkspaceBuildPreferenceExportResult | { kind: 'invalid-arguments'; reason: string }> => {
        const parsedArgs = parseWorkspaceBuildPreferenceCommandArgs(args);

        if (parsedArgs.kind !== 'valid') {
            void vscode.window.showWarningMessage(parsedArgs.reason);
            return parsedArgs;
        }

        const exportResult = await artifactService.generateWorkspaceBuildPreferenceExport(
            parsedArgs.anchorUri ?? vscode.window.activeTextEditor?.document.uri,
        );
        const generatedDocument = await vscode.workspace.openTextDocument(exportResult.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: preferencia build/workspace exportada en ${exportResult.file.relativePath}.`,
        );

        return exportResult;
    });

    const exportBuildSessionManifest = vscode.commands.registerCommand('powerbuilder.exportBuildSessionManifest', async () => {
        const exportResult = await artifactService.generateBuildSessionManifestExport(
            autoBuildService,
            vscode.window.activeTextEditor?.document.uri,
        );
        const generatedDocument = await vscode.workspace.openTextDocument(exportResult.file.uri);

        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: manifest de sesión de build generado en ${exportResult.file.relativePath}.`,
        );

        return exportResult;
    });

    const clearBuildProblems = vscode.commands.registerCommand('powerbuilder.clearBuildProblems', () => {
        autoBuildService.clearDiagnostics();
        void vscode.window.showInformationMessage(PB_USER_MESSAGES.commands.buildProblemsCleared);
    });

    const explainActiveHierarchy = vscode.commands.registerCommand('powerbuilder.explainActiveHierarchy', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder') {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor);
            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            void vscode.window.showWarningMessage(
                PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            );
            return;
        }

        const result = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: PB_USER_MESSAGES.commands.explainActiveHierarchyInspecting,
            },
            async () => hierarchyInspectionService.explainForDocument(
                editor.document,
                editor.selection.active,
            ),
        );

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return;
        }

        const generatedDocument = await vscode.workspace.openTextDocument({
            language: 'markdown',
            content: result.markdown,
        });
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: jerarquía activa inspeccionada con precisión ${result.inspection.precision}.`,
        );
    });

    const showInheritanceHierarchy = vscode.commands.registerCommand('powerbuilder.showInheritanceHierarchy', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder') {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor);
            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            void vscode.window.showWarningMessage(
                PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            );
            return;
        }

        const result = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: PB_USER_MESSAGES.commands.showInheritanceHierarchyInspecting,
            },
            async () => inheritanceHierarchyService.showForDocument(
                editor.document,
                editor.selection.active,
            ),
        );

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return;
        }

        const generatedDocument = await vscode.workspace.openTextDocument({
            language: 'markdown',
            content: result.markdown,
        });
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: jerarquía de herencia publicada con precisión ${result.inspection.precision}.`,
        );
    });

    const findAncestorScript = vscode.commands.registerCommand('powerbuilder.findAncestorScript', async () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.document.languageId !== 'powerbuilder') {
            void vscode.window.showWarningMessage(PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor);
            return;
        }

        if (!isIdeSafePowerBuilderDocument(editor.document, getConfig().dataWindowExperimentalIdeEnabled)) {
            void vscode.window.showWarningMessage(
                PB_USER_MESSAGES.commands.experimentalDataWindowIdeDisabled,
            );
            return;
        }

        const result = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: PB_USER_MESSAGES.commands.findAncestorScriptInspecting,
            },
            async () => ancestorScriptService.showForDocument(
                editor.document,
                editor.selection.active,
            ),
        );

        if (result.kind !== 'generated') {
            void vscode.window.showWarningMessage(result.reason);
            return;
        }

        const generatedDocument = await vscode.workspace.openTextDocument({
            language: 'markdown',
            content: result.markdown,
        });
        await vscode.window.showTextDocument(generatedDocument, { preview: false });
        void vscode.window.showInformationMessage(
            `PowerBuilder: Find Ancestor Script publicado con precisión ${result.inspection.precision}.`,
        );
    });

    const languageModelToolDisposables = registerPowerBuilderLanguageModelTools();

    const disposeAutoBuildService = new vscode.Disposable(() => {
        autoBuildService.dispose();
    });

    context.subscriptions.push(
        reindex,
        goToSymbol,
        semanticNavigate,
        runSemanticNavigate,
        exportSemanticDocument,
        exportSemanticProject,
        exportSemanticQuery,
        exportOverloadResolutionExplanation,
        runSemanticQuery,
        runOverloadResolutionExplanation,
        runSemanticQueryBatch,
        runActiveHierarchyInspection,
        runAncestorScriptInspection,
        exportRuntimeCatalog,
        exportWorkspaceManifest,
        exportVisibilityAudit,
        exportInheritanceOwnerGraph,
        exportScriptDependencyGraph,
        exportAutomationSurface,
        exportPublicContractSchemas,
        exportPublicContractCatalog,
        exportBuildContractCatalog,
        exportHostContributionInventory,
        exportAutomationCoverageAudit,
        exportAutomationReplay,
        exportPublicContractCatalogDiff,
        exportWorkspaceArtifactBundleDiff,
        exportCacheInvalidationSnapshot,
        exportWorkspaceDiagnosticsTree,
        exportFeatureSupportSnapshot,
        exportWorkspaceArtifactBundle,
        exportDataWindowManifest,
        exportDataWindowWorkspaceCatalog,
        exportDataWindowChildGraph,
        exportSemanticSnapshotDiff,
        exportWorkspaceManifestDiff,
        showInfo,
        buildCurrentProject,
        rebuildLastProject,
        showLastBuildOutput,
        exportLastBuildReport,
        runBuildSessionManifest,
        runWorkspaceBuildPreference,
        exportWorkspaceBuildPreference,
        exportBuildSessionManifest,
        clearBuildProblems,
        explainActiveHierarchy,
        showInheritanceHierarchy,
        findAncestorScript,
        generateCurrentObjectDocumentation,
        generateCurrentProjectDocumentation,
        regenerateDocumentationIndexes,
        disposeAutoBuildService,
        ...languageModelToolDisposables,
    );
    return [
        reindex,
        goToSymbol,
        semanticNavigate,
        runSemanticNavigate,
        exportSemanticDocument,
        exportSemanticProject,
        exportSemanticQuery,
        exportOverloadResolutionExplanation,
        runSemanticQuery,
        runOverloadResolutionExplanation,
        runSemanticQueryBatch,
        runActiveHierarchyInspection,
        runAncestorScriptInspection,
        exportRuntimeCatalog,
        exportWorkspaceManifest,
        exportVisibilityAudit,
        exportInheritanceOwnerGraph,
        exportScriptDependencyGraph,
        exportAutomationSurface,
        exportPublicContractSchemas,
        exportPublicContractCatalog,
        exportBuildContractCatalog,
        exportHostContributionInventory,
        exportAutomationCoverageAudit,
        exportAutomationReplay,
        exportPublicContractCatalogDiff,
        exportWorkspaceArtifactBundleDiff,
        exportCacheInvalidationSnapshot,
        exportWorkspaceDiagnosticsTree,
        exportFeatureSupportSnapshot,
        exportWorkspaceArtifactBundle,
        exportDataWindowManifest,
        exportDataWindowWorkspaceCatalog,
        exportDataWindowChildGraph,
        exportSemanticSnapshotDiff,
        exportWorkspaceManifestDiff,
        showInfo,
        buildCurrentProject,
        rebuildLastProject,
        showLastBuildOutput,
        exportLastBuildReport,
        runBuildSessionManifest,
        runWorkspaceBuildPreference,
        exportWorkspaceBuildPreference,
        exportBuildSessionManifest,
        clearBuildProblems,
        explainActiveHierarchy,
        showInheritanceHierarchy,
        findAncestorScript,
        generateCurrentObjectDocumentation,
        generateCurrentProjectDocumentation,
        regenerateDocumentationIndexes,
        disposeAutoBuildService,
        ...languageModelToolDisposables,
    ];
}

function isBuildCommandDocument(document: vscode.TextDocument): boolean {
    return document.languageId === 'powerbuilder'
    || isPbBuildTargetUri(document.uri);
}

function mapKindToIcon(kind: string): string {
    switch (kind) {
        case 'type':
            return 'class';
        case 'function':
            return 'method';
        case 'subroutine':
            return 'method';
        case 'event':
            return 'event';
        case 'variable':
            return 'field';
        case 'constant':
            return 'constant';
        case 'structure':
            return 'struct';
        default:
            return 'misc';
    }
}

function getFileName(uri: vscode.Uri): string {
    const parts = uri.path.split('/');
    return parts[parts.length - 1] || uri.path;
}

type SemanticNavigationFilterId =
    | 'project'
    | 'owner'
    | 'required-owner'
    | 'hierarchy'
    | 'strict-hierarchy'
    | 'return'
    | 'target';

interface SemanticNavigationFilterQuickPickItem extends vscode.QuickPickItem {
    filterId: SemanticNavigationFilterId;
    matchesSymbol: (symbol: PbSymbol) => boolean;
}

type ResolveSemanticQueryCommandTargetResult =
    | {
        kind: 'resolved';
        document: vscode.TextDocument;
        position: vscode.Position;
    }
    | {
        kind: 'unsupported';
        reason: string;
    }
    | {
        kind: 'invalid-arguments';
        reason: string;
    };

interface SemanticQueryCommandArgs {
    uri?: vscode.Uri | string;
    line?: number;
    character?: number;
}

interface SemanticNavigateCommandArgs extends SemanticQueryCommandArgs {
    filters?: SemanticNavigationFilterId[];
}

interface SemanticQueryBatchRequestArgs extends SemanticQueryCommandArgs {
    label?: string;
}

interface SemanticQueryBatchCommandArgs {
    requests?: SemanticQueryBatchRequestArgs[];
    stopOnError?: boolean;
}

interface WorkspaceBuildPreferenceCommandArgs {
    uri?: vscode.Uri | string;
}

interface SemanticSnapshotDiffCommandArgs {
    leftUri?: vscode.Uri | string;
    rightUri?: vscode.Uri | string;
}

interface WorkspaceManifestDiffCommandArgs {
    leftUri?: vscode.Uri | string;
    rightUri?: vscode.Uri | string;
}

interface AutomationReplayCommandStepArgs {
    kind?: 'command' | 'language-model-tool' | 'languageModelTool';
    id?: string;
    label?: string;
    args?: unknown;
}

interface AutomationReplayCommandArgs {
    steps?: AutomationReplayCommandStepArgs[];
    stopOnError?: boolean;
    name?: string;
}

interface SemanticNavigationSymbolQuickPickItem extends vscode.QuickPickItem {
    symbol: PbSymbol;
}

function parseSemanticQueryBatchCommandArgs(
    args?: unknown,
): { kind: 'valid'; requests: SemanticQueryBatchRequestArgs[]; stopOnError: boolean } | { kind: 'invalid-arguments'; reason: string } {
    if (!args || typeof args !== 'object') {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: runSemanticQueryBatch espera un objeto con requests y stopOnError opcional.',
        };
    }

    const { requests, stopOnError } = args as SemanticQueryBatchCommandArgs;

    if (!Array.isArray(requests) || requests.length === 0 || requests.some(request => !request || typeof request !== 'object')) {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: runSemanticQueryBatch requiere requests como un array no vacío de objetos target.',
        };
    }

    if (stopOnError !== undefined && typeof stopOnError !== 'boolean') {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: runSemanticQueryBatch solo acepta stopOnError booleano cuando se indica.',
        };
    }

    if (requests.some(request => request.label !== undefined && typeof request.label !== 'string')) {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: runSemanticQueryBatch solo acepta label string cuando se indica en cada request.',
        };
    }

    return {
        kind: 'valid',
        requests,
        stopOnError: stopOnError ?? false,
    };
}

function buildSemanticQueryBatchItem(
    request: SemanticQueryBatchRequestArgs,
    resultKind: SemanticQueryBatchExportPayload['items'][number]['resultKind'],
    resolvedUri?: vscode.Uri,
    reason?: string,
    payload?: SemanticQueryBatchExportPayload['items'][number]['payload'],
    position?: vscode.Position,
): SemanticQueryBatchExportPayload['items'][number] {
    const uri = resolvedUri
        ?? parseSemanticQueryCommandUri(request.uri);
    const rawUri = typeof request.uri === 'string'
        ? request.uri
        : request.uri?.toString();
    const serializedRequest: SemanticQueryBatchExportPayload['items'][number]['request'] = {};

    if (uri) {
        serializedRequest.uri = uri.toString();
        serializedRequest.relativePath = vscode.workspace.asRelativePath(uri, false);
    } else if (rawUri) {
        serializedRequest.uri = rawUri;
    }

    if (position) {
        serializedRequest.line = position.line;
        serializedRequest.character = position.character;
    } else {
        if (typeof request.line === 'number') {
            serializedRequest.line = request.line;
        }

        if (typeof request.character === 'number') {
            serializedRequest.character = request.character;
        }
    }

    const item: SemanticQueryBatchExportPayload['items'][number] = {
        request: serializedRequest,
        resultKind,
    };

    if (request.label !== undefined) {
        item.label = request.label;
    }

    if (reason !== undefined) {
        item.reason = reason;
    }

    if (payload !== undefined) {
        item.payload = payload;
    }

    return item;
}

function parseSemanticNavigationFilterIds(
    args?: unknown,
): { kind: 'valid'; filterIds: SemanticNavigationFilterId[] } | { kind: 'invalid-arguments'; reason: string } {
    if (args === undefined) {
        return {
            kind: 'valid',
            filterIds: [],
        };
    }

    if (!args || typeof args !== 'object') {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: runSemanticNavigate espera un objeto con filtros opcionales.',
        };
    }

    const { filters } = args as SemanticNavigateCommandArgs;

    if (filters === undefined) {
        return {
            kind: 'valid',
            filterIds: [],
        };
    }

    if (!Array.isArray(filters) || filters.some(filter => !isSemanticNavigationFilterId(filter))) {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: runSemanticNavigate solo acepta filtros project, owner, required-owner, hierarchy, strict-hierarchy, return o target.',
        };
    }

    return {
        kind: 'valid',
        filterIds: Array.from(new Set(filters)),
    };
}

function isSemanticNavigationFilterId(value: unknown): value is SemanticNavigationFilterId {
    return value === 'project'
        || value === 'owner'
    || value === 'required-owner'
        || value === 'hierarchy'
    || value === 'strict-hierarchy'
    || value === 'return'
        || value === 'target';
}

function serializeSemanticNavigationFilter(
    item: SemanticNavigationFilterQuickPickItem,
    selectedFilters: readonly SemanticNavigationFilterQuickPickItem[],
): {
    filterId: SemanticNavigationFilterId;
    label: string;
    description?: string;
    detail?: string;
    selected: boolean;
} {
    return {
        filterId: item.filterId,
        label: item.label,
        description: item.description,
        detail: item.detail,
        selected: selectedFilters.some(filter => filter.filterId === item.filterId),
    };
}

function serializeSemanticNavigationSymbolItem(item: SemanticNavigationSymbolQuickPickItem): {
    label: string;
    description?: string;
    detail?: string;
    symbol: {
        name: string;
        kind: PbSymbol['kind'];
        uri: string;
        relativePath: string;
        ownerName?: string;
        containerName?: string;
        returnType?: string;
        projectName?: string;
    };
} {
    const projectName = PowerBuilderProjectRegistry.getInstance().getPreferredProjectForSourceFile(item.symbol.uri)?.name;

    return {
        label: item.label,
        description: item.description,
        detail: item.detail,
        symbol: {
            name: item.symbol.name,
            kind: item.symbol.kind,
            uri: item.symbol.uri.toString(),
            relativePath: vscode.workspace.asRelativePath(item.symbol.uri, false),
            ownerName: item.symbol.ownerName,
            containerName: item.symbol.containerName,
            returnType: item.symbol.returnType,
            projectName,
        },
    };
}

async function resolveSemanticQueryCommandTarget(args?: unknown): Promise<ResolveSemanticQueryCommandTargetResult> {
    if (args === undefined) {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            return {
                kind: 'unsupported',
                reason: PB_USER_MESSAGES.commands.showObjectInfoNoActiveEditor,
            };
        }

        return {
            kind: 'resolved',
            document: editor.document,
            position: editor.selection.active,
        };
    }

    if (!args || typeof args !== 'object') {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: runSemanticQuery espera un objeto con uri, line y character.',
        };
    }

    const targetArgs = args as SemanticQueryCommandArgs;

    if (targetArgs.line === undefined || targetArgs.character === undefined) {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: runSemanticQuery requiere line y character numericos.',
        };
    }

    if (!Number.isInteger(targetArgs.line) || !Number.isInteger(targetArgs.character) || targetArgs.line < 0 || targetArgs.character < 0) {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: runSemanticQuery requiere line y character enteros positivos.',
        };
    }

    const uri = parseSemanticQueryCommandUri(targetArgs.uri);

    if (!uri) {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: runSemanticQuery requiere una uri valida.',
        };
    }

    const document = await vscode.workspace.openTextDocument(uri);
    const requestedOffset = document.offsetAt(new vscode.Position(targetArgs.line, targetArgs.character));
    const safePosition = document.positionAt(requestedOffset);

    return {
        kind: 'resolved',
        document,
        position: safePosition,
    };
}

function parseSemanticQueryCommandUri(value: vscode.Uri | string | undefined): vscode.Uri | undefined {
    if (value instanceof vscode.Uri) {
        return value;
    }

    if (typeof value !== 'string' || value.trim().length === 0) {
        return undefined;
    }

    try {
        return vscode.Uri.parse(value, true);
    } catch {
        return undefined;
    }
}

function parseSemanticSnapshotDiffCommandArgs(
    args?: unknown,
): { kind: 'valid'; leftUri: vscode.Uri; rightUri: vscode.Uri } | { kind: 'invalid-arguments'; reason: string } {
    if (!args || typeof args !== 'object') {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: exportSemanticSnapshotDiff requiere leftUri y rightUri.',
        };
    }

    const diffArgs = args as SemanticSnapshotDiffCommandArgs;
    const leftUri = parseSemanticQueryCommandUri(diffArgs.leftUri);
    const rightUri = parseSemanticQueryCommandUri(diffArgs.rightUri);

    if (!leftUri || !rightUri) {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: exportSemanticSnapshotDiff requiere leftUri y rightUri válidas.',
        };
    }

    return {
        kind: 'valid',
        leftUri,
        rightUri,
    };
}

function parseWorkspaceManifestDiffCommandArgs(
    args?: unknown,
): { kind: 'valid'; leftUri: vscode.Uri; rightUri: vscode.Uri } | { kind: 'invalid-arguments'; reason: string } {
    if (!args || typeof args !== 'object') {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: exportWorkspaceManifestDiff requiere leftUri y rightUri.',
        };
    }

    const diffArgs = args as WorkspaceManifestDiffCommandArgs;
    const leftUri = parseSemanticQueryCommandUri(diffArgs.leftUri);
    const rightUri = parseSemanticQueryCommandUri(diffArgs.rightUri);

    if (!leftUri || !rightUri) {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: exportWorkspaceManifestDiff requiere leftUri y rightUri válidas.',
        };
    }

    return {
        kind: 'valid',
        leftUri,
        rightUri,
    };
}

function parseArtifactDiffCommandArgs(
    args: unknown,
    commandName: string,
): { kind: 'valid'; leftUri: vscode.Uri; rightUri: vscode.Uri } | { kind: 'invalid-arguments'; reason: string } {
    if (!args || typeof args !== 'object') {
        return {
            kind: 'invalid-arguments',
            reason: `PowerBuilder: ${commandName} requiere leftUri y rightUri.`,
        };
    }

    const diffArgs = args as WorkspaceManifestDiffCommandArgs;
    const leftUri = parseSemanticQueryCommandUri(diffArgs.leftUri);
    const rightUri = parseSemanticQueryCommandUri(diffArgs.rightUri);

    if (!leftUri || !rightUri) {
        return {
            kind: 'invalid-arguments',
            reason: `PowerBuilder: ${commandName} requiere leftUri y rightUri válidas.`,
        };
    }

    return {
        kind: 'valid',
        leftUri,
        rightUri,
    };
}

function parseWorkspaceBuildPreferenceCommandArgs(
    args?: unknown,
): { kind: 'valid'; anchorUri?: vscode.Uri } | { kind: 'invalid-arguments'; reason: string } {
    if (args === undefined) {
        return {
            kind: 'valid',
            anchorUri: vscode.window.activeTextEditor?.document.uri,
        };
    }

    if (!args || typeof args !== 'object') {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: runWorkspaceBuildPreference solo acepta un objeto opcional con uri.',
        };
    }

    const preferenceArgs = args as WorkspaceBuildPreferenceCommandArgs;

    if (preferenceArgs.uri === undefined) {
        return {
            kind: 'valid',
            anchorUri: vscode.window.activeTextEditor?.document.uri,
        };
    }

    const anchorUri = parseSemanticQueryCommandUri(preferenceArgs.uri);

    if (!anchorUri) {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: runWorkspaceBuildPreference requiere una uri válida cuando se especifica.',
        };
    }

    return {
        kind: 'valid',
        anchorUri,
    };
}

function parseAutomationReplayCommandArgs(
    args?: unknown,
): { kind: 'valid'; steps: Array<{ kind: 'command' | 'language-model-tool'; id: string; label?: string; args?: unknown }>; stopOnError: boolean; name?: string } | { kind: 'invalid-arguments'; reason: string } {
    if (!args || typeof args !== 'object') {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: exportAutomationReplay requiere un objeto con steps y opciones opcionales.',
        };
    }

    const { steps, stopOnError, name } = args as AutomationReplayCommandArgs;

    if (!Array.isArray(steps) || steps.length === 0) {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: exportAutomationReplay requiere steps como un array no vacío.',
        };
    }

    if (stopOnError !== undefined && typeof stopOnError !== 'boolean') {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: exportAutomationReplay solo acepta stopOnError boolean cuando se especifica.',
        };
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
        return {
            kind: 'invalid-arguments',
            reason: 'PowerBuilder: exportAutomationReplay solo acepta name como string no vacío.',
        };
    }

    const normalizedSteps: Array<{ kind: 'command' | 'language-model-tool'; id: string; label?: string; args?: unknown }> = [];

    for (const [index, step] of steps.entries()) {
        if (!step || typeof step !== 'object') {
            return {
                kind: 'invalid-arguments',
                reason: `PowerBuilder: exportAutomationReplay requiere que el step ${index + 1} sea un objeto.`,
            };
        }

        const { kind, id, label, args: stepArgs } = step as AutomationReplayCommandStepArgs;
        const normalizedKind = kind === undefined || kind === 'command'
            ? 'command'
            : kind === 'language-model-tool' || kind === 'languageModelTool'
                ? 'language-model-tool'
                : undefined;

        if (!normalizedKind) {
            return {
                kind: 'invalid-arguments',
                reason: `PowerBuilder: exportAutomationReplay requiere kind válido en el step ${index + 1}.`,
            };
        }

        if (typeof id !== 'string' || id.trim().length === 0) {
            return {
                kind: 'invalid-arguments',
                reason: `PowerBuilder: exportAutomationReplay requiere id no vacío en el step ${index + 1}.`,
            };
        }

        if (label !== undefined && typeof label !== 'string') {
            return {
                kind: 'invalid-arguments',
                reason: `PowerBuilder: exportAutomationReplay solo acepta label string cuando se especifica en el step ${index + 1}.`,
            };
        }

        normalizedSteps.push({
            kind: normalizedKind,
            id: id.trim(),
            label: label?.trim() || undefined,
            args: stepArgs,
        });
    }

    return {
        kind: 'valid',
        steps: normalizedSteps,
        stopOnError: stopOnError ?? false,
        name: name?.trim(),
    };
}

async function revealSymbolInEditor(symbol: PbSymbol): Promise<void> {
    const document = await vscode.workspace.openTextDocument(symbol.uri);
    const editor = await vscode.window.showTextDocument(document);

    editor.selection = new vscode.Selection(
        symbol.selectionRange.start,
        symbol.selectionRange.end,
    );

    editor.revealRange(
        symbol.range,
        vscode.TextEditorRevealType.InCenter,
    );
}

function buildSemanticNavigationFilterItems(
    inspection: ActiveHierarchyInspectionResult,
    preferredProject: PbProjectDefinition | undefined,
    projectRegistry: PowerBuilderProjectRegistry,
): SemanticNavigationFilterQuickPickItem[] {
    const items: SemanticNavigationFilterQuickPickItem[] = [];
    const ownerName = inspection.relevantOwnerName ?? inspection.currentObjectName;
    const requiredOwnerName = inspection.relevantOwnerName;
    const targetName = inspection.primarySymbol?.name ?? inspection.requestedWord;
    const targetKind = inspection.primarySymbol?.kind;
    const hierarchyNames = collectSemanticNavigationHierarchyFamily(inspection);
    const strictHierarchyNames = collectStrictSemanticNavigationHierarchyFamily(inspection);
    const returnType = inspection.primarySymbol?.returnType;

    if (preferredProject) {
        items.push({
            label: `Proyecto: ${preferredProject.name}`,
            description: 'Restringe la búsqueda al proyecto preferido actual',
            detail: vscode.workspace.asRelativePath(preferredProject.uri, false),
            filterId: 'project',
            matchesSymbol: symbol => projectRegistry.isSourceFileInProject(symbol.uri, preferredProject),
        });
    }

    if (ownerName) {
        items.push({
            label: `Owner: ${ownerName}`,
            description: 'Solo símbolos del owner o contenedor semántico actual',
            filterId: 'owner',
            matchesSymbol: symbol => matchesSemanticNavigationOwner(symbol, ownerName),
        });
    }

    if (requiredOwnerName) {
        items.push({
            label: `Owner requerido: ${requiredOwnerName}`,
            description: 'Solo símbolos cuyo owner relevante coincide exactamente con el foco actual',
            filterId: 'required-owner',
            matchesSymbol: symbol => matchesSemanticNavigationRequiredOwner(symbol, requiredOwnerName),
        });
    }

    if (hierarchyNames.length > 0) {
        items.push({
            label: `Jerarquía: ${hierarchyNames[0]}`,
            description: 'Solo símbolos de la familia heredada actual',
            detail: hierarchyNames.join(' > '),
            filterId: 'hierarchy',
            matchesSymbol: symbol => matchesSemanticNavigationHierarchy(symbol, hierarchyNames),
        });
    }

    if (strictHierarchyNames.length > 0) {
        items.push({
            label: `Jerarquía estricta: ${strictHierarchyNames[0]}`,
            description: 'Solo símbolos cuyo owner relevante cae dentro de la cadena heredada activa',
            detail: strictHierarchyNames.join(' > '),
            filterId: 'strict-hierarchy',
            matchesSymbol: symbol => matchesSemanticNavigationStrictHierarchy(symbol, strictHierarchyNames),
        });
    }

    if (returnType) {
        items.push({
            label: `Retorno: ${returnType}`,
            description: 'Solo callables con el mismo retorno esperado que el símbolo primario actual',
            filterId: 'return',
            matchesSymbol: symbol => matchesSemanticNavigationReturn(symbol, returnType),
        });
    }

    if (targetName) {
        items.push({
            label: `Target: ${targetName}`,
            description: targetKind
                ? `Solo símbolos del mismo target actual (${getSymbolKindLabelEs(targetKind)})`
                : 'Solo símbolos del mismo nombre actual',
            filterId: 'target',
            matchesSymbol: symbol => matchesSemanticNavigationTarget(symbol, targetName, targetKind),
        });
    }

    return items;
}

function applySemanticNavigationFilters(
    symbols: readonly PbSymbol[],
    selectedFilters: readonly SemanticNavigationFilterQuickPickItem[],
): PbSymbol[] {
    if (selectedFilters.length === 0) {
        return [...symbols];
    }

    return symbols.filter(symbol => selectedFilters.every(filter => filter.matchesSymbol(symbol)));
}

function buildSemanticNavigationSymbolItems(
    symbols: readonly PbSymbol[],
    inspection: ActiveHierarchyInspectionResult,
    projectRegistry: PowerBuilderProjectRegistry = PowerBuilderProjectRegistry.getInstance(),
): SemanticNavigationSymbolQuickPickItem[] {
    return symbols.map(symbol => {
        const projectName = projectRegistry.getPreferredProjectForSourceFile(symbol.uri)?.name;
        const ownerName = symbol.ownerName ?? symbol.containerName ?? symbol.fileObjectName;
        const detailParts = [vscode.workspace.asRelativePath(symbol.uri, false)];

        if (symbol.signature) {
            detailParts.push(symbol.signature);
        } else if (symbol.fileObjectName) {
            detailParts.push(`objeto ${symbol.fileObjectName}`);
        }

        if (symbol.returnType) {
            detailParts.push(`retorna ${symbol.returnType}`);
        }

        return {
            label: `$(symbol-${mapKindToIcon(symbol.kind)}) ${symbol.name}`,
            description: [
                getSymbolKindLabelEs(symbol.kind),
                projectName,
                ownerName && ownerName !== symbol.name ? ownerName : undefined,
                matchesSemanticNavigationTarget(
                    symbol,
                    inspection.primarySymbol?.name ?? inspection.requestedWord,
                    inspection.primarySymbol?.kind,
                )
                    ? 'target'
                    : undefined,
            ].filter((value): value is string => !!value).join(' · '),
            detail: detailParts.join(' · '),
            symbol,
        };
    });
}

function buildSemanticNavigationSymbolPlaceholder(
    symbolCount: number,
    filterCount: number,
): string {
    return filterCount > 0
        ? `Selecciona un símbolo entre ${symbolCount} resultados tras ${filterCount} filtro(s) semánticos...`
        : `Selecciona un símbolo entre ${symbolCount} resultados indexados...`;
}

function compareSemanticNavigationSymbols(
    left: PbSymbol,
    right: PbSymbol,
    inspection: ActiveHierarchyInspectionResult,
): number {
    const scoreDifference = getSemanticNavigationScore(right, inspection) - getSemanticNavigationScore(left, inspection);

    if (scoreDifference !== 0) {
        return scoreDifference;
    }

    const nameDifference = left.name.localeCompare(right.name);

    if (nameDifference !== 0) {
        return nameDifference;
    }

    return vscode.workspace.asRelativePath(left.uri, false)
        .localeCompare(vscode.workspace.asRelativePath(right.uri, false));
}

function getSemanticNavigationScore(
    symbol: PbSymbol,
    inspection: ActiveHierarchyInspectionResult,
    projectRegistry: PowerBuilderProjectRegistry = PowerBuilderProjectRegistry.getInstance(),
): number {
    let score = 0;
    const preferredProjectName = normalizeSemanticNavigationName(inspection.preferredProject?.name);
    const currentObjectName = normalizeSemanticNavigationName(inspection.currentObjectName);
    const relevantOwnerName = normalizeSemanticNavigationName(inspection.relevantOwnerName);
    const targetName = normalizeSemanticNavigationName(inspection.primarySymbol?.name ?? inspection.requestedWord);
    const symbolProjectName = normalizeSemanticNavigationName(
        projectRegistry.getPreferredProjectForSourceFile(symbol.uri)?.name,
    );

    if (preferredProjectName && preferredProjectName === symbolProjectName) {
        score += 40;
    }

    if (currentObjectName && normalizeSemanticNavigationName(symbol.fileObjectName) === currentObjectName) {
        score += 25;
    }

    if (relevantOwnerName && matchesSemanticNavigationOwner(symbol, relevantOwnerName)) {
        score += 20;
    }

    if (targetName && normalizeSemanticNavigationName(symbol.name) === targetName) {
        score += 15;
    }

    if (inspection.primarySymbol?.kind && symbol.kind === inspection.primarySymbol.kind) {
        score += 5;
    }

    return score;
}

function collectSemanticNavigationHierarchyFamily(
    inspection: ActiveHierarchyInspectionResult,
): string[] {
    const hierarchyNames = new Map<string, string>();
    const seedNames = inspection.relevantOwnerHierarchy.length > 0
        ? inspection.relevantOwnerHierarchy
        : inspection.currentObjectHierarchy;

    for (const name of seedNames) {
        const normalizedName = normalizeSemanticNavigationName(name);

        if (normalizedName && !hierarchyNames.has(normalizedName)) {
            hierarchyNames.set(normalizedName, name);
        }
    }

    return Array.from(hierarchyNames.values());
}

function collectStrictSemanticNavigationHierarchyFamily(
    inspection: ActiveHierarchyInspectionResult,
): string[] {
    const hierarchyNames = new Map<string, string>();
    const seedNames = inspection.relevantOwnerHierarchy.length > 0
        ? inspection.relevantOwnerHierarchy
        : inspection.currentObjectHierarchy;

    for (const name of seedNames) {
        const normalizedName = normalizeSemanticNavigationName(name);

        if (normalizedName && !hierarchyNames.has(normalizedName)) {
            hierarchyNames.set(normalizedName, name);
        }
    }

    return Array.from(hierarchyNames.values());
}

function resolveSemanticNavigationRelevantOwner(
    symbol: PbSymbol,
): string | undefined {
    if (symbol.kind === 'type' || symbol.kind === 'structure') {
        return symbol.name;
    }

    return symbol.fileObjectName
        ?? symbol.ownerName
        ?? symbol.parent
        ?? symbol.containerName;
}

function matchesSemanticNavigationOwner(
    symbol: PbSymbol,
    ownerName: string,
): boolean {
    const normalizedOwnerName = normalizeSemanticNavigationName(ownerName);

    return normalizedOwnerName !== undefined && [
        symbol.ownerName,
        symbol.containerName,
        symbol.fileObjectName,
        symbol.parent,
    ].some(candidate => normalizeSemanticNavigationName(candidate) === normalizedOwnerName);
}

function matchesSemanticNavigationRequiredOwner(
    symbol: PbSymbol,
    ownerName: string,
): boolean {
    const normalizedOwnerName = normalizeSemanticNavigationName(ownerName);
    const normalizedRelevantOwner = normalizeSemanticNavigationName(resolveSemanticNavigationRelevantOwner(symbol));

    return normalizedOwnerName !== undefined && normalizedRelevantOwner === normalizedOwnerName;
}

function matchesSemanticNavigationHierarchy(
    symbol: PbSymbol,
    hierarchyNames: readonly string[],
): boolean {
    const normalizedHierarchyNames = new Set(
        hierarchyNames
            .map(name => normalizeSemanticNavigationName(name))
            .filter((name): name is string => !!name),
    );

    return [
        symbol.kind === 'type' || symbol.kind === 'structure' ? symbol.name : undefined,
        symbol.fileObjectName,
        symbol.ownerName,
        symbol.containerName,
        symbol.baseTypeName,
        symbol.parent,
    ].some(candidate => {
        const normalizedCandidate = normalizeSemanticNavigationName(candidate);
        return normalizedCandidate ? normalizedHierarchyNames.has(normalizedCandidate) : false;
    });
}

function matchesSemanticNavigationStrictHierarchy(
    symbol: PbSymbol,
    hierarchyNames: readonly string[],
): boolean {
    const normalizedHierarchyNames = new Set(
        hierarchyNames
            .map(name => normalizeSemanticNavigationName(name))
            .filter((name): name is string => !!name),
    );
    const normalizedRelevantOwner = normalizeSemanticNavigationName(resolveSemanticNavigationRelevantOwner(symbol));

    return normalizedRelevantOwner ? normalizedHierarchyNames.has(normalizedRelevantOwner) : false;
}

function matchesSemanticNavigationReturn(
    symbol: PbSymbol,
    returnType: string,
): boolean {
    const normalizedReturnType = normalizeSemanticNavigationName(returnType);
    const normalizedSymbolReturnType = normalizeSemanticNavigationName(symbol.returnType);

    return normalizedReturnType !== undefined && normalizedSymbolReturnType === normalizedReturnType;
}

function matchesSemanticNavigationTarget(
    symbol: PbSymbol,
    targetName: string | undefined,
    targetKind?: PbSymbol['kind'],
): boolean {
    const normalizedTargetName = normalizeSemanticNavigationName(targetName);

    if (!normalizedTargetName) {
        return false;
    }

    return normalizeSemanticNavigationName(symbol.name) === normalizedTargetName
        && (!targetKind || symbol.kind === targetKind);
}

function normalizeSemanticNavigationName(name?: string): string | undefined {
    const normalizedName = name?.trim().toLowerCase();

    return normalizedName ? normalizedName : undefined;
}

async function runBuildCommand(
    title: string,
    action: () => Promise<PbAutoBuildProjectBuildResult>,
    logMessage: string,
    errorPrefix: string,
): Promise<void> {
    try {
        const result = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title,
            },
            action,
        );

        publishBuildResult(result);
    } catch (error) {
        Logger.error(logMessage, error);
        Logger.outputChannel.show(true);
        void vscode.window.showErrorMessage(
            `${errorPrefix} ${String(error instanceof Error ? error.message : error)}`,
        );
    }
}

function publishBuildResult(result: PbAutoBuildProjectBuildResult): void {
    const summary = result.summary;

    if (result.exitCode === 0 && summary.issueCount === 0) {
        void vscode.window.showInformationMessage(
            `PowerBuilder: compilación PBAutoBuild de ${result.project.name} completada sin errores ni warnings.`,
        );
        return;
    }

    Logger.outputChannel.show(true);
    void vscode.window.showWarningMessage(
        `PowerBuilder: compilación de ${result.project.name} finalizada con ${formatBuildIssueSummary(summary)} y código ${result.exitCode}. Revisa el canal PowerBuilder y el panel Problems.`,
    );
}

function formatBuildIssueSummary(summary: ReturnType<typeof summarizePbAutoBuildIssues>): string {
    const parts: string[] = [];

    if (summary.errorCount > 0) {
        parts.push(`${summary.errorCount} error(es)`);
    }

    if (summary.warningCount > 0) {
        parts.push(`${summary.warningCount} warning(s)`);
    }

    return parts.join(', ');
}