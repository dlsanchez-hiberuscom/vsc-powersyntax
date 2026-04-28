import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';
import * as vscode from 'vscode';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { WorkspaceIndexer } from '../../powerbuilder/indexing/workspaceIndexer';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { M_RTEFRAME_FIXTURE } from '../fixtures/pfc2025/m_rteframe.fixture';
import { N_TR_FIXTURE } from '../fixtures/pfc2025/n_tr.fixture';
import { W_MASTER_FIXTURE } from '../fixtures/pfc2025/w_master.fixture';

interface MultiProjectScenario {
    projectUris: vscode.Uri[];
    callerUri: vscode.Uri;
    includedUris: vscode.Uri[];
    excludedUris: vscode.Uri[];
    excludePattern: string;
    baseRelativePath: string;
}

function replaceWholeWord(text: string, source: string, target: string): string {
    return text.replace(new RegExp(`\\b${source}\\b`, 'g'), target);
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
        '    <Application Name="pfc-benchmark"/>',
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
    assert.ok(workspaceFolder, 'Expected workspace folder');

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
    assert.ok(workspaceFolder, 'Expected workspace folder');

    try {
        await fs.rm(
            path.join(workspaceFolder.uri.fsPath, baseRelativePath),
            { recursive: true, force: true },
        );
    } catch {
        // Ignorar locks transitorios.
    }
}

function getTextPosition(document: vscode.TextDocument, searchText: string): vscode.Position {
    const offset = document.getText().indexOf(searchText);
    assert.ok(offset >= 0, `Expected ${searchText} in ${document.uri.fsPath}`);

    return document.positionAt(offset + Math.floor(searchText.length / 2));
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function buildWorkspaceMultiProjectScenario(
    baseRelativePath: string,
    copiesPerProject: number,
): Promise<MultiProjectScenario> {
    const projectFiles: Record<string, string> = {};
    const includedUris: vscode.Uri[] = [];
    const excludedUris: vscode.Uri[] = [];
    const projectUris: vscode.Uri[] = [];
    let callerUri: vscode.Uri | undefined;

    for (const projectName of ['alpha', 'beta', 'gamma']) {
        const appRoot = `${projectName}/app.pbl`;
        const utilRoot = `${projectName}/lib.pbl`;
        const ignoredRoot = `${projectName}/ignored.pbl`;

        projectFiles[`${projectName}/${projectName}.pbproj`] = createProjectText(
            appRoot,
            [appRoot, utilRoot, ignoredRoot],
        );

        projectUris.push(
            vscode.Uri.file(path.join(
                vscode.workspace.workspaceFolders![0].uri.fsPath,
                baseRelativePath,
                projectName,
                `${projectName}.pbproj`,
            )),
        );

        const callerRelativePath = `${appRoot}/w_${projectName}_caller.sru`;
        projectFiles[callerRelativePath] = [
            `global type w_${projectName}_caller from window`,
            'end type',
            `global w_${projectName}_caller w_${projectName}_caller`,
            '',
            'event open;',
            'of_begin()',
            'end event',
        ].join('\n');

        const currentCallerUri = vscode.Uri.file(path.join(
            vscode.workspace.workspaceFolders![0].uri.fsPath,
            baseRelativePath,
            callerRelativePath,
        ));
        includedUris.push(currentCallerUri);

        if (!callerUri) {
            callerUri = currentCallerUri;
        }

        for (let index = 1; index <= copiesPerProject; index++) {
            const suffix = index.toString().padStart(3, '0');

            const appRelativePath = `${appRoot}/w_master_${projectName}_${suffix}.srw`;
            projectFiles[appRelativePath] = replaceWholeWord(
                W_MASTER_FIXTURE,
                'w_master',
                `w_master_${projectName}_${suffix}`,
            );
            includedUris.push(vscode.Uri.file(path.join(
                vscode.workspace.workspaceFolders![0].uri.fsPath,
                baseRelativePath,
                appRelativePath,
            )));

            const utilRelativePath = `${utilRoot}/n_tr_${projectName}_${suffix}.sru`;
            projectFiles[utilRelativePath] = replaceWholeWord(
                N_TR_FIXTURE,
                'n_tr',
                `n_tr_${projectName}_${suffix}`,
            );
            includedUris.push(vscode.Uri.file(path.join(
                vscode.workspace.workspaceFolders![0].uri.fsPath,
                baseRelativePath,
                utilRelativePath,
            )));

            const menuRelativePath = `${utilRoot}/m_rteframe_${projectName}_${suffix}.srm`;
            projectFiles[menuRelativePath] = replaceWholeWord(
                M_RTEFRAME_FIXTURE,
                'm_rteframe',
                `m_rteframe_${projectName}_${suffix}`,
            );
            includedUris.push(vscode.Uri.file(path.join(
                vscode.workspace.workspaceFolders![0].uri.fsPath,
                baseRelativePath,
                menuRelativePath,
            )));

            const ignoredRelativePath = `${ignoredRoot}/n_tr_ignored_${projectName}_${suffix}.sru`;
            projectFiles[ignoredRelativePath] = replaceWholeWord(
                N_TR_FIXTURE,
                'n_tr',
                `n_tr_ignored_${projectName}_${suffix}`,
            );
            excludedUris.push(vscode.Uri.file(path.join(
                vscode.workspace.workspaceFolders![0].uri.fsPath,
                baseRelativePath,
                ignoredRelativePath,
            )));
        }
    }

    await writeWorkspaceScenario(baseRelativePath, projectFiles);

    return {
        projectUris,
        callerUri: callerUri!,
        includedUris,
        excludedUris,
        excludePattern: `${baseRelativePath.replace(/\\/g, '/')}/**/ignored.pbl/**`,
        baseRelativePath,
    };
}

suite('Workspace multiproject exclusion benchmark', () => {
    setup(() => {
        SymbolIndex.getInstance().clear();
        PbLibraryGraph.getInstance().clear();
    });

    test('mide reindexado real con varios pbproj y exclusiones configurables', async function () {
        this.timeout(60000);

        const index = SymbolIndex.getInstance();
        const indexer = new WorkspaceIndexer(index);
        const config = vscode.workspace.getConfiguration('powerbuilder');
        const previousExcludes = config.get<string[]>('indexing.exclude', []);
        const baseRelativePath = path.join('phase6-generated', 'benchmarks', 'workspace-multiproject');
        const excludePattern = `${baseRelativePath.replace(/\\/g, '/')}/**/ignored.pbl/**`;

        try {
            await config.update(
                'indexing.exclude',
                [excludePattern],
                vscode.ConfigurationTarget.Workspace,
            );

            await delay(350);
            const scenario = await buildWorkspaceMultiProjectScenario(baseRelativePath, 10);

            await delay(350);
            index.clear();
            PbLibraryGraph.getInstance().clear();

            const reindexStart = performance.now();
            await indexer.reindex();
            const reindexMs = performance.now() - reindexStart;

            const callerDocument = await vscode.workspace.openTextDocument(scenario.callerUri);
            const definitionStart = performance.now();
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                scenario.callerUri,
                getTextPosition(callerDocument, 'of_begin'),
            );
            const definitionMs = performance.now() - definitionStart;

            const workspaceSymbolsStart = performance.now();
            const workspaceSymbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeWorkspaceSymbolProvider',
                'of_begin',
            );
            const workspaceSymbolsMs = performance.now() - workspaceSymbolsStart;

            const indexedIncludedFiles = scenario.includedUris.filter(uri =>
                index.getSymbolsForFile(uri).length > 0,
            ).length;

            const indexedExcludedFiles = scenario.excludedUris.filter(uri =>
                index.getSymbolsForFile(uri).length > 0,
            ).length;

            const indexedProjectFiles = scenario.projectUris.filter(uri =>
                PbLibraryGraph.getInstance().getProject(uri) !== undefined,
            ).length;

            assert.ok(locations);
            assert.strictEqual(locations!.length, 0);
            assert.ok(workspaceSymbols);
            assert.ok(workspaceSymbols!.length > 0);
            assert.strictEqual(indexedIncludedFiles, scenario.includedUris.length);
            assert.strictEqual(indexedExcludedFiles, 0);
            assert.strictEqual(indexedProjectFiles, scenario.projectUris.length);

            console.log(
                `[PFC workspace benchmark] projects=${scenario.projectUris.length} includedFiles=${indexedIncludedFiles} excludedFiles=${scenario.excludedUris.length} reindex=${reindexMs.toFixed(2)}ms definition=${definitionMs.toFixed(2)}ms workspaceSymbols=${workspaceSymbolsMs.toFixed(2)}ms/${workspaceSymbols!.length} symbols=${index.symbolCount}`,
            );
        } finally {
            await config.update(
                'indexing.exclude',
                previousExcludes,
                vscode.ConfigurationTarget.Workspace,
            );
            await removeWorkspaceScenario(baseRelativePath);
            await delay(100);
        }
    });
});