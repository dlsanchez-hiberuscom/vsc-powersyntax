const fs = require('node:fs/promises');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const DEFAULT_RELEASE_REPORT_RELATIVE_PATH = path.join(
    'docs',
    'generated',
    'powerbuilder',
    'exports',
    'release',
    'release-validation-report.json',
);

function createReleaseEnv() {
    const env = { ...process.env };

    delete env.MOCHA_GREP;
    delete env.MOCHA_GREP_INVERT;
    delete env.MOCHA_TEST_FILES_INCLUDE;
    delete env.MOCHA_TEST_FILES_EXCLUDE;

    return env;
}

function withEnv(baseEnv, overrides) {
    return {
        ...baseEnv,
        ...overrides,
    };
}

function parseArgs(argv) {
    const args = [...argv];
    let runBenchmark = false;
    let dryRun = false;
    let reportFile;

    for (let index = 0; index < args.length; index++) {
        const value = args[index];

        if (value === '--benchmark') {
            runBenchmark = true;
            continue;
        }

        if (value === '--dry-run') {
            dryRun = true;
            continue;
        }

        if (value === '--report-file' && typeof args[index + 1] === 'string') {
            reportFile = args[index + 1];
            index += 1;
        }
    }

    return {
        runBenchmark,
        dryRun,
        reportFile: reportFile ?? DEFAULT_RELEASE_REPORT_RELATIVE_PATH,
    };
}

function createReleaseValidationPlan(runBenchmark) {
    const isolatedSuites = [
        'uiFeatureIntegration.test.js',
        'semanticScopeResolution.test.js',
    ];
    const providerSuite = 'providerIntegration.test.js';
    const providerSensitivePattern = [
        'CompletionItemProvider degrada a lista vacía cuando el target DataWindow sigue ambiguo',
        'RenameProvider limita el renombrado al proyecto preferido vía VS Code API',
    ].join('|');
    const steps = [
        {
            label: 'compile',
            command: 'npm',
            args: ['run', 'compile'],
        },
        {
            label: 'test:shared-host',
            command: 'npm',
            args: ['test'],
            retryOnFailure: true,
            envOverrides: {
                MOCHA_TEST_FILES_EXCLUDE: [...isolatedSuites, providerSuite].join(','),
            },
        },
        ...isolatedSuites.map(suiteFile => ({
            label: `test:isolation:${suiteFile}`,
            command: 'npm',
            args: ['test'],
            retryOnFailure: true,
            envOverrides: {
                MOCHA_TEST_FILES_INCLUDE: suiteFile,
            },
        })),
        {
            label: 'test:provider-bulk',
            command: 'npm',
            args: ['test'],
            retryOnFailure: true,
            envOverrides: {
                MOCHA_TEST_FILES_INCLUDE: providerSuite,
                MOCHA_GREP: providerSensitivePattern,
                MOCHA_GREP_INVERT: 'true',
            },
        },
        ...providerSensitivePattern.split('|').map(testName => ({
            label: `test:provider-isolated:${testName}`,
            command: 'npm',
            args: ['test'],
            retryOnFailure: true,
            envOverrides: {
                MOCHA_TEST_FILES_INCLUDE: providerSuite,
                MOCHA_GREP: testName,
            },
        })),
    ];

    if (runBenchmark) {
        steps.push({
            label: 'benchmark:pfc',
            command: 'npm',
            args: ['run', 'benchmark:pfc'],
        });
    }

    return {
        isolatedSuites,
        providerSuite,
        providerSensitivePattern,
        steps,
    };
}

function runValidationStep(step, env, dryRun) {
    if (dryRun) {
        return {
            label: step.label,
            command: step.command,
            args: step.args,
            retryOnFailure: Boolean(step.retryOnFailure),
            envOverrides: step.envOverrides ?? {},
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
            durationMs: 0,
            status: 'skipped-dry-run',
            exitCode: 0,
            attempts: 1,
            retryCount: 0,
        };
    }

    const maxAttempts = step.retryOnFailure ? 2 : 1;
    const attemptResults = [];
    let finalResult;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const startedAt = new Date().toISOString();
        const startTime = Date.now();
        const result = spawnSync(step.command, step.args, {
            stdio: 'inherit',
            shell: true,
            env: step.envOverrides
                ? withEnv(env, step.envOverrides)
                : env,
        });
        const finishedAt = new Date().toISOString();
        const durationMs = Date.now() - startTime;
        const attemptResult = {
            attempt,
            startedAt,
            finishedAt,
            durationMs,
            status: result.error
                ? 'failed'
                : (result.status === 0 ? 'passed' : 'failed'),
            exitCode: typeof result.status === 'number' ? result.status : 1,
            error: result.error ? String(result.error) : undefined,
        };

        attemptResults.push(attemptResult);
        finalResult = attemptResult;

        if (attemptResult.status === 'passed') {
            break;
        }

        if (attempt < maxAttempts) {
            console.warn(`[release-validation] retrying ${step.label} after failed attempt ${attempt}/${maxAttempts}`);
        }
    }

    return {
        label: step.label,
        command: step.command,
        args: step.args,
        retryOnFailure: Boolean(step.retryOnFailure),
        envOverrides: step.envOverrides ?? {},
        startedAt: attemptResults[0].startedAt,
        finishedAt: finalResult.finishedAt,
        durationMs: attemptResults.reduce((total, attempt) => total + attempt.durationMs, 0),
        status: finalResult.status,
        exitCode: finalResult.exitCode,
        error: finalResult.error,
        attempts: attemptResults.length,
        retryCount: attemptResults.length - 1,
        attemptResults,
    };
}

function buildReleaseValidationReport(parsedArgs, stepResults) {
    const failedStep = stepResults.find(step => step.status === 'failed');

    return {
        kind: 'powerbuilder-release-validation-report',
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        benchmarkEnabled: parsedArgs.runBenchmark,
        dryRun: parsedArgs.dryRun,
        reportFile: parsedArgs.reportFile,
        summary: {
            stepCount: stepResults.length,
            passedCount: stepResults.filter(step => step.status === 'passed').length,
            failedCount: stepResults.filter(step => step.status === 'failed').length,
            skippedCount: stepResults.filter(step => step.status === 'skipped-dry-run').length,
            finalStatus: failedStep ? 'failed' : (parsedArgs.dryRun ? 'dry-run' : 'passed'),
            failedStepLabel: failedStep?.label,
        },
        steps: stepResults,
    };
}

async function writeReleaseValidationReport(reportFile, payload) {
    const absolutePath = path.resolve(process.cwd(), reportFile);

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    return absolutePath;
}

async function main() {
    const parsedArgs = parseArgs(process.argv.slice(2));
    const env = createReleaseEnv();
    const plan = createReleaseValidationPlan(parsedArgs.runBenchmark);
    const stepResults = [];

    for (const step of plan.steps) {
        const result = runValidationStep(step, env, parsedArgs.dryRun);
        stepResults.push(result);

        if (result.status === 'failed') {
            break;
        }
    }

    const report = buildReleaseValidationReport(parsedArgs, stepResults);
    const reportPath = await writeReleaseValidationReport(parsedArgs.reportFile, report);

    console.log(`[release-validation] report written to ${reportPath}`);

    if (report.summary.finalStatus === 'failed') {
        process.exit(stepResults.find(step => step.status === 'failed')?.exitCode ?? 1);
    }
}

module.exports = {
    DEFAULT_RELEASE_REPORT_RELATIVE_PATH,
    buildReleaseValidationReport,
    createReleaseEnv,
    createReleaseValidationPlan,
    parseArgs,
    runValidationStep,
    withEnv,
    writeReleaseValidationReport,
};

if (require.main === module) {
    main().catch(error => {
        console.error(error);
        process.exit(1);
    });
}