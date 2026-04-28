import * as assert from 'assert';
import * as vscode from 'vscode';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { PbProjectParser } from '../../powerbuilder/projecting/pbProjectParser';

suite('PbLibraryGraph', () => {
    let graph: PbLibraryGraph;
    let parser: PbProjectParser;

    setup(() => {
        graph = PbLibraryGraph.getInstance();
        graph.clear();
        parser = new PbProjectParser();
    });

    test('no confunde coincidencias por substring entre librerías', () => {
        const shorterProject = parser.parseProjectText(
            vscode.Uri.file('/workspace/short.pbproj'),
            `
<Project>
    <Libraries AppEntry="examples\\exm.pbl">
        <Library Path="examples\\exm.pbl"/>
    </Libraries>
</Project>
`.trim(),
        );

        const exactProject = parser.parseProjectText(
            vscode.Uri.file('/workspace/exact.pbproj'),
            `
<Project>
    <Libraries AppEntry="examples\\exmutil.pbl">
        <Library Path="examples\\exmutil.pbl"/>
    </Libraries>
</Project>
`.trim(),
        );

        assert.ok(shorterProject);
        assert.ok(exactProject);

        graph.setProject(shorterProject!);
        graph.setProject(exactProject!);

        const sourceUri = vscode.Uri.file('/workspace/examples/exmutil.pbl/w_main.srw');

        assert.strictEqual(
            graph.getPreferredProjectForSourceFile(sourceUri)?.name,
            'exact',
        );
        assert.strictEqual(
            graph.isSourceFileInProject(sourceUri, shorterProject!),
            false,
        );
    });

    test('usa las librerías resueltas respecto al directorio del pbproj', () => {
        const project = parser.parseProjectText(
            vscode.Uri.file('/workspace/solutions/examples/pfc examples.pbproj'),
            `
<Project>
    <Libraries AppEntry="..\\runtime\\appexamp.pbl">
        <Library Path="..\\shared\\pfcmain.pbl"/>
        <Library Path=".\\local\\examples.pbl"/>
    </Libraries>
</Project>
`.trim(),
        );

        assert.ok(project);
        graph.setProject(project!);

        assert.strictEqual(
            graph.isSourceFileInProject(
                vscode.Uri.file('/workspace/solutions/shared/pfcmain.pbl/n_tr.sru'),
                project!,
            ),
            true,
        );

        assert.strictEqual(
            graph.isSourceFileInProject(
                vscode.Uri.file('/workspace/solutions/examples/local/examples.pbl/w_main.srw'),
                project!,
            ),
            true,
        );

        assert.strictEqual(
            graph.isSourceFileInProject(
                vscode.Uri.file('/workspace/solutions/examples/other/unlisted.pbl/u_main.sru'),
                project!,
            ),
            false,
        );
    });

    test('ignora roots excluidas al calcular pertenencia y preferencia de proyecto', async () => {
        const config = vscode.workspace.getConfiguration('powerbuilder');
        const previousExcludes = config.get<string[]>('indexing.exclude', []);

        try {
            await config.update(
                'indexing.exclude',
                ['**/ignored.pbl/**'],
                vscode.ConfigurationTarget.Workspace,
            );

            const project = parser.parseProjectText(
                vscode.Uri.file('/workspace/excluded.pbproj'),
                `
<Project>
    <Libraries AppEntry="examples\\active.pbl">
        <Library Path="examples\\active.pbl"/>
        <Library Path="examples\\ignored.pbl"/>
    </Libraries>
</Project>
`.trim(),
            );

            assert.ok(project);
            graph.setProject(project!);

            assert.strictEqual(
                graph.isSourceFileInProject(
                    vscode.Uri.file('/workspace/examples/active.pbl/w_main.srw'),
                    project!,
                ),
                true,
            );

            assert.strictEqual(
                graph.isSourceFileInProject(
                    vscode.Uri.file('/workspace/examples/ignored.pbl/w_noise.srw'),
                    project!,
                ),
                false,
            );

            assert.strictEqual(
                graph.getPreferredProjectForSourceFile(
                    vscode.Uri.file('/workspace/examples/ignored.pbl/w_noise.srw'),
                ),
                undefined,
            );
        } finally {
            await config.update(
                'indexing.exclude',
                previousExcludes,
                vscode.ConfigurationTarget.Workspace,
            );
        }
    });
});