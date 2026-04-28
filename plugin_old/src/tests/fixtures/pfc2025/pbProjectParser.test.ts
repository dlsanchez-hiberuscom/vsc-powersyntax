import * as assert from 'assert';
import * as vscode from 'vscode';
import { PbProjectParser } from '../../../powerbuilder/projecting/pbProjectParser';
import { PFC_EXAMPLES_PBPROJ_FIXTURE } from '../../fixtures/pfc2025/pfc_examples_pbproj.fixture';

suite('PbProjectParser', () => {
    test('parsea application, appEntry y libraries', () => {
        const parser = new PbProjectParser();
        const uri = vscode.Uri.file('/workspace/pfc examples.pbproj');

        const project = parser.parseProjectText(
            uri,
            PFC_EXAMPLES_PBPROJ_FIXTURE,
        );

        assert.ok(project);
        assert.strictEqual(project?.name, 'pfc examples');
        assert.strictEqual(project?.applicationName, 'pfcexamp');
        assert.strictEqual(project?.appEntry, 'examples\\appexamp.pbl');
        assert.ok(project?.libraries.includes('examples\\exmmain.pbl'));
        assert.ok(project?.libraries.includes('pfc libs\\pfcmain.pbl'));
        assert.strictEqual(project?.projectDirectoryUri.path, '/workspace');
        assert.strictEqual(project?.appEntryUri?.path, '/workspace/examples/appexamp.pbl');
        assert.ok(project?.libraryUris.some(libraryUri => libraryUri.path === '/workspace/examples/exmmain.pbl'));
        assert.ok(project?.libraryUris.some(libraryUri => libraryUri.path === '/workspace/pfc libs/pfcmain.pbl'));
    });

    test('resuelve rutas relativas al directorio real del proyecto', () => {
        const parser = new PbProjectParser();
        const uri = vscode.Uri.file('/workspace/solutions/examples/pfc examples.pbproj');

        const project = parser.parseProjectText(
            uri,
            `
<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<Project>
    <Application Name="pfcexamp"/>
    <Libraries AppEntry="..\\runtime\\appexamp.pbl">
        <Library Path="..\\runtime\\appexamp.pbl"/>
        <Library Path="..\\shared\\pfcmain.pbl"/>
        <Library Path=".\\local\\examples.pbl"/>
    </Libraries>
</Project>
`.trim(),
        );

        assert.ok(project);
        assert.strictEqual(project?.projectDirectoryUri.path, '/workspace/solutions/examples');
        assert.strictEqual(project?.appEntryUri?.path, '/workspace/solutions/runtime/appexamp.pbl');
        assert.deepStrictEqual(
            project?.libraryUris.map(libraryUri => libraryUri.path),
            [
                '/workspace/solutions/runtime/appexamp.pbl',
                '/workspace/solutions/shared/pfcmain.pbl',
                '/workspace/solutions/examples/local/examples.pbl',
            ],
        );
    });
});