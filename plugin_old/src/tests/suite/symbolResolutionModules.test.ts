import * as assert from 'assert';
import * as vscode from 'vscode';
import { getSymbolContextAtPosition } from '../../powerbuilder/document/documentUtils';
import { buildPowerScriptDocumentModel } from '../../powerbuilder/document/powerScriptDocumentModel';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { PbSymbol } from '../../powerbuilder/models/pbSymbol';
import {
    getOwnerTypingAssessmentAtPosition,
    resolveOwnerResolution,
} from '../../powerbuilder/semantic/owners/ownerResolution';
import {
    canSearchTextOccurrences,
    occurrenceMatchesResolvedSymbols,
} from '../../powerbuilder/semantic/occurrences/occurrenceMatching';
import {
    rankSemanticCandidates,
    resolvePreferredSymbols,
} from '../../powerbuilder/semantic/ranking/candidateRanking';
import { resolveProjectPreference } from '../../powerbuilder/semantic/ranking/projectPreference';
import { getInheritanceGraph } from '../../powerbuilder/semantic/inheritanceGraph';
import { toSemanticOwnerContext } from '../../powerbuilder/semantic/semanticContext';
import { getSymbolVisibility } from '../../powerbuilder/semantic/visibility/symbolVisibility';
import { renderInheritanceHierarchyMarkdown } from '../../powerbuilder/hierarchy/inheritanceHierarchyService';
import { PbLibraryGraph } from '../../powerbuilder/workspace/pbLibraryGraph';
import { PbProjectDefinition } from '../../powerbuilder/workspace/pbProjectModel';

function makeDoc(text: string, uriPath: string): vscode.TextDocument {
    const lines = text.split(/\r?\n/);

    return {
        uri: vscode.Uri.parse(uriPath),
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length,
        languageId: 'powerbuilder',
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

function getPositionAfterText(document: vscode.TextDocument, text: string): vscode.Position {
    const offset = document.getText().indexOf(text);
    assert.ok(offset >= 0, `Expected text ${text} in document`);
    return document.positionAt(offset + text.length);
}

function makeProjectDefinition(name: string, projectRoot: string): PbProjectDefinition {
    return {
        uri: vscode.Uri.parse(`${projectRoot}/${name}.pbproj`),
        name,
        projectDirectoryUri: vscode.Uri.parse(projectRoot),
        libraries: [],
        libraryUris: [],
    };
}

function makeSymbol(name: string, uriPath: string): PbSymbol {
    return {
        name,
        kind: 'function',
        uri: vscode.Uri.parse(uriPath),
        range: new vscode.Range(0, 0, 0, name.length),
        selectionRange: new vscode.Range(0, 0, 0, name.length),
        signature: `${name}()`,
    };
}

suite('SymbolResolutionModules', () => {
    let index: SymbolIndex;

    setup(() => {
        index = SymbolIndex.getInstance();
        index.clear();
    });

    test('ownerResolution resuelve owner tipado explícito', () => {
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
        const document = makeDoc(input.text, 'file:///test/modules-owner-resolution.srw');

        buildPowerScriptDocumentModel(document);
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected owner-aware context');

        const result = resolveOwnerResolution(
            toSemanticOwnerContext(context!),
            index,
            document.uri,
            context!.range.start,
        );

        assert.strictEqual(result.hasExplicitOwner, true);
        assert.deepStrictEqual(result.resolvedOwnerTypeNames, ['singlelineedit']);
        assert.ok(result.resolvedOwnerNames.includes('singlelineedit'));

        const typing = getOwnerTypingAssessmentAtPosition(
            toSemanticOwnerContext(context!),
            index,
            document.uri,
            context!.range.start,
        );

        assert.strictEqual(typing?.precision, 'exact');
        assert.strictEqual(typing?.kind, 'explicit-typed-owner');
    });

    test('ownerResolution degrada a compatible cuando this hereda el target resuelto', () => {
        const baseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'public function long of_base ();',
            'return 1',
            'end function',
        ].join('\n'), 'file:///test/modules-owner-typing-base.srw');
        const input = extractMarkedText([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            'this.[[of_base]]()',
            'end event',
        ].join('\n'));
        const document = makeDoc(input.text, 'file:///test/modules-owner-typing-child.srw');

        buildPowerScriptDocumentModel(baseDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(baseDocument);
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected inherited owner typing context');

        const primarySymbol = index.findSymbolByName('of_base')[0];
        const typing = getOwnerTypingAssessmentAtPosition(
            toSemanticOwnerContext(context!),
            index,
            document.uri,
            context!.range.start,
            primarySymbol,
        );

        assert.strictEqual(typing?.precision, 'compatible');
        assert.strictEqual(typing?.kind, 'inherited-owner-match');
        assert.deepStrictEqual(typing?.seedTypeNames, ['w_child']);
        assert.ok(typing?.resolvedTypeNames.includes('w_base'));
    });

    test('ownerResolution bloquea owner explícito tipado como Any', () => {
        const serviceDocument = makeDoc([
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'public function long of_any_only ();',
            'return 1',
            'end function',
        ].join('\n'), 'file:///test/modules-owner-typing-any-service.sru');
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
        const document = makeDoc(input.text, 'file:///test/modules-owner-typing-any-consumer.srw');

        buildPowerScriptDocumentModel(serviceDocument);
        buildPowerScriptDocumentModel(document);
        index.indexDocument(serviceDocument);
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected Any owner typing context');

        const result = resolveOwnerResolution(
            toSemanticOwnerContext(context!),
            index,
            document.uri,
            context!.range.start,
        );
        const typing = getOwnerTypingAssessmentAtPosition(
            toSemanticOwnerContext(context!),
            index,
            document.uri,
            context!.range.start,
        );

        assert.deepStrictEqual(result.resolvedOwnerTypeNames, []);
        assert.strictEqual(typing?.precision, 'blocked');
        assert.strictEqual(typing?.kind, 'blocked-any-owner');
        assert.strictEqual(typing?.reasons[0]?.code, 'any-owner');
    });

    test('inheritanceGraph expone solo la descendencia inmediata indexada del tipo pedido', () => {
        index.indexDocument(makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
        ].join('\n'), 'file:///test/modules-hierarchy-base.srw'));
        index.indexDocument(makeDoc([
            'global type w_child_a from w_base',
            'end type',
            'global w_child_a w_child_a',
        ].join('\n'), 'file:///test/modules-hierarchy-child-a.srw'));
        index.indexDocument(makeDoc([
            'global type w_child_b from w_base',
            'end type',
            'global w_child_b w_child_b',
        ].join('\n'), 'file:///test/modules-hierarchy-child-b.srw'));
        index.indexDocument(makeDoc([
            'global type w_grandchild from w_child_a',
            'end type',
            'global w_grandchild w_grandchild',
        ].join('\n'), 'file:///test/modules-hierarchy-grandchild.srw'));

        const derivedTypes = getInheritanceGraph(index).getDirectDerivedTypes('w_base');

        assert.deepStrictEqual(
            derivedTypes.map(symbol => symbol.name),
            ['w_child_a', 'w_child_b'],
        );
    });

    test('renderInheritanceHierarchyMarkdown distingue navegación exacta, contextual y solo indexada sin inventar targets', () => {
        const markdown = renderInheritanceHierarchyMarkdown({
            scope: 'symbol',
            requestedWord: 'of_base',
            documentPath: 'alpha/app_alpha.pbl/w_child.sru',
            precision: 'exact',
            summary: 'Resumen de prueba',
            currentObject: {
                name: 'w_child',
                kind: 'type',
                linkTarget: 'file:///test/w_child.sru#L1,1',
            },
            currentObjectName: 'w_child',
            currentObjectHierarchy: ['w_child', 'w_base', 'window'],
            currentObjectHierarchyTypes: [
                {
                    name: 'w_child',
                    kind: 'type',
                    linkTarget: 'file:///test/w_child.sru#L1,1',
                },
                {
                    name: 'w_base',
                    kind: 'type',
                    linkTarget: 'file:///test/w_base.sru#L1,1',
                },
                {
                    name: 'window',
                    kind: 'type',
                },
            ],
            focusSource: 'symbol-owner',
            focusType: {
                name: 'w_base',
                kind: 'type',
                linkTarget: 'file:///test/w_base.sru#L1,1',
            },
            directAncestor: {
                name: 'window',
                kind: 'type',
            },
            focusHierarchy: ['w_base', 'window'],
            focusHierarchyTypes: [
                {
                    name: 'w_base',
                    kind: 'type',
                    linkTarget: 'file:///test/w_base.sru#L1,1',
                },
                {
                    name: 'window',
                    kind: 'type',
                },
            ],
            relationship: 'w_child depende de w_base',
            directDescendants: [
                {
                    name: 'w_sibling',
                    kind: 'type',
                    baseTypeName: 'w_base',
                    sourcePath: 'alpha/app_alpha.pbl/w_sibling.sru',
                    projectName: 'alpha',
                    linkTarget: 'file:///test/w_sibling.sru#L1,1',
                },
            ],
            reasons: [],
            evidence: [],
        });

        assert.ok(markdown.includes('### Lectura de las acciones'));
        assert.ok(markdown.includes('- Tipo actual: [w_child](file:///test/w_child.sru#L1,1)'));
        assert.ok(markdown.includes('- Tipo enfocado: [w_base](file:///test/w_base.sru#L1,1) · exacto sobre el símbolo primario'));
        assert.ok(markdown.includes('- Ancestro directo: `window` · sin target indexado seguro'));
        assert.ok(markdown.includes('| [w_sibling](file:///test/w_sibling.sru#L1,1) | solo indexado | w_base | alpha/app_alpha.pbl/w_sibling.sru | alpha |'));
        assert.ok(!markdown.includes('[window]('));
    });

    test('candidateRanking prioriza el owner shared tipado', () => {
        const sharedServiceDocument = makeDoc([
            'global type n_shared_service from nonvisualobject',
            'end type',
            'global n_shared_service n_shared_service',
            '',
            'public function string of_run ();',
            'return "shared"',
            'end function',
        ].join('\n'), 'file:///test/modules-shared-service.sru');
        const otherServiceDocument = makeDoc([
            'global type n_other_service from nonvisualobject',
            'end type',
            'global n_other_service n_other_service',
            '',
            'public function string of_run ();',
            'return "other"',
            'end function',
        ].join('\n'), 'file:///test/modules-other-service.sru');
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
        const consumerDocument = makeDoc(consumerInput.text, 'file:///test/modules-ranking-consumer.sru');

        index.indexDocument(sharedServiceDocument);
        index.indexDocument(otherServiceDocument);
        index.indexDocument(consumerDocument);

        const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
        assert.ok(context, 'Expected typed owner context');

        const ranking = rankSemanticCandidates({
            index,
            libraryGraph: PbLibraryGraph.getInstance(),
            word: context!.word,
            uri: consumerDocument.uri,
            symbolContext: context!,
        });

        assert.strictEqual(ranking.candidates[0]?.symbol.uri.toString(), sharedServiceDocument.uri.toString());
        assert.ok(ranking.candidates[0]?.evidence.some(evidence => evidence.kind === 'owner-match'));
    });

    test('symbolVisibility distingue private heredado de protected heredado', () => {
        const baseDocument = makeDoc([
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            'privatewrite string is_hidden',
            'protectedread string is_title',
        ].join('\n'), 'file:///test/modules-visibility-base.sru');
        const childDocument = makeDoc([
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'event open;',
            'is_',
            'end event',
        ].join('\n'), 'file:///test/modules-visibility-child.sru');

        index.indexDocument(baseDocument);
        index.indexDocument(childDocument);

        const hiddenSymbol = index.findSymbolByName('is_hidden')[0];
        const titleSymbol = index.findSymbolByName('is_title')[0];
        const position = getPositionAfterText(childDocument, 'is_');

        const hiddenVisibility = getSymbolVisibility(hiddenSymbol, index, childDocument.uri, position);
        const titleVisibility = getSymbolVisibility(titleSymbol, index, childDocument.uri, position);

        assert.strictEqual(hiddenVisibility.visibility, 'hidden-private');
        assert.strictEqual(hiddenVisibility.isVisible, false);
        assert.strictEqual(titleVisibility.visibility, 'visible');
        assert.strictEqual(titleVisibility.isVisible, true);
    });

    test('projectPreference filtra al proyecto preferido', () => {
        const project = makeProjectDefinition('app', 'file:///workspace/preferred');
        const preferredSymbol = makeSymbol('of_run', 'file:///workspace/preferred/n_service.sru');
        const fallbackSymbol = makeSymbol('of_run', 'file:///workspace/other/n_service.sru');
        const libraryGraph = {
            getPreferredProjectForSourceFile: () => project,
            isSourceFileInProject: (uri: vscode.Uri) => uri.path.includes('/preferred/'),
            getProjectMatchScoreForSourceFile: (uri: vscode.Uri) => uri.path.includes('/preferred/') ? 100 : 0,
        } as unknown as PbLibraryGraph;

        const result = resolveProjectPreference(
            [fallbackSymbol, preferredSymbol],
            libraryGraph,
            vscode.Uri.parse('file:///workspace/preferred/w_consumer.sru'),
        );

        assert.strictEqual(result.currentProject?.name, 'app');
        assert.strictEqual(result.preferredSymbols.length, 1);
        assert.strictEqual(result.preferredSymbols[0].uri.toString(), preferredSymbol.uri.toString());
    });

    test('occurrenceMatching respeta el owner resuelto y mantiene viable la búsqueda textual', () => {
        const sharedServiceDocument = makeDoc([
            'global type n_shared_service from nonvisualobject',
            'end type',
            'global n_shared_service n_shared_service',
            '',
            'public function string of_run ();',
            'return "shared"',
            'end function',
        ].join('\n'), 'file:///test/modules-occurrence-service.sru');
        const consumerInput = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            'shared n_shared_service inv_service',
            '',
            'event open;',
            'inv_service.[[of_run]]()',
            'end event',
        ].join('\n'));
        const consumerDocument = makeDoc(consumerInput.text, 'file:///test/modules-occurrence-consumer.sru');

        index.indexDocument(sharedServiceDocument);
        index.indexDocument(consumerDocument);

        const context = getSymbolContextAtPosition(consumerDocument, consumerInput.position);
        assert.ok(context, 'Expected occurrence matching context');

        const resolvedSymbols = resolvePreferredSymbols({
            index,
            libraryGraph: PbLibraryGraph.getInstance(),
            word: context!.word,
            uri: consumerDocument.uri,
            symbolContext: context!,
        });
        const text = consumerDocument.getText();
        const startOffset = text.indexOf('of_run');

        assert.strictEqual(
            canSearchTextOccurrences(resolvedSymbols, toSemanticOwnerContext(context!)),
            true,
        );
        assert.strictEqual(
            occurrenceMatchesResolvedSymbols({
                text,
                startOffset,
                matchLength: 'of_run'.length,
                fileUri: consumerDocument.uri,
                requestUri: consumerDocument.uri,
                index,
                resolvedSymbols,
                context: toSemanticOwnerContext(context!),
            }),
            true,
        );
    });
});