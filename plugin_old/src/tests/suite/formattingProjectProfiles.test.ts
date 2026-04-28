import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { getDocumentFormattingConfig } from '../../features/direct-api-ide/formatting/resolveDocumentFormattingConfig';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';

function getWorkspaceRoot(): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for formatting project profile tests');
    return workspaceFolder.uri.fsPath;
}

async function writeWorkspaceScenario(
    baseRelativePath: string,
    files: Record<string, string>,
): Promise<Record<string, vscode.Uri>> {
    const workspaceRoot = getWorkspaceRoot();
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
        await fs.rm(path.join(getWorkspaceRoot(), baseRelativePath), { recursive: true, force: true });
    } catch {
        // Ignorar locks transitorios del host de tests.
    }
}

async function updateWorkspaceSetting<T>(
    section: string,
    value: T | undefined,
): Promise<void> {
    await vscode.workspace.getConfiguration().update(section, value, vscode.ConfigurationTarget.Workspace);
}

suite('FormattingProjectProfiles', () => {
    setup(() => {
        PbLibraryGraph.getInstance().clear();
    });

    teardown(async () => {
        PbLibraryGraph.getInstance().clear();
        await updateWorkspaceSetting('powerbuilder.formatting.keywordCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.statementCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.indentStyle', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.indentSize', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.continuationIndentSize', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.projectProfiles', undefined);
    });

    test('resuelve perfiles por proyecto con precedencia estable y overrides acumulativos', async () => {
        const baseRelativePath = path.join('phase6-generated', 'formatting-project-profiles-config');

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
                    'global type w_alpha from window',
                    'end type',
                    'global w_alpha w_alpha',
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
                    'global type w_beta from window',
                    'end type',
                    'global w_beta w_beta',
                ].join('\n'),
            });

            await updateWorkspaceSetting('powerbuilder.formatting.keywordCase', 'upper');
            await updateWorkspaceSetting('powerbuilder.formatting.statementCase', undefined);
            await updateWorkspaceSetting('powerbuilder.formatting.indentStyle', 'spaces');
            await updateWorkspaceSetting('powerbuilder.formatting.indentSize', 3);
            await updateWorkspaceSetting('powerbuilder.formatting.continuationIndentSize', undefined);
            await updateWorkspaceSetting('powerbuilder.formatting.projectProfiles', [
                {
                    name: 'shared-baseline',
                    projectPathGlob: '**/*.pbproj',
                    settings: {
                        indentSize: 2,
                    },
                },
                {
                    name: 'alpha-style',
                    projectName: 'alpha',
                    settings: {
                        indentStyle: 'tabs',
                        indentSize: 4,
                        keywordCase: 'lower',
                    },
                },
                {
                    name: 'alpha-last-wins',
                    projectPathGlob: '**/alpha/alpha.pbproj',
                    settings: {
                        indentSize: 5,
                    },
                },
                {
                    name: 'beta-save',
                    projectName: 'beta',
                    settings: {
                        statementCase: 'lower',
                        formatOnSave: true,
                    },
                },
            ]);

            const alphaDocument = await vscode.workspace.openTextDocument(uris['alpha/app.pbl/w_alpha.sru']);
            const betaDocument = await vscode.workspace.openTextDocument(uris['beta/app.pbl/w_beta.sru']);
            const alphaFormatting = await getDocumentFormattingConfig(alphaDocument);
            const betaFormatting = await getDocumentFormattingConfig(betaDocument);

            assert.strictEqual(alphaFormatting.indentStyle, 'tabs');
            assert.strictEqual(alphaFormatting.indentSize, 5);
            assert.strictEqual(alphaFormatting.continuationIndentSize, 5);
            assert.strictEqual(alphaFormatting.keywordCase, 'lower');
            assert.strictEqual(alphaFormatting.statementCase, 'lower');

            assert.strictEqual(betaFormatting.indentStyle, 'spaces');
            assert.strictEqual(betaFormatting.indentSize, 2);
            assert.strictEqual(betaFormatting.continuationIndentSize, 2);
            assert.strictEqual(betaFormatting.keywordCase, 'upper');
            assert.strictEqual(betaFormatting.statementCase, 'lower');
            assert.strictEqual(betaFormatting.formatOnSave, true);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('resuelve perfiles adicionales por ruta fuente y root efectiva sin romper la precedencia base', async () => {
        const baseRelativePath = path.join('phase6-generated', 'formatting-project-profiles-extra-selectors');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alphaapp"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '        <Library Path="shared.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app.pbl/w_alpha.sru': [
                    'global type w_alpha from window',
                    'end type',
                    'global w_alpha w_alpha',
                ].join('\n'),
                'alpha/shared.pbl/w_shared.sru': [
                    'global type w_shared from window',
                    'end type',
                    'global w_shared w_shared',
                ].join('\n'),
            });

            await updateWorkspaceSetting('powerbuilder.formatting.keywordCase', 'upper');
            await updateWorkspaceSetting('powerbuilder.formatting.indentStyle', 'spaces');
            await updateWorkspaceSetting('powerbuilder.formatting.indentSize', 3);
            await updateWorkspaceSetting('powerbuilder.formatting.projectProfiles', [
                {
                    name: 'alpha-base',
                    projectName: 'alpha',
                    settings: {
                        indentSize: 2,
                    },
                },
                {
                    name: 'shared-root',
                    sourceRootGlob: '**/shared.pbl',
                    settings: {
                        keywordCase: 'lower',
                        indentStyle: 'tabs',
                    },
                },
                {
                    name: 'shared-file-save',
                    sourcePathGlob: '**/w_shared.sru',
                    settings: {
                        formatOnSave: true,
                    },
                },
            ]);

            const alphaDocument = await vscode.workspace.openTextDocument(uris['alpha/app.pbl/w_alpha.sru']);
            const sharedDocument = await vscode.workspace.openTextDocument(uris['alpha/shared.pbl/w_shared.sru']);
            const alphaFormatting = await getDocumentFormattingConfig(alphaDocument);
            const sharedFormatting = await getDocumentFormattingConfig(sharedDocument);

            assert.strictEqual(alphaFormatting.indentStyle, 'spaces');
            assert.strictEqual(alphaFormatting.indentSize, 2);
            assert.strictEqual(alphaFormatting.keywordCase, 'upper');
            assert.strictEqual(alphaFormatting.formatOnSave, false);

            assert.strictEqual(sharedFormatting.indentStyle, 'tabs');
            assert.strictEqual(sharedFormatting.indentSize, 2);
            assert.strictEqual(sharedFormatting.keywordCase, 'lower');
            assert.strictEqual(sharedFormatting.statementCase, 'lower');
            assert.strictEqual(sharedFormatting.formatOnSave, true);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });
});