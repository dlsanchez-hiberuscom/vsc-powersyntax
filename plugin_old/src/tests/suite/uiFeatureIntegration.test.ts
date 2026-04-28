import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import { PB_USER_MESSAGES } from '../../core/i18n/pbUserMessages';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { WorkspaceIndexer } from '../../powerbuilder/indexing/workspaceIndexer';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { getInheritanceGraph } from '../../powerbuilder/semantic/inheritanceGraph';
import { PowerBuilderProjectRegistry } from '../../powerbuilder/workspace/projectRegistry';
import { registerCodeActions } from '../../features/direct-api-ide/code-actions/registerCodeActions';
import { registerDiagnosticsPanel } from '../../features/direct-api-ide/diagnostics/registerDiagnosticsPanel';
import { registerExplorer } from '../../features/direct-api-ide/explorer/registerExplorer';
import { registerFormatting } from '../../features/direct-api-ide/formatting/registerFormatting';
import { registerStatusBar } from '../../features/direct-api-ide/ui/registerStatusBar';

const UI_SCENARIO_ROOT = path.join('.tmp-test-scenarios', 'ui-feature-integration');

interface MockStatusBarItem extends vscode.Disposable {
    text: string;
    tooltip?: string | vscode.MarkdownString;
    command?: string | vscode.Command;
    visible: boolean;
    showCount: number;
    hideCount: number;
    show(): void;
    hide(): void;
}

function getWorkspaceTestUri(relativePath: string): vscode.Uri {
    return vscode.Uri.file(
        path.join(
            vscode.workspace.workspaceFolders![0].uri.fsPath,
            relativePath,
        ),
    );
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
            UI_SCENARIO_ROOT,
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
    const scenarioRoot = path.join(workspaceFolder.uri.fsPath, UI_SCENARIO_ROOT);

    try {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    } catch {
        // Ignorar hosts sin UI completa durante el cleanup.
    }

    try {
        await fs.rm(path.join(scenarioRoot, baseRelativePath), { recursive: true, force: true });
        await removeUiScenarioRoot();
    } catch {
        // Ignorar locks transitorios del host de tests.
    }

    PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
    SymbolIndex.getInstance().clear();
    PbLibraryGraph.getInstance().clear();
    getInheritanceGraph(SymbolIndex.getInstance()).clear();
    PowerBuilderProjectRegistry.getInstance().clear();
}

async function removeUiScenarioRoot(): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for integration tests');

    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            await fs.rm(path.join(workspaceFolder.uri.fsPath, UI_SCENARIO_ROOT), { recursive: true, force: true });
            PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
            SymbolIndex.getInstance().clear();
            PbLibraryGraph.getInstance().clear();
            getInheritanceGraph(SymbolIndex.getInstance()).clear();
            PowerBuilderProjectRegistry.getInstance().clear();
            return;
        } catch {
            await delay(50);
        }
    }

    PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
    SymbolIndex.getInstance().clear();
    PbLibraryGraph.getInstance().clear();
    getInheritanceGraph(SymbolIndex.getInstance()).clear();
    PowerBuilderProjectRegistry.getInstance().clear();
}

function getTextPosition(document: vscode.TextDocument, searchText: string): vscode.Position {
    const offset = document.getText().indexOf(searchText);
    assert.ok(offset >= 0, `Expected ${searchText} in ${document.uri.fsPath}`);

    return document.positionAt(offset + Math.floor(searchText.length / 2));
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

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateWorkspaceSetting<T>(
    section: string,
    value: T | undefined,
): Promise<void> {
    await vscode.workspace.getConfiguration().update(section, value, vscode.ConfigurationTarget.Workspace);
}

function createMockStatusBarItem(): MockStatusBarItem {
    return {
        text: '',
        tooltip: undefined,
        command: undefined,
        visible: false,
        showCount: 0,
        hideCount: 0,
        show() {
            this.visible = true;
            this.showCount++;
        },
        hide() {
            this.visible = false;
            this.hideCount++;
        },
        dispose() {
            this.visible = false;
        },
    };
}

function getCodeActionTitle(action: vscode.Command | vscode.CodeAction): string {
    return action.title;
}

function extractWorkspaceEdit(action: vscode.Command | vscode.CodeAction): vscode.WorkspaceEdit | undefined {
    return 'edit' in action ? action.edit : undefined;
}

suite('UI feature integration', () => {
    setup(() => {
        SymbolIndex.getInstance().clear();
        PbLibraryGraph.getInstance().clear();
        PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
        getInheritanceGraph(SymbolIndex.getInstance()).clear();
        PowerBuilderProjectRegistry.getInstance().clear();
    });

    teardown(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await removeUiScenarioRoot();
    });

    test('CodeActionProvider expone quick fix real para IF sin cerrar', async () => {
        const baseRelativePath = path.join('phase6-generated', 'code-actions-if');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'unclosed_if.sru': [
                    'event open;',
                    'IF 1 = 1 THEN',
                    'MessageBox("Hola", "Mundo")',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['unclosed_if.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (diagnostics.some(diagnostic => diagnostic.code === 'pb-unclosed-if')) {
                    break;
                }
                await delay(50);
            }

            const targetDiagnostic = diagnostics.find(diagnostic => diagnostic.code === 'pb-unclosed-if');
            assert.ok(targetDiagnostic, 'Expected unclosed IF diagnostic');

            const actions = await vscode.commands.executeCommand<Array<vscode.Command | vscode.CodeAction>>(
                'vscode.executeCodeActionProvider',
                uri,
                targetDiagnostic!.range,
                vscode.CodeActionKind.QuickFix.value,
            );

            assert.ok(actions);

            const quickFix = actions!.find(action =>
                getCodeActionTitle(action) === PB_USER_MESSAGES.codeActions.insertEndIf,
            );

            assert.ok(quickFix);

            const edit = extractWorkspaceEdit(quickFix!);
            assert.ok(edit);

            const textEdits = edit!
                .entries()
                .flatMap(([, edits]) => edits);
            const endIfEdit = textEdits.find(textEdit => textEdit.newText.includes('END IF'));

            assert.ok(endIfEdit);
            assert.strictEqual(endIfEdit!.range.start.line, 3, 'Quick fix should insert END IF before end event');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CodeActionProvider inserta END IF antes del siguiente statement dedentado', async () => {
        const baseRelativePath = path.join('phase6-generated', 'code-actions-if-before-return');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'unclosed_if_function.sru': [
                    'global type n_service from nonvisualobject',
                    'end type',
                    'global n_service n_service',
                    '',
                    'public function integer of_test ();',
                    'IF 1 = 1 THEN',
                    '   MessageBox("Hola", "Mundo")',
                    'RETURN 1',
                    'end function',
                ].join('\n'),
            });

            const uri = uris['unclosed_if_function.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (diagnostics.some(diagnostic => diagnostic.code === 'pb-unclosed-if')) {
                    break;
                }
                await delay(50);
            }

            const targetDiagnostic = diagnostics.find(diagnostic => diagnostic.code === 'pb-unclosed-if');
            const actions = await vscode.commands.executeCommand<Array<vscode.Command | vscode.CodeAction>>(
                'vscode.executeCodeActionProvider',
                uri,
                targetDiagnostic!.range,
                vscode.CodeActionKind.QuickFix.value,
            );

            assert.ok(actions);

            const quickFix = actions!.find(action =>
                getCodeActionTitle(action) === PB_USER_MESSAGES.codeActions.insertEndIf,
            );

            assert.ok(quickFix);

            const edit = extractWorkspaceEdit(quickFix!);
            assert.ok(edit);

            const textEdits = edit!
                .entries()
                .flatMap(([, edits]) => edits);
            const endIfEdit = textEdits.find(textEdit => textEdit.newText.includes('END IF'));

            assert.ok(endIfEdit);
            assert.strictEqual(endIfEdit!.range.start.line, 7, 'Quick fix should insert END IF before RETURN 1');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('CodeActionProvider ofrece reemplazo mecánico para función runtime obsoleta', async () => {
        const baseRelativePath = path.join('phase6-generated', 'code-actions-obsolete-runtime');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'obsolete_runtime_fix.sru': [
                    'event open;',
                    'string ls_value',
                    'ls_value = MidW("demo", 2)',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['obsolete_runtime_fix.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (diagnostics.some(diagnostic => diagnostic.code === 'pb-obsolete-runtime-function')) {
                    break;
                }
                await delay(50);
            }

            const targetDiagnostic = diagnostics.find(diagnostic => diagnostic.code === 'pb-obsolete-runtime-function');
            assert.ok(targetDiagnostic, 'Expected obsolete runtime diagnostic');

            const actions = await vscode.commands.executeCommand<Array<vscode.Command | vscode.CodeAction>>(
                'vscode.executeCodeActionProvider',
                uri,
                targetDiagnostic!.range,
                vscode.CodeActionKind.QuickFix.value,
            );

            assert.ok(actions);

            const quickFix = actions!.find(action =>
                getCodeActionTitle(action) === "Reemplazar 'MidW' por 'Mid'",
            );

            assert.ok(quickFix, 'Expected obsolete runtime replacement quick fix');

            const edit = extractWorkspaceEdit(quickFix!);
            assert.ok(edit);

            const textEdits = edit!
                .entries()
                .flatMap(([, edits]) => edits);
            const replaceEdit = textEdits.find(textEdit => textEdit.newText === 'Mid');

            assert.ok(replaceEdit, 'Expected a replacement edit towards Mid');
            assert.strictEqual(replaceEdit!.range.start.line, 2);
            assert.strictEqual(replaceEdit!.range.start.character, 11);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DiagnosticsProvider expone unused local y unused parameter en VS Code', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-unused-symbols');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'unused_symbols.sru': [
                    'global type n_service from nonvisualobject',
                    'end type',
                    'global n_service n_service',
                    '',
                    'public function integer of_total (long al_value);',
                    'long ll_total',
                    'return 1',
                    'end function',
                ].join('\n'),
            });

            const uri = uris['unused_symbols.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (
                    diagnostics.some(diagnostic => diagnostic.code === 'pb-unused-local-variable') &&
                    diagnostics.some(diagnostic => diagnostic.code === 'pb-unused-parameter')
                ) {
                    break;
                }
                await delay(50);
            }

            assert.ok(
                diagnostics.some(diagnostic => diagnostic.code === 'pb-unused-local-variable'),
                'Expected unused local diagnostic',
            );
            assert.ok(
                diagnostics.some(diagnostic => diagnostic.code === 'pb-unused-parameter'),
                'Expected unused parameter diagnostic',
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DiagnosticsProvider expone unassigned local cuando el valor se lee sin escritura demostrable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-unassigned-local');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'unassigned_local.sru': [
                    'global type n_service from nonvisualobject',
                    'end type',
                    'global n_service n_service',
                    '',
                    'public function integer of_total (long al_value);',
                    'long ll_total',
                    'return ll_total + al_value',
                    'end function',
                ].join('\n'),
            });

            const uri = uris['unassigned_local.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (diagnostics.some(diagnostic => diagnostic.code === 'pb-unassigned-local-variable')) {
                    break;
                }
                await delay(50);
            }

            assert.ok(
                diagnostics.some(diagnostic => diagnostic.code === 'pb-unassigned-local-variable'),
                'Expected unassigned local diagnostic',
            );
            assert.ok(
                !diagnostics.some(diagnostic => diagnostic.code === 'pb-unused-local-variable'),
                'Read-before-write local should not degrade to generic unused local',
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DiagnosticsProvider degrada usos indirectos y mantiene SQL bind como uso real', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-indirect-usage');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'indirect_usage.sru': [
                    'global type n_service from nonvisualobject',
                    'end type',
                    'global n_service n_service',
                    '',
                    'public function integer of_dispatch (string as_event, long al_payload, powerobject apo_target, long al_employee_id);',
                    'string ls_dynamic',
                    'long ll_total',
                    'long ll_dead',
                    'ls_dynamic = "of_worker"',
                    'Message.PowerObjectParm = apo_target',
                    'Message.LongParm = al_payload',
                    'PostEvent(this, as_event)',
                    'if IsValid(ParentWindow) then',
                    '    ParentWindow.DYNAMIC ls_dynamic()',
                    'end if',
                    'select salary',
                    'into :ll_total',
                    'from employee',
                    'where emp_id = :al_employee_id;',
                    'return ll_total',
                    'end function',
                ].join('\n'),
            });

            const uri = uris['indirect_usage.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (
                    diagnostics.filter(diagnostic => diagnostic.code === 'pb-potentially-indirect-variable-usage').length === 3 &&
                    diagnostics.filter(diagnostic => diagnostic.code === 'pb-unused-local-variable').length === 1
                ) {
                    break;
                }
                await delay(50);
            }

            const indirectDiagnostics = diagnostics.filter(
                diagnostic => diagnostic.code === 'pb-potentially-indirect-variable-usage',
            );

            assert.strictEqual(indirectDiagnostics.length, 3, 'Expected three indirect-usage diagnostics');
            assert.ok(
                indirectDiagnostics.every(diagnostic => diagnostic.severity === vscode.DiagnosticSeverity.Hint),
                'Expected indirect diagnostics to stay as Hint',
            );
            assert.strictEqual(
                diagnostics.filter(diagnostic => diagnostic.code === 'pb-unused-local-variable').length,
                1,
                'Expected only the write-only local diagnostic',
            );
            assert.ok(
                !diagnostics.some(diagnostic => diagnostic.code === 'pb-unused-parameter'),
                'Indirect parameter usage should not escalate to unused parameter',
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DiagnosticsProvider expone write-only local y private member en VS Code', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-write-only');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'write_only.sru': [
                    'global type n_write_only from nonvisualobject',
                    'end type',
                    'global n_write_only n_write_only',
                    'private string is_cache',
                    '',
                    'event open;',
                    'long ll_total',
                    'll_total = 1',
                    'is_cache = "demo"',
                    'MessageBox("demo", "ok")',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['write_only.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (
                    diagnostics.some(diagnostic => diagnostic.code === 'pb-write-only-local-variable') &&
                    diagnostics.some(diagnostic => diagnostic.code === 'pb-write-only-private-member-variable')
                ) {
                    break;
                }
                await delay(50);
            }

            assert.ok(
                diagnostics.some(diagnostic => diagnostic.code === 'pb-write-only-local-variable'),
                'Expected write-only local diagnostic',
            );
            assert.ok(
                diagnostics.some(diagnostic => diagnostic.code === 'pb-write-only-private-member-variable'),
                'Expected write-only private member diagnostic',
            );
            assert.ok(
                !diagnostics.some(diagnostic => diagnostic.code === 'pb-unused-local-variable'),
                'Write-only local should not degrade back to generic unused local',
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DiagnosticsProvider expone dead code conservador tras un RETURN lineal', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-unreachable-statement');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'unreachable_statement.sru': [
                    'global type n_dead_code from nonvisualobject',
                    'end type',
                    'global n_dead_code n_dead_code',
                    '',
                    'event open;',
                    'return',
                    'MessageBox("demo", "after return")',
                    'long ll_never',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['unreachable_statement.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (diagnostics.some(diagnostic => diagnostic.code === 'pb-unreachable-statement')) {
                    break;
                }
                await delay(50);
            }

            const unreachableDiagnostics = diagnostics.filter(
                diagnostic => diagnostic.code === 'pb-unreachable-statement',
            );

            assert.strictEqual(unreachableDiagnostics.length, 1, 'Expected a single conservative unreachable diagnostic');
            assert.strictEqual(unreachableDiagnostics[0].range.start.line, 6);
            assert.ok(
                unreachableDiagnostics[0].message.includes('RETURN'),
                'Expected the diagnostic message to explain the linear terminator',
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DiagnosticsProvider expone dead code tras un IF con todas las ramas terminantes', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-unreachable-after-terminating-if');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'unreachable_after_if.sru': [
                    'global type n_dead_code_if from nonvisualobject',
                    'end type',
                    'global n_dead_code_if n_dead_code_if',
                    '',
                    'event open;',
                    'if ll_flag = 1 then',
                    '    return',
                    'else',
                    '    halt close',
                    'end if',
                    'MessageBox("demo", "after if")',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['unreachable_after_if.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (diagnostics.some(diagnostic => diagnostic.code === 'pb-unreachable-statement')) {
                    break;
                }
                await delay(50);
            }

            const unreachableDiagnostics = diagnostics.filter(
                diagnostic => diagnostic.code === 'pb-unreachable-statement',
            );

            assert.strictEqual(unreachableDiagnostics.length, 1, 'Expected a single conservative unreachable diagnostic after a fully terminating IF');
            assert.strictEqual(unreachableDiagnostics[0].range.start.line, 10);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DiagnosticsProvider expone validación SQL conservadora sobre DataWindow retrieve', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-datawindow-sql');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'invalid_retrieve.srd': [
                    '$PBExportHeader$invalid_retrieve.srd',
                    'release 19;',
                    'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
                    'header(height=100 color=67108864)',
                    'summary(height=0 color=67108864)',
                    'footer(height=0 color=67108864)',
                    'detail(height=76 color=67108864)',
                    'table(column=(type=long update=yes name=id dbname="customer.id")',
                    ' column=(type=char(100) update=yes name=name dbname="customer.name")',
                    ' column=(type=char(200) update=yes name=email dbname="customer.email")',
                    ' column=(type=number update=yes name=balance dbname="customer.balance")',
                    ' retrieve="SELECT id, ghost_balance, email, balance FROM customer ORDER BY name" )',
                    'text(band=header alignment="0" text="ID" border="0" x="37" y="4" height="60" width="200")',
                ].join('\n'),
            });

            const uri = uris['invalid_retrieve.srd'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (diagnostics.some(diagnostic => diagnostic.code === 'pb-datawindow-sql-unknown-column')) {
                    break;
                }
                await delay(50);
            }

            const sqlDiagnostics = diagnostics.filter(
                diagnostic => diagnostic.code === 'pb-datawindow-sql-unknown-column',
            );

            assert.strictEqual(sqlDiagnostics.length, 1, 'Expected a single conservative SQL/DataWindow diagnostic');
            assert.ok(
                sqlDiagnostics[0].message.includes('ghost_balance'),
                'Expected the diagnostic to surface the missing retrieve column',
            );
            assert.strictEqual(sqlDiagnostics[0].range.start.line, 11);
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DiagnosticsProvider expone un DataObject sin target único como degradación honesta', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-datawindow-dataobject-no-unique-target');
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', true);

        try {
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

            const uri = uris['app/w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (diagnostics.some(diagnostic => diagnostic.code === 'pb-datawindow-script-dataobject-no-unique-target')) {
                    break;
                }
                await delay(50);
            }

            const dataObjectDiagnostics = diagnostics.filter(
                diagnostic => diagnostic.code === 'pb-datawindow-script-dataobject-no-unique-target',
            );

            assert.strictEqual(dataObjectDiagnostics.length, 1, 'Expected a single honest degradation diagnostic for a non-unique DataObject');
            assert.ok(dataObjectDiagnostics[0].message.includes('d_customer_list'));
            assert.strictEqual(dataObjectDiagnostics[0].range.start.line, 4);
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DiagnosticsProvider expone columnas inexistentes solo con vínculo local demostrable', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-datawindow-unknown-column');
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
                    'global w_probe w_probe',
                    '',
                    'event open;',
                    'long ll_value',
                    'll_value = dw_customer.GetItemNumber(1, "ghost_name")',
                    'll_value = dw_missing.GetItemNumber(1, "ghost_name")',
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

            const uri = uris['w_probe.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (diagnostics.some(diagnostic => diagnostic.code === 'pb-datawindow-script-unknown-column')) {
                    break;
                }
                await delay(50);
            }

            const columnDiagnostics = diagnostics.filter(
                diagnostic => diagnostic.code === 'pb-datawindow-script-unknown-column',
            );

            assert.strictEqual(columnDiagnostics.length, 1, 'Only the control with vínculo local demostrable should surface a diagnostic');
            assert.ok(columnDiagnostics[0].message.includes('ghost_name'));
            assert.strictEqual(columnDiagnostics[0].range.start.line, 16);
        } finally {
            await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', previousExperimentalSetting);
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DiagnosticsProvider limita la ambigüedad publicable al call-site real y evita DYNAMIC', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-ambiguous-call');
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
                    'nonvisualobject inv_base',
                    '',
                    'public function long of_run (string as_name);',
                    'return len(as_name) + 1',
                    'end function',
                    '',
                    'event open;',
                    'this.of_run("demo")',
                    'inv_base.DYNAMIC of_dynamic_only("demo")',
                    'end event',
                ].join('\n'),
            });

            await indexer.indexFile(uris['w_base.srw']);
            await indexer.indexFile(uris['w_child.srw']);

            const uri = uris['w_child.srw'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 100; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                await delay(50);
            }

            const ambiguousDiagnostics = diagnostics.filter(diagnostic => diagnostic.code === 'pb-ambiguous-call');

            assert.ok(
                ambiguousDiagnostics.length <= 1,
                'DYNAMIC no debe generar ambigüedad publicable adicional',
            );
            assert.ok(
                ambiguousDiagnostics.every(diagnostic => diagnostic.range.start.line === 10),
                'Si se publica, la ambigüedad debe apuntar solo a this.of_run.',
            );
            assert.ok(
                ambiguousDiagnostics.every(diagnostic => diagnostic.message.includes('of_run')),
                'Si se publica, la ambigüedad debe describir la llamada real of_run.',
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DiagnosticsProvider expone lints conservadores de modernización', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-modernization');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'modernization.sru': [
                    'event open;',
                    'GOTO lbl_exit',
                    'HALT CLOSE',
                    'string ls_value',
                    'ls_value = MidW("demo", 2)',
                    'lbl_exit:',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['modernization.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (
                    diagnostics.some(diagnostic => diagnostic.code === 'pb-legacy-goto') &&
                    diagnostics.some(diagnostic => diagnostic.code === 'pb-legacy-halt') &&
                    diagnostics.some(diagnostic => diagnostic.code === 'pb-obsolete-runtime-function')
                ) {
                    break;
                }
                await delay(50);
            }

            const gotoDiag = diagnostics.find(diagnostic => diagnostic.code === 'pb-legacy-goto');
            const haltDiag = diagnostics.find(diagnostic => diagnostic.code === 'pb-legacy-halt');
            const obsoleteDiag = diagnostics.find(diagnostic => diagnostic.code === 'pb-obsolete-runtime-function');

            assert.ok(gotoDiag, 'Expected legacy GOTO diagnostic');
            assert.ok(haltDiag, 'Expected legacy HALT diagnostic');
            assert.ok(obsoleteDiag, 'Expected obsolete runtime diagnostic');
            assert.strictEqual(gotoDiag!.severity, vscode.DiagnosticSeverity.Warning);
            assert.strictEqual(haltDiag!.severity, vscode.DiagnosticSeverity.Information);
            assert.strictEqual(obsoleteDiag!.severity, vscode.DiagnosticSeverity.Hint);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DiagnosticsProvider expone shadowing conservador sobre miembros del mismo objeto', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-shadowing');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'shadowing.sru': [
                    'global type n_shadowing from nonvisualobject',
                    'end type',
                    'global n_shadowing n_shadowing',
                    'string is_state',
                    'long il_total',
                    '',
                    'public function long of_calc (string is_state);',
                    'long il_total',
                    'if Len(is_state) > 0 then',
                    '    il_total = Len(is_state)',
                    'end if',
                    'return il_total',
                    'end function',
                ].join('\n'),
            });

            const uri = uris['shadowing.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (
                    diagnostics.some(diagnostic => diagnostic.code === 'pb-local-shadows-member') &&
                    diagnostics.some(diagnostic => diagnostic.code === 'pb-parameter-shadows-member')
                ) {
                    break;
                }
                await delay(50);
            }

            const shadowDiagnostics = diagnostics.filter(diagnostic =>
                diagnostic.code === 'pb-local-shadows-member' ||
                diagnostic.code === 'pb-parameter-shadows-member',
            );

            assert.strictEqual(shadowDiagnostics.length, 2, 'Expected two shadowing diagnostics');
            assert.ok(
                shadowDiagnostics.every(diagnostic => diagnostic.severity === vscode.DiagnosticSeverity.Hint),
                'Expected shadowing diagnostics to stay as Hint',
            );
            assert.ok(
                !diagnostics.some(diagnostic => diagnostic.code === 'pb-unused-local-variable'),
                'Directly used shadowing locals should not degrade to unused local',
            );
            assert.ok(
                !diagnostics.some(diagnostic => diagnostic.code === 'pb-unused-parameter'),
                'Directly used shadowing parameters should not degrade to unused parameter',
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('DiagnosticsProvider expone el lint conservador de miembro privado no usado', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-private-member-unused');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'private_member_unused.sru': [
                    'global type n_private_state from nonvisualobject',
                    'end type',
                    'global n_private_state n_private_state',
                    'private string is_cache',
                    '',
                    'event open;',
                    'MessageBox("demo", "ok")',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['private_member_unused.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            let diagnostics: readonly vscode.Diagnostic[] = [];

            for (let attempt = 0; attempt < 20; attempt++) {
                diagnostics = vscode.languages.getDiagnostics(uri);
                if (diagnostics.some(diagnostic => diagnostic.code === 'pb-unused-private-member-variable')) {
                    break;
                }
                await delay(50);
            }

            const unusedPrivateMember = diagnostics.find(
                diagnostic => diagnostic.code === 'pb-unused-private-member-variable',
            );

            assert.ok(unusedPrivateMember, 'Expected unused private member diagnostic');
            assert.strictEqual(unusedPrivateMember!.severity, vscode.DiagnosticSeverity.Hint);
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('FormattingProvider devuelve un documento real con indentación normalizada', async () => {
        const baseRelativePath = path.join('phase6-generated', 'formatting-document');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'format_me.sru': [
                    'event open;',
                    'IF 1 = 1 THEN',
                    'MessageBox("Hola", "Mundo")',
                    'ELSE',
                    'MessageBox("Adios", "Mundo")',
                    'END IF',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['format_me.sru'];
            const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                'vscode.executeFormatDocumentProvider',
                uri,
                { insertSpaces: true, tabSize: 3 },
            );

            assert.ok(edits);
            assert.strictEqual(edits!.length, 1);
            assert.ok(edits![0].newText.includes('IF 1 = 1 THEN\n   MessageBox("Hola", "Mundo")\nELSE\n   MessageBox("Adios", "Mundo")\nEND IF'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('Explorer refleja archivos y símbolos indexados en un flujo real de árbol', async () => {
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const uri = getWorkspaceTestUri('sample.sru');

        let capturedProvider: vscode.TreeDataProvider<vscode.TreeItem> | undefined;
        const restoreCreateTreeView = replaceProperty(
            vscode.window,
            'createTreeView',
            (_viewId: string, options: { treeDataProvider: vscode.TreeDataProvider<vscode.TreeItem> }) => {
                capturedProvider = options.treeDataProvider;
                return {
                    dispose() {
                        // no-op
                    },
                } as vscode.TreeView<vscode.TreeItem>;
            },
        );

        const disposables = registerExplorer({} as vscode.ExtensionContext);

        try {
            assert.ok(capturedProvider);

            let refreshCount = 0;
            const refreshDisposable = capturedProvider!.onDidChangeTreeData?.(() => {
                refreshCount++;
            });

            await indexer.indexFile(uri);
            await delay(180);

            const rootItems = (await Promise.resolve(capturedProvider!.getChildren())) ?? [];
            assert.ok(rootItems.length > 0);

            const sampleItem = rootItems.find(item => item.label === 'sample.sru');
            assert.ok(sampleItem);

            const childItems = (await Promise.resolve(capturedProvider!.getChildren(sampleItem))) ?? [];
            assert.ok(childItems.some(item => item.label === 'wf_calculate'));
            assert.ok(childItems.some(item => item.label === 'wf_reset'));
            assert.ok(refreshCount > 0);

            refreshDisposable?.dispose();
        } finally {
            restoreCreateTreeView();
            for (const disposable of disposables) {
                disposable.dispose();
            }
        }
    });

    test('Explorer agrupa por proyecto y permite foco en proyecto o archivo actual', async () => {
        const baseRelativePath = path.join('phase6-generated', 'explorer-project-focus');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const projectRegistry = PowerBuilderProjectRegistry.getInstance();

        let capturedProvider: vscode.TreeDataProvider<vscode.TreeItem> | undefined;
        const restoreCreateTreeView = replaceProperty(
            vscode.window,
            'createTreeView',
            (_viewId: string, options: { treeDataProvider: vscode.TreeDataProvider<vscode.TreeItem> }) => {
                capturedProvider = options.treeDataProvider;
                return {
                    dispose() {
                        // no-op
                    },
                    message: undefined,
                } as unknown as vscode.TreeView<vscode.TreeItem>;
            },
        );

        let disposables: vscode.Disposable[] = [];

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
                'project-a/u_alpha_worker.sru': [
                    'global type u_alpha_worker from nonvisualobject',
                    'end type',
                    'global u_alpha_worker u_alpha_worker',
                    '',
                    'public function long of_worker ();',
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
            await indexer.indexFile(uris['project-a/u_alpha_worker.sru']);
            await indexer.indexFile(uris['project-b/u_beta_main.sru']);

            disposables = registerExplorer({} as vscode.ExtensionContext);

            assert.ok(capturedProvider);

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uris['project-a/u_alpha_main.sru']));
            await delay(180);

            const explorerProvider = capturedProvider as vscode.TreeDataProvider<vscode.TreeItem> & {
                toggleScope(scope: 'workspace' | 'current-project' | 'current-file'): void;
                scheduleRefresh(): void;
            };

            const workspaceItems = (await Promise.resolve(capturedProvider!.getChildren())) ?? [];
            assert.ok(workspaceItems.some(item => item.label === 'Alpha'));
            assert.ok(workspaceItems.some(item => item.label === 'Beta'));

            explorerProvider.toggleScope('current-project');
            explorerProvider.scheduleRefresh();
            await delay(180);

            const currentProjectItems = (await Promise.resolve(capturedProvider!.getChildren())) ?? [];
            assert.deepStrictEqual(
                currentProjectItems.map(item => item.label),
                [
                    vscode.workspace.asRelativePath(uris['project-a/u_alpha_main.sru'], false),
                    vscode.workspace.asRelativePath(uris['project-a/u_alpha_worker.sru'], false),
                ],
            );

            explorerProvider.toggleScope('current-file');
            explorerProvider.scheduleRefresh();
            await delay(180);

            const currentFileItems = (await Promise.resolve(capturedProvider!.getChildren())) ?? [];
            assert.deepStrictEqual(
                currentFileItems.map(item => item.label),
                [
                    vscode.workspace.asRelativePath(uris['project-a/u_alpha_main.sru'], false),
                ],
            );
        } finally {
            projectRegistry.clear();
            restoreCreateTreeView();
            for (const disposable of disposables) {
                disposable.dispose();
            }
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('Diagnostics panel agrupa diagnostics por proyecto y objeto', async () => {
        const baseRelativePath = path.join('phase6-generated', 'diagnostics-panel-grouping');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());
        const projectRegistry = PowerBuilderProjectRegistry.getInstance();
        const collection = vscode.languages.createDiagnosticCollection('powerbuilder-diagnostics-panel-test');

        let capturedProvider: vscode.TreeDataProvider<vscode.TreeItem> | undefined;
        const restoreCreateTreeView = replaceProperty(
            vscode.window,
            'createTreeView',
            (viewId: string, options: { treeDataProvider: vscode.TreeDataProvider<vscode.TreeItem> }) => {
                if (viewId === 'powerbuilderDiagnostics') {
                    capturedProvider = options.treeDataProvider;
                }

                return {
                    dispose() {
                        // no-op
                    },
                    message: undefined,
                } as unknown as vscode.TreeView<vscode.TreeItem>;
            },
        );

        let disposables: vscode.Disposable[] = [];

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

            disposables = registerDiagnosticsPanel({} as vscode.ExtensionContext);

            assert.ok(capturedProvider);

            await delay(180);

            const rootItems = (await Promise.resolve(capturedProvider!.getChildren())) ?? [];
            assert.ok(rootItems.some(item => item.label === 'Alpha'));
            assert.ok(rootItems.some(item => item.label === 'Beta'));
            assert.ok(rootItems.some(item => item.label === 'Sin proyecto'));

            const alphaProjectItem = rootItems.find(item => item.label === 'Alpha');
            assert.ok(alphaProjectItem);

            const alphaObjectItems = (await Promise.resolve(capturedProvider!.getChildren(alphaProjectItem))) ?? [];
            const alphaObjectItem = alphaObjectItems.find(item => item.label === 'u_alpha_main');
            assert.ok(alphaObjectItem);

            const alphaDiagnosticItems = (await Promise.resolve(capturedProvider!.getChildren(alphaObjectItem))) ?? [];
            assert.ok(alphaDiagnosticItems.some(item => item.label === 'Variable local no usada'));

            const unassignedProjectItem = rootItems.find(item => item.label === 'Sin proyecto');
            assert.ok(unassignedProjectItem);

            const unassignedObjectItems = (await Promise.resolve(capturedProvider!.getChildren(unassignedProjectItem))) ?? [];
            assert.ok(unassignedObjectItems.some(item => item.label === 'demo'));
        } finally {
            collection.clear();
            collection.dispose();
            projectRegistry.clear();
            restoreCreateTreeView();
            for (const disposable of disposables) {
                disposable.dispose();
            }
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('StatusBar muestra el resumen indexado para un PowerBuilder activo', async () => {
        const uri = getWorkspaceTestUri('sample.sru');
        const index = SymbolIndex.getInstance();
        const indexer = new WorkspaceIndexer(index);
        const projectRegistry = PowerBuilderProjectRegistry.getInstance();

        projectRegistry.setProject({
            uri: getWorkspaceTestUri('sample.pbproj'),
            name: 'sample-app',
            projectDirectoryUri: vscode.workspace.workspaceFolders![0].uri,
            appEntryUri: uri,
            libraries: [],
            libraryUris: [],
        });

        await indexer.indexFile(uri);
        index.markInitialWorkspaceIndexingCompleted();
        await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));

        const statusItem = createMockStatusBarItem();
        const restoreCreateStatusBarItem = replaceProperty(
            vscode.window,
            'createStatusBarItem',
            () => statusItem,
        );

        const disposables = registerStatusBar({} as vscode.ExtensionContext);

        try {
            assert.strictEqual(statusItem.visible, true);
            assert.ok(statusItem.text.includes('PB:'));
            assert.ok(statusItem.text.includes('sample-app'));
            assert.ok(String(statusItem.tooltip).includes('PowerBuilder:'));
            assert.ok(String(statusItem.tooltip).includes('Proyecto preferido: sample-app'));
            assert.ok(String(statusItem.tooltip).includes('Proyecto: 1 raíz efectiva'));
            assert.strictEqual(statusItem.command, 'powerbuilder.reindexWorkspace');
        } finally {
            projectRegistry.clear();
            restoreCreateStatusBarItem();
            for (const disposable of disposables) {
                disposable.dispose();
            }
        }
    });

    test('StatusBar refleja la restricción DataWindow', async () => {
        const previousExperimentalSetting = vscode.workspace
            .getConfiguration()
            .inspect<boolean>('powerbuilder.datawindow.experimentalIde.enabled')
            ?.workspaceValue;

        await updateWorkspaceSetting('powerbuilder.datawindow.experimentalIde.enabled', false);

        const statusItem = createMockStatusBarItem();
        const restoreCreateStatusBarItem = replaceProperty(
            vscode.window,
            'createStatusBarItem',
            () => statusItem,
        );

        const disposables = registerStatusBar({} as vscode.ExtensionContext);

        try {
            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(getWorkspaceTestUri('sample.sru')));

            for (let attempt = 0; attempt < 10; attempt++) {
                if (statusItem.visible) {
                    break;
                }

                await delay(25);
            }
            assert.strictEqual(statusItem.visible, true);

            await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(getWorkspaceTestUri('sample.srd')));

            for (let attempt = 0; attempt < 10; attempt++) {
                if (statusItem.text === '$(warning) PB: DataWindow IDE off') {
                    break;
                }

                await delay(25);
            }

            assert.strictEqual(statusItem.text, '$(warning) PB: DataWindow IDE off');
            assert.strictEqual(statusItem.tooltip, PB_USER_MESSAGES.statusBar.dataWindowExperimentalDisabled);
        } finally {
            await updateWorkspaceSetting(
                'powerbuilder.datawindow.experimentalIde.enabled',
                previousExperimentalSetting,
            );
            restoreCreateStatusBarItem();
            for (const disposable of disposables) {
                disposable.dispose();
            }
        }
    });
});