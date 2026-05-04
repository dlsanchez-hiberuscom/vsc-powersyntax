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

function parseBacklogSections(content) {
  const normalized = normalizeText(content);
  const matches = [...normalized.matchAll(/^##\s+(B\d+)\s+—\s+(.+)$/gm)];
  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? normalized.length) : normalized.length;
    const block = normalized.slice(start, end);
    const stateMatch = block.match(/^- \*\*Estado:\*\*\s*(.+)$/m);
    return {
      id: match[1],
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
  const matches = [...normalized.matchAll(/^##\s+(\d+\.\d+)\s+(B\d+)\.(.+)$/gm)];
  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? normalized.length) : normalized.length;
    return {
      sequence: match[1],
      sequenceKey: Number(match[1].replace('.', '')),
      id: match[2],
      block: normalized.slice(start, end),
    };
  });
}

function parseDoneLogIds(content) {
  return parseDoneLogEntries(content).map((entry) => entry.id);
}

function parseCurrentFocusId(content) {
  const normalized = normalizeText(content);
  const focusMatch = normalized.match(/##\s+1\.\s+Foco activo[\s\S]*?`(B\d+)\s+—/i);
  if (focusMatch) {
    return focusMatch[1];
  }

  return normalized.match(/`(B\d+)`/)?.[1];
}

function parseRoadmapFocusId(content) {
  return normalizeText(content).match(/continuidad\s+`?(B\d+)`?/i)?.[1];
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

  const summary = {
    activeBacklogItems: uniqueSorted(activeBacklogIds).length,
    doneLogItems: uniqueSorted(doneLogIds).length,
    specFolders: sources.specs.length,
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

  return {
    backlog: fs.readFileSync(path.join(repoRoot, 'docs', 'backlog.md'), 'utf8'),
    doneLog: fs.readFileSync(path.join(repoRoot, 'docs', 'done-log.md'), 'utf8'),
    currentFocus: fs.readFileSync(path.join(repoRoot, 'docs', 'current-focus.md'), 'utf8'),
    roadmap: fs.readFileSync(path.join(repoRoot, 'docs', 'roadmap.md'), 'utf8'),
    specs,
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