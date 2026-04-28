import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { PowerBuilderWorkspaceSnapshotStore } from '../../core/utils/powerBuilderWorkspaceSnapshotStore';
import { getSymbolContextAtPosition } from '../../powerbuilder/document/documentUtils';
import { buildPowerScriptDocumentModel } from '../../powerbuilder/document/powerScriptDocumentModel';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { SemanticQueryService } from '../../powerbuilder/semantic/queries/semanticQueryService';

function makeDoc(text: string, uriPath: string): vscode.TextDocument {
    const lines = text.split(/\r?\n/);
    const lineOffsets: number[] = [];
    let runningOffset = 0;

    for (const line of lines) {
        lineOffsets.push(runningOffset);
        runningOffset += line.length + 1;
    }

    return {
        uri: vscode.Uri.parse(uriPath),
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length,
        languageId: 'powerbuilder',
        offsetAt: (position: vscode.Position) => {
            const line = Math.max(0, Math.min(position.line, lines.length - 1));
            const character = Math.max(0, Math.min(position.character, (lines[line] || '').length));

            return lineOffsets[line] + character;
        },
        positionAt: (offset: number) => {
            const normalizedOffset = Math.max(0, Math.min(offset, text.length));
            const prefix = text.slice(0, normalizedOffset);
            const parts = prefix.split(/\r?\n/);

            return new vscode.Position(
                parts.length - 1,
                parts[parts.length - 1].length,
            );
        },
    } as unknown as vscode.TextDocument;
}

function extractMarkedText(source: string): { text: string; position: vscode.Position } {
    const startMarker = source.indexOf('[[');
    const endMarker = source.indexOf(']]', startMarker + 2);

    assert.ok(startMarker >= 0 && endMarker > startMarker, 'Expected a [[marked]] identifier');

    const markedText = source.slice(startMarker + 2, endMarker);
    const cleanText = source.slice(0, startMarker) + markedText + source.slice(endMarker + 2);
    const prefix = cleanText.slice(0, startMarker);
    const lines = prefix.split(/\r?\n/);

    return {
        text: cleanText,
        position: new vscode.Position(lines.length - 1, lines[lines.length - 1].length),
    };
}

function getPositionAfterText(
    document: vscode.TextDocument,
    searchText: string,
    occurrence: number = 1,
): vscode.Position {
    const text = document.getText();
    let fromIndex = 0;
    let matchIndex = -1;

    for (let currentOccurrence = 0; currentOccurrence < occurrence; currentOccurrence++) {
        matchIndex = text.indexOf(searchText, fromIndex);
        assert.ok(matchIndex >= 0, `Expected to find occurrence ${occurrence} of ${searchText}`);
        fromIndex = matchIndex + searchText.length;
    }

    return document.positionAt(matchIndex + searchText.length);
}

async function writeWorkspaceScenario(
    baseRelativePath: string,
    files: Record<string, string>,
): Promise<Record<string, vscode.Uri>> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for SemanticQueryService tests');

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
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for SemanticQueryService tests');
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

function toWorkspaceRelativePath(uri: vscode.Uri): string {
    return vscode.workspace.asRelativePath(uri, false).replace(/\\/g, '/');
}

suite('SemanticQueryService', () => {
    let index: SymbolIndex;
    let service: SemanticQueryService;

    setup(() => {
        index = SymbolIndex.getInstance();
        index.clear();
        PowerBuilderWorkspaceSnapshotStore.getInstance().clear();
        PbLibraryGraph.getInstance().clear();
        service = new SemanticQueryService(index);
    });

    test('resolveSymbolAtPosition devuelve un primario exacto para un callable indexado', () => {
        const input = extractMarkedText([
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'public function long of_run ();',
            'return 1',
            'end function',
            '',
            'event open;',
            '[[of_run]]()',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/semantic-query-symbol.sru');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveSymbolAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.primarySymbol?.name, 'of_run');
        assert.ok(result.symbols.some(symbol => symbol.name === 'of_run'));
        assert.deepStrictEqual(result.reasons, []);
    });

    test('resolveCallAtPosition resuelve members del sistema owner-aware', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'singlelineedit sle_name',
            '',
            'event open;',
            'sle_name.[[SetFocus]]()',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/semantic-query-system-member.srw');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveCallAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.systemEntry?.name, 'SetFocus');
        assert.strictEqual(result.reasons.length, 0);
    });

    test('resolveCallAtPosition prioriza members owner-aware frente a globales homónimas', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'singlelineedit sle_name',
            '',
            'event open;',
            'sle_name.[[TypeOf]]()',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/semantic-query-system-member-homonym.srw');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveCallAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.systemEntry?.name, 'TypeOf');
        assert.strictEqual(result.systemEntry?.namespace, 'object');
        assert.strictEqual(result.reasons.length, 0);
    });

    test('resolveCallAtPosition prioriza methods de ventana frente a globales homónimas de workspace', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            '',
            'event open;',
            'this.[[WorkSpaceWidth]]()',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/semantic-query-window-workspace-member.srw');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveCallAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.systemEntry?.name, 'WorkSpaceWidth');
        assert.strictEqual(result.systemEntry?.namespace, 'object');
        assert.strictEqual(result.reasons.length, 0);
    });

    test('resolveCallAtPosition degrada a compatible el owner this heredado', () => {
        const baseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'public function long of_base ();',
            'return 1',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-call-inherited-base.srw');
        const input = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            'this.[[of_base]]()',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-call-inherited-child.srw');

        buildPowerScriptDocumentModel(baseDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(baseDocument);
        index.indexDocument(document);

        const result = service.resolveCallAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'compatible');
        assert.strictEqual(result.primarySymbol?.name, 'of_base');
        assert.strictEqual(result.systemEntry, undefined);
        assert.ok(result.evidence.some(evidence =>
            evidence.kind === 'owner-match' &&
            evidence.precision === 'compatible',
        ));
    });

    test('resolveCallAtPosition mantiene exact el owner chain con tipo semilla único', () => {
        const serviceDocument = makeDoc([
            'global type n_chain_service from nonvisualobject',
            'end type',
            'global n_chain_service n_chain_service',
            '',
            'public function long of_target ();',
            'return 1',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-call-chain-service.sru');
        const contextDocument = makeDoc([
            'global type n_context from nonvisualobject',
            'end type',
            'global n_context n_context',
            '',
            'public function n_chain_service of_service ();',
            'return create n_chain_service',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-call-chain-context.sru');
        const input = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'n_context iu_context',
            '',
            'event open;',
            'iu_context.of_service().[[of_target]]()',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-call-chain-consumer.srw');

        buildPowerScriptDocumentModel(serviceDocument);
        buildPowerScriptDocumentModel(contextDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(serviceDocument);
        index.indexDocument(contextDocument);
        index.indexDocument(document);

        const result = service.resolveCallAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.primarySymbol?.name, 'of_target');
        assert.strictEqual(result.reasons.length, 0);
        assert.ok(result.evidence.some(evidence =>
            evidence.kind === 'owner-match' &&
            evidence.precision === 'exact',
        ));
    });

    test('resolveCallAtPosition bloquea owner explícito tipado como Any', () => {
        const serviceDocument = makeDoc([
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'public function long of_any_only ();',
            'return 1',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-call-any-service.sru');
        const input = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'any la_owner',
            '',
            'event open;',
            'la_owner = CREATE n_service',
            'la_owner.[[of_any_only]]()',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-call-any-consumer.srw');

        buildPowerScriptDocumentModel(serviceDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(serviceDocument);
        index.indexDocument(document);

        const result = service.resolveCallAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'blocked');
        assert.strictEqual(result.reasons[0]?.code, 'any-owner');
        assert.ok(result.evidence.some(evidence => evidence.precision === 'blocked'));
    });

    test('resolveDefinition expone locations exactas para símbolos indexados', () => {
        const input = extractMarkedText([
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'public function long of_run ();',
            'return 1',
            'end function',
            '',
            'event open;',
            '[[of_run]]()',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/semantic-query-definition.sru');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected definition query context');

        const result = service.resolveDefinition({
            word: context!.word,
            uri: document.uri,
            symbolContext: context!,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.locations.length, 1);
        assert.strictEqual(result.primarySymbol?.name, 'of_run');
    });

    test('resolveDefinition mantiene navegación compatible para herencia demostrable', () => {
        const baseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'public function long of_base ();',
            'return 1',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-definition-inherited-base.srw');
        const input = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            'this.[[of_base]]()',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-definition-inherited-child.srw');

        buildPowerScriptDocumentModel(baseDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(baseDocument);
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected inherited definition context');

        const result = service.resolveDefinition({
            word: context!.word,
            uri: document.uri,
            symbolContext: context!,
        });

        assert.strictEqual(result.precision, 'compatible');
        assert.strictEqual(result.locations.length, 1);
        assert.strictEqual(result.primarySymbol?.name, 'of_base');
        assert.ok(result.evidence.some(evidence =>
            evidence.kind === 'owner-match' && evidence.precision === 'compatible',
        ));
    });

    test('resolveDefinition retira locations publicables cuando la familia sigue ambigua', () => {
        index.indexDocument(
            makeDoc(
                'global function integer gf_conflict ();',
                'file:///test/semantic-query-definition-ambiguous-a.sru',
            ),
        );
        index.indexDocument(
            makeDoc(
                'global function integer gf_conflict ();',
                'file:///test/semantic-query-definition-ambiguous-b.sru',
            ),
        );

        const result = service.resolveDefinition({
            word: 'gf_conflict',
            uri: vscode.Uri.parse('file:///test/semantic-query-definition-request.sru'),
        });

        assert.strictEqual(result.precision, 'ambiguous');
        assert.strictEqual(result.locations.length, 0);
        assert.ok(result.symbols.length >= 2);
        assert.strictEqual(result.reasons[0]?.code, 'multiple-candidates');
    });

    test('resolveCompletionAtPosition expone system entries owner-aware con precision exacta', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'singlelineedit sle_name',
            '',
            'event open;',
            'sle_name.[[SetF]]',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/semantic-query-completion.srw');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveCompletionAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.isIncomplete, false);
        assert.ok(result.ownerTypeNames.includes('singlelineedit'));
        assert.ok(result.systemEntries.some(entry => entry.name === 'SetFocus'));
        assert.ok(result.evidence.some(evidence => evidence.kind === 'owner-match'));
    });

    test('resolveCompletionAtPosition expone métodos nuevos de ventana para this tipado', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            '',
            'event open;',
            'this.[[OpenS]]',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/semantic-query-completion-window-manual-core.srw');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveCompletionAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.isIncomplete, false);
        assert.ok(result.ownerTypeNames.includes('window'));
        assert.ok(result.systemEntries.some(entry => entry.name === 'OpenSheet'));
        assert.ok(result.systemEntries.some(entry => entry.name === 'OpenSheetWithParm'));
    });

    test('resolveCompletionAtPosition publica completion exacta para this con herencia demostrable', () => {
        const baseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'public function long of_base ();',
            'return 1',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-completion-base.srw');
        const input = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'public function long of_child ();',
            'return 2',
            'end function',
            '',
            'event open;',
            'this.[[of_]]',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-completion-child.srw');

        buildPowerScriptDocumentModel(baseDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(baseDocument);
        index.indexDocument(document);

        const result = service.resolveCompletionAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.isIncomplete, false);
        assert.ok(result.ownerTypeNames.includes('w_child'));
        assert.ok(result.ownerTypeNames.includes('w_base'));
        assert.ok(result.symbols.some(symbol => symbol.name === 'of_child'));
        assert.ok(result.symbols.some(symbol => symbol.name === 'of_base'));
        assert.strictEqual(result.reasons.length, 0);
        assert.ok(result.evidence.some(evidence =>
            evidence.kind === 'owner-match' && evidence.precision === 'exact',
        ));
    });

    test('resolveCompletionAtPosition bloquea owner explícito tipado como Any', () => {
        const serviceDocument = makeDoc([
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'public function long of_any_only ();',
            'return 1',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-completion-any-service.sru');
        const input = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'any la_owner',
            '',
            'event open;',
            'la_owner = CREATE n_service',
            'la_owner.[[of_]]',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-completion-any-consumer.srw');

        buildPowerScriptDocumentModel(serviceDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(serviceDocument);
        index.indexDocument(document);

        const result = service.resolveCompletionAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'blocked');
        assert.strictEqual(result.isIncomplete, false);
        assert.strictEqual(result.symbols.length, 0);
        assert.strictEqual(result.systemEntries.length, 0);
        assert.strictEqual(result.reasons[0]?.code, 'any-owner');
    });

    test('resolveCompletionAtPosition degrada cuando el owner explícito sigue ambiguo', () => {
        const serviceADocument = makeDoc([
            'global type n_service_a from nonvisualobject',
            'end type',
            'global n_service_a n_service_a',
            '',
            'public function long of_left ();',
            'return 1',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-completion-ambiguous-service-a.sru');
        const serviceBDocument = makeDoc([
            'global type n_service_b from nonvisualobject',
            'end type',
            'global n_service_b n_service_b',
            '',
            'public function long of_right ();',
            'return 2',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-completion-ambiguous-service-b.sru');
        const input = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'n_service_a inv_service',
            'n_service_b inv_service',
            '',
            'event open;',
            'inv_service.[[of_]]',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-completion-ambiguous-consumer.srw');

        buildPowerScriptDocumentModel(serviceADocument);
        buildPowerScriptDocumentModel(serviceBDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(serviceADocument);
        index.indexDocument(serviceBDocument);
        index.indexDocument(document);

        const result = service.resolveCompletionAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'blocked');
        assert.strictEqual(result.isIncomplete, true);
        assert.ok(result.symbols.some(symbol => symbol.name === 'of_left'));
        assert.ok(result.symbols.some(symbol => symbol.name === 'of_right'));
        assert.strictEqual(result.reasons[0]?.code, 'owner-type-ambiguous');
    });

    test('resolveHoverAtPosition resuelve hover owner-aware de runtime symbols', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'singlelineedit sle_name',
            '',
            'event open;',
            'sle_name.[[SetFocus]]()',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/semantic-query-hover-owner.srw');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected owner-aware hover context');

        const result = service.resolveHoverAtPosition({
            uri: document.uri,
            document,
            position: input.position,
            context: context!,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.systemEntry?.name, 'SetFocus');
        assert.strictEqual(result.content?.kind, 'system-symbol');
        assert.ok(result.content?.markdown.includes('SetFocus'));
        assert.strictEqual(result.evidence[0]?.kind, 'system-member');
    });

    test('resolveHoverAtPosition suprime falsas detecciones en tipo de declaración', () => {
        const text = 'string ls_result = String(123)';
        const document = makeDoc(text, 'file:///test/semantic-query-hover-declaration.sru');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const declarationContext = getSymbolContextAtPosition(
            document,
            new vscode.Position(0, text.indexOf('string') + 1),
        );
        assert.ok(declarationContext, 'Expected declaration hover context');

        const declarationHover = service.resolveHoverAtPosition({
            uri: document.uri,
            document,
            position: declarationContext!.range.start,
            context: declarationContext!,
        });

        assert.strictEqual(declarationHover.content, undefined);
        assert.strictEqual(declarationHover.precision, 'blocked');

        const callContext = getSymbolContextAtPosition(
            document,
            new vscode.Position(0, text.indexOf('String(') + 1),
        );
        assert.ok(callContext, 'Expected call hover context');

        const callHover = service.resolveHoverAtPosition({
            uri: document.uri,
            document,
            position: callContext!.range.start,
            context: callContext!,
        });

        assert.strictEqual(callHover.precision, 'exact');
        assert.ok(callHover.content?.markdown.includes('String(value)'));
    });

    test('resolveHoverAtPosition publica sugerencia exacta de firma y retorno para un callable indexado', () => {
        const input = extractMarkedText([
            'global type n_query from nonvisualobject',
            'end type',
            'global n_query n_query',
            '',
            'public function integer wf_calculate (integer ai_value, ref decimal adc_result);',
            'return ai_value',
            'end function',
            '',
            'event open;',
            'decimal ld_total',
            'wf_[[calculate]](1, ld_total)',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-hover-callable-suggestion.sru');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected callable hover context');

        const result = service.resolveHoverAtPosition({
            uri: document.uri,
            document,
            position: input.position,
            context: context!,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.ok(result.content?.markdown.includes('Sugerencia exacta de firma'));
        assert.ok(result.content?.markdown.includes('Sugerencia exacta de retorno: `integer`'));
    });

    test('resolveHoverAtPosition publica sugerencia compatible sobre un callable heredado demostrable', () => {
        const baseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'public function long of_base (string as_name);',
            'return len(as_name)',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-hover-inherited-base.srw');
        const input = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            'this.[[of_base]]("demo")',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-hover-inherited-child.srw');

        buildPowerScriptDocumentModel(baseDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(baseDocument);
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected inherited callable hover context');

        const result = service.resolveHoverAtPosition({
            uri: document.uri,
            document,
            position: input.position,
            context: context!,
        });

        assert.strictEqual(result.precision, 'compatible');
        assert.ok(result.content?.markdown.includes('Sugerencia compatible de firma'));
        assert.ok(result.content?.markdown.includes('Sugerencia compatible de retorno: `long`'));
    });

    test('resolveHoverAtPosition expone ambigüedad sin contenido primario', () => {
        index.indexDocument(
            makeDoc(
                'global function integer gf_conflict ();',
                'file:///test/semantic-query-hover-a.sru',
            ),
        );
        index.indexDocument(
            makeDoc(
                'global function integer gf_conflict ();',
                'file:///test/semantic-query-hover-b.sru',
            ),
        );

        const result = service.resolveHoverAtPosition({
            uri: vscode.Uri.parse('file:///test/semantic-query-hover.sru'),
            word: 'gf_conflict',
        });

        assert.strictEqual(result.content, undefined);
        assert.strictEqual(result.precision, 'ambiguous');
        assert.strictEqual(result.reasons[0]?.code, 'multiple-candidates');
        assert.strictEqual(result.evidence[0]?.kind, 'candidate-ranking');
    });

    test('resolveHoverAtPosition bloquea owner explícito tipado como Any', () => {
        const serviceDocument = makeDoc([
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'public function long of_any_only ();',
            'return 1',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-hover-any-service.sru');
        const input = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'any la_owner',
            '',
            'event open;',
            'la_owner = CREATE n_service',
            'la_owner.[[of_any_only]]()',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-hover-any-consumer.srw');

        buildPowerScriptDocumentModel(serviceDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(serviceDocument);
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected Any owner hover context');

        const result = service.resolveHoverAtPosition({
            uri: document.uri,
            document,
            position: input.position,
            context: context!,
        });

        assert.strictEqual(result.precision, 'blocked');
        assert.strictEqual(result.content, undefined);
        assert.strictEqual(result.reasons[0]?.code, 'any-owner');
        assert.ok(result.evidence.some(evidence => evidence.precision === 'blocked'));
    });

    test('resolveSignatureAtPosition resuelve firmas owner-aware del runtime para edición de texto', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'singlelineedit sle_name',
            '',
            'event open;',
            'sle_name.SelectText(1, [[2]])',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-signature-owner-aware-text.srw');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveSignatureAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.shouldProvideHelp, true);
        assert.strictEqual(result.systemEntry?.name, 'SelectText');
        assert.ok(result.evidence.some(evidence => evidence.kind === 'system-member'));
    });

    test('resolveSignatureAtPosition resuelve firmas owner-aware de línea y scroll', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'multilineedit mle_notes',
            '',
            'event open;',
            'mle_notes.Scroll([[1]])',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-signature-owner-aware-scroll.srw');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveSignatureAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.shouldProvideHelp, true);
        assert.strictEqual(result.systemEntry?.name, 'Scroll');
        assert.ok(result.evidence.some(evidence => evidence.kind === 'system-member'));
    });

    test('resolveSignatureAtPosition resuelve firmas DataWindow tipadas para getters curados', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'datawindow dw_data',
            '',
            'event open;',
            'dw_data.GetItemNumber(1, [["emp_id"]])',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-signature-datawindow-getitemnumber.srw');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveSignatureAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.shouldProvideHelp, true);
        assert.strictEqual(result.systemEntry?.name, 'GetItemNumber');
        assert.strictEqual(result.systemEntry?.namespace, 'datawindow');
    });

    test('resolveCompletionAtPosition expone métodos DataWindow control-only y core curados', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'datawindow dw_data',
            '',
            'event open;',
            'dw_data.[[Sel]]',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-completion-datawindow-curated.srw');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveCompletionAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.isIncomplete, false);
        assert.ok(result.ownerTypeNames.includes('datawindow'));
        assert.ok(result.systemEntries.some(entry => entry.name === 'SelectText'));
        assert.ok(result.systemEntries.some(entry => entry.name === 'SelectTextAll'));
    });

    test('resolveCompletionAtPosition expone métodos graph curados de DataWindow', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'datawindow dw_data',
            '',
            'event open;',
            'dw_data.[[SetD]]',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-completion-datawindow-graph-curated.srw');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveCompletionAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.isIncomplete, false);
        assert.ok(result.ownerTypeNames.includes('datawindow'));
        assert.ok(result.systemEntries.some(entry => entry.name === 'SetDataLabelling'));
        assert.ok(result.systemEntries.some(entry => entry.name === 'SetDataStyle'));
        assert.ok(result.systemEntries.some(entry => entry.name === 'SetDataTransparency'));
    });

    test('resolveSignatureAtPosition selecciona un overload exacto por aridad', () => {
        const input = extractMarkedText([
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'public function long of_run ();',
            'return 1',
            'end function',
            '',
            'public function long of_run (string as_name);',
            'return len(as_name)',
            'end function',
            '',
            'event open;',
            'of_run([["demo"]])',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-signature-consumer.sru');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveSignatureAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.shouldProvideHelp, true);
        assert.strictEqual(result.symbols.length, 1);
        assert.strictEqual(result.symbols[0].name, 'of_run');
        assert.ok(result.evidence.some(evidence => evidence.kind === 'arity-match'));
    });

    test('resolveSignatureAtPosition degrada a compatible una llamada heredada demostrable', () => {
        const baseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'public function long of_base (string as_name);',
            'return len(as_name)',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-signature-inherited-base.srw');
        const input = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            'this.of_base([["demo"]])',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-signature-inherited-child.srw');

        buildPowerScriptDocumentModel(baseDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(baseDocument);
        index.indexDocument(document);

        const result = service.resolveSignatureAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'compatible');
        assert.strictEqual(result.shouldProvideHelp, true);
        assert.strictEqual(result.symbols.length, 1);
        assert.strictEqual(result.symbols[0].name, 'of_base');
        assert.ok(result.evidence.some(evidence =>
            evidence.kind === 'owner-match' && evidence.precision === 'compatible',
        ));
    });

    test('resolveSignatureAtPosition retira la ayuda cuando la llamada sigue ambigua', () => {
        const baseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'public function long of_run (string as_name);',
            'return len(as_name)',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-signature-base.srw');
        const input = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'public function long of_run (string as_name);',
            'return len(as_name) + 1',
            'end function',
            '',
            'event open;',
            'this.of_run([["demo"]])',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-signature-child.srw');

        buildPowerScriptDocumentModel(baseDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(baseDocument);
        index.indexDocument(document);

        const result = service.resolveSignatureAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'ambiguous');
        assert.strictEqual(result.shouldProvideHelp, false);
        assert.ok(result.symbols.length >= 2);
        assert.strictEqual(result.reasons[0]?.code, 'multiple-candidates');
    });

    test('resolveSignatureAtPosition bloquea llamadas DYNAMIC', () => {
        const input = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'nonvisualobject inv_base',
            '',
            'event open;',
            'inv_base.DYNAMIC of_dynamic_only([["demo"]])',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/semantic-query-dynamic.sru');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveSignatureAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'blocked');
        assert.strictEqual(result.shouldProvideHelp, false);
        assert.strictEqual(result.systemEntry, undefined);
        assert.strictEqual(result.symbols.length, 0);
        assert.strictEqual(result.reasons[0]?.code, 'dynamic-dispatch');
    });

    test('resolveSignatureAtPosition bloquea owner explícito tipado como Any', () => {
        const serviceDocument = makeDoc([
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'public function long of_any_only (string as_name);',
            'return len(as_name)',
            'end function',
        ].join('\n'), 'file:///test/semantic-query-signature-any-service.sru');
        const input = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'any la_owner',
            '',
            'event open;',
            'la_owner = CREATE n_service',
            'la_owner.of_any_only([["demo"]])',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/semantic-query-signature-any-consumer.srw');

        buildPowerScriptDocumentModel(serviceDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(serviceDocument);
        index.indexDocument(document);

        const result = service.resolveSignatureAtPosition({
            document,
            position: input.position,
        });

        assert.strictEqual(result.precision, 'blocked');
        assert.strictEqual(result.shouldProvideHelp, false);
        assert.strictEqual(result.symbols.length, 0);
        assert.strictEqual(result.reasons[0]?.code, 'any-owner');
    });

    test('resolveSignatureAtPosition conserva overloads compatibles cuando no hay aridad exacta', () => {
        const document = makeDoc([
            'global type n_signature_probe from nonvisualobject',
            'end type',
            'global n_signature_probe n_signature_probe',
            '',
            'public function long of_run ();',
            'return 0',
            'end function',
            '',
            'public function long of_run (string as_name, long al_id);',
            'return al_id',
            'end function',
            '',
            'event open;',
            'of_run("demo", )',
            'end event',
        ].join('\n'), 'file:///test/semantic-query-signature-compatible.sru');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const result = service.resolveSignatureAtPosition({
            document,
            position: getPositionAfterText(document, 'of_run("demo", '),
        });

        assert.strictEqual(result.precision, 'compatible');
        assert.strictEqual(result.shouldProvideHelp, true);
        assert.strictEqual(result.symbols.length, 2);
        assert.ok(result.symbols.some(symbol => symbol.signature?.includes('of_run ()') || symbol.signature?.includes('of_run()')));
        assert.ok(result.symbols.some(symbol => symbol.signature?.includes('of_run (string as_name, long al_id)') || symbol.signature?.includes('of_run(string as_name, long al_id)')));
        assert.strictEqual(result.reasons[0]?.code, 'no-primary-candidate');
    });

    test('resolveReferences y resolveRenameEdits propagan precision y evidence heurística controlada', async () => {
        const baseRelativePath = path.join('phase6-generated', 'semantic-query-transversal');
        const input = extractMarkedText([
            'global type w_scope from window',
            'end type',
            'global w_scope w_scope',
            '',
            'event open;',
            'long ll_total',
            'll_total = 1',
            'MessageBox("Demo", string([[ll_total]]))',
            'end event',
        ].join('\n'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_scope.sru': input.text,
            });
            const uri = uris['w_scope.sru'];
            const document = await vscode.workspace.openTextDocument(uri);

            buildPowerScriptDocumentModel(document);
            index.indexDocument(document);

            const context = getSymbolContextAtPosition(document, input.position);
            assert.ok(context, 'Expected semantic query context for references/rename');

            const references = await service.resolveReferences({
                word: context!.word,
                uri,
                includeDeclaration: true,
                symbolContext: context!,
            });

            assert.strictEqual(references.precision, 'compatible');
            assert.strictEqual(references.locations.length, 3);
            assert.ok(references.evidence.some(evidence => evidence.kind === 'text-prefilter'));

            const rename = await service.resolveRenameEdits({
                word: context!.word,
                newName: 'll_total_renamed',
                uri,
                symbolContext: context!,
            });

            assert.strictEqual(rename.precision, 'compatible');
            assert.ok(rename.renamePlan, 'Expected semantic rename plan');
            assert.ok(rename.edit, 'Expected workspace edit for rename');
            assert.ok(rename.evidence.some(evidence => evidence.kind === 'text-prefilter'));
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('resolveReferences acota overrides owner-aware al callable más específico', async () => {
        const baseRelativePath = path.join('phase6-generated', 'semantic-query-references-owner-aware-override');
        const input = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'public function long of_ping ();',
            'return 2',
            'end function',
            '',
            'event open;',
            'this.[[of_ping]]()',
            'end event',
        ].join('\n'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_base.srw': [
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'public function long of_ping ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'w_child.srw': input.text,
                'w_other.srw': [
                    'global type w_other from w_base',
                    'end type',
                    'global w_other w_other',
                    '',
                    'event open;',
                    'this.of_ping()',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['w_child.srw'];
            const document = await vscode.workspace.openTextDocument(uri);

            buildPowerScriptDocumentModel(document);
            index.indexDocument(await vscode.workspace.openTextDocument(uris['w_base.srw']));
            index.indexDocument(document);
            index.indexDocument(await vscode.workspace.openTextDocument(uris['w_other.srw']));

            const context = getSymbolContextAtPosition(document, input.position);
            assert.ok(context, 'Expected semantic query context for owner-aware references');

            const result = await service.resolveReferences({
                word: context!.word,
                uri,
                includeDeclaration: true,
                symbolContext: context!,
            });

            assert.strictEqual(result.precision, 'compatible');
            assert.deepStrictEqual(
                result.locations.map(location =>
                    `${toWorkspaceRelativePath(location.uri)}:${location.range.start.line}`,
                ).sort(),
                [
                    `${baseRelativePath.replace(/\\/g, '/')}/w_child.srw:4`,
                    `${baseRelativePath.replace(/\\/g, '/')}/w_child.srw:9`,
                ],
            );
            assert.ok(
                result.query.resolvedSymbols.every(symbol => symbol.uri.path.endsWith('/w_child.srw')),
                'Owner-aware references should collapse to the most specific override family',
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('resolveRenameEdits permite rename owner-aware sobre el override más específico', async () => {
        const baseRelativePath = path.join('phase6-generated', 'semantic-query-rename-owner-aware-override');
        const input = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'public function long of_ping ();',
            'return 2',
            'end function',
            '',
            'event open;',
            'this.[[of_ping]]()',
            'end event',
        ].join('\n'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'w_base.srw': [
                    'global type w_base from window',
                    'end type',
                    'global w_base w_base',
                    '',
                    'public function long of_ping ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'w_child.srw': input.text,
                'w_other.srw': [
                    'global type w_other from w_base',
                    'end type',
                    'global w_other w_other',
                    '',
                    'event open;',
                    'this.of_ping()',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['w_child.srw'];
            const document = await vscode.workspace.openTextDocument(uri);

            buildPowerScriptDocumentModel(document);
            index.indexDocument(await vscode.workspace.openTextDocument(uris['w_base.srw']));
            index.indexDocument(document);
            index.indexDocument(await vscode.workspace.openTextDocument(uris['w_other.srw']));

            const context = getSymbolContextAtPosition(document, input.position);
            assert.ok(context, 'Expected semantic query context for owner-aware rename');

            const result = await service.resolveRenameEdits({
                word: context!.word,
                newName: 'of_ping_child',
                uri,
                symbolContext: context!,
            });

            assert.strictEqual(result.precision, 'compatible');
            assert.ok(result.renamePlan, 'Expected semantic rename plan');
            assert.ok(result.edit, 'Expected workspace edit for owner-aware rename');

            const entries = result.edit!.entries().map(([entryUri, textEdits]) => ({
                relativePath: toWorkspaceRelativePath(entryUri),
                textEdits,
            }));

            assert.deepStrictEqual(
                entries.map(entry => entry.relativePath).sort(),
                [
                    `${baseRelativePath.replace(/\\/g, '/')}/w_child.srw`,
                ],
            );
            assert.strictEqual(
                entries[0].textEdits.length,
                2,
                'Expected declaration and call-site rename only on the override owner',
            );
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('resolveReferences retira locations publicables cuando la familia sigue ambigua', async () => {
        const baseRelativePath = path.join('phase6-generated', 'semantic-query-references-ambiguous');
        const input = extractMarkedText([
            'global type w_probe from window',
            'end type',
            'global w_probe w_probe',
            '',
            'event open;',
            '[[gf_conflict]]() ',
            'end event',
        ].join('\n'));

        try {
            const uris = await writeWorkspaceScenario(baseRelativePath, {
                'n_service_a.sru': [
                    'global type n_service_a from nonvisualobject',
                    'end type',
                    'global n_service_a n_service_a',
                    '',
                    'global function integer gf_conflict ();',
                    'return 1',
                    'end function',
                ].join('\n'),
                'n_service_b.sru': [
                    'global type n_service_b from nonvisualobject',
                    'end type',
                    'global n_service_b n_service_b',
                    '',
                    'global function integer gf_conflict ();',
                    'return 2',
                    'end function',
                ].join('\n'),
                'w_probe.sru': input.text,
                'w_consumer_other.sru': [
                    'global type w_consumer_other from window',
                    'end type',
                    'global w_consumer_other w_consumer_other',
                    '',
                    'event open;',
                    'gf_conflict()',
                    'end event',
                ].join('\n'),
            });

            const uri = uris['w_probe.sru'];
            const document = await vscode.workspace.openTextDocument(uri);

            buildPowerScriptDocumentModel(document);
            index.indexDocument(document);
            index.indexDocument(await vscode.workspace.openTextDocument(uris['n_service_a.sru']));
            index.indexDocument(await vscode.workspace.openTextDocument(uris['n_service_b.sru']));
            index.indexDocument(await vscode.workspace.openTextDocument(uris['w_consumer_other.sru']));

            const context = getSymbolContextAtPosition(document, input.position);
            assert.ok(context, 'Expected semantic query context for ambiguous references');

            const result = await service.resolveReferences({
                word: context!.word,
                uri,
                includeDeclaration: true,
                symbolContext: context!,
            });

            assert.strictEqual(result.precision, 'ambiguous');
            assert.strictEqual(result.locations.length, 0);
            assert.ok(result.query.occurrences.length > 0);
            assert.strictEqual(result.reasons[0]?.code, 'multiple-candidates');
        } finally {
            await removeWorkspaceScenario(baseRelativePath);
        }
    });

    test('resolveRenameTargetAtPosition bloquea rename de members del sistema', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'singlelineedit sle_name',
            '',
            'event open;',
            'sle_name.[[SetFocus]]()',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/semantic-query-rename-system.srw');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected system-member rename context');

        const result = service.resolveRenameTargetAtPosition({
            word: context!.word,
            uri: document.uri,
            symbolContext: context!,
        });

        assert.strictEqual(result.canRename, false);
        assert.strictEqual(result.precision, 'blocked');
        assert.strictEqual(result.reasons[0]?.code, 'system-member');
        assert.ok(result.evidence.some(evidence => evidence.kind === 'system-member'));
    });
});