import * as vscode from 'vscode';
import { PB_LANGUAGE_ID } from '../../core/config/constants';
import { Logger } from '../../core/logging/logger';
import { SymbolIndex } from '../indexing/symbolIndex';
import {
    formatIndexedWorkspaceEs,
    formatIndexingWorkspaceEs,
    formatUnableIndexFileEs,
} from '../../core/i18n/pbUserMessages';
import {
    getConfig,
    getIndexingExcludeGlob,
    isExcludedUri,
} from '../../core/config/extensionConfiguration';
import {
    findIdeSafePowerBuilderFilesInRoots,
    getIdeSafePowerBuilderFileGlob,
    isIdeSafePowerBuilderDocument,
    isIdeSafePowerBuilderUri,
    isPowerBuilderUri,
} from '../../core/utils/powerBuilderFileUtils';
import { PbProjectDefinition, normalizeWorkspaceUriPath } from './pbProjectModel';
import { PbProjectParser } from './pbProjectParser';
import { PowerBuilderProjectRegistry } from './projectRegistry';
import { PowerBuilderWorkspaceSnapshotStore } from './powerBuilderWorkspaceSnapshotStore';

const PB_PROJECT_GLOB = '**/*.pbproj';
const PROJECT_TEXT_DECODER = new TextDecoder('utf-8');
// Yield to the event loop more frequently to keep the extension host responsive
// during large reindexing passes (especially in test fixtures).
const INDEX_YIELD_EVERY_FILES = 5;

interface IndexProjectFileOptions {
    indexSourceFiles?: boolean;
}

export class WorkspaceIndexer {
    private static reindexTask: Promise<void> | undefined;
    private static reindexPending = false;

    private readonly projectParser = new PbProjectParser();
    private readonly projectRegistry = PowerBuilderProjectRegistry.getInstance();
    private readonly snapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance();

    constructor(private readonly symbolIndex: SymbolIndex) {}

    async hasPowerBuilderFiles(): Promise<boolean> {
        const files = await vscode.workspace.findFiles(
            getIdeSafePowerBuilderFileGlob(
                getConfig().dataWindowExperimentalIdeEnabled,
            ),
            getIndexingExcludeGlob(),
            1,
        );

        if (files.length > 0) {
            return true;
        }

        const projectFiles = await this.getWorkspaceProjectFiles(1);
        return projectFiles.length > 0;
    }

    async getWorkspaceFiles(maxResults?: number): Promise<vscode.Uri[]> {
        return vscode.workspace.findFiles(
            getIdeSafePowerBuilderFileGlob(
                getConfig().dataWindowExperimentalIdeEnabled,
            ),
            getIndexingExcludeGlob(),
            maxResults,
        );
    }

    async getWorkspaceProjectFiles(maxResults?: number): Promise<vscode.Uri[]> {
        return vscode.workspace.findFiles(
            PB_PROJECT_GLOB,
            getIndexingExcludeGlob(),
            maxResults,
        );
    }

    async indexWorkspace(): Promise<void> {
        const projects = await this.indexProjects({ indexSourceFiles: false });

        const workspaceFiles = await this.getWorkspaceFiles();
        const workspaceFileKeys = new Set(
            workspaceFiles.map(uri => uri.toString()),
        );
        const projectScopedFiles = await this.findProjectSourceFiles(
            projects,
            workspaceFileKeys,
        );
        const files = [...workspaceFiles, ...projectScopedFiles];

        Logger.info(formatIndexingWorkspaceEs(files.length));

        await this.indexFiles(files);

        Logger.info(
            formatIndexedWorkspaceEs(
                this.symbolIndex.symbolCount,
                this.symbolIndex.fileCount,
            ),
        );
    }

    async indexProjects(
        options: IndexProjectFileOptions = {},
    ): Promise<PbProjectDefinition[]> {
        const projectFiles = await this.getWorkspaceProjectFiles();
        const projects: PbProjectDefinition[] = [];

        for (const projectUri of projectFiles) {
            const project = await this.indexProjectFile(projectUri, options);

            if (project) {
                projects.push(project);
            }
        }

        return projects;
    }

    async indexProjectFile(
        uri: vscode.Uri,
        options: IndexProjectFileOptions = {},
    ): Promise<PbProjectDefinition | undefined> {
        if (isExcludedUri(uri)) {
            return undefined;
        }

        const previousProject = this.projectRegistry.getProject(uri);

        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            const project = this.projectParser.parseProjectText(
                uri,
                PROJECT_TEXT_DECODER.decode(bytes),
            );

            if (!project) {
                return undefined;
            }

            this.projectRegistry.setProject(project);
            this.invalidateRemovedProjectRootFiles(
                this.projectRegistry.getRemovedProjectRoots(previousProject, project),
            );

            if (options.indexSourceFiles !== false) {
                await this.indexProjectSourceFiles([project]);
            }

            return project;
        } catch (error) {
            Logger.warn(
                `No se pudo indexar el proyecto [${uri.toString()}]: ${String(error)}`,
            );

            return undefined;
        }
    }

    removeProjectFile(uri: vscode.Uri): void {
        if (isExcludedUri(uri)) {
            return;
        }

        const previousProject = this.projectRegistry.getProject(uri);
        const removedRoots = this.projectRegistry.getRemovedProjectRoots(previousProject);

        this.projectRegistry.removeProject(uri);
        this.invalidateRemovedProjectRootFiles(removedRoots);
    }

    async indexFile(uri: vscode.Uri): Promise<void> {
        if (isExcludedUri(uri)) {
            return;
        }

        if (!isIdeSafePowerBuilderUri(uri, getConfig().dataWindowExperimentalIdeEnabled)) {
            return;
        }

        try {
            const document = await this.snapshotStore.getSnapshot(uri);

            if (!document) {
                return;
            }

            if (
                document.languageId !== PB_LANGUAGE_ID &&
                !isPowerBuilderUri(uri)
            ) {
                return;
            }

            this.symbolIndex.indexDocument(document);
        } catch (error) {
            Logger.warn(
                formatUnableIndexFileEs(uri.toString(), error),
            );
        }
    }

    indexDocument(document: vscode.TextDocument): void {
        if (isExcludedUri(document.uri)) {
            return;
        }

        if (!isIdeSafePowerBuilderDocument(document, getConfig().dataWindowExperimentalIdeEnabled)) {
            return;
        }

        this.symbolIndex.indexDocument(document);
    }

    async reindex(): Promise<void> {
        WorkspaceIndexer.reindexPending = true;

        while (WorkspaceIndexer.reindexTask) {
            await WorkspaceIndexer.reindexTask;
        }

        if (!WorkspaceIndexer.reindexPending) {
            return;
        }

        WorkspaceIndexer.reindexTask = this.performQueuedReindex();

        try {
            await WorkspaceIndexer.reindexTask;
        } finally {
            WorkspaceIndexer.reindexTask = undefined;
        }
    }

    private async performQueuedReindex(): Promise<void> {
        while (WorkspaceIndexer.reindexPending) {
            WorkspaceIndexer.reindexPending = false;
            await this.performReindexPass();
        }
    }

    private async performReindexPass(): Promise<void> {
        this.symbolIndex.beginBatchUpdate();

        try {
            this.snapshotStore.clear();
            this.symbolIndex.clear();
            this.projectRegistry.clear();
            await this.indexWorkspace();
        } finally {
            this.symbolIndex.endBatchUpdate();
        }
    }

    getPreferredProjectForSourceFile(
        uri: vscode.Uri,
    ): PbProjectDefinition | undefined {
        return this.projectRegistry.getPreferredProjectForSourceFile(uri);
    }

    private async indexProjectSourceFiles(
        projects: readonly PbProjectDefinition[],
    ): Promise<void> {
        const files = await this.findProjectSourceFiles(projects);

        if (files.length === 0) {
            return;
        }

        await this.indexFiles(files);
    }

    private async indexFiles(files: readonly vscode.Uri[]): Promise<void> {
        this.symbolIndex.beginBatchUpdate();

        let filesSinceYield = 0;

        try {
            for (const fileUri of files) {
                await this.indexFile(fileUri);
                filesSinceYield++;

                if (filesSinceYield >= INDEX_YIELD_EVERY_FILES) {
                    filesSinceYield = 0;
                    await this.yieldToEventLoop();
                }
            }
        } finally {
            this.symbolIndex.endBatchUpdate();
        }
    }

    private async yieldToEventLoop(): Promise<void> {
        await new Promise<void>(resolve => {
            setTimeout(resolve, 0);
        });
    }

    private async findProjectSourceFiles(
        projects: readonly PbProjectDefinition[],
        skipUris: ReadonlySet<string> = new Set<string>(),
    ): Promise<vscode.Uri[]> {
        const roots = this.collectProjectSourceRoots(projects);

        if (roots.length === 0) {
            return [];
        }

        const files = await findIdeSafePowerBuilderFilesInRoots(
            roots,
            getConfig().dataWindowExperimentalIdeEnabled,
            getIndexingExcludeGlob(),
        );

        return files.filter(uri =>
            !skipUris.has(uri.toString()) &&
            !isExcludedUri(uri),
        );
    }

    private collectProjectSourceRoots(
        projects: readonly PbProjectDefinition[],
    ): vscode.Uri[] {
        const roots: vscode.Uri[] = [];
        const seen = new Set<string>();

        for (const project of projects) {
            for (const rootUri of this.projectRegistry.getEffectiveProjectSourceRoots(project)) {
                const key = rootUri.toString();

                if (!seen.has(key)) {
                    seen.add(key);
                    roots.push(rootUri);
                }
            }
        }

        return roots;
    }

    private invalidateRemovedProjectRootFiles(
        removedRoots: readonly vscode.Uri[],
    ): void {
        if (removedRoots.length === 0) {
            return;
        }

        const retainedRootKeys = this.projectRegistry.getRetainedProjectRootKeys();
        const staleUris = this.symbolIndex.getIndexedUris().filter(uri =>
            this.projectRegistry.isUriWithinAnyRoot(uri, removedRoots) &&
            !this.shouldRetainIndexedFile(uri, retainedRootKeys),
        );

        if (staleUris.length === 0) {
            return;
        }

        this.symbolIndex.beginBatchUpdate();

        try {
            for (const staleUri of staleUris) {
                this.symbolIndex.removeFile(staleUri);
            }
        } finally {
            this.symbolIndex.endBatchUpdate();
        }
    }

    private shouldRetainIndexedFile(
        uri: vscode.Uri,
        retainedRootKeys: ReadonlySet<string>,
    ): boolean {
        if (isExcludedUri(uri)) {
            return false;
        }

        if (
            vscode.workspace.getWorkspaceFolder(uri) &&
            isIdeSafePowerBuilderUri(uri, getConfig().dataWindowExperimentalIdeEnabled)
        ) {
            return true;
        }

        const normalizedUriPath = normalizeWorkspaceUriPath(uri);

        for (const rootKey of retainedRootKeys) {
            if (normalizedUriPath === rootKey || normalizedUriPath.startsWith(`${rootKey}/`)) {
                return true;
            }
        }

        return false;
    }
}