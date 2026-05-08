import { existsSync, lstatSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const DEFAULT_SCAN_ROOTS = [
  'src/client',
  'src/server',
  'src/shared',
];

const PROVIDER_TARGETS = [
  'src/server/features/completion.ts',
  'src/server/features/definition.ts',
  'src/server/features/hover.ts',
  'src/server/features/references.ts',
  'src/server/features/rename.ts',
  'src/server/features/semanticTokens.ts',
  'src/server/features/signatureHelp.ts',
];

const PROVIDER_FACADE_ALLOWLIST = new Set([
  'src/server/features/dataWindowFastContext.ts',
  'src/server/features/dataWindowServingAdapters.ts',
  'src/server/features/semanticQueryFacade.ts',
]);

const PROVIDER_BYPASS_TARGETS = new Set([
  'src/server/knowledge/resolution/semanticQueryService.ts',
]);

const PARALLEL_STORE_ALLOWLIST = new Set([
  'src/server/knowledge/KnowledgeBase.ts',
]);

const PARALLEL_STORE_FIELDS = [
  'publishedState',
  'semanticEpoch',
  'documentSnapshots',
  'globalSymbols',
  'entitiesByUri',
  'documentScopes',
  'reverseDependencies',
  'scopeIndex',
];

const FULL_SCAN_METHOD_PREFIXES = [
  'findAll',
  'getAll',
  'collectAll',
  'scanAll',
];

const CACHE_CONTRACT_TARGETS = new Set([
  'src/server/serving/cacheKeyContract.ts',
]);

const REQUIRED_CACHE_DISCRIMINATORS = [
  'documentFingerprint',
  'documentVersion',
  'kbVersion',
  'sourceOrigin',
];

function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = scanArchitectureConformance(options);

  if (options.output) {
    const outputPath = path.isAbsolute(options.output)
      ? options.output
      : path.join(repoRoot, options.output);
    writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  }

  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    printHumanReport(report);
  }

  if (!options.reportOnly && report.summary.violations > 0) {
    process.exitCode = 1;
  }
}

function parseArgs(argv) {
  const options = {
    json: false,
    output: null,
    reportOnly: false,
    generatedAt: null,
    roots: [],
  };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--report-only') {
      options.reportOnly = true;
      continue;
    }
    if (arg === '--output') {
      options.output = argv[++index] ?? null;
      continue;
    }
    if (arg === '--generated-at') {
      options.generatedAt = argv[++index] ?? null;
      continue;
    }
    if (arg === '--root') {
      const next = argv[++index];
      if (next) {
        options.roots.push(next);
      }
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHelp() {
  process.stdout.write([
    'Usage: node tools/architecture-conformance-scanner.mjs [options]',
    '',
    'Options:',
    '  --json                 Print the report as JSON.',
    '  --report-only          Always exit with code 0.',
    '  --output <path>        Write the JSON report to disk.',
    '  --generated-at <iso>   Override generatedAt for deterministic tests.',
    '  --root <path>          Add a scan root. Can be repeated.',
  ].join('\n'));
}

export function scanArchitectureConformance(options = {}) {
  const rootInputs = options.roots?.length ? options.roots : DEFAULT_SCAN_ROOTS;
  const roots = rootInputs
    .map((root) => normalizeRootPath(root))
    .filter((root, index, all) => root && all.indexOf(root) === index)
    .sort();

  const sourceInfos = buildSourceInfoIndex(roots);
  const graph = buildDependencyGraph(sourceInfos);
  const violations = [
    ...collectImportCycleViolations(graph),
    ...collectProviderBypassViolations(sourceInfos),
    ...collectFullScanViolations(sourceInfos),
    ...collectPublishedStateWriteViolations(sourceInfos),
    ...collectCacheContractViolations(sourceInfos),
    ...collectParallelStoreViolations(sourceInfos),
  ].sort(compareViolations);

  const byKind = Object.fromEntries(
    ['cache-contract', 'full-scan', 'import-cycle', 'parallel-store', 'provider-bypass', 'published-state-write']
      .map((kind) => [kind, violations.filter((entry) => entry.kind === kind).length])
  );

  return {
    status: violations.length === 0 ? 'passed' : 'failed',
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    roots,
    summary: {
      filesScanned: sourceInfos.size,
      violations: violations.length,
      byKind,
    },
    violations,
  };
}

function normalizeRootPath(root) {
  const absoluteRoot = path.isAbsolute(root)
    ? path.normalize(root)
    : path.join(repoRoot, root);

  if (!existsSync(absoluteRoot) || !lstatSync(absoluteRoot).isDirectory()) {
    return null;
  }

  const relative = toRelativePath(absoluteRoot);
  return relative ?? null;
}

function buildSourceInfoIndex(roots) {
  const sourceInfos = new Map();
  const queue = roots.flatMap((root) => collectTsFiles(path.join(repoRoot, root)));
  const queued = new Set(queue.map((filePath) => path.normalize(filePath)));

  while (queue.length > 0) {
    const absolutePath = queue.shift();
    if (!absolutePath) {
      continue;
    }

    const normalizedPath = path.normalize(absolutePath);
    const relativePath = toRelativePath(normalizedPath);
    if (!relativePath || sourceInfos.has(relativePath)) {
      continue;
    }

    const info = parseSourceInfo(normalizedPath, relativePath);
    sourceInfos.set(relativePath, info);

    for (const entry of info.imports) {
      if (entry.isTypeOnly) {
        continue;
      }

      if (!entry.resolved) {
        continue;
      }

      const discoveredAbsolute = path.join(repoRoot, entry.resolved);
      const discoveredNormalized = path.normalize(discoveredAbsolute);
      if (queued.has(discoveredNormalized) || sourceInfos.has(entry.resolved)) {
        continue;
      }

      queued.add(discoveredNormalized);
      queue.push(discoveredNormalized);
    }
  }

  return sourceInfos;
}

function collectTsFiles(root) {
  if (!existsSync(root) || !lstatSync(root).isDirectory()) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name === 'node_modules' || entry.name === 'out' || entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.ts') && !fullPath.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseSourceInfo(absolutePath, relativePath) {
  const text = readFileSync(absolutePath, 'utf8');
  const sourceFile = ts.createSourceFile(relativePath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const imports = collectImportEntries(sourceFile)
    .map((entry) => ({
      ...entry,
      resolved: resolveImportTarget(absolutePath, entry.specifier),
    }))
    .sort((left, right) => {
      const leftKey = `${left.resolved ?? ''}|${left.specifier}|${left.kind}`;
      const rightKey = `${right.resolved ?? ''}|${right.specifier}|${right.kind}`;
      return leftKey.localeCompare(rightKey);
    });

  return {
    absolutePath,
    relativePath,
    text,
    sourceFile,
    imports,
  };
}

function collectImportEntries(sourceFile) {
  const imports = [];

  walk(sourceFile, (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      imports.push({
        kind: 'import',
        specifier: node.moduleSpecifier.text,
        isTypeOnly: Boolean(node.importClause?.isTypeOnly),
      });
      return;
    }

    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      imports.push({
        kind: 'export',
        specifier: node.moduleSpecifier.text,
        isTypeOnly: Boolean(node.isTypeOnly),
      });
      return;
    }

    if (ts.isCallExpression(node)) {
      const [firstArg] = node.arguments;
      if (!firstArg || !ts.isStringLiteralLike(firstArg)) {
        return;
      }

      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        imports.push({
          kind: 'dynamic-import',
          specifier: firstArg.text,
          isTypeOnly: false,
        });
        return;
      }

      if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
        imports.push({
          kind: 'require',
          specifier: firstArg.text,
          isTypeOnly: false,
        });
      }
    }
  });

  return imports;
}

function resolveImportTarget(filePath, specifier) {
  if (!specifier.startsWith('.')) {
    return null;
  }

  const basePath = path.resolve(path.dirname(filePath), specifier);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, 'index.ts'),
  ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) {
      continue;
    }

    const stat = lstatSync(candidate);
    if (!stat.isFile()) {
      continue;
    }

    const relativePath = toRelativePath(candidate);
    if (relativePath) {
      return relativePath;
    }
  }

  return null;
}

function buildDependencyGraph(sourceInfos) {
  return new Map(
    [...sourceInfos.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([relativePath, info]) => [
        relativePath,
        info.imports
          .filter((entry) => !entry.isTypeOnly)
          .map((entry) => entry.resolved)
          .filter((resolved) => resolved && sourceInfos.has(resolved))
          .sort(),
      ])
  );
}

function collectImportCycleViolations(graph) {
  const cycles = detectImportCycles(graph);
  return cycles.map((cycle) => ({
    kind: 'import-cycle',
    ruleId: 'PB-ARCH-IMPORT-CYCLE-01',
    path: cycle[0],
    message: `Se detectó un ciclo de imports: ${cycle.join(' -> ')}`,
    evidence: {
      cycle,
    },
  }));
}

function detectImportCycles(graph) {
  const cycles = [];
  const seenSignatures = new Set();
  const state = new Map();
  const stack = [];
  const active = new Set();

  for (const node of [...graph.keys()].sort()) {
    if (state.get(node) === 'done') {
      continue;
    }
    visitNode(node);
  }

  return cycles;

  function visitNode(node) {
    state.set(node, 'visiting');
    stack.push(node);
    active.add(node);

    for (const dependency of graph.get(node) ?? []) {
      if (!graph.has(dependency)) {
        continue;
      }

      if (active.has(dependency)) {
        const cycleNodes = stack.slice(stack.indexOf(dependency));
        const canonicalCycle = canonicalizeCycle(cycleNodes);
        if (!seenSignatures.has(canonicalCycle.signature)) {
          seenSignatures.add(canonicalCycle.signature);
          cycles.push([...canonicalCycle.nodes, canonicalCycle.nodes[0]]);
        }
        continue;
      }

      if (state.get(dependency) !== 'done') {
        visitNode(dependency);
      }
    }

    active.delete(node);
    stack.pop();
    state.set(node, 'done');
  }
}

function canonicalizeCycle(nodes) {
  const rotations = [];
  for (let index = 0; index < nodes.length; index++) {
    rotations.push(nodes.slice(index).concat(nodes.slice(0, index)));
  }

  rotations.sort((left, right) => left.join('>').localeCompare(right.join('>')));
  return {
    nodes: rotations[0],
    signature: rotations[0].join('>'),
  };
}

function getProviderCandidatePaths(sourceInfos) {
  const providerFileNames = new Set(PROVIDER_TARGETS.map((entry) => path.basename(entry)));
  return [...sourceInfos.keys()]
    .filter((relativePath) => {
      if (PROVIDER_TARGETS.includes(relativePath)) {
        return true;
      }

      if (!relativePath.includes('/architecture-conformance/')) {
        return false;
      }

      if (relativePath.includes('/provider-bypass/') || relativePath.includes('/full-scan/')) {
        return true;
      }

      return providerFileNames.has(path.basename(relativePath));
    })
    .sort();
}

function collectProviderBypassViolations(sourceInfos) {
  const violations = [];

  for (const relativePath of getProviderCandidatePaths(sourceInfos)) {
    const info = sourceInfos.get(relativePath);
    if (!info) {
      continue;
    }

    const resolvedImports = new Set(info.imports.map((entry) => entry.resolved).filter(Boolean));
    const hasFacadeImport = resolvedImports.has('src/server/features/semanticQueryFacade.ts');
    const hasAllowlistedAdapter = [...PROVIDER_FACADE_ALLOWLIST].some((entry) => resolvedImports.has(entry));
    if (!hasFacadeImport && !hasAllowlistedAdapter && !info.text.includes('bypass-allow')) {
      violations.push({
        kind: 'provider-bypass',
        ruleId: 'PB-ARCH-PROVIDER-FACADE-01',
        path: relativePath,
        message: 'El provider crítico no importa SemanticQueryFacade ni un adapter allowlisted.',
      });
    }

    for (const target of PROVIDER_BYPASS_TARGETS) {
      if (!resolvedImports.has(target)) {
        continue;
      }
      violations.push({
        kind: 'provider-bypass',
        ruleId: 'PB-ARCH-PROVIDER-BYPASS-01',
        path: relativePath,
        message: `El provider crítico importa ${target} y evita la facade semántica.`,
      });
    }

    let publishedStateAccess = false;
    walk(info.sourceFile, (node) => {
      if (ts.isPropertyAccessExpression(node) && node.name.text === 'publishedState') {
        publishedStateAccess = true;
      }
    });

    if (publishedStateAccess && !info.text.includes('bypass-allow')) {
      violations.push({
        kind: 'provider-bypass',
        ruleId: 'PB-ARCH-PUBLISHED-STATE-BYPASS-01',
        path: relativePath,
        message: 'El provider crítico accede a KnowledgeBase.publishedState fuera de la facade.',
      });
    }
  }

  return violations;
}

function collectFullScanViolations(sourceInfos) {
  const violations = [];

  for (const relativePath of getProviderCandidatePaths(sourceInfos)) {
    const info = sourceInfos.get(relativePath);
    if (!info) {
      continue;
    }

    walk(info.sourceFile, (node) => {
      if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
        return;
      }

      const methodName = node.expression.name.text;
      const receiver = node.expression.expression;
      const receiverName = ts.isIdentifier(receiver)
        ? receiver.text
        : ts.isPropertyAccessExpression(receiver) && ts.isIdentifier(receiver.name)
          ? receiver.name.text
          : null;

      if (!receiverName || (receiverName !== 'kb' && receiverName !== 'knowledgeBase')) {
        return;
      }

      if (!FULL_SCAN_METHOD_PREFIXES.some((prefix) => methodName.startsWith(prefix))) {
        return;
      }

      violations.push({
        kind: 'full-scan',
        ruleId: 'PB-ARCH-FULL-SCAN-HOTPATH-01',
        path: relativePath,
        message: `El provider crítico invoca ${receiverName}.${methodName}(), patrón asociado a full scans en hot path.`,
      });
    });
  }

  return violations;
}

function collectPublishedStateWriteViolations(sourceInfos) {
  const violations = [];

  for (const [relativePath, info] of sourceInfos) {
    const isCandidate = relativePath === 'src/server/knowledge/KnowledgeBase.ts'
      || relativePath.includes('/architecture-conformance/negative/query-path-write/');
    if (!isCandidate) {
      continue;
    }

    walk(info.sourceFile, (node) => {
      if (!ts.isMethodDeclaration(node) || !node.body) {
        return;
      }

      const methodName = node.name ? getPropertyNameText(node.name) : null;
      if (!methodName || !isQueryPathMethod(methodName)) {
        return;
      }

      let mutatesPublishedState = false;
      walk(node.body, (child) => {
        if (mutatesPublishedState) {
          return;
        }

        if (isPublishedStateMutation(child)) {
          mutatesPublishedState = true;
        }
      });

      if (!mutatesPublishedState) {
        return;
      }

      violations.push({
        kind: 'published-state-write',
        ruleId: 'PB-ARCH-PUBLISHED-STATE-READONLY-01',
        path: relativePath,
        message: `El query path ${methodName} muta this.publishedState en lugar de usar una proyección versionada.`,
      });
    });
  }

  return dedupeViolations(violations);
}

function collectCacheContractViolations(sourceInfos) {
  const violations = [];

  for (const [relativePath, info] of sourceInfos) {
    const looksLikeFixtureCacheContract = relativePath.includes('/architecture-conformance/')
      && /cache/i.test(path.basename(relativePath));
    if (!CACHE_CONTRACT_TARGETS.has(relativePath) && !looksLikeFixtureCacheContract) {
      continue;
    }

    const identifiers = collectReferencedNames(info.sourceFile);
    const missing = REQUIRED_CACHE_DISCRIMINATORS.filter((name) => !identifiers.has(name));
    if (missing.length === 0) {
      continue;
    }

    violations.push({
      kind: 'cache-contract',
      ruleId: 'PB-ARCH-CACHE-DISCRIMINATOR-01',
      path: relativePath,
      message: `El contrato de cache omite discriminadores obligatorios: ${missing.join(', ')}.`,
      evidence: {
        missing,
      },
    });
  }

  return violations;
}

function collectParallelStoreViolations(sourceInfos) {
  const violations = [];

  for (const [relativePath, info] of sourceInfos) {
    if (PARALLEL_STORE_ALLOWLIST.has(relativePath)) {
      continue;
    }

    const fileHint = path.basename(relativePath).toLowerCase();
    if (!fileHint.includes('store') && !fileHint.includes('snapshot') && !fileHint.includes('semantic') && !fileHint.includes('knowledge')) {
      continue;
    }

    walk(info.sourceFile, (node) => {
      if (!ts.isClassDeclaration(node) && !ts.isObjectLiteralExpression(node)) {
        return;
      }

      const propertyNames = ts.isClassDeclaration(node)
        ? collectClassPropertyNames(node)
        : collectObjectLiteralPropertyNames(node);
      const matchedFields = PARALLEL_STORE_FIELDS.filter((field) => propertyNames.has(field));
      if (matchedFields.length < 3) {
        return;
      }

      const displayName = ts.isClassDeclaration(node) && node.name
        ? node.name.text
        : path.basename(relativePath);

      violations.push({
        kind: 'parallel-store',
        ruleId: 'PB-ARCH-PARALLEL-STORE-01',
        path: relativePath,
        message: `${displayName} replica campos autoritativos del snapshot publicado: ${matchedFields.join(', ')}.`,
        evidence: {
          matchedFields,
        },
      });
    });
  }

  return dedupeViolations(violations);
}

function collectReferencedNames(sourceFile) {
  const names = new Set();
  walk(sourceFile, (node) => {
    if (ts.isIdentifier(node)) {
      names.add(node.text);
      return;
    }
    if (ts.isPropertyAccessExpression(node)) {
      names.add(node.name.text);
      return;
    }
    if (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) {
      const propertyName = getPropertyNameText(node.name);
      if (propertyName) {
        names.add(propertyName);
      }
    }
  });
  return names;
}

function isQueryPathMethod(methodName) {
  return /^(get|find|query|count|has|list)/i.test(methodName) || methodName.endsWith('Readonly');
}

function isPublishedStateMutation(node) {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    const methodName = node.expression.name.text;
    if ((methodName === 'set' || methodName === 'delete' || methodName === 'clear')
      && startsAtPublishedState(node.expression.expression)) {
      return true;
    }
  }

  if (ts.isBinaryExpression(node) && isAssignmentOperator(node.operatorToken.kind) && startsAtPublishedState(node.left)) {
    return true;
  }

  return false;
}

function isAssignmentOperator(kind) {
  return kind === ts.SyntaxKind.EqualsToken
    || kind === ts.SyntaxKind.PlusEqualsToken
    || kind === ts.SyntaxKind.MinusEqualsToken
    || kind === ts.SyntaxKind.AsteriskEqualsToken
    || kind === ts.SyntaxKind.SlashEqualsToken
    || kind === ts.SyntaxKind.AmpersandAmpersandEqualsToken
    || kind === ts.SyntaxKind.BarBarEqualsToken
    || kind === ts.SyntaxKind.QuestionQuestionEqualsToken;
}

function startsAtPublishedState(node) {
  const chain = [];
  let current = node;

  while (ts.isPropertyAccessExpression(current)) {
    chain.unshift(current.name.text);
    current = current.expression;
  }

  if (current.kind === ts.SyntaxKind.ThisKeyword) {
    chain.unshift('this');
  }

  return chain[0] === 'this' && chain[1] === 'publishedState';
}

function collectClassPropertyNames(node) {
  const names = new Set();
  for (const member of node.members) {
    if (!('name' in member) || !member.name) {
      continue;
    }
    const propertyName = getPropertyNameText(member.name);
    if (propertyName) {
      names.add(propertyName);
    }
  }
  return names;
}

function collectObjectLiteralPropertyNames(node) {
  const names = new Set();
  for (const property of node.properties) {
    if (!('name' in property) || !property.name) {
      continue;
    }
    const propertyName = getPropertyNameText(property.name);
    if (propertyName) {
      names.add(propertyName);
    }
  }
  return names;
}

function getPropertyNameText(nameNode) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteralLike(nameNode) || ts.isNumericLiteral(nameNode)) {
    return nameNode.text;
  }

  return null;
}

function dedupeViolations(violations) {
  const seen = new Set();
  const unique = [];
  for (const violation of violations) {
    const signature = JSON.stringify([violation.kind, violation.ruleId, violation.path, violation.message]);
    if (seen.has(signature)) {
      continue;
    }
    seen.add(signature);
    unique.push(violation);
  }
  return unique;
}

function compareViolations(left, right) {
  return JSON.stringify(left).localeCompare(JSON.stringify(right));
}

function printHumanReport(report) {
  process.stdout.write([
    `[architecture-conformance] status=${report.status}`,
    `[architecture-conformance] files=${report.summary.filesScanned} violations=${report.summary.violations}`,
    ...report.violations.map((entry) => `[${entry.kind}] ${entry.path}: ${entry.message}`),
  ].join('\n'));
  process.stdout.write('\n');
}

function toRelativePath(filePath) {
  const relativePath = path.relative(repoRoot, filePath);
  if (relativePath.startsWith('..')) {
    return null;
  }
  return relativePath.replace(/\\/g, '/');
}

function walk(node, visitor) {
  visitor(node);
  ts.forEachChild(node, (child) => walk(child, visitor));
}

main();