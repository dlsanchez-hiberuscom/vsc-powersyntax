import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { providePowerBuilderInlayHints } from '../../features/direct-api-ide/inlay-hints/registerInlayHints';
import { provideLinkedEditingRanges } from '../../features/direct-api-ide/linked-editing/registerLinkedEditing';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { WorkspaceIndexer } from '../../powerbuilder/indexing/workspaceIndexer';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { getInheritanceGraph } from '../../powerbuilder/semantic/inheritanceGraph';
import { PowerBuilderProjectRegistry } from '../../powerbuilder/workspace/projectRegistry';

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
    const snapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance();
    const index = SymbolIndex.getInstance();
    const libraryGraph = PbLibraryGraph.getInstance();
    const projectRegistry = PowerBuilderProjectRegistry.getInstance();

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
            // Reintentar tras limpiar estado compartido del host.
        }

        snapshotStore.clear();
        index.clear();
        libraryGraph.clear();
        getInheritanceGraph(index).clear();
        projectRegistry.clear();
    }

    try {
        await vscode.workspace.fs.delete(vscode.Uri.file(scenarioPath), {
            recursive: true,
            useTrash: false,
        });
    } catch {
        // Ignorar locks transitorios del host de tests.
    }

    snapshotStore.clear();
    index.clear();
    libraryGraph.clear();
    getInheritanceGraph(index).clear();
    projectRegistry.clear();
}

async function updateWorkspaceSetting<T>(
    section: string,
    value: T | undefined,
): Promise<void> {
    await vscode.workspace.getConfiguration().update(section, value, vscode.ConfigurationTarget.Workspace);
}

function toWorkspaceRelativePath(uri: vscode.Uri): string {
    return vscode.workspace.asRelativePath(uri, false).replace(/\\/g, '/');
}

function getWorkspaceTestUri(relativePath: string): vscode.Uri {
    return vscode.Uri.file(
        path.join(
            vscode.workspace.workspaceFolders![0].uri.fsPath,
            relativePath,
        ),
    );
}

function getTextPosition(
    document: vscode.TextDocument,
    searchText: string,
    occurrence: number = 1,
): vscode.Position {
    const text = document.getText();
    let fromIndex = 0;
    let matchIndex = -1;

    for (let currentOccurrence = 0; currentOccurrence < occurrence; currentOccurrence++) {
        matchIndex = text.indexOf(searchText, fromIndex);
        assert.ok(matchIndex >= 0, `Expected to find occurrence ${occurrence} of ${searchText}`);
        fromIndex = matchIndex + searchText.length;
    }

    return document.positionAt(matchIndex + Math.floor(searchText.length / 2));
}

function getLineStartPosition(
    document: vscode.TextDocument,
    searchText: string,
    occurrence: number = 1,
): vscode.Position {
    const text = document.getText();
    let fromIndex = 0;
    let matchIndex = -1;

    for (let currentOccurrence = 0; currentOccurrence < occurrence; currentOccurrence++) {
        matchIndex = text.indexOf(searchText, fromIndex);
        assert.ok(matchIndex >= 0, `Expected to find occurrence ${occurrence} of ${searchText}`);
        fromIndex = matchIndex + searchText.length;
    }

    return document.positionAt(matchIndex);
}

function getPositionAfterText(
    document: vscode.TextDocument,
    searchText: string,
    occurrence: number = 1,
): vscode.Position {
    const text = document.getText();
    let fromIndex = 0;
    let matchIndex = -1;

    for (let currentOccurrence = 0; currentOccurrence < occurrence; currentOccurrence++) {
        matchIndex = text.indexOf(searchText, fromIndex);
        assert.ok(matchIndex >= 0, `Expected to find occurrence ${occurrence} of ${searchText}`);
        fromIndex = matchIndex + searchText.length;
    }

    return document.positionAt(matchIndex + searchText.length);
}

function getHoverText(hover: vscode.Hover): string {
    return hover.contents.map(content => {
        if (content instanceof vscode.MarkdownString) {
            return content.value;
        }

        if (typeof content === 'string') {
            return content;
        }

        return content.value;
    }).join('\n');
}

function getCompletionDocumentationText(item: vscode.CompletionItem): string {
    if (!item.documentation) {
        return '';
    }

    if (item.documentation instanceof vscode.MarkdownString) {
        return item.documentation.value;
    }

    if (typeof item.documentation === 'string') {
        return item.documentation;
    }

    const markdownLike = item.documentation as { value?: string };
    return typeof markdownLike.value === 'string'
        ? markdownLike.value
        : '';
}

function getSignatureDocumentationText(information: vscode.SignatureInformation): string {
    const documentation = information.documentation;

    if (!documentation) {
        return '';
    }

    if (documentation instanceof vscode.MarkdownString) {
        return documentation.value;
    }

    if (typeof documentation === 'string') {
        return documentation;
    }

    const markdownLike = documentation as { value?: string };
    return typeof markdownLike.value === 'string'
        ? markdownLike.value
        : '';
}

function getCompletionLabel(item: vscode.CompletionItem): string {
    return typeof item.label === 'string'
        ? item.label
        : item.label.label;
}

function findCompletionItem(
    completionList: vscode.CompletionList,
    label: string,
): vscode.CompletionItem | undefined {
    return completionList.items.find(item => getCompletionLabel(item) === label);
}

function collectDocumentSymbolNames(
    symbols: ReadonlyArray<vscode.DocumentSymbol | vscode.SymbolInformation>,
): string[] {
    const names: string[] = [];

    for (const symbol of symbols) {
        names.push(symbol.name);

        if (symbol instanceof vscode.DocumentSymbol) {
            names.push(...collectDocumentSymbolNames(symbol.children));
        }
    }

    return names;
}

suite('VS Code provider integration', () => {
    setup(async () => {
        SymbolIndex.getInstance().clear();
        PbLibraryGraph.getInstance().clear();
        PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
        getInheritanceGraph(SymbolIndex.getInstance()).clear();
        PowerBuilderProjectRegistry.getInstance().clear();

        try {
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        } catch {
            // Ignorar hosts sin UI completa durante el setup.
        }
    });

    test('DocumentSymbolProvider expone outline real para sample.sru', async () => {
        const uri = vscode.Uri.file(
            path.join(
                vscode.workspace.workspaceFolders![0].uri.fsPath,
                'sample.sru',
            ),
        );

        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            uri,
        );

        assert.ok(symbols);
        assert.strictEqual(symbols!.length > 0, true);

        const symbolNames = collectDocumentSymbolNames(symbols!);

        assert.ok(symbolNames.some(name => name.toLowerCase() === 'n_cst_sample'));
        assert.ok(symbolNames.includes('wf_calculate'));
    });

    test('DocumentSymbolProvider expone outline seguro para sample.srd', async () => {
        const uri = getWorkspaceTestUri('sample.srd');
        const document = await vscode.workspace.openTextDocument(uri);

        const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            uri,
        );

        assert.ok(symbols);
        assert.strictEqual(symbols!.length, 1);
        assert.strictEqual(symbols![0].name, 'sample');

        const childNames = symbols![0].children.map(child => child.name);
        assert.ok(childNames.includes('header'));
        assert.ok(childNames.includes('detail'));
        assert.ok(childNames.includes('table'));

        const table = symbols![0].children.find(child => child.name === 'table');
        const idColumn = table?.children.find(child => child.name === 'id');
        const retrieve = table?.children.find(child => child.name === 'retrieve');

        assert.ok(idColumn);
        assert.ok(retrieve);
        assert.ok(document.lineAt(idColumn!.selectionRange.start.line).text.includes('name=id'));
        assert.ok(document.lineAt(retrieve!.selectionRange.start.line).text.includes('retrieve='));
    });

    test('DefinitionProvider expone navegación intradocumento segura para band=detail en sample.srd', async () => {
        const uri = getWorkspaceTestUri('sample.srd');
        const document = await vscode.workspace.openTextDocument(uri);

        const locations = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            uri,
            getTextPosition(document, 'band=detail'),
        );

        assert.ok(locations);
        assert.strictEqual(locations!.length, 1);
        assert.strictEqual(locations![0].uri.toString(), uri.toString());
        assert.ok(document.lineAt(locations![0].range.start.line).text.trimStart().startsWith('detail('));
    });

    test('DefinitionProvider expone navegación intradocumento segura desde el retrieve hacia table-column en sample.srd', async () => {
        const uri = getWorkspaceTestUri('sample.srd');
        const document = await vscode.workspace.openTextDocument(uri);
        const retrieveLine = 11;
        const nameOffset = document.lineAt(retrieveLine).text.indexOf('name, email');

        assert.ok(nameOffset >= 0, 'Expected retrieve name token in sample.srd');

        const locations = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            uri,
            new vscode.Position(retrieveLine, nameOffset + 1),
        );

        assert.ok(locations);
        assert.strictEqual(locations!.length, 1);
        assert.strictEqual(locations![0].uri.toString(), uri.toString());
        assert.ok(document.lineAt(locations![0].range.start.line).text.includes('name=name'));
    });

    test('DefinitionProvider enlaza DataObject del script con el painter DataWindow preferido por proyecto', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-definition-datawindow-dataobject');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const previousExperimentalSetting = vscode.workspace.getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        try {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'project-a.pbproj': createProjectText(
                    'project-a/app.pbl',
                    ['project-a/app.pbl'],
                ),
                'project-b.pbproj': createProjectText(
                    'project-b/app.pbl',
                    ['project-b/app.pbl'],
                ),
                'project-a/app.pbl/w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'global w_probe w_probe',
                    '',
                    'event open;',
                    'end event',
                    '',
                    'type dw_customer from datawindow within w_probe',
                    'end type',
                ].join('\n'),
                'project-a/app.pbl/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=long update=yes name=id dbname="customer.id")',
                    ' column=(type=char(100) update=yes name=name dbname="customer.name")',
                    ' retrieve="SELECT id, name FROM customer ORDER BY name" )',
                ].join('\n'),
                'project-b/app.pbl/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=long update=yes name=id dbname="customer.id")',
                    ' column=(type=char(50) update=yes name=status dbname="customer.status")',
                    ' retrieve="SELECT id, status FROM customer ORDER BY status" )',
                ].join('\n'),
            });

            await indexer.indexProjectFile(uris['project-a.pbproj']);
            await indexer.indexProjectFile(uris['project-b.pbproj']);

            const document = await vscode.workspace.openTextDocument(uris['project-a/app.pbl/w_probe.srw']);
            const position = getTextPosition(document, 'd_customer_list');

            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uris['project-a/app.pbl/w_probe.srw'],
                position,
            );

            assert.ok(locations);
            assert.strictEqual(locations!.length, 1);
            assert.strictEqual(
                toWorkspaceRelativePath(locations![0].uri),
                `${baseRelativePath.replace(/\\/g, '/')}/project-a/app.pbl/d_customer_list.srd`,
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('HoverProvider expone metadata del painter DataWindow enlazado desde DataObject en script', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-hover-datawindow-dataobject');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const previousExperimentalSetting = vscode.workspace.getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        try {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'project-a.pbproj': createProjectText(
                    'project-a/app.pbl',
                    ['project-a/app.pbl'],
                ),
                'project-b.pbproj': createProjectText(
                    'project-b/app.pbl',
                    ['project-b/app.pbl'],
                ),
                'project-a/app.pbl/w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'global w_probe w_probe',
                    '',
                    'event open;',
                    'end event',
                    '',
                    'type dw_customer from datawindow within w_probe',
                    'end type',
                ].join('\n'),
                'project-a/app.pbl/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=long update=yes name=id dbname="customer.id")',
                    ' column=(type=char(100) update=yes name=name dbname="customer.name")',
                    ' retrieve="SELECT id, name FROM customer ORDER BY name" )',
                ].join('\n'),
                'project-b/app.pbl/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=long update=yes name=id dbname="customer.id")',
                    ' column=(type=char(50) update=yes name=status dbname="customer.status")',
                    ' retrieve="SELECT id, status FROM customer ORDER BY status" )',
                ].join('\n'),
            });

            await indexer.indexProjectFile(uris['project-a.pbproj']);
            await indexer.indexProjectFile(uris['project-b.pbproj']);

            const document = await vscode.workspace.openTextDocument(uris['project-a/app.pbl/w_probe.srw']);
            const position = getTextPosition(document, 'd_customer_list');
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                uris['project-a/app.pbl/w_probe.srw'],
                position,
            );

            assert.ok(hovers);
            assert.ok(hovers!.length > 0);

            const hoverText = hovers!.map(getHoverText).join('\n');

            assert.ok(hoverText.includes('DataWindow enlazada desde script'));
            assert.ok(hoverText.includes('**d_customer_list**'));
            assert.ok(hoverText.includes('`id`'));
            assert.ok(hoverText.includes('`name`'));
            assert.ok(!hoverText.includes('`status`'));
            assert.ok(hoverText.includes('SELECT id, name FROM customer ORDER BY name'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DefinitionProvider enlaza columnas GetItem del script con table-column del painter DataWindow preferido', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-definition-datawindow-getitem-column');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const previousExperimentalSetting = vscode.workspace.getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        try {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'project-a.pbproj': createProjectText(
                    'project-a/app.pbl',
                    ['project-a/app.pbl'],
                ),
                'project-b.pbproj': createProjectText(
                    'project-b/app.pbl',
                    ['project-b/app.pbl'],
                ),
                'project-a/app.pbl/w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'global w_probe w_probe',
                    '',
                    'event open;',
                    'long ll_name',
                    'll_name = dw_customer.GetItemNumber(1, "name")',
                    'end event',
                    '',
                    'type dw_customer from datawindow within w_probe',
                    'end type',
                ].join('\n'),
                'project-a/app.pbl/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=long update=yes name=id dbname="customer.id")',
                    ' column=(type=char(100) update=yes name=name dbname="customer.name")',
                    ' retrieve="SELECT id, name FROM customer ORDER BY name" )',
                ].join('\n'),
                'project-b/app.pbl/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=long update=yes name=id dbname="customer.id")',
                    ' column=(type=char(50) update=yes name=status dbname="customer.status")',
                    ' retrieve="SELECT id, status FROM customer ORDER BY status" )',
                ].join('\n'),
            });

            await indexer.indexProjectFile(uris['project-a.pbproj']);
            await indexer.indexProjectFile(uris['project-b.pbproj']);

            const document = await vscode.workspace.openTextDocument(uris['project-a/app.pbl/w_probe.srw']);
            const position = getTextPosition(document, '"name"');
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uris['project-a/app.pbl/w_probe.srw'],
                position,
            );

            assert.ok(locations);
            assert.strictEqual(locations!.length, 1);
            assert.strictEqual(
                toWorkspaceRelativePath(locations![0].uri),
                `${baseRelativePath.replace(/\\/g, '/')}/project-a/app.pbl/d_customer_list.srd`,
            );

            const linkedDocument = await vscode.workspace.openTextDocument(locations![0].uri);
            assert.ok(linkedDocument.lineAt(locations![0].range.start.line).text.includes('name=name'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('HoverProvider expone metadata de columnas GetItem enlazadas al painter DataWindow preferido', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-hover-datawindow-getitem-column');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const previousExperimentalSetting = vscode.workspace.getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        try {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'project-a.pbproj': createProjectText(
                    'project-a/app.pbl',
                    ['project-a/app.pbl'],
                ),
                'project-b.pbproj': createProjectText(
                    'project-b/app.pbl',
                    ['project-b/app.pbl'],
                ),
                'project-a/app.pbl/w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'global w_probe w_probe',
                    '',
                    'event open;',
                    'long ll_name',
                    'll_name = dw_customer.GetItemNumber(1, "name")',
                    'end event',
                    '',
                    'type dw_customer from datawindow within w_probe',
                    'end type',
                ].join('\n'),
                'project-a/app.pbl/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=long update=yes name=id dbname="customer.id")',
                    ' column=(type=char(100) update=yes name=name dbname="customer.name")',
                    ' retrieve="SELECT id, name FROM customer ORDER BY name" )',
                ].join('\n'),
                'project-b/app.pbl/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=long update=yes name=id dbname="customer.id")',
                    ' column=(type=char(50) update=yes name=status dbname="customer.status")',
                    ' retrieve="SELECT id, status FROM customer ORDER BY status" )',
                ].join('\n'),
            });

            await indexer.indexProjectFile(uris['project-a.pbproj']);
            await indexer.indexProjectFile(uris['project-b.pbproj']);

            const document = await vscode.workspace.openTextDocument(uris['project-a/app.pbl/w_probe.srw']);
            const position = getTextPosition(document, '"name"');
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                uris['project-a/app.pbl/w_probe.srw'],
                position,
            );

            assert.ok(hovers);
            assert.ok(hovers!.length > 0);

            const hoverText = hovers!.map(getHoverText).join('\n');

            assert.ok(hoverText.includes('**name**'));
            assert.ok(hoverText.includes('Columna DataWindow enlazada desde `GetItemNumber`()'));
            assert.ok(hoverText.includes('Mapeo remoto: `customer.name`'));
            assert.ok(!hoverText.includes('customer.status'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('HoverProvider expone metadata segura para sample.srd', async () => {
        const uri = getWorkspaceTestUri('sample.srd');
        const document = await vscode.workspace.openTextDocument(uri);
        const expectations: Array<{
            target: string;
            expectedSnippets: string[];
        }> = [
            {
                target: 'detail(',
                expectedSnippets: ['**detail**', 'Banda DataWindow', 'Altura: `76`'],
            },
            {
                target: 'customer.id',
                expectedSnippets: ['**id**', 'Columna de tabla DataWindow', 'Mapeo remoto: `customer.id`'],
            },
            {
                target: 'ORDER BY name',
                expectedSnippets: ['**retrieve**', 'SQL segura de DataWindow', 'ORDER BY name'],
            },
            {
                target: 'Balance',
                expectedSnippets: ['**Balance**', 'Texto DataWindow', 'Banda: `header`'],
            },
            {
                target: '###,##0.00',
                expectedSnippets: ['**column#4**', 'Columna visual DataWindow', 'Formato: `###,##0.00`'],
            },
        ];

        for (const expectation of expectations) {
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                uri,
                getTextPosition(document, expectation.target),
            );

            assert.ok(hovers);
            assert.ok(hovers!.length > 0);

            const hoverText = hovers!.map(getHoverText).join('\n');

            for (const snippet of expectation.expectedSnippets) {
                assert.ok(
                    hoverText.includes(snippet),
                    `Expected hover for ${expectation.target} to include ${snippet}`,
                );
            }
        }
    });

    test('HoverProvider expone metadata enlazada para columnas simples del retrieve en sample.srd', async () => {
        const uri = getWorkspaceTestUri('sample.srd');
        const document = await vscode.workspace.openTextDocument(uri);
        const retrieveLine = 11;
        const nameOffset = document.lineAt(retrieveLine).text.indexOf('name, email');

        assert.ok(nameOffset >= 0, 'Expected retrieve name token in sample.srd');

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            uri,
            new vscode.Position(retrieveLine, nameOffset + 1),
        );

        assert.ok(hovers);
        assert.ok(hovers!.length > 0);

        const hoverText = hovers!.map(getHoverText).join('\n');

        assert.ok(hoverText.includes('**name**'));
        assert.ok(hoverText.includes('Columna SQL del retrieve DataWindow'));
        assert.ok(hoverText.includes('Mapeo remoto: `customer.name`'));
    });

    test('CodeLensProvider expone lentes verificables para retrieve y columnas DataWindow en sample.srd', async () => {
        const uri = getWorkspaceTestUri('sample.srd');
        const document = await vscode.workspace.openTextDocument(uri);

        const lenses = await vscode.commands.executeCommand<vscode.CodeLens[]>(
            'vscode.executeCodeLensProvider',
            uri,
        );

        assert.ok(lenses);
        const powerBuilderLenses = (lenses ?? []).filter(lens => lens.command?.command === 'powerbuilder.showObjectInfo');
        const titles = powerBuilderLenses.map(lens => lens.command?.title ?? '');

        assert.ok(titles.includes('Retrieve SQL: 4 enlazadas'));
        assert.ok(titles.includes('4 columnas tabla · 4 visuales'));
        assert.strictEqual(
            titles.filter(title => title === 'Usada en retrieve SQL').length,
            4,
        );
        assert.ok(
            powerBuilderLenses.some(lens => document.lineAt(lens.range.start.line).text.includes('retrieve=')),
            'Expected a retrieve CodeLens on sample.srd',
        );
    });

    test('HoverProvider respeta powerbuilder.hover.enabled también en sample.srd', async () => {
        const uri = getWorkspaceTestUri('sample.srd');
        const document = await vscode.workspace.openTextDocument(uri);

        try {
            await updateWorkspaceSetting('powerbuilder.hover.enabled', false);

            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                uri,
                getTextPosition(document, 'detail('),
            );

            assert.strictEqual(hovers?.length ?? 0, 0);
        } finally {
            await updateWorkspaceSetting('powerbuilder.hover.enabled', undefined);
        }
    });

    test('HoverProvider expone documentación built-in real para MessageBox', async () => {
        const uri = getWorkspaceTestUri('sample.sru');
        const document = await vscode.workspace.openTextDocument(uri);
        const position = getTextPosition(document, 'MessageBox');

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            uri,
            position,
        );

        assert.ok(hovers);
        assert.ok(hovers!.length > 0);

        const hoverText = hovers!.map(getHoverText).join('\n');

        assert.ok(hoverText.includes('MessageBox'));
        assert.ok(hoverText.includes('Muestra un cuadro de mensaje'));
    });

    test('HoverProvider expone documentación built-in real para GetFileOpenName', async () => {
        const uri = getWorkspaceTestUri('sample.srm');
        const document = await vscode.workspace.openTextDocument(uri);
        const position = getTextPosition(document, 'GetFileOpenName');

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            uri,
            position,
        );

        assert.ok(hovers);
        assert.ok(hovers!.length > 0);

        const hoverText = hovers!.map(getHoverText).join('\n');

        assert.ok(hoverText.includes('GetFileOpenName'));
        assert.ok(hoverText.includes('cuadro de diálogo estándar'));
    });

    test('HoverProvider expone documentación built-in real para IsNumber en el test workspace', async () => {
        const uri = getWorkspaceTestUri('sample.srf');
        const document = await vscode.workspace.openTextDocument(uri);
        const position = getTextPosition(document, 'IsNumber');

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            uri,
            position,
        );

        assert.ok(hovers);
        assert.ok(hovers!.length > 0);

        const hoverText = hovers!.map(getHoverText).join('\n');

        assert.ok(hoverText.includes('IsNumber'));
        assert.ok(hoverText.includes('valor numérico válido'));
    });

    test('HoverProvider expone documentación built-in real para un bloque de archivos y directorios del test workspace', async () => {
        const uri = getWorkspaceTestUri('sample_runtime_fileops.sru');
        const document = await vscode.workspace.openTextDocument(uri);
        const expectations: Array<{ name: string; snippet: string }> = [
            { name: 'GetFileSaveName', snippet: 'cuadro de diálogo estándar' },
            { name: 'GetCurrentDirectory', snippet: 'directorio de trabajo actual' },
            { name: 'ChangeDirectory', snippet: 'Cambia el directorio de trabajo actual' },
            { name: 'DirectoryExists', snippet: 'directorio existe' },
            { name: 'CreateDirectory', snippet: 'Crea un directorio' },
            { name: 'RemoveDirectory', snippet: 'Elimina un directorio vacío' },
            { name: 'FileCopy', snippet: 'Copia un archivo' },
            { name: 'FileDelete', snippet: 'Elimina un archivo' },
            { name: 'FileMove', snippet: 'Mueve o renombra un archivo' },
            { name: 'FileLength', snippet: 'tamaño de un archivo en bytes' },
        ];

        for (const { name, snippet } of expectations) {
            const position = getTextPosition(document, `${name}(`);
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                uri,
                position,
            );

            assert.ok(hovers, `Expected hover result for ${name}`);
            assert.ok(hovers!.length > 0, `Expected at least one hover for ${name}`);

            const hoverText = hovers!.map(getHoverText).join('\n');

            assert.ok(hoverText.includes(name), `Expected hover name for ${name}`);
            assert.ok(hoverText.includes(snippet), `Expected hover summary snippet for ${name}`);
        }
    });

    test('HoverProvider expone documentación built-in real para un bloque oficial de texto y fecha del test workspace', async () => {
        const uri = getWorkspaceTestUri('sample_runtime_textdates.sru');
        const document = await vscode.workspace.openTextDocument(uri);
        const expectations: Array<{ name: string; snippet: string }> = [
            { name: 'LeftTrim', snippet: 'espacios al inicio de una cadena' },
            { name: 'RightTrim', snippet: 'espacios al final de una cadena' },
            { name: 'Fill', snippet: 'longitud indicada repitiendo los caracteres dados' },
            { name: 'LastPos', snippet: 'última aparición de una subcadena' },
            { name: 'Match', snippet: 'coincide con un patrón de texto' },
            { name: 'WordCap', snippet: 'primera letra de cada palabra a mayúscula' },
            { name: 'IsDate', snippet: 'cadena representa una fecha válida' },
            { name: 'IsTime', snippet: 'cadena representa una hora válida' },
            { name: 'DayName', snippet: 'nombre del día de la semana' },
            { name: 'DayNumber', snippet: 'número del día de la semana' },
        ];

        for (const { name, snippet } of expectations) {
            const position = getTextPosition(document, `${name}(`);
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                uri,
                position,
            );

            assert.ok(hovers, `Expected hover result for ${name}`);
            assert.ok(hovers!.length > 0, `Expected at least one hover for ${name}`);

            const hoverText = hovers!.map(getHoverText).join('\n');

            assert.ok(hoverText.includes(name), `Expected hover name for ${name}`);
            assert.ok(hoverText.includes(snippet), `Expected hover summary snippet for ${name}`);
        }
    });

    test('HoverProvider expone documentación built-in real para un bloque oficial de conversión y fecha-hora del test workspace', async () => {
        const uri = getWorkspaceTestUri('sample_runtime_conversion_datetime.sru');
        const document = await vscode.workspace.openTextDocument(uri);
        const expectations: Array<{ name: string; snippet: string }> = [
            { name: 'String', snippet: 'representación en cadena' },
            { name: 'Integer', snippet: 'Convierte un valor a integer' },
            { name: 'Long', snippet: 'Convierte un valor a long' },
            { name: 'Double', snippet: 'Convierte un valor a double' },
            { name: 'Dec', snippet: 'Convierte un valor a decimal' },
            { name: 'Date', snippet: 'Convierte un valor a date' },
            { name: 'Time', snippet: 'Convierte un valor a time' },
            { name: 'Today', snippet: 'fecha actual del sistema' },
            { name: 'Now', snippet: 'fecha y hora actual del sistema' },
            { name: 'Year', snippet: 'año de una fecha' },
            { name: 'Month', snippet: 'mes de una fecha' },
            { name: 'Day', snippet: 'día de una fecha' },
            { name: 'Hour', snippet: 'hora de un valor temporal' },
            { name: 'Minute', snippet: 'minutos de un valor temporal' },
            { name: 'Second', snippet: 'segundos de un valor temporal' },
        ];

        for (const { name, snippet } of expectations) {
            const position = getTextPosition(document, name);
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                uri,
                position,
            );

            assert.ok(hovers, `Expected hover result for ${name}`);
            assert.ok(hovers!.length > 0, `Expected at least one hover for ${name}`);

            const hoverText = hovers!.map(getHoverText).join('\n');

            assert.ok(hoverText.includes(name), `Expected hover name for ${name}`);
            assert.ok(hoverText.includes(snippet), `Expected hover summary snippet for ${name}`);
        }
    });

    test('HoverProvider expone documentación built-in real para un bloque oficial de matemáticas y sistema del test workspace', async () => {
        const uri = getWorkspaceTestUri('sample_runtime_mathcpu.sru');
        const document = await vscode.workspace.openTextDocument(uri);
        const expectations: Array<{ name: string; snippet: string }> = [
            { name: 'Abs', snippet: 'valor absoluto' },
            { name: 'Round', snippet: 'Redondea un número' },
            { name: 'Mod', snippet: 'resto de una división' },
            { name: 'Sqrt', snippet: 'raíz cuadrada' },
            { name: 'Max', snippet: 'mayor de dos números' },
            { name: 'Min', snippet: 'menor de dos números' },
            { name: 'Log', snippet: 'logaritmo natural' },
            { name: 'Exp', snippet: 'exponencial del valor' },
            { name: 'Sin', snippet: 'seno del ángulo' },
            { name: 'Cos', snippet: 'coseno del ángulo' },
            { name: 'Tan', snippet: 'tangente del ángulo' },
            { name: 'Rand', snippet: 'entero pseudoaleatorio' },
            { name: 'Cpu', snippet: 'tiempo de CPU usado por la aplicación' },
        ];

        for (const { name, snippet } of expectations) {
            const position = getTextPosition(document, `${name}(`);
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                uri,
                position,
            );

            assert.ok(hovers, `Expected hover result for ${name}`);
            assert.ok(hovers!.length > 0, `Expected at least one hover for ${name}`);

            const hoverText = hovers!.map(getHoverText).join('\n');

            assert.ok(hoverText.includes(name), `Expected hover name for ${name}`);
            assert.ok(hoverText.includes(snippet), `Expected hover summary snippet for ${name}`);
        }
    });

    test('HoverProvider expone hover semántico para símbolos del documento actual', async () => {
        const uri = getWorkspaceTestUri('sample.sru');
        const document = await vscode.workspace.openTextDocument(uri);
        const declarationText = 'public function integer wf_calculate';
        const declarationOffset = document.getText().indexOf(declarationText);

        assert.ok(declarationOffset >= 0, 'Expected wf_calculate declaration in sample.sru');

        const position = document.positionAt(
            declarationOffset + declarationText.indexOf('wf_calculate') + 2,
        );

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            uri,
            position,
        );

        assert.ok(hovers);
        assert.ok(hovers!.length > 0);

        const hoverText = hovers!.map(getHoverText).join('\n');

        assert.ok(hoverText.includes('(función)'));
        assert.ok(hoverText.includes('wf_calculate'));
        assert.ok(hoverText.includes('Sugerencia exacta de firma'));
        assert.ok(hoverText.includes('Sugerencia exacta de retorno: `integer`'));
    });

    test('HoverProvider expone métodos integrados de objeto para owners tipados reales', async () => {
        const uri = getWorkspaceTestUri('sample.srw');
        const document = await vscode.workspace.openTextDocument(uri);
        const position = getTextPosition(document, 'SetFocus');

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            uri,
            position,
        );

        assert.ok(hovers);
        assert.ok(hovers!.length > 0);

        const hoverText = hovers!.map(getHoverText).join('\n');

        assert.ok(hoverText.includes('SetFocus'));
        assert.ok(hoverText.includes('Método integrado de objeto'));
    });

    test('HoverProvider expone métodos nuevos de ventana owner-aware', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-hover-window-manual-core');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_window_hover.srw': [
                    'global type w_window_hover from window',
                    'end type',
                    'global w_window_hover w_window_hover',
                    '',
                    'event open;',
                    'this.OpenSheet()',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['w_window_hover.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getTextPosition(document, 'OpenSheet');

            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                uri,
                position,
            );

            assert.ok(hovers);
            assert.ok(hovers!.length > 0);

            const hoverText = hovers!.map(getHoverText).join('\n');

            assert.ok(hoverText.includes('OpenSheet'));
            assert.ok(hoverText.includes('Abre un user object como hoja'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('HoverProvider expone métodos DataWindow para owners tipados reales', async () => {
        const uri = getWorkspaceTestUri('sample.srw');
        const document = await vscode.workspace.openTextDocument(uri);
        const position = getTextPosition(document, 'SetTransObject');

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            uri,
            position,
        );

        assert.ok(hovers);
        assert.ok(hovers!.length > 0);

        const hoverText = hovers!.map(getHoverText).join('\n');

        assert.ok(hoverText.includes('SetTransObject'));
        assert.ok(hoverText.includes('Método integrado de DataWindow'));
    });

    test('HoverProvider retira hover fuerte cuando el owner explícito está tipado como Any', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-hover-any-owner');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_service.sru': [
                    'global type n_service from nonvisualobject',
                    'end type',
                    'global n_service n_service',
                    '',
                    'public function long of_any_only ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'w_consumer.srw': [
                    'global type w_consumer from window',
                    'end type',
                    'global w_consumer w_consumer',
                    'any la_owner',
                    '',
                    'event open;',
                    'la_owner = CREATE n_service',
                    'la_owner.of_any_only()',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['n_service.sru']);
            await indexer.indexFile(uris['w_consumer.srw']);

            const uri = uris['w_consumer.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                uri,
                getTextPosition(document, 'of_any_only'),
            );

            assert.ok(!hovers || hovers.length === 0);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider incluye built-ins y símbolos del documento activo', async () => {
        const uri = getWorkspaceTestUri('sample.sru');
        const document = await vscode.workspace.openTextDocument(uri);
        const position = getLineStartPosition(document, 'RETURN li_return');

        const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            uri,
            position,
        );

        assert.ok(completionList);
        assert.ok(completionList!.items.length > 0);

        const labels = completionList!.items.map(getCompletionLabel);

        assert.ok(labels.includes('wf_calculate'));
        assert.ok(labels.includes('MessageBox'));
    });

    test('CompletionItemProvider publica sugerencia compatible de firma y retorno para callables indexados', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-completion-callable-suggestion');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_completion_suggestion.sru': [
                    'global type n_completion_suggestion from nonvisualobject',
                    'end type',
                    'global n_completion_suggestion n_completion_suggestion',
                    '',
                    'public function integer wf_calculate (integer ai_value, ref decimal adc_result);',
                    'return ai_value',
                    'end function',
                    '',
                    'event open;',
                    'wf_ca',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['n_completion_suggestion.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uri,
                getPositionAfterText(document, 'wf_ca'),
            );

            assert.ok(completionList);

            const item = findCompletionItem(completionList!, 'wf_calculate');

            assert.ok(item);

            const documentationText = getCompletionDocumentationText(item!);

            assert.ok(documentationText.includes('Sugerencia compatible de firma'));
            assert.ok(documentationText.includes('Sugerencia compatible de retorno: `integer`'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider expone snippets de llamada y reemplaza el prefijo actual', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-completion-snippets');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_completion_snippet.sru': [
                    'global type n_completion_snippet from nonvisualobject',
                    'end type',
                    'global n_completion_snippet n_completion_snippet',
                    '',
                    'forward prototypes',
                    'public function integer wf_calculate (integer ai_value, ref decimal adc_result)',
                    'end prototypes',
                    '',
                    'event open;',
                    'wf_c',
                    'MessageB',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['n_completion_snippet.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            const indexedPosition = getPositionAfterText(document, 'wf_c');
            const indexedCompletion = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uri,
                indexedPosition,
            );

            assert.ok(indexedCompletion);

            const indexedItem = findCompletionItem(indexedCompletion!, 'wf_calculate');

            assert.ok(indexedItem);
            assert.ok(indexedItem!.insertText instanceof vscode.SnippetString);
            assert.strictEqual(
                (indexedItem!.insertText as vscode.SnippetString).value,
                'wf_calculate(${1:ai_value}, ${2:adc_result})',
            );

            const indexedRange = indexedItem!.range as vscode.Range;

            assert.ok(indexedRange);
            assert.strictEqual(indexedRange.start.line, indexedPosition.line);
            assert.strictEqual(indexedRange.start.character, indexedPosition.character - 'wf_c'.length);
            assert.strictEqual(indexedRange.end.character, indexedPosition.character);

            const systemPosition = getPositionAfterText(document, 'MessageB');
            const systemCompletion = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uri,
                systemPosition,
            );

            assert.ok(systemCompletion);

            const systemItem = findCompletionItem(systemCompletion!, 'MessageBox');

            assert.ok(systemItem);
            assert.ok(systemItem!.insertText instanceof vscode.SnippetString);
            assert.strictEqual(
                (systemItem!.insertText as vscode.SnippetString).value,
                'MessageBox(${1:title}, ${2:text}, ${3:icon}, ${4:button}, ${5:default})',
            );

            const systemRange = systemItem!.range as vscode.Range;

            assert.ok(systemRange);
            assert.strictEqual(systemRange.start.line, systemPosition.line);
            assert.strictEqual(systemRange.start.character, systemPosition.character - 'MessageB'.length);
            assert.strictEqual(systemRange.end.character, systemPosition.character);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider incluye métodos integrados de objeto para owners tipados reales', async () => {
        const uri = getWorkspaceTestUri('sample.srw');
        const document = await vscode.workspace.openTextDocument(uri);
        const position = getPositionAfterText(document, 'sle_name.');

        const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            uri,
            position,
            '.',
        );

        assert.ok(completionList);

        const labels = completionList!.items.map(getCompletionLabel);

        assert.ok(labels.includes('SetFocus'));
        assert.ok(labels.includes('SelectText'));
        assert.ok(labels.includes('Paste'));
        assert.ok(labels.includes('SelectedText'));
        assert.ok(labels.includes('TypeOf'));
        assert.ok(!labels.includes('MessageBox'));
    });

    test('CompletionItemProvider incluye métodos nuevos de ventana owner-aware', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-completion-window-manual-core');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_window_completion.srw': [
                    'global type w_window_completion from window',
                    'end type',
                    'global w_window_completion w_window_completion',
                    '',
                    'event open;',
                    'this.',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['w_window_completion.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'this.');

            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uri,
                position,
                '.',
            );

            assert.ok(completionList);

            const labels = completionList!.items.map(getCompletionLabel);

            assert.ok(labels.includes('OpenSheet'));
            assert.ok(labels.includes('OpenSheetWithParm'));
            assert.ok(labels.includes('SaveDockingState'));
            assert.ok(labels.includes('SetToolbarPos'));
            assert.ok(!labels.includes('MessageBox'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider publica completion completa para this con herencia demostrable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-completion-ambiguous-owner');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_base.srw': [
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'public function long of_base ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'w_child.srw': [
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'public function long of_child ();',
                    'return 2',
                    'end function',
                    '',
                    'event open;',
                    'this.',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['w_base.srw']);

            const uri = uris['w_child.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'this.');

            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uri,
                position,
                '.',
            );

            assert.ok(completionList);
            assert.strictEqual(completionList!.isIncomplete, false);

            const labels = completionList!.items.map(getCompletionLabel);

            assert.ok(labels.includes('of_base'));
            assert.ok(labels.includes('of_child'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider degrada la lista cuando el owner explícito sigue ambiguo', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-completion-owner-ambiguity');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_service_a.sru': [
                    'global type n_service_a from nonvisualobject',
                    'end type',
                    'global n_service_a n_service_a',
                    '',
                    'public function long of_left ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'n_service_b.sru': [
                    'global type n_service_b from nonvisualobject',
                    'end type',
                    'global n_service_b n_service_b',
                    '',
                    'public function long of_right ();',
                    'return 2',
                    'end function',
                ].join('\n'),
                'w_consumer.srw': [
                    'global type w_consumer from window',
                    'end type',
                    'global w_consumer w_consumer',
                    'n_service_a inv_service',
                    'n_service_b inv_service',
                    '',
                    'event open;',
                    'inv_service.',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['n_service_a.sru']);
            await indexer.indexFile(uris['n_service_b.sru']);
            await indexer.indexFile(uris['w_consumer.srw']);

            const uri = uris['w_consumer.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uri,
                getPositionAfterText(document, 'inv_service.'),
                '.',
            );

            assert.ok(completionList);
            assert.strictEqual(completionList!.isIncomplete, true);

            const labels = completionList!.items.map(getCompletionLabel);
            const leftItem = findCompletionItem(completionList!, 'of_left');
            const rightItem = findCompletionItem(completionList!, 'of_right');

            assert.ok(labels.includes('of_left'));
            assert.ok(labels.includes('of_right'));
            assert.ok(leftItem);
            assert.ok(rightItem);
            assert.ok(!getCompletionDocumentationText(leftItem!).includes('Sugerencia '));
            assert.ok(!getCompletionDocumentationText(rightItem!).includes('Sugerencia '));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider incluye métodos DataWindow curados para owners tipados reales', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-completion-datawindow-curated');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_dw_probe.srw': [
                    'global type w_dw_probe from window',
                    'end type',
                    'global w_dw_probe w_dw_probe',
                    'datawindow dw_data',
                    '',
                    'event open;',
                    'dw_data.',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['w_dw_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'dw_data.');

            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uri,
                position,
                '.',
            );

            assert.ok(completionList);

            const labels = completionList!.items.map(getCompletionLabel);

            assert.ok(labels.includes('GetItemNumber'));
            assert.ok(labels.includes('ShareData'));
            assert.ok(labels.includes('SetBorderStyle'));
            assert.ok(labels.includes('ScrollNextRow'));
            assert.ok(labels.includes('SelectText'));
            assert.ok(labels.includes('SetFocus'));
            assert.ok(labels.includes('PrintCancel'));
            assert.ok(!labels.includes('MessageBox'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider sugiere columnas DataWindow enlazadas cuando el target es único', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-completion-datawindow-linked-columns');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'event open;',
                    'dw_customer.SetItemStatus(1, "na", Primary!, DataModified!)',
                    'end event',
                ].join('\n'),
                'd_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(column=(type=long update=yes name=id dbname="customer.id")',
                    ' column=(type=char(100) update=yes name=name dbname="customer.name")',
                    ' column=(type=char(100) update=yes name=nickname dbname="customer.nickname")',
                    ' retrieve="SELECT id, name, nickname FROM customer")',
                ].join('\n'),
            });

            const uri = uris['w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'dw_customer.SetItemStatus(1, "na');
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uri,
                position,
            );

            assert.ok(completionList);
            assert.strictEqual(completionList!.isIncomplete, false);

            const labels = completionList!.items.map(getCompletionLabel);
            const nameItem = findCompletionItem(completionList!, 'name');

            assert.ok(labels.includes('name'));
            assert.ok(!labels.includes('MessageBox'));
            assert.ok(nameItem);
            assert.ok(getCompletionDocumentationText(nameItem!).includes('d_customer_list'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider degrada a lista vacía cuando el target DataWindow sigue ambiguo', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-completion-datawindow-linked-columns-ambiguous');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;
        const previousWordBasedSuggestions = vscode.workspace
            .getConfiguration()
            .inspect<unknown>('editor.wordBasedSuggestions')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);
        await updateWorkspaceSetting('editor.wordBasedSuggestions', false);

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'event open;',
                    'dw_customer.GetItemNumber(1, "")',
                    'end event',
                ].join('\n'),
                'app/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 39;',
                    'datawindow(units=0)',
                ].join('\n'),
                'lib/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 39;',
                    'datawindow(units=0)',
                ].join('\n'),
            });

            const uri = uris['w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);
            const position = getPositionAfterText(document, 'dw_customer.GetItemNumber(1, "');
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uri,
                position,
            );

            assert.ok(completionList);

            const labels = completionList!.items.map(getCompletionLabel);

            assert.ok(!labels.includes('id'));
            assert.ok(!labels.includes('name'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await updateWorkspaceSetting('editor.wordBasedSuggestions', previousWordBasedSuggestions);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider sugiere modstrings conocidos de Modify sobre DataWindow enlazado verificable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-completion-datawindow-modify-known-properties');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'event open;',
                    'dw_customer.Modify("DataWindow.T")',
                    'end event',
                ].join('\n'),
                'd_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(retrieve="SELECT id FROM customer")',
                ].join('\n'),
            });

            const uri = uris['w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'dw_customer.Modify("DataWindow.T');
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uri,
                position,
            );

            assert.ok(completionList);
            const labels = completionList!.items.map(getCompletionLabel);

            assert.ok(labels.includes('DataWindow.Table.Select='));
            assert.ok(!labels.includes('MessageBox'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DefinitionProvider navega Describe(DataWindow.DataObject) al painter enlazado', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-definition-datawindow-dataobject-property');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'event open;',
                    'dw_customer.Describe("DataWindow.DataObject")',
                    'end event',
                ].join('\n'),
                'd_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 39;',
                    'datawindow(units=0)',
                ].join('\n'),
            });

            const uri = uris['w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getTextPosition(document, 'DataWindow.DataObject');
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uri,
                position,
            );

            assert.ok(locations);
            assert.strictEqual(locations?.length, 1);
            assert.strictEqual(
                toWorkspaceRelativePath(locations![0].uri),
                `${baseRelativePath.replace(/\\/g, '/')}/d_customer_list.srd`,
            );
            assert.strictEqual(locations![0].range.start.line, 0);
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('HoverProvider expone metadata segura para Describe(DataWindow.Table.Select)', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-hover-datawindow-table-select-property');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'event open;',
                    'dw_customer.Describe("DataWindow.Table.Select")',
                    'end event',
                ].join('\n'),
                'd_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(retrieve="SELECT id, name FROM customer")',
                ].join('\n'),
            });

            const uri = uris['w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getTextPosition(document, 'DataWindow.Table.Select');
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                uri,
                position,
            );

            assert.ok(hovers);
            assert.ok(hovers!.length > 0);

            const hoverText = hovers!.map(getHoverText).join('\n');

            assert.ok(hoverText.includes('DataWindow.Table.Select'));
            assert.ok(hoverText.includes('SELECT id, name FROM customer'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider sugiere propiedades hijas verificadas de Modify', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-completion-datawindow-child-properties');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_parent dw_parent',
                    'end type',
                    '',
                    'event open;',
                    'dw_parent.Modify("state_id.")',
                    'end event',
                ].join('\n'),
                'd_parent.srd': [
                    '$PBExportHeader$d_parent.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states") retrieve="SELECT state_id FROM employee")',
                    'report(name=rpt_orders dataobject="d_orders")',
                ].join('\n'),
                'd_states.srd': '$PBExportHeader$d_states.srd\nrelease 39;\ndatawindow(units=0)',
                'd_orders.srd': '$PBExportHeader$d_orders.srd\nrelease 39;\ndatawindow(units=0)',
            });

            const uri = uris['w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'dw_parent.Modify("state_id.');
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uri,
                position,
            );

            assert.ok(completionList);
            const labels = completionList!.items.map(getCompletionLabel).sort();

            assert.ok(labels.includes('state_id.DataWindow.DataObject='));
            assert.ok(labels.includes('state_id.DataWindow.Table.Select='));
            assert.ok(labels.includes('state_id.dddw.name='));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DefinitionProvider navega Modify(state_id.dddw.name) al child DataWindow verificado', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-definition-datawindow-child-property');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_parent dw_parent',
                    'end type',
                    '',
                    'event open;',
                    'dw_parent.Modify("state_id.dddw.name=~"d_states~"")',
                    'end event',
                ].join('\n'),
                'd_parent.srd': [
                    '$PBExportHeader$d_parent.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states") retrieve="SELECT state_id FROM employee")',
                ].join('\n'),
                'd_states.srd': '$PBExportHeader$d_states.srd\nrelease 39;\ndatawindow(units=0)',
            });

            const uri = uris['w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getTextPosition(document, 'state_id.dddw.name');
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uri,
                position,
            );

            assert.ok(locations);
            assert.strictEqual(locations?.length, 1);
            assert.strictEqual(
                toWorkspaceRelativePath(locations![0].uri),
                `${baseRelativePath.replace(/\\/g, '/')}/d_states.srd`,
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('HoverProvider expone metadata segura para Describe(rpt_orders.DataWindow.Table.Select)', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-hover-datawindow-child-select-property');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_parent dw_parent',
                    'end type',
                    '',
                    'event open;',
                    'dw_parent.Describe("rpt_orders.DataWindow.Table.Select")',
                    'end event',
                ].join('\n'),
                'd_parent.srd': [
                    '$PBExportHeader$d_parent.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'report(name=rpt_orders dataobject="d_orders")',
                ].join('\n'),
                'd_orders.srd': [
                    '$PBExportHeader$d_orders.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(retrieve="SELECT order_id, order_status FROM orders")',
                ].join('\n'),
            });

            const uri = uris['w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getTextPosition(document, 'rpt_orders.DataWindow.Table.Select');
            const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
                'vscode.executeHoverProvider',
                uri,
                position,
            );

            assert.ok(hovers);
            assert.ok(hovers!.length > 0);

            const hoverText = hovers!.map(getHoverText).join('\n');

            assert.ok(hoverText.includes('rpt_orders.DataWindow.Table.Select'));
            assert.ok(hoverText.includes('SELECT order_id, order_status FROM orders'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DefinitionProvider navega nested child property curada hacia dropdown verificado', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-definition-datawindow-nested-child-property');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_parent dw_parent',
                    'end type',
                    '',
                    'event open;',
                    'dw_parent.Describe("rpt_orders.status_id.dddw.name")',
                    'end event',
                ].join('\n'),
                'd_parent.srd': [
                    '$PBExportHeader$d_parent.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'report(name=rpt_orders dataobject="d_orders")',
                ].join('\n'),
                'd_orders.srd': [
                    '$PBExportHeader$d_orders.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(column=(type=char(10) update=yes name=status_id dbname="sales.status_id" dddw.name="d_status") retrieve="SELECT status_id FROM orders")',
                ].join('\n'),
                'd_status.srd': '$PBExportHeader$d_status.srd\nrelease 39;\ndatawindow(units=0)',
            });

            const uri = uris['w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getTextPosition(document, 'rpt_orders.status_id.dddw.name');
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uri,
                position,
            );

            assert.ok(locations);
            assert.strictEqual(locations?.length, 1);
            assert.strictEqual(
                toWorkspaceRelativePath(locations![0].uri),
                `${baseRelativePath.replace(/\\/g, '/')}/d_status.srd`,
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CompletionItemProvider sugiere hijos conocidos de GetChild sobre un DataWindow enlazado', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-completion-datawindow-getchild');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_parent dw_parent',
                    'end type',
                    'datawindowchild dwc_state',
                    '',
                    'event open;',
                    'dw_parent.GetChild("", dwc_state)',
                    'end event',
                ].join('\n'),
                'd_parent.srd': [
                    '$PBExportHeader$d_parent.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states") retrieve="SELECT state_id FROM employee")',
                    'report(name=rpt_orders dataobject="d_orders")',
                ].join('\n'),
                'd_states.srd': '$PBExportHeader$d_states.srd\nrelease 39;\ndatawindow(units=0)',
                'd_orders.srd': '$PBExportHeader$d_orders.srd\nrelease 39;\ndatawindow(units=0)',
            });

            const uri = uris['w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'dw_parent.GetChild("');
            const completionList = await vscode.commands.executeCommand<vscode.CompletionList>(
                'vscode.executeCompletionItemProvider',
                uri,
                position,
            );

            assert.ok(completionList);
            const labels = completionList!.items.map(getCompletionLabel).sort();

            assert.ok(labels.includes('rpt_orders'));
            assert.ok(labels.includes('state_id'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DefinitionProvider navega GetChild al DataWindow hijo verificado', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-definition-datawindow-getchild');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_parent dw_parent',
                    'end type',
                    'datawindowchild dwc_state',
                    '',
                    'event open;',
                    'dw_parent.GetChild("state_id", dwc_state)',
                    'end event',
                ].join('\n'),
                'd_parent.srd': [
                    '$PBExportHeader$d_parent.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states") retrieve="SELECT state_id FROM employee")',
                ].join('\n'),
                'd_states.srd': '$PBExportHeader$d_states.srd\nrelease 39;\ndatawindow(units=0)',
            });

            const uri = uris['w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getTextPosition(document, 'state_id');
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uri,
                position,
            );

            assert.ok(locations);
            assert.strictEqual(locations?.length, 1);
            assert.strictEqual(
                toWorkspaceRelativePath(locations![0].uri),
                `${baseRelativePath.replace(/\\/g, '/')}/d_states.srd`,
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DefinitionProvider reutiliza el puente local de GetChild para DataWindowChild', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-definition-datawindow-getchild-bridge');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_parent dw_parent',
                    'end type',
                    'datawindowchild dwc_report',
                    '',
                    'event open;',
                    'dw_parent.GetChild("rpt_orders", dwc_report)',
                    'dwc_report.Describe("DataWindow.DataObject")',
                    'end event',
                ].join('\n'),
                'd_parent.srd': [
                    '$PBExportHeader$d_parent.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'report(name=rpt_orders dataobject="d_orders")',
                ].join('\n'),
                'd_orders.srd': '$PBExportHeader$d_orders.srd\nrelease 39;\ndatawindow(units=0)',
            });

            const uri = uris['w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getTextPosition(document, 'DataWindow.DataObject');
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uri,
                position,
            );

            assert.ok(locations);
            assert.strictEqual(locations?.length, 1);
            assert.strictEqual(
                toWorkspaceRelativePath(locations![0].uri),
                `${baseRelativePath.replace(/\\/g, '/')}/d_orders.srd`,
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('SignatureHelpProvider expone firmas del sistema para MessageBox', async () => {
        const uri = getWorkspaceTestUri('sample.sru');
        const document = await vscode.workspace.openTextDocument(uri);
        const position = getPositionAfterText(document, 'MessageBox("Error", ');

        const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
            'vscode.executeSignatureHelpProvider',
            uri,
            position,
            ',',
        );

        assert.ok(signatureHelp);
        assert.ok(signatureHelp!.signatures.length > 0);
        assert.ok(signatureHelp!.signatures[signatureHelp!.activeSignature].label.includes('MessageBox'));
        assert.strictEqual(signatureHelp!.activeParameter, 1);
    });

    test('SignatureHelpProvider expone firmas DataWindow tipadas para Retrieve', async () => {
        const uri = getWorkspaceTestUri('sample.srw');
        const document = await vscode.workspace.openTextDocument(uri);
        const position = getPositionAfterText(document, 'dw_data.Retrieve(');

        const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
            'vscode.executeSignatureHelpProvider',
            uri,
            position,
            '(',
        );

        assert.ok(signatureHelp);
        assert.ok(signatureHelp!.signatures.length > 0);
        assert.ok(signatureHelp!.signatures[signatureHelp!.activeSignature].label.includes('Retrieve'));
        assert.strictEqual(signatureHelp!.activeParameter, 0);
    });

    test('SignatureHelpProvider expone firmas DataWindow tipadas para GetItemNumber', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-signature-datawindow-getitemnumber');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_dw_signature.srw': [
                    'global type w_dw_signature from window',
                    'end type',
                    'global w_dw_signature w_dw_signature',
                    'datawindow dw_data',
                    '',
                    'event open;',
                    'dw_data.GetItemNumber(1, )',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['w_dw_signature.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'dw_data.GetItemNumber(1, ');

            const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
                'vscode.executeSignatureHelpProvider',
                uri,
                position,
                ',',
            );

            assert.ok(signatureHelp);
            assert.ok(signatureHelp!.signatures.length > 0);
            assert.ok(signatureHelp!.signatures[signatureHelp!.activeSignature].label.includes('GetItemNumber'));
            assert.strictEqual(signatureHelp!.activeParameter, 1);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('SignatureHelpProvider expone firmas DataWindow graph curadas para SetDataStyle', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-signature-datawindow-graph-setdatastyle');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_dw_graph_signature.srw': [
                    'global type w_dw_graph_signature from window',
                    'end type',
                    'global w_dw_graph_signature w_dw_graph_signature',
                    'datawindow dw_data',
                    '',
                    'event open;',
                    'dw_data.SetDataStyle(',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['w_dw_graph_signature.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'dw_data.SetDataStyle(');

            const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
                'vscode.executeSignatureHelpProvider',
                uri,
                position,
                '(',
            );

            assert.ok(signatureHelp);
            assert.ok(signatureHelp!.signatures.length > 0);
            assert.ok(signatureHelp!.signatures[signatureHelp!.activeSignature].label.includes('SetDataStyle'));
            assert.strictEqual(signatureHelp!.activeParameter, 0);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('SignatureHelpProvider expone firmas owner-aware para edición de texto', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-signature-owner-aware-text');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_text_probe.srw': [
                    'global type w_text_probe from window',
                    'end type',
                    'global w_text_probe w_text_probe',
                    'singlelineedit sle_name',
                    '',
                    'event open;',
                    'sle_name.SelectText(1, )',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['w_text_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'sle_name.SelectText(1, ');

            const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
                'vscode.executeSignatureHelpProvider',
                uri,
                position,
                ',',
            );

            assert.ok(signatureHelp);
            assert.ok(signatureHelp!.signatures.length > 0);
            assert.ok(signatureHelp!.signatures[signatureHelp!.activeSignature].label.includes('SelectText'));
            assert.strictEqual(signatureHelp!.activeParameter, 1);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('SignatureHelpProvider expone firmas owner-aware de línea y scroll', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-signature-owner-aware-scroll');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_multiline_probe.srw': [
                    'global type w_multiline_probe from window',
                    'end type',
                    'global w_multiline_probe w_multiline_probe',
                    'multilineedit mle_notes',
                    '',
                    'event open;',
                    'mle_notes.Scroll()',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['w_multiline_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'mle_notes.Scroll(');

            const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
                'vscode.executeSignatureHelpProvider',
                uri,
                position,
                '(',
            );

            assert.ok(signatureHelp);
            assert.ok(signatureHelp!.signatures.length > 0);
            assert.ok(signatureHelp!.signatures[signatureHelp!.activeSignature].label.includes('Scroll'));
            assert.strictEqual(signatureHelp!.activeParameter, 0);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('SignatureHelpProvider mantiene ayuda sobre llamada heredada demostrable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-signature-inherited-owner');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_base.srw': [
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'public function long of_base (string as_name);',
                    'return len(as_name)',
                    'end function',
                ].join('\n'),
                'w_child.srw': [
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'event open;',
                    'this.of_base("demo")',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['w_base.srw']);
            await indexer.indexFile(uris['w_child.srw']);

            const uri = uris['w_child.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
                'vscode.executeSignatureHelpProvider',
                uri,
                getPositionAfterText(document, 'this.of_base('),
                '(',
            );

            assert.ok(signatureHelp);
            assert.strictEqual(signatureHelp!.signatures.length, 1);
            assert.ok(signatureHelp!.signatures[0].label.includes('of_base'));

            const documentationText = getSignatureDocumentationText(signatureHelp!.signatures[0]);

            assert.ok(documentationText.includes('Sugerencia compatible de firma: long of_base(string as_name)'));
            assert.ok(documentationText.includes('Sugerencia compatible de retorno: long'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('SignatureHelpProvider selecciona overload indexado por aridad', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-signature-overload');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'overload.sru': [
                    'global type n_service from nonvisualobject',
                    'end type',
                    'global n_service n_service',
                    '',
                    'public function long of_run (string as_name);',
                    'return len(as_name)',
                    'end function',
                    '',
                    'public function long of_run (string as_name, long al_id);',
                    'return al_id',
                    'end function',
                    '',
                    'event open;',
                    'of_run("demo", 5)',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['overload.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'of_run("demo", 5');

            const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
                'vscode.executeSignatureHelpProvider',
                uri,
                position,
                ',',
            );

            assert.ok(signatureHelp);
            assert.strictEqual(signatureHelp!.signatures.length, 1);
            assert.ok(signatureHelp!.signatures[0].label.includes('of_run(string as_name, long al_id)'));
            assert.strictEqual(signatureHelp!.activeParameter, 1);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('SignatureHelpProvider prioriza overload compatible cuando no existe aridad exacta', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-signature-compatible-overload');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'compatible_overload.sru': [
                    'global type n_signature_probe from nonvisualobject',
                    'end type',
                    'global n_signature_probe n_signature_probe',
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

            const uri = uris['compatible_overload.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'of_run("demo", ');

            const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
                'vscode.executeSignatureHelpProvider',
                uri,
                position,
                ',',
            );

            assert.ok(signatureHelp);
            assert.strictEqual(signatureHelp!.signatures.length, 2);
            assert.strictEqual(signatureHelp!.activeSignature, 1);
            assert.ok(signatureHelp!.signatures[1].label.includes('of_run(string as_name, long al_id)'));
            assert.strictEqual(signatureHelp!.activeParameter, 1);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('SignatureHelpProvider degrada llamadas DYNAMIC', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-signature-dynamic');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'dynamic_call.sru': [
                    'global type w_consumer from window',
                    'end type',
                    'global w_consumer w_consumer',
                    'nonvisualobject inv_base',
                    '',
                    'event open;',
                    'inv_base.DYNAMIC of_dynamic_only("demo")',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['dynamic_call.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'of_dynamic_only("demo"');

            const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
                'vscode.executeSignatureHelpProvider',
                uri,
                position,
                '(',
            );

            assert.strictEqual(signatureHelp, undefined);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('SignatureHelpProvider retira ayuda cuando el owner explícito está tipado como Any', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-signature-any-owner');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_service.sru': [
                    'global type n_service from nonvisualobject',
                    'end type',
                    'global n_service n_service',
                    '',
                    'public function long of_any_only (string as_name);',
                    'return len(as_name)',
                    'end function',
                ].join('\n'),
                'w_consumer.srw': [
                    'global type w_consumer from window',
                    'end type',
                    'global w_consumer w_consumer',
                    'any la_owner',
                    '',
                    'event open;',
                    'la_owner = CREATE n_service',
                    'la_owner.of_any_only("demo")',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['n_service.sru']);
            await indexer.indexFile(uris['w_consumer.srw']);

            const uri = uris['w_consumer.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
                'vscode.executeSignatureHelpProvider',
                uri,
                getPositionAfterText(document, 'la_owner.of_any_only('),
                '(',
            );

            assert.strictEqual(signatureHelp, undefined);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('SignatureHelpProvider retira ayuda cuando la llamada indexada sigue ambigua', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-signature-ambiguous-owner');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_base.srw': [
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'public function long of_run (string as_name);',
                    'return len(as_name)',
                    'end function',
                ].join('\n'),
                'w_child.srw': [
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'public function long of_run (string as_name);',
                    'return len(as_name) + 1',
                    'end function',
                    '',
                    'event open;',
                    'this.of_run("demo")',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['w_base.srw']);

            const uri = uris['w_child.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'this.of_run("demo"');

            const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
                'vscode.executeSignatureHelpProvider',
                uri,
                position,
                '(',
            );

            assert.strictEqual(signatureHelp, undefined);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('SignatureHelpProvider resuelve externa local posteada con owner explícito', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-signature-posted-local-external');
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
                    'public function boolean sndPlaySoundA (string as_name, long al_mode);',
                    'return false',
                    'end function',
                    '',
                    'event open;',
                    'inv_host.POST sndPlaySoundA("demo", 0)',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['u_external_host.sru']);

            const uri = uris['w_consumer.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            const position = getPositionAfterText(document, 'sndPlaySoundA("demo", ');

            const signatureHelp = await vscode.commands.executeCommand<vscode.SignatureHelp>(
                'vscode.executeSignatureHelpProvider',
                uri,
                position,
                ',',
            );

            assert.ok(signatureHelp);
            assert.strictEqual(signatureHelp!.signatures.length, 1);
            assert.ok(signatureHelp!.signatures[0].label.includes('sndPlaySoundA(string as_name, uint au_flags)'));
            assert.ok(!signatureHelp!.signatures[0].label.includes('long al_mode'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('WorkspaceSymbolProvider expone símbolos indexados del workspace actual', async () => {
        const uri = getWorkspaceTestUri('sample.sru');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        await indexer.indexFile(uri);

        const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
            'vscode.executeWorkspaceSymbolProvider',
            'wf_calc',
        );

        assert.ok(symbols);

        const matchingSymbol = symbols!.find(symbol =>
            symbol.name === 'wf_calculate' &&
            toWorkspaceRelativePath(symbol.location.uri) === 'sample.sru',
        );

        assert.ok(matchingSymbol);
    });

    test('DefinitionProvider prioriza el proyecto actual vía VS Code API', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-definition');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
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
            await vscode.workspace.openTextDocument(uris['project-a/app.pbl/w_caller.sru']);

            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uris['project-a/app.pbl/w_caller.sru'],
                callerInput.position,
            );

            assert.ok(locations);
            assert.ok(locations!.length > 0);
            assert.strictEqual(
                toWorkspaceRelativePath(locations![0].uri),
                `${baseRelativePath.replace(/\\/g, '/')}/project-a/lib.pbl/n_service.sru`,
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DefinitionProvider retira la navegación cuando la familia global sigue ambigua', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-definition-ambiguous-family');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_service_a.sru': [
                    'global type n_service_a from nonvisualobject',
                    'end type',
                    'global n_service_a n_service_a',
                    '',
                    'global function long gf_conflict ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'n_service_b.sru': [
                    'global type n_service_b from nonvisualobject',
                    'end type',
                    'global n_service_b n_service_b',
                    '',
                    'global function long gf_conflict ();',
                    'return 2',
                    'end function',
                ].join('\n'),
                'w_probe.sru': [
                    'global type w_probe from window',
                    'end type',
                    'global w_probe w_probe',
                    '',
                    'event open;',
                    'gf_conflict()',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['n_service_a.sru']);
            await indexer.indexFile(uris['n_service_b.sru']);
            await indexer.indexFile(uris['w_probe.sru']);
            const document = await vscode.workspace.openTextDocument(uris['w_probe.sru']);
            const position = getTextPosition(document, 'gf_conflict');

            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uris['w_probe.sru'],
                position,
            );

            assert.ok(!locations || locations.length === 0);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DefinitionProvider mantiene navegación compatible para herencia demostrable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-definition-inherited-owner');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const callerInput = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            'this.[[of_base]]()',
            'end event',
        ].join('\n'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_base.srw': [
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'public function long of_base ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'w_child.srw': callerInput.text,
            });

            await indexer.indexFile(uris['w_base.srw']);
            await indexer.indexFile(uris['w_child.srw']);

            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uris['w_child.srw'],
                callerInput.position,
            );

            assert.ok(locations);
            assert.strictEqual(locations!.length, 1);
            assert.strictEqual(
                toWorkspaceRelativePath(locations![0].uri),
                `${baseRelativePath.replace(/\\/g, '/')}/w_base.srw`,
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DeclarationProvider y ImplementationProvider separan prototype y cuerpo ejecutable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-declaration-implementation-split');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const callerInput = extractMarkedText([
            'forward',
            'global type n_service from nonvisualobject',
            'end type',
            'end forward',
            '',
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
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
            'this.[[of_run]]()',
            'end event',
        ].join('\n'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_service.sru': callerInput.text,
            });

            await indexer.indexFile(uris['n_service.sru']);

            const declarationLocations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDeclarationProvider',
                uris['n_service.sru'],
                callerInput.position,
            );
            const implementationLocations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeImplementationProvider',
                uris['n_service.sru'],
                callerInput.position,
            );
            const document = await vscode.workspace.openTextDocument(uris['n_service.sru']);
            const prototypeStart = document.positionAt(document.getText().indexOf('public function long of_run ()'));
            const implementationStart = document.positionAt(document.getText().indexOf('public function long of_run ();'));

            assert.ok(declarationLocations);
            assert.ok(implementationLocations);
            assert.strictEqual(declarationLocations!.length, 1);
            assert.strictEqual(implementationLocations!.length, 1);
            assert.strictEqual(declarationLocations![0].range.start.line, prototypeStart.line);
            assert.strictEqual(implementationLocations![0].range.start.line, implementationStart.line);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('ReferenceProvider limita referencias al proyecto preferido vía VS Code API', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-references');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
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
            await vscode.workspace.openTextDocument(uris['project-a/app.pbl/w_caller.sru']);

            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                uris['project-a/app.pbl/w_caller.sru'],
                callerInput.position,
            );

            assert.ok(locations);
            assert.deepStrictEqual(
                locations!.map(location => toWorkspaceRelativePath(location.uri)).sort(),
                [
                    `${baseRelativePath.replace(/\\/g, '/')}/project-a/app.pbl/w_caller.sru`,
                    `${baseRelativePath.replace(/\\/g, '/')}/project-a/lib.pbl/n_service.sru`,
                    `${baseRelativePath.replace(/\\/g, '/')}/project-a/lib.pbl/w_consumer.sru`,
                ].sort(),
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('ReferenceProvider acota overrides owner-aware al callable más específico', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-references-owner-aware-override');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const callerInput = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'public function long of_ping ();',
            'return 2',
            'end function',
            '',
            'event open;',
            'this.[[of_ping]]()',
            'end event',
        ].join('\n'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_base.srw': [
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'public function long of_ping ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'w_child.srw': callerInput.text,
                'w_other.srw': [
                    'global type w_other from w_base',
                    'end type',
                    'global w_other w_other',
                    '',
                    'event open;',
                    'this.of_ping()',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['w_base.srw']);
            await indexer.indexFile(uris['w_child.srw']);
            await indexer.indexFile(uris['w_other.srw']);
            await vscode.workspace.openTextDocument(uris['w_child.srw']);

            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                uris['w_child.srw'],
                callerInput.position,
            );

            assert.ok(locations);
            assert.deepStrictEqual(
                locations!.map(location =>
                    `${toWorkspaceRelativePath(location.uri)}:${location.range.start.line}`,
                ).sort(),
                [
                    `${baseRelativePath.replace(/\\/g, '/')}/w_child.srw:4`,
                    `${baseRelativePath.replace(/\\/g, '/')}/w_child.srw:9`,
                ],
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('ImplementationProvider expande overrides heredados desde la declaracion base', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-implementation-owner-aware-family');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const baseInput = extractMarkedText([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'public function long [[of_ping]] ();',
            'return 1',
            'end function',
        ].join('\n'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_base.srw': baseInput.text,
                'w_child.srw': [
                    'global type w_child from w_base',
                    'end type',
                    'global w_child w_child',
                    '',
                    'public function long of_ping ();',
                    'return 2',
                    'end function',
                    '',
                    'event open;',
                    'this.of_ping()',
                    'end event',
                ].join('\n'),
                'w_other.srw': [
                    'global type w_other from w_base',
                    'end type',
                    'global w_other w_other',
                    '',
                    'event open;',
                    'this.of_ping()',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['w_base.srw']);
            await indexer.indexFile(uris['w_child.srw']);
            await indexer.indexFile(uris['w_other.srw']);

            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeImplementationProvider',
                uris['w_base.srw'],
                baseInput.position,
            );

            assert.ok(locations);
            assert.deepStrictEqual(
                locations!.map(location =>
                    `${toWorkspaceRelativePath(location.uri)}:${location.range.start.line}`,
                ).sort(),
                [
                    `${baseRelativePath.replace(/\\/g, '/')}/w_base.srw:4`,
                    `${baseRelativePath.replace(/\\/g, '/')}/w_child.srw:4`,
                ],
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('ReferenceProvider retira referencias cuando la familia global sigue ambigua', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-references-ambiguous-family');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_service_a.sru': [
                    'global type n_service_a from nonvisualobject',
                    'end type',
                    'global n_service_a n_service_a',
                    '',
                    'global function long gf_conflict ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'n_service_b.sru': [
                    'global type n_service_b from nonvisualobject',
                    'end type',
                    'global n_service_b n_service_b',
                    '',
                    'global function long gf_conflict ();',
                    'return 2',
                    'end function',
                ].join('\n'),
                'w_probe.sru': [
                    'global type w_probe from window',
                    'end type',
                    'global w_probe w_probe',
                    '',
                    'event open;',
                    'gf_conflict()',
                    'end event',
                ].join('\n'),
                'w_consumer_other.sru': [
                    'global type w_consumer_other from window',
                    'end type',
                    'global w_consumer_other w_consumer_other',
                    '',
                    'event open;',
                    'gf_conflict()',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['n_service_a.sru']);
            await indexer.indexFile(uris['n_service_b.sru']);
            await indexer.indexFile(uris['w_probe.sru']);
            await indexer.indexFile(uris['w_consumer_other.sru']);
            const document = await vscode.workspace.openTextDocument(uris['w_probe.sru']);
            const position = getTextPosition(document, 'gf_conflict');

            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                uris['w_probe.sru'],
                position,
            );

            assert.ok(!locations || locations.length === 0);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('ReferenceProvider encuentra usos owner-aware de métodos DataWindow del sistema sin mezclar globales ajenos', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-system-member-references');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_service.sru': [
                    'global type n_service from nonvisualobject',
                    'end type',
                    'global n_service n_service',
                    '',
                    'public function long Retrieve (long al_id);',
                    'return al_id',
                    'end function',
                    '',
                    'event open;',
                    'Retrieve(99)',
                    'end event',
                ].join('\n'),
                'w_main.srw': [
                    'forward',
                    'global type w_main from window',
                    'end type',
                    'type dw_data from datawindow within w_main',
                    'end type',
                    'end forward',
                    '',
                    'global type w_main from window',
                    'dw_data dw_data',
                    'end type',
                    '',
                    'global w_main w_main',
                    '',
                    'event open;',
                    'dw_data.Retrieve(1)',
                    'dw_data.Retrieve(2)',
                    'end event',
                    '',
                    'type dw_data from datawindow within w_main',
                    'end type',
                ].join('\n'),
                'w_other.srw': [
                    'forward',
                    'global type w_other from window',
                    'end type',
                    'type dw_data from datawindow within w_other',
                    'end type',
                    'end forward',
                    '',
                    'global type w_other from window',
                    'dw_data dw_data',
                    'end type',
                    '',
                    'global w_other w_other',
                    '',
                    'event open;',
                    'dw_data.Retrieve(3)',
                    'end event',
                    '',
                    'type dw_data from datawindow within w_other',
                    'end type',
                ].join('\n'),
            });

            await indexer.indexFile(uris['n_service.sru']);
            await indexer.indexFile(uris['w_main.srw']);
            await indexer.indexFile(uris['w_other.srw']);
            const document = await vscode.workspace.openTextDocument(uris['w_main.srw']);
            const position = getTextPosition(document, 'Retrieve', 1);

            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                uris['w_main.srw'],
                position,
            );

            assert.ok(locations);
            const relativeLocations = locations!.map(location =>
                `${toWorkspaceRelativePath(location.uri)}:${location.range.start.line}`,
            );

            assert.ok(
                !relativeLocations.some(location => location.startsWith(
                    `${baseRelativePath.replace(/\\/g, '/')}/n_service.sru`,
                )),
                'System member references should not include unrelated global Retrieve symbols',
            );
            assert.deepStrictEqual(
                relativeLocations
                    .filter(location => location.startsWith(baseRelativePath.replace(/\\/g, '/')))
                    .sort(),
                [
                    `${baseRelativePath.replace(/\\/g, '/')}/w_main.srw:14`,
                    `${baseRelativePath.replace(/\\/g, '/')}/w_main.srw:15`,
                    `${baseRelativePath.replace(/\\/g, '/')}/w_other.srw:14`,
                ].sort(),
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('ReferenceProvider expone referencias seguras para columnas DataWindow enlazadas desde script', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-references-datawindow-linked-columns');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        try {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'event open;',
                    'dw_customer.GetItemNumber(1, "name")',
                    'end event',
                ].join('\n'),
                'w_probe_two.srw': [
                    'forward',
                    'global type w_probe_two from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe_two',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe_two from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'event open;',
                    'dw_customer.SetItem(1, "name", "demo")',
                    'end event',
                ].join('\n'),
                'd_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(column=(type=long update=yes name=id dbname="customer.id")',
                    ' column=(type=char(100) update=yes name=name dbname="customer.name")',
                    ' retrieve="SELECT id, name FROM customer")',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = getTextPosition(document, '"name"');
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                uris['w_probe.srw'],
                position,
            );

            assert.ok(locations);
            assert.strictEqual(locations?.length, 4);

            const relativePaths = (locations ?? []).map(location => toWorkspaceRelativePath(location.uri));

            assert.ok(relativePaths.includes(`${baseRelativePath.replace(/\\/g, '/')}/w_probe.srw`));
            assert.ok(relativePaths.includes(`${baseRelativePath.replace(/\\/g, '/')}/w_probe_two.srw`));
            assert.strictEqual(
                relativePaths.filter(relativePath => relativePath.endsWith('/d_customer_list.srd')).length,
                2,
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('ReferenceProvider expone referencias seguras para nombres child usados en GetChild y propiedades conocidas', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-references-datawindow-child-names');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        try {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_parent dw_parent',
                    'end type',
                    'datawindowchild dwc_state',
                    '',
                    'event open;',
                    'dw_parent.GetChild("state_id", dwc_state)',
                    'dw_parent.Modify("state_id.dddw.name=~"d_states~"")',
                    'end event',
                ].join('\n'),
                'w_probe_two.srw': [
                    'forward',
                    'global type w_probe_two from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe_two',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe_two from window',
                    'dw_parent dw_parent',
                    'end type',
                    '',
                    'event open;',
                    'dw_parent.Describe("state_id.DataWindow.Table.Select")',
                    'end event',
                ].join('\n'),
                'd_parent.srd': [
                    '$PBExportHeader$d_parent.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states") retrieve="SELECT state_id FROM employee")',
                ].join('\n'),
                'd_states.srd': '$PBExportHeader$d_states.srd\nrelease 39;\ndatawindow(units=0)',
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = getTextPosition(document, '"state_id"');
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                uris['w_probe.srw'],
                position,
            );

            assert.ok(locations);
            assert.strictEqual(locations?.length, 5);

            const relativePaths = (locations ?? []).map(location => toWorkspaceRelativePath(location.uri));

            assert.ok(relativePaths.includes(`${baseRelativePath.replace(/\\/g, '/')}/w_probe.srw`));
            assert.ok(relativePaths.includes(`${baseRelativePath.replace(/\\/g, '/')}/w_probe_two.srw`));
            assert.strictEqual(
                relativePaths.filter(relativePath => relativePath.endsWith('/d_parent.srd')).length,
                2,
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('ReferenceProvider expone referencias seguras para report child names en GetChild y propiedades conocidas', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-references-datawindow-report-child-names');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        try {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_parent dw_parent',
                    'end type',
                    'datawindowchild dwc_report',
                    '',
                    'event open;',
                    'dw_parent.GetChild("rpt_orders", dwc_report)',
                    'end event',
                ].join('\n'),
                'w_probe_two.srw': [
                    'forward',
                    'global type w_probe_two from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe_two',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe_two from window',
                    'dw_parent dw_parent',
                    'end type',
                    '',
                    'event open;',
                    'dw_parent.Describe("rpt_orders.DataWindow.Table.Select")',
                    'end event',
                ].join('\n'),
                'd_parent.srd': [
                    '$PBExportHeader$d_parent.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'report(name=rpt_orders dataobject="d_orders")',
                ].join('\n'),
                'd_orders.srd': '$PBExportHeader$d_orders.srd\nrelease 39;\ndatawindow(units=0)',
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = getTextPosition(document, '"rpt_orders"');
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                uris['w_probe.srw'],
                position,
            );

            assert.ok(locations);
            assert.strictEqual(locations?.length, 3);

            const relativePaths = (locations ?? []).map(location => toWorkspaceRelativePath(location.uri));

            assert.ok(relativePaths.includes(`${baseRelativePath.replace(/\\/g, '/')}/w_probe.srw`));
            assert.ok(relativePaths.includes(`${baseRelativePath.replace(/\\/g, '/')}/w_probe_two.srw`));
            assert.ok(relativePaths.includes(`${baseRelativePath.replace(/\\/g, '/')}/d_parent.srd`));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('RenameProvider limita el renombrado al proyecto preferido vía VS Code API', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-rename');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
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
            const document = await vscode.workspace.openTextDocument(uris['project-a/app.pbl/w_caller.sru']);
            await vscode.window.showTextDocument(document);

            const edit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
                'vscode.executeDocumentRenameProvider',
                uris['project-a/app.pbl/w_caller.sru'],
                callerInput.position,
                'of_launch',
            );

            assert.ok(edit);

            const entries = edit!.entries().map(([uri, textEdits]) => ({
                relativePath: toWorkspaceRelativePath(uri),
                textEdits,
            }));

            assert.deepStrictEqual(
                entries.map(entry => entry.relativePath).sort(),
                [
                    `${baseRelativePath.replace(/\\/g, '/')}/project-a/app.pbl/w_caller.sru`,
                    `${baseRelativePath.replace(/\\/g, '/')}/project-a/lib.pbl/n_service.sru`,
                    `${baseRelativePath.replace(/\\/g, '/')}/project-a/lib.pbl/w_consumer.sru`,
                ].sort(),
            );

            assert.ok(entries.every(entry =>
                entry.textEdits.length === 1 &&
                entry.textEdits[0].newText === 'of_launch',
            ));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('RenameProvider renombra columnas DataWindow enlazadas en script y painter seguro', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-rename-datawindow-linked-columns');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        try {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'event open;',
                    'dw_customer.GetItemNumber(1, "name")',
                    'end event',
                ].join('\n'),
                'w_probe_two.srw': [
                    'forward',
                    'global type w_probe_two from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe_two',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe_two from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'event open;',
                    'dw_customer.SetItemStatus(1, "name", Primary!, DataModified!)',
                    'end event',
                ].join('\n'),
                'd_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(column=(type=long update=yes name=id dbname="customer.id")',
                    ' column=(type=char(100) update=yes name=name dbname="customer.name")',
                    ' retrieve="SELECT id, name FROM customer")',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = getTextPosition(document, '"name"');
            const edit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
                'vscode.executeDocumentRenameProvider',
                uris['w_probe.srw'],
                position,
                'customer_name',
            );

            assert.ok(edit);

            const entries = edit!.entries().map(([uri, textEdits]) => ({
                relativePath: toWorkspaceRelativePath(uri),
                textEdits,
            }));

            assert.deepStrictEqual(
                entries.map(entry => entry.relativePath).sort(),
                [
                    `${baseRelativePath.replace(/\\/g, '/')}/d_customer_list.srd`,
                    `${baseRelativePath.replace(/\\/g, '/')}/w_probe.srw`,
                    `${baseRelativePath.replace(/\\/g, '/')}/w_probe_two.srw`,
                ].sort(),
            );
            assert.strictEqual(entries.find(entry => entry.relativePath.endsWith('/d_customer_list.srd'))?.textEdits.length, 2);
            assert.ok(entries.every(entry => entry.textEdits.every(textEdit => textEdit.newText === 'customer_name')));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('RenameProvider renombra nombres child enlazados en GetChild y propiedades conocidas', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-rename-datawindow-child-names');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        try {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_parent dw_parent',
                    'end type',
                    'datawindowchild dwc_state',
                    '',
                    'event open;',
                    'dw_parent.GetChild("state_id", dwc_state)',
                    'dw_parent.Modify("state_id.dddw.name=~"d_states~"")',
                    'end event',
                ].join('\n'),
                'w_probe_two.srw': [
                    'forward',
                    'global type w_probe_two from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe_two',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe_two from window',
                    'dw_parent dw_parent',
                    'end type',
                    '',
                    'event open;',
                    'dw_parent.Describe("state_id.DataWindow.Table.Select")',
                    'end event',
                ].join('\n'),
                'd_parent.srd': [
                    '$PBExportHeader$d_parent.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states") retrieve="SELECT state_id FROM employee")',
                ].join('\n'),
                'd_states.srd': '$PBExportHeader$d_states.srd\nrelease 39;\ndatawindow(units=0)',
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = getTextPosition(document, 'state_id.dddw.name');
            const edit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
                'vscode.executeDocumentRenameProvider',
                uris['w_probe.srw'],
                position,
                'state_code',
            );

            assert.ok(edit);

            const entries = edit!.entries().map(([uri, textEdits]) => ({
                relativePath: toWorkspaceRelativePath(uri),
                textEdits,
            }));

            assert.deepStrictEqual(
                entries.map(entry => entry.relativePath).sort(),
                [
                    `${baseRelativePath.replace(/\\/g, '/')}/d_parent.srd`,
                    `${baseRelativePath.replace(/\\/g, '/')}/w_probe.srw`,
                    `${baseRelativePath.replace(/\\/g, '/')}/w_probe_two.srw`,
                ].sort(),
            );
            assert.strictEqual(entries.find(entry => entry.relativePath.endsWith('/w_probe.srw'))?.textEdits.length, 2);
            assert.strictEqual(entries.find(entry => entry.relativePath.endsWith('/w_probe_two.srw'))?.textEdits.length, 1);
            assert.strictEqual(entries.find(entry => entry.relativePath.endsWith('/d_parent.srd'))?.textEdits.length, 2);
            assert.ok(entries.every(entry => entry.textEdits.every(textEdit => textEdit.newText === 'state_code')));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('RenameProvider renombra report child names enlazados en GetChild y propiedades conocidas', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-rename-datawindow-report-child-names');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        try {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_parent dw_parent',
                    'end type',
                    'datawindowchild dwc_report',
                    '',
                    'event open;',
                    'dw_parent.GetChild("rpt_orders", dwc_report)',
                    'end event',
                ].join('\n'),
                'w_probe_two.srw': [
                    'forward',
                    'global type w_probe_two from window',
                    'end type',
                    'type dw_parent from datawindow within w_probe_two',
                    'string dataobject = "d_parent"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe_two from window',
                    'dw_parent dw_parent',
                    'end type',
                    '',
                    'event open;',
                    'dw_parent.Describe("rpt_orders.DataWindow.Table.Select")',
                    'end event',
                ].join('\n'),
                'd_parent.srd': [
                    '$PBExportHeader$d_parent.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'report(name=rpt_orders dataobject="d_orders")',
                ].join('\n'),
                'd_orders.srd': '$PBExportHeader$d_orders.srd\nrelease 39;\ndatawindow(units=0)',
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe_two.srw']);
            const position = getTextPosition(document, 'rpt_orders.DataWindow.Table.Select');
            const edit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
                'vscode.executeDocumentRenameProvider',
                uris['w_probe_two.srw'],
                position,
                'rpt_history',
            );

            assert.ok(edit);

            const entries = edit!.entries().map(([uri, textEdits]) => ({
                relativePath: toWorkspaceRelativePath(uri),
                textEdits,
            }));

            assert.deepStrictEqual(
                entries.map(entry => entry.relativePath).sort(),
                [
                    `${baseRelativePath.replace(/\\/g, '/')}/d_parent.srd`,
                    `${baseRelativePath.replace(/\\/g, '/')}/w_probe.srw`,
                    `${baseRelativePath.replace(/\\/g, '/')}/w_probe_two.srw`,
                ].sort(),
            );
            assert.ok(entries.every(entry => entry.textEdits.length === 1));
            assert.ok(entries.every(entry => entry.textEdits[0].newText === 'rpt_history'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('LinkedEditingProvider publica rangos para un parametro claramente resoluble', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-linked-editing-parameter');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const input = extractMarkedText([
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'public function integer of_total (long [[al_value]]);',
            'long ll_total',
            'll_total = al_value',
            'return ll_total + al_value',
            'end function',
        ].join('\n'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_service.sru': input.text,
            });

            await indexer.indexFile(uris['n_service.sru']);

            const document = await vscode.workspace.openTextDocument(uris['n_service.sru']);
            const result = await provideLinkedEditingRanges(
                document,
                input.position,
                SymbolIndex.getInstance(),
            );

            assert.ok(result);
            assert.strictEqual(result!.ranges.length, 3);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('InlayHintsProvider publica nombres de parámetros para llamada owner-aware estable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-inlay-hints-owner-aware');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_service.sru': [
                    'global type n_inlay_hint_service from nonvisualobject',
                    'end type',
                    'global n_inlay_hint_service n_inlay_hint_service',
                    '',
                    'public function long of_inlay_run (string as_name, long ai_count);',
                    'return 1',
                    'end function',
                ].join('\n'),
                'n_consumer.sru': [
                    'global type n_inlay_hint_consumer from nonvisualobject',
                    'end type',
                    'global n_inlay_hint_consumer n_inlay_hint_consumer',
                    'global n_inlay_hint_service inv_inlay_service',
                    '',
                    'event open;',
                    'string ls_name',
                    'long ll_count',
                    'inv_inlay_service.of_inlay_run(ls_name, ll_count)',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['n_service.sru']);
            await indexer.indexFile(uris['n_consumer.sru']);

            const document = await vscode.workspace.openTextDocument(uris['n_consumer.sru']);
            const hints = providePowerBuilderInlayHints(
                document,
                new vscode.Range(0, 0, document.lineCount, 0),
                SymbolIndex.getInstance(),
            );

            assert.deepStrictEqual(
                hints.map(hint => String(hint.label)),
                ['as_name:', 'ai_count:'],
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('RenameProvider acota overrides owner-aware al callable más específico', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-rename-owner-aware-override');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const callerInput = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'public function long of_ping ();',
            'return 2',
            'end function',
            '',
            'event open;',
            'this.[[of_ping]]()',
            'end event',
        ].join('\n'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_base.srw': [
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'public function long of_ping ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'w_child.srw': callerInput.text,
                'w_other.srw': [
                    'global type w_other from w_base',
                    'end type',
                    'global w_other w_other',
                    '',
                    'event open;',
                    'this.of_ping()',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['w_base.srw']);
            await indexer.indexFile(uris['w_child.srw']);
            await indexer.indexFile(uris['w_other.srw']);
            await vscode.workspace.openTextDocument(uris['w_child.srw']);

            const edit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
                'vscode.executeDocumentRenameProvider',
                uris['w_child.srw'],
                callerInput.position,
                'of_ping_child',
            );

            assert.ok(edit);

            const entries = edit!.entries().map(([uri, textEdits]) => ({
                relativePath: toWorkspaceRelativePath(uri),
                textEdits,
            }));

            assert.deepStrictEqual(
                entries.map(entry => entry.relativePath).sort(),
                [
                    `${baseRelativePath.replace(/\\/g, '/')}/w_child.srw`,
                ],
            );
            assert.strictEqual(entries[0].textEdits.length, 2);
            assert.ok(entries[0].textEdits.every(textEdit => textEdit.newText === 'of_ping_child'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('RenameProvider explica el bloqueo cuando la familia global sigue ambigua', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-rename-ambiguous-family');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_service_a.sru': [
                    'global type n_service_a from nonvisualobject',
                    'end type',
                    'global n_service_a n_service_a',
                    '',
                    'global function long gf_conflict ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'n_service_b.sru': [
                    'global type n_service_b from nonvisualobject',
                    'end type',
                    'global n_service_b n_service_b',
                    '',
                    'global function long gf_conflict ();',
                    'return 2',
                    'end function',
                ].join('\n'),
                'w_probe.sru': [
                    'global type w_probe from window',
                    'end type',
                    'global w_probe w_probe',
                    '',
                    'event open;',
                    'gf_conflict()',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['n_service_a.sru']);
            await indexer.indexFile(uris['n_service_b.sru']);
            await indexer.indexFile(uris['w_probe.sru']);
            const document = await vscode.workspace.openTextDocument(uris['w_probe.sru']);
            const position = getTextPosition(document, 'gf_conflict');

            await assert.rejects(
                async () => vscode.commands.executeCommand<vscode.WorkspaceEdit>(
                    'vscode.executeDocumentRenameProvider',
                    uris['w_probe.sru'],
                    position,
                    'of_launch',
                ),
                /m[úu]ltiples candidatos compatibles/i,
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('RenameProvider explica el bloqueo cuando el DataWindow enlazado sigue ambiguo', async () => {
        const baseRelativePath = path.join('phase6-generated', 'provider-rename-datawindow-linked-columns-ambiguous');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        try {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                    '',
                    'global type w_probe from window',
                    'dw_customer dw_customer',
                    'end type',
                    '',
                    'event open;',
                    'dw_customer.GetItemNumber(1, "name")',
                    'end event',
                ].join('\n'),
                'app/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 39;',
                    'datawindow(units=0)',
                ].join('\n'),
                'lib/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 39;',
                    'datawindow(units=0)',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = getTextPosition(document, '"name"');

            await assert.rejects(
                async () => vscode.commands.executeCommand<vscode.WorkspaceEdit>(
                    'vscode.executeDocumentRenameProvider',
                    uris['w_probe.srw'],
                    position,
                    'customer_name',
                ),
                /DataWindow objetivo sigue ambiguo/i,
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });
});