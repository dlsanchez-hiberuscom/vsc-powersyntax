import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { registerExplorer } from '../../features/direct-api-ide/explorer/registerExplorer';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';

const EXTENSION_ID = 'lopez.almunia-powersyntax';
const PFC_SOLUTION_FILE = 'PFC.pbsln';
const TARGET_PROJECT_LABEL = 'pfc examples';
const TARGET_FILE_RELATIVE_PATH = path.join('examples', 'exmmain.pbl', 'w_master.srw');
const TARGET_ROOT_SYMBOL = 'w_master';
const TARGET_CALLABLE_SYMBOL = 'of_getexampletitle';
const EXPLORER_TIMEOUT_MS = 90_000;
const PROVIDER_TIMEOUT_MS = 60_000;
const READY_TIMEOUT_MS = 180_000;
const POLL_INTERVAL_MS = 250;

suite('PFC real workspace integration', () => {
    test('explorer, hover y references permanecen utilizables sobre PFC real', async function () {
        this.timeout(READY_TIMEOUT_MS + 30_000);

        if (!isRealPfcWorkspace()) {
            this.skip();
            return;
        }

        const index = SymbolIndex.getInstance();
        const activationStartedAt = Date.now();
        let capturedProvider: vscode.TreeDataProvider<vscode.TreeItem> | undefined;

        const restoreCreateTreeView = replaceProperty(
            vscode.window,
            'createTreeView',
            <T>(_viewId: string, options: vscode.TreeViewOptions<T>) => {
                capturedProvider = options.treeDataProvider as unknown as vscode.TreeDataProvider<vscode.TreeItem>;

                return {
                    dispose() {
                        // no-op
                    },
                    message: undefined,
                } as unknown as vscode.TreeView<T>;
            },
        );

        const explorerDisposables: vscode.Disposable[] = [];

        try {
            await activateExtension();
            const activationMs = Date.now() - activationStartedAt;

            explorerDisposables.push(...registerExplorer({} as vscode.ExtensionContext));
            assert.ok(capturedProvider, 'Expected captured PowerBuilder explorer provider');

            const explorerTarget = await waitForCondition(
                'PowerBuilder explorer target in real PFC workspace',
                EXPLORER_TIMEOUT_MS,
                async () => {
                    const fileItem = await findFileItem(
                        capturedProvider!,
                        TARGET_PROJECT_LABEL,
                        TARGET_FILE_RELATIVE_PATH,
                    );

                    if (!fileItem) {
                        return undefined;
                    }

                    const callableItem = await findCallableItem(
                        capturedProvider!,
                        fileItem,
                        TARGET_ROOT_SYMBOL,
                        TARGET_CALLABLE_SYMBOL,
                    );

                    if (!callableItem?.command) {
                        return undefined;
                    }

                    return {
                        fileItem,
                        callableItem,
                        readyMs: Date.now() - activationStartedAt,
                    };
                },
            );

            const openStartedAt = Date.now();
            await withTimeout(
                'explorer open object on real PFC workspace',
                PROVIDER_TIMEOUT_MS,
                vscode.commands.executeCommand(
                    explorerTarget.callableItem.command!.command,
                    ...(explorerTarget.callableItem.command!.arguments ?? []),
                ),
            );

            const targetUri = getWorkspaceUri(TARGET_FILE_RELATIVE_PATH);
            await waitForCondition(
                'active editor opened from PowerBuilder explorer',
                PROVIDER_TIMEOUT_MS,
                async () => {
                    const editor = vscode.window.activeTextEditor;

                    if (!editor) {
                        return undefined;
                    }

                    return normalizeFsPath(editor.document.uri.fsPath) === normalizeFsPath(targetUri.fsPath)
                        ? editor
                        : undefined;
                },
            );
            const openMs = Date.now() - openStartedAt;

            const document = await vscode.workspace.openTextDocument(targetUri);
            const hoverPosition = getRequiredPosition(
                document,
                'of_GetExampleTitle',
            );

            const hoverStartedAt = Date.now();
            const hovers = await withTimeout(
                'hover on real PFC symbol',
                PROVIDER_TIMEOUT_MS,
                vscode.commands.executeCommand<vscode.Hover[]>(
                    'vscode.executeHoverProvider',
                    document.uri,
                    hoverPosition,
                ),
            );
            const hoverMs = Date.now() - hoverStartedAt;

            assert.ok(hovers && hovers.length > 0, 'Expected hover content for of_GetExampleTitle in real PFC workspace');

            const hoverText = hovers!.map(getHoverText).join('\n');
            assert.ok(
                /of_getexampletitle|of_GetExampleTitle/i.test(hoverText),
                `Unexpected hover payload for of_GetExampleTitle: ${hoverText}`,
            );

            await waitForCondition(
                'completed initial indexing for real PFC workspace',
                READY_TIMEOUT_MS,
                async () => index.hasCompletedInitialWorkspaceIndexing ? true : undefined,
            );
            const readyMs = Date.now() - activationStartedAt;

            const referencesStartedAt = Date.now();
            const references = await withTimeout(
                'references on real PFC symbol',
                PROVIDER_TIMEOUT_MS,
                vscode.commands.executeCommand<vscode.Location[]>(
                    'vscode.executeReferenceProvider',
                    document.uri,
                    hoverPosition,
                ),
            );
            const referencesMs = Date.now() - referencesStartedAt;

            assert.ok(references && references.length > 0, 'Expected references for of_GetExampleTitle in real PFC workspace');

            const prototypePosition = getRequiredPosition(
                document,
                'public function string of_getexampletitle (string as_classname)',
            );
            const implementationPosition = getRequiredPosition(
                document,
                'public function string of_getexampletitle (string as_classname);',
            );

            const sameFileReferenceLines = references!
                .filter(location => normalizeFsPath(location.uri.fsPath) === normalizeFsPath(document.uri.fsPath))
                .map(location => location.range.start.line);

            assert.ok(
                sameFileReferenceLines.includes(implementationPosition.line),
                `Expected implementation declaration in references. Lines: ${sameFileReferenceLines.join(', ')}`,
            );
            assert.ok(
                !sameFileReferenceLines.includes(prototypePosition.line),
                `Forward prototype must not be counted as reference. Lines: ${sameFileReferenceLines.join(', ')}`,
            );

            console.log(
                `[PFC real smoke] activation=${activationMs}ms explorer=${explorerTarget.readyMs}ms open=${openMs}ms hover=${hoverMs}ms ready=${readyMs}ms references=${referencesMs}ms files=${index.fileCount} symbols=${index.symbolCount}`,
            );
        } finally {
            restoreCreateTreeView();

            for (const disposable of explorerDisposables) {
                disposable.dispose();
            }
        }
    });
});

function isRealPfcWorkspace(): boolean {
    const workspaceRoot = getWorkspaceRoot();

    return !!workspaceRoot && fs.existsSync(path.join(workspaceRoot.fsPath, PFC_SOLUTION_FILE));
}

function getWorkspaceRoot(): vscode.Uri | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri;
}

function getWorkspaceUri(relativePath: string): vscode.Uri {
    const workspaceRoot = getWorkspaceRoot();

    if (!workspaceRoot) {
        throw new Error('Expected an active workspace folder for PFC real workspace integration tests.');
    }

    return vscode.Uri.file(path.join(workspaceRoot.fsPath, relativePath));
}

function getRequiredPosition(document: vscode.TextDocument, needle: string): vscode.Position {
    const offset = document.getText().indexOf(needle);

    if (offset < 0) {
        throw new Error(`Expected to find '${needle}' in ${document.uri.fsPath}`);
    }

    return document.positionAt(offset + Math.min(needle.length - 1, 2));
}

function getHoverText(hover: vscode.Hover): string {
    return hover.contents.map(content => {
        if (typeof content === 'string') {
            return content;
        }

        if ('value' in content) {
            return content.value;
        }

        return '';
    }).join('\n');
}

function normalizeFsPath(value: string): string {
    return value.replace(/\\/g, '/').toLowerCase();
}

function normalizeLabel(label: vscode.TreeItemLabel | string | undefined): string {
    if (typeof label === 'string') {
        return label;
    }

    if (label?.label) {
        return label.label;
    }

    return '';
}

function replaceProperty<Target extends object, Key extends keyof Target>(
    target: Target,
    key: Key,
    replacement: Target[Key],
): () => void {
    const original = target[key];

    Object.defineProperty(target, key, {
        configurable: true,
        writable: true,
        value: replacement,
    });

    return () => {
        Object.defineProperty(target, key, {
            configurable: true,
            writable: true,
            value: original,
        });
    };
}

async function activateExtension(): Promise<void> {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);

    assert.ok(extension, `Expected extension ${EXTENSION_ID} to be installed in the test host.`);

    await extension!.activate();
}

async function getChildren(
    provider: vscode.TreeDataProvider<vscode.TreeItem>,
    element?: vscode.TreeItem,
): Promise<vscode.TreeItem[]> {
    return (await Promise.resolve(provider.getChildren(element))) ?? [];
}

async function findFileItem(
    provider: vscode.TreeDataProvider<vscode.TreeItem>,
    projectLabel: string,
    relativePath: string,
): Promise<vscode.TreeItem | undefined> {
    const normalizedPath = relativePath.replace(/\\/g, '/').toLowerCase();
    const rootItems = await getChildren(provider);
    const projectItem = rootItems.find(item => normalizeLabel(item.label).toLowerCase() === projectLabel.toLowerCase());
    const fileItems = projectItem
        ? await getChildren(provider, projectItem)
        : rootItems;

    return fileItems.find(item => normalizeLabel(item.label).replace(/\\/g, '/').toLowerCase().endsWith(normalizedPath));
}

async function findCallableItem(
    provider: vscode.TreeDataProvider<vscode.TreeItem>,
    fileItem: vscode.TreeItem,
    rootSymbolName: string,
    callableName: string,
): Promise<vscode.TreeItem | undefined> {
    const fileChildren = await getChildren(provider, fileItem);
    const rootItem = fileChildren.find(item => normalizeLabel(item.label).toLowerCase() === rootSymbolName.toLowerCase());
    const symbolChildren = rootItem
        ? await getChildren(provider, rootItem)
        : fileChildren;

    return symbolChildren.find(item => normalizeLabel(item.label).toLowerCase() === callableName.toLowerCase());
}

async function waitForCondition<T>(
    description: string,
    timeoutMs: number,
    probe: () => Promise<T | undefined>,
): Promise<T> {
    const startedAt = Date.now();

    while (Date.now() - startedAt <= timeoutMs) {
        const result = await probe();

        if (result !== undefined) {
            return result;
        }

        await delay(POLL_INTERVAL_MS);
    }

    throw new Error(`${description} timed out after ${timeoutMs} ms.`);
}

async function withTimeout<T>(
    description: string,
    timeoutMs: number,
    promise: Thenable<T>,
): Promise<T> {
    let handle: ReturnType<typeof setTimeout> | undefined;

    try {
        return await Promise.race([
            Promise.resolve(promise),
            new Promise<never>((_resolve, reject) => {
                handle = setTimeout(() => {
                    reject(new Error(`${description} timed out after ${timeoutMs} ms.`));
                }, timeoutMs);
            }),
        ]);
    } finally {
        if (handle) {
            clearTimeout(handle);
        }
    }
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}