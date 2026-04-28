import * as vscode from 'vscode';
import { PB_LANGUAGE_ID } from '../core/config/constants';
import { Logger } from '../core/logging/logger';
import { WorkspaceIndexer } from '../powerbuilder/indexing/workspaceIndexer';
import { SymbolIndex } from '../powerbuilder/indexing/symbolIndex';
import {
    PB_USER_MESSAGES,
    formatInitialWorkspaceIndexingDurationEs,
    formatInitialWorkspaceIndexingFailedEs,
    formatUnableEvaluateWorkspaceHasPowerBuilderFilesEs,
} from '../core/i18n/pbUserMessages';
import {
    getConfig,
    getIndexingExcludeGlob,
    isExcludedUri,
} from '../core/config/extensionConfiguration';
import {
    getAllPowerBuilderFileGlob,
    isIdeSafePowerBuilderDocument,
    isIdeSafePowerBuilderUri,
} from '../core/utils/powerBuilderFileUtils';
import { PowerBuilderWorkspaceSnapshotStore } from '../core/utils/powerBuilderWorkspaceSnapshotStore';

const PB_FILE_GLOB = getAllPowerBuilderFileGlob();
const PB_PROJECT_GLOB = '**/*.pbproj';
const DOCUMENT_REINDEX_DEBOUNCE_MS = 200;
const INITIAL_WORKSPACE_INDEX_DELAY_MS = 1500;

export function registerCoreServices(context: vscode.ExtensionContext): vscode.Disposable[] {
    const disposables: vscode.Disposable[] = [];
    const isTestExtensionHost = context.extensionMode === vscode.ExtensionMode.Test;

    const symbolIndex = SymbolIndex.getInstance();
    const indexer = new WorkspaceIndexer(symbolIndex);
    const snapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance();

    const pendingReindexTimers = new Map<string, ReturnType<typeof setTimeout>>();
    let initialWorkspaceIndexTimer: ReturnType<typeof setTimeout> | undefined;

    const clearPendingTimer = (uri: vscode.Uri): void => {
        const key = uri.toString();
        const timer = pendingReindexTimers.get(key);

        if (timer) {
            clearTimeout(timer);
            pendingReindexTimers.delete(key);
        }
    };

    const clearAllPendingTimers = (): void => {
        for (const timer of pendingReindexTimers.values()) {
            clearTimeout(timer);
        }

        pendingReindexTimers.clear();
    };

    const clearInitialWorkspaceIndexTimer = (): void => {
        if (!initialWorkspaceIndexTimer) {
            return;
        }

        clearTimeout(initialWorkspaceIndexTimer);
        initialWorkspaceIndexTimer = undefined;
    };

    const shouldSkipUri = (uri: vscode.Uri): boolean => isExcludedUri(uri);

    const shouldSkipPowerBuilderUri = (uri: vscode.Uri): boolean => {
        if (shouldSkipUri(uri)) {
            return true;
        }

        return !isIdeSafePowerBuilderUri(
            uri,
            getConfig().dataWindowExperimentalIdeEnabled,
        );
    };

    const shouldSkipPowerBuilderDocument = (
        document: vscode.TextDocument,
    ): boolean => {
        if (shouldSkipUri(document.uri)) {
            return true;
        }

        return !isIdeSafePowerBuilderDocument(
            document,
            getConfig().dataWindowExperimentalIdeEnabled,
        );
    };

    const scheduleDocumentIndex = (document: vscode.TextDocument): void => {
        if (document.languageId !== PB_LANGUAGE_ID) {
            return;
        }

        if (shouldSkipPowerBuilderDocument(document)) {
            return;
        }

        const key = document.uri.toString();
        const existingTimer = pendingReindexTimers.get(key);

        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
            pendingReindexTimers.delete(key);
            indexer.indexDocument(document);
        }, DOCUMENT_REINDEX_DEBOUNCE_MS);

        pendingReindexTimers.set(key, timer);
    };

    const updateWorkspaceHasPowerBuilderFiles = async (): Promise<void> => {
        try {
            await vscode.commands.executeCommand(
                'setContext',
                'workspaceHasPowerBuilderFiles',
                await indexer.hasPowerBuilderFiles(),
            );
        } catch (error) {
            Logger.warn(formatUnableEvaluateWorkspaceHasPowerBuilderFilesEs(error));

            await vscode.commands.executeCommand(
                'setContext',
                'workspaceHasPowerBuilderFiles',
                false,
            );
        }
    };

    const indexOpenPowerBuilderDocuments = (): void => {
        for (const document of vscode.workspace.textDocuments) {
            if (
                document.languageId === PB_LANGUAGE_ID &&
                !shouldSkipPowerBuilderDocument(document)
            ) {
                indexer.indexDocument(document);
            }
        }
    };

    const performInitialWorkspaceIndex = async (): Promise<void> => {
        const startedAt = Date.now();

        symbolIndex.markInitialWorkspaceIndexingStarted();
        Logger.info(PB_USER_MESSAGES.logs.initialWorkspaceIndexingStarted);

        try {
            await updateWorkspaceHasPowerBuilderFiles();
            await indexer.reindex();
            indexOpenPowerBuilderDocuments();
        } catch (error) {
            Logger.error(formatInitialWorkspaceIndexingFailedEs(error));
        } finally {
            symbolIndex.markInitialWorkspaceIndexingCompleted();
            Logger.info(
                formatInitialWorkspaceIndexingDurationEs(Date.now() - startedAt),
            );
            Logger.info(PB_USER_MESSAGES.logs.initialWorkspaceIndexingCompleted);
        }
    };

    const scheduleInitialWorkspaceIndex = (): void => {
        clearInitialWorkspaceIndexTimer();
        Logger.info(PB_USER_MESSAGES.logs.initialWorkspaceIndexingDeferred);
        initialWorkspaceIndexTimer = setTimeout(() => {
            initialWorkspaceIndexTimer = undefined;
            void performInitialWorkspaceIndex();
        }, INITIAL_WORKSPACE_INDEX_DELAY_MS);
    };

    void updateWorkspaceHasPowerBuilderFiles();
    indexOpenPowerBuilderDocuments();

    // In test mode, schedule the initial workspace index instead of running
    // it immediately to avoid blocking extension host startup with heavy
    // synchronous parsing over large fixtures.
    scheduleInitialWorkspaceIndex();

    const watcher = vscode.workspace.createFileSystemWatcher(PB_FILE_GLOB);
    const projectWatcher = vscode.workspace.createFileSystemWatcher(PB_PROJECT_GLOB);

    disposables.push(watcher, projectWatcher);

    disposables.push(
        watcher.onDidChange(uri => {
            if (shouldSkipPowerBuilderUri(uri)) {
                return;
            }

            snapshotStore.invalidate(uri);
            clearPendingTimer(uri);
            void indexer.indexFile(uri);
        }),
    );

    disposables.push(
        watcher.onDidCreate(uri => {
            if (shouldSkipPowerBuilderUri(uri)) {
                return;
            }

            snapshotStore.invalidate(uri);
            clearPendingTimer(uri);
            void indexer.indexFile(uri);
            void updateWorkspaceHasPowerBuilderFiles();
        }),
    );

    disposables.push(
        watcher.onDidDelete(uri => {
            if (shouldSkipPowerBuilderUri(uri)) {
                return;
            }

            snapshotStore.invalidate(uri);
            clearPendingTimer(uri);
            symbolIndex.removeFile(uri);
            void updateWorkspaceHasPowerBuilderFiles();
        }),
    );

    disposables.push(
        projectWatcher.onDidChange(uri => {
            if (shouldSkipUri(uri)) {
                return;
            }

            void indexer.indexProjectFile(uri);
        }),
    );

    disposables.push(
        projectWatcher.onDidCreate(uri => {
            if (shouldSkipUri(uri)) {
                return;
            }

            void indexer.indexProjectFile(uri);
            void updateWorkspaceHasPowerBuilderFiles();
        }),
    );

    disposables.push(
        projectWatcher.onDidDelete(uri => {
            if (shouldSkipUri(uri)) {
                return;
            }

            indexer.removeProjectFile(uri);
            void updateWorkspaceHasPowerBuilderFiles();
        }),
    );

    disposables.push(
        vscode.workspace.onDidOpenTextDocument(document => {
            snapshotStore.invalidate(document.uri);

            if (looksLikePbProjectDocument(document)) {
                if (!shouldSkipUri(document.uri)) {
                    void indexer.indexProjectFile(document.uri);
                }
            }

            if (shouldSkipPowerBuilderDocument(document)) {
                return;
            }

            scheduleDocumentIndex(document);
        }),
    );

    disposables.push(
        vscode.workspace.onDidSaveTextDocument(document => {
            snapshotStore.invalidate(document.uri);
            clearPendingTimer(document.uri);

            if (!shouldSkipPowerBuilderDocument(document)) {
                indexer.indexDocument(document);
            }

            if (looksLikePbProjectDocument(document)) {
                if (!shouldSkipUri(document.uri)) {
                    void indexer.indexProjectFile(document.uri);
                }
            }
        }),
    );

    disposables.push(
        vscode.workspace.onDidCloseTextDocument(document => {
            snapshotStore.invalidate(document.uri);
            clearPendingTimer(document.uri);
        }),
    );

    disposables.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            snapshotStore.invalidate(event.document.uri);

            if (shouldSkipPowerBuilderDocument(event.document)) {
                return;
            }

            scheduleDocumentIndex(event.document);
        }),
    );

    disposables.push(new vscode.Disposable(() => {
        clearAllPendingTimers();
        clearInitialWorkspaceIndexTimer();
    }));

    disposables.push(
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            snapshotStore.clear();
            clearAllPendingTimers();
            clearInitialWorkspaceIndexTimer();
            void performInitialWorkspaceIndex();
        }),
    );

    disposables.push(
        vscode.workspace.onDidChangeConfiguration(event => {
            if (
                event.affectsConfiguration('powerbuilder.indexing.exclude') ||
                event.affectsConfiguration('powerbuilder.datawindow.experimentalIde.enabled')
            ) {
                snapshotStore.clear();
                clearAllPendingTimers();
                clearInitialWorkspaceIndexTimer();
                void performInitialWorkspaceIndex();
            }
        }),
    );

    disposables.push(
        new vscode.Disposable(() => {
            snapshotStore.clear();
            clearAllPendingTimers();
            clearInitialWorkspaceIndexTimer();
        }),
    );

    return disposables;
}

function looksLikePbProjectDocument(document: vscode.TextDocument): boolean {
    const path = document.uri.fsPath || document.uri.path;
    return /\.pbproj$/i.test(path);
}