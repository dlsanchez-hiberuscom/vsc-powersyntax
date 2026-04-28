import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import { registerCoreServices } from '../../bootstrap/registerCoreServices';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForCondition(
    predicate: () => boolean | Promise<boolean>,
    timeoutMs: number = 15000,
    intervalMs: number = 75,
): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        if (await predicate()) {
            return;
        }

        await delay(intervalMs);
    }

    assert.fail('Timed out waiting for workspace watcher condition');
}

async function writeWorkspaceFiles(
    baseRelativePath: string,
    files: Record<string, string>,
): Promise<Record<string, vscode.Uri>> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for integration tests');

    const uris: Record<string, vscode.Uri> = {};

    await Promise.all(Object.entries(files).map(async ([relativePath, content]) => {
        const absolutePath = path.join(
            workspaceFolder.uri.fsPath,
            baseRelativePath,
            relativePath,
        );

        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, content, 'utf8');
        uris[relativePath] = vscode.Uri.file(absolutePath);
    }));

    return uris;
}

async function removeWorkspaceScenario(baseRelativePath: string): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for integration tests');
    const scenarioPath = path.join(workspaceFolder.uri.fsPath, baseRelativePath);

    try {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    } catch {
        // Ignorar hosts sin UI completa durante el cleanup.
    }

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await fs.rm(scenarioPath, { recursive: true, force: true });
            break;
        } catch {
            // Reintentar tras limpiar estado compartido.
        }

        PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
        SymbolIndex.getInstance().clear();
        PbLibraryGraph.getInstance().clear();
    }

    try {
        await vscode.workspace.fs.delete(vscode.Uri.file(scenarioPath), {
            recursive: true,
            useTrash: false,
        });
    } catch {
        // Los watchers pueden retener locks transitorios en Windows.
    }

    PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
    SymbolIndex.getInstance().clear();
    PbLibraryGraph.getInstance().clear();
}

function buildBurstFileText(name: string, functionName: string, returnValue: number): string {
    return [
        `global type ${name} from nonvisualobject`,
        'end type',
        `global ${name} ${name}`,
        '',
        `public function long ${functionName} ();`,
        `return ${returnValue}`,
        'end function',
    ].join('\n');
}

function buildInitialBurstFiles(count: number): Record<string, string> {
    const files: Record<string, string> = {};

    for (let index = 1; index <= count; index++) {
        const suffix = index.toString().padStart(3, '0');
        const folder = index % 2 === 0 ? 'lib' : 'app';
        files[`${folder}/n_burst_${suffix}.sru`] = buildBurstFileText(
            `n_burst_${suffix}`,
            `of_burst_${suffix}`,
            index,
        );
    }

    return files;
}

suite('Workspace watcher burst integration', () => {
    setup(() => {
        PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
        SymbolIndex.getInstance().clear();
        PbLibraryGraph.getInstance().clear();
    });

    test('registerCoreServices converge tras una ráfaga real de altas, cambios y bajas', async function () {
        this.timeout(60000);

        const index = SymbolIndex.getInstance();
        const baseRelativePath = path.join('phase6-generated', 'watcher-burst-workspace');
        const disposables = registerCoreServices({} as vscode.ExtensionContext);

        try {
            await waitForCondition(() => index.hasCompletedInitialWorkspaceIndexing);

            index.clear();
            PbLibraryGraph.getInstance().clear();
            await delay(150);

            const initialFiles = buildInitialBurstFiles(18);
            const initialUris = await writeWorkspaceFiles(baseRelativePath, initialFiles);
            const initialEntries = Object.entries(initialUris);

            await waitForCondition(() =>
                initialEntries.every(([, uri]) => index.getSymbolsForFile(uri).length > 0),
            );

            for (const [relativePath, uri] of initialEntries) {
                const suffix = relativePath.match(/(\d{3})\.sru$/)?.[1];
                assert.ok(suffix, `Expected numeric suffix in ${relativePath}`);
                assert.ok(index.searchSymbols(`of_burst_${suffix}`).some(symbol => symbol.uri.toString() === uri.toString()));
            }

            const modifiedSpecs = [3, 7, 11].map(indexValue => {
                const suffix = indexValue.toString().padStart(3, '0');
                const folder = indexValue % 2 === 0 ? 'lib' : 'app';
                return {
                    relativePath: `${folder}/n_burst_${suffix}.sru`,
                    uri: initialUris[`${folder}/n_burst_${suffix}.sru`],
                    oldFunctionName: `of_burst_${suffix}`,
                    newFunctionName: `of_burst_${suffix}_updated`,
                    text: buildBurstFileText(
                        `n_burst_${suffix}`,
                        `of_burst_${suffix}_updated`,
                        indexValue * 10,
                    ),
                };
            });

            const deletedSpecs = [5, 9, 13].map(indexValue => {
                const suffix = indexValue.toString().padStart(3, '0');
                const folder = indexValue % 2 === 0 ? 'lib' : 'app';
                const relativePath = `${folder}/n_burst_${suffix}.sru`;
                return {
                    relativePath,
                    uri: initialUris[relativePath],
                    deletedFunctionName: `of_burst_${suffix}`,
                };
            });

            const createdFiles = {
                'app/n_burst_019.sru': buildBurstFileText('n_burst_019', 'of_burst_019', 19),
                'lib/n_burst_020.sru': buildBurstFileText('n_burst_020', 'of_burst_020', 20),
                'app/n_burst_021.sru': buildBurstFileText('n_burst_021', 'of_burst_021', 21),
            };

            await Promise.all([
                ...modifiedSpecs.map(spec => fs.writeFile(spec.uri.fsPath, spec.text, 'utf8')),
                ...deletedSpecs.map(spec => fs.rm(spec.uri.fsPath, { force: true })),
                writeWorkspaceFiles(baseRelativePath, createdFiles),
            ]);

            const createdUris = Object.entries(createdFiles).map(([relativePath]) => ({
                relativePath,
                uri: vscode.Uri.file(path.join(
                    vscode.workspace.workspaceFolders![0].uri.fsPath,
                    baseRelativePath,
                    relativePath,
                )),
            }));

            await waitForCondition(() => {
                const modifiedReady = modifiedSpecs.every(spec => {
                    const fileSymbols = index.getSymbolsForFile(spec.uri);
                    return fileSymbols.some(symbol => symbol.name === spec.newFunctionName) &&
                        !fileSymbols.some(symbol => symbol.name === spec.oldFunctionName);
                });
                const deletedReady = deletedSpecs.every(spec => index.getSymbolsForFile(spec.uri).length === 0);
                const createdReady = createdUris.every(spec => index.getSymbolsForFile(spec.uri).length > 0);

                return modifiedReady && deletedReady && createdReady;
            });

            assert.ok(modifiedSpecs.every(spec =>
                index.findSymbolByName(spec.newFunctionName).some(symbol => symbol.uri.toString() === spec.uri.toString()),
            ));
            assert.ok(modifiedSpecs.every(spec =>
                index.findSymbolByName(spec.oldFunctionName).every(symbol => symbol.uri.toString() !== spec.uri.toString()),
            ));
            assert.ok(deletedSpecs.every(spec => index.findSymbolByName(spec.deletedFunctionName).length === 0));
            assert.ok(createdUris.every(spec =>
                index.findSymbolByName(path.basename(spec.relativePath, '.sru').replace('n_', 'of_')).length > 0,
            ));
        } finally {
            for (const disposable of disposables) {
                disposable.dispose();
            }

            await removeWorkspaceScenario(baseRelativePath);
        }
    });
});