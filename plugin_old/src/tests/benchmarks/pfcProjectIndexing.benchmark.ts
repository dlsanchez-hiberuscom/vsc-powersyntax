import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { performance } from 'perf_hooks';
import * as vscode from 'vscode';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { WorkspaceIndexer } from '../../powerbuilder/indexing/workspaceIndexer';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { M_RTEFRAME_FIXTURE } from '../fixtures/pfc2025/m_rteframe.fixture';
import { N_TR_FIXTURE } from '../fixtures/pfc2025/n_tr.fixture';
import { W_MASTER_FIXTURE } from '../fixtures/pfc2025/w_master.fixture';

interface ProjectCorpus {
    appEntry: string;
    libraries: string[];
    callerUri: vscode.Uri;
    refreshUri: vscode.Uri;
}

function replaceWholeWord(text: string, source: string, target: string): string {
    return text.replace(new RegExp(`\\b${source}\\b`, 'g'), target);
}

function createProjectText(
    projectDirectory: string,
    appEntry: string,
    libraries: string[],
): string {
    const toProjectRelative = (absolutePath: string) =>
        path.relative(projectDirectory, absolutePath).replace(/\//g, '\\\\');

    const libraryEntries = libraries
        .map(library => `        <Library Path="${toProjectRelative(library)}"/>`)
        .join('\n');

    return [
        '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
        '<Project>',
        '    <Type Name="pb"/>',
        '    <Application Name="pfc-benchmark"/>',
        `    <Libraries AppEntry="${toProjectRelative(appEntry)}">`,
        libraryEntries,
        '    </Libraries>',
        '</Project>',
    ].join('\n');
}

async function buildExternalProjectCorpus(
    baseRoot: string,
    projectName: string,
    copiesPerFixture: number,
): Promise<ProjectCorpus> {
    const appRoot = path.join(baseRoot, projectName, 'examples', 'exmmain.pbl');
    const utilRoot = path.join(baseRoot, projectName, 'examples', 'exmutil.pbl');

    await fs.mkdir(appRoot, { recursive: true });
    await fs.mkdir(utilRoot, { recursive: true });

    const callerUri = vscode.Uri.file(path.join(appRoot, 'w_caller.sru'));
    const refreshUri = vscode.Uri.file(path.join(utilRoot, 'u_refresh_target.sru'));

    await fs.writeFile(
        callerUri.fsPath,
        [
            'global type w_caller from window',
            'end type',
            'global w_caller w_caller',
            '',
            'event open;',
            'of_begin()',
            'end event',
        ].join('\n'),
        'utf8',
    );

    await fs.writeFile(
        refreshUri.fsPath,
        [
            'global type u_refresh_target from userobject',
            'end type',
            'global u_refresh_target u_refresh_target',
        ].join('\n'),
        'utf8',
    );

    for (let index = 1; index <= copiesPerFixture; index++) {
        const suffix = index.toString().padStart(3, '0');

        await fs.writeFile(
            path.join(appRoot, `w_master_${suffix}.srw`),
            replaceWholeWord(W_MASTER_FIXTURE, 'w_master', `w_master_${suffix}`),
            'utf8',
        );

        await fs.writeFile(
            path.join(utilRoot, `n_tr_${suffix}.sru`),
            replaceWholeWord(N_TR_FIXTURE, 'n_tr', `n_tr_${suffix}`),
            'utf8',
        );

        await fs.writeFile(
            path.join(utilRoot, `m_rteframe_${suffix}.srm`),
            replaceWholeWord(M_RTEFRAME_FIXTURE, 'm_rteframe', `m_rteframe_${suffix}`),
            'utf8',
        );
    }

    return {
        appEntry: appRoot,
        libraries: [appRoot, utilRoot],
        callerUri,
        refreshUri,
    };
}

function getTextPosition(document: vscode.TextDocument, searchText: string): vscode.Position {
    const offset = document.getText().indexOf(searchText);
    assert.ok(offset >= 0, `Expected ${searchText} in ${document.uri.fsPath}`);

    return document.positionAt(offset + Math.floor(searchText.length / 2));
}

suite('PFC project indexing benchmarks', () => {
    setup(() => {
        SymbolIndex.getInstance().clear();
        PbLibraryGraph.getInstance().clear();
    });

    test('mide indexado de pbproj con roots externos y reindexado incremental', async function () {
        this.timeout(60000);

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        assert.ok(workspaceFolder, 'Expected workspace folder');

        const index = SymbolIndex.getInstance();
        const indexer = new WorkspaceIndexer(index);
        const projectDirectory = path.join(
            workspaceFolder.uri.fsPath,
            'phase6-generated',
            'benchmarks',
            'project-aware',
        );
        const projectUri = vscode.Uri.file(path.join(projectDirectory, 'pfc_examples.pbproj'));
        const externalRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'almunia-pfc-project-bench-'));

        try {
            const alphaCorpus = await buildExternalProjectCorpus(externalRoot, 'alpha', 18);
            const betaCorpus = await buildExternalProjectCorpus(externalRoot, 'beta', 18);

            await fs.mkdir(projectDirectory, { recursive: true });
            await fs.writeFile(
                projectUri.fsPath,
                createProjectText(projectDirectory, alphaCorpus.appEntry, alphaCorpus.libraries),
                'utf8',
            );

            const initialStart = performance.now();
            await indexer.indexProjectFile(projectUri);
            const initialMs = performance.now() - initialStart;

            const alphaDocument = await vscode.workspace.openTextDocument(alphaCorpus.callerUri);
            const alphaDefinitionStart = performance.now();
            const alphaLocations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                alphaCorpus.callerUri,
                getTextPosition(alphaDocument, 'of_begin'),
            );
            const alphaDefinitionMs = performance.now() - alphaDefinitionStart;

            assert.ok(alphaLocations);
            assert.strictEqual(alphaLocations!.length, 0);
            assert.ok(index.getSymbolsForFile(alphaCorpus.callerUri).length > 0);

            await fs.writeFile(
                projectUri.fsPath,
                createProjectText(projectDirectory, betaCorpus.appEntry, betaCorpus.libraries),
                'utf8',
            );

            const incrementalStart = performance.now();
            await indexer.indexProjectFile(projectUri);
            const incrementalMs = performance.now() - incrementalStart;

            const betaDocument = await vscode.workspace.openTextDocument(betaCorpus.callerUri);
            const betaDefinitionStart = performance.now();
            const betaLocations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                betaCorpus.callerUri,
                getTextPosition(betaDocument, 'of_begin'),
            );
            const betaDefinitionMs = performance.now() - betaDefinitionStart;

            const workspaceSymbolStart = performance.now();
            const workspaceSymbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeWorkspaceSymbolProvider',
                'of_begin',
            );
            const workspaceSymbolMs = performance.now() - workspaceSymbolStart;

            await fs.writeFile(
                betaCorpus.refreshUri.fsPath,
                [
                    'global type u_refresh_target_refreshed from userobject',
                    'end type',
                    'global u_refresh_target_refreshed u_refresh_target_refreshed',
                ].join('\n'),
                'utf8',
            );

            const snapshotRefreshStart = performance.now();
            await indexer.indexProjectFile(projectUri);
            const snapshotRefreshMs = performance.now() - snapshotRefreshStart;
            const refreshedSymbolNames = index.getSymbolsForFile(betaCorpus.refreshUri)
                .map(symbol => symbol.name.toLowerCase());

            assert.ok(betaLocations);
            assert.strictEqual(betaLocations!.length, 0);
            assert.ok(index.getSymbolsForFile(betaCorpus.callerUri).length > 0);
            assert.ok(index.getSymbolsForFile(betaCorpus.refreshUri).length > 0);
            assert.ok(workspaceSymbols);
            assert.ok(workspaceSymbols!.length > 0);
            assert.ok(index.fileCount >= 2);
            assert.ok(refreshedSymbolNames.includes('u_refresh_target_refreshed'));
            assert.ok(!refreshedSymbolNames.includes('u_refresh_target'));

            console.log(
                `[PFC project benchmark] files=${index.fileCount} symbols=${index.symbolCount} initialProjectIndex=${initialMs.toFixed(2)}ms alphaDefinition=${alphaDefinitionMs.toFixed(2)}ms incrementalProjectIndex=${incrementalMs.toFixed(2)}ms betaDefinition=${betaDefinitionMs.toFixed(2)}ms workspaceSymbols=${workspaceSymbolMs.toFixed(2)}ms/${workspaceSymbols!.length} snapshotRefreshProjectIndex=${snapshotRefreshMs.toFixed(2)}ms`,
            );
        } finally {
            await fs.rm(projectDirectory, { recursive: true, force: true });
            await fs.rm(externalRoot, { recursive: true, force: true });
        }
    });
});