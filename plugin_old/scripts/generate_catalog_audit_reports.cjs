'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const validationRoot = path.join(repoRoot, 'src', 'powerbuilder', 'knowledge', 'validation');

async function main() {
    const { buildSystemSymbolCoverageReport } = require(path.join(
        repoRoot,
        'out',
        'powerbuilder',
        'knowledge',
        'validation',
        'buildCoverageReport',
    ));
    const { buildSystemSymbolConsistencyReport } = require(path.join(
        repoRoot,
        'out',
        'powerbuilder',
        'knowledge',
        'validation',
        'buildConsistencyReport',
    ));

    const generatedAt = new Date().toISOString();
    const coverageReport = buildSystemSymbolCoverageReport(undefined, generatedAt);
    const consistencyReport = buildSystemSymbolConsistencyReport(undefined, generatedAt);

    await fs.writeFile(
        path.join(validationRoot, 'coverageReport.generated.json'),
        `${JSON.stringify(coverageReport, null, 2)}\n`,
        'utf8',
    );
    await fs.writeFile(
        path.join(validationRoot, 'catalogConsistencyReport.generated.json'),
        `${JSON.stringify(consistencyReport, null, 2)}\n`,
        'utf8',
    );

    console.log('Reportes de auditoría del catálogo generados.');
    console.log(`  coverageReport.generated.json -> ${coverageReport.totalEntries} entradas`);
    console.log(`  catalogConsistencyReport.generated.json -> ${consistencyReport.validation.issueCount} incidencias`);
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});