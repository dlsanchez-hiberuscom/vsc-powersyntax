const path = require('node:path');

function formatDomainList(domains) {
  return domains.length > 0 ? domains.join(', ') : 'none';
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const { buildWorkspaceCheckCatalogSummary } = require(path.join(
    repoRoot,
    'out',
    'src',
    'server',
    'features',
    'workspaceCheckCatalogSummary.js',
  ));

  const summary = buildWorkspaceCheckCatalogSummary();
  const compliance = summary.adrCompliance;

  if (!compliance) {
    throw new Error('No se pudo construir adrCompliance para verificar la cobertura oficial del catalogo.');
  }

  console.log('Verificacion ADR-0001 de official coverage.');
  console.log(`  status: ${compliance.status}`);
  console.log(`  officialCoverageDriftDomains: ${formatDomainList(compliance.officialCoverageDriftDomains)}`);
  console.log(`  manualPrimaryDomains: ${formatDomainList(compliance.manualPrimaryDomains)}`);
  console.log(`  candidateHotPathViolations: ${compliance.candidateHotPathViolations}`);

  if (compliance.officialCoverageDriftDomains.length > 0) {
    console.error(
      `Se detecto drift en officialCoverage: ${formatDomainList(compliance.officialCoverageDriftDomains)}`,
    );
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}