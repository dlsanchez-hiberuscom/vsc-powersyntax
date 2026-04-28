import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { buildPowerScriptDocumentModel } from '../../powerbuilder/document/powerScriptDocumentModel';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { providePowerScriptCodeLenses } from '../../powerbuilder/semantic/pbPowerScriptCodeLens';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';

const CODELENS_SCENARIO_ROOT = path.join('.tmp-test-scenarios', 'pb-powerscript-codelens');
const CODELENS_BASE_TYPE = 'w_pb_codelens_base';
const CODELENS_CHILD_TYPE = 'w_pb_codelens_child';
const CODELENS_SIBLING_TYPE = 'w_pb_codelens_sibling';
const CODELENS_CALLABLE = 'of_pb_codelens_ping';

async function writeWorkspaceScenario(
    baseRelativePath: string,
    files: Record<string, string>,
): Promise<Record<string, vscode.Uri>> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for CodeLens tests');

    const uris: Record<string, vscode.Uri> = {};

    for (const [relativePath, content] of Object.entries(files)) {
        const absolutePath = path.join(
            workspaceFolder.uri.fsPath,
            CODELENS_SCENARIO_ROOT,
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
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for CodeLens tests');

    try {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    } catch {
        // Ignorar hosts sin UI completa durante el cleanup.
    }

    try {
        await fs.rm(
            path.join(workspaceFolder.uri.fsPath, CODELENS_SCENARIO_ROOT, baseRelativePath),
            { recursive: true, force: true },
        );
    } catch {
        // Ignorar locks transitorios del host de tests.
    }

    PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
    SymbolIndex.getInstance().clear();
    PbLibraryGraph.getInstance().clear();
}

suite('PbPowerScriptCodeLens', () => {
    setup(() => {
        SymbolIndex.getInstance().clear();
        PbLibraryGraph.getInstance().clear();
        PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
    });

    test('expone una lente de referencias para callables PowerScript sin duplicar forward prototypes', async () => {
        const baseRelativePath = path.join('phase6-generated', 'pb-powerscript-codelens-references');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_service.sru': [
                    'forward',
                    'global type n_service from nonvisualobject',
                    'end type',
                    'end forward',
                    '',
                    'global type n_service from nonvisualobject',
                    'end type',
                    '',
                    'forward prototypes',
                    'public function long of_run ()',
                    'end prototypes',
                    '',
                    'public function long of_run ();',
                    'return 1',
                    'end function',
                    '',
                    'event open;',
                    'this.of_run()',
                    'this.of_run()',
                    'end event',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['n_service.sru']);

            buildPowerScriptDocumentModel(document);
            SymbolIndex.getInstance().indexDocument(document);

            const lenses = await providePowerScriptCodeLenses(document);
            const referenceLenses = lenses.filter(lens => lens.command?.command === 'editor.action.showReferences');
            const implementationLens = referenceLenses.find(lens => lens.range.start.line === 12);

            assert.ok(implementationLens, 'Expected a references CodeLens on the implementation of of_run');
            assert.ok((implementationLens?.command?.title ?? '').includes('referencia'));
            assert.strictEqual(referenceLenses.filter(lens => lens.range.start.line === 9).length, 0);
            assert.strictEqual(implementationLens?.command?.arguments?.length, 3);
            assert.ok((implementationLens?.command?.arguments?.[2]?.length ?? 0) >= 1);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('expone lentes de herencia para overrides hijos y derivaciones directas', async () => {
        const baseRelativePath = path.join('phase6-generated', 'pb-powerscript-codelens-inheritance');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_base.srw': [
                    `global type ${CODELENS_BASE_TYPE} from window`,
                    'end type',
                    `global ${CODELENS_BASE_TYPE} ${CODELENS_BASE_TYPE}`,
                    '',
                    `public function long ${CODELENS_CALLABLE} ();`,
                    'return 1',
                    'end function',
                ].join('\n'),
                'w_child.srw': [
                    `global type ${CODELENS_CHILD_TYPE} from ${CODELENS_BASE_TYPE}`,
                    'end type',
                    `global ${CODELENS_CHILD_TYPE} ${CODELENS_CHILD_TYPE}`,
                    '',
                    `public function long ${CODELENS_CALLABLE} ();`,
                    'return 2',
                    'end function',
                ].join('\n'),
                'w_other.srw': [
                    `global type ${CODELENS_SIBLING_TYPE} from ${CODELENS_BASE_TYPE}`,
                    'end type',
                    `global ${CODELENS_SIBLING_TYPE} ${CODELENS_SIBLING_TYPE}`,
                    '',
                    `public function long ${CODELENS_CALLABLE} ();`,
                    'return 3',
                    'end function',
                ].join('\n'),
            });

            const baseDocument = await vscode.workspace.openTextDocument(uris['w_base.srw']);
            const childDocument = await vscode.workspace.openTextDocument(uris['w_child.srw']);
            const otherDocument = await vscode.workspace.openTextDocument(uris['w_other.srw']);

            buildPowerScriptDocumentModel(baseDocument);
            buildPowerScriptDocumentModel(childDocument);
            buildPowerScriptDocumentModel(otherDocument);
            SymbolIndex.getInstance().indexDocument(baseDocument);
            SymbolIndex.getInstance().indexDocument(childDocument);
            SymbolIndex.getInstance().indexDocument(otherDocument);

            const baseLenses = await providePowerScriptCodeLenses(baseDocument);
            const childLenses = await providePowerScriptCodeLenses(childDocument);
            const baseTitles = baseLenses.map(lens => lens.command?.title ?? '');
            const childTitles = childLenses.map(lens => lens.command?.title ?? '');

            assert.ok(baseTitles.includes('Heredado por 2'));
            assert.ok(childTitles.includes(`Sobrescribe ${CODELENS_BASE_TYPE}.${CODELENS_CALLABLE}`));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });
});