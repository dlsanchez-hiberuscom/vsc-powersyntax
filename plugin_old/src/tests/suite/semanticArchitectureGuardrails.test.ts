import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const RESOLUTION_DIR = path.join(REPO_ROOT, 'src', 'powerbuilder', 'resolution');
const SEMANTIC_DIR = path.join(REPO_ROOT, 'src', 'powerbuilder', 'semantic');
const PROVIDER_DIR = path.join(REPO_ROOT, 'src', 'features', 'direct-api-ide');
const EXPECTED_RESOLUTION_FILES = [
    'builtinFunctions.ts',
    'definitionResolver.ts',
    'diagnosticResolver.ts',
    'hoverResolver.ts',
    'referenceResolver.ts',
    'renameResolver.ts',
    'symbolResolution.ts',
].sort();
const FORBIDDEN_RESOLUTION_HELPERS = [
    'resolvePreferredSymbols',
    'rankSemanticCandidates',
    'resolveOwnerResolution',
    'filterSymbolsVisibleFromPosition',
    'getProjectPreferenceScore',
    'getResolvedOwnerNames',
    'resolveOwnerTypeNamesAtPosition',
    'resolveSystemMemberAtPosition',
    'canSearchTextOccurrences',
    'occurrenceMatchesResolvedSymbols',
    'buildSemanticQueryEvidence',
    'buildSemanticQueryReasons',
    'getSemanticQueryPrecision',
];

function toRelativePath(filePath: string): string {
    return path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
}

async function readSourceFile(relativePath: string): Promise<string> {
    return fs.readFile(path.join(REPO_ROOT, relativePath), 'utf8');
}

async function collectTsFiles(dirPath: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            files.push(...await collectTsFiles(entryPath));
            continue;
        }

        if (entry.isFile() && entry.name.endsWith('.ts')) {
            files.push(toRelativePath(entryPath));
        }
    }

    return files.sort();
}

suite('Semantic architecture guardrails', () => {
    test('resolution queda congelado como adaptacion fina y compatibilidad temporal', async () => {
        const resolutionFiles = (await fs.readdir(RESOLUTION_DIR))
            .filter(fileName => fileName.endsWith('.ts'))
            .sort();

        assert.deepStrictEqual(resolutionFiles, EXPECTED_RESOLUTION_FILES);

        const compatibilityWrapper = await readSourceFile('src/powerbuilder/resolution/symbolResolution.ts');

        assert.match(
            compatibilityWrapper,
            /semantic\/ranking\/symbolResolutionCore/,
        );

        const forbiddenHelperPattern = new RegExp(
            `\\b(?:${FORBIDDEN_RESOLUTION_HELPERS.join('|')})\\b`,
        );

        for (const fileName of resolutionFiles.filter(file => file !== 'symbolResolution.ts')) {
            const relativePath = `src/powerbuilder/resolution/${fileName}`;
            const source = await readSourceFile(relativePath);

            assert.doesNotMatch(
                source,
                /from ['"][^'"]*semantic\/(binding|owners|ranking|visibility|occurrences|semanticOccurrences|inheritanceGraph|queries\/queryContext|queries\/queryPrecision|hover\/presentation)/,
                `${relativePath} no debe volver a depender de modulos internos de semantic.`,
            );
            assert.doesNotMatch(
                source,
                forbiddenHelperPattern,
                `${relativePath} no debe reintroducir logica semantica reusable.`,
            );
        }
    });

    test('semantic no puede depender de resolution', async () => {
        const semanticFiles = await collectTsFiles(SEMANTIC_DIR);

        for (const relativePath of semanticFiles) {
            const source = await readSourceFile(relativePath);

            assert.doesNotMatch(
                source,
                /from ['"][^'"]*\/resolution(?:\/|['"])/,
                `${relativePath} no debe importar nada desde resolution/.`,
            );
        }
    });

    test('providers y resolvers finos solo consumen la superficie publica de semantic', async () => {
        const providerFiles = await collectTsFiles(PROVIDER_DIR);
        const resolverFiles = (await collectTsFiles(RESOLUTION_DIR))
            .filter(relativePath => !relativePath.endsWith('symbolResolution.ts'));

        for (const relativePath of [...providerFiles, ...resolverFiles]) {
            const source = await readSourceFile(relativePath);

            assert.doesNotMatch(
                source,
                /from ['"][^'"]*semantic\/(binding|owners|ranking|visibility|occurrences|semanticOccurrences|inheritanceGraph|queries\/queryContext|queries\/queryPrecision|hover\/presentation)/,
                `${relativePath} no debe consumir modulos internos de semantic fuera de su superficie publica.`,
            );
        }
    });

    test('symbolResolutionCore queda reducido a fachada temporal de compatibilidad', async () => {
        const srcFiles = (await collectTsFiles(path.join(REPO_ROOT, 'src')))
            .filter(relativePath => !relativePath.startsWith('src/tests/'))
            .filter(relativePath => relativePath !== 'src/powerbuilder/semantic/ranking/symbolResolutionCore.ts');
        const mentions: string[] = [];

        for (const relativePath of srcFiles) {
            const source = await readSourceFile(relativePath);

            if (source.includes('symbolResolutionCore')) {
                mentions.push(relativePath);
            }
        }

        assert.deepStrictEqual(
            mentions,
            ['src/powerbuilder/resolution/symbolResolution.ts'],
        );
    });
});