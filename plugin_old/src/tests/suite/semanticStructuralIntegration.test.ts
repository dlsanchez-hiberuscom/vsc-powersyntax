import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { WorkspaceIndexer } from '../../powerbuilder/indexing/workspaceIndexer';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { registerExplorer } from '../../features/direct-api-ide/explorer/registerExplorer';

const SEMANTIC_TOKEN_TYPES = [
    'type',
    'function',
    'variable',
    'keyword',
    'comment',
    'string',
    'number',
    'operator',
    'parameter',
    'event',
] as const;

const SEMANTIC_TOKEN_MODIFIERS = [
    'declaration',
    'definition',
    'readonly',
    'static',
    'local',
    'instance',
    'shared',
    'global',
] as const;

interface DecodedSemanticToken {
    line: number;
    character: number;
    length: number;
    tokenType: string;
    tokenModifiers: number;
    tokenModifierNames: string[];
    tokenText: string;
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
    const scenarioPath = path.join(workspaceFolder.uri.fsPath, baseRelativePath);

    try {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    } catch {
        // Ignorar hosts sin UI completa durante el cleanup.
    }

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await fs.rm(scenarioPath, { recursive: true, force: true });
            break;
        } catch {
            // Reintentar tras limpiar estado compartido.
        }

        PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
        SymbolIndex.getInstance().clear();
        PbLibraryGraph.getInstance().clear();
    }

    try {
        await vscode.workspace.fs.delete(vscode.Uri.file(scenarioPath), {
            recursive: true,
            useTrash: false,
        });
    } catch {
        // Ignorar locks transitorios del host de tests.
    }

    PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
    SymbolIndex.getInstance().clear();
    PbLibraryGraph.getInstance().clear();
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

async function waitForCondition(
    predicate: () => boolean | Promise<boolean>,
    timeoutMs: number = 1500,
    intervalMs: number = 50,
): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        if (await predicate()) {
            return;
        }

        await delay(intervalMs);
    }

    assert.fail('Timed out waiting for condition');
}

function decodeSemanticTokens(
    document: vscode.TextDocument,
    tokens: vscode.SemanticTokens,
): DecodedSemanticToken[] {
    const decoded: DecodedSemanticToken[] = [];
    const data = tokens.data;

    let line = 0;
    let character = 0;

    for (let index = 0; index < data.length; index += 5) {
        const deltaLine = data[index];
        const deltaStart = data[index + 1];
        const length = data[index + 2];
        const tokenTypeIndex = data[index + 3];
        const tokenModifiers = data[index + 4];
        const tokenModifierNames = SEMANTIC_TOKEN_MODIFIERS.filter((_, modifierIndex) =>
            (tokenModifiers & (1 << modifierIndex)) !== 0,
        );

        line += deltaLine;
        character = deltaLine === 0 ? character + deltaStart : deltaStart;

        decoded.push({
            line,
            character,
            length,
            tokenType: SEMANTIC_TOKEN_TYPES[tokenTypeIndex] ?? `unknown-${tokenTypeIndex}`,
            tokenModifiers,
            tokenModifierNames,
            tokenText: document.lineAt(line).text.slice(character, character + length),
        });
    }

    return decoded;
}

function assertNoOverlappingTokens(tokens: readonly DecodedSemanticToken[]): void {
    const sorted = [...tokens].sort((left, right) => {
        if (left.line !== right.line) {
            return left.line - right.line;
        }

        if (left.character !== right.character) {
            return left.character - right.character;
        }

        return left.length - right.length;
    });

    for (let index = 1; index < sorted.length; index++) {
        const previous = sorted[index - 1];
        const current = sorted[index];

        if (previous.line !== current.line) {
            continue;
        }

        const previousEnd = previous.character + previous.length;

        assert.ok(
            current.character >= previousEnd,
            `Found overlapping semantic tokens on line ${current.line}: ${previous.tokenText} (${previous.tokenType}) overlaps ${current.tokenText} (${current.tokenType})`,
        );
    }
}

function findLineIndex(
    document: vscode.TextDocument,
    searchText: string,
    occurrence: number = 1,
): number {
    let currentOccurrence = 0;

    for (let line = 0; line < document.lineCount; line++) {
        if (!document.lineAt(line).text.includes(searchText)) {
            continue;
        }

        currentOccurrence++;

        if (currentOccurrence === occurrence) {
            return line;
        }
    }

    assert.fail(`Expected to find line containing ${searchText} (${occurrence})`);
}

function findTokenOnLine(
    tokens: readonly DecodedSemanticToken[],
    line: number,
    tokenText: string,
): DecodedSemanticToken {
    const token = tokens.find(candidate =>
        candidate.line === line && candidate.tokenText === tokenText,
    );

    assert.ok(token, `Expected token ${tokenText} on line ${line}`);
    return token!;
}

suite('Semantic, folding and explorer incremental integration', () => {
    setup(() => {
        SymbolIndex.getInstance().clear();
        PbLibraryGraph.getInstance().clear();
    });

    test('SemanticTokensProvider expone tipos semánticos reales sobre sample.sru', async () => {
        const uri = getWorkspaceTestUri('sample.sru');
        const document = await vscode.workspace.openTextDocument(uri);

        const semanticTokens = await vscode.commands.executeCommand<vscode.SemanticTokens>(
            'vscode.provideDocumentSemanticTokens',
            uri,
        );

        assert.ok(semanticTokens);
        assert.ok(semanticTokens!.data.length > 0);

        const decoded = decodeSemanticTokens(document, semanticTokens!);
        assertNoOverlappingTokens(decoded);

        assert.ok(decoded.some(token => token.tokenText === 'wf_calculate' && token.tokenType === 'function'));
        assert.ok(decoded.some(token => token.tokenText === 'ai_value' && token.tokenType === 'parameter'));
        assert.ok(decoded.some(token => token.tokenText === 'IF' && token.tokenType === 'keyword'));
        assert.ok(decoded.some(token => token.tokenType === 'string' && token.tokenText.includes('default')));
    });

    test('SemanticTokensProvider distingue variables por ámbito en usos reales', async () => {
        const baseRelativePath = path.join('phase6-generated', 'semantic-tokens-scope');

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_scope_tokens.sru': [
                    'global type n_scope_tokens from nonvisualobject',
                    'end type',
                    'global n_scope_tokens n_scope_tokens',
                    '',
                    'string is_instance',
                    'shared string is_shared',
                    'global string is_global',
                    '',
                    'public function long of_measure (string as_name);',
                    'long ll_total',
                    'll_total = len(as_name)',
                    'll_total = ll_total + len(is_instance)',
                    'll_total = ll_total + len(is_shared)',
                    'll_total = ll_total + len(is_global)',
                    'return ll_total',
                    'end function',
                ].join('\n'),
            });

            const uri = uris['n_scope_tokens.sru'];
            const document = await vscode.workspace.openTextDocument(uri);
            const semanticTokens = await vscode.commands.executeCommand<vscode.SemanticTokens>(
                'vscode.provideDocumentSemanticTokens',
                uri,
            );

            assert.ok(semanticTokens);

            const decoded = decodeSemanticTokens(document, semanticTokens!);
            assertNoOverlappingTokens(decoded);

            const localLine = findLineIndex(document, 'll_total = len(as_name)');
            const instanceLine = findLineIndex(document, 'len(is_instance)');
            const sharedLine = findLineIndex(document, 'len(is_shared)');
            const globalLine = findLineIndex(document, 'len(is_global)');

            const localToken = findTokenOnLine(decoded, localLine, 'll_total');
            const parameterToken = findTokenOnLine(decoded, localLine, 'as_name');
            const instanceToken = findTokenOnLine(decoded, instanceLine, 'is_instance');
            const sharedToken = findTokenOnLine(decoded, sharedLine, 'is_shared');
            const globalToken = findTokenOnLine(decoded, globalLine, 'is_global');

            assert.strictEqual(localToken.tokenType, 'variable');
            assert.ok(localToken.tokenModifierNames.includes('local'));
            assert.strictEqual(parameterToken.tokenType, 'parameter');
            assert.strictEqual(instanceToken.tokenType, 'variable');
            assert.ok(instanceToken.tokenModifierNames.includes('instance'));
            assert.strictEqual(sharedToken.tokenType, 'variable');
            assert.ok(sharedToken.tokenModifierNames.includes('shared'));
            assert.strictEqual(globalToken.tokenType, 'variable');
            assert.ok(globalToken.tokenModifierNames.includes('global'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('FoldingRangeProvider expone rangos estructurales y comentario anidado real', async () => {
        const uri = getWorkspaceTestUri('sample.sru');
        const document = await vscode.workspace.openTextDocument(uri);

        const ranges = await vscode.commands.executeCommand<vscode.FoldingRange[]>(
            'vscode.executeFoldingRangeProvider',
            uri,
        );

        assert.ok(ranges);
        assert.ok(ranges!.length > 0);

        const functionStart = findLineIndex(document, 'public function integer wf_calculate', 2);
        const functionEnd = findLineIndex(document, 'end function', 1);
        const commentStart = findLineIndex(document, '/* Multi-line block comment:');
        const commentEnd = findLineIndex(document, '*/', 2);

        assert.ok(ranges!.some(range => range.start === functionStart && range.end === functionEnd));
        assert.ok(ranges!.some(range => range.start === commentStart && range.end === commentEnd));
    });

    test('Explorer reacciona a indexado incremental, alta y baja de archivos', async () => {
        const baseRelativePath = path.join('phase6-generated', 'explorer-incremental-complex');
        const indexer = new WorkspaceIndexer(SymbolIndex.getInstance());

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
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'alpha.sru': [
                    'global type n_alpha from nonvisualobject',
                    'end type',
                    'global n_alpha n_alpha',
                    '',
                    'public function long of_alpha ();',
                    'return 1',
                    'end function',
                ].join('\n'),
            });
            const betaUri = vscode.Uri.file(path.join(
                vscode.workspace.workspaceFolders![0].uri.fsPath,
                baseRelativePath,
                'beta.sru',
            ));

            await delay(120);
            SymbolIndex.getInstance().clear();
            await delay(30);

            assert.ok(capturedProvider);

            let refreshCount = 0;
            const refreshDisposable = capturedProvider!.onDidChangeTreeData?.(() => {
                refreshCount++;
            });

            await indexer.indexFile(uris['alpha.sru']);
            await delay(180);

            let rootItems = (await Promise.resolve(capturedProvider!.getChildren())) ?? [];
            assert.ok(rootItems.some(item => item.label === `${baseRelativePath.replace(/\\/g, '/')}/alpha.sru`));
            assert.ok(!rootItems.some(item => item.label === `${baseRelativePath.replace(/\\/g, '/')}/beta.sru`));

            await fs.writeFile(
                betaUri.fsPath,
                [
                    'global type n_beta from nonvisualobject',
                    'end type',
                    'global n_beta n_beta',
                    '',
                    'public function long of_beta ();',
                    'return 2',
                    'end function',
                ].join('\n'),
                'utf8',
            );

            await waitForCondition(async () => {
                rootItems = (await Promise.resolve(capturedProvider!.getChildren())) ?? [];
                return rootItems.some(item => item.label === `${baseRelativePath.replace(/\\/g, '/')}/beta.sru`);
            });

            assert.ok(rootItems.some(item => item.label === `${baseRelativePath.replace(/\\/g, '/')}/alpha.sru`));

            const betaItem = rootItems.find(item => item.label === `${baseRelativePath.replace(/\\/g, '/')}/beta.sru`);
            assert.ok(betaItem);

            const betaChildren = (await Promise.resolve(capturedProvider!.getChildren(betaItem))) ?? [];
            const betaTypeItem = betaChildren.find(item => item.label === 'n_beta');
            const nestedBetaChildren = betaTypeItem
                ? (await Promise.resolve(capturedProvider!.getChildren(betaTypeItem))) ?? []
                : [];

            assert.ok(
                betaChildren.some(item => item.label === 'of_beta') ||
                nestedBetaChildren.some(item => item.label === 'of_beta'),
            );

            await fs.rm(betaUri.fsPath, { force: true });
            await waitForCondition(async () => {
                rootItems = (await Promise.resolve(capturedProvider!.getChildren())) ?? [];
                return !rootItems.some(item => item.label === `${baseRelativePath.replace(/\\/g, '/')}/beta.sru`);
            });

            assert.ok(rootItems.some(item => item.label === `${baseRelativePath.replace(/\\/g, '/')}/alpha.sru`));
            assert.ok(!rootItems.some(item => item.label === `${baseRelativePath.replace(/\\/g, '/')}/beta.sru`));
            assert.ok(refreshCount >= 1);

            refreshDisposable?.dispose();
            await removeWorkspaceScenario(baseRelativePath);
        } finally {
            restoreCreateTreeView();
            for (const disposable of disposables) {
                disposable.dispose();
            }
        }
    });
});