import { createIsolatedLaunchArgs } from './testHostProfile';
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        const extensionTestsPath = path.resolve(__dirname, './benchmarks/index');
        const configuredWorkspace = process.env.ALMUNIA_TEST_WORKSPACE?.trim();
        const testWorkspace = configuredWorkspace
            ? path.resolve(configuredWorkspace)
            : path.resolve(__dirname, '../../test-workspace');
        const launchArgs = await createIsolatedLaunchArgs('benchmarks', testWorkspace);

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs,
        });
    } catch (err) {
        console.error('Failed to run benchmarks:', err);
        process.exit(1);
    }
}

main();