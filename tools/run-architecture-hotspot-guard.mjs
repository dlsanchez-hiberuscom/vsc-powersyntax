import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const reportDir = path.join(repoRoot, 'artifacts', 'performance');
const reportPath = path.join(reportDir, 'architecture-hotspot-guard.json');
const WARNING_RATIO = 0.9;

const HOTSPOT_BUDGETS = [
  {
    path: 'src/client/extension.ts',
    category: 'client-host',
    allowlisted: false,
    rationale: 'Cliente host temporal hasta que B347/B354 sigan reduciendo lifecycle y bridge.',
    budgets: {
      maxLines: 5200,
      maxImports: 38,
      maxTopLevelDeclarations: 215,
    },
  },
  {
    path: 'src/server/server.ts',
    category: 'server-host',
    allowlisted: false,
    rationale: 'Host LSP principal: puede seguir concentrando wiring, pero no debe crecer sin nueva descomposición.',
    budgets: {
      maxLines: 1100,
      maxImports: 70,
      maxTopLevelDeclarations: 45,
    },
  },
  {
    path: 'src/client/commandRegistration.ts',
    category: 'client-command-wiring',
    allowlisted: false,
    rationale: 'Slice explícito de command wiring tras B346; admite crecimiento moderado pero no volver a monolito.',
    budgets: {
      maxLines: 650,
      maxImports: 10,
      maxTopLevelDeclarations: 20,
    },
  },
  {
    path: 'src/server/knowledge/system/generated/generated.generated.ts',
    category: 'catalog-generated',
    allowlisted: true,
    rationale: 'Slice generated allowlisted: el crecimiento viene del catálogo oficial, no de responsabilidad arquitectónica directa.',
    budgets: {
      maxLines: 2200,
      maxImports: 6,
    },
  },
  {
    path: 'src/server/knowledge/system/manual/core/objectFunctions.ts',
    category: 'catalog-manual',
    allowlisted: true,
    rationale: 'Slice manual allowlisted: agregación curada de object functions concentrada por dominio.',
    budgets: {
      maxLines: 2300,
      maxImports: 6,
    },
  },
  {
    path: 'src/server/knowledge/system/manual/datawindow/dataWindowFunctions.ts',
    category: 'catalog-manual',
    allowlisted: true,
    rationale: 'Slice manual allowlisted: catálogo DataWindow concentrado por ergonomía editorial.',
    budgets: {
      maxLines: 2150,
      maxImports: 6,
    },
  },
  {
    path: 'src/server/knowledge/system/manual/language/enumerations/index.ts',
    category: 'catalog-manual',
    allowlisted: true,
    rationale: 'Índice manual de enumeraciones allowlisted mientras B367-B370 deciden source-of-truth final.',
    budgets: {
      maxLines: 650,
      maxImports: 6,
    },
  },
  {
    path: 'src/server/knowledge/system/manual/core/globalFunctions.ts',
    category: 'catalog-manual',
    allowlisted: true,
    rationale: 'Slice manual allowlisted: globals curados concentrados por dominio.',
    budgets: {
      maxLines: 650,
      maxImports: 6,
    },
  },
  {
    path: 'src/server/knowledge/system/manual/core/systemEvents.ts',
    category: 'catalog-manual',
    allowlisted: true,
    rationale: 'Slice manual allowlisted: system events curados en un único índice.',
    budgets: {
      maxLines: 550,
      maxImports: 6,
    },
  },
];

function countMatches(content, expression) {
  const matches = content.match(expression);
  return matches ? matches.length : 0;
}

function collectMetrics(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const content = readFileSync(absolutePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const functions = countMatches(content, /^(?:export\s+)?(?:async\s+)?function\s+/gm);
  const classes = countMatches(content, /^(?:export\s+)?class\s+/gm);
  const interfaces = countMatches(content, /^(?:export\s+)?interface\s+/gm);
  const types = countMatches(content, /^(?:export\s+)?type\s+/gm);

  return {
    lines: lines.length,
    imports: lines.filter((line) => line.trim().startsWith('import ')).length,
    exports: lines.filter((line) => line.trim().startsWith('export ')).length,
    functions,
    classes,
    interfaces,
    types,
    topLevelDeclarations: functions + classes + interfaces + types,
    commandIds: countMatches(content, /vscPowerSyntax\./g),
  };
}

function evaluateMetric(metricName, actual, budget) {
  if (typeof budget !== 'number') {
    return null;
  }

  const ratio = budget > 0 ? actual / budget : 0;
  if (actual > budget) {
    return {
      metric: metricName,
      status: 'violation',
      actual,
      budget,
      ratio,
    };
  }

  if (ratio >= WARNING_RATIO) {
    return {
      metric: metricName,
      status: 'warning',
      actual,
      budget,
      ratio,
    };
  }

  return {
    metric: metricName,
    status: 'ok',
    actual,
    budget,
    ratio,
  };
}

function collectHotspot(entry) {
  const metrics = collectMetrics(entry.path);
  const evaluations = [
    evaluateMetric('lines', metrics.lines, entry.budgets.maxLines),
    evaluateMetric('imports', metrics.imports, entry.budgets.maxImports),
    evaluateMetric('topLevelDeclarations', metrics.topLevelDeclarations, entry.budgets.maxTopLevelDeclarations),
  ].filter(Boolean);

  return {
    path: entry.path,
    category: entry.category,
    allowlisted: entry.allowlisted,
    rationale: entry.rationale,
    metrics,
    budgets: entry.budgets,
    warnings: evaluations.filter((evaluation) => evaluation.status === 'warning'),
    violations: evaluations.filter((evaluation) => evaluation.status === 'violation'),
  };
}

function buildReport() {
  const hotspots = HOTSPOT_BUDGETS.map(collectHotspot);
  const warningHotspots = hotspots.filter((entry) => entry.warnings.length > 0).length;
  const failingHotspots = hotspots.filter((entry) => entry.violations.length > 0).length;

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    status: failingHotspots > 0 ? 'failed' : 'passed',
    reportPath: path.relative(repoRoot, reportPath).replace(/\\/g, '/'),
    summary: {
      totalHotspots: hotspots.length,
      allowlistedHotspots: hotspots.filter((entry) => entry.allowlisted).length,
      warningHotspots,
      failingHotspots,
    },
    hotspots,
  };
}

function writeReport(report) {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

function formatMetricSummary(label, actual, budget) {
  if (typeof budget !== 'number') {
    return `${label}=${actual}`;
  }
  return `${label}=${actual}/${budget}`;
}

function formatEvaluation(evaluation) {
  const ratio = Number((evaluation.ratio * 100).toFixed(1));
  return `${evaluation.metric} ${evaluation.actual}/${evaluation.budget} (${ratio}%)`;
}

function printReport(report) {
  console.log(`[architecture-hotspots] status=${report.status} hotspots=${report.summary.totalHotspots} allowlisted=${report.summary.allowlistedHotspots} warnings=${report.summary.warningHotspots} failing=${report.summary.failingHotspots}`);
  for (const hotspot of report.hotspots) {
    const summary = [
      formatMetricSummary('lines', hotspot.metrics.lines, hotspot.budgets.maxLines),
      formatMetricSummary('imports', hotspot.metrics.imports, hotspot.budgets.maxImports),
      typeof hotspot.budgets.maxTopLevelDeclarations === 'number'
        ? formatMetricSummary('topLevelDeclarations', hotspot.metrics.topLevelDeclarations, hotspot.budgets.maxTopLevelDeclarations)
        : null,
    ].filter(Boolean).join(' | ');
    const prefix = hotspot.allowlisted ? '[allowlisted]' : '[guarded]';
    console.log(`${prefix} ${hotspot.path} :: ${summary}`);
    if (hotspot.warnings.length > 0) {
      console.log(`  warnings: ${hotspot.warnings.map(formatEvaluation).join('; ')}`);
    }
    if (hotspot.violations.length > 0) {
      console.log(`  violations: ${hotspot.violations.map(formatEvaluation).join('; ')}`);
    }
  }
  console.log(`[architecture-hotspots] report=${path.relative(repoRoot, reportPath).replace(/\\/g, '/')}`);
}

const jsonOnly = process.argv.includes('--json');
const report = buildReport();
writeReport(report);

if (jsonOnly) {
  process.stdout.write(JSON.stringify(report, null, 2));
  process.stdout.write('\n');
} else {
  printReport(report);
}

if (report.status !== 'passed') {
  process.exitCode = 1;
}