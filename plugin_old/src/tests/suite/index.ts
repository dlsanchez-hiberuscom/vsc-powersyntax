import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

const TEST_FILE_PRIORITY = new Map<string, number>([
    ['uiFeatureIntegration.test.js', 10],
    ['semanticScopeResolution.test.js', 20],
    ['providerIntegration.test.js', 30],
]);

function parseFileFilter(value: string | undefined): Set<string> {
    return new Set(
        (value ?? '')
            .split(',')
            .map(entry => entry.trim())
            .filter(Boolean),
    );
}

function isTruthyEnv(value: string | undefined): boolean {
    return value === '1' || value?.toLowerCase() === 'true';
}

export async function run(): Promise<void> {
    const grep = process.env.MOCHA_GREP?.trim();
    const invertGrep = isTruthyEnv(process.env.MOCHA_GREP_INVERT);
    const includeFiles = parseFileFilter(process.env.MOCHA_TEST_FILES_INCLUDE);
    const excludeFiles = parseFileFilter(process.env.MOCHA_TEST_FILES_EXCLUDE);
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 10000,
        grep: grep ? new RegExp(grep, 'i') : undefined,
        invert: invertGrep,
    });
    const testsRoot = path.resolve(__dirname);

    const files = await glob('**/*.test.js', { cwd: testsRoot });
    const orderedFiles = [...files]
        .filter(file => {
            const baseName = path.basename(file);

            if (includeFiles.size > 0 && !includeFiles.has(baseName)) {
                return false;
            }

            return !excludeFiles.has(baseName);
        })
        .sort((left, right) => {
        const leftPriority = TEST_FILE_PRIORITY.get(path.basename(left)) ?? Number.MAX_SAFE_INTEGER;
        const rightPriority = TEST_FILE_PRIORITY.get(path.basename(right)) ?? Number.MAX_SAFE_INTEGER;

        if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority;
        }

            return left.localeCompare(right);
        });

    for (const f of orderedFiles) {
        mocha.addFile(path.resolve(testsRoot, f));
    }

    return new Promise<void>((resolve, reject) => {
        mocha.run((failures: number) => {
            if (failures > 0) {
                reject(new Error(`${failures} test(s) failed.`));
            } else {
                resolve();
            }
        });
    });
}
