import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import { getSymbolContextAtPosition } from '../../core/utils/documentUtils';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { WorkspaceIndexer } from '../../powerbuilder/indexing/workspaceIndexer';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { SemanticEngine } from '../../powerbuilder/semantic/semanticEngine';
import { SemanticOccurrence } from '../../powerbuilder/semantic/semanticOccurrences';

function makeDoc(text: string, uriPath: string = 'file:///test/semantic-occurrence.sru'): vscode.TextDocument {
    const lines = text.split(/\r?\n/);
    return {
        uri: vscode.Uri.parse(uriPath),
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length,
        languageId: 'powerbuilder',
    } as unknown as vscode.TextDocument;
}

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
        position: new vscode.Position(lines.length - 1, lines[lines.length - 1].length),
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
        // Los watchers del host pueden retener locks transitorios en Windows.
    }

    PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
    SymbolIndex.getInstance().clear();
    PbLibraryGraph.getInstance().clear();
}

function toWorkspaceRelativePath(uri: vscode.Uri): string {
    return vscode.workspace.asRelativePath(uri, false).replace(/\\/g, '/');
}

function assertOccurrenceKinds(
    occurrence: SemanticOccurrence,
    expectedKinds: string[],
): void {
    const kinds = occurrence.evidence.map(evidence => evidence.kind);

    for (const expectedKind of expectedKinds) {
        assert.ok(
            kinds.includes(expectedKind as SemanticOccurrence['evidence'][number]['kind']),
            `Expected evidence kind ${expectedKind} in ${kinds.join(', ')}`,
        );
    }
}

suite('Semantic occurrences', () => {
    let index: SymbolIndex;
    let semanticEngine: SemanticEngine;
    let indexer: WorkspaceIndexer;

    setup(() => {
        index = SymbolIndex.getInstance();
        index.clear();
        PbLibraryGraph.getInstance().clear();
        semanticEngine = new SemanticEngine(index);
        indexer = new WorkspaceIndexer(index);
    });

    test('findReferences devuelve evidencia exacta y prefiltro textual para símbolos scoped al callable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'semantic-occurrence-local');
        const input = extractMarkedText([
            'global type w_scope from window',
            'end type',
            'global w_scope w_scope',
            '',
            'event open;',
            'long ll_total',
            'll_total = 1',
            'MessageBox("Demo", string([[ll_total]]))',
            'end event',
        ].join('\n'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_scope.sru': input.text,
            });
            const uri = uris['w_scope.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            index.indexDocument(document);

            const context = getSymbolContextAtPosition(document, input.position);
            assert.ok(context, 'Expected local occurrence context');

            const query = await semanticEngine.findReferences(
                context!.word,
                document.uri,
                true,
                context!,
            );

            assert.strictEqual(query.occurrences.length, 3);

            const declaration = query.occurrences.find(occurrence => occurrence.isDeclaration);
            assert.ok(declaration, 'Expected declaration occurrence');
            assertOccurrenceKinds(declaration!, ['declaration', 'symbol-family', 'callable-scope']);
            assert.ok(declaration!.evidence.every(evidence => evidence.precision !== 'heuristic'));

            const usages = query.occurrences.filter(occurrence => !occurrence.isDeclaration);
            assert.strictEqual(usages.length, 2);

            for (const occurrence of usages) {
                assertOccurrenceKinds(occurrence, ['text-prefilter', 'symbol-family', 'callable-scope']);
                assert.ok(occurrence.evidence.some(evidence => evidence.precision === 'heuristic'));
                assert.ok(occurrence.evidence.some(evidence => evidence.precision === 'exact'));
            }
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('planRename reutiliza ocurrencias semánticas y respeta el proyecto preferido', async () => {
        const baseRelativePath = path.join('phase6-generated', 'semantic-occurrences-project-rename');
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

            assert.ok(context, 'Expected project-aware rename context');

            const plan = await semanticEngine.planRename(
                context!.word,
                callerUri,
                context!,
            );

            assert.ok(plan, 'Expected semantic rename plan');

            const relativePaths = plan!.occurrences
                .map(occurrence => toWorkspaceRelativePath(occurrence.uri))
                .sort();

            assert.deepStrictEqual(relativePaths, [
                `${baseRelativePath.replace(/\\/g, '/')}/project-a/app.pbl/w_caller.sru`,
                `${baseRelativePath.replace(/\\/g, '/')}/project-a/lib.pbl/n_service.sru`,
                `${baseRelativePath.replace(/\\/g, '/')}/project-a/lib.pbl/w_consumer.sru`,
            ].sort());

            const declaration = plan!.occurrences.find(occurrence =>
                occurrence.isDeclaration &&
                toWorkspaceRelativePath(occurrence.uri).endsWith('/project-a/lib.pbl/n_service.sru'),
            );
            const usage = plan!.occurrences.find(occurrence =>
                !occurrence.isDeclaration &&
                toWorkspaceRelativePath(occurrence.uri).endsWith('/project-a/lib.pbl/w_consumer.sru'),
            );

            assert.ok(declaration, 'Expected declaration occurrence inside preferred project');
            assert.ok(usage, 'Expected usage occurrence inside preferred project');
            assertOccurrenceKinds(declaration!, ['declaration', 'symbol-family', 'project-scope']);
            assertOccurrenceKinds(usage!, ['text-prefilter', 'symbol-family', 'project-scope']);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });
});