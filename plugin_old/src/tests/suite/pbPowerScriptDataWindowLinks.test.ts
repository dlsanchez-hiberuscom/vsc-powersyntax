import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import {
    analyzePowerScriptDataWindowLinkDiagnostics,
    findPowerScriptDataWindowColumnLiteralAtPosition,
    findPowerScriptDataObjectLiteralAtPosition,
    PowerScriptDataWindowLinkCandidate,
    resolvePowerScriptDataWindowColumnCompletionAtPosition,
    selectPreferredPowerScriptDataWindowCandidate,
} from '../../powerbuilder/datawindow/pbPowerScriptDataWindowLinks';
import {
    preparePowerScriptDataWindowColumnRename,
    providePowerScriptDataWindowColumnReferences,
    providePowerScriptDataWindowColumnRenameEdits,
} from '../../powerbuilder/datawindow/pbPowerScriptDataWindowColumnOccurrences';
import {
    preparePowerScriptDataWindowReportChildRename,
    providePowerScriptDataWindowReportChildReferences,
    providePowerScriptDataWindowReportChildRenameEdits,
} from '../../powerbuilder/datawindow/pbPowerScriptDataWindowChildNameOccurrences';
import {
    providePowerScriptDataWindowChildDefinition,
    providePowerScriptDataWindowChildHover,
    resolvePowerScriptDataWindowChildCompletionAtPosition,
} from '../../powerbuilder/datawindow/pbPowerScriptDataWindowChildren';
import {
    providePowerScriptDataWindowPropertyDefinition,
    providePowerScriptDataWindowPropertyHover,
    resolvePowerScriptDataWindowPropertyCompletionAtPosition,
} from '../../powerbuilder/datawindow/pbPowerScriptDataWindowProperties';
import { PbDataWindowParseResult } from '../../powerbuilder/datawindow/pbDataWindowParser';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { PbProjectParser } from '../../powerbuilder/projecting/pbProjectParser';
import { PowerBuilderProjectRegistry } from '../../powerbuilder/workspace/projectRegistry';

async function writeWorkspaceScenario(
    baseRelativePath: string,
    files: Record<string, string>,
): Promise<Record<string, vscode.Uri>> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for DataWindow link tests');

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
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for DataWindow link tests');

    await fs.rm(
        path.join(workspaceFolder.uri.fsPath, baseRelativePath),
        { recursive: true, force: true },
    );
}

async function updateWorkspaceSetting<T>(
    section: string,
    value: T | undefined,
): Promise<void> {
    await vscode.workspace.getConfiguration().update(section, value, vscode.ConfigurationTarget.Workspace);
}

function getHoverText(hover: vscode.Hover): string {
    return hover.contents.map(content => {
        if (typeof content === 'string') {
            return content;
        }

        if ('value' in content) {
            return content.value;
        }

        return '';
    }).join('\n');
}

function makeCandidate(uriPath: string, objectName: string): PowerScriptDataWindowLinkCandidate {
    return {
        uri: vscode.Uri.file(uriPath),
        document: {} as vscode.TextDocument,
        parseResult: makeParseResult(objectName),
    };
}

function makeParseResult(objectName: string): PbDataWindowParseResult {
    return {
        root: {
            name: objectName,
            kind: 'datawindow',
            detail: 'DataWindow',
            range: new vscode.Range(0, 0, 0, objectName.length),
            selectionRange: new vscode.Range(0, 0, 0, objectName.length),
            children: [],
        },
        metadata: {
            objectName,
            bandNames: ['header', 'detail'],
            tableColumnNames: ['id'],
            textCount: 0,
            displayColumnCount: 1,
            retrieveStatement: 'SELECT id FROM customer',
        },
    };
}

suite('PowerScript DataWindow links', () => {
    const projectRegistry = PowerBuilderProjectRegistry.getInstance();
    const projectParser = new PbProjectParser();

    setup(() => {
        projectRegistry.clear();
        SymbolIndex.getInstance().clear();
    });

    test('detecta el literal DataObject bajo el cursor en una declaración PowerScript', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'powerbuilder',
            content: [
                'forward',
                'global type w_probe from window',
                'end type',
                'type dw_customer from datawindow within w_probe',
                'string dataobject = "d_customer_list"',
                'end type',
                'end forward',
            ].join('\n'),
        });
        const offset = document.getText().indexOf('d_customer_list');
        const literal = findPowerScriptDataObjectLiteralAtPosition(
            document,
            document.positionAt(offset + 2),
        );

        assert.ok(literal);
        assert.strictEqual(literal!.value, 'd_customer_list');
        assert.strictEqual(document.getText(literal!.range), 'd_customer_list');
    });

    test('resuelve completion segura para propiedades conocidas de Modify', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-describe-modify-completion');
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

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = document.positionAt(document.getText().indexOf('DataWindow.T') + 'DataWindow.T'.length);
            const context = await resolvePowerScriptDataWindowPropertyCompletionAtPosition(document, position);

            assert.ok(context?.candidate);
            assert.deepStrictEqual(
                context?.properties?.map(property => property.path),
                ['DataWindow.Table.Select'],
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('navega Describe(DataWindow.DataObject) al painter enlazado', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-describe-dataobject-definition');
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
                    'dw_customer.Describe("DataWindow.DataObject")',
                    'end event',
                ].join('\n'),
                'd_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 39;',
                    'datawindow(units=0)',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = document.positionAt(document.getText().indexOf('DataWindow.DataObject') + 2);
            const locations = await providePowerScriptDataWindowPropertyDefinition(document, position);

            assert.ok(locations);
            assert.strictEqual(locations?.length, 1);
            assert.strictEqual(locations?.[0].uri.toString(), uris['d_customer_list.srd'].toString());
            assert.strictEqual(locations?.[0].range.start.line, 0);
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('expone hover seguro para Describe(DataWindow.Table.Select)', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-describe-select-hover');
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

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = document.positionAt(document.getText().indexOf('DataWindow.Table.Select') + 2);
            const hover = await providePowerScriptDataWindowPropertyHover(document, position);

            assert.ok(hover);
            const hoverText = getHoverText(hover!);

            assert.ok(hoverText.includes('DataWindow.Table.Select'));
            assert.ok(hoverText.includes('SELECT id, name FROM customer'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('resuelve completion segura para propiedades hijas verificadas de Modify', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-modify-child-property-completion');
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
                'd_states.srd': [
                    '$PBExportHeader$d_states.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(retrieve="SELECT state_id, state_name FROM state")',
                ].join('\n'),
                'd_orders.srd': [
                    '$PBExportHeader$d_orders.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(retrieve="SELECT order_id FROM orders")',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = document.positionAt(document.getText().indexOf('state_id.') + 'state_id.'.length);
            const context = await resolvePowerScriptDataWindowPropertyCompletionAtPosition(document, position);

            assert.ok(context?.candidate);
            assert.deepStrictEqual(
                context?.properties?.map(property => property.path).sort(),
                [
                    'state_id.DataWindow.DataObject',
                    'state_id.DataWindow.Table.Select',
                    'state_id.dddw.name',
                ],
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('navega Modify(state_id.dddw.name) al DataWindow hijo verificado', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-modify-child-property-definition');
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

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = document.positionAt(document.getText().indexOf('state_id.dddw.name') + 2);
            const locations = await providePowerScriptDataWindowPropertyDefinition(document, position);

            assert.ok(locations);
            assert.strictEqual(locations?.length, 1);
            assert.strictEqual(locations?.[0].uri.toString(), uris['d_states.srd'].toString());
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('expone hover seguro para Describe(rpt_orders.DataWindow.Table.Select)', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-describe-child-select-hover');
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

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = document.positionAt(document.getText().indexOf('rpt_orders.DataWindow.Table.Select') + 2);
            const hover = await providePowerScriptDataWindowPropertyHover(document, position);

            assert.ok(hover);
            const hoverText = getHoverText(hover!);

            assert.ok(hoverText.includes('rpt_orders.DataWindow.Table.Select'));
            assert.ok(hoverText.includes('SELECT order_id, order_status FROM orders'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('resuelve completion segura para nested properties curadas de report child hacia dropdown verificado', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-nested-report-dropdown-completion');
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
                    '',
                    'event open;',
                    'dw_parent.Modify("rpt_orders.")',
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
                'd_status.srd': [
                    '$PBExportHeader$d_status.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(retrieve="SELECT status_id, status_name FROM status")',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = document.positionAt(document.getText().indexOf('rpt_orders.') + 'rpt_orders.'.length);
            const context = await resolvePowerScriptDataWindowPropertyCompletionAtPosition(document, position);

            assert.ok(context?.candidate);
            assert.deepStrictEqual(
                context?.properties?.map(property => property.path).sort(),
                [
                    'rpt_orders.DataWindow.DataObject',
                    'rpt_orders.DataWindow.Table.Select',
                    'rpt_orders.status_id.DataWindow.DataObject',
                    'rpt_orders.status_id.DataWindow.Table.Select',
                    'rpt_orders.status_id.dddw.name',
                ],
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('expone hover seguro para Describe(state_id.rpt_detail.DataWindow.Table.Select)', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-nested-dropdown-report-hover');
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
                    '',
                    'event open;',
                    'dw_parent.Describe("state_id.rpt_detail.DataWindow.Table.Select")',
                    'end event',
                ].join('\n'),
                'd_parent.srd': [
                    '$PBExportHeader$d_parent.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states") retrieve="SELECT state_id FROM employee")',
                ].join('\n'),
                'd_states.srd': [
                    '$PBExportHeader$d_states.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'report(name=rpt_detail dataobject="d_state_detail")',
                ].join('\n'),
                'd_state_detail.srd': [
                    '$PBExportHeader$d_state_detail.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(retrieve="SELECT detail_id, detail_name FROM state_detail")',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = document.positionAt(document.getText().indexOf('state_id.rpt_detail.DataWindow.Table.Select') + 2);
            const hover = await providePowerScriptDataWindowPropertyHover(document, position);

            assert.ok(hover);
            const hoverText = getHoverText(hover!);

            assert.ok(hoverText.includes('state_id.rpt_detail.DataWindow.Table.Select'));
            assert.ok(hoverText.includes('SELECT detail_id, detail_name FROM state_detail'));
            assert.ok(hoverText.includes('state_id > rpt_detail'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('sugiere nombres seguros de GetChild para dropdown child y report', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-getchild-completion');
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

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = document.positionAt(document.getText().indexOf('"", dwc_state') + 1);
            const context = await resolvePowerScriptDataWindowChildCompletionAtPosition(document, position);

            assert.ok(context?.candidate);
            assert.deepStrictEqual(
                context?.children?.map(child => child.childName).sort(),
                ['rpt_orders', 'state_id'],
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('navega GetChild al DataWindow hijo verificado', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-getchild-definition');
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

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = document.positionAt(document.getText().indexOf('state_id') + 2);
            const locations = await providePowerScriptDataWindowChildDefinition(document, position);

            assert.ok(locations);
            assert.strictEqual(locations?.length, 1);
            assert.strictEqual(locations?.[0].uri.toString(), uris['d_states.srd'].toString());
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('puentea DataWindowChild local via GetChild para reutilizar navegación de propiedades', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-getchild-bridge');
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

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = document.positionAt(document.getText().lastIndexOf('DataWindow.DataObject') + 2);
            const locations = await providePowerScriptDataWindowPropertyDefinition(document, position);
            const hover = await providePowerScriptDataWindowChildHover(
                document,
                document.positionAt(document.getText().indexOf('rpt_orders') + 2),
            );

            assert.ok(locations);
            assert.strictEqual(locations?.[0].uri.toString(), uris['d_orders.srd'].toString());
            assert.ok(hover);
            assert.ok(getHoverText(hover!).includes('d_orders'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('encuentra referencias seguras de columnas DataWindow enlazadas desde script', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-column-references');
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
            const position = document.positionAt(document.getText().indexOf('"name"') + 2);
            const locations = await providePowerScriptDataWindowColumnReferences(document, position, true);

            assert.ok(locations);
            assert.strictEqual(locations?.length, 4);

            const relativePaths = (locations ?? []).map(location => vscode.workspace.asRelativePath(location.uri, false).replace(/\\/g, '/'));

            assert.ok(relativePaths.includes(path.join(baseRelativePath, 'w_probe.srw').replace(/\\/g, '/')));
            assert.ok(relativePaths.includes(path.join(baseRelativePath, 'w_probe_two.srw').replace(/\\/g, '/')));
            assert.strictEqual(
                relativePaths.filter(relativePath => relativePath.endsWith('d_customer_list.srd')).length,
                2,
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('prepara un rename seguro para columnas enlazadas y actualiza script y painter', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-column-rename');
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
            const position = document.positionAt(document.getText().indexOf('"name"') + 2);
            const renameTarget = await preparePowerScriptDataWindowColumnRename(document, position);
            const edit = await providePowerScriptDataWindowColumnRenameEdits(document, position, 'customer_name');

            assert.ok(renameTarget?.canRename);
            assert.strictEqual(renameTarget?.placeholder, 'name');
            assert.ok(edit);
            assert.strictEqual(edit?.get(uris['w_probe.srw'])?.length, 1);
            assert.strictEqual(edit?.get(uris['w_probe_two.srw'])?.length, 1);
            assert.strictEqual(edit?.get(uris['d_customer_list.srd'])?.length, 2);
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('encuentra referencias seguras para nombres child usados en GetChild y propiedades conocidas', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-child-name-references');
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
            const position = document.positionAt(document.getText().indexOf('"state_id"') + 2);
            const locations = await providePowerScriptDataWindowColumnReferences(document, position, true);

            assert.ok(locations);
            assert.strictEqual(locations?.length, 5);

            const relativePaths = (locations ?? []).map(location => vscode.workspace.asRelativePath(location.uri, false).replace(/\\/g, '/'));

            assert.ok(relativePaths.includes(path.join(baseRelativePath, 'w_probe.srw').replace(/\\/g, '/')));
            assert.ok(relativePaths.includes(path.join(baseRelativePath, 'w_probe_two.srw').replace(/\\/g, '/')));
            assert.strictEqual(
                relativePaths.filter(relativePath => relativePath.endsWith('d_parent.srd')).length,
                2,
            );
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('renombra nombres child enlazados desde GetChild y propiedades conocidas', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-child-name-rename');
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
            const position = document.positionAt(document.getText().indexOf('state_id.dddw.name') + 2);
            const renameTarget = await preparePowerScriptDataWindowColumnRename(document, position);
            const edit = await providePowerScriptDataWindowColumnRenameEdits(document, position, 'state_code');

            assert.ok(renameTarget?.canRename);
            assert.strictEqual(renameTarget?.placeholder, 'state_id');
            assert.ok(edit);
            assert.strictEqual(edit?.get(uris['w_probe.srw'])?.length, 2);
            assert.strictEqual(edit?.get(uris['w_probe_two.srw'])?.length, 1);
            assert.strictEqual(edit?.get(uris['d_parent.srd'])?.length, 2);
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('bloquea el rename de columnas enlazadas cuando el target .srd sigue ambiguo', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-column-rename-ambiguous');
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
            const position = document.positionAt(document.getText().indexOf('"name"') + 2);
            const renameTarget = await preparePowerScriptDataWindowColumnRename(document, position);

            assert.ok(renameTarget);
            assert.strictEqual(renameTarget?.canRename, false);
            assert.ok(renameTarget?.reason?.includes('DataWindow objetivo sigue ambiguo'));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('encuentra referencias seguras para report child names en GetChild y propiedades conocidas', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-report-child-references');
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
                'd_orders.srd': [
                    '$PBExportHeader$d_orders.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(retrieve="SELECT order_id FROM orders")',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = document.positionAt(document.getText().indexOf('"rpt_orders"') + 2);
            const locations = await providePowerScriptDataWindowReportChildReferences(document, position, true);

            assert.ok(locations);
            assert.strictEqual(locations?.length, 3);

            const relativePaths = (locations ?? []).map(location => vscode.workspace.asRelativePath(location.uri, false).replace(/\\/g, '/'));

            assert.ok(relativePaths.includes(path.join(baseRelativePath, 'w_probe.srw').replace(/\\/g, '/')));
            assert.ok(relativePaths.includes(path.join(baseRelativePath, 'w_probe_two.srw').replace(/\\/g, '/')));
            assert.ok(relativePaths.includes(path.join(baseRelativePath, 'd_parent.srd').replace(/\\/g, '/')));
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('renombra report child names enlazados en GetChild y propiedades conocidas', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-report-child-rename');
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
                'd_orders.srd': [
                    '$PBExportHeader$d_orders.srd',
                    'release 39;',
                    'datawindow(units=0)',
                    'table(retrieve="SELECT order_id FROM orders")',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe_two.srw']);
            const position = document.positionAt(document.getText().indexOf('rpt_orders.DataWindow.Table.Select') + 2);
            const renameTarget = await preparePowerScriptDataWindowReportChildRename(document, position);
            const edit = await providePowerScriptDataWindowReportChildRenameEdits(document, position, 'rpt_history');

            assert.ok(renameTarget?.canRename);
            assert.strictEqual(renameTarget?.placeholder, 'rpt_orders');
            assert.ok(edit);
            assert.strictEqual(edit?.get(uris['w_probe.srw'])?.length, 1);
            assert.strictEqual(edit?.get(uris['w_probe_two.srw'])?.length, 1);
            assert.strictEqual(edit?.get(uris['d_parent.srd'])?.length, 1);
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('detecta el literal de columna en el segundo argumento de GetItemNumber', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'powerbuilder',
            content: [
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
            ].join('\n'),
        });
        const offset = document.getText().indexOf('"name"');
        const literal = findPowerScriptDataWindowColumnLiteralAtPosition(
            document,
            document.positionAt(offset + 2),
        );

        assert.ok(literal);
        assert.strictEqual(literal!.columnName, 'name');
        assert.strictEqual(literal!.methodName, 'GetItemNumber');
        assert.strictEqual(literal!.ownerName, 'dw_customer');
        assert.strictEqual(document.getText(literal!.range), 'name');
    });

    test('resuelve contexto de completion para columnas DataWindow con target único', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-column-completion-context');
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
                    'dw_customer.GetItemNumber(1, "na")',
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
            const position = document.positionAt(document.getText().indexOf('"na"') + 2);
            const context = await resolvePowerScriptDataWindowColumnCompletionAtPosition(document, position);

            assert.ok(context);
            assert.strictEqual(context.reason, undefined);
            assert.ok(context.candidate);
            assert.strictEqual(context.candidate!.parseResult.metadata.objectName, 'd_customer_list');
            assert.deepStrictEqual(
                context.columns?.map(column => column.name),
                ['id', 'name'],
            );
            assert.strictEqual(document.getText(context.literal.range), 'na');
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('degrada el contexto de completion si el target DataWindow sigue ambiguo', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-column-completion-ambiguous-target');
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
                    'dw_customer.GetItemNumber(1, "")',
                    'end event',
                ].join('\n'),
                'app/d_customer_list.srd': [
                    '$TBExportHeader$d_customer_list.srd',
                    'release 39;',
                    'datawindow(units=0)',
                ].join('\n'),
                'lib/d_customer_list.srd': [
                    '$TBExportHeader$d_customer_list.srd',
                    'release 39;',
                    'datawindow(units=0)',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const position = document.positionAt(document.getText().indexOf('""') + 1);
            const context = await resolvePowerScriptDataWindowColumnCompletionAtPosition(document, position);

            assert.ok(context);
            assert.strictEqual(context.reason, 'ambiguous-target');
            assert.strictEqual(context.columns, undefined);
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('prefiere el painter DataWindow del proyecto actual cuando existen duplicados cross-project', () => {
        const projectA = projectParser.parseProjectText(
            vscode.Uri.file('/workspace/project-a.pbproj'),
            [
                '<Project>',
                '    <Libraries AppEntry="project-a\\app.pbl">',
                '        <Library Path="project-a\\app.pbl"/>',
                '    </Libraries>',
                '</Project>',
            ].join('\n'),
        );
        const projectB = projectParser.parseProjectText(
            vscode.Uri.file('/workspace/project-b.pbproj'),
            [
                '<Project>',
                '    <Libraries AppEntry="project-b\\app.pbl">',
                '        <Library Path="project-b\\app.pbl"/>',
                '    </Libraries>',
                '</Project>',
            ].join('\n'),
        );

        assert.ok(projectA);
        assert.ok(projectB);
        projectRegistry.setProject(projectA!);
        projectRegistry.setProject(projectB!);

        const selected = selectPreferredPowerScriptDataWindowCandidate(
            vscode.Uri.file('/workspace/project-a/app.pbl/w_probe.srw'),
            [
                makeCandidate('/workspace/project-a/app.pbl/d_customer_list.srd', 'd_customer_list'),
                makeCandidate('/workspace/project-b/app.pbl/d_customer_list.srd', 'd_customer_list'),
            ],
            projectRegistry,
        );

        assert.ok(selected);
        assert.strictEqual(
            selected!.uri.fsPath.replace(/\\/g, '/'),
            '/workspace/project-a/app.pbl/d_customer_list.srd',
        );
    });

    test('bloquea el enlace si el proyecto actual sigue teniendo múltiples painters candidatos', () => {
        const project = projectParser.parseProjectText(
            vscode.Uri.file('/workspace/project-a.pbproj'),
            [
                '<Project>',
                '    <Libraries AppEntry="project-a\\app.pbl">',
                '        <Library Path="project-a\\app.pbl"/>',
                '        <Library Path="project-a\\lib.pbl"/>',
                '    </Libraries>',
                '</Project>',
            ].join('\n'),
        );

        assert.ok(project);
        projectRegistry.setProject(project!);

        const selected = selectPreferredPowerScriptDataWindowCandidate(
            vscode.Uri.file('/workspace/project-a/app.pbl/w_probe.srw'),
            [
                makeCandidate('/workspace/project-a/app.pbl/d_customer_list.srd', 'd_customer_list'),
                makeCandidate('/workspace/project-a/lib.pbl/d_customer_list.srd', 'd_customer_list'),
            ],
            projectRegistry,
        );

        assert.strictEqual(selected, undefined);
    });

    test('diagnostica un DataObject sin target .srd único', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-dataobject-no-unique-target');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        try {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'app/w_probe.srw': [
                    'forward',
                    'global type w_probe from window',
                    'end type',
                    'type dw_customer from datawindow within w_probe',
                    'string dataobject = "d_customer_list"',
                    'end type',
                    'end forward',
                ].join('\n'),
                'app/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 19;',
                    'datawindow(units=0)',
                ].join('\n'),
                'lib/d_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 19;',
                    'datawindow(units=0)',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['app/w_probe.srw']);
            const diagnostics = await analyzePowerScriptDataWindowLinkDiagnostics(document);
            const diagnostic = diagnostics.find(entry => entry.code === 'pb-datawindow-script-dataobject-no-unique-target');

            assert.ok(diagnostic, 'Expected a conservative diagnostic for a non-unique DataObject target');
            assert.ok(diagnostic!.message.includes('d_customer_list'));
            assert.strictEqual(diagnostic!.range.start.line, 4);
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('diagnostica columnas inexistentes solo cuando el vínculo local es demostrable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'links-unknown-column-diagnostic');
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
                    'global w_probe w_probe',
                    '',
                    'event open;',
                    'long ll_name',
                    'll_name = dw_customer.GetItemNumber(1, "ghost_name")',
                    'll_name = dw_missing.GetItemNumber(1, "ghost_name")',
                    'end event',
                ].join('\n'),
                'd_customer_list.srd': [
                    '$PBExportHeader$d_customer_list.srd',
                    'release 19;',
                    'datawindow(units=0)',
                    'table(column=(type=long update=yes name=id dbname="customer.id")',
                    ' column=(type=char(100) update=yes name=name dbname="customer.name")',
                    ' retrieve="SELECT id, name FROM customer")',
                ].join('\n'),
            });

            const document = await vscode.workspace.openTextDocument(uris['w_probe.srw']);
            const diagnostics = await analyzePowerScriptDataWindowLinkDiagnostics(document);
            const columnDiagnostics = diagnostics.filter(entry => entry.code === 'pb-datawindow-script-unknown-column');

            assert.strictEqual(columnDiagnostics.length, 1, 'Only the verifiable owner should publish a diagnostic');
            assert.ok(columnDiagnostics[0].message.includes('ghost_name'));
            assert.strictEqual(columnDiagnostics[0].range.start.line, 16);
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });
});