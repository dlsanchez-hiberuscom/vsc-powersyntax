import { createIsolatedLaunchArgs } from './testHostProfile';
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        const extensionTestsPath = path.resolve(__dirname, './suite/index');
            const configuredWorkspace = process.env.ALMUNIA_TEST_WORKSPACE?.trim();
            const testWorkspace = configuredWorkspace
                ? path.resolve(configuredWorkspace)
                : path.resolve(__dirname, '../../test-workspace');

            // DEBUG: log resolved test workspace for troubleshooting environment propagation
            console.log('Resolved test workspace for runTests:', testWorkspace);

            const launchArgs = await createIsolatedLaunchArgs('suite', testWorkspace);

        const extensionTestsEnv = {
            ALMUNIA_TEST_WORKSPACE: testWorkspace,
            MOCHA_TEST_FILES_INCLUDE: process.env.MOCHA_TEST_FILES_INCLUDE ?? '',
            MOCHA_TEST_FILES_EXCLUDE: process.env.MOCHA_TEST_FILES_EXCLUDE ?? '',
            MOCHA_GREP: process.env.MOCHA_GREP ?? '',
            MOCHA_GREP_INVERT: process.env.MOCHA_GREP_INVERT ?? '',
        };

        console.log('Launching test host with env:', extensionTestsEnv);

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs,
            extensionTestsEnv,
        });
    } catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}

main();
