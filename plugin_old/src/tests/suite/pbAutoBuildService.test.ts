import * as assert from 'assert';
import * as vscode from 'vscode';
import {
    formatPbAutoBuildOutputDocument,
    parsePbAutoBuildOutput,
    PBAUTOBUILD_LAST_TARGET_STORAGE_KEY,
    PowerBuilderAutoBuildService,
    summarizePbAutoBuildIssues,
} from '../../powerbuilder/build/pbAutoBuildService';

class MemoryMemento implements Pick<vscode.Memento, 'get' | 'update'> {
    private readonly values = new Map<string, unknown>();

    get<T>(key: string, defaultValue?: T): T | undefined {
        return this.values.has(key)
            ? this.values.get(key) as T
            : defaultValue;
    }

    async update(key: string, value: unknown): Promise<void> {
        if (value === undefined) {
            this.values.delete(key);
            return;
        }

        this.values.set(key, value);
    }
}

suite('PowerBuilderAutoBuildService', () => {
    test('parsea errores PBC con objeto y códigos reales de PBAutoBuild', () => {
        const parsed = parsePbAutoBuildOutput([
            '07:49:32 [Normal]  Library: c:\\temp\\demo\\app.pbl',
            '07:49:32 [Normal]      Object: w_demo',
            '07:49:32 [Error]          (0004): Error       C0001: Illegal data type: u_dwstandard',
            "07:49:32 [Error] 'Application' failed to compile",
            'Bye (-_-)',
        ].join('\n'));

        assert.strictEqual(parsed.issues.length, 1);
        assert.strictEqual(parsed.issues[0].objectName, 'w_demo');
        assert.strictEqual(parsed.issues[0].libraryPath, 'c:\\temp\\demo\\app.pbl');
        assert.strictEqual(parsed.issues[0].compilerCode, 'C0001');
        assert.strictEqual(parsed.issues[0].nativeCode, '0004');
        assert.strictEqual(parsed.issues[0].message, 'C0001: Illegal data type: u_dwstandard');
    });

    test('conserva warnings simples sin patrón de código del compilador', () => {
        const parsed = parsePbAutoBuildOutput([
            '07:49:32 [Normal]  Library: c:\\temp\\demo\\app.pbl',
            '07:49:32 [Normal]      Object: d_customer',
            '07:49:32 [Warning]          This object uses an unsupported feature',
        ].join('\n'));

        assert.strictEqual(parsed.issues.length, 1);
        assert.strictEqual(parsed.issues[0].objectName, 'd_customer');
        assert.strictEqual(parsed.issues[0].category, 'Warning');
        assert.strictEqual(parsed.issues[0].message, 'This object uses an unsupported feature');
    });

    test('resume categorias y bibliotecas de forma estructurada', () => {
        const parsed = parsePbAutoBuildOutput([
            '07:49:32 [Normal]  Library: c:\\temp\\demo\\app.pbl',
            '07:49:32 [Normal]      Object: w_demo',
            '07:49:32 [Error]          (0004): Error       C0001: Illegal data type: u_dwstandard',
            '07:49:33 [Normal]      Object: d_customer',
            '07:49:33 [Warning]          This object uses an unsupported feature',
            '07:49:34 [Normal]  Library: c:\\temp\\demo\\shared.pbl',
            '07:49:34 [Normal]      Object: n_service',
            '07:49:34 [Error]          (0101): Fatal       C9999: Internal compiler failure',
        ].join('\n'));
        const summary = summarizePbAutoBuildIssues(parsed.issues);

        assert.strictEqual(summary.errorCount, 2);
        assert.strictEqual(summary.warningCount, 1);
        assert.strictEqual(summary.fatalCount, 1);
        assert.deepStrictEqual(
            summary.categories.map(category => [category.category, category.issueCount]),
            [
                ['Fatal', 1],
                ['Error', 1],
                ['Warning', 1],
            ],
        );
        assert.strictEqual(summary.libraries.length, 2);
        assert.strictEqual(summary.libraries[0].libraryPath, 'c:\\temp\\demo\\app.pbl');
        assert.deepStrictEqual(summary.libraries[0].objectNames, ['d_customer', 'w_demo']);
        assert.strictEqual(summary.libraries[1].libraryPath, 'c:\\temp\\demo\\shared.pbl');
    });

    test('formatea la salida de build con resumen estructurado', () => {
        const parsed = parsePbAutoBuildOutput([
            '07:49:32 [Normal]  Library: c:\\temp\\demo\\app.pbl',
            '07:49:32 [Normal]      Object: w_demo',
            '07:49:32 [Error]          (0004): Error       C0001: Illegal data type: u_dwstandard',
            '07:49:33 [Warning]          This object uses an unsupported feature',
        ].join('\n'));
        const content = formatPbAutoBuildOutputDocument({
            project: {
                uri: vscode.Uri.file('c:/temp/demo/demo.pbproj'),
                name: 'demo',
                projectDirectoryUri: vscode.Uri.file('c:/temp/demo'),
                libraries: [],
                libraryUris: [],
            },
            executablePath: 'C:/Program Files (x86)/Appeon/PowerBuilder 25.0/pbautobuild250.exe',
            args: ['/pbc', '/c', 'c:/temp/demo/demo.pbproj'],
            exitCode: 1,
            output: parsed.rawLines.join('\n'),
            issues: parsed.issues,
            diagnostics: new Map(),
            summary: parsed.summary,
        });

        assert.ok(content.includes('Categorias:'));
        assert.ok(content.includes('- Error: 1 problema(s)'));
        assert.ok(content.includes('Bibliotecas:'));
        assert.ok(content.includes('app.pbl: 2 problema(s)'));
    });

    test('restaura el último target serializado desde workspaceState', async () => {
        const workspaceState = new MemoryMemento();

        await workspaceState.update(PBAUTOBUILD_LAST_TARGET_STORAGE_KEY, {
            uri: vscode.Uri.file('c:/temp/demo/demo.pbw').toString(),
            storedAt: '2026-04-26T00:00:00.000Z',
        });

        const service = new PowerBuilderAutoBuildService(workspaceState);

        try {
            const snapshot = service.getSessionSnapshot();

            assert.ok(snapshot.lastTarget);
            assert.strictEqual(snapshot.lastTarget?.kind, 'workspace');
            assert.strictEqual(snapshot.lastTarget?.name, 'demo');
            assert.strictEqual(snapshot.lastTarget?.source, 'workspace-state');
            assert.strictEqual(snapshot.lastTarget?.storedAt, '2026-04-26T00:00:00.000Z');
        } finally {
            service.dispose();
        }
    });
});