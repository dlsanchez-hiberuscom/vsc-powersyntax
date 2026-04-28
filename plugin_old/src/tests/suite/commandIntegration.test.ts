import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PassThrough } from 'stream';
import * as vscode from 'vscode';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import { PB_USER_MESSAGES } from '../../core/i18n/pbUserMessages';
import {
    getPublicContractSchemaDescriptor,
    validatePublicContractPayload,
} from '../../powerbuilder/contracts/publicContractSchemas';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { WorkspaceIndexer } from '../../powerbuilder/indexing/workspaceIndexer';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { getInheritanceGraph } from '../../powerbuilder/semantic/inheritanceGraph';
import { pbAutoBuildProcessAdapter } from '../../powerbuilder/build/pbAutoBuildService';
import { PowerBuilderProjectRegistry } from '../../powerbuilder/workspace/projectRegistry';

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
        PowerBuilderProjectRegistry.getInstance().clear();
    }

    try {
        await vscode.workspace.fs.delete(vscode.Uri.file(scenarioPath), {
            recursive: true,
            useTrash: false,
        });
    } catch {
        // Ignorar locks transitorios del host de tests.
    }

    PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
    SymbolIndex.getInstance().clear();
    PbLibraryGraph.getInstance().clear();
    PowerBuilderProjectRegistry.getInstance().clear();
}

async function removeGeneratedDocumentation(projectName?: string): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for integration tests');

    const relativePaths = projectName
        ? [
            path.join('docs', 'generated', 'powerbuilder', 'objects', projectName),
            path.join('docs', 'generated', 'powerbuilder', 'indexes', projectName),
        ]
        : [path.join('docs', 'generated', 'powerbuilder')];

    for (const relativePath of relativePaths) {
        const absolutePath = path.join(workspaceFolder.uri.fsPath, relativePath);

        try {
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        } catch {
            // Ignorar hosts sin UI completa durante el cleanup.
        }

        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                await fs.rm(absolutePath, { recursive: true, force: true });
                break;
            } catch {
                // Reintentar tras limpiar estado compartido.
            }

            PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
            SymbolIndex.getInstance().clear();
            PbLibraryGraph.getInstance().clear();
            PowerBuilderProjectRegistry.getInstance().clear();
        }

        try {
            await vscode.workspace.fs.delete(vscode.Uri.file(absolutePath), {
                recursive: true,
                useTrash: false,
            });
        } catch {
            // Ignorar locks transitorios del host de tests.
        }
    }

    PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
    SymbolIndex.getInstance().clear();
    PbLibraryGraph.getInstance().clear();
    PowerBuilderProjectRegistry.getInstance().clear();
}

async function readWorkspaceFile(relativePath: string): Promise<string> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for integration tests');

    return fs.readFile(path.join(workspaceFolder.uri.fsPath, relativePath), 'utf8');
}

function assertPayloadMatchesPublicSchema(payload: { kind: string }): void {
    const descriptor = getPublicContractSchemaDescriptor(payload.kind);

    assert.ok(descriptor, `Expected public schema descriptor for ${payload.kind}`);

    const validation = validatePublicContractPayload(descriptor!.schema, payload);

    assert.strictEqual(
        validation.valid,
        true,
        validation.issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'),
    );
}

function getWorkspaceTestUri(relativePath: string): vscode.Uri {
    return vscode.Uri.file(
        path.join(
            vscode.workspace.workspaceFolders![0].uri.fsPath,
            relativePath,
        ),
    );
}

function getCompletionLabel(item: vscode.CompletionItem): string {
    return typeof item.label === 'string'
        ? item.label
        : item.label.label;
}

function getTextPosition(document: vscode.TextDocument, searchText: string): vscode.Position {
    const offset = document.getText().indexOf(searchText);
    assert.ok(offset >= 0, `Expected text ${searchText} in ${document.uri.fsPath}`);

    return document.positionAt(offset + searchText.length);
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getMarkdownLinkTargets(markdown: string, label: string): string[] {
    const pattern = new RegExp(`\\[${escapeRegExp(label)}\\]\\(([^)]+)\\)`, 'g');
    const targets: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(markdown)) !== null) {
        targets.push(match[1]);
    }

    return targets;
}

async function waitForActiveEditor(targetUri: vscode.Uri, timeoutMs: number = 5000): Promise<vscode.TextEditor> {
    const expectedDocumentUri = targetUri.with({ fragment: '', query: '' }).toString();
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const editor = vscode.window.activeTextEditor;

        if (editor?.document.uri.toString() === expectedDocumentUri) {
            return editor;
        }

        await new Promise(resolve => setTimeout(resolve, 50));
    }

    assert.fail(`Expected an active editor for ${targetUri.toString()}`);
}

async function openMarkdownLinkTarget(target: string): Promise<vscode.TextEditor> {
    const uri = vscode.Uri.parse(target);

    await vscode.commands.executeCommand('vscode.open', uri);
    return waitForActiveEditor(uri);
}

function replaceProperty(target: object, propertyName: string, value: unknown): () => void {
    const originalDescriptor = Object.getOwnPropertyDescriptor(target, propertyName);

    Object.defineProperty(target, propertyName, {
        configurable: true,
        writable: true,
        value,
    });

    return () => {
        if (originalDescriptor) {
            Object.defineProperty(target, propertyName, originalDescriptor);
            return;
        }

        delete (target as Record<string, unknown>)[propertyName];
    };
}

function createSpawnRestore(
    output: string,
    exitCode: number,
    onSpawn: (command: string, args: readonly string[]) => void,
): () => void {
    return replaceProperty(
        pbAutoBuildProcessAdapter,
        'spawn',
        ((command: string, args: readonly string[]) => {
            onSpawn(command, args);

            const stdout = new PassThrough();
            const stderr = new PassThrough();
            const stdin = new PassThrough();
            const listeners = new Map<string, Array<(...eventArgs: unknown[]) => void>>();

            const child = {
                stdout,
                stderr,
                stdin,
                on(eventName: string, listener: (...eventArgs: unknown[]) => void) {
                    const bucket = listeners.get(eventName) ?? [];
                    bucket.push(listener);
                    listeners.set(eventName, bucket);
                    return child;
                },
                emit(eventName: string, ...eventArgs: unknown[]) {
                    for (const listener of listeners.get(eventName) ?? []) {
                        listener(...eventArgs);
                    }
                },
            };

            queueMicrotask(() => {
                stdout.end(output);
                stderr.end();
                child.emit('close', exitCode);
            });

            return child as unknown as ReturnType<typeof pbAutoBuildProcessAdapter.spawn>;
        }) as typeof pbAutoBuildProcessAdapter.spawn,
    );
}

suite('Interactive commands and trigger integration', () => {
    setup(() => {
        SymbolIndex.getInstance().clear();
        getInheritanceGraph(SymbolIndex.getInstance()).clear();
        PbLibraryGraph.getInstance().clear();
        PowerBuilderProjectRegistry.getInstance().clear();
    });

    test('CompletionItemProvider responde al trigger . con documento real', async () => {
        const baseRelativePath = path.join('phase6-generated', 'completion-trigger-dot');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_completion_trigger.sru': [
                    'global type n_completion_trigger from nonvisualobject',
                    'end type',
                    'global n_completion_trigger n_completion_trigger',
                    '',
                    'forward prototypes',
                    'public function long of_begin ()',
                    'end prototypes',
                    '',
                    'event open;',
                    'this.',
                    'end event',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['n_completion_trigger.sru']);
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uris['n_completion_trigger.sru'],
                getTextPosition(document, 'this.'),
                '.',
            );

            assert.ok(completionList);
            assert.ok(completionList!.items.length > 0);

            const labels = completionList!.items.map(getCompletionLabel);
            assert.ok(labels.includes('of_begin'));
            assert.ok(!labels.includes('messagebox'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider responde al trigger : con documento real', async () => {
        const baseRelativePath = path.join('phase6-generated', 'completion-trigger-colon');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_base.sru': [
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'forward prototypes',
                    'public function long of_base ()',
                    'end prototypes',
                ].join('\n'),
                'w_child.sru': [
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'forward prototypes',
                    'public function long of_child ()',
                    'end prototypes',
                    '',
                    'event open;',
                    'super:',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['w_base.sru']);

            const document = await vscode.workspace.openTextDocument(uris['w_child.sru']);
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uris['w_child.sru'],
                getTextPosition(document, 'super:'),
                ':',
            );

            assert.ok(completionList);
            assert.ok(completionList!.items.length > 0);

            const labels = completionList!.items.map(getCompletionLabel);
            assert.ok(labels.includes('of_base'));
            assert.ok(!labels.includes('of_child'));
            assert.ok(!labels.includes('messagebox'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider respeta owner.POST para externas locales y no mezcla sombras locales', async () => {
        const baseRelativePath = path.join('phase6-generated', 'completion-trigger-post-local-external');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'u_external_host.sru': [
                    'global type u_external_host from nonvisualobject',
                    'end type',
                    'global u_external_host u_external_host',
                    '',
                    'public function boolean sndPlaySoundA (string as_name, uint au_flags) LIBRARY "WINMM.DLL" ALIAS FOR "sndPlaySoundA;ansi"',
                ].join('\n'),
                'w_consumer.sru': [
                    'global type w_consumer from window',
                    'end type',
                    'global w_consumer w_consumer',
                    'u_external_host inv_host',
                    '',
                    'public function long s_shadow_only ();',
                    'return 1',
                    'end function',
                    '',
                    'event open;',
                    'inv_host.POST s',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['u_external_host.sru']);

            const document = await vscode.workspace.openTextDocument(uris['w_consumer.sru']);
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uris['w_consumer.sru'],
                getTextPosition(document, 'inv_host.POST s'),
            );

            assert.ok(completionList);

            const labels = completionList!.items.map(getCompletionLabel);
            assert.ok(labels.includes('sndPlaySoundA'));
            assert.ok(!labels.includes('s_shadow_only'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider no expone completions semánticas en CALL a control de ancestro con backtick', async () => {
        const baseRelativePath = path.join('phase6-generated', 'completion-trigger-ancestor-control-call');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_child.sru': [
                    'forward',
                    'global type w_child from window',
                    'type cb_ok from commandbutton within w_child',
                    'end type',
                    'end type',
                    'end forward',
                    '',
                    'global type w_child from window',
                    'end type',
                    'global w_child w_child',
                    '',
                    'event open;',
                        'CALL w_base`cb_ok::',
                    'end event',
                    '',
                    'type cb_ok from commandbutton within w_child',
                    'end type',
                    '',
                    'event cb_ok::clicked;',
                    'return 2',
                    'end event',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['w_child.sru']);
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uris['w_child.sru'],
                getTextPosition(document, 'CALL w_base`cb_ok::'),
                ':',
            );

            assert.ok(completionList);

            const semanticProviderItems = completionList!.items.filter(item =>
                typeof item.sortText === 'string' && /^[0-3]_/.test(item.sortText),
            );

            assert.strictEqual(semanticProviderItems.length, 0);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider filtra miembros privados heredados y colapsa shared/global/instance', async () => {
        const baseRelativePath = path.join('phase6-generated', 'completion-visibility-priority');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_base.sru': [
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    'privatewrite string is_hidden',
                    'protectedread string is_title',
                ].join('\n'),
                'w_child.sru': [
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    'shared string is_state',
                    'global string is_state',
                    'string is_state',
                    '',
                    'event open;',
                    'is_',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['w_base.sru']);

            const document = await vscode.workspace.openTextDocument(uris['w_child.sru']);
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uris['w_child.sru'],
                getTextPosition(document, 'is_'),
            );

            assert.ok(completionList);

            const labels = completionList!.items.map(getCompletionLabel);
            assert.strictEqual(labels.filter(label => label === 'is_state').length, 1);
            assert.ok(labels.includes('is_title'));
            assert.ok(!labels.includes('is_hidden'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider prioriza ancestorclass: frente a variable homónima', async () => {
        const baseRelativePath = path.join('phase6-generated', 'completion-trigger-ancestorclass');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_base.sru': [
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'forward prototypes',
                    'public function long of_base_ancestor ()',
                    'end prototypes',
                ].join('\n'),
                'n_shadow_service.sru': [
                    'global type n_shadow_service from nonvisualobject',
                    'end type',
                    'global n_shadow_service n_shadow_service',
                    '',
                    'forward prototypes',
                    'public function long of_shadow_worker ()',
                    'end prototypes',
                ].join('\n'),
                'w_child.sru': [
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    'n_shadow_service w_base',
                    '',
                    'event open;',
                    'w_base:',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['w_base.sru']);
            await indexer.indexFile(uris['n_shadow_service.sru']);

            const document = await vscode.workspace.openTextDocument(uris['w_child.sru']);
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uris['w_child.sru'],
                getTextPosition(document, 'w_base:'),
                ':',
            );

            assert.ok(completionList);

            const labels = completionList!.items.map(getCompletionLabel);
            assert.ok(labels.includes('of_base_ancestor'));
            assert.ok(!labels.includes('of_shadow_worker'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider soporta owner chains, subíndices y calls intermedias con el tipo final correcto', async () => {
        const baseRelativePath = path.join('phase6-generated', 'completion-trigger-owner-chains');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_chain_service.sru': [
                    'global type n_chain_service from nonvisualobject',
                    'end type',
                    'global n_chain_service n_chain_service',
                    '',
                    'forward prototypes',
                    'public function long of_target ()',
                    'end prototypes',
                ].join('\n'),
                'n_chain_shadow.sru': [
                    'global type n_chain_shadow from nonvisualobject',
                    'end type',
                    'global n_chain_shadow n_chain_shadow',
                    '',
                    'forward prototypes',
                    'public function long of_shadow_only ()',
                    'end prototypes',
                ].join('\n'),
                'n_context.sru': [
                    'global type n_context from nonvisualobject',
                    'end type',
                    'global n_context n_context',
                    'n_chain_service inv_service',
                    'n_chain_service inv_services[]',
                    '',
                    'forward prototypes',
                    'public function n_chain_service of_service ()',
                    'end prototypes',
                ].join('\n'),
                'w_consumer.sru': [
                    'global type w_consumer from window',
                    'end type',
                    'global w_consumer w_consumer',
                    'n_context iu_context',
                    'n_chain_shadow inv_service',
                    'n_chain_shadow inv_services[]',
                    '',
                    'event open;',
                    'iu_context.inv_service.',
                    'iu_context.inv_services[1].',
                    '(iu_context.inv_service).',
                    'iu_context.of_service().',
                    '(iu_context.of_service()).',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['n_chain_service.sru']);
            await indexer.indexFile(uris['n_chain_shadow.sru']);
            await indexer.indexFile(uris['n_context.sru']);

            const document = await vscode.workspace.openTextDocument(uris['w_consumer.sru']);
            const searchTexts = [
                'iu_context.inv_service.',
                'iu_context.inv_services[1].',
                '(iu_context.inv_service).',
                'iu_context.of_service().',
                '(iu_context.of_service()).',
            ];

            for (const searchText of searchTexts) {
                const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                    'vscode.executeCompletionItemProvider',
                    uris['w_consumer.sru'],
                    getTextPosition(document, searchText),
                    '.',
                );

                assert.ok(completionList);

                const labels = completionList!.items.map(getCompletionLabel);
                assert.ok(labels.includes('of_target'), `Expected of_target for ${searchText}`);
                assert.ok(!labels.includes('of_shadow_only'), `Did not expect shadow method for ${searchText}`);
            }
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider responde al trigger :: con eventos DataWindow tipados', async () => {
        const baseRelativePath = path.join('phase6-generated', 'completion-trigger-datawindow-events');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_dw_events.srw': [
                    'forward',
                    'global type w_dw_events from window',
                    'end type',
                    'type dw_data from datawindow within w_dw_events',
                    'end type',
                    'end forward',
                    '',
                    'global type w_dw_events from window',
                    'dw_data dw_data',
                    'end type',
                    '',
                    'global w_dw_events w_dw_events',
                    '',
                    'event open;',
                    'dw_data::',
                    'end event',
                    '',
                    'type dw_data from datawindow within w_dw_events',
                    'end type',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['w_dw_events.srw']);
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uris['w_dw_events.srw'],
                getTextPosition(document, 'dw_data::'),
                ':',
            );

            assert.ok(completionList);
            assert.ok(completionList!.items.length > 0);

            const labels = completionList!.items.map(getCompletionLabel);
            assert.ok(labels.includes('ItemChanged'));
            assert.ok(labels.includes('RetrieveStart'));
            assert.ok(!labels.includes('MessageBox'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.goToSymbol navega al símbolo elegido desde QuickPick', async () => {
        const uri = getWorkspaceTestUri('sample.sru');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        await indexer.indexFile(uri);
        await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(getWorkspaceTestUri('sample.srd')));

        let quickPickItemCount = 0;

        const restoreQuickPick = replaceProperty(
            vscode.window,
            'showQuickPick',
            async (items: Array<{ symbol?: { name?: string } }> | Thenable<Array<{ symbol?: { name?: string } }>>) => {
                const resolvedItems = Array.isArray(items) ? items : await items;
                quickPickItemCount = resolvedItems.length;
                return resolvedItems.find(item => item.symbol?.name === 'wf_reset');
            },
        );

        try {
            await vscode.commands.executeCommand('powerbuilder.goToSymbol');
        } finally {
            restoreQuickPick();
        }

        assert.ok(quickPickItemCount > 0);
        assert.ok(vscode.window.activeTextEditor);
        assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'sample.sru');
        assert.ok(vscode.window.activeTextEditor!.document.getText(vscode.window.activeTextEditor!.selection).includes('wf_reset'));
    });

    test('powerbuilder.showObjectInfo informa el resumen del archivo PowerScript activo', async () => {
        const uri = getWorkspaceTestUri('sample.sru');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        await indexer.indexFile(uri);
        await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));

        const messages: string[] = [];
        const restoreInfo = replaceProperty(
            vscode.window,
            'showInformationMessage',
            async (message: string) => {
                messages.push(message);
                return undefined;
            },
        );

        try {
            await vscode.commands.executeCommand('powerbuilder.showObjectInfo');
        } finally {
            restoreInfo();
        }

        assert.strictEqual(messages.length, 1);
        assert.ok(messages[0].includes('Archivo: sample.sru'));
        assert.ok(messages[0].includes('Funciones/Subrutinas:'));
        assert.ok(messages[0].includes('Variables/Constantes:'));
    });

    test('powerbuilder.showObjectInfo informa metadata segura para DataWindow activa', async () => {
        const uri = getWorkspaceTestUri('sample.srd');

        await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));

        const messages: string[] = [];
        const warnings: string[] = [];
        const restoreInfo = replaceProperty(
            vscode.window,
            'showInformationMessage',
            async (message: string) => {
                messages.push(message);
                return undefined;
            },
        );
        const restoreWarning = replaceProperty(
            vscode.window,
            'showWarningMessage',
            async (message: string) => {
                warnings.push(message);
                return undefined;
            },
        );

        try {
            await vscode.commands.executeCommand('powerbuilder.showObjectInfo');
        } finally {
            restoreInfo();
            restoreWarning();
        }

        assert.strictEqual(warnings.length, 0);
        assert.strictEqual(messages.length, 1);
        assert.ok(messages[0].includes('Archivo: sample.srd'));
        assert.ok(messages[0].includes('DataWindow: sample'));
        assert.ok(messages[0].includes('Columnas de tabla: 4'));
    });

    test('powerbuilder.exportDataWindowManifest serializa metadata segura de la DataWindow activa en JSON versionable', async () => {
        const uri = getWorkspaceTestUri('sample.srd');

        try {
            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));
            await vscode.commands.executeCommand('powerbuilder.exportDataWindowManifest');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/datawindow/sample.datawindow-manifest.json',
            ));

            assert.strictEqual(payload.kind, 'powerbuilder-datawindow-manifest');
            assert.strictEqual(payload.document.objectName, 'sample');
            assert.deepStrictEqual(payload.bands.map((band: { name: string }) => band.name), ['header', 'summary', 'footer', 'detail']);
            assert.strictEqual(payload.summary.tableColumnCount, 4);
            assert.strictEqual(payload.summary.retrieveColumnReferenceCount, 4);
            assert.ok(payload.table.columns.every((column: { referencedInRetrieve: boolean }) => column.referencedInRetrieve));
            assert.ok(payload.table.retrieve.selectColumns.some((column: { columnName: string; linkedTableColumnName?: string }) =>
                column.columnName === 'email' && column.linkedTableColumnName === 'email',
            ));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'sample.datawindow-manifest.json');
        } finally {
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.goToSymbol usa el placeholder configurado para el QuickPick', async () => {
        const uri = getWorkspaceTestUri('sample.sru');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        await indexer.indexFile(uri);

        let capturedPlaceholder: string | undefined;

        const restoreQuickPick = replaceProperty(
            vscode.window,
            'showQuickPick',
            async (_items: unknown, options?: { placeHolder?: string }) => {
                capturedPlaceholder = options?.placeHolder;
                return undefined;
            },
        );

        try {
            await vscode.commands.executeCommand('powerbuilder.goToSymbol');
        } finally {
            restoreQuickPick();
        }

        assert.strictEqual(capturedPlaceholder, PB_USER_MESSAGES.commands.goToSymbolPlaceholder);
    });

    test('powerbuilder.semanticNavigate filtra por proyecto, owner, jerarquía y target antes de navegar', async () => {
        const baseRelativePath = path.join('phase6-generated', 'semantic-navigate-command');
        let quickPickStep = 0;
        let filterLabels: string[] = [];
        let filteredSymbolCount = 0;

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alphaapp"/>',
                    '    <Libraries AppEntry="app_alpha.pbl">',
                    '        <Library Path="app_alpha.pbl"/>',
                    '        <Library Path="../shared_alpha.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'beta/beta.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="betaapp"/>',
                    '    <Libraries AppEntry="app_beta.pbl">',
                    '        <Library Path="app_beta.pbl"/>',
                    '        <Library Path="../shared_beta.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_child.sru': [
                    'forward',
                    'global type w_child from w_base',
                    'end forward',
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'event open;',
                    'of_base()',
                    'end event',
                ].join('\n'),
                'shared_alpha.pbl/w_base.sru': [
                    'forward',
                    'global type w_base from window',
                    'end forward',
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'public function long of_base ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_peer.sru': [
                    'forward',
                    'global type w_peer from window',
                    'end forward',
                    'global type w_peer from window',
                    'end type',
                    'global w_peer w_peer',
                    '',
                    'public function string of_base ();',
                    'return "peer"',
                    'end function',
                ].join('\n'),
                'beta/app_beta.pbl/w_other.sru': [
                    'forward',
                    'global type w_other from window',
                    'end forward',
                    'global type w_other from window',
                    'end type',
                    'global w_other w_other',
                    '',
                    'public function long of_base ();',
                    'return 2',
                    'end function',
                ].join('\n'),
                'shared_beta.pbl/w_base.sru': [
                    'forward',
                    'global type w_base from window',
                    'end forward',
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['alpha/app_alpha.pbl/w_child.sru']);
            const editor = await vscode.window.showTextDocument(document);
            const position = getTextPosition(document, 'of_base');
            editor.selection = new vscode.Selection(position, position);

            const restoreQuickPick = replaceProperty(
                vscode.window,
                'showQuickPick',
                async (items: Array<{ label?: string; filterId?: string; symbol?: { name?: string; uri?: vscode.Uri } }> | Thenable<Array<{ label?: string; filterId?: string; symbol?: { name?: string; uri?: vscode.Uri } }>>, options?: { placeHolder?: string }) => {
                    const resolvedItems = Array.isArray(items) ? items : await items;

                    quickPickStep++;

                    if (quickPickStep === 1) {
                        filterLabels = resolvedItems.map(item => item.label ?? '');
                        assert.strictEqual(options?.placeHolder, PB_USER_MESSAGES.commands.semanticNavigateFilterPlaceholder);

                        return resolvedItems.filter(item =>
                            item.filterId === 'project'
                            || item.filterId === 'required-owner'
                            || item.filterId === 'strict-hierarchy'
                            || item.filterId === 'return'
                            || item.filterId === 'target',
                        );
                    }

                    filteredSymbolCount = resolvedItems.length;
                    assert.ok(resolvedItems.every(item => item.symbol?.name === 'of_base'));
                    assert.ok(resolvedItems.every(item => item.symbol?.uri?.toString() !== uris['beta/app_beta.pbl/w_other.sru'].toString()));
                    assert.ok(resolvedItems.every(item => item.symbol?.uri?.toString() !== uris['alpha/app_alpha.pbl/w_peer.sru'].toString()));

                    return resolvedItems.find(item => item.symbol?.uri?.toString() === uris['shared_alpha.pbl/w_base.sru'].toString());
                },
            );

            try {
                await vscode.commands.executeCommand('powerbuilder.semanticNavigate');
            } finally {
                restoreQuickPick();
            }

            assert.deepStrictEqual(
                filterLabels,
                [
                    'Proyecto: alpha',
                    'Owner: w_base',
                    'Owner requerido: w_base',
                    'Jerarquía: w_base',
                    'Jerarquía estricta: w_base',
                    'Retorno: long',
                    'Target: of_base',
                ],
            );
            assert.strictEqual(filteredSymbolCount, 1);
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(vscode.window.activeTextEditor!.document.uri.toString(), uris['shared_alpha.pbl/w_base.sru'].toString());
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.runSemanticQuery resuelve una query puntual reproducible con uri y posicion explicitas', async () => {
        const baseRelativePath = path.join('phase6-generated', 'run-semantic-query-command');
        const projectName = 'demo_run_query';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/n_query_service.sru': [
                    'forward',
                    'global type n_query_service from nonvisualobject',
                    'end type',
                    'end forward',
                    '',
                    'global type n_query_service from nonvisualobject',
                    'end type',
                    'global n_query_service n_query_service',
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
                    'end event',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['app.pbl/n_query_service.sru']);
            const queryOffset = document.getText().indexOf('of_run()');
            assert.ok(queryOffset >= 0, 'Expected of_run() call in run semantic query fixture');
            const position = document.positionAt(queryOffset + 2);

            await vscode.commands.executeCommand('workbench.action.closeAllEditors');

            const result = await vscode.commands.executeCommand<{
                kind: string;
                reason?: string;
                payload?: {
                    kind: string;
                    document: { word: string };
                    query: {
                        symbol: { precision: string };
                        references: {
                            plan: { occurrences: unknown[] };
                            query: { occurrences: unknown[] };
                        };
                        renameTarget: {
                            canRename: boolean;
                            plan?: { occurrences: unknown[] };
                            renameTarget?: { target: { persistentId?: string } };
                        };
                    };
                };
            }>(
                'powerbuilder.runSemanticQuery',
                {
                    uri: document.uri.toString(),
                    line: position.line,
                    character: position.character,
                },
            );

            assert.ok(result);
            assert.strictEqual(result!.kind, 'generated');
            assert.strictEqual(result!.payload?.kind, 'powerbuilder-semantic-query');
            assert.strictEqual(result!.payload?.document.word, 'of_run');
            assert.strictEqual(result!.payload?.query.symbol.precision, 'exact');
            assert.ok((result!.payload?.query.references.query.occurrences.length ?? 0) >= 2);
            assert.ok((result!.payload?.query.references.plan.occurrences.length ?? 0) >= 2);
            assert.strictEqual(result!.payload?.query.renameTarget.canRename, true);
            assert.ok((result!.payload?.query.renameTarget.plan?.occurrences.length ?? 0) >= 2);
            assert.ok(result!.payload?.query.renameTarget.renameTarget?.target.persistentId);
            assert.ok(!vscode.window.activeTextEditor);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.runOverloadResolutionExplanation devuelve la explicacion estructurada de overloads compatibles', async () => {
        const baseRelativePath = path.join('phase6-generated', 'run-overload-resolution-explanation-command');
        const projectName = 'demo_run_overload';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/n_query_service.sru': [
                    'forward',
                    'global type n_query_service from nonvisualobject',
                    'end type',
                    'end forward',
                    '',
                    'global type n_query_service from nonvisualobject',
                    'end type',
                    'global n_query_service n_query_service',
                    '',
                    'forward prototypes',
                    'public function long of_run ()',
                    'public function long of_run (string as_name, long al_id)',
                    'end prototypes',
                    '',
                    'public function long of_run ();',
                    'return 0',
                    'end function',
                    '',
                    'public function long of_run (string as_name, long al_id);',
                    'return al_id',
                    'end function',
                    '',
                    'event open;',
                    'of_run("demo", )',
                    'end event',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['app.pbl/n_query_service.sru']);
            const signatureAnchor = 'of_run("demo", ';
            const queryOffset = document.getText().indexOf(signatureAnchor);
            assert.ok(queryOffset >= 0, 'Expected overload call in run overload explanation fixture');
            const position = document.positionAt(queryOffset + signatureAnchor.length);

            await vscode.commands.executeCommand('workbench.action.closeAllEditors');

            const result = await vscode.commands.executeCommand<{
                kind: string;
                reason?: string;
                payload?: {
                    kind: string;
                    call: {
                        name: string;
                        currentParameterHasContent: boolean;
                    };
                    resolution: {
                        precision: string;
                        resolutionKind: string;
                        shouldProvideHelp: boolean;
                        candidateCount: number;
                        candidates: Array<{ signature?: string }>;
                    };
                };
            }>(
                'powerbuilder.runOverloadResolutionExplanation',
                {
                    uri: document.uri.toString(),
                    line: position.line,
                    character: position.character,
                },
            );

            assert.ok(result);
            assert.strictEqual(result!.kind, 'generated');
            assert.strictEqual(result!.payload?.kind, 'powerbuilder-overload-resolution-explanation');
            assert.strictEqual(result!.payload?.call.name, 'of_run');
            assert.strictEqual(result!.payload?.call.currentParameterHasContent, false);
            assert.strictEqual(result!.payload?.resolution.precision, 'compatible');
            assert.strictEqual(result!.payload?.resolution.resolutionKind, 'compatible-overloads');
            assert.strictEqual(result!.payload?.resolution.shouldProvideHelp, true);
            assert.strictEqual(result!.payload?.resolution.candidateCount, 2);
            assert.ok(result!.payload?.resolution.candidates.some(candidate => candidate.signature?.includes('of_run ()') || candidate.signature?.includes('of_run()')));
            assert.ok(result!.payload?.resolution.candidates.some(candidate => candidate.signature?.includes('of_run (string as_name, long al_id)') || candidate.signature?.includes('of_run(string as_name, long al_id)')));
            assertPayloadMatchesPublicSchema(result!.payload!);
            assert.ok(!vscode.window.activeTextEditor);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.runSemanticNavigate devuelve resultados estructurados filtrados sin QuickPick', async () => {
        const baseRelativePath = path.join('phase6-generated', 'run-semantic-navigate-command');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alphaapp"/>',
                    '    <Libraries AppEntry="app_alpha.pbl">',
                    '        <Library Path="app_alpha.pbl"/>',
                    '        <Library Path="../shared_alpha.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'beta/beta.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="betaapp"/>',
                    '    <Libraries AppEntry="app_beta.pbl">',
                    '        <Library Path="app_beta.pbl"/>',
                    '        <Library Path="../shared_beta.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_child.sru': [
                    'forward',
                    'global type w_child from w_base',
                    'end forward',
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'event open;',
                    'of_base()',
                    'end event',
                ].join('\n'),
                'shared_alpha.pbl/w_base.sru': [
                    'forward',
                    'global type w_base from window',
                    'end forward',
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'public function long of_base ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_peer.sru': [
                    'forward',
                    'global type w_peer from window',
                    'end forward',
                    'global type w_peer from window',
                    'end type',
                    'global w_peer w_peer',
                    '',
                    'public function string of_base ();',
                    'return "peer"',
                    'end function',
                ].join('\n'),
                'beta/app_beta.pbl/w_other.sru': [
                    'forward',
                    'global type w_other from window',
                    'end forward',
                    'global type w_other from window',
                    'end type',
                    'global w_other w_other',
                    '',
                    'public function long of_base ();',
                    'return 2',
                    'end function',
                ].join('\n'),
                'shared_beta.pbl/w_base.sru': [
                    'forward',
                    'global type w_base from window',
                    'end forward',
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['alpha/app_alpha.pbl/w_child.sru']);
            const position = getTextPosition(document, 'of_base');

            await vscode.commands.executeCommand('workbench.action.closeAllEditors');

            const result = await vscode.commands.executeCommand<{
                kind: string;
                appliedFilters: string[];
                availableFilters: Array<{ filterId: string; selected: boolean }>;
                symbols: Array<{ symbol: { uri: string; name: string; projectName?: string; returnType?: string } }>;
            }>(
                'powerbuilder.runSemanticNavigate',
                {
                    uri: document.uri.toString(),
                    line: position.line,
                    character: position.character,
                    filters: ['project', 'required-owner', 'strict-hierarchy', 'return', 'target'],
                },
            );

            assert.ok(result);
            assert.strictEqual(result!.kind, 'generated');
            assert.deepStrictEqual(result!.appliedFilters, ['project', 'required-owner', 'strict-hierarchy', 'return', 'target']);
            assert.ok(result!.availableFilters.some(filter => filter.filterId === 'project' && filter.selected));
            assert.ok(result!.availableFilters.some(filter => filter.filterId === 'required-owner' && filter.selected));
            assert.ok(result!.availableFilters.some(filter => filter.filterId === 'strict-hierarchy' && filter.selected));
            assert.ok(result!.availableFilters.some(filter => filter.filterId === 'return' && filter.selected));
            assert.ok(result!.availableFilters.some(filter => filter.filterId === 'target' && filter.selected));
            assert.strictEqual(result!.symbols.length, 1);
            assert.strictEqual(result!.symbols[0].symbol.name, 'of_base');
            assert.strictEqual(result!.symbols[0].symbol.projectName, 'alpha');
            assert.strictEqual(result!.symbols[0].symbol.returnType, 'long');
            assert.strictEqual(result!.symbols[0].symbol.uri, uris['shared_alpha.pbl/w_base.sru'].toString());
            assert.ok(!vscode.window.activeTextEditor);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.buildCurrentProject ejecuta /pbc /c y publica problemas en el archivo resuelto', async () => {
        const baseRelativePath = path.join('phase6-generated', 'build-current-project');
        const config = vscode.workspace.getConfiguration('powerbuilder');
        const warnings: string[] = [];
        const spawnCalls: Array<{ command: string; args: readonly string[] }> = [];

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'demo.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/w_demo.srw': [
                    'forward',
                    'global type w_demo from window',
                    'end forward',
                    'global type w_demo from window',
                    'end type',
                    'global w_demo w_demo',
                    'event open;',
                    'end event',
                ].join('\n'),
            });
            const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

            await indexer.indexProjectFile(uris['demo.pbproj']);
            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['app.pbl/w_demo.srw']));
            await config.update('build.pbAutoBuildPath', process.execPath, vscode.ConfigurationTarget.Workspace);
            await vscode.commands.executeCommand('powerbuilder.clearBuildProblems');

            const restoreSpawn = createSpawnRestore(
                [
                    '07:49:32 [Normal]  Library: c:\\temp\\demo\\app.pbl',
                    '07:49:32 [Normal]      Object: w_demo',
                    '07:49:32 [Error]          (0004): Error       C0001: Illegal data type: u_dwstandard',
                    "07:49:32 [Error] 'Application' failed to compile",
                ].join('\n'),
                1,
                (command, args) => {
                    spawnCalls.push({ command, args });
                },
            );
            const restoreWarning = replaceProperty(
                vscode.window,
                'showWarningMessage',
                async (message: string) => {
                    warnings.push(message);
                    return undefined;
                },
            );

            try {
                await vscode.commands.executeCommand('powerbuilder.buildCurrentProject');
            } finally {
                restoreSpawn();
                restoreWarning();
            }

            assert.strictEqual(spawnCalls.length, 1);
            assert.strictEqual(path.normalize(spawnCalls[0].command), path.normalize(process.execPath));
            assert.deepStrictEqual(spawnCalls[0].args, ['/pbc', '/c', uris['demo.pbproj'].fsPath]);
            assert.ok(warnings.some(message => message.includes('1 error(es)')));

            const diagnostics = vscode.languages.getDiagnostics(uris['app.pbl/w_demo.srw']);

            assert.strictEqual(diagnostics.length, 1);
            assert.strictEqual(diagnostics[0].source, 'PBAutoBuild');
            assert.strictEqual(String(diagnostics[0].code), 'C0001/0004');
            assert.ok(diagnostics[0].message.includes('Illegal data type'));

            await vscode.commands.executeCommand('powerbuilder.clearBuildProblems');
            assert.strictEqual(vscode.languages.getDiagnostics(uris['app.pbl/w_demo.srw']).length, 0);
        } finally {
            await config.update('build.pbAutoBuildPath', undefined, vscode.ConfigurationTarget.Workspace);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.rebuildLastProject reutiliza el último proyecto aun sin editor activo', async () => {
        const baseRelativePath = path.join('phase6-generated', 'rebuild-last-project');
        const config = vscode.workspace.getConfiguration('powerbuilder');
        const warnings: string[] = [];
        const spawnCalls: Array<{ command: string; args: readonly string[] }> = [];

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'demo.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/w_demo.srw': [
                    'forward',
                    'global type w_demo from window',
                    'end forward',
                    'global type w_demo from window',
                    'end type',
                    'global w_demo w_demo',
                    'event open;',
                    'end event',
                ].join('\n'),
            });
            const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

            await indexer.indexProjectFile(uris['demo.pbproj']);
            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['app.pbl/w_demo.srw']));
            await config.update('build.pbAutoBuildPath', process.execPath, vscode.ConfigurationTarget.Workspace);
            await vscode.commands.executeCommand('powerbuilder.clearBuildProblems');

            const restoreSpawn = createSpawnRestore(
                [
                    '07:49:32 [Normal]  Library: c:\\temp\\demo\\app.pbl',
                    '07:49:32 [Normal]      Object: w_demo',
                    '07:49:32 [Warning]          This object uses an unsupported feature',
                ].join('\n'),
                0,
                (command, args) => {
                    spawnCalls.push({ command, args });
                },
            );
            const restoreWarning = replaceProperty(
                vscode.window,
                'showWarningMessage',
                async (message: string) => {
                    warnings.push(message);
                    return undefined;
                },
            );

            try {
                await vscode.commands.executeCommand('powerbuilder.buildCurrentProject');
                await vscode.commands.executeCommand('workbench.action.closeAllEditors');
                await vscode.commands.executeCommand('powerbuilder.rebuildLastProject');
            } finally {
                restoreSpawn();
                restoreWarning();
            }

            assert.strictEqual(spawnCalls.length, 2);
            assert.deepStrictEqual(spawnCalls[0].args, ['/pbc', '/c', uris['demo.pbproj'].fsPath]);
            assert.deepStrictEqual(spawnCalls[1].args, ['/pbc', '/c', uris['demo.pbproj'].fsPath]);
            assert.ok(warnings.every(message => message.includes('1 warning(s)')));
        } finally {
            await config.update('build.pbAutoBuildPath', undefined, vscode.ConfigurationTarget.Workspace);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.buildCurrentProject acepta .pbw y rebuildLastProject reutiliza el último target de workspace', async () => {
        const baseRelativePath = path.join('phase6-generated', 'build-current-workspace-pbw');
        const config = vscode.workspace.getConfiguration('powerbuilder');
        const spawnCalls: Array<{ command: string; args: readonly string[] }> = [];

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'demo.pbw': 'dummy workspace content',
            });

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['demo.pbw']));
            await config.update('build.pbAutoBuildPath', process.execPath, vscode.ConfigurationTarget.Workspace);

            const restoreSpawn = createSpawnRestore('', 0, (command, args) => {
                spawnCalls.push({ command, args });
            });

            try {
                await vscode.commands.executeCommand('powerbuilder.buildCurrentProject');
                await vscode.commands.executeCommand('workbench.action.closeAllEditors');
                await vscode.commands.executeCommand('powerbuilder.rebuildLastProject');
            } finally {
                restoreSpawn();
            }

            assert.strictEqual(spawnCalls.length, 2);
            assert.deepStrictEqual(spawnCalls[0].args, ['/pbc', '/c', uris['demo.pbw'].fsPath]);
            assert.deepStrictEqual(spawnCalls[1].args, ['/pbc', '/c', uris['demo.pbw'].fsPath]);
        } finally {
            await config.update('build.pbAutoBuildPath', undefined, vscode.ConfigurationTarget.Workspace);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.buildCurrentProject acepta .pbsln como documento activo', async () => {
        const baseRelativePath = path.join('phase6-generated', 'build-current-solution-pbsln');
        const config = vscode.workspace.getConfiguration('powerbuilder');
        const spawnCalls: Array<{ command: string; args: readonly string[] }> = [];

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'demo.pbsln': 'dummy solution content',
            });

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['demo.pbsln']));
            await config.update('build.pbAutoBuildPath', process.execPath, vscode.ConfigurationTarget.Workspace);

            const restoreSpawn = createSpawnRestore('', 0, (command, args) => {
                spawnCalls.push({ command, args });
            });

            try {
                await vscode.commands.executeCommand('powerbuilder.buildCurrentProject');
            } finally {
                restoreSpawn();
            }

            assert.strictEqual(spawnCalls.length, 1);
            assert.deepStrictEqual(spawnCalls[0].args, ['/pbc', '/c', uris['demo.pbsln'].fsPath]);
        } finally {
            await config.update('build.pbAutoBuildPath', undefined, vscode.ConfigurationTarget.Workspace);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.showLastBuildOutput abre un documento con el resumen de la última build', async () => {
        const baseRelativePath = path.join('phase6-generated', 'show-last-build-output');
        const config = vscode.workspace.getConfiguration('powerbuilder');
        let capturedContent = '';
        let shownDocument: vscode.TextDocument | undefined;

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'demo.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/w_demo.srw': [
                    'forward',
                    'global type w_demo from window',
                    'end forward',
                    'global type w_demo from window',
                    'end type',
                    'global w_demo w_demo',
                    'event open;',
                    'end event',
                ].join('\n'),
            });
            const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

            await indexer.indexProjectFile(uris['demo.pbproj']);
            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['app.pbl/w_demo.srw']));
            await config.update('build.pbAutoBuildPath', process.execPath, vscode.ConfigurationTarget.Workspace);

            const restoreSpawn = createSpawnRestore(
                [
                    '07:49:32 [Normal]  Library: c:\\temp\\demo\\app.pbl',
                    '07:49:32 [Normal]      Object: w_demo',
                    '07:49:32 [Error]          (0004): Error       C0001: Illegal data type: u_dwstandard',
                ].join('\n'),
                1,
                () => {
                    // no-op
                },
            );

            try {
                await vscode.commands.executeCommand('powerbuilder.buildCurrentProject');
            } finally {
                restoreSpawn();
            }

            const originalOpenTextDocument = vscode.workspace.openTextDocument.bind(vscode.workspace);
            const restoreOpenTextDocument = replaceProperty(
                vscode.workspace,
                'openTextDocument',
                async (source: unknown) => {
                    if (source && typeof source === 'object' && 'content' in (source as Record<string, unknown>)) {
                        capturedContent = String((source as Record<string, unknown>).content ?? '');

                        return {
                            uri: vscode.Uri.parse('untitled:last-build-output'),
                            getText: () => capturedContent,
                            lineAt: (line: number) => ({ text: capturedContent.split(/\r?\n/)[line] || '' }),
                            lineCount: capturedContent.split(/\r?\n/).length,
                            languageId: 'plaintext',
                        } as unknown as vscode.TextDocument;
                    }

                    return originalOpenTextDocument(source as Parameters<typeof vscode.workspace.openTextDocument>[0]);
                },
            );
            const restoreShowTextDocument = replaceProperty(
                vscode.window,
                'showTextDocument',
                async (document: vscode.TextDocument) => {
                    shownDocument = document;
                    return {} as vscode.TextEditor;
                },
            );

            try {
                await vscode.commands.executeCommand('powerbuilder.showLastBuildOutput');
            } finally {
                restoreOpenTextDocument();
                restoreShowTextDocument();
            }

            assert.ok(shownDocument);
            assert.ok(capturedContent.includes('Proyecto: demo'));
            assert.ok(capturedContent.includes('Resultado: código 1 · 1 error(es) · 0 warning(s) · 0 fatal(es)'));
            assert.ok(capturedContent.includes('Categorias:'));
            assert.ok(capturedContent.includes('Bibliotecas:'));
            assert.ok(capturedContent.includes('Illegal data type'));
        } finally {
            await config.update('build.pbAutoBuildPath', undefined, vscode.ConfigurationTarget.Workspace);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.exportLastBuildReport serializa el último resultado de build en JSON versionable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-last-build-report');
        const config = vscode.workspace.getConfiguration('powerbuilder');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'demo.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/w_demo.srw': [
                    'forward',
                    'global type w_demo from window',
                    'end forward',
                    'global type w_demo from window',
                    'end type',
                    'global w_demo w_demo',
                    'event open;',
                    'end event',
                ].join('\n'),
            });
            const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

            await indexer.indexProjectFile(uris['demo.pbproj']);
            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['app.pbl/w_demo.srw']));
            await config.update('build.pbAutoBuildPath', process.execPath, vscode.ConfigurationTarget.Workspace);

            const restoreSpawn = createSpawnRestore(
                [
                    '07:49:32 [Normal]  Library: c:\\temp\\demo\\app.pbl',
                    '07:49:32 [Normal]      Object: w_demo',
                    '07:49:32 [Error]          (0004): Error       C0001: Illegal data type: u_dwstandard',
                ].join('\n'),
                1,
                () => {
                    // no-op
                },
            );

            try {
                await vscode.commands.executeCommand('powerbuilder.buildCurrentProject');
                await vscode.commands.executeCommand('powerbuilder.exportLastBuildReport');
            } finally {
                restoreSpawn();
            }

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/build/demo.last-build-report.json',
            ));

            assert.strictEqual(payload.kind, 'powerbuilder-build-report');
            assert.strictEqual(payload.project.name, 'demo');
            assert.strictEqual(payload.exitCode, 1);
            assert.strictEqual(payload.summary.errorCount, 1);
            assert.ok(payload.summary.categories.some((category: { category: string }) => category.category === 'Error'));
            assert.ok(payload.summary.libraries.some((library: { libraryPath: string }) => library.libraryPath === 'c:\\temp\\demo\\app.pbl'));
            assert.ok(payload.issues.some((issue: { compilerCode?: string; message: string }) => issue.compilerCode === 'C0001' && issue.message.includes('Illegal data type')));
            assert.ok(payload.diagnostics.some((diagnostic: { relativePath: string; count: number }) => diagnostic.relativePath.endsWith('/app.pbl/w_demo.srw') && diagnostic.count === 1));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'demo.last-build-report.json');
        } finally {
            await config.update('build.pbAutoBuildPath', undefined, vscode.ConfigurationTarget.Workspace);
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.runBuildSessionManifest y exportBuildSessionManifest publican el último target y build de forma estructurada', async () => {
        const baseRelativePath = path.join('phase6-generated', 'build-session-manifest');
        const config = vscode.workspace.getConfiguration('powerbuilder');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'demo.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/w_demo.srw': [
                    'forward',
                    'global type w_demo from window',
                    'end forward',
                    'global type w_demo from window',
                    'end type',
                    'global w_demo w_demo',
                    'event open;',
                    'end event',
                ].join('\n'),
            });
            const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

            await indexer.indexProjectFile(uris['demo.pbproj']);
            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['app.pbl/w_demo.srw']));
            await config.update('build.pbAutoBuildPath', process.execPath, vscode.ConfigurationTarget.Workspace);

            const restoreSpawn = createSpawnRestore(
                [
                    '07:49:32 [Normal]  Library: c:\\temp\\demo\\app.pbl',
                    '07:49:32 [Normal]      Object: w_demo',
                    '07:49:32 [Error]          (0004): Error       C0001: Illegal data type: u_dwstandard',
                ].join('\n'),
                1,
                () => {
                    // no-op
                },
            );

            try {
                await vscode.commands.executeCommand('powerbuilder.buildCurrentProject');

                const runResult = await vscode.commands.executeCommand<{
                    kind: string;
                    payload: { kind: string; summary: { hasLastTarget: boolean; hasLastBuild: boolean }; lastTarget?: { kind: string; source: string }; lastBuild?: { project: { name: string }; issueCount: number } };
                }>('powerbuilder.runBuildSessionManifest');

                assert.ok(runResult);
                assert.strictEqual(runResult!.kind, 'generated');
                assertPayloadMatchesPublicSchema(runResult!.payload);
                assert.strictEqual(runResult!.payload.kind, 'powerbuilder-build-session-manifest');
                assert.strictEqual(runResult!.payload.summary.hasLastTarget, true);
                assert.strictEqual(runResult!.payload.summary.hasLastBuild, true);
                assert.strictEqual(runResult!.payload.lastTarget?.kind, 'project');
                assert.strictEqual(runResult!.payload.lastTarget?.source, 'session');
                assert.strictEqual(runResult!.payload.lastBuild?.project.name, 'demo');
                assert.strictEqual(runResult!.payload.lastBuild?.issueCount, 1);

                await vscode.commands.executeCommand('powerbuilder.exportBuildSessionManifest');
            } finally {
                restoreSpawn();
            }

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/build/build-session-manifest.json',
            ));

            assertPayloadMatchesPublicSchema(payload);
            assert.strictEqual(payload.kind, 'powerbuilder-build-session-manifest');
            assert.strictEqual(payload.summary.hasLastTarget, true);
            assert.strictEqual(payload.summary.hasLastBuild, true);
            assert.strictEqual(payload.lastTarget.name, 'demo');
            assert.strictEqual(payload.lastBuild.project.name, 'demo');
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'build-session-manifest.json');
        } finally {
            await config.update('build.pbAutoBuildPath', undefined, vscode.ConfigurationTarget.Workspace);
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.generateDocumentationCurrentObject genera un Markdown estable para el objeto activo', async () => {
        const baseRelativePath = path.join('phase6-generated', 'documentation-current-object');
        const projectName = 'demo_docs';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/w_docs.srw': [
                    'forward',
                    'global type w_docs from window',
                    'end forward',
                    'global type w_docs from window',
                    'end type',
                    'global w_docs w_docs',
                    'type variables',
                    'private string is_status',
                    'end variables',
                    'forward prototypes',
                    'public function long wf_reset ()',
                    'end prototypes',
                    'event open;',
                    'is_status = String(Today())',
                    'end event',
                    'public function long wf_reset ();',
                    'return 1',
                    'end function',
                ].join('\n'),
            });

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['app.pbl/w_docs.srw']));
            await vscode.commands.executeCommand('powerbuilder.generateDocumentationCurrentObject');

            const relativeOutputPath = path.posix.join(
                'docs/generated/powerbuilder/objects',
                projectName,
                'window',
                'w_docs.md',
            );
            const relativeJsonOutputPath = path.posix.join(
                'docs/generated/powerbuilder/objects',
                projectName,
                'window',
                'w_docs.json',
            );
            const markdown = await readWorkspaceFile(relativeOutputPath);
            const jsonPayload = JSON.parse(await readWorkspaceFile(relativeJsonOutputPath));

            assert.ok(markdown.includes('# w_docs'));
            assert.ok(markdown.includes('## Identidad'));
            assert.ok(markdown.includes('## Mapa rápido'));
            assert.ok(markdown.includes('## Relaciones útiles'));
            assert.ok(markdown.includes('## API del objeto'));
            assert.ok(markdown.includes('## Metadatos de generación'));
            assert.strictEqual(jsonPayload.kind, 'powerbuilder-object-documentation');
            assert.strictEqual(jsonPayload.model.objectName, 'w_docs');
            assert.strictEqual(jsonPayload.model.objectType, 'window');
            assert.ok(jsonPayload.model.publicCallables.some((callable: { name: string }) => callable.name === 'wf_reset'));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'w_docs.md');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.generateDocumentationCurrentProject genera objetos, índices y exclusiones conservadoras', async () => {
        const baseRelativePath = path.join('phase6-generated', 'documentation-current-project');
        const projectName = 'demo_project_docs';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/w_docs.srw': [
                    'forward',
                    'global type w_docs from window',
                    'end forward',
                    'global type w_docs from window',
                    'end type',
                    'global w_docs w_docs',
                    'type variables',
                    'private string is_status',
                    'end variables',
                    'forward prototypes',
                    'public function long wf_reset ()',
                    'end prototypes',
                    'event open;',
                    'is_status = String(Today())',
                    'end event',
                    'public function long wf_reset ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'app.pbl/n_docs.sru': [
                    'forward',
                    'global type n_docs from nonvisualobject',
                    'end forward',
                    'global type n_docs from nonvisualobject',
                    'end type',
                    'global n_docs n_docs',
                    'forward prototypes',
                    'public function string of_name ()',
                    'end prototypes',
                    'public function string of_name ();',
                    'return "demo"',
                    'end function',
                ].join('\n'),
                'app.pbl/gf_legacy.srf': [
                    'global type gf_legacy from function_object',
                    'end type',
                    'global gf_legacy gf_legacy',
                ].join('\n'),
            });

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['app.pbl/w_docs.srw']));
            await vscode.commands.executeCommand('powerbuilder.generateDocumentationCurrentProject');

            const projectIndexPath = path.posix.join(
                'docs/generated/powerbuilder/indexes',
                projectName,
                'project-index.md',
            );
            const objectsByTypePath = path.posix.join(
                'docs/generated/powerbuilder/indexes',
                projectName,
                'objects-by-type.md',
            );
            const inheritanceIndexPath = path.posix.join(
                'docs/generated/powerbuilder/indexes',
                projectName,
                'inheritance-index.md',
            );
            const publicApiIndexPath = path.posix.join(
                'docs/generated/powerbuilder/indexes',
                projectName,
                'public-api-index.md',
            );
            const dependenciesIndexPath = path.posix.join(
                'docs/generated/powerbuilder/indexes',
                projectName,
                'dependencies-index.md',
            );
            const eventScriptsIndexPath = path.posix.join(
                'docs/generated/powerbuilder/indexes',
                projectName,
                'event-scripts-index.md',
            );

            const projectIndex = await readWorkspaceFile(projectIndexPath);
            const objectsByType = await readWorkspaceFile(objectsByTypePath);
            const inheritanceIndex = await readWorkspaceFile(inheritanceIndexPath);
            const publicApiIndex = await readWorkspaceFile(publicApiIndexPath);
            const dependenciesIndex = await readWorkspaceFile(dependenciesIndexPath);
            const eventScriptsIndex = await readWorkspaceFile(eventScriptsIndexPath);
            const windowJsonPayload = JSON.parse(await readWorkspaceFile(path.posix.join(
                'docs/generated/powerbuilder/objects',
                projectName,
                'window',
                'w_docs.json',
            )));
            const nonvisualJsonPayload = JSON.parse(await readWorkspaceFile(path.posix.join(
                'docs/generated/powerbuilder/objects',
                projectName,
                'nonvisualobject',
                'n_docs.json',
            )));

            assert.ok(projectIndex.includes('w_docs'));
            assert.ok(projectIndex.includes('n_docs'));
            assert.ok(projectIndex.includes('gf_legacy'));
            assert.ok(projectIndex.includes('Tipo raíz fuera del v1 soportado'));
            assert.ok(objectsByType.includes('## nonvisualobject'));
            assert.ok(objectsByType.includes('## window'));
            assert.ok(inheritanceIndex.includes('window'));
            assert.ok(publicApiIndex.includes('wf_reset'));
            assert.ok(publicApiIndex.includes('of_name'));
            assert.ok(dependenciesIndex.includes('Today'));
            assert.ok(eventScriptsIndex.includes('open'));
            assert.strictEqual(windowJsonPayload.kind, 'powerbuilder-object-documentation');
            assert.strictEqual(windowJsonPayload.model.objectName, 'w_docs');
            assert.strictEqual(nonvisualJsonPayload.kind, 'powerbuilder-object-documentation');
            assert.strictEqual(nonvisualJsonPayload.model.objectName, 'n_docs');

            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'project-index.md');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.regenerateDocumentationIndexes recompone índices Markdown de proyectos detectados', async () => {
        const baseRelativePath = path.join('phase6-generated', 'documentation-regenerate-indexes');
        const projectName = 'demo_regen_docs';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/w_docs.srw': [
                    'forward',
                    'global type w_docs from window',
                    'end forward',
                    'global type w_docs from window',
                    'end type',
                    'global w_docs w_docs',
                    'forward prototypes',
                    'public function long wf_reset ()',
                    'end prototypes',
                    'public function long wf_reset ();',
                    'return 1',
                    'end function',
                ].join('\n'),
            });

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['app.pbl/w_docs.srw']));
            await vscode.commands.executeCommand('powerbuilder.generateDocumentationCurrentProject');

            const publicApiIndexPath = path.join(
                vscode.workspace.workspaceFolders![0].uri.fsPath,
                'docs',
                'generated',
                'powerbuilder',
                'indexes',
                projectName,
                'public-api-index.md',
            );

            await fs.rm(publicApiIndexPath, { force: true });
            await vscode.commands.executeCommand('powerbuilder.regenerateDocumentationIndexes');

            const publicApiIndex = await readWorkspaceFile(path.posix.join(
                'docs/generated/powerbuilder/indexes',
                projectName,
                'public-api-index.md',
            ));

            assert.ok(publicApiIndex.includes('wf_reset'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportSemanticDocument genera un JSON versionable con symbols, scopes y query activa', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-semantic-document');
        const projectName = 'demo_export_doc';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/n_export_service.sru': [
                    'forward',
                    'global type n_export_service from nonvisualobject',
                    'end type',
                    'end forward',
                    '',
                    'global type n_export_service from nonvisualobject',
                    'end type',
                    'global n_export_service n_export_service',
                    '',
                    'public function long of_run (long al_value);',
                    'return al_value',
                    'end function',
                    '',
                    'event open;',
                    'long ll_total',
                    'll_total = this.of_run(5)',
                    'end event',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['app.pbl/n_export_service.sru']);
            const editor = await vscode.window.showTextDocument(document);
            const queryOffset = document.getText().indexOf('of_run(5)');
            assert.ok(queryOffset >= 0, 'Expected of_run(5) call in export semantic document fixture');
            const position = document.positionAt(queryOffset + 2);
            editor.selection = new vscode.Selection(position, position);

            await vscode.commands.executeCommand('powerbuilder.exportSemanticDocument');

            const relativeOutputPath = path.posix.join(
                'docs/generated/powerbuilder/exports/documents',
                projectName,
                'n_export_service.semantic-document.json',
            );
            const payload = JSON.parse(await readWorkspaceFile(relativeOutputPath));
            const callable = payload.symbols.find((symbol: { name: string; kind: string }) =>
                symbol.name === 'of_run' && symbol.kind === 'function',
            );

            assert.strictEqual(payload.kind, 'powerbuilder-semantic-document');
            assert.strictEqual(payload.document.objectName, 'n_export_service');
            assert.strictEqual(payload.project.name, projectName);
            assert.ok(callable?.persistentId);
            assert.ok(payload.scopes.some((scope: { callable: { name: string }; parameters: Array<{ name: string }> }) =>
                scope.callable.name === 'of_run' && scope.parameters.some(parameter => parameter.name === 'al_value'),
            ));
            assert.ok(['exact', 'compatible', 'heuristic', 'ambiguous', 'blocked'].includes(payload.currentQuery.definition.precision));
            assert.ok(payload.currentQuery.references.query.occurrences.length >= 2);
            assert.strictEqual(payload.currentQuery.symbol.primarySymbol?.persistentId, callable.persistentId);
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'n_export_service.semantic-document.json');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportSemanticProject genera un snapshot JSON del proyecto preferido', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-semantic-project');
        const projectName = 'demo_export_project';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/w_export_main.srw': [
                    'forward',
                    'global type w_export_main from window',
                    'end forward',
                    'global type w_export_main from window',
                    'end type',
                    'global w_export_main w_export_main',
                    'event open;',
                    'end event',
                ].join('\n'),
                'app.pbl/n_export_service.sru': [
                    'forward',
                    'global type n_export_service from nonvisualobject',
                    'end type',
                    'end forward',
                    '',
                    'global type n_export_service from nonvisualobject',
                    'end type',
                    'global n_export_service n_export_service',
                    '',
                    'public function string of_name ();',
                    'return "demo"',
                    'end function',
                ].join('\n'),
            });

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['app.pbl/w_export_main.srw']));
            await vscode.commands.executeCommand('powerbuilder.exportSemanticProject');

            const relativeOutputPath = path.posix.join(
                'docs/generated/powerbuilder/exports/projects',
                `${projectName}.semantic-project.json`,
            );
            const payload = JSON.parse(await readWorkspaceFile(relativeOutputPath));

            assert.strictEqual(payload.kind, 'powerbuilder-semantic-project');
            assert.strictEqual(payload.project.name, projectName);
            assert.strictEqual(payload.summary.fileCount, 2);
            assert.ok(payload.summary.symbolCount >= 4);
            assert.ok(payload.files.some((file: { relativePath: string }) => file.relativePath.endsWith('/w_export_main.srw')));
            assert.ok(payload.files.some((file: { relativePath: string; callables: Array<{ name: string; persistentId: string }> }) =>
                file.relativePath.endsWith('/n_export_service.sru')
                && file.callables.some(callable => callable.name === 'of_name' && !!callable.persistentId),
            ));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), `${projectName}.semantic-project.json`);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportSemanticProject reutiliza el snapshot cacheado y lo invalida tras guardar cambios del proyecto', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-semantic-project-invalidation');
        const projectName = 'demo_export_project_invalidation';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/n_export_service.sru': [
                    'forward',
                    'global type n_export_service from nonvisualobject',
                    'end type',
                    'end forward',
                    '',
                    'global type n_export_service from nonvisualobject',
                    'end type',
                    'global n_export_service n_export_service',
                    '',
                    'public function string of_name ();',
                    'return "demo"',
                    'end function',
                ].join('\n'),
            });

            const sourceDocument = await vscode.workspace.openTextDocument(uris['app.pbl/n_export_service.sru']);
            await vscode.window.showTextDocument(sourceDocument);

            await vscode.commands.executeCommand('powerbuilder.exportSemanticProject');

            const relativeOutputPath = path.posix.join(
                'docs/generated/powerbuilder/exports/projects',
                `${projectName}.semantic-project.json`,
            );
            const firstPayload = JSON.parse(await readWorkspaceFile(relativeOutputPath));

            await vscode.window.showTextDocument(sourceDocument);
            await vscode.commands.executeCommand('powerbuilder.exportSemanticProject');

            const secondPayload = JSON.parse(await readWorkspaceFile(relativeOutputPath));

            assert.strictEqual(secondPayload.generatedAt, firstPayload.generatedAt);
            assert.strictEqual(secondPayload.summary.callableCount, firstPayload.summary.callableCount);

            const editEditor = await vscode.window.showTextDocument(sourceDocument);
            await editEditor.edit(editBuilder => {
                editBuilder.insert(
                    new vscode.Position(sourceDocument.lineCount, 0),
                    [
                        '',
                        'public function long of_count ();',
                        'return 1',
                        'end function',
                    ].join('\n'),
                );
            });
            await sourceDocument.save();

            await vscode.window.showTextDocument(sourceDocument);
            await vscode.commands.executeCommand('powerbuilder.exportSemanticProject');

            const thirdPayload = JSON.parse(await readWorkspaceFile(relativeOutputPath));

            assert.notStrictEqual(thirdPayload.generatedAt, firstPayload.generatedAt);
            assert.ok(thirdPayload.summary.callableCount > firstPayload.summary.callableCount);
            assert.ok(thirdPayload.files.some((file: { relativePath: string; callables: Array<{ name: string }> }) =>
                file.relativePath.endsWith('/n_export_service.sru')
                && file.callables.some(callable => callable.name === 'of_count'),
            ));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), `${projectName}.semantic-project.json`);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportSemanticQuery serializa precision, locations, references y rename target', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-semantic-query');
        const projectName = 'demo_export_query';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/n_query_service.sru': [
                    'forward',
                    'global type n_query_service from nonvisualobject',
                    'end type',
                    'end forward',
                    '',
                    'global type n_query_service from nonvisualobject',
                    'end type',
                    'global n_query_service n_query_service',
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
                    'end event',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['app.pbl/n_query_service.sru']);
            const editor = await vscode.window.showTextDocument(document);
            const queryOffset = document.getText().indexOf('of_run()');
            assert.ok(queryOffset >= 0, 'Expected of_run() call in export semantic query fixture');
            const position = document.positionAt(queryOffset + 2);
            editor.selection = new vscode.Selection(position, position);

            await vscode.commands.executeCommand('powerbuilder.exportSemanticQuery');

            assert.ok(vscode.window.activeTextEditor);

            const payload = JSON.parse(vscode.window.activeTextEditor!.document.getText());

            assert.strictEqual(payload.kind, 'powerbuilder-semantic-query');
            assert.strictEqual(payload.document.word, 'of_run');
            assert.strictEqual(payload.query.symbol.precision, 'exact');
            assert.strictEqual(payload.query.declaration.locations.length, 1);
            assert.strictEqual(payload.query.implementation.locations.length, 1);
            assert.ok(payload.query.references.query.occurrences.length >= 2);
            assert.ok(payload.query.references.plan.occurrences.length >= 2);
            assert.strictEqual(payload.query.renameTarget.canRename, true);
            assert.ok(payload.query.renameTarget.plan.occurrences.length >= 2);
            assert.ok(payload.query.renameTarget.renameTarget.target.persistentId);
            assert.ok(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath).endsWith('.semantic-query.json'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportOverloadResolutionExplanation serializa la explicacion auditable de overloads', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-overload-resolution-explanation');
        const projectName = 'demo_export_overload';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/n_query_service.sru': [
                    'forward',
                    'global type n_query_service from nonvisualobject',
                    'end type',
                    'end forward',
                    '',
                    'global type n_query_service from nonvisualobject',
                    'end type',
                    'global n_query_service n_query_service',
                    '',
                    'forward prototypes',
                    'public function long of_run ()',
                    'public function long of_run (string as_name)',
                    'end prototypes',
                    '',
                    'public function long of_run ();',
                    'return 1',
                    'end function',
                    '',
                    'public function long of_run (string as_name);',
                    'return len(as_name)',
                    'end function',
                    '',
                    'event open;',
                    'this.of_run("demo")',
                    'end event',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['app.pbl/n_query_service.sru']);
            const editor = await vscode.window.showTextDocument(document);
            const signatureAnchor = 'this.of_run("demo"';
            const queryOffset = document.getText().indexOf(signatureAnchor);
            assert.ok(queryOffset >= 0, 'Expected exact overload call in export overload explanation fixture');
            const position = document.positionAt(queryOffset + signatureAnchor.length);
            editor.selection = new vscode.Selection(position, position);

            await vscode.commands.executeCommand('powerbuilder.exportOverloadResolutionExplanation');

            assert.ok(vscode.window.activeTextEditor);

            const payload = JSON.parse(vscode.window.activeTextEditor!.document.getText());

            assert.strictEqual(payload.kind, 'powerbuilder-overload-resolution-explanation');
            assert.strictEqual(payload.call.name, 'of_run');
            assert.strictEqual(payload.resolution.precision, 'exact');
            assert.strictEqual(payload.resolution.resolutionKind, 'single-candidate');
            assert.strictEqual(payload.resolution.shouldProvideHelp, true);
            assert.strictEqual(payload.resolution.candidateCount, 1);
            assert.ok(payload.resolution.selectedCandidate.signature.includes('of_run (string as_name)') || payload.resolution.selectedCandidate.signature.includes('of_run(string as_name)'));
            assert.ok(payload.resolution.evidence.some((evidence: { kind?: string }) => evidence.kind === 'arity-match'));
            assertPayloadMatchesPublicSchema(payload);
            assert.ok(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath).endsWith('.overload-resolution-explanation.json'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportVisibilityAudit detecta surfaces public/protected sin consumo demostrable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-visibility-audit');
        const projectName = 'demo_visibility_audit';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/w_base.sru': [
                    'forward',
                    'global type w_base from window',
                    'end type',
                    'end forward',
                    '',
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'public function long of_unused ();',
                    'return 1',
                    'end function',
                    '',
                    'public function long of_internal ();',
                    'return 2',
                    'end function',
                    '',
                    'public function long of_hierarchy ();',
                    'return 3',
                    'end function',
                    '',
                    'protected function long of_kept ();',
                    'return 4',
                    'end function',
                    '',
                    'event open;',
                    'long ll_total',
                    'll_total = this.of_internal()',
                    'end event',
                ].join('\n'),
                'app.pbl/w_child.sru': [
                    'forward',
                    'global type w_child from w_base',
                    'end type',
                    'end forward',
                    '',
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'event open;',
                    'long ll_total',
                    'll_total = this.of_hierarchy() + this.of_kept()',
                    'end event',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['app.pbl/w_base.sru']);
            await vscode.window.showTextDocument(document);

            await vscode.commands.executeCommand('powerbuilder.exportVisibilityAudit');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/workspace/visibility-audit.json',
            ));
            const ofUnused = payload.symbols.find((entry: { symbol: { name: string } }) => entry.symbol.name === 'of_unused');
            const ofInternal = payload.symbols.find((entry: { symbol: { name: string } }) => entry.symbol.name === 'of_internal');
            const ofHierarchy = payload.symbols.find((entry: { symbol: { name: string } }) => entry.symbol.name === 'of_hierarchy');
            const ofKept = payload.symbols.find((entry: { symbol: { name: string } }) => entry.symbol.name === 'of_kept');

            assert.strictEqual(payload.kind, 'powerbuilder-visibility-audit');
            assert.strictEqual(payload.summary.projectCount, 1);
            assert.ok(payload.summary.candidateCount >= 4);
            assert.ok(ofUnused);
            assert.strictEqual(ofUnused.classification, 'no-consumers');
            assert.strictEqual(ofUnused.suggestedAccess, 'private');
            assert.ok(ofInternal);
            assert.strictEqual(ofInternal.classification, 'same-type-only');
            assert.strictEqual(ofInternal.suggestedAccess, 'private');
            assert.ok(ofHierarchy);
            assert.strictEqual(ofHierarchy.classification, 'declaring-hierarchy-only');
            assert.strictEqual(ofHierarchy.suggestedAccess, 'protected');
            assert.ok(ofKept);
            assert.strictEqual(ofKept.classification, 'retained');
            assert.strictEqual(ofKept.suggestedAccess, undefined);
            assertPayloadMatchesPublicSchema(payload);
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'visibility-audit.json');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportDataWindowWorkspaceCatalog y exportDataWindowChildGraph publican snapshots seguros de .srd', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-datawindow-workspace');
        const projectName = 'demo_datawindow_workspace';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '        <Library Path="shared.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/d_parent.srd': [
                    '$PBExportHeader$d_parent.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=char(20) update=yes name=child_col dbname="customer.child_col")',
                    ' column=(type=long update=yes name=id dbname="customer.id")',
                    ' retrieve="SELECT child_col, id FROM customer" )',
                    'text(band=header alignment="0" text="Child" border="0" x="37" y="4" height="60" width="200")',
                    'column(band=detail id=1 name=child_col alignment="0" border="0" x="37" y="4" height="60" width="200" dddw.name="d_child_unique")',
                    'report(name="child_report" dataobject="d_report")',
                    'column(band=detail id=2 alignment="0" border="0" x="250" y="4" height="60" width="200")',
                ].join('\n'),
                'app.pbl/d_child_unique.srd': [
                    '$PBExportHeader$d_child_unique.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=long update=yes name=id dbname="child.id")',
                    ' retrieve="SELECT id FROM child" )',
                    'column(band=detail id=1 alignment="0" border="0" x="37" y="4" height="60" width="200")',
                ].join('\n'),
                'app.pbl/d_child_ambiguous.srd': [
                    '$PBExportHeader$d_child_ambiguous.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=long update=yes name=id dbname="child_ambiguous.id")',
                    ' retrieve="SELECT id FROM child_ambiguous" )',
                    'column(band=detail id=1 alignment="0" border="0" x="37" y="4" height="60" width="200")',
                ].join('\n'),
                'shared.pbl/d_child_duplicate.srd': [
                    '$PBExportHeader$d_child_ambiguous.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=long update=yes name=id dbname="child_dup.id")',
                    ' retrieve="SELECT id FROM child_dup" )',
                    'column(band=detail id=1 alignment="0" border="0" x="37" y="4" height="60" width="200")',
                ].join('\n'),
                'app.pbl/d_report.srd': [
                    '$PBExportHeader$d_report.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=long update=yes name=id dbname="report.id")',
                    ' retrieve="SELECT id FROM report_source" )',
                    'column(band=detail id=1 alignment="0" border="0" x="37" y="4" height="60" width="200")',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['app.pbl/d_parent.srd']);
            await vscode.window.showTextDocument(document);

            await vscode.commands.executeCommand('powerbuilder.exportDataWindowWorkspaceCatalog');

            const catalogPayload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/datawindow/workspace-datawindow-catalog.json',
            ));
            const parentEntry = catalogPayload.entries.find((entry: { objectName: string }) => entry.objectName === 'd_parent');
            const duplicatedChildEntries = catalogPayload.entries.filter((entry: { objectName: string }) => entry.objectName === 'd_child_ambiguous');

            assert.strictEqual(catalogPayload.kind, 'powerbuilder-datawindow-workspace-catalog');
            assert.strictEqual(catalogPayload.summary.dataWindowCount, 5);
            assert.strictEqual(catalogPayload.summary.ambiguousProjectBindingCount, 2);
            assert.ok(parentEntry);
            assert.strictEqual(parentEntry.summary.childLinkCount, 2);
            assert.ok(duplicatedChildEntries.length >= 2);
            assert.ok(duplicatedChildEntries.every((entry: { projectBindings: Array<{ verifiability: string; matchingObjectCount: number }> }) =>
                entry.projectBindings.some(binding => binding.verifiability === 'ambiguous' && binding.matchingObjectCount === 2),
            ));
            assertPayloadMatchesPublicSchema(catalogPayload);

            await vscode.window.showTextDocument(document);

            await vscode.commands.executeCommand('powerbuilder.exportDataWindowChildGraph');

            const graphPayload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/datawindow/datawindow-child-graph.json',
            ));
            const dropdownEdge = graphPayload.edges.find((edge: { childName: string }) => edge.childName === 'child_col');
            const reportEdge = graphPayload.edges.find((edge: { childName: string }) => edge.childName === 'child_report');

            assert.strictEqual(graphPayload.kind, 'powerbuilder-datawindow-child-graph');
            assert.strictEqual(graphPayload.summary.parentCount, 5);
            assert.strictEqual(graphPayload.summary.edgeCount, 2);
            assert.ok(dropdownEdge);
            assert.strictEqual(dropdownEdge.kind, 'dropdown-datawindow');
            assert.strictEqual(dropdownEdge.dataObjectName, 'd_child_unique');
            assert.ok(reportEdge);
            assert.strictEqual(reportEdge.kind, 'report');
            assert.strictEqual(reportEdge.dataObjectName, 'd_report');
            assertPayloadMatchesPublicSchema(graphPayload);
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'datawindow-child-graph.json');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportRuntimeCatalog genera un catálogo runtime JSON reutilizable', async () => {
        try {
            await vscode.commands.executeCommand('powerbuilder.exportRuntimeCatalog');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/runtime/system-symbol-catalog.json',
            ));

            assert.strictEqual(payload.kind, 'powerbuilder-runtime-catalog');
            assert.strictEqual(payload.schemaVersion, 2);
            assert.ok(payload.summary.entryCount > 0);
            assert.ok(payload.typing.overloadedEntryCount > 0);
            assert.strictEqual(payload.coverage.totalEntries, payload.summary.entryCount);
            assert.strictEqual(payload.consistency.validation.ok, true);
            assert.ok(payload.indexes.domains.some((entry: { domain: string; entryCount: number }) =>
                entry.domain === 'system-events' && entry.entryCount > 0,
            ));
            assert.ok(payload.indexes.ownerTypes.some((entry: { ownerType: string }) => entry.ownerType === 'window'));
            assert.ok(payload.slices.length > 0);
            assert.ok(payload.entries.some((entry: {
                normalizedName: string;
                summary: string;
                typing?: { callableKind?: string; signatureShapes?: Array<{ parameterCount: number }> };
            }) =>
                entry.normalizedName === 'messagebox'
                && entry.summary.length > 0
                && entry.typing?.callableKind === 'global-function'
                && Array.isArray(entry.typing.signatureShapes)
                && entry.typing.signatureShapes[0]?.parameterCount >= 1,
            ));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'system-symbol-catalog.json');
        } finally {
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportAutomationSurface genera un manifest JSON de comandos estructurados para automatización', async () => {
        try {
            await vscode.commands.executeCommand('powerbuilder.exportAutomationSurface');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/automation/automation-surface.json',
            ));

            const runSemanticQuery = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.runSemanticQuery',
            );
            const runOverloadResolutionExplanation = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.runOverloadResolutionExplanation',
            );
            const runSemanticQueryBatch = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.runSemanticQueryBatch',
            );
            const runSemanticNavigate = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.runSemanticNavigate',
            );
            const runActiveHierarchyInspection = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.runActiveHierarchyInspection',
            );
            const runAncestorScriptInspection = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.runAncestorScriptInspection',
            );
            const runBuildSessionManifest = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.runBuildSessionManifest',
            );
            const runWorkspaceBuildPreference = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.runWorkspaceBuildPreference',
            );
            const exportWorkspaceBuildPreference = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportWorkspaceBuildPreference',
            );
            const exportVisibilityAudit = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportVisibilityAudit',
            );
            const exportPublicContractSchemas = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportPublicContractSchemas',
            );
            const exportPublicContractCatalog = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportPublicContractCatalog',
            );
            const exportBuildContractCatalog = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportBuildContractCatalog',
            );
            const exportHostContributionInventory = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportHostContributionInventory',
            );
            const exportAutomationCoverageAudit = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportAutomationCoverageAudit',
            );
            const exportAutomationReplay = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportAutomationReplay',
            );
            const exportPublicContractCatalogDiff = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportPublicContractCatalogDiff',
            );
            const exportWorkspaceArtifactBundleDiff = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportWorkspaceArtifactBundleDiff',
            );
            const exportCacheInvalidationSnapshot = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportCacheInvalidationSnapshot',
            );
            const exportBuildSessionManifest = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportBuildSessionManifest',
            );
            const exportWorkspaceArtifactBundle = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportWorkspaceArtifactBundle',
            );
            const exportWorkspaceDiagnosticsTree = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportWorkspaceDiagnosticsTree',
            );
            const exportFeatureSupportSnapshot = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportFeatureSupportSnapshot',
            );
            const exportDataWindowManifest = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportDataWindowManifest',
            );
            const exportDataWindowWorkspaceCatalog = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportDataWindowWorkspaceCatalog',
            );
            const exportDataWindowChildGraph = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportDataWindowChildGraph',
            );
            const exportSemanticSnapshotDiff = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportSemanticSnapshotDiff',
            );
            const exportWorkspaceManifestDiff = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportWorkspaceManifestDiff',
            );
            const exportSemanticDocument = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportSemanticDocument',
            );
            const exportOverloadResolutionExplanation = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportOverloadResolutionExplanation',
            );
            const extensionApiMethod = payload.extensionApi.methods.find((method: { name: string }) =>
                method.name === 'exportWorkspaceManifest',
            );
            const semanticQueryTool = payload.languageModelTools.find((tool: { name: string }) =>
                tool.name === 'powerbuilder-semantic-query',
            );
            const buildSessionTool = payload.languageModelTools.find((tool: { name: string }) =>
                tool.name === 'powerbuilder-build-session-manifest',
            );

            assert.strictEqual(payload.kind, 'powerbuilder-automation-surface');
            assertPayloadMatchesPublicSchema(payload);
            assert.strictEqual(payload.extensionApi.extensionId, 'lopez.almunia-powersyntax');
            assert.strictEqual(payload.extensionApi.apiVersion, 1);
            assert.ok(extensionApiMethod);
            assert.strictEqual(extensionApiMethod.command, 'powerbuilder.exportWorkspaceManifest');
            assert.ok(runSemanticQuery);
            assert.strictEqual(runSemanticQuery.mode, 'returns-structured-result');
            assert.ok(runSemanticQuery.arguments.some((argument: { name: string }) => argument.name === 'uri'));
            assert.ok(runOverloadResolutionExplanation);
            assert.strictEqual(runOverloadResolutionExplanation.mode, 'returns-structured-result');
            assert.ok(runOverloadResolutionExplanation.arguments.some((argument: { name: string }) => argument.name === 'character'));
            assert.ok(runSemanticQueryBatch);
            assert.strictEqual(runSemanticQueryBatch.mode, 'returns-structured-result');
            assert.ok(runSemanticQueryBatch.arguments.some((argument: { name: string }) => argument.name === 'requests'));
            assert.ok(runSemanticNavigate);
            assert.strictEqual(runSemanticNavigate.mode, 'returns-structured-result');
            assert.ok(runSemanticNavigate.arguments.some((argument: { name: string }) => argument.name === 'filters'));
            assert.ok(runActiveHierarchyInspection);
            assert.strictEqual(runActiveHierarchyInspection.mode, 'returns-structured-result');
            assert.ok(runActiveHierarchyInspection.arguments.some((argument: { name: string }) => argument.name === 'line'));
            assert.ok(runAncestorScriptInspection);
            assert.strictEqual(runAncestorScriptInspection.mode, 'returns-structured-result');
            assert.ok(runAncestorScriptInspection.arguments.some((argument: { name: string }) => argument.name === 'character'));
            assert.ok(runBuildSessionManifest);
            assert.strictEqual(runBuildSessionManifest.mode, 'returns-structured-result');
            assert.ok(runWorkspaceBuildPreference);
            assert.strictEqual(runWorkspaceBuildPreference.mode, 'returns-structured-result');
            assert.ok(runWorkspaceBuildPreference.arguments.some((argument: { name: string }) => argument.name === 'uri'));
            assert.ok(exportWorkspaceBuildPreference);
            assert.strictEqual(exportWorkspaceBuildPreference.mode, 'writes-json-file');
            assert.ok(exportWorkspaceBuildPreference.arguments.some((argument: { name: string }) => argument.name === 'uri'));
            assert.ok(exportVisibilityAudit);
            assert.strictEqual(exportVisibilityAudit.mode, 'writes-json-file');
            assert.ok(exportPublicContractSchemas);
            assert.strictEqual(exportPublicContractSchemas.mode, 'writes-json-file');
            assert.ok(exportPublicContractCatalog);
            assert.strictEqual(exportPublicContractCatalog.mode, 'writes-json-file');
            assert.ok(exportBuildContractCatalog);
            assert.strictEqual(exportBuildContractCatalog.mode, 'writes-json-file');
            assert.ok(exportHostContributionInventory);
            assert.strictEqual(exportHostContributionInventory.mode, 'writes-json-file');
            assert.ok(exportAutomationCoverageAudit);
            assert.strictEqual(exportAutomationCoverageAudit.mode, 'writes-json-file');
            assert.ok(exportAutomationReplay);
            assert.strictEqual(exportAutomationReplay.mode, 'writes-json-file');
            assert.ok(exportAutomationReplay.arguments.some((argument: { name: string }) => argument.name === 'steps'));
            assert.ok(exportPublicContractCatalogDiff);
            assert.strictEqual(exportPublicContractCatalogDiff.mode, 'writes-json-file');
            assert.ok(exportWorkspaceArtifactBundleDiff);
            assert.strictEqual(exportWorkspaceArtifactBundleDiff.mode, 'writes-json-file');
            assert.ok(exportCacheInvalidationSnapshot);
            assert.strictEqual(exportCacheInvalidationSnapshot.mode, 'writes-json-file');
            assert.ok(exportBuildSessionManifest);
            assert.strictEqual(exportBuildSessionManifest.mode, 'writes-json-file');
            assert.ok(exportWorkspaceArtifactBundle);
            assert.strictEqual(exportWorkspaceArtifactBundle.mode, 'writes-json-file');
            assert.ok(exportWorkspaceDiagnosticsTree);
            assert.strictEqual(exportWorkspaceDiagnosticsTree.mode, 'writes-json-file');
            assert.ok(exportFeatureSupportSnapshot);
            assert.strictEqual(exportFeatureSupportSnapshot.mode, 'writes-json-file');
            assert.ok(exportDataWindowManifest);
            assert.strictEqual(exportDataWindowManifest.mode, 'writes-json-file');
            assert.ok(exportDataWindowWorkspaceCatalog);
            assert.strictEqual(exportDataWindowWorkspaceCatalog.mode, 'writes-json-file');
            assert.ok(exportDataWindowChildGraph);
            assert.strictEqual(exportDataWindowChildGraph.mode, 'writes-json-file');
            assert.ok(exportSemanticSnapshotDiff);
            assert.strictEqual(exportSemanticSnapshotDiff.mode, 'writes-json-file');
            assert.ok(exportSemanticSnapshotDiff.arguments.some((argument: { name: string }) => argument.name === 'leftUri'));
            assert.ok(exportWorkspaceManifestDiff);
            assert.strictEqual(exportWorkspaceManifestDiff.mode, 'writes-json-file');
            assert.ok(exportWorkspaceManifestDiff.arguments.some((argument: { name: string }) => argument.name === 'rightUri'));
            assert.ok(exportSemanticDocument);
            assert.strictEqual(exportSemanticDocument.mode, 'writes-json-file');
            assert.ok(exportOverloadResolutionExplanation);
            assert.strictEqual(exportOverloadResolutionExplanation.mode, 'writes-json-file');
            assert.ok(semanticQueryTool);
            assert.strictEqual(semanticQueryTool.backedBy.command, 'powerbuilder.runSemanticQuery');
            assert.ok(buildSessionTool);
            assert.strictEqual(buildSessionTool.backedBy.command, 'powerbuilder.runBuildSessionManifest');
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'automation-surface.json');
        } finally {
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportAutomationReplay exporta un replay versionable de commands y tools sobre la automation surface', async () => {
        try {
            await vscode.commands.executeCommand('powerbuilder.exportAutomationReplay', {
                name: 'integration-smoke',
                steps: [
                    {
                        kind: 'language-model-tool',
                        id: 'powerbuilder-build-session-manifest',
                        label: 'build-session-tool',
                    },
                    {
                        kind: 'command',
                        id: 'powerbuilder.exportFeatureSupportSnapshot',
                        label: 'feature-support-export',
                    },
                ],
            });

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/automation/replays/integration-smoke.automation-replay.json',
            ));
            const toolStep = payload.steps.find((step: { requestedId: string }) =>
                step.requestedId === 'powerbuilder-build-session-manifest',
            );
            const commandStep = payload.steps.find((step: { requestedId: string }) =>
                step.requestedId === 'powerbuilder.exportFeatureSupportSnapshot',
            );

            assert.strictEqual(payload.kind, 'powerbuilder-automation-replay');
            assertPayloadMatchesPublicSchema(payload);
            assert.strictEqual(payload.summary.stepCount, 2);
            assert.strictEqual(payload.summary.commandStepCount, 1);
            assert.strictEqual(payload.summary.languageModelToolStepCount, 1);
            assert.strictEqual(payload.summary.failedCount, 0);
            assert.ok(payload.manifest.automationSurfaceRelativePath.endsWith('automation/automation-surface.json'));
            assert.ok(toolStep);
            assert.strictEqual(toolStep.resolutionSource, 'language-model-tool-backed-command');
            assert.strictEqual(toolStep.resolvedCommand, 'powerbuilder.runBuildSessionManifest');
            assert.strictEqual(toolStep.outputKind, 'structured-result');
            assert.strictEqual(toolStep.result.kind, 'generated');
            assert.strictEqual(toolStep.result.payload.kind, 'powerbuilder-build-session-manifest');
            assert.ok(commandStep);
            assert.strictEqual(commandStep.resolutionSource, 'command');
            assert.strictEqual(commandStep.outputKind, 'generated-file');
            assert.ok(commandStep.outputRelativePath.endsWith('support/feature-support-snapshot.json'));
            assert.strictEqual(commandStep.result.payload.kind, 'powerbuilder-feature-support-snapshot');
        } finally {
            await removeGeneratedDocumentation();
        }
    });

    test('extension.exports publica una API mínima estable basada en comandos estructurados', async () => {
        try {
            const extension = vscode.extensions.getExtension('lopez.almunia-powersyntax');

            assert.ok(extension);

            const api = await extension.activate() as {
                apiVersion: number;
                extensionId: string;
                commands: {
                    exportAutomationSurface: string;
                    exportPublicContractCatalog: string;
                    exportWorkspaceManifestDiff: string;
                    exportWorkspaceBuildPreference: string;
                    runWorkspaceBuildPreference: string;
                    runActiveHierarchyInspection: string;
                    runAncestorScriptInspection: string;
                    runBuildSessionManifest: string;
                    exportBuildSessionManifest: string;
                };
                exportAutomationSurface: () => Promise<{
                    file: { relativePath: string };
                    payload: { kind: string; extensionApi: { extensionId: string }; languageModelTools: Array<{ name: string }> };
                } | undefined>;
                exportPublicContractCatalog: () => Promise<{
                    file: { relativePath: string };
                    payload: { kind: string; commands: Array<{ command: string; schemaPublished: boolean }>; languageModelTools: Array<{ name: string }> };
                } | undefined>;
                exportWorkspaceBuildPreference: (args?: unknown) => Promise<unknown>;
                exportWorkspaceManifestDiff: (args?: unknown) => Promise<unknown>;
                runWorkspaceBuildPreference: (args?: unknown) => Promise<unknown>;
                runActiveHierarchyInspection: (args?: unknown) => Promise<unknown>;
                runAncestorScriptInspection: (args?: unknown) => Promise<unknown>;
                runBuildSessionManifest: () => Promise<unknown>;
                exportBuildSessionManifest: () => Promise<unknown>;
            };
            const result = await api.exportAutomationSurface();
            const contractCatalog = await api.exportPublicContractCatalog();

            assert.strictEqual(api.apiVersion, 1);
            assert.strictEqual(api.extensionId, 'lopez.almunia-powersyntax');
            assert.strictEqual(api.commands.exportAutomationSurface, 'powerbuilder.exportAutomationSurface');
            assert.strictEqual(api.commands.exportPublicContractCatalog, 'powerbuilder.exportPublicContractCatalog');
            assert.strictEqual(api.commands.exportWorkspaceManifestDiff, 'powerbuilder.exportWorkspaceManifestDiff');
            assert.strictEqual(api.commands.exportWorkspaceBuildPreference, 'powerbuilder.exportWorkspaceBuildPreference');
            assert.strictEqual(api.commands.runWorkspaceBuildPreference, 'powerbuilder.runWorkspaceBuildPreference');
            assert.strictEqual(api.commands.runActiveHierarchyInspection, 'powerbuilder.runActiveHierarchyInspection');
            assert.strictEqual(api.commands.runAncestorScriptInspection, 'powerbuilder.runAncestorScriptInspection');
            assert.strictEqual(api.commands.runBuildSessionManifest, 'powerbuilder.runBuildSessionManifest');
            assert.strictEqual(api.commands.exportBuildSessionManifest, 'powerbuilder.exportBuildSessionManifest');
            assert.strictEqual(typeof api.exportWorkspaceBuildPreference, 'function');
            assert.strictEqual(typeof api.exportWorkspaceManifestDiff, 'function');
            assert.strictEqual(typeof api.runWorkspaceBuildPreference, 'function');
            assert.strictEqual(typeof api.runActiveHierarchyInspection, 'function');
            assert.strictEqual(typeof api.runAncestorScriptInspection, 'function');
            assert.strictEqual(typeof api.runBuildSessionManifest, 'function');
            assert.strictEqual(typeof api.exportBuildSessionManifest, 'function');
            assert.ok(result);
            assert.strictEqual(result.payload.kind, 'powerbuilder-automation-surface');
            assert.strictEqual(result.payload.extensionApi.extensionId, 'lopez.almunia-powersyntax');
            assert.ok(result.payload.languageModelTools.some(tool => tool.name === 'powerbuilder-build-session-manifest'));
            assert.strictEqual(result.file.relativePath, 'docs/generated/powerbuilder/exports/automation/automation-surface.json');
            assert.ok(contractCatalog);
            assert.strictEqual(contractCatalog.payload.kind, 'powerbuilder-public-contract-catalog');
            assert.ok(contractCatalog.payload.commands.some(command => command.command === 'powerbuilder.runSemanticQueryBatch' && command.schemaPublished));
            assert.ok(contractCatalog.payload.commands.some(command => command.command === 'powerbuilder.runBuildSessionManifest' && command.schemaPublished));
            assert.ok(contractCatalog.payload.commands.some(command => command.command === 'powerbuilder.runWorkspaceBuildPreference' && command.schemaPublished));
            assert.ok(contractCatalog.payload.commands.some(command => command.command === 'powerbuilder.exportWorkspaceBuildPreference' && command.schemaPublished));
            assert.ok(contractCatalog.payload.commands.some(command => command.command === 'powerbuilder.exportWorkspaceManifestDiff' && command.schemaPublished));
            assert.ok(contractCatalog.payload.languageModelTools.some(tool => tool.name === 'powerbuilder-active-hierarchy-inspection'));
            assert.strictEqual(contractCatalog.file.relativePath, 'docs/generated/powerbuilder/exports/contracts/public-contract-catalog.json');
        } finally {
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.runSemanticQueryBatch agrupa queries semánticas reproducibles sin abrir otro runtime', async () => {
        const baseRelativePath = path.join('phase6-generated', 'run-semantic-query-batch-command');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'demo.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/n_query_batch.sru': [
                    'forward',
                    'global type n_query_batch from nonvisualobject',
                    'end type',
                    'end forward',
                    '',
                    'global type n_query_batch from nonvisualobject',
                    'end type',
                    'global n_query_batch n_query_batch',
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

            const document = await vscode.workspace.openTextDocument(uris['app.pbl/n_query_batch.sru']);
            const firstCallOffset = document.getText().indexOf('of_run()');
            const secondCallOffset = document.getText().indexOf('of_run()', firstCallOffset + 1);

            assert.ok(firstCallOffset >= 0, 'Expected first of_run() call in batch fixture');
            assert.ok(secondCallOffset >= 0, 'Expected second of_run() call in batch fixture');

            const firstPosition = document.positionAt(firstCallOffset + 2);
            const secondPosition = document.positionAt(secondCallOffset + 2);

            const result = await vscode.commands.executeCommand<{
                kind: string;
                payload: {
                    kind: string;
                    summary: { requestCount: number; generatedCount: number; stoppedEarly: boolean };
                    items: Array<{ label?: string; resultKind: string; payload?: { kind: string; document: { word: string } } }>;
                };
            }>('powerbuilder.runSemanticQueryBatch', {
                requests: [
                    {
                        label: 'first-call',
                        uri: document.uri.toString(),
                        line: firstPosition.line,
                        character: firstPosition.character,
                    },
                    {
                        label: 'second-call',
                        uri: document.uri.toString(),
                        line: secondPosition.line,
                        character: secondPosition.character,
                    },
                ],
            });

            assert.ok(result);
            assert.strictEqual(result.kind, 'generated');
            assert.strictEqual(result.payload.kind, 'powerbuilder-semantic-query-batch');
            assertPayloadMatchesPublicSchema(result.payload);
            assert.strictEqual(result.payload.summary.requestCount, 2);
            assert.strictEqual(result.payload.summary.generatedCount, 2);
            assert.strictEqual(result.payload.summary.stoppedEarly, false);
            assert.strictEqual(result.payload.items[0].label, 'first-call');
            assert.strictEqual(result.payload.items[0].resultKind, 'generated');
            assert.strictEqual(result.payload.items[0].payload?.kind, 'powerbuilder-semantic-query');
            assert.strictEqual(result.payload.items[0].payload?.document.word, 'of_run');
            assert.strictEqual(result.payload.items[1].label, 'second-call');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportPublicContractSchemas genera schemas públicos versionados para la surface exportable', async () => {
        try {
            await removeGeneratedDocumentation();

            await vscode.commands.executeCommand('powerbuilder.exportPublicContractSchemas');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/contracts/public-contract-schemas.json',
            ));

            assert.strictEqual(payload.kind, 'powerbuilder-public-contract-schemas');
            assertPayloadMatchesPublicSchema(payload);
            assert.ok(payload.summary.schemaCount >= 10);
            assert.ok(payload.schemas.some((schema: { payloadKind: string; relativePath: string }) =>
                schema.payloadKind === 'powerbuilder-workspace-manifest'
                && schema.relativePath === 'contracts/schemas/powerbuilder-workspace-manifest.schema.json',
            ));

            const workspaceManifestSchema = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/contracts/schemas/powerbuilder-workspace-manifest.schema.json',
            ));

            assert.strictEqual(workspaceManifestSchema.$id, 'https://github.com/dlsanchez-hiberuscom/almunia-powersyntax/schemas/powerbuilder-workspace-manifest.schema.json');
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'public-contract-schemas.json');
        } finally {
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportPublicContractCatalog publica comandos, métodos API y schemas públicos alineados', async () => {
        try {
            await removeGeneratedDocumentation();

            await vscode.commands.executeCommand('powerbuilder.exportPublicContractCatalog');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/contracts/public-contract-catalog.json',
            ));
            const batchCommand = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.runSemanticQueryBatch',
            );
            const bundleCommand = payload.commands.find((command: { command: string }) =>
                command.command === 'powerbuilder.exportWorkspaceArtifactBundle',
            );

            assert.strictEqual(payload.kind, 'powerbuilder-public-contract-catalog');
            assertPayloadMatchesPublicSchema(payload);
            assert.ok(payload.extensionApi.methods.some((method: { name: string }) => method.name === 'exportPublicContractCatalog'));
            assert.ok(batchCommand);
            assert.strictEqual(batchCommand.schemaPublished, true);
            assert.strictEqual(batchCommand.schemaRelativePath, 'contracts/schemas/powerbuilder-semantic-query-batch.schema.json');
            assert.ok(bundleCommand);
            assert.strictEqual(bundleCommand.schemaRelativePath, 'contracts/schemas/powerbuilder-workspace-artifact-bundle.schema.json');
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'public-contract-catalog.json');
        } finally {
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportWorkspaceArtifactBundle empaqueta artefactos workspace-wide y degrada si falta release report', async () => {
        try {
            await removeGeneratedDocumentation();

            await vscode.commands.executeCommand('powerbuilder.exportWorkspaceArtifactBundle');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/workspace/workspace-artifact-bundle.json',
            ));

            assert.strictEqual(payload.kind, 'powerbuilder-workspace-artifact-bundle');
            assertPayloadMatchesPublicSchema(payload);
            assert.ok(payload.summary.artifactCount >= 5);
            assert.strictEqual(payload.releaseValidationReport.status, 'missing');
            assert.strictEqual(payload.bundle.workspaceManifest.kind, 'powerbuilder-workspace-manifest');
            assert.strictEqual(payload.bundle.publicContractCatalog.kind, 'powerbuilder-public-contract-catalog');
            assert.ok(payload.artifacts.some((artifact: { artifactKind: string }) => artifact.artifactKind === 'workspace-manifest'));
            assert.ok(payload.artifacts.some((artifact: { artifactKind: string }) => artifact.artifactKind === 'public-contract-catalog'));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'workspace-artifact-bundle.json');
        } finally {
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportBuildContractCatalog publica comandos, schemas y tool visible del loop de build', async () => {
        try {
            await removeGeneratedDocumentation();

            await vscode.commands.executeCommand('powerbuilder.exportBuildContractCatalog');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/contracts/build-contract-catalog.json',
            ));

            assert.strictEqual(payload.kind, 'powerbuilder-build-contract-catalog');
            assertPayloadMatchesPublicSchema(payload);
            assert.ok(payload.commands.some((command: { command: string }) => command.command === 'powerbuilder.runBuildSessionManifest'));
            assert.ok(payload.commands.some((command: { command: string }) => command.command === 'powerbuilder.runWorkspaceBuildPreference'));
            assert.ok(payload.commands.some((command: { command: string }) => command.command === 'powerbuilder.exportWorkspaceBuildPreference'));
            assert.ok(payload.commands.some((command: { command: string }) => command.command === 'powerbuilder.exportWorkspaceManifestDiff'));
            assert.ok(payload.schemas.some((schema: { payloadKind: string }) => schema.payloadKind === 'powerbuilder-build-session-manifest'));
            assert.ok(payload.schemas.some((schema: { payloadKind: string }) => schema.payloadKind === 'powerbuilder-workspace-build-preference'));
            assert.ok(payload.languageModelTools.some((tool: { name: string }) => tool.name === 'powerbuilder-build-session-manifest'));
            assert.ok(payload.sessionContracts.lastTargetFields.includes('storedAt'));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'build-contract-catalog.json');
        } finally {
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportHostContributionInventory y exportAutomationCoverageAudit cruzan host, package y surface pública', async () => {
        try {
            await removeGeneratedDocumentation();

            await vscode.commands.executeCommand('powerbuilder.exportHostContributionInventory');
            await vscode.commands.executeCommand('powerbuilder.exportAutomationCoverageAudit');

            const inventoryPayload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/automation/host-contribution-inventory.json',
            ));
            const auditPayload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/automation/automation-coverage-audit.json',
            ));

            assert.strictEqual(inventoryPayload.kind, 'powerbuilder-host-contribution-inventory');
            assertPayloadMatchesPublicSchema(inventoryPayload);
            assert.ok(inventoryPayload.commands.some((command: { command: string; registered: boolean }) =>
                command.command === 'powerbuilder.exportAutomationCoverageAudit' && command.registered,
            ));
            assert.ok(inventoryPayload.commands.some((command: { command: string; structured: boolean }) =>
                command.command === 'powerbuilder.exportHostContributionInventory' && command.structured,
            ));
            assert.ok(inventoryPayload.extensionApiMethods.some((method: { name: string; registered: boolean }) =>
                method.name === 'runWorkspaceBuildPreference' && method.registered,
            ));
            assert.ok(inventoryPayload.languageModelTools.some((tool: { name: string }) =>
                tool.name === 'powerbuilder-build-session-manifest',
            ));

            assert.strictEqual(auditPayload.kind, 'powerbuilder-automation-coverage-audit');
            assertPayloadMatchesPublicSchema(auditPayload);
            assert.ok(Array.isArray(auditPayload.coverage.automationCommandsMissingFromPackageJson));
            assert.ok(Array.isArray(auditPayload.coverage.publicCatalogCommandsMissingSchema));
            assert.ok(auditPayload.notes.some((note: string) => note.includes('package.json -> automationSurface')));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'automation-coverage-audit.json');
        } finally {
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportPublicContractCatalogDiff y exportWorkspaceArtifactBundleDiff comparan surfaces versionadas', async () => {
        try {
            await removeGeneratedDocumentation();

            await vscode.commands.executeCommand('powerbuilder.exportPublicContractCatalog');
            await vscode.commands.executeCommand('powerbuilder.exportWorkspaceArtifactBundle');

            const publicCatalog = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/contracts/public-contract-catalog.json',
            ));
            const workspaceBundle = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/workspace/workspace-artifact-bundle.json',
            ));
            const leftCatalogRelativePath = 'phase6-generated/public-contract-catalog-diff/left-catalog.json';
            const rightCatalogRelativePath = 'phase6-generated/public-contract-catalog-diff/right-catalog.json';
            const leftBundleRelativePath = 'phase6-generated/workspace-artifact-bundle-diff/left-bundle.json';
            const rightBundleRelativePath = 'phase6-generated/workspace-artifact-bundle-diff/right-bundle.json';
            const leftCatalogUri = getWorkspaceTestUri(leftCatalogRelativePath);
            const rightCatalogUri = getWorkspaceTestUri(rightCatalogRelativePath);
            const leftBundleUri = getWorkspaceTestUri(leftBundleRelativePath);
            const rightBundleUri = getWorkspaceTestUri(rightBundleRelativePath);
            const mutatedCatalog = structuredClone(publicCatalog);
            const mutatedBundle = structuredClone(workspaceBundle);

            mutatedCatalog.commands[0].title = `${mutatedCatalog.commands[0].title} (diff)`;
            mutatedCatalog.schemas.push({
                payloadKind: 'powerbuilder-test-contract',
                title: 'PowerBuilder Test Contract',
                relativePath: 'contracts/schemas/test-contract.schema.json',
                schemaId: 'powerbuilder-test-contract.schema.json',
            });
            mutatedBundle.bundle.automationSurface.commands[0].notes = [
                ...mutatedBundle.bundle.automationSurface.commands[0].notes,
                'bundle diff probe',
            ];
            mutatedBundle.bundle.publicContractCatalog.commands[0].title = `${mutatedBundle.bundle.publicContractCatalog.commands[0].title} (bundle diff)`;
            mutatedBundle.bundle.featureSupportSnapshot.summary.noteCount += 1;
            mutatedBundle.bundle.featureSupportSnapshot.productNotes = [
                ...mutatedBundle.bundle.featureSupportSnapshot.productNotes,
                'bundle diff probe',
            ];
            mutatedBundle.releaseValidationReport = {
                status: 'invalid',
                relativePath: workspaceBundle.releaseValidationReport.relativePath,
                reason: 'bundle diff probe',
            };

            await fs.mkdir(path.dirname(leftCatalogUri.fsPath), { recursive: true });
            await fs.mkdir(path.dirname(leftBundleUri.fsPath), { recursive: true });
            await fs.writeFile(leftCatalogUri.fsPath, `${JSON.stringify(publicCatalog, null, 2)}\n`, 'utf8');
            await fs.writeFile(rightCatalogUri.fsPath, `${JSON.stringify(mutatedCatalog, null, 2)}\n`, 'utf8');
            await fs.writeFile(leftBundleUri.fsPath, `${JSON.stringify(workspaceBundle, null, 2)}\n`, 'utf8');
            await fs.writeFile(rightBundleUri.fsPath, `${JSON.stringify(mutatedBundle, null, 2)}\n`, 'utf8');

            await vscode.commands.executeCommand('powerbuilder.exportPublicContractCatalogDiff', {
                leftUri: leftCatalogUri,
                rightUri: rightCatalogUri,
            });
            await vscode.commands.executeCommand('powerbuilder.exportWorkspaceArtifactBundleDiff', {
                leftUri: leftBundleUri,
                rightUri: rightBundleUri,
            });

            const publicDiffPayload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/diffs/left-catalog.vs.right-catalog.public-contract-catalog-diff.json',
            ));
            const bundleDiffPayload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/diffs/left-bundle.vs.right-bundle.workspace-artifact-bundle-diff.json',
            ));

            assert.strictEqual(publicDiffPayload.kind, 'powerbuilder-public-contract-catalog-diff');
            assertPayloadMatchesPublicSchema(publicDiffPayload);
            assert.ok(publicDiffPayload.summary.changedCommands > 0);
            assert.ok(publicDiffPayload.summary.addedSchemas > 0);
            assert.ok(publicDiffPayload.commands.changed.some((entry: { command: string }) => entry.command === publicCatalog.commands[0].command));
            assert.ok(publicDiffPayload.schemas.added.includes('powerbuilder-test-contract'));

            assert.strictEqual(bundleDiffPayload.kind, 'powerbuilder-workspace-artifact-bundle-diff');
            assertPayloadMatchesPublicSchema(bundleDiffPayload);
            assert.ok(bundleDiffPayload.summary.changedSections > 0);
            assert.ok(bundleDiffPayload.artifacts.changed.includes('automation-surface'));
            assert.ok(bundleDiffPayload.artifacts.changed.includes('public-contract-catalog'));
            assert.ok(bundleDiffPayload.artifacts.changed.includes('feature-support-snapshot'));
            assert.strictEqual(bundleDiffPayload.releaseValidationReport.changed, true);
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'left-bundle.vs.right-bundle.workspace-artifact-bundle-diff.json');
        } finally {
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportCacheInvalidationSnapshot publica snapshotStore, artifact cache e indexing audit vigentes', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-cache-invalidation-snapshot');
        const projectName = 'demo_cache_snapshot';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="demo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/n_cache_snapshot.sru': [
                    'forward',
                    'global type n_cache_snapshot from nonvisualobject',
                    'end type',
                    'end forward',
                    '',
                    'global type n_cache_snapshot from nonvisualobject',
                    'end type',
                    'global n_cache_snapshot n_cache_snapshot',
                    '',
                    'public function long of_run (long al_value);',
                    'return al_value + 1',
                    'end function',
                ].join('\n'),
                'app.pbl/n_cache_snapshot_helper.sru': [
                    'forward',
                    'global type n_cache_snapshot_helper from nonvisualobject',
                    'end type',
                    'end forward',
                    '',
                    'global type n_cache_snapshot_helper from nonvisualobject',
                    'end type',
                    'global n_cache_snapshot_helper n_cache_snapshot_helper',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['app.pbl/n_cache_snapshot.sru']);
            await vscode.window.showTextDocument(document);

            await vscode.commands.executeCommand('powerbuilder.exportSemanticDocument');
            await PowerBuilderWorkspaceSnapshotStore.getInstance().getSnapshot(uris['app.pbl/n_cache_snapshot_helper.sru']);
            await vscode.commands.executeCommand('powerbuilder.exportCacheInvalidationSnapshot');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/workspace/cache-invalidation-snapshot.json',
            ));

            assert.strictEqual(payload.kind, 'powerbuilder-cache-invalidation-snapshot');
            assertPayloadMatchesPublicSchema(payload);
            assert.ok(payload.summary.snapshotCacheEntryCount >= 1);
            assert.ok(payload.summary.artifactPayloadCacheEntryCount >= 1);
            assert.ok(payload.snapshotCache.entries.some((entry: { relativePath: string }) =>
                entry.relativePath.endsWith('n_cache_snapshot_helper.sru'),
            ));
            assert.ok(payload.artifactPayloadCache.entries.some((entry: { payloadKind?: string }) =>
                entry.payloadKind === 'powerbuilder-semantic-document',
            ));
            assert.ok(payload.invalidationSurface.reasons.includes('snapshot-store-entries'));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'cache-invalidation-snapshot.json');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportSemanticSnapshotDiff genera un diff semántico entre dos semantic-project snapshots exportados', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-semantic-snapshot-diff');

        try {
            const leftSnapshot = {
                kind: 'powerbuilder-semantic-project',
                schemaVersion: 1,
                generatedAt: '2026-01-01T00:00:00.000Z',
                project: {
                    uri: 'file:///demo/demo.pbproj',
                    relativePath: 'demo.pbproj',
                    name: 'demo',
                    projectDirectoryPath: '.',
                    libraries: [],
                    libraryPaths: [],
                    effectiveRootPaths: [],
                },
                summary: {
                    fileCount: 1,
                    symbolCount: 2,
                    callableCount: 1,
                    typeCount: 1,
                },
                files: [
                    {
                        uri: 'file:///demo/app.pbl/w_demo.srw',
                        relativePath: 'app.pbl/w_demo.srw',
                        objectName: 'w_demo',
                        symbols: [
                            {
                                persistentId: 'type:w_demo',
                                name: 'w_demo',
                                kind: 'type',
                                uri: 'file:///demo/app.pbl/w_demo.srw',
                                relativePath: 'app.pbl/w_demo.srw',
                                range: { start: { line: 0, character: 0 }, end: { line: 3, character: 0 } },
                                selectionRange: { start: { line: 0, character: 12 }, end: { line: 0, character: 18 } },
                            },
                            {
                                persistentId: 'callable:of_run',
                                name: 'of_run',
                                kind: 'function',
                                uri: 'file:///demo/app.pbl/w_demo.srw',
                                relativePath: 'app.pbl/w_demo.srw',
                                range: { start: { line: 4, character: 0 }, end: { line: 6, character: 0 } },
                                selectionRange: { start: { line: 4, character: 21 }, end: { line: 4, character: 27 } },
                            },
                        ],
                        callables: [
                            {
                                persistentId: 'callable:of_run',
                                name: 'of_run',
                                kind: 'function',
                                uri: 'file:///demo/app.pbl/w_demo.srw',
                                relativePath: 'app.pbl/w_demo.srw',
                                range: { start: { line: 4, character: 0 }, end: { line: 6, character: 0 } },
                                selectionRange: { start: { line: 4, character: 21 }, end: { line: 4, character: 27 } },
                            },
                        ],
                    },
                ],
            };
            const rightSnapshot = {
                kind: 'powerbuilder-semantic-project',
                schemaVersion: 1,
                generatedAt: '2026-01-02T00:00:00.000Z',
                project: {
                    uri: 'file:///demo/demo.pbproj',
                    relativePath: 'demo.pbproj',
                    name: 'demo',
                    projectDirectoryPath: '.',
                    libraries: [],
                    libraryPaths: [],
                    effectiveRootPaths: [],
                },
                summary: {
                    fileCount: 2,
                    symbolCount: 4,
                    callableCount: 2,
                    typeCount: 2,
                },
                files: [
                    {
                        uri: 'file:///demo/app.pbl/w_demo.srw',
                        relativePath: 'app.pbl/w_demo.srw',
                        objectName: 'w_demo',
                        symbols: [
                            {
                                persistentId: 'type:w_demo',
                                name: 'w_demo',
                                kind: 'type',
                                uri: 'file:///demo/app.pbl/w_demo.srw',
                                relativePath: 'app.pbl/w_demo.srw',
                                range: { start: { line: 0, character: 0 }, end: { line: 3, character: 0 } },
                                selectionRange: { start: { line: 0, character: 12 }, end: { line: 0, character: 18 } },
                            },
                            {
                                persistentId: 'callable:of_execute',
                                name: 'of_execute',
                                kind: 'function',
                                uri: 'file:///demo/app.pbl/w_demo.srw',
                                relativePath: 'app.pbl/w_demo.srw',
                                range: { start: { line: 4, character: 0 }, end: { line: 6, character: 0 } },
                                selectionRange: { start: { line: 4, character: 21 }, end: { line: 4, character: 31 } },
                            },
                        ],
                        callables: [
                            {
                                persistentId: 'callable:of_execute',
                                name: 'of_execute',
                                kind: 'function',
                                uri: 'file:///demo/app.pbl/w_demo.srw',
                                relativePath: 'app.pbl/w_demo.srw',
                                range: { start: { line: 4, character: 0 }, end: { line: 6, character: 0 } },
                                selectionRange: { start: { line: 4, character: 21 }, end: { line: 4, character: 31 } },
                            },
                        ],
                    },
                    {
                        uri: 'file:///demo/app.pbl/u_new.sru',
                        relativePath: 'app.pbl/u_new.sru',
                        objectName: 'u_new',
                        symbols: [
                            {
                                persistentId: 'type:u_new',
                                name: 'u_new',
                                kind: 'type',
                                uri: 'file:///demo/app.pbl/u_new.sru',
                                relativePath: 'app.pbl/u_new.sru',
                                range: { start: { line: 0, character: 0 }, end: { line: 2, character: 0 } },
                                selectionRange: { start: { line: 0, character: 12 }, end: { line: 0, character: 17 } },
                            },
                        ],
                        callables: [],
                    },
                ],
            };
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'left-project.json': JSON.stringify(leftSnapshot, null, 2),
                'right-project.json': JSON.stringify(rightSnapshot, null, 2),
            });

            await vscode.commands.executeCommand('powerbuilder.exportSemanticSnapshotDiff', {
                leftUri: uris['left-project.json'].toString(),
                rightUri: uris['right-project.json'].toString(),
            });

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/diffs/left-project.vs.right-project.semantic-snapshot-diff.json',
            ));

            assert.strictEqual(payload.kind, 'powerbuilder-semantic-snapshot-diff');
            assert.strictEqual(payload.snapshotKind, 'powerbuilder-semantic-project');
            assert.strictEqual(payload.summary.addedFiles, 1);
            assert.strictEqual(payload.summary.changedFiles, 1);
            assert.strictEqual(payload.summary.addedSymbols, 1);
            assert.strictEqual(payload.summary.removedSymbols, 1);
            assert.strictEqual(payload.summary.addedCallables, 1);
            assert.strictEqual(payload.summary.removedCallables, 1);
            assert.ok(payload.files.added.some((file: { relativePath: string }) => file.relativePath === 'app.pbl/u_new.sru'));
            assert.ok(payload.files.changed.some((file: {
                relativePath: string;
                addedSymbols: Array<{ name: string }>;
                removedSymbols: Array<{ name: string }>;
            }) => file.relativePath === 'app.pbl/w_demo.srw'
                && file.addedSymbols.some(symbol => symbol.name === 'of_execute')
                && file.removedSymbols.some(symbol => symbol.name === 'of_run')));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'left-project.vs.right-project.semantic-snapshot-diff.json');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportWorkspaceManifestDiff compara manifests y bundles orientados a build e invalidation', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-workspace-manifest-diff');

        try {
            const leftManifest = {
                kind: 'powerbuilder-workspace-manifest',
                schemaVersion: 1,
                generatedAt: '2026-04-26T00:00:00.000Z',
                workspace: {
                    folders: [{ uri: 'file:///demo', relativePath: '.', name: 'demo' }],
                    projectCount: 1,
                    indexingExcludePatterns: [],
                    retainedEffectiveRootKeys: ['demo/app.pbl'],
                    anchorUri: 'file:///demo/app.pbl/u_alpha.sru',
                    anchorRelativePath: 'app.pbl/u_alpha.sru',
                    preferredProject: {
                        uri: 'file:///demo/alpha.pbproj',
                        relativePath: 'alpha.pbproj',
                        name: 'alpha',
                        projectDirectoryPath: '.',
                        libraries: [],
                        libraryPaths: [],
                        effectiveRootPaths: ['app.pbl'],
                    },
                    matchingProjectsForAnchor: [],
                    preferredBuildTarget: {
                        uri: 'file:///demo/alpha.pbproj',
                        relativePath: 'alpha.pbproj',
                        name: 'alpha',
                        kind: 'project',
                        precision: 'exact',
                        relation: 'self-project',
                        reason: 'exact',
                    },
                    matchingBuildTargetsForAnchor: [],
                    buildableTargetCount: 1,
                    buildableTargets: [
                        {
                            uri: 'file:///demo/alpha.pbproj',
                            relativePath: 'alpha.pbproj',
                            name: 'alpha',
                            kind: 'project',
                            buildArgs: ['/pbc', '/c', 'alpha.pbproj'],
                            relatedProjects: [
                                {
                                    projectName: 'alpha',
                                    projectUri: 'file:///demo/alpha.pbproj',
                                    projectRelativePath: 'alpha.pbproj',
                                    precision: 'exact',
                                    relation: 'self-project',
                                    reason: 'exact',
                                },
                            ],
                        },
                    ],
                    indexingAudit: {
                        indexedFileCount: 4,
                        indexedSymbolCount: 10,
                        snapshotCacheEntryCount: 1,
                        artifactPayloadCacheEntryCount: 1,
                        unassignedIndexedFileCount: 0,
                        unassignedIndexedFiles: [],
                        staleIndexedFileCount: 0,
                        staleIndexedFiles: [],
                    },
                    incrementalImpact: {
                        anchorUri: 'file:///demo/app.pbl/u_alpha.sru',
                        anchorRelativePath: 'app.pbl/u_alpha.sru',
                        impactedProjects: [],
                        impactedBuildTargets: [],
                    },
                },
                projects: [
                    {
                        uri: 'file:///demo/alpha.pbproj',
                        relativePath: 'alpha.pbproj',
                        name: 'alpha',
                        projectDirectoryPath: '.',
                        libraries: [],
                        libraryPaths: [],
                        effectiveRootPaths: ['app.pbl'],
                        sourceRootPaths: ['app.pbl'],
                        sourceRootKeys: ['demo/app.pbl'],
                        excludedRootPaths: [],
                        excludedRootKeys: [],
                        isPreferredForAnchor: true,
                    },
                ],
                graph: {
                    summary: { nodeCount: 1, edgeCount: 0, buildTargetProjectEdgeCount: 0, projectLibraryEdgeCount: 0, librarySourceEdgeCount: 0 },
                    nodes: [],
                    edges: [],
                },
            };
            const rightManifest = {
                ...leftManifest,
                generatedAt: '2026-04-27T00:00:00.000Z',
                workspace: {
                    ...leftManifest.workspace,
                    projectCount: 2,
                    retainedEffectiveRootKeys: ['demo/app.pbl', 'demo/shared.pbl'],
                    preferredProject: {
                        uri: 'file:///demo/beta.pbproj',
                        relativePath: 'beta.pbproj',
                        name: 'beta',
                        projectDirectoryPath: '.',
                        libraries: [],
                        libraryPaths: [],
                        effectiveRootPaths: ['shared.pbl'],
                    },
                    preferredBuildTarget: {
                        uri: 'file:///demo/demo.pbw',
                        relativePath: 'demo.pbw',
                        name: 'demo',
                        kind: 'workspace',
                        precision: 'exact',
                        relation: 'declared-build-member',
                        reason: 'declared',
                    },
                    buildableTargetCount: 2,
                    buildableTargets: [
                        ...leftManifest.workspace.buildableTargets,
                        {
                            uri: 'file:///demo/demo.pbw',
                            relativePath: 'demo.pbw',
                            name: 'demo',
                            kind: 'workspace',
                            buildArgs: ['/pbc', '/c', 'demo.pbw'],
                            relatedProjects: [
                                {
                                    projectName: 'beta',
                                    projectUri: 'file:///demo/beta.pbproj',
                                    projectRelativePath: 'beta.pbproj',
                                    precision: 'exact',
                                    relation: 'declared-build-member',
                                    reason: 'declared',
                                },
                            ],
                        },
                    ],
                    indexingAudit: {
                        indexedFileCount: 6,
                        indexedSymbolCount: 14,
                        snapshotCacheEntryCount: 3,
                        artifactPayloadCacheEntryCount: 2,
                        unassignedIndexedFileCount: 1,
                        unassignedIndexedFiles: ['orphan.sru'],
                        staleIndexedFileCount: 1,
                        staleIndexedFiles: ['old.sru'],
                    },
                },
                projects: [
                    leftManifest.projects[0],
                    {
                        uri: 'file:///demo/beta.pbproj',
                        relativePath: 'beta.pbproj',
                        name: 'beta',
                        projectDirectoryPath: '.',
                        libraries: [],
                        libraryPaths: [],
                        effectiveRootPaths: ['shared.pbl'],
                        sourceRootPaths: ['shared.pbl'],
                        sourceRootKeys: ['demo/shared.pbl'],
                        excludedRootPaths: [],
                        excludedRootKeys: [],
                        isPreferredForAnchor: true,
                    },
                ],
            };
            const rightBundle = {
                kind: 'powerbuilder-workspace-artifact-bundle',
                schemaVersion: 1,
                generatedAt: '2026-04-27T00:00:00.000Z',
                summary: {
                    artifactCount: 1,
                    includesReleaseValidationReport: false,
                },
                artifacts: [],
                bundle: {
                    workspaceManifest: rightManifest,
                    automationSurface: {
                        kind: 'powerbuilder-automation-surface',
                        schemaVersion: 1,
                        generatedAt: '2026-04-27T00:00:00.000Z',
                        extensionApi: { extensionId: 'lopez.almunia-powersyntax', apiVersion: 1, methods: [] },
                        languageModelTools: [],
                        commands: [],
                    },
                    workspaceDiagnosticsTree: {
                        kind: 'powerbuilder-workspace-diagnostics-tree',
                        schemaVersion: 1,
                        generatedAt: '2026-04-27T00:00:00.000Z',
                        summary: { projectCount: 0, objectCount: 0, diagnosticCount: 0, errorCount: 0, warningCount: 0 },
                        projects: [],
                    },
                    featureSupportSnapshot: {
                        kind: 'powerbuilder-feature-support-snapshot',
                        schemaVersion: 1,
                        generatedAt: '2026-04-27T00:00:00.000Z',
                        source: { uri: 'file:///demo/docs/reference/feature-support-matrix.md', relativePath: 'docs/reference/feature-support-matrix.md' },
                        levels: [],
                        summary: { featureCount: 0, noteCount: 0, powerScriptLevels: [], dataWindowLevels: [] },
                        entries: [],
                        productNotes: [],
                    },
                    buildSessionManifest: {
                        kind: 'powerbuilder-build-session-manifest',
                        schemaVersion: 1,
                        generatedAt: '2026-04-27T00:00:00.000Z',
                        summary: { hasLastTarget: false, hasLastBuild: false },
                    },
                    publicContractCatalog: {
                        kind: 'powerbuilder-public-contract-catalog',
                        schemaVersion: 1,
                        generatedAt: '2026-04-27T00:00:00.000Z',
                        extensionApi: { extensionId: 'lopez.almunia-powersyntax', apiVersion: 1, methods: [] },
                        languageModelTools: [],
                        commands: [],
                        schemas: [],
                    },
                },
                releaseValidationReport: {
                    status: 'missing',
                    relativePath: 'docs/generated/powerbuilder/exports/release/release-validation-report.json',
                },
            };
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'left-workspace-manifest.json': JSON.stringify(leftManifest, null, 2),
                'right-workspace-bundle.json': JSON.stringify(rightBundle, null, 2),
            });

            await vscode.commands.executeCommand('powerbuilder.exportWorkspaceManifestDiff', {
                leftUri: uris['left-workspace-manifest.json'].toString(),
                rightUri: uris['right-workspace-bundle.json'].toString(),
            });

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/diffs/left-workspace-manifest.vs.right-workspace-bundle.workspace-manifest-diff.json',
            ));

            assert.strictEqual(payload.kind, 'powerbuilder-workspace-manifest-diff');
            assertPayloadMatchesPublicSchema(payload);
            assert.strictEqual(payload.snapshotKind, 'powerbuilder-workspace-manifest');
            assert.strictEqual(payload.inputs.left.sourceKind, 'workspace-manifest');
            assert.strictEqual(payload.inputs.right.sourceKind, 'workspace-artifact-bundle');
            assert.strictEqual(payload.summary.addedProjects, 1);
            assert.strictEqual(payload.summary.addedBuildTargets, 1);
            assert.strictEqual(payload.summary.addedRetainedRoots, 1);
            assert.strictEqual(payload.summary.preferredProjectChanged, true);
            assert.strictEqual(payload.summary.preferredBuildTargetChanged, true);
            assert.strictEqual(payload.summary.indexingAuditChanged, true);
            assert.ok(payload.workspace.retainedEffectiveRootKeys.added.includes('demo/shared.pbl'));
            assert.ok(payload.workspace.projects.added.some((project: { name: string }) => project.name === 'beta'));
            assert.ok(payload.workspace.buildableTargets.added.some((target: { kind: string }) => target.kind === 'workspace'));
            assert.ok(payload.invalidation.rootsChanged);
            assert.ok(payload.invalidation.buildGraphChanged);
            assert.ok(payload.invalidation.cacheSurfaceChanged);
            assert.ok(payload.invalidation.likelyImpactedArtifacts.includes('powerbuilder-workspace-artifact-bundle'));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'left-workspace-manifest.vs.right-workspace-bundle.workspace-manifest-diff.json');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportFeatureSupportSnapshot serializa la matriz canónica de soporte real en JSON versionable', async () => {
        try {
            await vscode.commands.executeCommand('powerbuilder.exportFeatureSupportSnapshot');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/support/feature-support-snapshot.json',
            ));

            assert.strictEqual(payload.kind, 'powerbuilder-feature-support-snapshot');
            assert.strictEqual(payload.source.relativePath, 'docs/reference/feature-support-matrix.md');
            assert.strictEqual(payload.summary.featureCount, payload.entries.length);
            assert.ok(payload.levels.some((level: { level: string }) => level.level === 'exacto'));
            assert.ok(payload.entries.some((entry: { feature: string; powerScript: string }) =>
                entry.feature === 'Diagnostics' && entry.powerScript === 'heuristico',
            ));
            assert.ok(payload.productNotes.length >= 1);
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'feature-support-snapshot.json');
        } finally {
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportWorkspaceDiagnosticsTree serializa el agrupado workspace-wide de diagnostics en JSON versionable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-workspace-diagnostics-tree');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const projectRegistry = PowerBuilderProjectRegistry.getInstance();
        const collection = vscode.languages.createDiagnosticCollection('powerbuilder-export-diagnostics-tree-test');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'project-a/u_alpha_main.sru': [
                    'global type u_alpha_main from nonvisualobject',
                    'end type',
                    'global u_alpha_main u_alpha_main',
                    '',
                    'public function long of_alpha ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'project-b/u_beta_main.sru': [
                    'global type u_beta_main from nonvisualobject',
                    'end type',
                    'global u_beta_main u_beta_main',
                    '',
                    'public function long of_beta ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'build/demo.pbw': 'workspace build target',
            });

            projectRegistry.setProject({
                uri: vscode.Uri.file(path.join(path.dirname(uris['project-a/u_alpha_main.sru'].fsPath), 'alpha.pbproj')),
                name: 'Alpha',
                projectDirectoryUri: vscode.Uri.file(path.dirname(uris['project-a/u_alpha_main.sru'].fsPath)),
                appEntryUri: vscode.Uri.file(path.dirname(uris['project-a/u_alpha_main.sru'].fsPath)),
                libraries: [],
                libraryUris: [],
            });
            projectRegistry.setProject({
                uri: vscode.Uri.file(path.join(path.dirname(uris['project-b/u_beta_main.sru'].fsPath), 'beta.pbproj')),
                name: 'Beta',
                projectDirectoryUri: vscode.Uri.file(path.dirname(uris['project-b/u_beta_main.sru'].fsPath)),
                appEntryUri: vscode.Uri.file(path.dirname(uris['project-b/u_beta_main.sru'].fsPath)),
                libraries: [],
                libraryUris: [],
            });

            await indexer.indexFile(uris['project-a/u_alpha_main.sru']);
            await indexer.indexFile(uris['project-b/u_beta_main.sru']);

            const alphaDiagnostic = new vscode.Diagnostic(
                new vscode.Range(4, 0, 4, 10),
                'Variable local no usada',
                vscode.DiagnosticSeverity.Warning,
            );
            alphaDiagnostic.source = 'PowerBuilder';
            alphaDiagnostic.code = 'pb-unused-local-variable';

            const betaDiagnostic = new vscode.Diagnostic(
                new vscode.Range(4, 0, 4, 8),
                'Llamada ambigua',
                vscode.DiagnosticSeverity.Error,
            );
            betaDiagnostic.source = 'PowerBuilder';
            betaDiagnostic.code = 'pb-ambiguous-call';

            const buildDiagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 0),
                'C0001: Illegal data type',
                vscode.DiagnosticSeverity.Error,
            );
            buildDiagnostic.source = 'PBAutoBuild';
            buildDiagnostic.code = 'C0001/0004';

            collection.set(uris['project-a/u_alpha_main.sru'], [alphaDiagnostic]);
            collection.set(uris['project-b/u_beta_main.sru'], [betaDiagnostic]);
            collection.set(uris['build/demo.pbw'], [buildDiagnostic]);

            await vscode.commands.executeCommand('powerbuilder.exportWorkspaceDiagnosticsTree');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/diagnostics/workspace-diagnostics-tree.json',
            ));
            const alphaProject = payload.projects.find((project: { label: string }) => project.label === 'Alpha');
            const unassignedProject = payload.projects.find((project: { label: string }) => project.label === 'Sin proyecto');

            assert.strictEqual(payload.kind, 'powerbuilder-workspace-diagnostics-tree');
            assert.ok(payload.summary.projectCount >= 3);
            assert.ok(payload.summary.objectCount >= 3);
            assert.ok(payload.summary.diagnosticCount >= 3);
            assert.ok(payload.summary.errorCount >= 2);
            assert.ok(payload.summary.warningCount >= 1);
            assert.ok(alphaProject);
            assert.strictEqual(alphaProject.project.name, 'Alpha');
            assert.ok(alphaProject.objectCount >= 1);
            assert.ok(alphaProject.objects[0].diagnostics.some((diagnostic: { code?: string; severity: string; message: string }) =>
                diagnostic.code === 'pb-unused-local-variable'
                && diagnostic.severity === 'warning'
                && diagnostic.message === 'Variable local no usada',
            ));
            assert.ok(unassignedProject);
            assert.ok(unassignedProject.objects.some((objectEntry: {
                label: string;
                diagnostics: Array<{ source?: string; code?: string; severity: string }>;
            }) => objectEntry.label === 'demo'
                && objectEntry.diagnostics.some(diagnostic =>
                    diagnostic.source === 'PBAutoBuild'
                    && diagnostic.code === 'C0001/0004'
                    && diagnostic.severity === 'error'
                )));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'workspace-diagnostics-tree.json');
        } finally {
            collection.clear();
            collection.dispose();
            projectRegistry.clear();
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportWorkspaceManifest genera un manifest multiproyecto con roots efectivas y exclusiones', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-workspace-manifest');
        const config = vscode.workspace.getConfiguration('powerbuilder');

        try {
            await config.update('indexing.exclude', ['**/excluded.pbl/**'], vscode.ConfigurationTarget.Workspace);

            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'demo.pbsln': 'dummy solution content',
                'demo.pbw': 'dummy workspace content',
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alpha"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '        <Library Path="excluded.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app.pbl/w_alpha_main.srw': [
                    'forward',
                    'global type w_alpha_main from window',
                    'end forward',
                    'global type w_alpha_main from window',
                    'end type',
                    'global w_alpha_main w_alpha_main',
                ].join('\n'),
                'alpha/excluded.pbl/n_alpha_hidden.sru': [
                    'forward',
                    'global type n_alpha_hidden from nonvisualobject',
                    'end type',
                    'end forward',
                    'global type n_alpha_hidden from nonvisualobject',
                    'end type',
                    'global n_alpha_hidden n_alpha_hidden',
                ].join('\n'),
                'beta/beta.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="beta"/>',
                    '    <Libraries AppEntry="main.pbl">',
                    '        <Library Path="main.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'beta/main.pbl/n_beta_service.sru': [
                    'forward',
                    'global type n_beta_service from nonvisualobject',
                    'end type',
                    'end forward',
                    'global type n_beta_service from nonvisualobject',
                    'end type',
                    'global n_beta_service n_beta_service',
                ].join('\n'),
            });

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['alpha/app.pbl/w_alpha_main.srw']));
            await vscode.commands.executeCommand('powerbuilder.exportWorkspaceManifest');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/workspace/workspace-manifest.json',
            ));
            const alphaProject = payload.projects.find((project: { name: string }) => project.name === 'alpha');
            const betaProject = payload.projects.find((project: { name: string }) => project.name === 'beta');
            const projectTarget = payload.workspace.buildableTargets.find((target: { relativePath: string }) => target.relativePath.endsWith('/alpha/alpha.pbproj'));
            const solutionTarget = payload.workspace.buildableTargets.find((target: { kind: string }) => target.kind === 'solution');
            const workspaceTarget = payload.workspace.buildableTargets.find((target: { kind: string }) => target.kind === 'workspace');

            assert.strictEqual(payload.kind, 'powerbuilder-workspace-manifest');
            assertPayloadMatchesPublicSchema(payload);
            assert.ok(payload.workspace.projectCount >= 2);
            assert.ok(payload.workspace.indexingExcludePatterns.includes('**/excluded.pbl/**'));
            assert.strictEqual(payload.workspace.preferredProject?.name, 'alpha');
            assert.strictEqual(payload.workspace.matchingProjectsForAnchor.length, 1);
            assert.ok(payload.workspace.buildableTargetCount >= 4);
            assert.ok(alphaProject);
            assert.ok(betaProject);
            assert.ok(projectTarget);
            assert.ok(solutionTarget);
            assert.ok(workspaceTarget);
            assert.strictEqual(alphaProject.isPreferredForAnchor, true);
            assert.ok(alphaProject.sourceRootPaths.some((root: string) => root.endsWith('/alpha/app.pbl')));
            assert.ok(alphaProject.sourceRootPaths.some((root: string) => root.endsWith('/alpha/excluded.pbl')));
            assert.ok(alphaProject.excludedRootPaths.some((root: string) => root.endsWith('/alpha/excluded.pbl')));
            assert.ok(alphaProject.effectiveRootPaths.every((root: string) => !root.endsWith('/alpha/excluded.pbl')));
            assert.strictEqual(projectTarget.relatedProjects[0].precision, 'exact');
            assert.ok(solutionTarget.relatedProjects.some((relation: { projectName: string; precision: string }) => relation.projectName === 'alpha' && relation.precision === 'compatible'));
            assert.ok(workspaceTarget.relatedProjects.some((relation: { projectName: string; precision: string }) => relation.projectName === 'alpha' && relation.precision === 'compatible'));
            assert.ok(payload.workspace.indexingAudit.indexedFileCount >= 2);
            assert.ok(payload.workspace.indexingAudit.snapshotCacheEntryCount >= 1);
            assert.strictEqual(payload.workspace.indexingAudit.staleIndexedFileCount, 0);
            assert.ok(!payload.workspace.indexingAudit.unassignedIndexedFiles.some((relativePath: string) =>
                relativePath.endsWith('/alpha/app.pbl/w_alpha_main.srw')
                || relativePath.endsWith('/beta/main.pbl/n_beta_service.sru'),
            ));
            assert.strictEqual(payload.workspace.incrementalImpact.impactedProjects[0].name, 'alpha');
            assert.ok(payload.workspace.incrementalImpact.impactedBuildTargets.some((target: { name: string; kind: string; precision: string }) =>
                target.name === 'alpha' && target.kind === 'project' && target.precision === 'exact',
            ));
            assert.ok(payload.workspace.incrementalImpact.impactedBuildTargets.some((target: { kind: string; precision: string }) =>
                target.kind === 'solution' && target.precision === 'compatible',
            ));
            assert.ok(payload.graph.summary.buildTargetProjectEdgeCount >= 6);
            assert.ok(payload.graph.summary.projectLibraryEdgeCount >= 2);
            assert.ok(payload.graph.summary.librarySourceEdgeCount >= 2);
            assert.ok(payload.graph.edges.some((edge: { relation: string; precision: string; reason: string }) =>
                edge.relation === 'builds-project'
                && edge.precision === 'exact'
                && edge.reason.includes('.pbproj indexado'),
            ));
            assert.ok(payload.graph.edges.some((edge: { relation: string; precision: string }) =>
                edge.relation === 'may-build-project' && edge.precision === 'compatible',
            ));
            assert.ok(payload.graph.edges.some((edge: { relation: string }) => edge.relation === 'contains-source-file'));
            assert.ok(payload.workspace.retainedEffectiveRootKeys.length >= 2);
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'workspace-manifest.json');
        } finally {
            await config.update('indexing.exclude', undefined, vscode.ConfigurationTarget.Workspace);
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportWorkspaceManifest usa membresía declarada de .pbsln/.pbw/.pbt antes que la co-locación', async () => {
        const baseRelativePath = path.join('phase6-generated', 'workspace-build-target-membership');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'demo.pbsln': [
                    '; Project=beta/beta.pbproj',
                    '[RecentProjects]',
                    'Project=beta/beta.pbproj',
                    '[Solution]',
                    'Project=alpha/alpha.pbproj',
                ].join('\n'),
                'demo.pbw': [
                    '[RecentTargets]',
                    'Project=beta/beta.pbproj',
                    '[Workspace]',
                    'Target=targets/demo.pbt',
                ].join('\n'),
                'targets/demo.pbt': [
                    '[Notes]',
                    'Project=../beta/beta.pbproj',
                    '[Target]',
                    'Project=../alpha/alpha.pbproj',
                ].join('\n'),
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alpha"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app.pbl/w_alpha_main.srw': [
                    'forward',
                    'global type w_alpha_main from window',
                    'end forward',
                    'global type w_alpha_main from window',
                    'end type',
                    'global w_alpha_main w_alpha_main',
                ].join('\n'),
                'beta/beta.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="beta"/>',
                    '    <Libraries AppEntry="main.pbl">',
                    '        <Library Path="main.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'beta/main.pbl/n_beta_service.sru': [
                    'forward',
                    'global type n_beta_service from nonvisualobject',
                    'end forward',
                    'global type n_beta_service from nonvisualobject',
                    'end type',
                    'global n_beta_service n_beta_service',
                ].join('\n'),
            });

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['alpha/app.pbl/w_alpha_main.srw']));
            await vscode.commands.executeCommand('powerbuilder.exportWorkspaceManifest');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/workspace/workspace-manifest.json',
            ));
            const solutionTarget = payload.workspace.buildableTargets.find((target: { kind: string }) => target.kind === 'solution');
            const workspaceTarget = payload.workspace.buildableTargets.find((target: { kind: string }) => target.kind === 'workspace');
            const targetFile = payload.workspace.buildableTargets.find((target: { kind: string }) => target.kind === 'target-file');

            assert.ok(solutionTarget);
            assert.ok(workspaceTarget);
            assert.ok(targetFile);
            assert.ok(payload.workspace.preferredBuildTarget);
            assert.strictEqual(payload.workspace.preferredBuildTarget.kind, 'project');
            assert.ok(payload.workspace.preferredBuildTarget.relativePath.endsWith('/alpha/alpha.pbproj'));
            assert.ok(payload.workspace.matchingBuildTargetsForAnchor.some((target: { kind: string }) => target.kind === 'project'));
            assert.ok(payload.workspace.matchingBuildTargetsForAnchor.some((target: { kind: string }) => target.kind === 'solution'));
            assert.ok(payload.workspace.matchingBuildTargetsForAnchor.some((target: { kind: string }) => target.kind === 'workspace'));
            assert.ok(payload.workspace.matchingBuildTargetsForAnchor.some((target: { kind: string }) => target.kind === 'target-file'));
            assert.strictEqual(solutionTarget.relatedProjects.length, 1);
            assert.strictEqual(solutionTarget.relatedProjects[0].projectName, 'alpha');
            assert.strictEqual(solutionTarget.relatedProjects[0].precision, 'exact');
            assert.strictEqual(solutionTarget.relatedProjects[0].relation, 'declared-build-member');
            assert.ok(!solutionTarget.relatedProjects.some((relation: { projectName: string }) => relation.projectName === 'beta'));
            assert.strictEqual(workspaceTarget.relatedProjects.length, 1);
            assert.strictEqual(workspaceTarget.relatedProjects[0].projectName, 'alpha');
            assert.strictEqual(workspaceTarget.relatedProjects[0].precision, 'exact');
            assert.strictEqual(targetFile.relatedProjects.length, 1);
            assert.strictEqual(targetFile.relatedProjects[0].projectName, 'alpha');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.runWorkspaceBuildPreference y exportWorkspaceBuildPreference publican la preferencia estructurada de proyecto y target buildable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'run-workspace-build-preference');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'demo.pbsln': [
                    '[Solution]',
                    'Project=alpha/alpha.pbproj',
                ].join('\n'),
                'demo.pbw': [
                    '[Workspace]',
                    'Target=targets/demo.pbt',
                ].join('\n'),
                'targets/demo.pbt': [
                    '[Target]',
                    'Project=../alpha/alpha.pbproj',
                ].join('\n'),
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alpha"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app.pbl/w_alpha_main.srw': [
                    'forward',
                    'global type w_alpha_main from window',
                    'end forward',
                    'global type w_alpha_main from window',
                    'end type',
                    'global w_alpha_main w_alpha_main',
                ].join('\n'),
            });

            const result = await vscode.commands.executeCommand('powerbuilder.runWorkspaceBuildPreference', {
                uri: uris['alpha/app.pbl/w_alpha_main.srw'].toString(),
            }) as { kind: string; payload: { kind: string; preferredProject?: { name: string }; preferredBuildTarget?: { kind: string; relativePath: string }; matchingBuildTargetsForAnchor: Array<{ kind: string }>; reasons: string[] } };

            assert.ok(result);
            assert.strictEqual(result.kind, 'generated');
            assert.strictEqual(result.payload.kind, 'powerbuilder-workspace-build-preference');
            assertPayloadMatchesPublicSchema(result.payload);
            assert.strictEqual(result.payload.preferredProject?.name, 'alpha');
            assert.strictEqual(result.payload.preferredBuildTarget?.kind, 'project');
            assert.ok(result.payload.preferredBuildTarget?.relativePath.endsWith('/alpha/alpha.pbproj'));
            assert.ok(result.payload.matchingBuildTargetsForAnchor.some(target => target.kind === 'solution'));
            assert.ok(result.payload.matchingBuildTargetsForAnchor.some(target => target.kind === 'workspace'));
            assert.ok(result.payload.matchingBuildTargetsForAnchor.some(target => target.kind === 'target-file'));
            assert.ok(result.payload.reasons.length >= 1);

            await vscode.commands.executeCommand('powerbuilder.exportWorkspaceBuildPreference', {
                uri: uris['alpha/app.pbl/w_alpha_main.srw'].toString(),
            });

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/workspace/workspace-build-preference.json',
            ));

            assert.strictEqual(payload.kind, 'powerbuilder-workspace-build-preference');
            assertPayloadMatchesPublicSchema(payload);
            assert.strictEqual(payload.preferredProject?.name, 'alpha');
            assert.strictEqual(payload.preferredBuildTarget?.kind, 'project');
            assert.ok(payload.matchingBuildTargetsForAnchor.some((target: { kind: string }) => target.kind === 'solution'));
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), 'workspace-build-preference.json');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportWorkspaceManifest conserva el orden declarado de proyectos dentro de targets buildables', async () => {
        const baseRelativePath = path.join('phase6-generated', 'workspace-build-target-declared-order');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'demo.pbsln': [
                    '[Solution]',
                    'Project=beta/beta.pbproj',
                    'Project=alpha/alpha.pbproj',
                ].join('\n'),
                'demo.pbw': [
                    '[Workspace]',
                    'Target=targets/demo.pbt',
                ].join('\n'),
                'targets/demo.pbt': [
                    '[Target]',
                    'Project=../beta/beta.pbproj',
                    'Project=../alpha/alpha.pbproj',
                ].join('\n'),
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alpha"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app.pbl/w_alpha_main.srw': [
                    'forward',
                    'global type w_alpha_main from window',
                    'end forward',
                    'global type w_alpha_main from window',
                    'end type',
                    'global w_alpha_main w_alpha_main',
                ].join('\n'),
                'beta/beta.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="beta"/>',
                    '    <Libraries AppEntry="main.pbl">',
                    '        <Library Path="main.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'beta/main.pbl/n_beta_service.sru': [
                    'forward',
                    'global type n_beta_service from nonvisualobject',
                    'end forward',
                    'global type n_beta_service from nonvisualobject',
                    'end type',
                    'global n_beta_service n_beta_service',
                ].join('\n'),
            });

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['alpha/app.pbl/w_alpha_main.srw']));
            await vscode.commands.executeCommand('powerbuilder.exportWorkspaceManifest');

            const payload = JSON.parse(await readWorkspaceFile(
                'docs/generated/powerbuilder/exports/workspace/workspace-manifest.json',
            ));
            const solutionTarget = payload.workspace.buildableTargets.find((target: { kind: string }) => target.kind === 'solution');
            const targetFile = payload.workspace.buildableTargets.find((target: { kind: string }) => target.kind === 'target-file');

            assert.ok(solutionTarget);
            assert.ok(targetFile);
            assert.deepStrictEqual(
                solutionTarget.relatedProjects.map((relation: { projectName: string }) => relation.projectName),
                ['beta', 'alpha'],
            );
            assert.deepStrictEqual(
                targetFile.relatedProjects.map((relation: { projectName: string }) => relation.projectName),
                ['beta', 'alpha'],
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportInheritanceOwnerGraph genera relaciones inherits, owner-members y familias callable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-inheritance-owner-graph');
        const projectName = 'demo_inheritance_graph';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="graphdemo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/n_graph_base.sru': [
                    'forward',
                    'global type n_graph_base from nonvisualobject',
                    'end type',
                    'end forward',
                    '',
                    'global type n_graph_base from nonvisualobject',
                    'long iv_base_state',
                    'end type',
                    'global n_graph_base n_graph_base',
                    '',
                    'public function long of_run ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'app.pbl/n_graph_child.sru': [
                    'forward',
                    'global type n_graph_child from n_graph_base',
                    'end type',
                    'end forward',
                    '',
                    'global type n_graph_child from n_graph_base',
                    'long iv_child_state',
                    'end type',
                    'global n_graph_child n_graph_child',
                    '',
                    'public function long of_run ();',
                    'return super.of_run() + 1',
                    'end function',
                ].join('\n'),
            });

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['app.pbl/n_graph_child.sru']));
            await vscode.commands.executeCommand('powerbuilder.exportInheritanceOwnerGraph');

            const payload = JSON.parse(await readWorkspaceFile(
                `docs/generated/powerbuilder/exports/graphs/${projectName}.inheritance-owner-graph.json`,
            ));
            const inheritedBaseMember = payload.ownerMembers.find((edge: {
                focusTypeName: string;
                relation: string;
                member: { name: string };
            }) => edge.focusTypeName === 'n_graph_child' && edge.relation === 'inherited' && edge.member.name === 'iv_base_state');
            const childCallableFamily = payload.callableFamilies.find((family: {
                focusTypeName: string;
                callableName: string;
                members: Array<unknown>;
            }) => family.focusTypeName === 'n_graph_child' && family.callableName === 'of_run');

            assert.strictEqual(payload.kind, 'powerbuilder-inheritance-owner-graph');
            assert.strictEqual(payload.project.name, projectName);
            assert.strictEqual(payload.summary.typeCount, 2);
            assert.ok(payload.inherits.some((edge: { typeName: string; baseTypeName: string }) =>
                edge.typeName === 'n_graph_child' && edge.baseTypeName === 'n_graph_base',
            ));
            assert.ok(inheritedBaseMember);
            assert.ok(childCallableFamily);
            assert.strictEqual(childCallableFamily.members.length, 2);
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), `${projectName}.inheritance-owner-graph.json`);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.exportScriptDependencyGraph genera edges conservadoras entre callables locales y heredados', async () => {
        const baseRelativePath = path.join('phase6-generated', 'export-script-dependency-graph');
        const projectName = 'demo_script_dependency';

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                [`${projectName}.pbproj`]: [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="graphdemo"/>',
                    '    <Libraries AppEntry="app.pbl">',
                    '        <Library Path="app.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'app.pbl/n_dep_base.sru': [
                    'forward',
                    'global type n_dep_base from nonvisualobject',
                    'end type',
                    'end forward',
                    '',
                    'global type n_dep_base from nonvisualobject',
                    'end type',
                    'global n_dep_base n_dep_base',
                    '',
                    'public function long of_base ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'app.pbl/n_dep_child.sru': [
                    'forward',
                    'global type n_dep_child from n_dep_base',
                    'end type',
                    'end forward',
                    '',
                    'global type n_dep_child from n_dep_base',
                    'end type',
                    'global n_dep_child n_dep_child',
                    '',
                    'public function long of_helper ();',
                    'return 2',
                    'end function',
                    '',
                    'public function long of_entry ();',
                    'return this.of_helper() + super.of_base()',
                    'end function',
                ].join('\n'),
            });

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['app.pbl/n_dep_child.sru']));
            await vscode.commands.executeCommand('powerbuilder.exportScriptDependencyGraph');

            const payload = JSON.parse(await readWorkspaceFile(
                `docs/generated/powerbuilder/exports/graphs/${projectName}.script-dependency-graph.json`,
            ));
            const entryCallable = payload.callables.find((callable: { name: string }) => callable.name === 'of_entry');
            const helperEdge = payload.edges.find((edge: {
                sourceCallable: { name: string };
                targetCallable?: { name: string; fileObjectName?: string };
            }) => edge.sourceCallable.name === 'of_entry' && edge.targetCallable?.name === 'of_helper');
            const baseEdge = payload.edges.find((edge: {
                sourceCallable: { name: string };
                targetCallable?: { name: string; fileObjectName?: string };
                invocation: { qualifiedOwnerExpression?: string };
            }) => edge.sourceCallable.name === 'of_entry' && edge.targetCallable?.name === 'of_base' && edge.invocation.qualifiedOwnerExpression === 'super');

            assert.strictEqual(payload.kind, 'powerbuilder-script-dependency-graph');
            assert.strictEqual(payload.project.name, projectName);
            assert.ok(entryCallable);
            assert.ok(helperEdge);
            assert.ok(baseEdge);
            assert.strictEqual(payload.summary.callableCount, 3);
            assert.strictEqual(payload.summary.resolvedEdgeCount, 2);
            assert.strictEqual(payload.summary.unresolvedEdgeCount, 0);
            assert.ok(vscode.window.activeTextEditor);
            assert.strictEqual(path.basename(vscode.window.activeTextEditor!.document.uri.fsPath), `${projectName}.script-dependency-graph.json`);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
            await removeGeneratedDocumentation();
        }
    });

    test('powerbuilder.explainActiveHierarchy expone proyecto preferido, librería efectiva y herencia relevante', async () => {
        const baseRelativePath = path.join('phase6-generated', 'active-hierarchy-command');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alphaapp"/>',
                    '    <Libraries AppEntry="app_alpha.pbl">',
                    '        <Library Path="app_alpha.pbl"/>',
                    '        <Library Path="../shared.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'beta/beta.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="betaapp"/>',
                    '    <Libraries AppEntry="app_beta.pbl">',
                    '        <Library Path="app_beta.pbl"/>',
                    '        <Library Path="../shared.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_child.sru': [
                    'forward',
                    'global type w_child from w_base',
                    'end forward',
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'event open;',
                    'of_base()',
                    'end event',
                ].join('\n'),
                'beta/app_beta.pbl/w_dummy.sru': [
                    'forward',
                    'global type w_dummy from window',
                    'end forward',
                    'global type w_dummy from window',
                    'end type',
                    'global w_dummy w_dummy',
                ].join('\n'),
                'shared.pbl/w_base.sru': [
                    'forward',
                    'global type w_base from window',
                    'end forward',
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'forward prototypes',
                    'public function long of_base ()',
                    'end prototypes',
                    '',
                    'public function long of_base ();',
                    'return 1',
                    'end function',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['alpha/app_alpha.pbl/w_child.sru']);
            const editor = await vscode.window.showTextDocument(document);
            const position = getTextPosition(document, 'of_base');
            editor.selection = new vscode.Selection(position, position);

            await vscode.commands.executeCommand('powerbuilder.explainActiveHierarchy');

            assert.ok(vscode.window.activeTextEditor);
            const markdown = vscode.window.activeTextEditor!.document.getText();

            assert.ok(markdown.includes('# Jerarquía activa'));
            assert.ok(markdown.includes('- Proyecto preferido: `alpha`'));
            assert.ok(markdown.includes('shared.pbl (library)'));
            assert.ok(markdown.includes('w_child'));
            assert.ok(markdown.includes('w_base'));
            assert.ok(markdown.includes('- Precisión: `exact`'));
            assert.ok(markdown.includes('| of_base | function |'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.explainActiveHierarchy degrada con honestidad en DYNAMIC dispatch', async () => {
        const baseRelativePath = path.join('phase6-generated', 'active-hierarchy-dynamic');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alphaapp"/>',
                    '    <Libraries AppEntry="app_alpha.pbl">',
                    '        <Library Path="app_alpha.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_child.sru': [
                    'forward',
                    'global type w_child from window',
                    'end forward',
                    'global type w_child from window',
                    'end type',
                    'global w_child w_child',
                    '',
                    'event open;',
                    'DYNAMIC of_base()',
                    'end event',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['alpha/app_alpha.pbl/w_child.sru']);
            const editor = await vscode.window.showTextDocument(document);
            const position = getTextPosition(document, 'of_base');
            editor.selection = new vscode.Selection(position, position);

            await vscode.commands.executeCommand('powerbuilder.explainActiveHierarchy');

            assert.ok(vscode.window.activeTextEditor);
            const markdown = vscode.window.activeTextEditor!.document.getText();

            assert.ok(markdown.includes('- Precisión: `blocked`'));
            assert.ok(markdown.includes('dynamic-dispatch'));
            assert.ok(markdown.includes('no hay candidato primario seguro'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.runActiveHierarchyInspection devuelve el mismo valor estructurado sin renderizar Markdown', async () => {
        const baseRelativePath = path.join('phase6-generated', 'active-hierarchy-structured-command');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alphaapp"/>',
                    '    <Libraries AppEntry="app_alpha.pbl">',
                    '        <Library Path="app_alpha.pbl"/>',
                    '        <Library Path="../shared.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'beta/beta.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="betaapp"/>',
                    '    <Libraries AppEntry="app_beta.pbl">',
                    '        <Library Path="app_beta.pbl"/>',
                    '        <Library Path="../shared.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_child.sru': [
                    'forward',
                    'global type w_child from w_base',
                    'end forward',
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'event open;',
                    'of_base()',
                    'end event',
                ].join('\n'),
                'shared.pbl/w_base.sru': [
                    'forward',
                    'global type w_base from window',
                    'end forward',
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'forward prototypes',
                    'public function long of_base ()',
                    'end prototypes',
                    '',
                    'public function long of_base ();',
                    'return 1',
                    'end function',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['alpha/app_alpha.pbl/w_child.sru']);
            const editor = await vscode.window.showTextDocument(document);
            const position = getTextPosition(document, 'of_base');
            editor.selection = new vscode.Selection(position, position);

            const result = await vscode.commands.executeCommand<{
                kind: string;
                payload: {
                    kind: string;
                    inspection: {
                        preferredProject?: { name: string };
                        currentObjectHierarchy: string[];
                        relevantOwnerHierarchy: string[];
                        precision: string;
                        primarySymbol?: { returnType?: string };
                    };
                };
            }>('powerbuilder.runActiveHierarchyInspection');

            assert.ok(result);
            assert.strictEqual(result!.kind, 'generated');
            assertPayloadMatchesPublicSchema(result!.payload);
            assert.strictEqual(result!.payload.kind, 'powerbuilder-active-hierarchy-inspection');
            assert.strictEqual(result!.payload.inspection.preferredProject?.name, 'alpha');
            assert.strictEqual(result!.payload.inspection.precision, 'exact');
            assert.ok(result!.payload.inspection.currentObjectHierarchy.includes('w_base'));
            assert.ok(result!.payload.inspection.relevantOwnerHierarchy.includes('w_base'));
            assert.strictEqual(result!.payload.inspection.primarySymbol?.returnType, 'long');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.showInheritanceHierarchy publica cadena, ancestro directo y descendencia inmediata del foco', async () => {
        const baseRelativePath = path.join('phase6-generated', 'inheritance-hierarchy-command');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alphaapp"/>',
                    '    <Libraries AppEntry="app_alpha.pbl">',
                    '        <Library Path="app_alpha.pbl"/>',
                    '        <Library Path="../shared.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_child.sru': [
                    'forward',
                    'global type w_child from w_base',
                    'end forward',
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'event open;',
                    'of_base()',
                    'end event',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_grandchild.sru': [
                    'forward',
                    'global type w_grandchild from w_child',
                    'end forward',
                    'global type w_grandchild from w_child',
                    'end type',
                    'global w_grandchild w_grandchild',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_sibling.sru': [
                    'forward',
                    'global type w_sibling from w_base',
                    'end forward',
                    'global type w_sibling from w_base',
                    'end type',
                    'global w_sibling w_sibling',
                ].join('\n'),
                'shared.pbl/w_base.sru': [
                    'forward',
                    'global type w_base from window',
                    'end forward',
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'forward prototypes',
                    'public function long of_base ()',
                    'end prototypes',
                    '',
                    'public function long of_base ();',
                    'return 1',
                    'end function',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['alpha/app_alpha.pbl/w_child.sru']);
            const editor = await vscode.window.showTextDocument(document);
            const position = getTextPosition(document, 'of_base');
            editor.selection = new vscode.Selection(position, position);

            await vscode.commands.executeCommand('powerbuilder.showInheritanceHierarchy');

            assert.ok(vscode.window.activeTextEditor);
            const markdown = vscode.window.activeTextEditor!.document.getText();
            const focusLinks = getMarkdownLinkTargets(markdown, 'w_base');
            const siblingLinks = getMarkdownLinkTargets(markdown, 'w_sibling');

            assert.ok(markdown.includes('# Jerarquía de herencia'));
            assert.ok(markdown.includes('- Tipo actual: [w_child]('));
            assert.ok(markdown.includes('- Tipo enfocado: [w_base]('));
            assert.ok(markdown.includes('· exacto sobre el símbolo primario'));
            assert.ok(markdown.includes('- Ancestro directo: `window` · sin target indexado seguro'));
            assert.ok(markdown.includes('| [w_sibling]('));
            assert.ok(markdown.includes('| solo indexado | w_base |'));
            assert.ok(markdown.includes('alpha/app_alpha.pbl/w_sibling.sru'));
            assert.ok(!markdown.includes('[window]('));
            assert.ok(focusLinks.length >= 1);
            assert.ok(siblingLinks.length >= 1);
            assert.ok(focusLinks[0].includes('#L'));
            assert.ok(siblingLinks[0].includes('#L'));

            const focusEditor = await openMarkdownLinkTarget(focusLinks[0]);
            assert.strictEqual(focusEditor.document.uri.fsPath, uris['shared.pbl/w_base.sru'].fsPath);

            const siblingEditor = await openMarkdownLinkTarget(siblingLinks[0]);
            assert.strictEqual(siblingEditor.document.uri.fsPath, uris['alpha/app_alpha.pbl/w_sibling.sru'].fsPath);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.showInheritanceHierarchy mantiene navegación contextual segura cuando solo puede apoyarse en el objeto actual', async () => {
        const baseRelativePath = path.join('phase6-generated', 'inheritance-hierarchy-current-object');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alphaapp"/>',
                    '    <Libraries AppEntry="app_alpha.pbl">',
                    '        <Library Path="app_alpha.pbl"/>',
                    '        <Library Path="../shared.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_child.sru': [
                    'forward',
                    'global type w_child from w_base',
                    'end forward',
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_grandchild.sru': [
                    'forward',
                    'global type w_grandchild from w_child',
                    'end forward',
                    'global type w_grandchild from w_child',
                    'end type',
                    'global w_grandchild w_grandchild',
                    '',
                    '// sin símbolo resoluble bajo el cursor para forzar degradación al objeto actual',
                ].join('\n'),
                'shared.pbl/w_base.sru': [
                    'forward',
                    'global type w_base from window',
                    'end forward',
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['alpha/app_alpha.pbl/w_grandchild.sru']);
            const editor = await vscode.window.showTextDocument(document);
            const line = document.lineAt(document.lineCount - 1);
            const position = new vscode.Position(document.lineCount - 1, line.text.length);
            editor.selection = new vscode.Selection(position, position);

            await vscode.commands.executeCommand('powerbuilder.showInheritanceHierarchy');

            assert.ok(vscode.window.activeTextEditor);
            const markdown = vscode.window.activeTextEditor!.document.getText();
            const currentObjectLinks = getMarkdownLinkTargets(markdown, 'w_grandchild');
            const directAncestorLinks = getMarkdownLinkTargets(markdown, 'w_child');

            assert.ok(markdown.includes('- Precisión: `blocked`'));
            assert.ok(markdown.includes('- Tipo actual: [w_grandchild]('));
            assert.ok(markdown.includes('- Tipo enfocado: [w_grandchild]('));
            assert.ok(markdown.includes('· contextual desde el objeto actual'));
            assert.ok(markdown.includes('- Ancestro directo: [w_child]('));
            assert.ok(markdown.includes('· navegable con evidencia indexada'));
            assert.ok(markdown.includes('no-context'));
            assert.ok(currentObjectLinks.length >= 1);
            assert.ok(directAncestorLinks.length >= 1);

            const currentObjectEditor = await openMarkdownLinkTarget(currentObjectLinks[0]);
            assert.strictEqual(currentObjectEditor.document.uri.fsPath, uris['alpha/app_alpha.pbl/w_grandchild.sru'].fsPath);

            const directAncestorEditor = await openMarkdownLinkTarget(directAncestorLinks[0]);
            assert.strictEqual(directAncestorEditor.document.uri.fsPath, uris['alpha/app_alpha.pbl/w_child.sru'].fsPath);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.showInheritanceHierarchy degrada con honestidad cuando solo puede apoyarse en el objeto actual', async () => {
        const baseRelativePath = path.join('phase6-generated', 'inheritance-hierarchy-dynamic');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alphaapp"/>',
                    '    <Libraries AppEntry="app_alpha.pbl">',
                    '        <Library Path="app_alpha.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_child.sru': [
                    'forward',
                    'global type w_child from w_base',
                    'end forward',
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'event open;',
                    'DYNAMIC of_base()',
                    'end event',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_base.sru': [
                    'forward',
                    'global type w_base from window',
                    'end forward',
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['alpha/app_alpha.pbl/w_child.sru']);
            const editor = await vscode.window.showTextDocument(document);
            const position = getTextPosition(document, 'of_base');
            editor.selection = new vscode.Selection(position, position);

            await vscode.commands.executeCommand('powerbuilder.showInheritanceHierarchy');

            assert.ok(vscode.window.activeTextEditor);
            const markdown = vscode.window.activeTextEditor!.document.getText();

            assert.ok(markdown.includes('- Precisión: `blocked`'));
            assert.ok(markdown.includes('- Tipo enfocado: [w_child]('));
            assert.ok(markdown.includes('· contextual desde el objeto actual'));
            assert.ok(markdown.includes('[w_base]('));
            assert.ok(markdown.includes('dynamic-dispatch'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.findAncestorScript publica el callable actual y su script ancestro navegable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'find-ancestor-script-command');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alphaapp"/>',
                    '    <Libraries AppEntry="app_alpha.pbl">',
                    '        <Library Path="app_alpha.pbl"/>',
                    '        <Library Path="../shared.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_child.sru': [
                    'forward',
                    'global type w_child from w_base',
                    'end forward',
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'forward prototypes',
                    'public function long of_base ()',
                    'public function long of_local ()',
                    'end prototypes',
                    '',
                    'public function long of_base ();',
                    'long ll_value',
                    'll_value = 2',
                    'return ll_value',
                    'end function',
                    '',
                    'public function long of_local ();',
                    'return 99',
                    'end function',
                ].join('\n'),
                'shared.pbl/w_base.sru': [
                    'forward',
                    'global type w_base from window',
                    'end forward',
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'forward prototypes',
                    'public function long of_base ()',
                    'end prototypes',
                    '',
                    'public function long of_base ();',
                    'return 1',
                    'end function',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['alpha/app_alpha.pbl/w_child.sru']);
            const editor = await vscode.window.showTextDocument(document);
            const position = getTextPosition(document, 'll_value = 2');
            editor.selection = new vscode.Selection(position, position);

            await vscode.commands.executeCommand('powerbuilder.findAncestorScript');

            assert.ok(vscode.window.activeTextEditor);
            const markdown = vscode.window.activeTextEditor!.document.getText();
            const callableLinks = getMarkdownLinkTargets(markdown, 'of_base');

            assert.ok(markdown.includes('# Find Ancestor Script'));
            assert.ok(markdown.includes('- Precisión: `exact`'));
            assert.ok(markdown.includes('- Objeto actual: [w_child]('));
            assert.ok(markdown.includes('- Ancestro directo del objeto: [w_base]('));
            assert.ok(markdown.includes('| actual | [of_base]('));
            assert.ok(markdown.includes('| ancestro | [of_base]('));
            assert.ok(markdown.includes('sobrescribe o prolonga la cadena heredada desde w_base'));
            assert.strictEqual(callableLinks.length, 2);

            const callableEditors: vscode.TextEditor[] = [];

            for (const target of callableLinks) {
                callableEditors.push(await openMarkdownLinkTarget(target));
            }

            const openedPaths = callableEditors.map(openedEditor => openedEditor.document.uri.fsPath);

            assert.ok(openedPaths.includes(uris['alpha/app_alpha.pbl/w_child.sru'].fsPath));
            assert.ok(openedPaths.includes(uris['shared.pbl/w_base.sru'].fsPath));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.findAncestorScript degrada con honestidad cuando no existe script ancestro navegable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'find-ancestor-script-no-match');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alphaapp"/>',
                    '    <Libraries AppEntry="app_alpha.pbl">',
                    '        <Library Path="app_alpha.pbl"/>',
                    '        <Library Path="../shared.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_child.sru': [
                    'forward',
                    'global type w_child from w_base',
                    'end forward',
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'forward prototypes',
                    'public function long of_local ()',
                    'end prototypes',
                    '',
                    'public function long of_local ();',
                    'return 99',
                    'end function',
                ].join('\n'),
                'shared.pbl/w_base.sru': [
                    'forward',
                    'global type w_base from window',
                    'end forward',
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['alpha/app_alpha.pbl/w_child.sru']);
            const editor = await vscode.window.showTextDocument(document);
            const position = getTextPosition(document, 'return 99');
            editor.selection = new vscode.Selection(position, position);

            await vscode.commands.executeCommand('powerbuilder.findAncestorScript');

            assert.ok(vscode.window.activeTextEditor);
            const markdown = vscode.window.activeTextEditor!.document.getText();
            const callableLinks = getMarkdownLinkTargets(markdown, 'of_local');

            assert.ok(markdown.includes('# Find Ancestor Script'));
            assert.ok(markdown.includes('- Precisión: `blocked`'));
            assert.ok(markdown.includes('- Script actual: `of_local` (`function`)'));
            assert.ok(markdown.includes('- Script ancestro: `sin script ancestro publicable`'));
            assert.ok(markdown.includes('`no-ancestor-script`'));
            assert.strictEqual(callableLinks.length, 1);

            const currentCallableEditor = await openMarkdownLinkTarget(callableLinks[0]);
            assert.strictEqual(currentCallableEditor.document.uri.fsPath, uris['alpha/app_alpha.pbl/w_child.sru'].fsPath);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('powerbuilder.runAncestorScriptInspection devuelve el mismo valor estructurado sin renderizar Markdown', async () => {
        const baseRelativePath = path.join('phase6-generated', 'find-ancestor-script-structured-command');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha/alpha.pbproj': [
                    '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>',
                    '<Project>',
                    '    <Type Name="pb"/>',
                    '    <Application Name="alphaapp"/>',
                    '    <Libraries AppEntry="app_alpha.pbl">',
                    '        <Library Path="app_alpha.pbl"/>',
                    '        <Library Path="../shared.pbl"/>',
                    '    </Libraries>',
                    '</Project>',
                ].join('\n'),
                'alpha/app_alpha.pbl/w_child.sru': [
                    'forward',
                    'global type w_child from w_base',
                    'end forward',
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'forward prototypes',
                    'public function long of_base ()',
                    'end prototypes',
                    '',
                    'public function long of_base ();',
                    'return 2',
                    'end function',
                ].join('\n'),
                'shared.pbl/w_base.sru': [
                    'forward',
                    'global type w_base from window',
                    'end forward',
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'forward prototypes',
                    'public function long of_base ()',
                    'end prototypes',
                    '',
                    'public function long of_base ();',
                    'return 1',
                    'end function',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['alpha/app_alpha.pbl/w_child.sru']);
            const editor = await vscode.window.showTextDocument(document);
            const position = getTextPosition(document, 'return 2');
            editor.selection = new vscode.Selection(position, position);

            const result = await vscode.commands.executeCommand<{
                kind: string;
                payload: { kind: string; inspection: { precision: string; currentScript?: { name: string }; ancestorScript?: { name: string }; relationship: string } };
            }>('powerbuilder.runAncestorScriptInspection');

            assert.ok(result);
            assert.strictEqual(result!.kind, 'generated');
            assertPayloadMatchesPublicSchema(result!.payload);
            assert.strictEqual(result!.payload.kind, 'powerbuilder-ancestor-script-inspection');
            assert.strictEqual(result!.payload.inspection.precision, 'exact');
            assert.strictEqual(result!.payload.inspection.currentScript?.name, 'of_base');
            assert.strictEqual(result!.payload.inspection.ancestorScript?.name, 'of_base');
            assert.ok(result!.payload.inspection.relationship.includes('w_base'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('registra LM tools sobre la surface estable cuando el host las soporta', function () {
        const lmApi = (vscode as unknown as { lm?: { tools?: Array<{ name: string }> } }).lm;

        if (!lmApi?.tools) {
            this.skip();
            return;
        }

        const toolNames = lmApi.tools.map(tool => tool.name);

        if (!toolNames.some(name => name.startsWith('powerbuilder-'))) {
            this.skip();
            return;
        }

        assert.ok(toolNames.includes('powerbuilder-semantic-query'));
        assert.ok(toolNames.includes('powerbuilder-semantic-query-batch'));
        assert.ok(toolNames.includes('powerbuilder-active-hierarchy-inspection'));
        assert.ok(toolNames.includes('powerbuilder-ancestor-script-inspection'));
        assert.ok(toolNames.includes('powerbuilder-build-session-manifest'));
    });
});
