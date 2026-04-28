import * as assert from 'assert';
import * as vscode from 'vscode';
import {
    buildPbAutoBuildArgs,
    getPbBuildTargetKind,
    isPbBuildTargetPath,
    isPbBuildTargetUri,
} from '../../powerbuilder/build/buildTargetUtils';

suite('BuildTargetUtils', () => {
    test('clasifica los targets buildables soportados', () => {
        assert.strictEqual(getPbBuildTargetKind('c:/demo/app.pbproj'), 'project');
        assert.strictEqual(getPbBuildTargetKind('c:/demo/app.pbw'), 'workspace');
        assert.strictEqual(getPbBuildTargetKind('c:/demo/app.pbsln'), 'solution');
        assert.strictEqual(getPbBuildTargetKind('c:/demo/app.pbt'), 'target-file');
        assert.strictEqual(getPbBuildTargetKind('c:/demo/app.sru'), undefined);
    });

    test('detecta rutas y URIs buildables con el mismo helper compartido', () => {
        const workspaceTarget = vscode.Uri.file('c:/demo/workspace.pbw');
        const sourceFile = vscode.Uri.file('c:/demo/n_demo.sru');

        assert.strictEqual(isPbBuildTargetPath('c:/demo/solution.pbsln'), true);
        assert.strictEqual(isPbBuildTargetUri(workspaceTarget), true);
        assert.strictEqual(isPbBuildTargetUri(sourceFile), false);
    });

    test('genera los argumentos PBAutoBuild reutilizables para cualquier target', () => {
        const target = vscode.Uri.file('c:/demo/solution/demo.pbsln');

        assert.deepStrictEqual(buildPbAutoBuildArgs(target), ['/pbc', '/c', target.fsPath]);
    });
});