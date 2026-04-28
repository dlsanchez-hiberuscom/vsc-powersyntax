import * as assert from 'assert';
import * as vscode from 'vscode';
import { PB_LANGUAGE_ID } from '../../core/config/constants';
import {
    getAllPowerBuilderFileGlob,
    getIdeSafePowerBuilderFileGlob,
    isDataWindowUri,
    isIdeSafePowerBuilderDocument,
    isIdeSafePowerBuilderUri,
} from '../../core/utils/powerBuilderFileUtils';

function makeDocument(
    filePath: string,
    languageId = PB_LANGUAGE_ID,
): vscode.TextDocument {
    return {
        uri: vscode.Uri.file(filePath),
        languageId,
    } as vscode.TextDocument;
}

suite('PowerBuilderFileUtils', () => {
    test('detecta URIs de DataWindow', () => {
        assert.strictEqual(
            isDataWindowUri(vscode.Uri.file('/workspace/d_demo.srd')),
            true,
        );
    });

    test('considera .sru seguro para IDE aunque DataWindow experimental esté desactivado', () => {
        assert.strictEqual(
            isIdeSafePowerBuilderUri(vscode.Uri.file('/workspace/u_main.sru'), false),
            true,
        );
    });

    test('considera .srd no seguro para IDE cuando DataWindow experimental está desactivado', () => {
        assert.strictEqual(
            isIdeSafePowerBuilderUri(vscode.Uri.file('/workspace/d_demo.srd'), false),
            false,
        );
    });

    test('considera .srd seguro para IDE cuando DataWindow experimental está activado', () => {
        assert.strictEqual(
            isIdeSafePowerBuilderUri(vscode.Uri.file('/workspace/d_demo.srd'), true),
            true,
        );
    });

    test('el glob IDE-safe excluye srd cuando DataWindow experimental está desactivado', () => {
        const glob = getIdeSafePowerBuilderFileGlob(false);

        assert.ok(glob.includes('sru'));
        assert.ok(!glob.includes('srd'));
    });

    test('el glob completo incluye srd', () => {
        assert.ok(getAllPowerBuilderFileGlob().includes('srd'));
    });

    test('el documento IDE-safe exige languageId powerbuilder', () => {
        assert.strictEqual(
            isIdeSafePowerBuilderDocument(
                makeDocument('/workspace/u_main.sru', 'plaintext'),
                false,
            ),
            false,
        );
    });
});