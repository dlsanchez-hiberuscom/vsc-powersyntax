import { TextDocument } from 'vscode-languageserver-textdocument';
import { analyzeDocument } from '../src/server/analysis/documentAnalysis';
import * as fs from 'fs';

const content = fs.readFileSync('test/fixtures/scopes_test.sru', 'utf8');
const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, content);
const analysis = analyzeDocument(doc);

function printScope(scope: any, indent: string = '') {
    console.log(`${indent}Scope: ${scope.id} (${scope.kind}) [Lines ${scope.startLine}-${scope.endLine}]`);
    for (const sym of scope.symbols) {
        console.log(`${indent}  Symbol: ${sym.name} (${sym.datatype})`);
    }
    for (const child of scope.children) {
        printScope(child, indent + '  ');
    }
}

printScope(analysis.scopes[0]);
