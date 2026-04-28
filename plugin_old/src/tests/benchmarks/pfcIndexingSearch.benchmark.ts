import * as assert from 'assert';
import { performance } from 'perf_hooks';
import * as vscode from 'vscode';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { PbLibraryGraph } from '../../powerbuilder/projecting/pbLibraryGraph';
import { M_RTEFRAME_FIXTURE } from '../fixtures/pfc2025/m_rteframe.fixture';
import { N_TR_FIXTURE } from '../fixtures/pfc2025/n_tr.fixture';
import { W_MASTER_FIXTURE } from '../fixtures/pfc2025/w_master.fixture';

interface BenchmarkDocument {
    uri: vscode.Uri;
    text: string;
}

interface QueryBenchmark {
    query: string;
    durationMs: number;
    resultCount: number;
}

function replaceWholeWord(text: string, source: string, target: string): string {
    return text.replace(new RegExp(`\\b${source}\\b`, 'g'), target);
}

function buildSyntheticPfcCorpus(copiesPerFixture: number): BenchmarkDocument[] {
    const documents: BenchmarkDocument[] = [];

    for (let index = 1; index <= copiesPerFixture; index++) {
        const suffix = index.toString().padStart(3, '0');

        documents.push({
            uri: vscode.Uri.file(`/benchmark/pfc/examples/exmmain.pbl/w_master_${suffix}.srw`),
            text: replaceWholeWord(W_MASTER_FIXTURE, 'w_master', `w_master_${suffix}`),
        });

        documents.push({
            uri: vscode.Uri.file(`/benchmark/pfc/examples/exmutil.pbl/n_tr_${suffix}.sru`),
            text: replaceWholeWord(N_TR_FIXTURE, 'n_tr', `n_tr_${suffix}`),
        });

        documents.push({
            uri: vscode.Uri.file(`/benchmark/pfc/examples/exmutil.pbl/m_rteframe_${suffix}.srm`),
            text: replaceWholeWord(M_RTEFRAME_FIXTURE, 'm_rteframe', `m_rteframe_${suffix}`),
        });
    }

    return documents;
}

function benchmarkQueries(index: SymbolIndex, queries: string[]): QueryBenchmark[] {
    return queries.map(query => {
        const start = performance.now();
        const results = index.searchSymbols(query);
        const durationMs = performance.now() - start;

        assert.ok(results.length > 0, `Expected benchmark results for query ${query}`);

        return {
            query,
            durationMs,
            resultCount: results.length,
        };
    });
}

suite('PFC indexing and search benchmarks', () => {
    setup(() => {
        SymbolIndex.getInstance().clear();
        PbLibraryGraph.getInstance().clear();
    });

    test('mide indexado y búsqueda sobre un corpus sintético inspirado en PFC 2025', async function () {
        this.timeout(60000);

        const index = SymbolIndex.getInstance();
        const corpus = buildSyntheticPfcCorpus(40);
        const corpusBytes = corpus.reduce((sum, document) => sum + Buffer.byteLength(document.text, 'utf8'), 0);
        const corpusUris = new Set(corpus.map(document => document.uri.toString()));

        const indexingStart = performance.now();
        index.beginBatchUpdate();

        try {
            for (const document of corpus) {
                index.indexFromUri(document.uri, document.text);
            }
        } finally {
            index.endBatchUpdate();
        }

        const indexingMs = performance.now() - indexingStart;
        const searchBenchmarks = benchmarkQueries(index, [
            'of_begin',
            'of_getexampletitle',
            'm_rteframe',
            'clicked',
        ]);

        const workspaceSymbolStart = performance.now();
        const workspaceSymbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
            'vscode.executeWorkspaceSymbolProvider',
            'of_begin',
        );
        const workspaceSymbolMs = performance.now() - workspaceSymbolStart;

        assert.ok(workspaceSymbols);
        assert.ok(workspaceSymbols!.length > 0);

        const indexedCorpusFileCount = corpus.filter(document =>
            index.getSymbolsForFile(document.uri).length > 0,
        ).length;
        const indexedCorpusSymbolCount = index.getAllSymbols().filter(symbol =>
            corpusUris.has(symbol.uri.toString()),
        ).length;

        assert.strictEqual(indexedCorpusFileCount, corpus.length);
        assert.ok(indexedCorpusSymbolCount > corpus.length);

        const searchSummary = searchBenchmarks
            .map(result => `${result.query}=${result.durationMs.toFixed(2)}ms/${result.resultCount}`)
            .join(', ');

        console.log(
            `[PFC benchmark] files=${indexedCorpusFileCount} bytes=${corpusBytes} symbols=${indexedCorpusSymbolCount} indexing=${indexingMs.toFixed(2)}ms workspaceSymbols=${workspaceSymbolMs.toFixed(2)}ms/${workspaceSymbols!.length} searches=[${searchSummary}]`,
        );
    });
});