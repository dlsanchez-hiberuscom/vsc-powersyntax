const fs = require('node:fs');
const path = require('node:path');

function normalizeText(text) {
  return String(text ?? '').replace(/\r\n/g, '\n');
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function countOccurrences(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

const CANONICAL_DONE_LOG_SEQUENCE_MIN = 1160;
const BACKLOG_ID_PATTERN = '(?:B\\d+|BLOQUE\\s+\\d+|BLOQUE-\\d+|[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+)';

function normalizeBacklogId(id) {
  const raw = String(id ?? '').trim();
  const blockMatch = raw.match(/^BLOQUE[\s-]+(\d+)$/i);
  return blockMatch ? `BLOQUE-${blockMatch[1]}` : raw;
}

function parseBacklogSections(content) {
  const normalized = normalizeText(content);
  const matches = [...normalized.matchAll(new RegExp(`^##\\s+(${BACKLOG_ID_PATTERN})\\s+—\\s+(.+)$`, 'gm'))];
  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? normalized.length) : normalized.length;
    const block = normalized.slice(start, end);
    const stateMatch = block.match(/^- \*\*Estado:\*\*\s*(.+)$/m);
    return {
      id: normalizeBacklogId(match[1]),
      title: match[2],
      state: stateMatch ? stateMatch[1].trim() : undefined,
      block,
    };
  });
}

function isActiveBacklogSection(section) {
  const state = String(section.state ?? '').trim().toLowerCase();
  if (!state) {
    return true;
  }

  return !['done', 'closed', 'cerrada', 'cerrado', 'superseded', 'obsolete'].includes(state);
}

function parseDoneLogEntries(content) {
  const normalized = normalizeText(content);
  const matches = [...normalized.matchAll(new RegExp(`^##\\s+(\\d+\\.\\d+)\\s+(${BACKLOG_ID_PATTERN})\\.(.+)$`, 'gm'))];
  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? normalized.length) : normalized.length;
    return {
      sequence: match[1],
      sequenceKey: Number(match[1].replace('.', '')),
      id: normalizeBacklogId(match[2]),
      block: normalized.slice(start, end),
    };
  });
}

function parseDoneLogIds(content) {
  return parseDoneLogEntries(content).map((entry) => entry.id);
}

function parseCurrentFocusId(content) {
  const normalized = normalizeText(content);
  const focusMatch = normalized.match(new RegExp(`##\\s+1\\.\\s+Foco activo[\\s\\S]*?\`(${BACKLOG_ID_PATTERN})\\s+—`, 'i'));
  if (focusMatch) {
    return normalizeBacklogId(focusMatch[1]);
  }

  const promotedBlockMatch = normalized.match(/Bloque\s+(\d+)\s+—/i);
  if (promotedBlockMatch) {
    return normalizeBacklogId(`BLOQUE ${promotedBlockMatch[1]}`);
  }

  const inlineMatch = normalized.match(new RegExp(`\`(${BACKLOG_ID_PATTERN})\``, 'i'))?.[1];
  return inlineMatch ? normalizeBacklogId(inlineMatch) : undefined;
}

function parseRoadmapFocusId(content) {
  const match = normalizeText(content).match(new RegExp(`continuidad\\s+\`?(${BACKLOG_ID_PATTERN})\`?`, 'i'))?.[1];
  return match ? normalizeBacklogId(match) : undefined;
}

function normalizePromptReference(reference) {
  return String(reference ?? '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function extractPromptReferences(...contents) {
  const references = [];
  const pattern = /(?:^|[`\s(])((?:\.\/)?\.github\/prompts\/[^`\s)]+\.prompt\.md)(?=$|[`\s)])/g;

  for (const content of contents) {
    for (const match of normalizeText(content).matchAll(pattern)) {
      references.push(normalizePromptReference(match[1]));
    }
  }

  return uniqueSorted(references);
}

function customizationDocsContainName(name, kind, docsText) {
  const normalized = normalizeText(docsText);
  const pathReference = kind === 'agent'
    ? `.github/agents/${name}.agent.md`
    : `.github/skills/${name}/SKILL.md`;
  const fileReference = kind === 'agent'
    ? `${name}.agent.md`
    : `${name}/SKILL.md`;

  return normalized.includes(`\`${name}\``)
    || normalized.includes(pathReference)
    || normalized.includes(fileReference);
}

function buildFinding(code, severity, message, detail, evidence) {
  return {
    code,
    severity,
    message,
    ...(detail ? { detail } : {}),
    ...(evidence && evidence.length > 0 ? { evidence } : {}),
  };
}

function auditDocsDriftFromSources(sources) {
  const backlogSections = parseBacklogSections(sources.backlog);
  const activeBacklogIds = backlogSections.filter(isActiveBacklogSection).map((section) => section.id);
  const doneLogEntries = parseDoneLogEntries(sources.doneLog);
  const doneLogIds = doneLogEntries.map((entry) => entry.id);
  const currentFocusId = parseCurrentFocusId(sources.currentFocus);
  const roadmapFocusId = parseRoadmapFocusId(sources.roadmap);
  const findings = [];

  for (const section of backlogSections) {
    const state = String(section.state ?? '').trim().toLowerCase();
    if (['done', 'closed', 'cerrada', 'cerrado'].includes(state)) {
      findings.push(buildFinding(
        'done-state-still-in-backlog',
        'error',
        `${section.id} sigue presente en docs/backlog.md con estado ${section.state}.`,
        'Los ítems cerrados deben salir del backlog activo y moverse a docs/done-log.md.',
        [section.id],
      ));
    }
  }

  const backlogCounts = countOccurrences(backlogSections.map((section) => section.id));
  for (const [id, count] of backlogCounts.entries()) {
    if (count > 1) {
      findings.push(buildFinding(
        'duplicate-backlog-entry',
        'error',
        `El backlog repite ${id} en múltiples secciones activas.`,
        `Se detectaron ${count} apariciones del mismo ítem en docs/backlog.md.`,
        [id],
      ));
    }
  }

  const doneCounts = countOccurrences(doneLogIds);
  for (const [id, count] of doneCounts.entries()) {
    if (count > 1) {
      findings.push(buildFinding(
        'duplicate-done-entry',
        'error',
        `El done-log repite ${id} más de una vez.`,
        `Se detectaron ${count} entradas cerradas para el mismo backlog item.`,
        [id],
      ));
    }
  }

  for (const entry of doneLogEntries) {
    if (entry.sequenceKey < CANONICAL_DONE_LOG_SEQUENCE_MIN) {
      continue;
    }

    if (!/\*\*Validación registrada:\*\*/.test(entry.block)) {
      findings.push(buildFinding(
        'done-log-missing-validation',
        'error',
        `La entrada ${entry.id} del done-log no registra validación explícita.`,
        'Las entradas canónicas modernas del done-log deben incluir la sección **Validación registrada:**.',
        [entry.id, entry.sequence],
      ));
    }

    if (!/\*\*Documentación alineada:\*\*/.test(entry.block)) {
      findings.push(buildFinding(
        'done-log-missing-docs',
        'error',
        `La entrada ${entry.id} del done-log no registra documentación alineada.`,
        'Las entradas canónicas modernas del done-log deben incluir la sección **Documentación alineada:**.',
        [entry.id, entry.sequence],
      ));
    }
  }

  const overlap = uniqueSorted(activeBacklogIds.filter((id) => doneLogIds.includes(id)));
  for (const id of overlap) {
    findings.push(buildFinding(
      'done-item-still-active',
      'error',
      `${id} figura como Done y sigue en el backlog activo.`,
      'Un ítem cerrado no debe permanecer en docs/backlog.md como trabajo activo.',
      [id],
    ));
  }

  if (currentFocusId) {
    if (!activeBacklogIds.includes(currentFocusId)) {
      findings.push(buildFinding(
        'current-focus-not-active',
        'error',
        `El foco actual ${currentFocusId} no aparece como backlog activo.`,
        'docs/current-focus.md debe apuntar a un ítem todavía activo en docs/backlog.md.',
        [currentFocusId],
      ));
    }

    if (doneLogIds.includes(currentFocusId)) {
      findings.push(buildFinding(
        'current-focus-already-done',
        'error',
        `El foco actual ${currentFocusId} ya está registrado en done-log.`,
        'docs/current-focus.md no puede seguir apuntando a un ítem ya cerrado.',
        [currentFocusId],
      ));
    }
  }

  if (currentFocusId && roadmapFocusId && currentFocusId !== roadmapFocusId) {
    findings.push(buildFinding(
      'roadmap-focus-mismatch',
      'error',
      `Roadmap y current-focus no apuntan al mismo backlog item (${roadmapFocusId} vs ${currentFocusId}).`,
      'El bloque de continuidad del roadmap debe seguir el mismo foco vivo de docs/current-focus.md.',
      [roadmapFocusId, currentFocusId],
    ));
  }

  for (const spec of sources.specs) {
    if (!spec.hasSpec || !spec.hasTasks) {
      findings.push(buildFinding(
        'spec-missing-docs',
        'error',
        `La spec ${spec.name} no tiene la documentación mínima completa.`,
        `Faltan ${[!spec.hasSpec ? 'spec.md' : null, !spec.hasTasks ? 'tasks.md' : null].filter(Boolean).join(' y ')}.`,
        [spec.name],
      ));
    }
  }

  for (const promptReference of sources.promptReferences ?? []) {
    if (!promptReference.exists) {
      findings.push(buildFinding(
        'prompt-reference-missing',
        'error',
        `La referencia ${promptReference.path} no existe en el repositorio.`,
        'Backlog, current-focus y roadmap sólo deben promover prompts reales.',
        [promptReference.path],
      ));
    }
  }

  for (const promptFile of sources.promptFiles ?? []) {
    if (!String(promptFile.path).endsWith('.prompt.md')) {
      findings.push(buildFinding(
        'prompt-file-extension-invalid',
        'error',
        `El prompt ejecutable ${promptFile.path} no usa extension .prompt.md.`,
        'Los prompt files bajo .github/prompts deben usar el contrato de nombre *.prompt.md.',
        [promptFile.path],
      ));
    }
  }

  const customizationDocsText = [
    sources.backlog,
    sources.currentFocus,
    sources.roadmap,
    ...(sources.customizationDocs ?? []),
  ].map(normalizeText).join('\n');

  for (const agentFile of sources.agentFiles ?? []) {
    if (!String(agentFile.path).endsWith('.agent.md')) {
      findings.push(buildFinding(
        'agent-file-extension-invalid',
        'error',
        `El agente ${agentFile.path} no usa extension .agent.md.`,
        'Los agentes bajo .github/agents deben usar el contrato de nombre *.agent.md.',
        [agentFile.path],
      ));
    }

    if (!customizationDocsContainName(agentFile.name, 'agent', customizationDocsText)) {
      findings.push(buildFinding(
        'agent-reference-missing',
        'error',
        `El agente ${agentFile.name} existe pero no aparece en la documentación AI.`,
        'Los agentes versionados deben aparecer en docs/ai/README.md, docs/ai/agent-skill-routing.md, docs/ai-orchestration.md o ai-agents-catalog.md.',
        [agentFile.path],
      ));
    }
  }

  for (const skillFile of sources.skillFiles ?? []) {
    if (!String(skillFile.path).endsWith('/SKILL.md')) {
      findings.push(buildFinding(
        'skill-file-contract-invalid',
        'error',
        `La skill ${skillFile.path} no usa el contrato */SKILL.md.`,
        'Las skills bajo .github/skills deben vivir en .github/skills/<name>/SKILL.md.',
        [skillFile.path],
      ));
    }

    if (!customizationDocsContainName(skillFile.name, 'skill', customizationDocsText)) {
      findings.push(buildFinding(
        'skill-reference-missing',
        'error',
        `La skill ${skillFile.name} existe pero no aparece en la documentación AI.`,
        'Las skills versionadas deben aparecer en docs/ai/README.md, docs/ai/agent-skill-routing.md, docs/ai-orchestration.md o ai-agents-catalog.md.',
        [skillFile.path],
      ));
    }
  }

  const summary = {
    activeBacklogItems: uniqueSorted(activeBacklogIds).length,
    doneLogItems: uniqueSorted(doneLogIds).length,
    specFolders: sources.specs.length,
    promptReferences: (sources.promptReferences ?? []).length,
    promptFiles: (sources.promptFiles ?? []).length,
    agentFiles: (sources.agentFiles ?? []).length,
    skillFiles: (sources.skillFiles ?? []).length,
    findings: findings.length,
    errorFindings: findings.filter((finding) => finding.severity === 'error').length,
    warningFindings: findings.filter((finding) => finding.severity === 'warning').length,
    ...(currentFocusId ? { currentFocusId } : {}),
    ...(roadmapFocusId ? { roadmapFocusId } : {}),
  };

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    status: summary.errorFindings > 0 ? 'failed' : summary.warningFindings > 0 ? 'warning' : 'passed',
    summary,
    findings,
  };
}

function readFileIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : undefined;
}

function loadRepoSources(repoRoot) {
  const specsRoot = path.join(repoRoot, 'specs');
  const specs = fs.readdirSync(specsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dirPath = path.join(specsRoot, entry.name);
      const specContent = readFileIfExists(path.join(dirPath, 'spec.md'));
      const tasksContent = readFileIfExists(path.join(dirPath, 'tasks.md'));
      return {
        name: entry.name,
        hasSpec: typeof specContent === 'string',
        hasTasks: typeof tasksContent === 'string',
      };
    });

  const backlog = fs.readFileSync(path.join(repoRoot, 'docs', 'backlog.md'), 'utf8');
  const doneLog = fs.readFileSync(path.join(repoRoot, 'docs', 'done-log.md'), 'utf8');
  const currentFocus = fs.readFileSync(path.join(repoRoot, 'docs', 'current-focus.md'), 'utf8');
  const roadmap = fs.readFileSync(path.join(repoRoot, 'docs', 'roadmap.md'), 'utf8');
  const promptReferences = extractPromptReferences(backlog, currentFocus, roadmap).map((reference) => ({
    path: reference,
    exists: fs.existsSync(path.join(repoRoot, reference)),
  }));
  const promptsRoot = path.join(repoRoot, '.github', 'prompts');
  const promptFiles = fs.existsSync(promptsRoot)
    ? fs.readdirSync(promptsRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => ({ path: normalizePromptReference(path.join('.github', 'prompts', entry.name)) }))
    : [];
  const agentsRoot = path.join(repoRoot, '.github', 'agents');
  const agentFiles = fs.existsSync(agentsRoot)
    ? fs.readdirSync(agentsRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => ({
        name: entry.name.replace(/\.agent\.md$/, ''),
        path: normalizePromptReference(path.join('.github', 'agents', entry.name)),
      }))
    : [];
  const skillsRoot = path.join(repoRoot, '.github', 'skills');
  const skillFiles = fs.existsSync(skillsRoot)
    ? fs.readdirSync(skillsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: normalizePromptReference(path.join('.github', 'skills', entry.name, 'SKILL.md')),
      }))
      .filter((entry) => fs.existsSync(path.join(repoRoot, entry.path)))
    : [];
  const customizationDocs = [
    path.join(repoRoot, 'docs', 'ai', 'README.md'),
    path.join(repoRoot, 'docs', 'ai', 'agent-skill-routing.md'),
    path.join(repoRoot, 'docs', 'ai-orchestration.md'),
    path.join(repoRoot, 'docs', 'ai-agents-catalog.md'),
  ].map(readFileIfExists).filter((content) => typeof content === 'string');

  return {
    backlog,
    doneLog,
    currentFocus,
    roadmap,
    specs,
    promptReferences,
    promptFiles,
    agentFiles,
    skillFiles,
    customizationDocs,
  };
}

function auditDocsDrift(repoRoot) {
  return auditDocsDriftFromSources(loadRepoSources(repoRoot));
}

if (require.main === module) {
  const repoRoot = process.cwd();
  const result = auditDocsDrift(repoRoot);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.status === 'failed' ? 1 : 0;
}

module.exports = {
  auditDocsDrift,
  auditDocsDriftFromSources,
};