import * as assert from 'assert';

const releaseValidationScript = require('../../../scripts/run_release_validation.cjs') as {
    DEFAULT_RELEASE_REPORT_RELATIVE_PATH: string;
    createReleaseValidationPlan: (runBenchmark: boolean) => { steps: Array<{ label: string; retryOnFailure?: boolean }> };
    parseArgs: (argv: string[]) => { runBenchmark: boolean; dryRun: boolean; reportFile: string };
};

suite('ReleaseValidationScript', () => {
    test('parseArgs reconoce benchmark, dry-run y ruta de reporte', () => {
        const parsed = releaseValidationScript.parseArgs([
            '--benchmark',
            '--dry-run',
            '--report-file',
            'tmp/report.json',
        ]);

        assert.strictEqual(parsed.runBenchmark, true);
        assert.strictEqual(parsed.dryRun, true);
        assert.strictEqual(parsed.reportFile, 'tmp/report.json');
    });

    test('createReleaseValidationPlan compone el flujo repetible de compile, tests aislados y benchmark opcional', () => {
        const withBenchmark = releaseValidationScript.createReleaseValidationPlan(true);
        const withoutBenchmark = releaseValidationScript.createReleaseValidationPlan(false);

        assert.strictEqual(withBenchmark.steps[0].label, 'compile');
        assert.ok(withBenchmark.steps.some(step => step.label === 'test:shared-host'));
        assert.ok(withBenchmark.steps.filter(step => step.label.startsWith('test:')).every(step => step.retryOnFailure === true));
        assert.ok(withBenchmark.steps.some(step => step.label.startsWith('test:isolation:')));
        assert.ok(withBenchmark.steps.some(step => step.label.startsWith('test:provider-isolated:')));
        assert.strictEqual(withBenchmark.steps[withBenchmark.steps.length - 1].label, 'benchmark:pfc');
        assert.strictEqual(withBenchmark.steps[withBenchmark.steps.length - 1].retryOnFailure, undefined);
        assert.ok(!withoutBenchmark.steps.some(step => step.label === 'benchmark:pfc'));
        assert.ok(releaseValidationScript.DEFAULT_RELEASE_REPORT_RELATIVE_PATH.replace(/\\/g, '/').endsWith('docs/generated/powerbuilder/exports/release/release-validation-report.json'));
    });
});