import * as assert from 'assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';

import { waitFor } from './semanticSmokeWait';

suite('smoke/formatting-extension', () => {
  test('el formatter devuelve edits reales para un documento PowerBuilder abierto', async function () {
    this.timeout(20000);

    const extension = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(extension, 'La extensión debería estar instalada');
    await extension!.activate();

    const config = vscode.workspace.getConfiguration('vscPowerSyntax');
    const previous = {
      enabled: config.get('formatting.enabled'),
      statementCase: config.get('formatting.statementCase'),
      eventKeywordCase: config.get('formatting.eventKeywordCase'),
      indentSize: config.get('formatting.indentSize'),
    };

    try {
      await config.update('formatting.enabled', true, vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.statementCase', 'upper', vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.eventKeywordCase', 'lower', vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.indentSize', 3, vscode.ConfigurationTarget.Workspace);

      const document = await vscode.workspace.openTextDocument({
        language: 'powerbuilder',
        content: [
          'event open();',
          'if li_total=1 then',
          'messagebox(ls_title,li_total)',
          'end if',
          'end event'
        ].join('\n')
      });
      await vscode.window.showTextDocument(document, { preview: false });

      const edits = await waitFor(
        async () => (await vscode.commands.executeCommand<vscode.TextEdit[] | undefined>(
          'vscode.executeFormatDocumentProvider',
          document.uri,
          { insertSpaces: true, tabSize: 3 }
        )) ?? [],
        (value) => Array.isArray(value) && value.length > 0,
      );

      assert.ok(edits && edits.length > 0, 'El provider debe devolver edits de formato');

      const workspaceEdit = new vscode.WorkspaceEdit();
      for (const edit of edits ?? []) {
        workspaceEdit.replace(document.uri, edit.range, edit.newText);
      }
      await vscode.workspace.applyEdit(workspaceEdit);

      assert.equal(document.getText(), [
        'event open();',
        '   IF li_total = 1 THEN',
        '      messagebox(ls_title, li_total)',
        '   END IF',
        'end event'
      ].join('\n'));
    } finally {
      await config.update('formatting.enabled', previous.enabled, vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.statementCase', previous.statementCase, vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.eventKeywordCase', previous.eventKeywordCase, vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.indentSize', previous.indentSize, vscode.ConfigurationTarget.Workspace);
    }
  });

  test('formatOnSave aplica el formatter al guardar un archivo PowerBuilder real', async function () {
    this.timeout(30000);

    const extension = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(extension, 'La extensión debería estar instalada');
    await extension!.activate();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Se esperaba un workspace abierto para la smoke de formatOnSave');

    const config = vscode.workspace.getConfiguration('vscPowerSyntax');
    const previous = {
      enabled: config.get('formatting.enabled'),
      formatOnSave: config.get('formatting.formatOnSave'),
      statementCase: config.get('formatting.statementCase'),
      eventKeywordCase: config.get('formatting.eventKeywordCase'),
      indentSize: config.get('formatting.indentSize'),
    };

    const tempDir = path.join(workspaceFolder.uri.fsPath, '.tmp-smoke');
    const tempFilePath = path.join(tempDir, 'format-on-save.sru');
    const tempUri = vscode.Uri.file(tempFilePath);

    try {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(tempFilePath, '', 'utf8');

      await config.update('formatting.enabled', true, vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.formatOnSave', true, vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.statementCase', 'upper', vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.eventKeywordCase', 'lower', vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.indentSize', 3, vscode.ConfigurationTarget.Workspace);

      const document = await vscode.workspace.openTextDocument(tempUri);
      const editor = await vscode.window.showTextDocument(document);
      await editor.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(0, 0), [
          'event open();',
          'if li_total=1 then',
          'messagebox(ls_title,li_total)',
          'end if',
          'end event'
        ].join('\n'));
      });

      await waitFor(
        async () => (await vscode.commands.executeCommand<vscode.TextEdit[] | undefined>(
          'vscode.executeFormatDocumentProvider',
          document.uri,
          { insertSpaces: true, tabSize: 3 }
        )) ?? [],
        (value) => Array.isArray(value) && value.length > 0,
        30000,
        250,
      );

      const saved = await document.save();
      assert.equal(saved, true, 'El documento temporal debería guardarse');
      const lineEnding = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
      const expectedText = [
        'event open();',
        '   IF li_total = 1 THEN',
        '      messagebox(ls_title, li_total)',
        '   END IF',
        'end event'
      ].join(lineEnding);
      await waitFor(
        async () => document.getText(),
        (value) => value === expectedText,
        30000,
        250,
      );
      assert.equal(document.getText(), expectedText);
    } finally {
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      await config.update('formatting.enabled', previous.enabled, vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.formatOnSave', previous.formatOnSave, vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.statementCase', previous.statementCase, vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.eventKeywordCase', previous.eventKeywordCase, vscode.ConfigurationTarget.Workspace);
      await config.update('formatting.indentSize', previous.indentSize, vscode.ConfigurationTarget.Workspace);
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});