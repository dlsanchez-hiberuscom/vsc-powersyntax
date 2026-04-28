import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';
import * as vscode from 'vscode';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { PowerBuilderArtifactWorkspaceService } from '../../powerbuilder/exports/powerBuilderArtifactWorkspaceService';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { PowerBuilderProjectRegistry } from '../../powerbuilder/workspace/projectRegistry';
import { W_MASTER_FIXTURE } from '../fixtures/pfc2025/w_master.fixture';
import { N_TR_FIXTURE } from '../fixtures/pfc2025/n_tr.fixture';
import { M_RTEFRAME_FIXTURE } from '../fixtures/pfc2025/m_rteframe.fixture';

interface ArtifactBenchmarkCorpus {
    projectUri: vscode.Uri;
    sourceUri: vscode.Uri;
    refreshUri: vscode.Uri;
}

async function removeGeneratedArtifactFiles(uris: readonly vscode.Uri[]): Promise<void> {
    await Promise.all(
        [...new Set(uris.map(uri => uri.toString()))]
            .map(uri => vscode.Uri.parse(uri))
            .map(async uri => {
                await fs.rm(uri.fsPath, { force: true });
            }),
    );
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
        '    <Application Name="artifact-benchmark"/>',
        `    <Libraries AppEntry="${toProjectRelative(appEntry)}">`,
        libraryEntries,
        '    </Libraries>',
        '</Project>',
    ].join('\n');
}

async function buildArtifactBenchmarkCorpus(
    baseDirectory: string,
    projectName: string,
    copiesPerFixture: number,
): Promise<ArtifactBenchmarkCorpus> {
    const projectDirectory = path.join(baseDirectory, projectName);
    const appRoot = path.join(projectDirectory, 'app.pbl');
    const utilRoot = path.join(projectDirectory, 'util.pbl');

    await fs.mkdir(appRoot, { recursive: true });
    await fs.mkdir(utilRoot, { recursive: true });

    const sourceUri = vscode.Uri.file(path.join(appRoot, 'n_artifact_service.sru'));
    const refreshUri = vscode.Uri.file(path.join(utilRoot, 'u_refresh_target.sru'));
    const projectUri = vscode.Uri.file(path.join(projectDirectory, `${projectName}.pbproj`));

    await fs.writeFile(
        sourceUri.fsPath,
        [
            'forward',
            'global type n_artifact_service from nonvisualobject',
            'end type',
            'end forward',
            '',
            'global type n_artifact_service from nonvisualobject',
            'end type',
            'global n_artifact_service n_artifact_service',
            '',
            'public function long of_helper ();',
            'return 1',
            'end function',
            '',
            'public function long of_entry ();',
            'return this.of_helper()',
            'end function',
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

    await fs.writeFile(
        projectUri.fsPath,
        createProjectText(projectDirectory, appRoot, [appRoot, utilRoot]),
        'utf8',
    );

    return {
        projectUri,
        sourceUri,
        refreshUri,
    };
}

suite('Artifact export benchmarks', () => {
    setup(() => {
        SymbolIndex.getInstance().clear();
        PbLibraryGraph.getInstance().clear();
        PowerBuilderProjectRegistry.getInstance().clear();
    });

    test('mide exportes grandes, reutilizacion cacheada e invalidacion sobre artefactos versionables', async function () {
        this.timeout(60000);

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        assert.ok(workspaceFolder, 'Expected workspace folder');

        const benchmarkRoot = path.join(
            workspaceFolder.uri.fsPath,
            'phase6-generated',
            'benchmarks',
            'artifact-exports',
        );
        const corpus = await buildArtifactBenchmarkCorpus(benchmarkRoot, 'artifact_benchmark', 12);
        const artifactService = new PowerBuilderArtifactWorkspaceService();
        const generatedArtifactUris: vscode.Uri[] = [];

        try {
            const sourceDocument = await vscode.workspace.openTextDocument(corpus.sourceUri);

            const semanticProjectStart = performance.now();
            const firstSemanticProject = await artifactService.generateSemanticProjectExport(sourceDocument);
            const semanticProjectMs = performance.now() - semanticProjectStart;

            assert.strictEqual(firstSemanticProject.kind, 'generated');
            generatedArtifactUris.push(firstSemanticProject.file.uri);

            const cachedSemanticProjectStart = performance.now();
            const cachedSemanticProject = await artifactService.generateSemanticProjectExport(sourceDocument);
            const cachedSemanticProjectMs = performance.now() - cachedSemanticProjectStart;

            assert.strictEqual(cachedSemanticProject.kind, 'generated');
            assert.strictEqual(cachedSemanticProject.payload.generatedAt, firstSemanticProject.payload.generatedAt);

            const workspaceManifestStart = performance.now();
            const firstWorkspaceManifest = await artifactService.generateWorkspaceManifestExport(corpus.sourceUri);
            const workspaceManifestMs = performance.now() - workspaceManifestStart;
            generatedArtifactUris.push(firstWorkspaceManifest.file.uri);

            const cachedWorkspaceManifestStart = performance.now();
            const cachedWorkspaceManifest = await artifactService.generateWorkspaceManifestExport(corpus.sourceUri);
            const cachedWorkspaceManifestMs = performance.now() - cachedWorkspaceManifestStart;

            assert.strictEqual(cachedWorkspaceManifest.payload.generatedAt, firstWorkspaceManifest.payload.generatedAt);

            const scriptGraphStart = performance.now();
            const firstScriptGraph = await artifactService.generateScriptDependencyGraphExport(sourceDocument);
            const scriptGraphMs = performance.now() - scriptGraphStart;

            assert.strictEqual(firstScriptGraph.kind, 'generated');
            generatedArtifactUris.push(firstScriptGraph.file.uri);

            const cachedScriptGraphStart = performance.now();
            const cachedScriptGraph = await artifactService.generateScriptDependencyGraphExport(sourceDocument);
            const cachedScriptGraphMs = performance.now() - cachedScriptGraphStart;

            assert.strictEqual(cachedScriptGraph.kind, 'generated');
            assert.strictEqual(cachedScriptGraph.payload.generatedAt, firstScriptGraph.payload.generatedAt);

            const baselineSnapshotUri = vscode.Uri.file(path.join(benchmarkRoot, 'artifact_benchmark.before.semantic-project.json'));
            await fs.writeFile(
                baselineSnapshotUri.fsPath,
                JSON.stringify(firstSemanticProject.payload, null, 2),
                'utf8',
            );

            await fs.writeFile(
                corpus.refreshUri.fsPath,
                [
                    'global type u_refresh_target_refreshed from userobject',
                    'end type',
                    'global u_refresh_target_refreshed u_refresh_target_refreshed',
                ].join('\n'),
                'utf8',
            );

            const invalidatedSemanticProjectStart = performance.now();
            const invalidatedSemanticProject = await artifactService.generateSemanticProjectExport(sourceDocument);
            const invalidatedSemanticProjectMs = performance.now() - invalidatedSemanticProjectStart;

            assert.strictEqual(invalidatedSemanticProject.kind, 'generated');
            assert.notStrictEqual(invalidatedSemanticProject.payload.generatedAt, firstSemanticProject.payload.generatedAt);

            const semanticDiffStart = performance.now();
            const semanticDiff = await artifactService.generateSemanticSnapshotDiffExport(
                baselineSnapshotUri,
                invalidatedSemanticProject.file.uri,
                corpus.sourceUri,
            );
            const semanticDiffMs = performance.now() - semanticDiffStart;

            assert.strictEqual(semanticDiff.kind, 'generated');
            assert.ok(semanticDiff.payload.summary.changedFiles >= 1 || semanticDiff.payload.summary.changedSymbols >= 1);
            if (semanticDiff.kind === 'generated') {
                generatedArtifactUris.push(semanticDiff.file.uri);
            }

            console.log(
                `[Artifact export benchmark] files=${invalidatedSemanticProject.payload.summary.fileCount} symbols=${invalidatedSemanticProject.payload.summary.symbolCount} semanticProject=${semanticProjectMs.toFixed(2)}ms cachedSemanticProject=${cachedSemanticProjectMs.toFixed(2)}ms invalidatedSemanticProject=${invalidatedSemanticProjectMs.toFixed(2)}ms workspaceManifest=${workspaceManifestMs.toFixed(2)}ms cachedWorkspaceManifest=${cachedWorkspaceManifestMs.toFixed(2)}ms scriptGraph=${scriptGraphMs.toFixed(2)}ms cachedScriptGraph=${cachedScriptGraphMs.toFixed(2)}ms semanticDiff=${semanticDiffMs.toFixed(2)}ms changedFiles=${semanticDiff.payload.summary.changedFiles}`,
            );
        } finally {
            await removeGeneratedArtifactFiles(generatedArtifactUris);
            await fs.rm(benchmarkRoot, { recursive: true, force: true });
        }
    });
});