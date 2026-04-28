import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import { getSymbolContextAtPosition } from '../../core/utils/documentUtils';
import { WorkspaceIndexer } from '../../powerbuilder/indexing/workspaceIndexer';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { ReferenceResolver } from '../../powerbuilder/resolution/referenceResolver';
import { RenameResolver } from '../../powerbuilder/resolution/renameResolver';

function extractMarkedText(source: string): { text: string; position: vscode.Position } {
    const startMarker = source.indexOf('[[');
    const endMarker = source.indexOf(']]', startMarker + 2);

    assert.ok(startMarker >= 0 && endMarker > startMarker, 'Expected a [[marked]] identifier');

    const markedText = source.slice(startMarker + 2, endMarker);
    const cleanText = source.slice(0, startMarker) + markedText + source.slice(endMarker + 2);
    const prefix = cleanText.slice(0, startMarker);
    const lines = prefix.split(/\r?\n/);

    return {
        text: cleanText,
        position: new vscode.Position(
            lines.length - 1,
            lines[lines.length - 1].length,
        ),
    };
}

function createProjectText(appEntry: string, libraries: string[]): string {
    const normalizedAppEntry = appEntry.replace(/\//g, '\\\\');
    const libraryEntries = libraries
        .map(library => `        <Library Path="${library.replace(/\//g, '\\\\')}"/>`)
        .join('\n');

    return [
        '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
        '<Project>',
        '    <Type Name="pb"/>',
        '    <Application Name="demo"/>',
        `    <Libraries AppEntry="${normalizedAppEntry}">`,
        libraryEntries,
        '    </Libraries>',
        '</Project>',
    ].join('\n');
}

async function writeWorkspaceScenario(
    baseRelativePath: string,
    files: Record<string, string>,
): Promise<Record<string, vscode.Uri>> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for integration tests');

    const uris: Record<string, vscode.Uri> = {};

    for (const [relativePath, content] of Object.entries(files)) {
        const absolutePath = path.join(
            workspaceFolder.uri.fsPath,
            baseRelativePath,
            relativePath,
        );

        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, content, 'utf8');
        uris[relativePath] = vscode.Uri.file(absolutePath);
    }

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
        // El host de tests y los watchers pueden retener locks transitorios en Windows.
    }

    PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
    SymbolIndex.getInstance().clear();
    PbLibraryGraph.getInstance().clear();
}

function toWorkspaceRelativePath(uri: vscode.Uri): string {
    return vscode.workspace.asRelativePath(uri, false).replace(/\\/g, '/');
}

suite('Project-aware workspace integration', () => {
    let index: SymbolIndex;
    let indexer: WorkspaceIndexer;
    let referenceResolver: ReferenceResolver;
    let renameResolver: RenameResolver;

    setup(() => {
        index = SymbolIndex.getInstance();
        index.clear();
        PbLibraryGraph.getInstance().clear();
        indexer = new WorkspaceIndexer(index);
        referenceResolver = new ReferenceResolver(index);
        renameResolver = new RenameResolver(index);
    });

    test('WorkspaceIndexer indexa incrementalmente las raíces afectadas por un pbproj', async () => {
        const baseRelativePath = path.join('phase4-generated', 'workspace-indexer-incremental');
        const externalRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'almunia-phase4-'));

        const alphaRoot = path.join(externalRoot, 'project-a', 'app.pbl');
        const betaRoot = path.join(externalRoot, 'project-b', 'app.pbl');
        const alphaUri = vscode.Uri.file(path.join(alphaRoot, 'u_alpha.sru'));
        const betaUri = vscode.Uri.file(path.join(betaRoot, 'u_beta.sru'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'sample.pbproj': createProjectText(
                    alphaRoot,
                    [alphaRoot],
                ),
            });

            await fs.mkdir(alphaRoot, { recursive: true });
            await fs.writeFile(
                alphaUri.fsPath,
                [
                    'global type u_alpha from userobject',
                    'end type',
                    'global u_alpha u_alpha',
                ].join('\n'),
                'utf8',
            );

            await indexer.indexProjectFile(uris['sample.pbproj']);

            assert.ok(index.getSymbolsForFile(alphaUri).length > 0);

            await fs.mkdir(betaRoot, { recursive: true });
            await fs.writeFile(
                betaUri.fsPath,
                [
                    'global type u_beta from userobject',
                    'end type',
                    'global u_beta u_beta',
                ].join('\n'),
                'utf8',
            );

            await fs.writeFile(
                uris['sample.pbproj'].fsPath,
                createProjectText(
                    betaRoot,
                    [betaRoot],
                ),
                'utf8',
            );

            await indexer.indexProjectFile(uris['sample.pbproj']);

            assert.ok(index.getSymbolsForFile(betaUri).length > 0);
            assert.strictEqual(
                index.getSymbolsForFile(alphaUri).length,
                0,
                'Expected stale symbols from previous project roots to be invalidated',
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await fs.rm(externalRoot, { recursive: true, force: true });
        }
    });

    test('WorkspaceIndexer invalida símbolos externos al eliminar un pbproj', async () => {
        const baseRelativePath = path.join('phase4-generated', 'workspace-indexer-project-delete');
        const externalRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'almunia-phase4-'));
        const externalUri = vscode.Uri.file(path.join(externalRoot, 'app.pbl', 'u_deleted.sru'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'sample.pbproj': createProjectText(
                    path.join(externalRoot, 'app.pbl'),
                    [path.join(externalRoot, 'app.pbl')],
                ),
            });

            await fs.mkdir(path.dirname(externalUri.fsPath), { recursive: true });
            await fs.writeFile(
                externalUri.fsPath,
                [
                    'global type u_deleted from userobject',
                    'end type',
                    'global u_deleted u_deleted',
                ].join('\n'),
                'utf8',
            );

            await indexer.indexProjectFile(uris['sample.pbproj']);
            assert.ok(index.getSymbolsForFile(externalUri).length > 0);

            indexer.removeProjectFile(uris['sample.pbproj']);

            assert.strictEqual(
                index.getSymbolsForFile(externalUri).length,
                0,
                'Expected external symbols to be removed after deleting the project file',
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await fs.rm(externalRoot, { recursive: true, force: true });
        }
    });

    test('WorkspaceIndexer refresca snapshots de roots externos cuando cambia el archivo en disco', async () => {
        const baseRelativePath = path.join('phase4-generated', 'workspace-indexer-external-refresh');
        const externalRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'almunia-phase7-refresh-'));
        const externalUri = vscode.Uri.file(path.join(externalRoot, 'app.pbl', 'u_worker.sru'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'sample.pbproj': createProjectText(
                    path.join(externalRoot, 'app.pbl'),
                    [path.join(externalRoot, 'app.pbl')],
                ),
            });

            await fs.mkdir(path.dirname(externalUri.fsPath), { recursive: true });
            await fs.writeFile(
                externalUri.fsPath,
                [
                    'global type u_worker from userobject',
                    'end type',
                    'global u_worker u_worker',
                ].join('\n'),
                'utf8',
            );

            await indexer.indexProjectFile(uris['sample.pbproj']);

            assert.ok(index.getSymbolsForFile(externalUri).some(symbol => symbol.name === 'u_worker'));

            await fs.writeFile(
                externalUri.fsPath,
                [
                    'global type u_worker_refreshed from userobject',
                    'end type',
                    'global u_worker_refreshed u_worker_refreshed',
                ].join('\n'),
                'utf8',
            );

            await indexer.indexProjectFile(uris['sample.pbproj']);

            const refreshedSymbols = index.getSymbolsForFile(externalUri).map(symbol => symbol.name);

            assert.ok(refreshedSymbols.includes('u_worker_refreshed'));
            assert.ok(!refreshedSymbols.includes('u_worker'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await fs.rm(externalRoot, { recursive: true, force: true });
        }
    });

    test('WorkspaceIndexer conserva símbolos de roots compartidas mientras otro proyecto siga activo', async () => {
        const baseRelativePath = path.join('phase4-generated', 'workspace-indexer-shared-roots');
        const externalRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'almunia-phase7-shared-'));
        const sharedRoot = path.join(externalRoot, 'shared.pbl');
        const sharedUri = vscode.Uri.file(path.join(sharedRoot, 'u_shared.sru'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'project-a.pbproj': createProjectText(sharedRoot, [sharedRoot]),
                'project-b.pbproj': createProjectText(sharedRoot, [sharedRoot]),
            });

            await fs.mkdir(sharedRoot, { recursive: true });
            await fs.writeFile(
                sharedUri.fsPath,
                [
                    'global type u_shared from userobject',
                    'end type',
                    'global u_shared u_shared',
                ].join('\n'),
                'utf8',
            );

            await indexer.indexProjectFile(uris['project-a.pbproj']);
            await indexer.indexProjectFile(uris['project-b.pbproj']);

            assert.ok(index.getSymbolsForFile(sharedUri).length > 0);

            indexer.removeProjectFile(uris['project-a.pbproj']);

            assert.ok(
                index.getSymbolsForFile(sharedUri).length > 0,
                'Expected shared root symbols to stay indexed while another project still retains the root',
            );

            indexer.removeProjectFile(uris['project-b.pbproj']);

            assert.strictEqual(index.getSymbolsForFile(sharedUri).length, 0);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await fs.rm(externalRoot, { recursive: true, force: true });
        }
    });

    test('ReferenceResolver limita referencias al proyecto preferido en un workspace real', async () => {
        const baseRelativePath = path.join('phase4-generated', 'project-aware-references');
        const callerInput = extractMarkedText([
            'global type w_caller from window',
            'end type',
            'global w_caller w_caller',
            '',
            'event open;',
            '[[of_begin]]()',
            'end event',
        ].join('\n'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'project-a.pbproj': createProjectText(
                    'project-a/app.pbl',
                    ['project-a/app.pbl', 'project-a/lib.pbl'],
                ),
                'project-b.pbproj': createProjectText(
                    'project-b/app.pbl',
                    ['project-b/app.pbl', 'project-b/lib.pbl'],
                ),
                'project-a/app.pbl/w_caller.sru': callerInput.text,
                'project-a/lib.pbl/n_service.sru': [
                    'global type n_service from nonvisualobject',
                    'end type',
                    'global n_service n_service',
                    '',
                    'public function long of_begin ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'project-a/lib.pbl/w_consumer.sru': [
                    'global type w_consumer from window',
                    'end type',
                    'global w_consumer w_consumer',
                    '',
                    'event open;',
                    'of_begin()',
                    'end event',
                ].join('\n'),
                'project-b/app.pbl/w_other.sru': [
                    'global type w_other from window',
                    'end type',
                    'global w_other w_other',
                    '',
                    'event open;',
                    'of_begin()',
                    'end event',
                ].join('\n'),
                'project-b/lib.pbl/n_service.sru': [
                    'global type n_service from nonvisualobject',
                    'end type',
                    'global n_service n_service',
                    '',
                    'public function long of_begin ();',
                    'return 2',
                    'end function',
                ].join('\n'),
            });

            await indexer.indexProjectFile(uris['project-a.pbproj']);
            await indexer.indexProjectFile(uris['project-b.pbproj']);

            const callerUri = uris['project-a/app.pbl/w_caller.sru'];
            const document = await vscode.workspace.openTextDocument(callerUri);
            const context = getSymbolContextAtPosition(document, callerInput.position);

            assert.ok(context, 'Expected reference context');

            const locations = await referenceResolver.resolveInWorkspace(
                context!.word,
                callerUri,
                true,
                context!,
            );

            const relativePaths = locations
                .map(location => toWorkspaceRelativePath(location.uri))
                .sort();

            assert.deepStrictEqual(relativePaths, [
                `${baseRelativePath.replace(/\\/g, '/')}/project-a/app.pbl/w_caller.sru`,
                `${baseRelativePath.replace(/\\/g, '/')}/project-a/lib.pbl/n_service.sru`,
                `${baseRelativePath.replace(/\\/g, '/')}/project-a/lib.pbl/w_consumer.sru`,
            ].sort());
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('RenameResolver limita el renombrado al proyecto preferido en un workspace real', async () => {
        const baseRelativePath = path.join('phase4-generated', 'project-aware-rename');
        const callerInput = extractMarkedText([
            'global type w_caller from window',
            'end type',
            'global w_caller w_caller',
            '',
            'event open;',
            '[[of_begin]]()',
            'end event',
        ].join('\n'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'project-a.pbproj': createProjectText(
                    'project-a/app.pbl',
                    ['project-a/app.pbl', 'project-a/lib.pbl'],
                ),
                'project-b.pbproj': createProjectText(
                    'project-b/app.pbl',
                    ['project-b/app.pbl', 'project-b/lib.pbl'],
                ),
                'project-a/app.pbl/w_caller.sru': callerInput.text,
                'project-a/lib.pbl/n_service.sru': [
                    'global type n_service from nonvisualobject',
                    'end type',
                    'global n_service n_service',
                    '',
                    'public function long of_begin ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'project-a/lib.pbl/w_consumer.sru': [
                    'global type w_consumer from window',
                    'end type',
                    'global w_consumer w_consumer',
                    '',
                    'event open;',
                    'of_begin()',
                    'end event',
                ].join('\n'),
                'project-b/app.pbl/w_other.sru': [
                    'global type w_other from window',
                    'end type',
                    'global w_other w_other',
                    '',
                    'event open;',
                    'of_begin()',
                    'end event',
                ].join('\n'),
                'project-b/lib.pbl/n_service.sru': [
                    'global type n_service from nonvisualobject',
                    'end type',
                    'global n_service n_service',
                    '',
                    'public function long of_begin ();',
                    'return 2',
                    'end function',
                ].join('\n'),
            });

            await indexer.indexProjectFile(uris['project-a.pbproj']);
            await indexer.indexProjectFile(uris['project-b.pbproj']);

            const callerUri = uris['project-a/app.pbl/w_caller.sru'];
            const document = await vscode.workspace.openTextDocument(callerUri);
            const context = getSymbolContextAtPosition(document, callerInput.position);

            assert.ok(context, 'Expected rename context');

            const edit = await renameResolver.computeEdits(
                context!.word,
                'of_launch',
                callerUri,
                context!,
            );

            assert.ok(edit, 'Expected rename edits');

            const entries = edit!.entries().map(([uri, textEdits]) => ({
                relativePath: toWorkspaceRelativePath(uri),
                textEdits,
            }));

            const relativePaths = entries
                .map(entry => entry.relativePath)
                .sort();

            assert.deepStrictEqual(relativePaths, [
                `${baseRelativePath.replace(/\\/g, '/')}/project-a/app.pbl/w_caller.sru`,
                `${baseRelativePath.replace(/\\/g, '/')}/project-a/lib.pbl/n_service.sru`,
                `${baseRelativePath.replace(/\\/g, '/')}/project-a/lib.pbl/w_consumer.sru`,
            ].sort());

            assert.ok(entries.every(entry =>
                entry.textEdits.length === 1 &&
                entry.textEdits[0].newText === 'of_launch',
            ));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });
});