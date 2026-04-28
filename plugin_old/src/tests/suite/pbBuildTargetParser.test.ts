import * as assert from 'assert';
import * as vscode from 'vscode';
import { PbBuildTargetParser } from '../../powerbuilder/workspace/pbBuildTargetParser';

function normalizeFsPath(uri: vscode.Uri): string {
    return uri.fsPath.replace(/\\/g, '/').toLowerCase();
}

suite('PbBuildTargetParser', () => {
    test('parsea referencias declaradas desde .pbsln con rutas relativas, quoted y deduplicadas', () => {
        const parser = new PbBuildTargetParser();
        const solutionUri = vscode.Uri.file('c:/temp/workspace/demo.pbsln');
        const parsed = parser.parseTargetText(solutionUri, [
            'Project = "./apps/alpha/alpha.pbproj"',
            "Workspace = '.\\demo.pbw'",
            'Target = ./demo.pbt',
            'DuplicateProject = ./apps/alpha/alpha.pbproj',
            'SelfReference = ./demo.pbsln',
        ].join('\n'));

        assert.ok(parsed);
        assert.strictEqual(parsed?.kind, 'solution');
        assert.deepStrictEqual(
            parsed?.referencedUris.map(normalizeFsPath),
            [
                'c:/temp/workspace/apps/alpha/alpha.pbproj',
                'c:/temp/workspace/demo.pbw',
                'c:/temp/workspace/demo.pbt',
            ],
        );
    });

    test('ignora comentarios y claves irrelevantes aunque contengan rutas PowerBuilder', () => {
        const parser = new PbBuildTargetParser();
        const solutionUri = vscode.Uri.file('c:/temp/workspace/demo.pbsln');
        const parsed = parser.parseTargetText(solutionUri, [
            '; Project = ./ignored/comment.pbproj',
            '# Workspace = ./ignored/comment.pbw',
            '// Target = ./ignored/comment.pbt',
            'ProjectCache = ./ignored/cache.pbproj',
            'TargetHistory = ./ignored/history.pbt',
            'WorkspaceNotes = ./ignored/notes.pbw',
            'Project = ./apps/alpha/alpha.pbproj',
            'Workspace = ./demo.pbw ; comentario inline permitido',
            'Target = ./demo.pbt',
        ].join('\n'));

        assert.ok(parsed);
        assert.strictEqual(parsed?.kind, 'solution');
        assert.deepStrictEqual(
            parsed?.referencedUris.map(normalizeFsPath),
            [
                'c:/temp/workspace/apps/alpha/alpha.pbproj',
                'c:/temp/workspace/demo.pbw',
                'c:/temp/workspace/demo.pbt',
            ],
        );
    });

    test('si el archivo declara secciones, solo toma membresía desde la sección canónica', () => {
        const parser = new PbBuildTargetParser();
        const workspaceUri = vscode.Uri.file('c:/temp/workspace/demo.pbw');
        const parsed = parser.parseTargetText(workspaceUri, [
            '[RecentTargets]',
            'Target = ./ignored/recent.pbt',
            '[Workspace]',
            'Target = ./build/demo.pbt',
            '[Notes]',
            'Project = ./ignored/notes.pbproj',
            '[Workspace]',
            'Project = ./apps/alpha/alpha.pbproj',
        ].join('\n'));

        assert.ok(parsed);
        assert.strictEqual(parsed?.kind, 'workspace');
        assert.deepStrictEqual(
            parsed?.referencedUris.map(normalizeFsPath),
            [
                'c:/temp/workspace/build/demo.pbt',
                'c:/temp/workspace/apps/alpha/alpha.pbproj',
            ],
        );
    });

    test('filtra kinds no permitidos desde .pbw y conserva referencias absolutas validas', () => {
        const parser = new PbBuildTargetParser();
        const workspaceUri = vscode.Uri.file('c:/temp/workspace/demo.pbw');
        const parsed = parser.parseTargetText(workspaceUri, [
            'Project = .\\apps\\alpha\\alpha.pbproj',
            'Target = .\\build\\alpha.pbt',
            'IgnoredSolution = .\\demo.pbsln',
            'Project = "c:\\shared libs\\common.pbproj"',
            'DuplicateTarget = .\\build\\alpha.pbt',
        ].join('\n'));

        assert.ok(parsed);
        assert.strictEqual(parsed?.kind, 'workspace');
        assert.deepStrictEqual(
            parsed?.referencedUris.map(normalizeFsPath),
            [
                'c:/temp/workspace/apps/alpha/alpha.pbproj',
                'c:/temp/workspace/build/alpha.pbt',
                'c:/shared libs/common.pbproj',
            ],
        );
    });

    test('solo conserva proyectos desde .pbt', () => {
        const parser = new PbBuildTargetParser();
        const targetUri = vscode.Uri.file('c:/temp/workspace/build/demo.pbt');
        const parsed = parser.parseTargetText(targetUri, [
            'Project = ..\\apps\\alpha\\alpha.pbproj',
            'IgnoredWorkspace = ..\\demo.pbw',
            'IgnoredSolution = ..\\demo.pbsln',
        ].join('\n'));

        assert.ok(parsed);
        assert.strictEqual(parsed?.kind, 'target-file');
        assert.deepStrictEqual(
            parsed?.referencedUris.map(normalizeFsPath),
            [
                'c:/temp/workspace/apps/alpha/alpha.pbproj',
            ],
        );
    });
});