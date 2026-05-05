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
    suggestions: [
      'Mover nuevo command wiring a src/client/commandRegistration.ts.',
      'Mantener Object Explorer, Current Object Context y Diagnostics Explainability detrás de ensure*Controller().',
      'Extraer nuevos reports/support flows a módulos client dedicados antes de crecer extension.ts.',
    ],
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
    suggestions: [
      'Mover nuevo handler wiring a src/server/handlers/*Registration.ts.',
      'Extraer composition de runtime/cache/build/report a factories por dominio antes de crecer server.ts.',
      'Mantener server.ts como orden de bootstrap y no como owner de semántica, parsing o formatting.',
    ],
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
    suggestions: [
      'Agrupar comandos nuevos por dominio y delegar lógica a controllers/services existentes.',
      'Evitar que commandRegistration.ts construya reports, markdown o runners directamente.',
    ],
  },
  {
    path: 'src/server/handlers/featureHandlers.ts',
    category: 'server-feature-wiring',
    allowlisted: false,
    rationale: 'Wiring de handlers LSP historico; debe seguir cediendo registro a featureHandlerRegistration.ts y no recuperar semantica propia.',
    budgets: {
      maxLines: 1500,
      maxImports: 45,
      maxTopLevelDeclarations: 70,
    },
    suggestions: [
      'Mover nuevo registro de providers a src/server/handlers/featureHandlerRegistration.ts o a handler modules dedicados.',
      'Evitar que featureHandlers.ts calcule ViewModels, parse o semantic queries directamente.',
    ],
  },
  {
    path: 'src/server/features/completion.ts',
    category: 'server-feature-hotspot',
    allowlisted: false,
    rationale: 'Completion concentra ranking, catalogo y DataWindow adapters; debe delegar presentation y evitar scans o clones globales.',
    budgets: {
      maxLines: 850,
      maxImports: 24,
      maxTopLevelDeclarations: 55,
    },
    suggestions: [
      'Mantener payload inicial ligero y mover detalle a completionItem/resolve.',
      'Extraer heuristicas nuevas a owners/facades compartidos antes de crecer el provider.',
    ],
  },
  {
    path: 'src/server/features/hover.ts',
    category: 'server-feature-hotspot',
    allowlisted: false,
    rationale: 'Hover es hot path visible; cualquier crecimiento debe preservar cache negativa, ViewModel y resolvers compartidos.',
    budgets: {
      maxLines: 420,
      maxImports: 24,
      maxTopLevelDeclarations: 35,
    },
    suggestions: [
      'Mantener formatting en hoverFormat/hoverViewModel y evitar recomponer markdown en ramas semanticas.',
      'Reusar SemanticQueryFacade para resolucion compartida.',
    ],
  },
  {
    path: 'src/server/features/signatureHelp.ts',
    category: 'server-feature-hotspot',
    allowlisted: false,
    rationale: 'SignatureHelp comparte catalogo/locale/receiver context y no debe bifurcar owners semanticos.',
    budgets: {
      maxLines: 620,
      maxImports: 24,
      maxTopLevelDeclarations: 45,
    },
    suggestions: [
      'Compartir resolucion callable con SemanticQueryFacade cuando cambie el owner.',
      'Mantener SignatureHelpViewModel como frontera de presentation.',
    ],
  },
  {
    path: 'src/server/features/definition.ts',
    category: 'server-feature-hotspot',
    allowlisted: false,
    rationale: 'Definition debe seguir siendo wrapper fino sobre resolucion/catálogo y ViewModel de navegación.',
    budgets: {
      maxLines: 220,
      maxImports: 16,
      maxTopLevelDeclarations: 20,
    },
    suggestions: [
      'Mover nuevas ramas de origen a resolvers compartidos o adapters DataWindow existentes.',
      'Mantener DefinitionViewModel como unico formatter LSP final.',
    ],
  },
  {
    path: 'src/server/features/diagnostics.ts',
    category: 'server-feature-hotspot',
    allowlisted: false,
    rationale: 'Diagnostics es feature amplia por reglas semanticas; debe mantener reason codes, confidence y presentation separada.',
    budgets: {
      maxLines: 2050,
      maxImports: 35,
      maxTopLevelDeclarations: 90,
    },
    suggestions: [
      'Mover nuevas familias de reglas a helpers/owners especificos sin debilitar reason codes.',
      'Mantener DiagnosticMessageViewModel como frontera de mensaje visible.',
    ],
  },
  {
    path: 'src/server/features/dataWindowFastContext.ts',
    category: 'server-datawindow-hotspot',
    allowlisted: false,
    rationale: 'Fast context DataWindow debe seguir read-only, evidence-based y separado del parser PowerScript generico.',
    budgets: {
      maxLines: 650,
      maxImports: 20,
      maxTopLevelDeclarations: 55,
    },
    suggestions: [
      'Mantener SQL/lineage profundo fuera del hot path DataWindow.',
      'Agregar nuevos casos mediante adapters con confidence/sourceOrigin explicitos.',
    ],
  },
  {
    path: 'src/server/features/dataWindowServingAdapters.ts',
    category: 'server-datawindow-hotspot',
    allowlisted: false,
    rationale: 'Adapters DataWindow conectan fast context con features LSP sin convertir .srd en PowerScript generico.',
    budgets: {
      maxLines: 220,
      maxImports: 16,
      maxTopLevelDeclarations: 25,
    },
    suggestions: [
      'Mantener adapters como traduccion fina de DataWindowFastContext a surfaces LSP.',
      'No introducir IO ni descubrimiento de workspace desde adapters.',
    ],
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
    growthPolicy: entry.allowlisted ? 'allowlisted-source-data' : 'composition-root-guarded',
    rationale: entry.rationale,
    suggestions: entry.suggestions ?? [],
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