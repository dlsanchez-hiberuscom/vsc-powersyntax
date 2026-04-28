import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { getSymbolContextAtPosition } from '../../core/utils/documentUtils';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { DefinitionResolver } from '../../powerbuilder/resolution/definitionResolver';
import { HoverResolver } from '../../powerbuilder/resolution/hoverResolver';
import { ReferenceResolver } from '../../powerbuilder/resolution/referenceResolver';
import { RenameResolver } from '../../powerbuilder/resolution/renameResolver';
import { SemanticEngine } from '../../powerbuilder/semantic/semanticEngine';
import { getInheritanceGraph } from '../../powerbuilder/semantic/inheritanceGraph';
import { PowerBuilderProjectRegistry } from '../../powerbuilder/workspace/projectRegistry';

function makeDoc(text: string, uriPath: string = 'file:///test/scope.sru'): vscode.TextDocument {
    const lines = text.split(/\r?\n/);
    return {
        uri: vscode.Uri.parse(uriPath),
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length,
        languageId: 'powerbuilder',
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
    const line = lines.length - 1;
    const character = lines[lines.length - 1].length;

    return {
        text: cleanText,
        position: new vscode.Position(line, character),
    };
}

async function writeWorkspaceFile(relativePath: string, text: string): Promise<vscode.Uri> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'Expected an opened workspace folder for integration tests');

    const absolutePath = path.join(workspaceFolder.uri.fsPath, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, text, 'utf8');

    return vscode.Uri.file(absolutePath);
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

    const prefix = text.slice(0, matchIndex + searchText.length);
    const lines = prefix.split(/\r?\n/);

    return new vscode.Position(
        lines.length - 1,
        lines[lines.length - 1].length,
    );
}

suite('Semantic scope resolution', () => {
    let index: SymbolIndex;
    let definitionResolver: DefinitionResolver;
    let hoverResolver: HoverResolver;
    let referenceResolver: ReferenceResolver;
    let renameResolver: RenameResolver;
    let semanticEngine: SemanticEngine;

    setup(() => {
        index = SymbolIndex.getInstance();
        index.clear();
        PbLibraryGraph.getInstance().clear();
        getInheritanceGraph(index).clear();
        PowerBuilderProjectRegistry.getInstance().clear();
        definitionResolver = new DefinitionResolver(index);
        hoverResolver = new HoverResolver(index);
        referenceResolver = new ReferenceResolver(index);
        renameResolver = new RenameResolver(index);
        semanticEngine = new SemanticEngine(index);
    });

    test('DefinitionResolver prioriza parámetros y locales del callable actual', () => {
        const parameterInput = extractMarkedText([
            'global type w_scope from window',
            'end type',
            'global w_scope w_scope',
            'string ls_title',
            '',
            'public function string of_calc (string as_name);',
            'string ls_title',
            'return [[as_name]] + ls_title',
            'end function',
        ].join('\n'));

        const parameterDocument = makeDoc(parameterInput.text, 'file:///test/parameter_scope.sru');
        index.indexDocument(parameterDocument);

        const parameterContext = getSymbolContextAtPosition(parameterDocument, parameterInput.position);
        assert.ok(parameterContext, 'Expected parameter context');

        const parameterLocations = definitionResolver.resolve(
            parameterContext!.word,
            parameterDocument.uri,
            parameterContext!,
        );

        const parameterSymbol = index.findSymbolByName('as_name').find(symbol =>
            symbol.declarationScope === 'parameter',
        );

        assert.ok(parameterSymbol, 'Expected indexed parameter symbol');
        assert.strictEqual(parameterLocations.length, 1);
        assert.strictEqual(parameterLocations[0].range.start.line, parameterSymbol!.selectionRange.start.line);
        assert.strictEqual(parameterLocations[0].range.start.character, parameterSymbol!.selectionRange.start.character);

        index.clear();

        const localInput = extractMarkedText([
            'global type w_scope from window',
            'end type',
            'global w_scope w_scope',
            'string ls_title',
            '',
            'public function string of_calc (string as_name);',
            'string ls_title',
            'return as_name + [[ls_title]]',
            'end function',
        ].join('\n'));

        const localDocument = makeDoc(localInput.text, 'file:///test/local_scope.sru');
        index.indexDocument(localDocument);

        const localContext = getSymbolContextAtPosition(localDocument, localInput.position);
        assert.ok(localContext, 'Expected local variable context');

        const localLocations = definitionResolver.resolve(
            localContext!.word,
            localDocument.uri,
            localContext!,
        );

        const localSymbol = index.findSymbolByName('ls_title').find(symbol =>
            symbol.declarationScope === 'local',
        );

        assert.ok(localSymbol, 'Expected indexed local symbol');
        assert.strictEqual(localLocations.length, 1);
        assert.strictEqual(localLocations[0].range.start.line, localSymbol!.selectionRange.start.line);
        assert.strictEqual(localLocations[0].range.start.character, localSymbol!.selectionRange.start.character);
    });

    test('DefinitionResolver y RenameResolver priorizan shared frente a global e instance', async () => {
        const input = extractMarkedText([
            'global type w_scope from window',
            'end type',
            'global w_scope w_scope',
            'shared string is_state',
            'global string is_state',
            'private string is_state',
            '',
            'event open;',
            '[[is_state]] = "demo"',
            'end event',
        ].join('\n'));

        const uri = await writeWorkspaceFile(
            path.join('phase6-generated', 'semantic-scope', 'shared_global_instance_priority.sru'),
            input.text,
        );

        try {
            const document = await vscode.workspace.openTextDocument(uri);
            index.indexDocument(document);

            const context = getSymbolContextAtPosition(document, input.position);
            assert.ok(context, 'Expected shared/global/instance context');

            const locations = definitionResolver.resolve(
                context!.word,
                document.uri,
                context!,
            );

            assert.strictEqual(locations.length, 1);
            assert.strictEqual(locations[0].range.start.line, 3);

            const edit = await renameResolver.computeEdits(
                context!.word,
                'is_shared_state',
                document.uri,
                context!,
            );

            assert.ok(edit, 'Expected rename edits for the shared variable');

            const changedLines = edit!.entries()[0][1]
                .map(textEdit => textEdit.range.start.line)
                .sort((left, right) => left - right);

            assert.deepStrictEqual(changedLines, [3, 8]);
            assert.ok(edit!.entries()[0][1].every(textEdit => textEdit.newText === 'is_shared_state'));
        } finally {
            index.removeFile(uri);
            await fs.rm(uri.fsPath, { force: true });
        }
    });

    test('SemanticEngine filtra miembros invisibles y prioriza shared en completion implícita', () => {
        const baseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            'privatewrite string is_hidden',
            'protectedread string is_title',
        ].join('\n'), 'file:///test/w_completion_base.sru');

        const childDocument = makeDoc([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            'shared string is_state',
            'global string is_state',
            'string is_state',
            '',
            'event open;',
            'is_',
            'end event',
        ].join('\n'), 'file:///test/w_completion_child.sru');

        index.indexDocument(baseDocument);
        index.indexDocument(childDocument);

        const completion = semanticEngine.resolveCompletionAtPosition(
            childDocument,
            getPositionAfterText(childDocument, 'is_'),
        );
        const stateCandidates = completion.symbols.filter(symbol => symbol.name === 'is_state');

        assert.strictEqual(stateCandidates.length, 1);
        assert.strictEqual(stateCandidates[0].access, 'shared');
        assert.ok(completion.symbols.some(symbol => symbol.name === 'is_title'));
        assert.ok(!completion.symbols.some(symbol => symbol.name === 'is_hidden'));
    });

    test('DefinitionResolver prioriza shared al inferir el owner tipado de una llamada', () => {
        const sharedServiceDocument = makeDoc([
            'global type n_shared_service from nonvisualobject',
            'end type',
            'global n_shared_service n_shared_service',
            '',
            'public function string of_run ();',
            'return "shared"',
            'end function',
        ].join('\n'), 'file:///test/n_shared_service.sru');

        const otherServiceDocument = makeDoc([
            'global type n_other_service from nonvisualobject',
            'end type',
            'global n_other_service n_other_service',
            '',
            'public function string of_run ();',
            'return "other"',
            'end function',
        ].join('\n'), 'file:///test/n_other_service.sru');

        const consumerInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'shared n_shared_service inv_service',
            'global n_other_service inv_service',
            'private n_other_service inv_service',
            '',
            'event open;',
            'inv_service.[[of_run]]()',
            'end event',
        ].join('\n'));

        const consumerDocument = makeDoc(consumerInput.text, 'file:///test/w_consumer_typed_owner_priority.sru');
        index.indexDocument(sharedServiceDocument);
        index.indexDocument(otherServiceDocument);
        index.indexDocument(consumerDocument);

        const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
        assert.ok(context, 'Expected typed owner priority context');

        const locations = definitionResolver.resolve(
            context!.word,
            consumerDocument.uri,
            context!,
        );

        assert.strictEqual(locations.length, 1);
        assert.strictEqual(locations[0].uri.toString(), sharedServiceDocument.uri.toString());
        assert.strictEqual(locations[0].range.start.line, 4);
    });

    test('DefinitionResolver prioriza ancestorclass:: frente a variable homónima', () => {
        const baseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'public function long of_ping ();',
            'return 1',
            'end function',
        ].join('\n'), 'file:///test/w_ancestor_base.sru');

        const shadowDocument = makeDoc([
            'global type n_shadow_service from nonvisualobject',
            'end type',
            'global n_shadow_service n_shadow_service',
            '',
            'public function long of_ping ();',
            'return 2',
            'end function',
        ].join('\n'), 'file:///test/n_shadow_service.sru');

        const childInput = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            'n_shadow_service w_base',
            '',
            'event open;',
            'call w_base::[[of_ping]]()',
            'end event',
        ].join('\n'));

        const childDocument = makeDoc(childInput.text, 'file:///test/w_ancestor_child.sru');
        index.indexDocument(baseDocument);
        index.indexDocument(shadowDocument);
        index.indexDocument(childDocument);

        const context = getSymbolContextAtPosition(childDocument, childInput.position);
        assert.ok(context, 'Expected ancestorclass context');

        const locations = definitionResolver.resolve(
            context!.word,
            childDocument.uri,
            context!,
        );

        assert.strictEqual(locations.length, 1);
        assert.strictEqual(locations[0].uri.toString(), baseDocument.uri.toString());
        assert.strictEqual(locations[0].range.start.line, 4);
    });

    test('DefinitionResolver resuelve owner chains, subíndices, paréntesis y calls intermedias con el tipo final correcto', () => {
        const serviceDocument = makeDoc([
            'global type n_chain_service from nonvisualobject',
            'end type',
            'global n_chain_service n_chain_service',
            '',
            'public function long of_target ();',
            'return 1',
            'end function',
        ].join('\n'), 'file:///test/n_chain_service.sru');

        const shadowDocument = makeDoc([
            'global type n_chain_shadow from nonvisualobject',
            'end type',
            'global n_chain_shadow n_chain_shadow',
            '',
            'public function long of_shadow_only ();',
            'return 2',
            'end function',
        ].join('\n'), 'file:///test/n_chain_shadow.sru');

        const contextDocument = makeDoc([
            'global type n_context from nonvisualobject',
            'end type',
            'global n_context n_context',
            'n_chain_service inv_service',
            'n_chain_service inv_services[]',
            '',
            'public function n_chain_service of_service ();',
            'return create n_chain_service',
            'end function',
        ].join('\n'), 'file:///test/n_context_chain.sru');

        const consumerDocument = makeDoc([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'n_context iu_context',
            'n_chain_shadow inv_service',
            'n_chain_shadow inv_services[]',
            '',
            'event open;',
            'iu_context.inv_service.of_target()',
            'iu_context.inv_services[1].of_target()',
            '(iu_context.inv_service).of_target()',
            'iu_context.of_service().of_target()',
            '(iu_context.of_service()).of_target()',
            'end event',
        ].join('\n'), 'file:///test/w_owner_chain_consumer.sru');

        index.indexDocument(serviceDocument);
        index.indexDocument(shadowDocument);
        index.indexDocument(contextDocument);
        index.indexDocument(consumerDocument);

        const positions = [
            {
                label: 'member chain',
                searchText: 'iu_context.inv_service.',
                expectedExpression: 'iu_context.inv_service',
            },
            {
                label: 'indexed chain',
                searchText: 'iu_context.inv_services[1].',
                expectedExpression: 'iu_context.inv_services[1]',
            },
            {
                label: 'parenthesized chain',
                searchText: '(iu_context.inv_service).',
                expectedExpression: '(iu_context.inv_service)',
            },
            {
                label: 'call chain',
                searchText: 'iu_context.of_service().',
                expectedExpression: 'iu_context.of_service()',
            },
            {
                label: 'parenthesized call chain',
                searchText: '(iu_context.of_service()).',
                expectedExpression: '(iu_context.of_service())',
            },
        ];

        for (const currentCase of positions) {
            const context = getSymbolContextAtPosition(
                consumerDocument,
                getPositionAfterText(consumerDocument, currentCase.searchText),
            );

            assert.ok(context, `Expected ${currentCase.label} context`);
            assert.strictEqual(context!.qualifiedOwnerExpression, currentCase.expectedExpression);

            const locations = definitionResolver.resolve(
                context!.word,
                consumerDocument.uri,
                context!,
            );

            assert.strictEqual(locations.length, 1, `Expected single location for ${currentCase.label}`);
            assert.strictEqual(locations[0].uri.toString(), serviceDocument.uri.toString());
            assert.strictEqual(locations[0].range.start.line, 4);
        }
    });

    test('ReferenceResolver y RenameResolver soportan owner chains explícitos con calls intermedias y paréntesis', async () => {
        const serviceTypeName = 'n_scope_chain_reference_service';
        const contextTypeName = 'n_scope_chain_reference_context';
        const targetCallableName = 'of_scope_chain_reference_target';
        const serviceCallableName = 'of_scope_chain_reference_service';
        const contextVariableName = 'iu_scope_chain_reference_context';
        const serviceRelativePath = path.join('phase6-generated', 'owner_chain_reference', 'n_scope_chain_reference_service.sru');
        const contextRelativePath = path.join('phase6-generated', 'owner_chain_reference', 'n_scope_chain_reference_context.sru');
        const consumerRelativePath = path.join('phase6-generated', 'owner_chain_reference', 'w_scope_chain_reference_consumer.sru');

        const serviceUri = await writeWorkspaceFile(serviceRelativePath, [
            `global type ${serviceTypeName} from nonvisualobject`,
            'end type',
            `global ${serviceTypeName} ${serviceTypeName}`,
            '',
            `public function long ${targetCallableName} ();`,
            'return 1',
            'end function',
        ].join('\n'));

        const contextUri = await writeWorkspaceFile(contextRelativePath, [
            `global type ${contextTypeName} from nonvisualobject`,
            'end type',
            `global ${contextTypeName} ${contextTypeName}`,
            '',
            `public function ${serviceTypeName} ${serviceCallableName} ();`,
            `return create ${serviceTypeName}`,
            'end function',
        ].join('\n'));

        const consumerInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            `${contextTypeName} ${contextVariableName}`,
            '',
            'event open;',
            `(${contextVariableName}.${serviceCallableName}()).[[${targetCallableName}]]()`,
            `${contextVariableName}.${serviceCallableName}().${targetCallableName}()`,
            'end event',
        ].join('\n'));

        const consumerUri = await writeWorkspaceFile(consumerRelativePath, consumerInput.text);

        try {
            const serviceDocument = await vscode.workspace.openTextDocument(serviceUri);
            const contextDocument = await vscode.workspace.openTextDocument(contextUri);
            const consumerDocument = await vscode.workspace.openTextDocument(consumerUri);

            index.indexDocument(serviceDocument);
            index.indexDocument(contextDocument);
            index.indexDocument(consumerDocument);

            const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
            assert.ok(context, 'Expected owner chain reference context');
            assert.strictEqual(context!.qualifiedOwnerExpression, `(${contextVariableName}.${serviceCallableName}())`);

            const locations = await referenceResolver.resolveInWorkspace(
                context!.word,
                consumerDocument.uri,
                true,
                context!,
            );

            const serializedLocations = locations
                .map(location => `${path.basename(location.uri.fsPath)}:${location.range.start.line}`)
                .sort();

            assert.deepStrictEqual(serializedLocations, [
                'n_scope_chain_reference_service.sru:4',
                'w_scope_chain_reference_consumer.sru:6',
                'w_scope_chain_reference_consumer.sru:7',
            ]);

            const edit = await renameResolver.computeEdits(
                context!.word,
                'of_target_chain',
                consumerDocument.uri,
                context!,
            );

            assert.ok(edit, 'Expected rename edits for owner chain references');

            const renamedLines = edit!.entries()
                .flatMap(([uri, textEdits]) => textEdits.map(textEdit => `${path.basename(uri.fsPath)}:${textEdit.range.start.line}`))
                .sort();

            assert.deepStrictEqual(renamedLines, [
                'n_scope_chain_reference_service.sru:4',
                'w_scope_chain_reference_consumer.sru:6',
                'w_scope_chain_reference_consumer.sru:7',
            ]);
            assert.ok(edit!.entries().every(([, textEdits]) => textEdits.every(textEdit => textEdit.newText === 'of_target_chain')));
        } finally {
            index.removeFile(serviceUri);
            index.removeFile(contextUri);
            index.removeFile(consumerUri);
            await fs.rm(serviceUri.fsPath, { force: true });
            await fs.rm(contextUri.fsPath, { force: true });
            await fs.rm(consumerUri.fsPath, { force: true });
        }
    });

    test('documentUtils marca DYNAMIC y EVENT DYNAMIC con owner explícito', () => {
        const functionInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'nonvisualobject inv_base',
            '',
            'event open;',
            'inv_base.DYNAMIC [[of_dynamic_only]]() ',
            'end event',
        ].join('\n'));

        const functionDocument = makeDoc(functionInput.text, 'file:///test/dynamic_function_context.sru');
        const functionContext = getSymbolContextAtPosition(functionDocument, functionInput.position);

        assert.ok(functionContext, 'Expected dynamic function context');
        assert.strictEqual(functionContext!.qualifiedOwner, 'inv_base');
        assert.strictEqual(functionContext!.qualifiedOwnerExpression, 'inv_base');
        assert.strictEqual(functionContext!.isDynamicDispatch, true);
        assert.strictEqual(functionContext!.dynamicDispatchKind, 'function');

        const eventInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'nonvisualobject inv_base',
            '',
            'event open;',
            'inv_base.EVENT DYNAMIC [[ue_dynamic_only]]() ',
            'end event',
        ].join('\n'));

        const eventDocument = makeDoc(eventInput.text, 'file:///test/dynamic_event_context.sru');
        const eventContext = getSymbolContextAtPosition(eventDocument, eventInput.position);

        assert.ok(eventContext, 'Expected dynamic event context');
        assert.strictEqual(eventContext!.qualifiedOwner, 'inv_base');
        assert.strictEqual(eventContext!.qualifiedOwnerExpression, 'inv_base');
        assert.strictEqual(eventContext!.isDynamicDispatch, true);
        assert.strictEqual(eventContext!.dynamicDispatchKind, 'event');
    });

    test('DefinitionResolver, HoverResolver, ReferenceResolver y RenameResolver degradan llamadas DYNAMIC', async () => {
        const baseRelativePath = path.join('phase6-generated', 'dynamic-dispatch');
        const baseUri = await writeWorkspaceFile(path.join(baseRelativePath, 'n_base.sru'), [
            'global type n_base from nonvisualobject',
            'end type',
            'global n_base n_base',
        ].join('\n'));
        const childUri = await writeWorkspaceFile(path.join(baseRelativePath, 'n_child.sru'), [
            'global type n_child from n_base',
            'end type',
            'global n_child n_child',
            '',
            'public function long of_dynamic_only (string as_name);',
            'return len(as_name)',
            'end function',
        ].join('\n'));

        const consumerInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'n_base inv_base',
            '',
            'event open;',
            'inv_base = CREATE USING "n_child"',
            'inv_base.DYNAMIC [[of_dynamic_only]]("demo")',
            'end event',
        ].join('\n'));

        const consumerUri = await writeWorkspaceFile(path.join(baseRelativePath, 'w_consumer.sru'), consumerInput.text);

        try {
            const baseDocument = await vscode.workspace.openTextDocument(baseUri);
            const childDocument = await vscode.workspace.openTextDocument(childUri);
            const consumerDocument = await vscode.workspace.openTextDocument(consumerUri);

            index.indexDocument(baseDocument);
            index.indexDocument(childDocument);
            index.indexDocument(consumerDocument);

            const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
            assert.ok(context, 'Expected dynamic dispatch context');
            assert.strictEqual(context!.isDynamicDispatch, true);
            assert.strictEqual(context!.qualifiedOwner, 'inv_base');

            const locations = definitionResolver.resolve(
                context!.word,
                consumerDocument.uri,
                context!,
            );

            assert.deepStrictEqual(locations, []);

            const hover = hoverResolver.resolve(
                context!.word,
                consumerDocument.uri,
                context!.range.start,
                context!,
            );

            assert.strictEqual(hover, undefined);

            const references = await referenceResolver.resolveInWorkspace(
                context!.word,
                consumerDocument.uri,
                true,
                context!,
            );

            assert.deepStrictEqual(references, []);
            assert.strictEqual(renameResolver.canRename(context!.word, consumerDocument.uri, context!), false);

            const edit = await renameResolver.computeEdits(
                context!.word,
                'of_static_name',
                consumerDocument.uri,
                context!,
            );

            assert.strictEqual(edit, undefined);
        } finally {
            index.removeFile(baseUri);
            index.removeFile(childUri);
            index.removeFile(consumerUri);
            await fs.rm(baseUri.fsPath, { force: true });
            await fs.rm(childUri.fsPath, { force: true });
            await fs.rm(consumerUri.fsPath, { force: true });
        }
    });

    test('documentUtils y resolvers degradan CALL a control de ancestro con backtick', async () => {
        const baseRelativePath = path.join('phase6-generated', 'ancestor-control-call');
        const baseUri = await writeWorkspaceFile(path.join(baseRelativePath, 'w_base.sru'), [
            'forward',
            'global type w_base from window',
            'type cb_ok from commandbutton within w_base',
            'end type',
            'end type',
            'end forward',
            '',
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'type cb_ok from commandbutton within w_base',
            'end type',
            '',
            'event cb_ok::clicked;',
            'return 1',
            'end event',
        ].join('\n'));

        const consumerInput = extractMarkedText([
            'forward',
            'global type w_child from w_base',
            'type cb_ok from commandbutton within w_child',
            'end type',
            'end type',
            'end forward',
            '',
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            'CALL w_base`cb_ok::[[Clicked]]',
            'end event',
            '',
            'type cb_ok from commandbutton within w_child',
            'end type',
            '',
            'event cb_ok::clicked;',
            'return 2',
            'end event',
        ].join('\n'));

        const consumerUri = await writeWorkspaceFile(path.join(baseRelativePath, 'w_child.sru'), consumerInput.text);

        try {
            const baseDocument = await vscode.workspace.openTextDocument(baseUri);
            const consumerDocument = await vscode.workspace.openTextDocument(consumerUri);

            index.indexDocument(baseDocument);
            index.indexDocument(consumerDocument);

            const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
            assert.ok(context, 'Expected CALL ancestor control context');
            assert.strictEqual(context!.qualifiedOwner, 'cb_ok');
            assert.strictEqual(context!.qualifiedOwnerExpression, 'w_base`cb_ok');
            assert.strictEqual(context!.qualifier, '::');
            assert.strictEqual(context!.isAncestorControlCall, true);

            const locations = definitionResolver.resolve(
                context!.word,
                consumerDocument.uri,
                context!,
            );

            assert.deepStrictEqual(locations, []);

            const hover = hoverResolver.resolve(
                context!.word,
                consumerDocument.uri,
                context!.range.start,
                context!,
            );

            assert.strictEqual(hover, undefined);

            const references = await referenceResolver.resolveInWorkspace(
                context!.word,
                consumerDocument.uri,
                true,
                context!,
            );

            assert.deepStrictEqual(references, []);
            assert.strictEqual(renameResolver.canRename(context!.word, consumerDocument.uri, context!), false);
        } finally {
            index.removeFile(baseUri);
            index.removeFile(consumerUri);
            await fs.rm(baseUri.fsPath, { force: true });
            await fs.rm(consumerUri.fsPath, { force: true });
        }
    });

    test('AncestorReturnValue expone hover explicativo y bloquea navegación fuerte', async () => {
        const baseRelativePath = path.join('phase6-generated', 'ancestor-return-value');
        const baseUri = await writeWorkspaceFile(path.join(baseRelativePath, 'w_base.sru'), [
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'event closequery;',
            'return 1',
            'end event',
        ].join('\n'));

        const consumerInput = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event closequery;',
            'CALL super::closequery',
            'IF [[AncestorReturnValue]] = 1 THEN',
            '    RETURN 1',
            'END IF',
            'return 0',
            'end event',
        ].join('\n'));

        const consumerUri = await writeWorkspaceFile(path.join(baseRelativePath, 'w_child.sru'), consumerInput.text);

        try {
            const baseDocument = await vscode.workspace.openTextDocument(baseUri);
            const consumerDocument = await vscode.workspace.openTextDocument(consumerUri);

            index.indexDocument(baseDocument);
            index.indexDocument(consumerDocument);

            const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
            assert.ok(context, 'Expected AncestorReturnValue context');
            assert.strictEqual(context!.isAncestorReturnValue, true);

            const locations = definitionResolver.resolve(
                context!.word,
                consumerDocument.uri,
                context!,
            );

            assert.deepStrictEqual(locations, []);

            const hover = hoverResolver.resolve(
                context!.word,
                consumerDocument.uri,
                context!.range.start,
                context!,
            );

            assert.ok(hover);
            assert.ok(hover.includes('AncestorReturnValue'));
            assert.ok(hover.includes('variable generada'));
            assert.ok(hover.includes('CALL'));

            const references = await referenceResolver.resolveInWorkspace(
                context!.word,
                consumerDocument.uri,
                true,
                context!,
            );

            assert.deepStrictEqual(references, []);
            assert.strictEqual(renameResolver.canRename(context!.word, consumerDocument.uri, context!), false);
        } finally {
            index.removeFile(baseUri);
            index.removeFile(consumerUri);
            await fs.rm(baseUri.fsPath, { force: true });
            await fs.rm(consumerUri.fsPath, { force: true });
        }
    });

    test('DefinitionResolver degrada miembros exclusivos del descendiente en llamada estatica sobre referencia ancestro', async () => {
        const baseRelativePath = path.join('phase6-generated', 'static-dispatch-declared-owner');
        const baseUri = await writeWorkspaceFile(path.join(baseRelativePath, 'n_base.sru'), [
            'global type n_base from nonvisualobject',
            'end type',
            'global n_base n_base',
            '',
            'public function long of_shared ();',
            'return 1',
            'end function',
        ].join('\n'));
        const childUri = await writeWorkspaceFile(path.join(baseRelativePath, 'n_child.sru'), [
            'global type n_child from n_base',
            'end type',
            'global n_child n_child',
            '',
            'public function long of_shared ();',
            'return 2',
            'end function',
            '',
            'public function long of_child_only ();',
            'return 3',
            'end function',
        ].join('\n'));

        const consumerInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'n_base inv_base',
            '',
            'event open;',
            'inv_base = CREATE USING "n_child"',
            'inv_base.[[of_child_only]]()',
            'end event',
        ].join('\n'));

        const consumerUri = await writeWorkspaceFile(path.join(baseRelativePath, 'w_consumer.sru'), consumerInput.text);

        try {
            const baseDocument = await vscode.workspace.openTextDocument(baseUri);
            const childDocument = await vscode.workspace.openTextDocument(childUri);
            const consumerDocument = await vscode.workspace.openTextDocument(consumerUri);

            index.indexDocument(baseDocument);
            index.indexDocument(childDocument);
            index.indexDocument(consumerDocument);

            const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
            assert.ok(context, 'Expected static dispatch context');
            assert.strictEqual(context!.qualifiedOwner, 'inv_base');
            assert.ok(!context!.isDynamicDispatch);

            const locations = definitionResolver.resolve(
                context!.word,
                consumerDocument.uri,
                context!,
            );

            assert.deepStrictEqual(locations, []);

            const hover = hoverResolver.resolve(
                context!.word,
                consumerDocument.uri,
                context!.range.start,
                context!,
            );

            assert.strictEqual(hover, undefined);

            const references = await referenceResolver.resolveInWorkspace(
                context!.word,
                consumerDocument.uri,
                true,
                context!,
            );

            assert.deepStrictEqual(references, []);
            assert.strictEqual(renameResolver.canRename(context!.word, consumerDocument.uri, context!), false);
        } finally {
            index.removeFile(baseUri);
            index.removeFile(childUri);
            index.removeFile(consumerUri);
            await fs.rm(baseUri.fsPath, { force: true });
            await fs.rm(childUri.fsPath, { force: true });
            await fs.rm(consumerUri.fsPath, { force: true });
        }
    });

    test('DefinitionResolver mantiene visible el target del ancestro declarado aunque CREATE USING instancie un descendiente override', async () => {
        const baseRelativePath = path.join('phase6-generated', 'static-dispatch-override');
        const baseUri = await writeWorkspaceFile(path.join(baseRelativePath, 'n_base.sru'), [
            'global type n_base from nonvisualobject',
            'end type',
            'global n_base n_base',
            '',
            'public function long of_shared ();',
            'return 1',
            'end function',
        ].join('\n'));
        const childUri = await writeWorkspaceFile(path.join(baseRelativePath, 'n_child.sru'), [
            'global type n_child from n_base',
            'end type',
            'global n_child n_child',
            '',
            'public function long of_shared ();',
            'return 2',
            'end function',
        ].join('\n'));

        const consumerInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'n_base inv_base',
            '',
            'event open;',
            'inv_base = CREATE USING "n_child"',
            'inv_base.[[of_shared]]()',
            'end event',
        ].join('\n'));

        const consumerUri = await writeWorkspaceFile(path.join(baseRelativePath, 'w_consumer.sru'), consumerInput.text);

        try {
            const baseDocument = await vscode.workspace.openTextDocument(baseUri);
            const childDocument = await vscode.workspace.openTextDocument(childUri);
            const consumerDocument = await vscode.workspace.openTextDocument(consumerUri);

            index.indexDocument(baseDocument);
            index.indexDocument(childDocument);
            index.indexDocument(consumerDocument);

            const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
            assert.ok(context, 'Expected static override context');
            assert.strictEqual(context!.qualifiedOwner, 'inv_base');

            const locations = definitionResolver.resolve(
                context!.word,
                consumerDocument.uri,
                context!,
            );
            const baseTarget = index.findSymbolByName('of_shared').find(symbol =>
                symbol.uri.toString() === baseUri.toString() &&
                symbol.kind === 'function' &&
                !symbol.isPrototype,
            );

            assert.ok(baseTarget, 'Expected ancestor function target');
            assert.ok(locations.some(location =>
                location.uri.toString() === baseUri.toString() &&
                location.range.start.line === baseTarget!.selectionRange.start.line &&
                location.range.start.character === baseTarget!.selectionRange.start.character,
            ), [
                'Expected definition to keep the declared ancestor target.',
                `Expected: ${path.basename(baseUri.fsPath)}:${baseTarget!.selectionRange.start.line}:${baseTarget!.selectionRange.start.character}`,
                `Received: ${locations.map(location => `${path.basename(location.uri.fsPath)}:${location.range.start.line}:${location.range.start.character}`).join(', ') || '(none)'}`,
            ].join(' '));
        } finally {
            index.removeFile(baseUri);
            index.removeFile(childUri);
            index.removeFile(consumerUri);
            await fs.rm(baseUri.fsPath, { force: true });
            await fs.rm(childUri.fsPath, { force: true });
            await fs.rm(consumerUri.fsPath, { force: true });
        }
    });

    test('DefinitionResolver y RenameResolver degradan owners tipados como Any', async () => {
        const baseRelativePath = path.join('phase6-generated', 'any-owner-degradation');
        const serviceUri = await writeWorkspaceFile(path.join(baseRelativePath, 'n_service.sru'), [
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'public function long of_any_only ();',
            'return 1',
            'end function',
        ].join('\n'));

        const consumerInput = extractMarkedText([
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

        const consumerUri = await writeWorkspaceFile(path.join(baseRelativePath, 'w_consumer.sru'), consumerInput.text);

        try {
            const serviceDocument = await vscode.workspace.openTextDocument(serviceUri);
            const consumerDocument = await vscode.workspace.openTextDocument(consumerUri);

            index.indexDocument(serviceDocument);
            index.indexDocument(consumerDocument);

            const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
            assert.ok(context, 'Expected Any owner context');
            assert.strictEqual(context!.qualifiedOwner, 'la_owner');

            const locations = definitionResolver.resolve(
                context!.word,
                consumerDocument.uri,
                context!,
            );

            assert.deepStrictEqual(locations, []);
            assert.strictEqual(renameResolver.canRename(context!.word, consumerDocument.uri, context!), false);
        } finally {
            index.removeFile(serviceUri);
            index.removeFile(consumerUri);
            await fs.rm(serviceUri.fsPath, { force: true });
            await fs.rm(consumerUri.fsPath, { force: true });
        }
    });

    test('DefinitionResolver prioriza global function sobre object function en llamada no calificada', () => {
        const globalFunctionDocument = makeDoc([
            'global function string of_ping ();',
            'return "global"',
            'end function',
        ].join('\n'), 'file:///test/global_of_ping.srf');

        const consumerInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            '',
            'public function string of_ping ();',
            'return "object"',
            'end function',
            '',
            'event open;',
            '[[of_ping]]()',
            'end event',
        ].join('\n'));

        const consumerDocument = makeDoc(consumerInput.text, 'file:///test/object_vs_global_call.sru');
        index.indexDocument(globalFunctionDocument);
        index.indexDocument(consumerDocument);

        const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
        assert.ok(context, 'Expected global-vs-object function context');
        assert.strictEqual(context!.providedArgumentCount, 0);

        const locations = definitionResolver.resolve(
            context!.word,
            consumerDocument.uri,
            context!,
        );

        assert.strictEqual(locations.length, 1);
        assert.strictEqual(locations[0].uri.toString(), globalFunctionDocument.uri.toString());
        assert.strictEqual(locations[0].range.start.line, 0);
    });

    test('DefinitionResolver prioriza global external function y RenameResolver la bloquea por seguridad', () => {
        const externalFunctionDocument = makeDoc(
            'FUNCTION ulong GetSysColor (int ai_index) LIBRARY "USER32.DLL"',
            'file:///test/external_getsyscolor.sru',
        );
        const globalFunctionDocument = makeDoc([
            'global function string GetSysColor (int ai_index);',
            'return "pb"',
            'end function',
        ].join('\n'), 'file:///test/global_getsyscolor.srf');

        const consumerInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            '',
            'event open;',
            '[[GetSysColor]](1)',
            'end event',
        ].join('\n'));

        const consumerDocument = makeDoc(consumerInput.text, 'file:///test/external_preferred_call.sru');
        index.indexDocument(externalFunctionDocument);
        index.indexDocument(globalFunctionDocument);
        index.indexDocument(consumerDocument);

        const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
        assert.ok(context, 'Expected external function context');
        assert.strictEqual(context!.providedArgumentCount, 1);

        const locations = definitionResolver.resolve(
            context!.word,
            consumerDocument.uri,
            context!,
        );

        assert.strictEqual(locations.length, 1);
        assert.strictEqual(locations[0].uri.toString(), externalFunctionDocument.uri.toString());
        assert.strictEqual(locations[0].range.start.line, 0);
        assert.strictEqual(renameResolver.canRename(context!.word, consumerDocument.uri, context!), false);
    });

    test('DefinitionResolver y HoverResolver resuelven externa local posteada con owner explícito', () => {
        const hostDocument = makeDoc([
            'global type u_external_host from nonvisualobject',
            'end type',
            'global u_external_host u_external_host',
            '',
            'public function boolean sndPlaySoundA (string as_name, uint au_flags) LIBRARY "WINMM.DLL" ALIAS FOR "sndPlaySoundA;ansi"',
        ].join('\n'), 'file:///test/u_external_host.sru');

        const consumerInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'u_external_host inv_host',
            '',
            'public function boolean sndPlaySoundA (string as_name, long al_mode);',
            'return false',
            'end function',
            '',
            'event open;',
            'inv_host.POST [[sndPlaySoundA]]("demo", 0)',
            'end event',
        ].join('\n'));

        const consumerDocument = makeDoc(consumerInput.text, 'file:///test/posted_local_external.sru');
        index.indexDocument(hostDocument);
        index.indexDocument(consumerDocument);

        const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
        assert.ok(context, 'Expected posted local external context');
        assert.strictEqual(context!.qualifiedOwner, 'inv_host');
        assert.strictEqual(context!.qualifiedOwnerExpression, 'inv_host');
        assert.ok(!context!.isDynamicDispatch);

        const locations = definitionResolver.resolve(
            context!.word,
            consumerDocument.uri,
            context!,
        );

        assert.strictEqual(locations.length, 1);
        assert.strictEqual(locations[0].uri.toString(), hostDocument.uri.toString());
        assert.strictEqual(locations[0].range.start.line, 4);

        const hover = hoverResolver.resolve(
            context!.word,
            consumerDocument.uri,
            context!.range.start,
            context!,
        );

        assert.ok(hover);
        assert.ok(hover.includes('Función externa'));
        assert.ok(hover.includes('WINMM.DLL'));
        assert.strictEqual(renameResolver.canRename(context!.word, consumerDocument.uri, context!), false);
    });

    test('documentUtils marca DYNAMIC sin owner y degrada global external function', () => {
        const externalFunctionDocument = makeDoc(
            'FUNCTION ulong GetSysColor (int ai_index) LIBRARY "USER32.DLL"',
            'file:///test/dynamic_external_getsyscolor.sru',
        );
        const globalFunctionDocument = makeDoc([
            'global function string GetSysColor (int ai_index);',
            'return "pb"',
            'end function',
        ].join('\n'), 'file:///test/dynamic_global_getsyscolor.srf');

        const consumerInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            '',
            'event open;',
            'DYNAMIC [[GetSysColor]](1)',
            'end event',
        ].join('\n'));

        const consumerDocument = makeDoc(consumerInput.text, 'file:///test/dynamic_external_global_call.sru');
        index.indexDocument(externalFunctionDocument);
        index.indexDocument(globalFunctionDocument);
        index.indexDocument(consumerDocument);

        const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
        assert.ok(context, 'Expected global external dynamic context');
        assert.strictEqual(context!.qualifiedOwner, undefined);
        assert.strictEqual(context!.isDynamicDispatch, true);
        assert.strictEqual(context!.dynamicDispatchKind, 'function');

        const locations = definitionResolver.resolve(
            context!.word,
            consumerDocument.uri,
            context!,
        );

        assert.deepStrictEqual(locations, []);
        assert.strictEqual(
            hoverResolver.resolve(
                context!.word,
                consumerDocument.uri,
                context!.range.start,
                context!,
            ),
            undefined,
        );
        assert.strictEqual(renameResolver.canRename(context!.word, consumerDocument.uri, context!), false);
    });

    test('documentUtils preserva owner en POST DYNAMIC sobre externa local y degrada la navegación fuerte', () => {
        const hostDocument = makeDoc([
            'global type u_external_host from nonvisualobject',
            'end type',
            'global u_external_host u_external_host',
            '',
            'public function boolean sndPlaySoundA (string as_name, uint au_flags) LIBRARY "WINMM.DLL" ALIAS FOR "sndPlaySoundA;ansi"',
        ].join('\n'), 'file:///test/u_external_host_dynamic.sru');

        const consumerInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'u_external_host inv_host',
            '',
            'public function boolean sndPlaySoundA (string as_name, long al_mode);',
            'return false',
            'end function',
            '',
            'event open;',
            'inv_host.POST DYNAMIC [[sndPlaySoundA]]("demo", 0)',
            'end event',
        ].join('\n'));

        const consumerDocument = makeDoc(consumerInput.text, 'file:///test/posted_dynamic_local_external.sru');
        index.indexDocument(hostDocument);
        index.indexDocument(consumerDocument);

        const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
        assert.ok(context, 'Expected posted dynamic local external context');
        assert.strictEqual(context!.qualifiedOwner, 'inv_host');
        assert.strictEqual(context!.qualifiedOwnerExpression, 'inv_host');
        assert.strictEqual(context!.isDynamicDispatch, true);
        assert.strictEqual(context!.dynamicDispatchKind, 'function');

        const locations = definitionResolver.resolve(
            context!.word,
            consumerDocument.uri,
            context!,
        );

        assert.deepStrictEqual(locations, []);
        assert.strictEqual(
            hoverResolver.resolve(
                context!.word,
                consumerDocument.uri,
                context!.range.start,
                context!,
            ),
            undefined,
        );
        assert.strictEqual(renameResolver.canRename(context!.word, consumerDocument.uri, context!), false);
    });

    test('DefinitionResolver y RenameResolver distinguen overloads por aridad en la invocación actual', async () => {
        const callInput = extractMarkedText([
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
            'of_run()',
            '[[of_run]]("demo")',
            'end event',
        ].join('\n'));

        const uri = await writeWorkspaceFile(
            path.join('phase6-generated', 'semantic-overload', 'overload_by_arity.sru'),
            callInput.text,
        );
        const document = await vscode.workspace.openTextDocument(uri);
        index.indexDocument(document);
        const contextDocument = makeDoc(callInput.text, document.uri.toString());

        const context = getSymbolContextAtPosition(contextDocument, callInput.position);
        assert.ok(context, 'Expected overload call context');
        assert.strictEqual(context!.providedArgumentCount, 1);

        const locations = definitionResolver.resolve(
            context!.word,
            document.uri,
            context!,
        );
        const targetSymbol = index.findSymbolByName('of_run').find(symbol =>
            symbol.kind === 'function' &&
            symbol.parameterCount === 1 &&
            !symbol.isPrototype,
        );

        assert.ok(targetSymbol, 'Expected indexed overload target');
        assert.strictEqual(locations.length, 1);
        assert.strictEqual(locations[0].range.start.line, targetSymbol!.selectionRange.start.line);
        assert.strictEqual(locations[0].range.start.character, targetSymbol!.selectionRange.start.character);
        assert.strictEqual(
            renameResolver.canRename(
                context!.word,
                document.uri,
                context!,
            ),
            true,
        );

        const edit = await renameResolver.computeEdits(
            context!.word,
            'of_launch',
            document.uri,
            context!,
        );

        assert.ok(edit, 'Expected overload rename edits');

        const entries = edit!.entries();
        assert.strictEqual(entries.length, 1);
        assert.strictEqual(entries[0][0].toString(), document.uri.toString());
        assert.strictEqual(entries[0][1].length, 2);
        assert.deepStrictEqual(
            entries[0][1]
                .map(textEdit => textEdit.range.start.line)
                .sort((left, right) => left - right),
            [8, 14],
        );
        assert.ok(entries[0][1].every(textEdit => textEdit.newText === 'of_launch'));
    });

    test('DefinitionResolver resuelve this, super y parent con el contexto actual', () => {
        const thisInput = extractMarkedText([
            'global type w_main from window',
            'end type',
            'global w_main w_main',
            'string title',
            '',
            'event open;',
            'this.[[title]] = "demo"',
            'end event',
        ].join('\n'));

        const thisDocument = makeDoc(thisInput.text, 'file:///test/this_scope.sru');
        index.indexDocument(thisDocument);

        const thisContext = getSymbolContextAtPosition(thisDocument, thisInput.position);
        assert.ok(thisContext, 'Expected this-context');

        const thisLocations = definitionResolver.resolve(
            thisContext!.word,
            thisDocument.uri,
            thisContext!,
        );

        const titleSymbol = index.findSymbolByName('title').find(symbol =>
            symbol.declarationScope === 'member',
        );

        assert.ok(titleSymbol, 'Expected indexed member symbol');
        assert.strictEqual(thisLocations.length, 1);
        assert.strictEqual(thisLocations[0].range.start.line, titleSymbol!.selectionRange.start.line);

        index.clear();

        const baseDocument = makeDoc([
            'global type w_base from window',
            'event open;',
            'end event',
            'end type',
        ].join('\n'), 'file:///test/w_base.sru');

        const superInput = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            'call super::[[open]]',
            'end event',
        ].join('\n'));

        const superDocument = makeDoc(superInput.text, 'file:///test/w_child.sru');
        index.indexDocument(baseDocument);
        index.indexDocument(superDocument);

        const superContext = getSymbolContextAtPosition(superDocument, superInput.position);
        assert.ok(superContext, 'Expected super-context');

        const superLocations = definitionResolver.resolve(
            superContext!.word,
            superDocument.uri,
            superContext!,
        );

        assert.strictEqual(superLocations.length, 1);
        assert.strictEqual(superLocations[0].uri.toString(), baseDocument.uri.toString());

        index.clear();

        const parentInput = extractMarkedText([
            'global type m_main from menu',
            'type m_file from menu within m_main',
            'event ue_test;',
            'parent.[[clicked]]()',
            'end event',
            'end type',
            'event clicked;',
            'end event',
            'end type',
        ].join('\n'));

        const parentDocument = makeDoc(parentInput.text, 'file:///test/parent_scope.sru');
        index.indexDocument(parentDocument);

        const parentContext = getSymbolContextAtPosition(parentDocument, parentInput.position);
        assert.ok(parentContext, 'Expected parent-context');

        const parentLocations = definitionResolver.resolve(
            parentContext!.word,
            parentDocument.uri,
            parentContext!,
        );

        assert.strictEqual(parentLocations.length, 1);
        assert.strictEqual(parentLocations[0].range.start.line, 6);
    });

    test('HoverResolver muestra parámetros con etiqueta semántica', () => {
        const input = extractMarkedText([
            'global type w_scope from window',
            'end type',
            'global w_scope w_scope',
            '',
            'public function string of_calc (string as_name);',
            'return [[as_name]]',
            'end function',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/hover_scope.sru');
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected hover context');

        const hover = hoverResolver.resolve(
            context!.word,
            document.uri,
            input.position,
            context!,
        );

        assert.ok(hover);
        assert.ok(hover.includes('(parámetro)'));
        assert.ok(hover.includes('string as_name'));
    });

    test('DefinitionResolver resuelve miembros heredados sin owner explícito', () => {
        const baseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            'string is_title',
        ].join('\n'), 'file:///test/w_base_member.sru');

        const childInput = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            '[[is_title]] = "demo"',
            'end event',
        ].join('\n'));

        const childDocument = makeDoc(childInput.text, 'file:///test/w_child_member.sru');
        index.indexDocument(baseDocument);
        index.indexDocument(childDocument);

        const context = getSymbolContextAtPosition(childDocument, childInput.position);
        assert.ok(context, 'Expected inherited member context');

        const locations = definitionResolver.resolve(
            context!.word,
            childDocument.uri,
            context!,
        );

        assert.strictEqual(locations.length, 1);
        assert.strictEqual(locations[0].uri.toString(), baseDocument.uri.toString());
        assert.strictEqual(locations[0].range.start.line, 3);
    });

    test('DefinitionResolver respeta privatewrite y protectedread en miembros heredados', () => {
        const privateBaseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            'privatewrite string is_secret',
        ].join('\n'), 'file:///test/w_base_private_member.sru');

        const privateChildInput = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            '[[is_secret]] = "demo"',
            'end event',
        ].join('\n'));

        const privateChildDocument = makeDoc(privateChildInput.text, 'file:///test/w_child_private_member.sru');
        index.indexDocument(privateBaseDocument);
        index.indexDocument(privateChildDocument);

        const privateContext = getSymbolContextAtPosition(privateChildDocument, privateChildInput.position);
        assert.ok(privateContext, 'Expected private inherited context');

        const privateLocations = definitionResolver.resolve(
            privateContext!.word,
            privateChildDocument.uri,
            privateContext!,
        );

        assert.deepStrictEqual(privateLocations, []);

        index.clear();

        const protectedBaseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            'protectedread string is_title',
        ].join('\n'), 'file:///test/w_base_protected_member.sru');

        const protectedChildInput = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            '[[is_title]] = "demo"',
            'end event',
        ].join('\n'));

        const protectedChildDocument = makeDoc(protectedChildInput.text, 'file:///test/w_child_protected_member.sru');
        index.indexDocument(protectedBaseDocument);
        index.indexDocument(protectedChildDocument);

        const protectedContext = getSymbolContextAtPosition(protectedChildDocument, protectedChildInput.position);
        assert.ok(protectedContext, 'Expected protected inherited context');

        const protectedLocations = definitionResolver.resolve(
            protectedContext!.word,
            protectedChildDocument.uri,
            protectedContext!,
        );

        assert.strictEqual(protectedLocations.length, 1);
        assert.strictEqual(protectedLocations[0].uri.toString(), protectedBaseDocument.uri.toString());
        assert.strictEqual(protectedLocations[0].range.start.line, 3);
    });

    test('DefinitionResolver resuelve owners tipados por variables miembro', () => {
        const serviceDocument = makeDoc([
            'global type w_service from window',
            'end type',
            'global w_service w_service',
            '',
            'public function string of_run ();',
            'return "ok"',
            'end function',
        ].join('\n'), 'file:///test/w_service.sru');

        const consumerInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'w_service iw_service',
            '',
            'event open;',
            'iw_service.[[of_run]]()',
            'end event',
        ].join('\n'));

        const consumerDocument = makeDoc(consumerInput.text, 'file:///test/w_consumer.sru');
        index.indexDocument(serviceDocument);
        index.indexDocument(consumerDocument);

        const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
        assert.ok(context, 'Expected typed owner context');

        const locations = definitionResolver.resolve(
            context!.word,
            consumerDocument.uri,
            context!,
        );

        assert.strictEqual(locations.length, 1);
        assert.strictEqual(locations[0].uri.toString(), serviceDocument.uri.toString());
        assert.strictEqual(locations[0].range.start.line, 4);
    });

    test('DefinitionResolver no confunde métodos del sistema cualificados con globales ajenos', () => {
        const serviceDocument = makeDoc([
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'public function long Retrieve (long al_id);',
            'return al_id',
            'end function',
        ].join('\n'), 'file:///test/n_service_retrieve.sru');

        const consumerInput = extractMarkedText([
            'forward',
            'global type w_consumer from window',
            'end type',
            'type dw_data from datawindow within w_consumer',
            'end type',
            'end forward',
            '',
            'global type w_consumer from window',
            'dw_data dw_data',
            'end type',
            '',
            'global w_consumer w_consumer',
            '',
            'event open;',
            'dw_data.[[Retrieve]](1)',
            'end event',
            '',
            'type dw_data from datawindow within w_consumer',
            'end type',
        ].join('\n'));

        const consumerDocument = makeDoc(consumerInput.text, 'file:///test/w_consumer_retrieve.srw');
        index.indexDocument(serviceDocument);
        index.indexDocument(consumerDocument);

        const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
        assert.ok(context, 'Expected system method context');

        const locations = definitionResolver.resolve(
            context!.word,
            consumerDocument.uri,
            context!,
        );

        assert.deepStrictEqual(locations, []);
    });

    test('DefinitionResolver resuelve super a través de jerarquía multi-nivel', () => {
        const baseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'event ue_ping;',
            'end event',
        ].join('\n'), 'file:///test/w_super_base.sru');

        const middleDocument = makeDoc([
            'global type w_middle from w_base',
            'end type',
            'global w_middle w_middle',
        ].join('\n'), 'file:///test/w_super_middle.sru');

        const childInput = extractMarkedText([
            'global type w_child from w_middle',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            'call super::[[ue_ping]]()',
            'end event',
        ].join('\n'));

        const childDocument = makeDoc(childInput.text, 'file:///test/w_super_child.sru');
        index.indexDocument(baseDocument);
        index.indexDocument(middleDocument);
        index.indexDocument(childDocument);

        const context = getSymbolContextAtPosition(childDocument, childInput.position);
        assert.ok(context, 'Expected super context');

        const locations = definitionResolver.resolve(
            context!.word,
            childDocument.uri,
            context!,
        );

        assert.strictEqual(locations.length, 1);
        assert.strictEqual(locations[0].uri.toString(), baseDocument.uri.toString());
        assert.strictEqual(locations[0].range.start.line, 4);
    });

    test('ReferenceResolver limita referencias locales al callable actual', async () => {
        const input = extractMarkedText([
            'global type w_scope from window',
            'end type',
            'global w_scope w_scope',
            'string ls_value',
            '',
            'public function string of_first ();',
            'string ls_value',
            'ls_value = "a"',
            'return [[ls_value]]',
            'end function',
            '',
            'public function string of_second ();',
            'string ls_value',
            'ls_value = "b"',
            'return ls_value',
            'end function',
        ].join('\n'));

        const relativePath = path.join('phase3-generated', 'reference_local_scope.sru');
        const uri = await writeWorkspaceFile(relativePath, input.text);

        try {
            const document = await vscode.workspace.openTextDocument(uri);
            index.indexDocument(document);

            const context = getSymbolContextAtPosition(document, input.position);
            assert.ok(context, 'Expected reference context');

            const locations = await referenceResolver.resolveInWorkspace(
                context!.word,
                document.uri,
                true,
                context!,
            );

            const lines = locations.map(location => location.range.start.line).sort((left, right) => left - right);
            assert.deepStrictEqual(lines, [6, 7, 8]);
        } finally {
            index.removeFile(uri);
            await fs.rm(uri.fsPath, { force: true });
        }
    });

    test('ReferenceResolver incluye usos heredados implícitos y excluye símbolos ajenos', async () => {
        const baseRelativePath = path.join('phase3-generated', 'reference_inherited_base.sru');
        const childRelativePath = path.join('phase3-generated', 'reference_inherited_child.sru');
        const otherRelativePath = path.join('phase3-generated', 'reference_inherited_other.sru');

        const baseUri = await writeWorkspaceFile(baseRelativePath, [
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'public function string of_ping ();',
            'return "base"',
            'end function',
        ].join('\n'));

        const childInput = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            '[[of_ping]]()',
            'this.of_ping()',
            'end event',
        ].join('\n'));

        const childUri = await writeWorkspaceFile(childRelativePath, childInput.text);
        const otherUri = await writeWorkspaceFile(otherRelativePath, [
            'global type w_other from window',
            'end type',
            'global w_other w_other',
            '',
            'public function string of_ping ();',
            'return "other"',
            'end function',
            '',
            'event open;',
            'of_ping()',
            'end event',
        ].join('\n'));

        try {
            const baseDocument = await vscode.workspace.openTextDocument(baseUri);
            const childDocument = await vscode.workspace.openTextDocument(childUri);
            const otherDocument = await vscode.workspace.openTextDocument(otherUri);

            index.indexDocument(baseDocument);
            index.indexDocument(childDocument);
            index.indexDocument(otherDocument);

            const context = getSymbolContextAtPosition(childDocument, childInput.position);
            assert.ok(context, 'Expected inherited reference context');

            const locations = await referenceResolver.resolveInWorkspace(
                context!.word,
                childDocument.uri,
                true,
                context!,
            );

            const serializedLocations = locations
                .map(location => `${path.basename(location.uri.fsPath)}:${location.range.start.line}`)
                .sort();

            assert.deepStrictEqual(serializedLocations, [
                'reference_inherited_base.sru:4',
                'reference_inherited_child.sru:5',
                'reference_inherited_child.sru:6',
            ]);
        } finally {
            index.removeFile(baseUri);
            index.removeFile(childUri);
            index.removeFile(otherUri);
            await fs.rm(baseUri.fsPath, { force: true });
            await fs.rm(childUri.fsPath, { force: true });
            await fs.rm(otherUri.fsPath, { force: true });
        }
    });

    test('RenameResolver limita renombrado local al callable actual', async () => {
        const input = extractMarkedText([
            'global type w_scope from window',
            'end type',
            'global w_scope w_scope',
            'string ls_value',
            '',
            'public function string of_first ();',
            'string ls_value',
            'ls_value = "a"',
            'return [[ls_value]]',
            'end function',
            '',
            'public function string of_second ();',
            'string ls_value',
            'ls_value = "b"',
            'return ls_value',
            'end function',
        ].join('\n'));

        const relativePath = path.join('phase3-generated', 'rename_local_scope.sru');
        const uri = await writeWorkspaceFile(relativePath, input.text);

        try {
            const document = await vscode.workspace.openTextDocument(uri);
            index.indexDocument(document);

            const context = getSymbolContextAtPosition(document, input.position);
            assert.ok(context, 'Expected rename context');

            const edit = await renameResolver.computeEdits(
                context!.word,
                'ls_result',
                document.uri,
                context!,
            );

            assert.ok(edit, 'Expected rename edits');

            const entries = edit!.entries();
            assert.strictEqual(entries.length, 1);

            const changedLines = entries[0][1]
                .map(textEdit => textEdit.range.start.line)
                .sort((left, right) => left - right);

            assert.deepStrictEqual(changedLines, [6, 7, 8]);
            assert.ok(entries[0][1].every(textEdit => textEdit.newText === 'ls_result'));
        } finally {
            index.removeFile(uri);
            await fs.rm(uri.fsPath, { force: true });
        }
    });

    test('RenameResolver renombra miembros heredados y excluye familias ajenas', async () => {
        const baseRelativePath = path.join('phase3-generated', 'rename_inherited_base.sru');
        const childRelativePath = path.join('phase3-generated', 'rename_inherited_child.sru');
        const otherRelativePath = path.join('phase3-generated', 'rename_inherited_other.sru');

        const baseUri = await writeWorkspaceFile(baseRelativePath, [
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'public function string of_ping ();',
            'return "base"',
            'end function',
        ].join('\n'));

        const childInput = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            '[[of_ping]]()',
            'this.of_ping()',
            'end event',
        ].join('\n'));

        const childUri = await writeWorkspaceFile(childRelativePath, childInput.text);
        const otherUri = await writeWorkspaceFile(otherRelativePath, [
            'global type w_other from window',
            'end type',
            'global w_other w_other',
            '',
            'public function string of_ping ();',
            'return "other"',
            'end function',
            '',
            'event open;',
            'of_ping()',
            'end event',
        ].join('\n'));

        try {
            const baseDocument = await vscode.workspace.openTextDocument(baseUri);
            const childDocument = await vscode.workspace.openTextDocument(childUri);
            const otherDocument = await vscode.workspace.openTextDocument(otherUri);

            index.indexDocument(baseDocument);
            index.indexDocument(childDocument);
            index.indexDocument(otherDocument);

            const context = getSymbolContextAtPosition(childDocument, childInput.position);
            assert.ok(context, 'Expected inherited rename context');

            const edit = await renameResolver.computeEdits(
                context!.word,
                'of_ping_all',
                childDocument.uri,
                context!,
            );

            assert.ok(edit, 'Expected rename edits for inherited member');

            const serializedEdits = edit!.entries()
                .flatMap(([entryUri, textEdits]) =>
                    textEdits.map(textEdit => `${path.basename(entryUri.fsPath)}:${textEdit.range.start.line}:${textEdit.newText}`),
                )
                .sort();

            assert.deepStrictEqual(serializedEdits, [
                'rename_inherited_base.sru:4:of_ping_all',
                'rename_inherited_child.sru:5:of_ping_all',
                'rename_inherited_child.sru:6:of_ping_all',
            ]);
        } finally {
            index.removeFile(baseUri);
            index.removeFile(childUri);
            index.removeFile(otherUri);
            await fs.rm(baseUri.fsPath, { force: true });
            await fs.rm(childUri.fsPath, { force: true });
            await fs.rm(otherUri.fsPath, { force: true });
        }
    });

    test('RenameResolver bloquea métodos y eventos integrados del sistema con owner tipado', async () => {
        const methodInput = extractMarkedText([
            'forward',
            'global type w_consumer from window',
            'end type',
            'type dw_data from datawindow within w_consumer',
            'end type',
            'end forward',
            '',
            'global type w_consumer from window',
            'dw_data dw_data',
            'end type',
            '',
            'global w_consumer w_consumer',
            '',
            'event open;',
            'dw_data.[[Retrieve]](1)',
            'end event',
            '',
            'type dw_data from datawindow within w_consumer',
            'end type',
        ].join('\n'));

        const eventInput = extractMarkedText([
            'forward',
            'global type w_consumer from window',
            'end type',
            'type dw_data from datawindow within w_consumer',
            'end type',
            'end forward',
            '',
            'global type w_consumer from window',
            'dw_data dw_data',
            'end type',
            '',
            'global w_consumer w_consumer',
            '',
            'event dw_data::[[ItemChanged]];',
            'return 0',
            'end event',
            '',
            'type dw_data from datawindow within w_consumer',
            'end type',
        ].join('\n'));

        const methodDocument = makeDoc(methodInput.text, 'file:///test/w_consumer_rename_method.srw');
        const eventDocument = makeDoc(eventInput.text, 'file:///test/w_consumer_rename_event.srw');
        index.indexDocument(methodDocument);
        index.indexDocument(eventDocument);

        const methodContext = getSymbolContextAtPosition(methodDocument, methodInput.position);
        const eventContext = getSymbolContextAtPosition(eventDocument, eventInput.position);
        assert.ok(methodContext, 'Expected system method rename context');
        assert.ok(eventContext, 'Expected system event rename context');

        assert.strictEqual(
            renameResolver.canRename(
                methodContext!.word,
                methodDocument.uri,
                methodContext!,
            ),
            false,
        );
        assert.strictEqual(
            renameResolver.canRename(
                eventContext!.word,
                eventDocument.uri,
                eventContext!,
            ),
            false,
        );

        const methodEdit = await renameResolver.computeEdits(
            methodContext!.word,
            'uf_retrieve',
            methodDocument.uri,
            methodContext!,
        );
        const eventEdit = await renameResolver.computeEdits(
            eventContext!.word,
            'ue_itemchanged_custom',
            eventDocument.uri,
            eventContext!,
        );

        assert.strictEqual(methodEdit, undefined);
        assert.strictEqual(eventEdit, undefined);
    });
});