import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { registerFormatting } from '../../features/direct-api-ide/formatting/registerFormatting';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';

function getWorkspaceTestRoot(): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for formatting integration tests');
    return workspaceFolder!.uri.fsPath;
}

async function writeWorkspaceScenario(
    baseRelativePath: string,
    files: Record<string, string>,
): Promise<Record<string, vscode.Uri>> {
    const workspaceRoot = getWorkspaceTestRoot();
    const uris: Record<string, vscode.Uri> = {};

    for (const [relativePath, content] of Object.entries(files)) {
        const absolutePath = path.join(workspaceRoot, baseRelativePath, relativePath);

        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, content, 'utf8');
        uris[relativePath] = vscode.Uri.file(absolutePath);
    }

    return uris;
}

async function removeWorkspaceScenario(baseRelativePath: string): Promise<void> {
    try {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await fs.rm(path.join(getWorkspaceTestRoot(), baseRelativePath), { recursive: true, force: true });
    } catch {
        // Ignorar locks transitorios del host de tests.
    }
}

async function applyDocumentEdits(
    uri: vscode.Uri,
    edits: readonly vscode.TextEdit[],
): Promise<void> {
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.set(uri, edits);
    await vscode.workspace.applyEdit(workspaceEdit);
}

async function updateWorkspaceSetting<T>(
    section: string,
    value: T | undefined,
): Promise<void> {
    await vscode.workspace.getConfiguration().update(section, value, vscode.ConfigurationTarget.Workspace);
}

suite('FormattingProviderIntegration', () => {
    const extensionId = 'lopez.almunia-powersyntax';
    let disposables: vscode.Disposable[] = [];

    setup(() => {
        PbLibraryGraph.getInstance().clear();
        disposables = registerFormatting({} as vscode.ExtensionContext);
    });

    teardown(async () => {
        for (const disposable of disposables) {
            disposable.dispose();
        }

        PbLibraryGraph.getInstance().clear();

        await updateWorkspaceSetting('powerbuilder.formatting.keywordCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.statementCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.typeCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.eventKeywordCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.upperCaseKeywords', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.formatOnSave', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.formatOnType', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.formatRange', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.projectProfiles', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.spaceAfterComma', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.spaceAroundOperators', undefined);
        await updateWorkspaceSetting('editor.formatOnSave', undefined);
        await updateWorkspaceSetting('[powerbuilder]', undefined);
    });

    test('mantiene compatibilidad con upperCaseKeywords heredado', async () => {
        const baseRelativePath = path.join('phase6-generated', 'formatting-legacy-setting');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'legacy_setting.sru': [
                    'event open;',
                    'if 1 = 1 then',
                    'messagebox("Hola", "Mundo")',
                    'end if',
                    'end event',
                ].join('\n'),
            });

            await updateWorkspaceSetting('powerbuilder.formatting.keywordCase', undefined);
            await updateWorkspaceSetting('powerbuilder.formatting.upperCaseKeywords', true);

            const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatDocumentProvider',
                uris['legacy_setting.sru'],
                { insertSpaces: true, tabSize: 3 },
            );

            assert.ok(edits);
            assert.strictEqual(edits!.length, 1);
            assert.ok(edits![0].newText.includes('IF 1 = 1 THEN'));
            assert.ok(edits![0].newText.includes('MessageBox("Hola", "Mundo")'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('usa el mismo pipeline en formateo manual y al guardar', async () => {
        const baseRelativePath = path.join('phase6-generated', 'formatting-manual-vs-save');

        try {
            const source = [
                'event open;',
                'if 1 = 1 then',
                'messagebox("Hola", "Mundo")',
                'else',
                'messagebox("Adios", "Mundo")',
                'end if',
                'end event',
            ].join('\n');
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'manual_format.sru': source,
                'save_format.sru': source,
            });

            await updateWorkspaceSetting('powerbuilder.formatting.keywordCase', 'upper');
            await updateWorkspaceSetting('editor.formatOnSave', true);
            await updateWorkspaceSetting('[powerbuilder]', {
                'editor.defaultFormatter': extensionId,
                'editor.formatOnSave': true,
            });

            const manualDocument = await vscode.workspace.openTextDocument(uris['manual_format.sru']);
            const manualEdits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatDocumentProvider',
                uris['manual_format.sru'],
                { insertSpaces: true, tabSize: 3 },
            );

            assert.ok(manualEdits);
            await applyDocumentEdits(uris['manual_format.sru'], manualEdits ?? []);
            const manualResult = manualDocument.getText();

            const saveDocument = await vscode.workspace.openTextDocument(uris['save_format.sru']);
            const saveEditor = await vscode.window.showTextDocument(saveDocument);

            await saveEditor.edit(editBuilder => {
                const firstLine = saveEditor.document.lineAt(0);
                editBuilder.insert(new vscode.Position(0, firstLine.text.length), '   ');
            });

            await saveEditor.document.save();

            assert.strictEqual(saveEditor.document.getText(), manualResult);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('formatea un rango completo de líneas usando el mismo motor compartido', async () => {
        const baseRelativePath = path.join('phase6-generated', 'formatting-range-provider');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'range_format.sru': [
                    'event open;',
                    'if 1 = 1 then',
                    'messagebox(ls_title,li_total)',
                    'else',
                    'return',
                    'end if',
                    'end event',
                ].join('\n'),
            });

            await updateWorkspaceSetting('powerbuilder.formatting.statementCase', 'upper');
            await updateWorkspaceSetting('powerbuilder.formatting.formatRange', true);

            const range = new vscode.Range(1, 0, 6, 0);
            const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatRangeProvider',
                uris['range_format.sru'],
                range,
                { insertSpaces: true, tabSize: 3 },
            );

            assert.ok(edits);
            assert.strictEqual(edits!.length, 1);

            const document = await vscode.workspace.openTextDocument(uris['range_format.sru']);
            await applyDocumentEdits(uris['range_format.sru'], edits ?? []);

            assert.strictEqual(document.getText(), [
                'event open;',
                'IF 1 = 1 THEN',
                '   MessageBox(ls_title, li_total)',
                'ELSE',
                '   RETURN',
                'END IF',
                'end event',
            ].join('\n'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('formatea la línea activa on-type cuando el trigger es seguro', async () => {
        const baseRelativePath = path.join('phase6-generated', 'formatting-on-type-provider');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'on_type_format.sru': [
                    'event open;',
                    'if 1 = 1 then',
                    'messagebox(ls_title,li_total)',
                    'end if',
                    'end event',
                ].join('\n'),
            });

            await updateWorkspaceSetting('powerbuilder.formatting.formatOnType', true);

            const document = await vscode.workspace.openTextDocument(uris['on_type_format.sru']);
            const line = document.lineAt(2);
            const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatOnTypeProvider',
                uris['on_type_format.sru'],
                new vscode.Position(2, line.text.length),
                ')',
                { insertSpaces: true, tabSize: 3 },
            );

            assert.ok(edits);
            assert.ok((edits?.length ?? 0) > 0);

            await applyDocumentEdits(uris['on_type_format.sru'], edits ?? []);

            assert.strictEqual(document.lineAt(2).text, '   MessageBox(ls_title, li_total)');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('aplica formatOnSave propio del formatter aunque editor.formatOnSave esté desactivado', async () => {
        const baseRelativePath = path.join('phase6-generated', 'formatting-extension-save');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'extension_save.sru': [
                    'event open;',
                    'if 1 = 1 then',
                    'messagebox("Hola", "Mundo")',
                    'end if',
                    'end event',
                ].join('\n'),
            });

            await updateWorkspaceSetting('powerbuilder.formatting.formatOnSave', true);
            await updateWorkspaceSetting('powerbuilder.formatting.statementCase', 'upper');
            await updateWorkspaceSetting('editor.formatOnSave', false);

            const saveDocument = await vscode.workspace.openTextDocument(uris['extension_save.sru']);
            const saveEditor = await vscode.window.showTextDocument(saveDocument);

            await saveEditor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(2, saveEditor.document.lineAt(2).text.length), '   ');
            });

            await saveEditor.document.save();

            assert.strictEqual(saveEditor.document.getText(), [
                'event open;',
                'IF 1 = 1 THEN',
                '   MessageBox("Hola", "Mundo")',
                'END IF',
                'end event',
            ].join('\n'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('aplica perfiles por proyecto al formateo manual y por rango sin duplicar logica en el provider', async () => {
        const baseRelativePath = path.join('phase6-generated', 'formatting-project-profiles-provider');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alphaapp"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app.pbl/w_alpha.sru': [
                    'event open;',
                    'if 1 = 1 then',
                    'messagebox(ls_title,li_total)',
                    'end if',
                    'end event',
                ].join('\n'),
                'beta/beta.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="betaapp"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'beta/app.pbl/w_beta.sru': [
                    'event open;',
                    'if 1 = 1 then',
                    'messagebox(ls_title,li_total)',
                    'end if',
                    'end event',
                ].join('\n'),
            });

            await updateWorkspaceSetting('powerbuilder.formatting.statementCase', 'upper');
            await updateWorkspaceSetting('powerbuilder.formatting.projectProfiles', [
                {
                    projectName: 'alpha',
                    settings: {
                        statementCase: 'lower',
                        indentStyle: 'tabs',
                        indentSize: 4,
                    },
                },
                {
                    projectName: 'beta',
                    settings: {
                        statementCase: 'upper',
                        indentStyle: 'spaces',
                        indentSize: 2,
                    },
                },
            ]);

            const alphaDocumentEdits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatDocumentProvider',
                uris['alpha/app.pbl/w_alpha.sru'],
                { insertSpaces: true, tabSize: 3 },
            );
            const betaRangeEdits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatRangeProvider',
                uris['beta/app.pbl/w_beta.sru'],
                new vscode.Range(1, 0, 4, 0),
                { insertSpaces: true, tabSize: 3 },
            );

            assert.ok(alphaDocumentEdits);
            assert.ok(betaRangeEdits);

            const alphaDocument = await vscode.workspace.openTextDocument(uris['alpha/app.pbl/w_alpha.sru']);
            const betaDocument = await vscode.workspace.openTextDocument(uris['beta/app.pbl/w_beta.sru']);

            await applyDocumentEdits(uris['alpha/app.pbl/w_alpha.sru'], alphaDocumentEdits ?? []);
            await applyDocumentEdits(uris['beta/app.pbl/w_beta.sru'], betaRangeEdits ?? []);

            assert.strictEqual(alphaDocument.getText(), [
                'event open;',
                'if 1 = 1 then',
                '\tMessageBox(ls_title, li_total)',
                'end if',
                'end event',
            ].join('\n'));
            assert.strictEqual(betaDocument.getText(), [
                'event open;',
                'IF 1 = 1 THEN',
                '  MessageBox(ls_title, li_total)',
                'END IF',
                'end event',
            ].join('\n'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('aplica perfiles por proyecto en on-type y on-save', async () => {
        const baseRelativePath = path.join('phase6-generated', 'formatting-project-profiles-save');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'gamma/gamma.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="gammaapp"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'gamma/app.pbl/w_gamma.sru': [
                    'event open;',
                    'if 1 = 1 then',
                    'messagebox(ls_title,li_total)',
                    'end if',
                    'end event',
                ].join('\n'),
            });

            await updateWorkspaceSetting('powerbuilder.formatting.projectProfiles', [
                {
                    projectName: 'gamma',
                    settings: {
                        formatOnType: true,
                        formatOnSave: true,
                        statementCase: 'lower',
                        indentStyle: 'tabs',
                        indentSize: 4,
                    },
                },
            ]);

            const document = await vscode.workspace.openTextDocument(uris['gamma/app.pbl/w_gamma.sru']);
            const line = document.lineAt(2);
            const onTypeEdits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatOnTypeProvider',
                uris['gamma/app.pbl/w_gamma.sru'],
                new vscode.Position(2, line.text.length),
                ')',
                { insertSpaces: true, tabSize: 3 },
            );

            assert.ok(onTypeEdits);
            await applyDocumentEdits(uris['gamma/app.pbl/w_gamma.sru'], onTypeEdits ?? []);
            assert.strictEqual(document.lineAt(2).text, '\tMessageBox(ls_title, li_total)');

            const editor = await vscode.window.showTextDocument(document);
            await editor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(2, editor.document.lineAt(2).text.length), '   ');
            });

            await editor.document.save();

            assert.strictEqual(editor.document.getText(), [
                'event open;',
                'if 1 = 1 then',
                '\tMessageBox(ls_title, li_total)',
                'end if',
                'end event',
            ].join('\n'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('aplica perfiles adicionales por ruta fuente y root efectiva en el provider real', async () => {
        const baseRelativePath = path.join('phase6-generated', 'formatting-project-profiles-extra-provider');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'gamma/gamma.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="gammaapp"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '        <Library Path="shared.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'gamma/app.pbl/w_gamma.sru': [
                    'event open;',
                    'if 1 = 1 then',
                    'messagebox(ls_title,li_total)',
                    'end if',
                    'end event',
                ].join('\n'),
                'gamma/shared.pbl/w_gamma_shared.sru': [
                    'event open;',
                    'if 1 = 1 then',
                    'messagebox(ls_title,li_total)',
                    'end if',
                    'end event',
                ].join('\n'),
            });

            await updateWorkspaceSetting('powerbuilder.formatting.statementCase', 'upper');
            await updateWorkspaceSetting('powerbuilder.formatting.projectProfiles', [
                {
                    projectName: 'gamma',
                    settings: {
                        statementCase: 'upper',
                        indentStyle: 'spaces',
                        indentSize: 2,
                    },
                },
                {
                    sourceRootGlob: '**/shared.pbl',
                    settings: {
                        statementCase: 'lower',
                        indentStyle: 'tabs',
                    },
                },
                {
                    sourcePathGlob: '**/w_gamma_shared.sru',
                    settings: {
                        formatOnSave: true,
                    },
                },
            ]);

            const baseEdits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatDocumentProvider',
                uris['gamma/app.pbl/w_gamma.sru'],
                { insertSpaces: true, tabSize: 3 },
            );
            const sharedEdits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatDocumentProvider',
                uris['gamma/shared.pbl/w_gamma_shared.sru'],
                { insertSpaces: true, tabSize: 3 },
            );

            assert.ok(baseEdits);
            assert.ok(sharedEdits);

            const baseDocument = await vscode.workspace.openTextDocument(uris['gamma/app.pbl/w_gamma.sru']);
            const sharedDocument = await vscode.workspace.openTextDocument(uris['gamma/shared.pbl/w_gamma_shared.sru']);

            await applyDocumentEdits(uris['gamma/app.pbl/w_gamma.sru'], baseEdits ?? []);
            await applyDocumentEdits(uris['gamma/shared.pbl/w_gamma_shared.sru'], sharedEdits ?? []);

            assert.strictEqual(baseDocument.getText(), [
                'event open;',
                'IF 1 = 1 THEN',
                '  MessageBox(ls_title, li_total)',
                'END IF',
                'end event',
            ].join('\n'));
            assert.strictEqual(sharedDocument.getText(), [
                'event open;',
                'if 1 = 1 then',
                '\tMessageBox(ls_title, li_total)',
                'end if',
                'end event',
            ].join('\n'));

            const sharedEditor = await vscode.window.showTextDocument(sharedDocument);
            await sharedEditor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(2, sharedEditor.document.lineAt(2).text.length), '   ');
            });

            await sharedEditor.document.save();

            assert.strictEqual(sharedEditor.document.getText(), [
                'event open;',
                'if 1 = 1 then',
                '\tMessageBox(ls_title, li_total)',
                'end if',
                'end event',
            ].join('\n'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });
});