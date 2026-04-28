import * as assert from 'assert';
import * as vscode from 'vscode';
import {
    analyzePowerBuilderObjectDocumentation,
    renderPowerBuilderObjectDocumentationMarkdown,
} from '../../powerbuilder/documentation/powerBuilderDocumentationGenerator';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';

function getWorkspaceTestUri(relativePath: string): vscode.Uri {
    return vscode.Uri.file(
        require('path').join(
            vscode.workspace.workspaceFolders![0].uri.fsPath,
            relativePath,
        ),
    );
}

suite('PowerBuilderDocumentationGenerator', () => {
    setup(() => {
        SymbolIndex.getInstance().clear();
    });

    test('genera markdown estable y conservador para una ventana indexada', async () => {
        const index = SymbolIndex.getInstance();
        const document = await vscode.workspace.openTextDocument(getWorkspaceTestUri('sample.srw'));

        index.indexDocument(document);

        const model = analyzePowerBuilderObjectDocumentation(document, index);

        assert.ok(model, 'Expected documentation model for sample.srw');
        assert.strictEqual(model?.objectName, 'w_sample');
        assert.strictEqual(model?.objectType, 'window');
        assert.strictEqual(model?.directBaseType, 'window');
        assert.ok(model?.eventImplementations.some(callable => callable.name === 'open'));
        assert.ok(model?.publicCallables.some(callable => callable.name === 'wf_save'));
        assert.ok(model?.instanceMembers.some(member => member.name === 'is_mode'));
        assert.ok(model?.highlightedMembers.some(member => member.name === 'dw_data'));

        const markdown = renderPowerBuilderObjectDocumentationMarkdown(model!, {
            commandId: 'powerbuilder.generateDocumentationCurrentObject',
            generatedAt: new Date('2026-04-24T09:00:00.000Z'),
            generatorVersion: 'test-v1',
        });

        assert.ok(markdown.includes('# w_sample'));
        assert.ok(markdown.includes('## Identidad'));
        assert.ok(markdown.includes('## Mapa rápido'));
        assert.ok(markdown.includes('- Tipo: `window`'));
        assert.ok(markdown.includes('## Relaciones útiles'));
        assert.ok(markdown.includes('## API del objeto'));
        assert.ok(markdown.includes('### Eventos implementados / sobrescritos'));
        assert.ok(markdown.includes('| wf_save |'));
        assert.ok(markdown.includes('### Variables de instancia'));
        assert.ok(markdown.includes('| is_mode |'));
        assert.ok(markdown.includes('### Miembros destacados'));
        assert.ok(markdown.includes('`dw_data` (`datawindow`)'));
        assert.ok(markdown.includes('## Metadatos de generación'));
        assert.ok(markdown.includes('`2026-04-24T09:00:00.000Z`'));
        assert.ok(markdown.includes('`test-v1`'));

        const secondMarkdown = renderPowerBuilderObjectDocumentationMarkdown(model!, {
            commandId: 'powerbuilder.generateDocumentationCurrentObject',
            generatedAt: new Date('2026-04-24T09:00:00.000Z'),
            generatorVersion: 'test-v1',
        });

        assert.strictEqual(secondMarkdown, markdown);
    });

    test('omite objetos fuera del v1 soportado cuando no puede clasificar su tipo real', async () => {
        const index = SymbolIndex.getInstance();
        const document = await vscode.workspace.openTextDocument(getWorkspaceTestUri('sample.srf'));

        index.indexDocument(document);

        const model = analyzePowerBuilderObjectDocumentation(document, index);

        assert.strictEqual(model, undefined);
    });
});