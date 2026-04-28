import * as assert from 'assert';
import * as vscode from 'vscode';
import { getFormattingConfig } from '../../core/config/extensionConfiguration';

async function updateWorkspaceSetting<T>(
    section: string,
    value: T | undefined,
): Promise<void> {
    await vscode.workspace.getConfiguration().update(section, value, vscode.ConfigurationTarget.Workspace);
}

suite('FormattingConfiguration', () => {
    teardown(async () => {
        await updateWorkspaceSetting('powerbuilder.formatting.keywordCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.upperCaseKeywords', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.statementCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.declarationKeywordCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.typeCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.eventKeywordCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.formatOnSave', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.formatOnType', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.formatRange', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.spacesInsideParentheses', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.experimental.spaceInsideParens', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.oneStatementPerLine', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.experimental.splitCollapsedStatements', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.spaceAfterComma', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.spaceAroundOperators', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.indentStyle', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.indentSize', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.continuationIndentSize', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.blankLineBetweenSections', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.preserveUserIdentifierCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.preserveComments', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.preserveStrings', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.preserveManualLineBreaksInSql', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.conservativeEmbeddedSqlFormatting', undefined);
    });

    test('normaliza el contrato nuevo del formatter y mantiene fallback legacy', async () => {
        await updateWorkspaceSetting('powerbuilder.formatting.keywordCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.upperCaseKeywords', true);
        await updateWorkspaceSetting('powerbuilder.formatting.statementCase', 'lower');
        await updateWorkspaceSetting('powerbuilder.formatting.typeCase', 'upper');
        await updateWorkspaceSetting('powerbuilder.formatting.eventKeywordCase', 'lower');
        await updateWorkspaceSetting('powerbuilder.formatting.formatOnSave', true);
        await updateWorkspaceSetting('powerbuilder.formatting.formatOnType', true);
        await updateWorkspaceSetting('powerbuilder.formatting.formatRange', false);
        await updateWorkspaceSetting('powerbuilder.formatting.spacesInsideParentheses', true);
        await updateWorkspaceSetting('powerbuilder.formatting.oneStatementPerLine', true);
        await updateWorkspaceSetting('powerbuilder.formatting.spaceAfterComma', false);
        await updateWorkspaceSetting('powerbuilder.formatting.spaceAroundOperators', false);
        await updateWorkspaceSetting('powerbuilder.formatting.indentStyle', 'tabs');
        await updateWorkspaceSetting('powerbuilder.formatting.indentSize', 4);
        await updateWorkspaceSetting('powerbuilder.formatting.continuationIndentSize', 6);
        await updateWorkspaceSetting('powerbuilder.formatting.blankLineBetweenSections', true);
        await updateWorkspaceSetting('powerbuilder.formatting.preserveUserIdentifierCase', true);
        await updateWorkspaceSetting('powerbuilder.formatting.preserveComments', true);
        await updateWorkspaceSetting('powerbuilder.formatting.preserveStrings', true);
        await updateWorkspaceSetting('powerbuilder.formatting.preserveManualLineBreaksInSql', true);
        await updateWorkspaceSetting('powerbuilder.formatting.conservativeEmbeddedSqlFormatting', true);

        const formatting = getFormattingConfig();

        assert.strictEqual(formatting.keywordCase, 'upper');
        assert.strictEqual(formatting.statementCase, 'lower');
        assert.strictEqual(formatting.typeCase, 'upper');
        assert.strictEqual(formatting.eventKeywordCase, 'lower');
        assert.strictEqual(formatting.formatOnSave, true);
        assert.strictEqual(formatting.formatOnType, true);
        assert.strictEqual(formatting.formatRange, false);
        assert.strictEqual(formatting.spacesInsideParentheses, true);
        assert.strictEqual(formatting.oneStatementPerLine, true);
        assert.strictEqual(formatting.spaceAfterComma, false);
        assert.strictEqual(formatting.spaceAroundOperators, false);
        assert.strictEqual(formatting.indentStyle, 'tabs');
        assert.strictEqual(formatting.indentSize, 4);
        assert.strictEqual(formatting.continuationIndentSize, 6);
        assert.strictEqual(formatting.blankLineBetweenSections, true);
        assert.strictEqual(formatting.preserveUserIdentifierCase, true);
        assert.strictEqual(formatting.preserveComments, true);
        assert.strictEqual(formatting.preserveStrings, true);
        assert.strictEqual(formatting.preserveManualLineBreaksInSql, true);
        assert.strictEqual(formatting.conservativeEmbeddedSqlFormatting, true);
    });

    test('mantiene compatibilidad con settings experimentales mientras no haya override nuevo', async () => {
        await updateWorkspaceSetting('powerbuilder.formatting.spacesInsideParentheses', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.experimental.spaceInsideParens', true);
        await updateWorkspaceSetting('powerbuilder.formatting.oneStatementPerLine', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.experimental.splitCollapsedStatements', true);
        await updateWorkspaceSetting('powerbuilder.formatting.indentSize', 0);
        await updateWorkspaceSetting('powerbuilder.formatting.continuationIndentSize', 0);

        const formatting = getFormattingConfig();

        assert.strictEqual(formatting.spacesInsideParentheses, true);
        assert.strictEqual(formatting.oneStatementPerLine, true);
        assert.strictEqual(formatting.indentSize, 3);
        assert.strictEqual(formatting.continuationIndentSize, 3);
    });

    test('deriva overrides nuevos desde fallbacks internos cuando no hay valor explicito', async () => {
        await updateWorkspaceSetting('powerbuilder.formatting.keywordCase', 'lower');
        await updateWorkspaceSetting('powerbuilder.formatting.statementCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.declarationKeywordCase', 'lower');
        await updateWorkspaceSetting('powerbuilder.formatting.typeCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.eventKeywordCase', undefined);
        await updateWorkspaceSetting('powerbuilder.formatting.indentSize', 5);
        await updateWorkspaceSetting('powerbuilder.formatting.continuationIndentSize', undefined);

        const formatting = getFormattingConfig();

        assert.strictEqual(formatting.statementCase, 'lower');
        assert.strictEqual(formatting.typeCase, 'lower');
        assert.strictEqual(formatting.eventKeywordCase, 'lower');
        assert.strictEqual(formatting.continuationIndentSize, 5);
    });
});